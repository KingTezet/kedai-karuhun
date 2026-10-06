-- Production hardening.
-- Customers must not be able to change their own role or blocked_at through the Data API.
drop policy if exists profiles_self_update on public.profiles;

create or replace function public.set_order_status(p_order_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
declare o public.orders%rowtype; it record;
begin
  if not public.is_staff() then raise exception 'FORBIDDEN'; end if;
  if p_status not in ('new','confirmed','processing','ready','delivering','completed','cancelled') then raise exception 'INVALID_STATUS'; end if;
  select * into o from public.orders where id=p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if o.status='completed' and p_status<>'completed' then raise exception 'COMPLETED_ORDER_LOCKED'; end if;
  if o.status='cancelled' and p_status<>'cancelled' then raise exception 'CANCELLED_ORDER_LOCKED'; end if;

  if p_status='cancelled' and o.status not in ('cancelled','completed','delivering') then
    for it in select product_id, quantity from public.order_items where order_id=o.id loop
      update public.products set stock_quantity=stock_quantity+it.quantity where id=it.product_id;
      insert into public.inventory_movements(product_id,movement_type,quantity,reference_type,reference_id,note,created_by)
      values(it.product_id,'cancel',it.quantity,'order',o.id,'Pengembalian stok karena pesanan dibatalkan',auth.uid());
    end loop;
  end if;

  update public.orders set status=p_status where id=p_order_id;
  if p_status='completed' then
    insert into public.financial_transactions(type,category,amount_idr,description,order_id,created_by)
    select 'income','Penjualan',o.total_idr,'Penjualan pesanan '||o.order_number,o.id,auth.uid()
    where not exists(select 1 from public.financial_transactions f where f.order_id=o.id and f.type='income');
  end if;
end; $$;
