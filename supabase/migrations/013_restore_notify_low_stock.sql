-- Kedai Karuhun v14.1
-- Production DB was missing public._notify_low_stock(uuid) (defined in 003),
-- so every stock change failed with:
--   42883: function public._notify_low_stock(uuid) does not exist
-- Recreate it. Safe to run more than once.

create or replace function public._notify_low_stock(p_product uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare p public.products%rowtype;
begin
  select * into p from public.products where id = p_product;
  if not found then return; end if;
  if p.stock_quantity <= p.low_stock_threshold then
    if not exists (
      select 1 from public.notifications
      where type = 'low_stock' and href = '/admin/inventory?focus=' || p.id and read_at is null
    ) then
      insert into public.notifications(audience_role, type, title, body, href)
      values (
        'staff',
        'low_stock',
        'Stok menipis: ' || p.name,
        'Sisa ' || trim(to_char(p.stock_quantity, 'FM999999990.##')) || ' ' || p.unit || '. Segera restok.',
        '/admin/inventory?focus=' || p.id
      );
    end if;
  end if;
end;
$$;

revoke all on function public._notify_low_stock(uuid) from public, anon, authenticated;
