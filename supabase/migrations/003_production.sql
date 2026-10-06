-- 003_production.sql
-- Jalankan SETELAH 001_initial.sql dan 002_hardening.sql. Aman dijalankan ulang.

-- ───────────────────────── Kolom & tabel tambahan ─────────────────────────
alter table public.customer_addresses add column if not exists zone_id uuid references public.delivery_zones(id) on delete set null;
alter table public.orders add column if not exists payment_note text;
alter table public.orders add column if not exists cancel_reason text;

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
alter table public.order_events enable row level security;
drop policy if exists order_events_read on public.order_events;
create policy order_events_read on public.order_events for select to authenticated
  using (public.is_staff() or exists(select 1 from public.orders o where o.id = order_events.order_id and o.buyer_id = auth.uid()));

-- ───────────────────────── Index ─────────────────────────
create index if not exists idx_orders_created on public.orders(created_at desc);
create index if not exists idx_orders_payment on public.orders(payment_status);
create index if not exists idx_products_featured on public.products(is_featured) where is_active;
create index if not exists idx_products_name on public.products(name);
create index if not exists idx_fin_order on public.financial_transactions(order_id);
create index if not exists idx_order_events_order on public.order_events(order_id, created_at);
create index if not exists idx_notifications_audience on public.notifications(audience_role, read_at, created_at desc);
create index if not exists idx_addresses_user on public.customer_addresses(user_id);

-- ───────────────────────── RLS notifikasi: staff hanya lihat notifikasi staff ─────────────────────────
drop policy if exists notifications_self_read on public.notifications;
drop policy if exists notifications_self_update on public.notifications;
create policy notifications_self_read on public.notifications for select to authenticated
  using (user_id = auth.uid() or (audience_role = 'staff' and public.is_staff()));
create policy notifications_self_update on public.notifications for update to authenticated
  using (user_id = auth.uid() or (audience_role = 'staff' and public.is_staff()));

-- ───────────────────────── Helper internal ─────────────────────────
create or replace function public._notify_low_stock(p_product uuid)
returns void language plpgsql security definer set search_path = public as $$
declare p public.products%rowtype;
begin
  select * into p from public.products where id = p_product;
  if not found then return; end if;
  if p.stock_quantity <= p.low_stock_threshold then
    if not exists(select 1 from public.notifications where type='low_stock' and href='/admin/inventory?focus='||p.id and read_at is null) then
      insert into public.notifications(audience_role,type,title,body,href)
      values('staff','low_stock','Stok menipis: '||p.name,'Sisa '||trim(to_char(p.stock_quantity,'FM999999990.##'))||' '||p.unit||'. Segera restok.','/admin/inventory?focus='||p.id);
    end if;
  end if;
end $$;

create or replace function public._post_income(p_order uuid, p_actor uuid)
returns void language plpgsql security definer set search_path = public as $$
declare o public.orders%rowtype;
begin
  select * into o from public.orders where id = p_order;
  if not found then return; end if;
  if not exists(select 1 from public.financial_transactions f where f.order_id = o.id and f.type='income') then
    insert into public.financial_transactions(type,category,amount_idr,description,order_id,created_by,occurred_at)
    values('income','Penjualan',o.total_idr,'Penjualan pesanan '||o.order_number,o.id,p_actor,(now() at time zone 'Asia/Jakarta')::date);
  end if;
end $$;

