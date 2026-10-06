-- Kedai Karuhun v12
-- Harden order completion and make admin push setup more explicit.
-- Run after migrations 001-009.

create or replace function public.admin_set_order_status(
  p_order_id uuid,
  p_status text,
  p_note text default null,
  p_actor_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  o public.orders%rowtype;
  it record;
  current_pos integer;
  target_pos integer;
begin
  perform public._assert_admin_actor(p_actor_id);

  if p_status not in ('new','confirmed','processing','ready','delivering','completed','cancelled') then
    raise exception 'INVALID_TRANSITION';
  end if;

  select * into o
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  -- Idempotent: retrying the same status is safe.
  if o.status = p_status then
    return;
  end if;

  if o.status = 'completed' then raise exception 'COMPLETED_ORDER_LOCKED'; end if;
  if o.status = 'cancelled' then raise exception 'CANCELLED_ORDER_LOCKED'; end if;

  if p_status = 'cancelled' then
    if coalesce(trim(p_note),'') = '' then
      raise exception 'REASON_REQUIRED';
    end if;

    for it in
      select product_id, quantity
      from public.order_items
      where order_id = o.id
    loop
      update public.products
      set stock_quantity = stock_quantity + it.quantity,
          updated_at = now()
      where id = it.product_id;

      insert into public.inventory_movements(
        product_id, movement_type, quantity, reference_type, reference_id, note, created_by
      ) values (
        it.product_id, 'cancel', it.quantity, 'order', o.id,
        'Pengembalian stok: pesanan '||o.order_number||' dibatalkan', p_actor_id
      );
    end loop;

    if exists (
      select 1 from public.financial_transactions
      where order_id = o.id and type = 'income'
    ) and not exists (
      select 1 from public.financial_transactions
      where order_id = o.id and type = 'expense' and category = 'Pengembalian dana'
    ) then
      insert into public.financial_transactions(
        type, category, amount_idr, description, order_id, created_by, occurred_at
      ) values (
        'expense', 'Pengembalian dana', o.total_idr,
        'Pembatalan pesanan '||o.order_number, o.id, p_actor_id,
        (now() at time zone 'Asia/Jakarta')::date
      );
    end if;

    update public.orders
    set status = 'cancelled',
        cancel_reason = trim(p_note),
        updated_at = now()
    where id = o.id;
  else
    current_pos := array_position(array['new','confirmed','processing','ready','delivering','completed']::text[], o.status);
    target_pos := array_position(array['new','confirmed','processing','ready','delivering','completed']::text[], p_status);

    if current_pos is null or target_pos is null or target_pos <= current_pos then
      raise exception 'INVALID_TRANSITION';
    end if;

    if o.payment_method <> 'cod'
       and o.payment_status <> 'verified'
       and p_status in ('processing','ready','delivering','completed') then
      raise exception 'PAYMENT_NOT_VERIFIED';
    end if;

    -- Complete the order first. For COD, payment status is finalized together.
    -- This avoids relying on a second helper function during the final transition.
    update public.orders
    set status = p_status,
        payment_status = case when p_status = 'completed' and o.payment_method = 'cod' then 'cod' else payment_status end,
        updated_at = now()
    where id = o.id;

    if p_status = 'completed' then
      if not exists (
        select 1 from public.financial_transactions
        where order_id = o.id and type = 'income'
      ) then
        insert into public.financial_transactions(
          type, category, amount_idr, description, order_id, created_by, occurred_at
        ) values (
          'income', 'Penjualan', o.total_idr,
          'Penjualan pesanan '||o.order_number,
          o.id, p_actor_id,
          (now() at time zone 'Asia/Jakarta')::date
        );
      end if;
    end if;
  end if;

  insert into public.order_events(order_id, actor_id, type, from_status, to_status, note)
  values(
    o.id,
    p_actor_id,
    'status',
    o.status,
    p_status,
    nullif(trim(coalesce(p_note,'')), '')
  );

  insert into public.notifications(user_id, type, title, body, href)
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

revoke all on function public.admin_set_order_status(uuid,text,text,uuid) from public, anon, authenticated;
grant execute on function public.admin_set_order_status(uuid,text,text,uuid) to service_role;
