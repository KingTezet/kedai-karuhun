-- Kedai Karuhun v14.2
-- Production DB was missing public._post_income(uuid,uuid) (defined in 003).
-- admin_set_payment_status() calls it when a transfer payment is verified,
-- so verifying payments failed with 42883. Recreate it. Safe to re-run.

create or replace function public._post_income(p_order uuid, p_actor uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare o public.orders%rowtype;
begin
  select * into o from public.orders where id = p_order;
  if not found then return; end if;
  if not exists (
    select 1 from public.financial_transactions f
    where f.order_id = o.id and f.type = 'income'
  ) then
    insert into public.financial_transactions(type, category, amount_idr, description, order_id, created_by, occurred_at)
    values ('income', 'Penjualan', o.total_idr, 'Penjualan pesanan ' || o.order_number, o.id, p_actor, (now() at time zone 'Asia/Jakarta')::date);
  end if;
end;
$$;

revoke all on function public._post_income(uuid, uuid) from public, anon, authenticated;
