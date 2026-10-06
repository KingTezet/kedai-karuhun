-- Kedai Karuhun - reliability/auth/admin UX support
-- Jalankan setelah migration terakhir yang sudah ada.

alter table public.store_settings add column if not exists logo_contains_store_name boolean not null default false;

-- Pastikan tabel event dan kolom pembayaran tersedia jika migration sebelumnya belum lengkap.
create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  actor_id uuid references auth.users(id),
  type text not null,
  from_status text,
  to_status text,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists idx_order_events_order on public.order_events(order_id, created_at);
alter table public.order_events enable row level security;
drop policy if exists order_events_read on public.order_events;
create policy order_events_read on public.order_events for select to authenticated
  using (public.is_staff() or exists(select 1 from public.orders o where o.id = order_events.order_id and o.buyer_id = auth.uid()));

alter table public.orders add column if not exists payment_note text;
alter table public.orders add column if not exists cancel_reason text;
alter table public.orders add column if not exists verified_by uuid references auth.users(id);
alter table public.orders add column if not exists verified_at timestamptz;

create or replace function public._assert_admin_actor(p_actor_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.profiles
    where id = p_actor_id
      and role in ('staff','manager','admin')
      and blocked_at is null
  ) then
    raise exception 'FORBIDDEN';
  end if;
end $$;

-- Atomik: verifikasi/penolakan pembayaran + income + event + notifikasi.
create or replace function public.admin_set_payment_status(
  p_order_id uuid,
  p_status text,
  p_note text default null,
  p_actor_id uuid default null
)
returns void language plpgsql security definer set search_path = public as $$
declare
  o public.orders%rowtype;
begin
  perform public._assert_admin_actor(p_actor_id);
  if p_status not in ('verified','failed') then raise exception 'INVALID_TRANSITION'; end if;

  select * into o from public.orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if o.payment_method = 'cod' or o.status = 'cancelled' then raise exception 'INVALID_TRANSITION'; end if;
  if p_status = o.payment_status then return; end if;
  if p_status = 'failed' and coalesce(trim(p_note),'') = '' then raise exception 'REASON_REQUIRED'; end if;

  update public.orders
  set payment_status = p_status,
      payment_note = nullif(trim(coalesce(p_note,'')),''),
      verified_by = case when p_status = 'verified' then p_actor_id else null end,
      verified_at = case when p_status = 'verified' then now() else null end,
      updated_at = now()
  where id = o.id;

  if p_status = 'verified' then
    perform public._post_income(o.id, p_actor_id);
    if o.status = 'new' then
      update public.orders set status = 'confirmed', updated_at = now() where id = o.id;
      insert into public.order_events(order_id,actor_id,type,from_status,to_status,note)
      values(o.id,p_actor_id,'status','new','confirmed','Otomatis setelah pembayaran diverifikasi');
    end if;
  end if;

  insert into public.order_events(order_id,actor_id,type,note)
  values(o.id,p_actor_id,'payment_'||p_status,nullif(trim(coalesce(p_note,'')),''));

  insert into public.notifications(user_id,type,title,body,href)
  values(
    o.buyer_id,
    'payment_update',
    case when p_status='verified' then 'Pembayaran diterima' else 'Bukti pembayaran ditolak' end,
    case when p_status='verified'
      then 'Pembayaran pesanan '||o.order_number||' sudah kami terima.'
      else 'Bukti pembayaran pesanan '||o.order_number||' ditolak: '||trim(p_note)||'. Silakan unggah ulang.' end,
    '/orders/'||o.id
  );
end $$;

-- Atomik: perubahan status order + pengembalian stok saat batal + event + notifikasi.
create or replace function public.admin_set_order_status(
  p_order_id uuid,
  p_status text,
  p_note text default null,
  p_actor_id uuid default null
)
returns void language plpgsql security definer set search_path = public as $$
declare
  o public.orders%rowtype;
  it record;
  flow text[] := array['new','confirmed','processing','ready','delivering','completed'];
begin
  perform public._assert_admin_actor(p_actor_id);
  if p_status not in ('new','confirmed','processing','ready','delivering','completed','cancelled') then raise exception 'INVALID_TRANSITION'; end if;

  select * into o from public.orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if o.status = 'completed' or o.status = 'cancelled' then raise exception 'COMPLETED_ORDER_LOCKED'; end if;
  if p_status = o.status then return; end if;

  if p_status = 'cancelled' then
    if coalesce(trim(p_note),'') = '' then raise exception 'REASON_REQUIRED'; end if;

    for it in select product_id, quantity from public.order_items where order_id = o.id loop
      update public.products set stock_quantity = stock_quantity + it.quantity, updated_at = now() where id = it.product_id;
      insert into public.inventory_movements(product_id,movement_type,quantity,reference_type,reference_id,note,created_by)
      values(it.product_id,'cancel',it.quantity,'order',o.id,'Pengembalian stok: pesanan '||o.order_number||' dibatalkan',p_actor_id);
    end loop;

    if exists(select 1 from public.financial_transactions where order_id = o.id and type='income')
       and not exists(select 1 from public.financial_transactions where order_id = o.id and type='expense' and category='Pengembalian dana') then
      insert into public.financial_transactions(type,category,amount_idr,description,order_id,created_by,occurred_at)
      values('expense','Pengembalian dana',o.total_idr,'Pembatalan pesanan '||o.order_number,o.id,p_actor_id,(now() at time zone 'Asia/Jakarta')::date);
    end if;

    update public.orders set status='cancelled', cancel_reason=trim(p_note), updated_at=now() where id=o.id;
  else
    if array_position(flow, p_status) <= array_position(flow, o.status) then raise exception 'INVALID_TRANSITION'; end if;
    if o.payment_method <> 'cod' and o.payment_status <> 'verified' and p_status in ('processing','ready','delivering','completed') then
      raise exception 'PAYMENT_NOT_VERIFIED';
    end if;

    update public.orders set status=p_status, updated_at=now() where id=o.id;
    if p_status='completed' and o.payment_method='cod' then
      perform public._post_income(o.id, p_actor_id);
      update public.orders set payment_status='cod' where id=o.id;
    end if;
  end if;

  insert into public.order_events(order_id,actor_id,type,from_status,to_status,note)
  values(o.id,p_actor_id,'status',o.status,p_status,nullif(trim(coalesce(p_note,'')),''));

  insert into public.notifications(user_id,type,title,body,href)
  values(
    o.buyer_id,
    'order_update',
    'Pesanan '||o.order_number||' diperbarui',
    case p_status
      when 'confirmed' then 'Pesananmu sudah dikonfirmasi toko.'
      when 'processing' then 'Pesananmu sedang disiapkan.'
      when 'ready' then 'Pesananmu siap diantar.'
      when 'delivering' then 'Pesananmu sedang diantar.'
      when 'completed' then 'Pesanan selesai. Terima kasih!'
      when 'cancelled' then 'Pesanan dibatalkan: '||trim(p_note)
      else 'Status pesanan diperbarui.'
    end,
    '/orders/'||o.id
  );
end $$;

revoke all on function public.admin_set_payment_status(uuid,text,text,uuid) from public, anon, authenticated;
revoke all on function public.admin_set_order_status(uuid,text,text,uuid) from public, anon, authenticated;
revoke all on function public._assert_admin_actor(uuid) from public, anon, authenticated;
grant execute on function public.admin_set_payment_status(uuid,text,text,uuid) to service_role;
grant execute on function public.admin_set_order_status(uuid,text,text,uuid) to service_role;