-- ───────────────────────── create_order (atomik, anti oversell) ─────────────────────────
create or replace function public.create_order(p_buyer_id uuid, p_items jsonb, p_zone_id uuid, p_payment_method text, p_address jsonb, p_note text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  rec record; prod public.products%rowtype; zone public.delivery_zones%rowtype;
  oid uuid; subtotal bigint := 0; fee bigint := 0; total bigint := 0; line bigint; onum text; snapshot jsonb;
begin
  if p_buyer_id is distinct from auth.uid() then raise exception 'UNAUTHORIZED'; end if;
  if exists(select 1 from public.profiles where id = p_buyer_id and blocked_at is not null) then raise exception 'BLOCKED'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'EMPTY_ORDER'; end if;
  if p_payment_method not in ('qris','transfer','cod') then raise exception 'INVALID_PAYMENT'; end if;

  select * into zone from public.delivery_zones where id = p_zone_id and is_active = true;
  if not found then raise exception 'INVALID_ZONE'; end if;

  -- gabungkan produk kembar & kunci baris berurutan (hindari deadlock)
  for rec in
    select (e->>'product_id')::uuid as pid, sum((e->>'quantity')::numeric) as q
    from jsonb_array_elements(p_items) e group by 1 order by 1
  loop
    if rec.q <= 0 then raise exception 'EMPTY_ORDER'; end if;
    select * into prod from public.products where id = rec.pid and is_active = true for update;
    if not found then raise exception 'PRODUCT_NOT_FOUND'; end if;
    if prod.stock_quantity < rec.q then raise exception 'INSUFFICIENT_STOCK:%', prod.name; end if;
    subtotal := subtotal + round(prod.price_idr * rec.q);
  end loop;

  if subtotal < zone.min_order_idr then raise exception 'MIN_ORDER:%', zone.min_order_idr; end if;
  fee := zone.delivery_fee_idr;
  total := subtotal + fee;
  snapshot := coalesce(p_address,'{}'::jsonb) || jsonb_build_object('zone_name', zone.name, 'zone_id', zone.id);
  onum := 'KK-' || to_char(now() at time zone 'Asia/Jakarta','YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,5));

  insert into public.orders(order_number,buyer_id,status,payment_method,payment_status,subtotal_idr,delivery_fee_idr,total_idr,address_snapshot,note)
  values(onum,p_buyer_id,'new',p_payment_method,case when p_payment_method='cod' then 'cod' else 'pending' end,subtotal,fee,total,snapshot,nullif(trim(coalesce(p_note,'')),''))
  returning id into oid;

  for rec in
    select (e->>'product_id')::uuid as pid, sum((e->>'quantity')::numeric) as q
    from jsonb_array_elements(p_items) e group by 1 order by 1
  loop
    select * into prod from public.products where id = rec.pid;
    line := round(prod.price_idr * rec.q);
    insert into public.order_items(order_id,product_id,product_name_snapshot,unit_snapshot,unit_price_idr,quantity,line_total_idr)
    values(oid,prod.id,prod.name,prod.unit,prod.price_idr,rec.q,line);
    update public.products set stock_quantity = stock_quantity - rec.q, updated_at = now() where id = prod.id;
    insert into public.inventory_movements(product_id,movement_type,quantity,reference_type,reference_id,note,created_by)
    values(prod.id,'sale',-rec.q,'order',oid,'Penjualan online '||onum,p_buyer_id);
    perform public._notify_low_stock(prod.id);
  end loop;

  insert into public.order_events(order_id,actor_id,type,to_status,note) values(oid,p_buyer_id,'created','new','Pesanan dibuat pelanggan');
  insert into public.notifications(audience_role,type,title,body,href)
  values('staff','new_order','Pesanan baru '||onum,
    'Rp '||replace(to_char(total,'FM999,999,999,999'),',','.')||' · '||upper(p_payment_method)||' · '||coalesce(snapshot->>'recipient_name','Pelanggan'),
    '/admin/orders/'||oid);
  return oid;
end $$;

-- ───────────────────────── set_order_status ─────────────────────────
drop function if exists public.set_order_status(uuid, text);
create or replace function public.set_order_status(p_order_id uuid, p_status text, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  o public.orders%rowtype; it record;
  flow text[] := array['new','confirmed','processing','ready','delivering','completed'];
begin
  if not public.is_staff() then raise exception 'FORBIDDEN'; end if;
  if p_status not in ('new','confirmed','processing','ready','delivering','completed','cancelled') then raise exception 'INVALID_TRANSITION'; end if;
  select * into o from public.orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if o.status = 'completed' then raise exception 'COMPLETED_ORDER_LOCKED'; end if;
  if o.status = 'cancelled' then raise exception 'CANCELLED_ORDER_LOCKED'; end if;
  if p_status = o.status then return; end if;

  if p_status = 'cancelled' then
    if coalesce(trim(p_note),'') = '' then raise exception 'REASON_REQUIRED'; end if;
    for it in select product_id, quantity from public.order_items where order_id = o.id loop
      update public.products set stock_quantity = stock_quantity + it.quantity, updated_at = now() where id = it.product_id;
      insert into public.inventory_movements(product_id,movement_type,quantity,reference_type,reference_id,note,created_by)
      values(it.product_id,'cancel',it.quantity,'order',o.id,'Pengembalian stok: pesanan '||o.order_number||' dibatalkan',auth.uid());
    end loop;
    -- uang yang sudah tercatat masuk dikembalikan di pembukuan
    if exists(select 1 from public.financial_transactions where order_id = o.id and type='income')
       and not exists(select 1 from public.financial_transactions where order_id = o.id and type='expense' and category='Pengembalian dana') then
      insert into public.financial_transactions(type,category,amount_idr,description,order_id,created_by,occurred_at)
      values('expense','Pengembalian dana',o.total_idr,'Pembatalan pesanan '||o.order_number,o.id,auth.uid(),(now() at time zone 'Asia/Jakarta')::date);
    end if;
    update public.orders set status='cancelled', cancel_reason=trim(p_note), updated_at=now() where id = o.id;
  else
    if array_position(flow, p_status) <= array_position(flow, o.status) then raise exception 'INVALID_TRANSITION'; end if;
    if o.payment_method <> 'cod' and o.payment_status <> 'verified' and p_status in ('processing','ready','delivering','completed') then
      raise exception 'PAYMENT_NOT_VERIFIED';
    end if;
    update public.orders set status = p_status, updated_at = now() where id = o.id;
    if p_status = 'completed' and o.payment_method = 'cod' then perform public._post_income(o.id, auth.uid()); end if;
  end if;

  insert into public.order_events(order_id,actor_id,type,from_status,to_status,note) values(o.id,auth.uid(),'status',o.status,p_status,nullif(trim(coalesce(p_note,'')),''));
  insert into public.notifications(user_id,type,title,body,href)
  values(o.buyer_id,'order_update','Pesanan '||o.order_number||' diperbarui',
    case p_status when 'confirmed' then 'Pesananmu sudah dikonfirmasi toko.' when 'processing' then 'Pesananmu sedang disiapkan.'
      when 'ready' then 'Pesananmu siap diantar.' when 'delivering' then 'Pesananmu sedang diantar.'
      when 'completed' then 'Pesanan selesai. Terima kasih!' when 'cancelled' then 'Pesanan dibatalkan: '||trim(p_note) else 'Status diperbarui.' end,
    '/orders/'||o.id);
end $$;

-- ───────────────────────── set_payment_status ─────────────────────────
create or replace function public.set_payment_status(p_order_id uuid, p_status text, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare o public.orders%rowtype;
begin
  if not public.is_staff() then raise exception 'FORBIDDEN'; end if;
  if p_status not in ('verified','failed') then raise exception 'INVALID_TRANSITION'; end if;
  select * into o from public.orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if o.payment_method = 'cod' or o.status = 'cancelled' then raise exception 'INVALID_TRANSITION'; end if;
  if p_status = 'failed' and coalesce(trim(p_note),'') = '' then raise exception 'REASON_REQUIRED'; end if;

  update public.orders set payment_status = p_status, payment_note = nullif(trim(coalesce(p_note,'')),''),
    verified_by = case when p_status='verified' then auth.uid() else null end,
    verified_at = case when p_status='verified' then now() else null end, updated_at = now()
  where id = o.id;

  if p_status = 'verified' then
    perform public._post_income(o.id, auth.uid());
    if o.status = 'new' then
      update public.orders set status = 'confirmed' where id = o.id;
      insert into public.order_events(order_id,actor_id,type,from_status,to_status,note) values(o.id,auth.uid(),'status','new','confirmed','Otomatis setelah pembayaran terverifikasi');
    end if;
  end if;
  insert into public.order_events(order_id,actor_id,type,note) values(o.id,auth.uid(),'payment_'||p_status,nullif(trim(coalesce(p_note,'')),''));
  insert into public.notifications(user_id,type,title,body,href)
  values(o.buyer_id,'payment_update',
    case p_status when 'verified' then 'Pembayaran diterima' else 'Pembayaran perlu dicek ulang' end,
    case p_status when 'verified' then 'Terima kasih! Pembayaran pesanan '||o.order_number||' sudah kami terima.'
      else 'Bukti pembayaran '||o.order_number||' ditolak: '||trim(p_note)||'. Silakan unggah ulang.' end,
    '/orders/'||o.id);
end $$;

-- ───────────────────────── adjust_stock ─────────────────────────
create or replace function public.adjust_stock(p_product_id uuid, p_mode text, p_amount numeric, p_note text default null)
returns numeric language plpgsql security definer set search_path = public as $$
declare p public.products%rowtype; delta numeric; mtype text;
begin
  if not public.is_staff() then raise exception 'FORBIDDEN'; end if;
  select * into p from public.products where id = p_product_id for update;
  if not found then raise exception 'PRODUCT_NOT_FOUND'; end if;
  if p_amount is null or p_amount < 0 then raise exception 'NEGATIVE_STOCK'; end if;

  if p_mode = 'in' then
    if p_amount = 0 then raise exception 'NEGATIVE_STOCK'; end if;
    delta := p_amount; mtype := 'purchase';
  elsif p_mode = 'waste' then
    if coalesce(trim(p_note),'') = '' then raise exception 'REASON_REQUIRED'; end if;
    delta := -p_amount; mtype := 'waste';
  elsif p_mode = 'adjust' then
    if coalesce(trim(p_note),'') = '' then raise exception 'REASON_REQUIRED'; end if;
    delta := p_amount - p.stock_quantity; mtype := 'adjustment';
  else
    raise exception 'INVALID_TRANSITION';
  end if;

  if p.stock_quantity + delta < 0 then raise exception 'NEGATIVE_STOCK'; end if;
  if delta = 0 then return p.stock_quantity; end if;

  update public.products set stock_quantity = stock_quantity + delta, updated_at = now() where id = p.id;
  insert into public.inventory_movements(product_id,movement_type,quantity,reference_type,note,created_by)
  values(p.id,mtype,delta,'manual',nullif(trim(coalesce(p_note,'')),''),auth.uid());
  perform public._notify_low_stock(p.id);
  return p.stock_quantity + delta;
end $$;

-- ───────────────────────── Hak eksekusi: hanya user login ─────────────────────────
revoke all on function public.create_order(uuid,jsonb,uuid,text,jsonb,text) from public, anon;
revoke all on function public.set_order_status(uuid,text,text) from public, anon;
revoke all on function public.set_payment_status(uuid,text,text) from public, anon;
revoke all on function public.adjust_stock(uuid,text,numeric,text) from public, anon;
revoke all on function public._notify_low_stock(uuid) from public, anon, authenticated;
revoke all on function public._post_income(uuid,uuid) from public, anon, authenticated;
grant execute on function public.create_order(uuid,jsonb,uuid,text,jsonb,text) to authenticated;
grant execute on function public.set_order_status(uuid,text,text) to authenticated;
grant execute on function public.set_payment_status(uuid,text,text) to authenticated;
grant execute on function public.adjust_stock(uuid,text,numeric,text) to authenticated;

-- ───────────────────────── Storage: bukti bayar tetap private (tanpa policy publik) ─────────────────────────
-- Upload/baca bukti bayar hanya lewat server (service role) setelah cek kepemilikan order.
update storage.buckets set public = false where id = 'payment-proofs';
update storage.buckets set file_size_limit = 5242880, allowed_mime_types = array['image/jpeg','image/png','image/webp','application/pdf'] where id = 'payment-proofs';
update storage.buckets set file_size_limit = 5242880, allowed_mime_types = array['image/jpeg','image/png','image/webp'] where id in ('product-images','store-assets');

-- ───────────────────────── Jadikan akun kamu admin (ganti email) ─────────────────────────
-- update public.profiles set role = 'admin' where email = 'emailkamu@example.com';
