-- Kedai Karuhun v14
-- Stock changes from the admin panel go through the service role with an
-- explicit actor, the same pattern v12 uses for order status. The old
-- adjust_stock() depended on auth.uid() from the browser session, which
-- failed with "Stok gagal diperbarui" when the session JWT did not reach
-- Postgres as expected.
-- Run after migrations 001-011.

create or replace function public.admin_adjust_stock(
  p_product_id uuid,
  p_mode text,
  p_amount numeric,
  p_note text default null,
  p_actor_id uuid default null
)
returns numeric
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  p public.products%rowtype;
  delta numeric;
  mtype text;
begin
  perform public._assert_admin_actor(p_actor_id);

  select * into p from public.products where id = p_product_id for update;
  if not found then raise exception 'PRODUCT_NOT_FOUND'; end if;
  if p_amount is null or p_amount < 0 then raise exception 'NEGATIVE_STOCK'; end if;

  if p_mode = 'in' then
    if p_amount = 0 then raise exception 'NEGATIVE_STOCK'; end if;
    delta := p_amount; mtype := 'purchase';
  elsif p_mode = 'waste' then
    if coalesce(trim(p_note), '') = '' then raise exception 'REASON_REQUIRED'; end if;
    delta := -p_amount; mtype := 'waste';
  elsif p_mode = 'adjust' then
    if coalesce(trim(p_note), '') = '' then raise exception 'REASON_REQUIRED'; end if;
    delta := p_amount - p.stock_quantity; mtype := 'adjustment';
  else
    raise exception 'INVALID_TRANSITION';
  end if;

  if p.stock_quantity + delta < 0 then raise exception 'NEGATIVE_STOCK'; end if;
  if delta = 0 then return p.stock_quantity; end if;

  update public.products
  set stock_quantity = stock_quantity + delta, updated_at = now()
  where id = p.id;

  insert into public.inventory_movements(product_id, movement_type, quantity, reference_type, note, created_by)
  values (p.id, mtype, delta, 'manual', nullif(trim(coalesce(p_note, '')), ''), p_actor_id);

  perform public._notify_low_stock(p.id);
  return p.stock_quantity + delta;
end;
$$;

revoke all on function public.admin_adjust_stock(uuid, text, numeric, text, uuid) from public, anon, authenticated;
grant execute on function public.admin_adjust_stock(uuid, text, numeric, text, uuid) to service_role;
