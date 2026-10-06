create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer','staff','manager','admin')),
  blocked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  sku text unique,
  name text not null,
  slug text not null unique,
  description text,
  short_description text,
  price_idr bigint not null check (price_idr >= 0),
  compare_at_price_idr bigint,
  unit text not null default 'pcs',
  stock_quantity numeric(12,2) not null default 0 check (stock_quantity >= 0),
  low_stock_threshold numeric(12,2) not null default 5,
  image_url text,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  delivery_fee_idr bigint not null default 0 check (delivery_fee_idr >= 0),
  min_order_idr bigint not null default 0 check (min_order_idr >= 0),
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'Rumah',
  recipient_name text not null,
  phone text not null,
  address_line text not null,
  notes text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  buyer_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'new' check (status in ('new','confirmed','processing','ready','delivering','completed','cancelled')),
  payment_method text not null check (payment_method in ('qris','transfer','cod')),
  payment_status text not null default 'pending' check (payment_status in ('pending','proof_uploaded','verified','failed','cod')),
  subtotal_idr bigint not null default 0,
  delivery_fee_idr bigint not null default 0,
  total_idr bigint not null default 0,
  address_snapshot jsonb not null default '{}'::jsonb,
  note text,
  payment_proof_path text,
  verified_by uuid references auth.users(id),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  product_name_snapshot text not null,
  unit_snapshot text not null,
  unit_price_idr bigint not null,
  quantity numeric(12,2) not null check (quantity > 0),
  line_total_idr bigint not null,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  movement_type text not null check (movement_type in ('purchase','sale','adjustment','return','waste','cancel')),
  quantity numeric(12,2) not null,
  reference_type text,
  reference_id uuid,
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('income','expense')),
  category text not null,
  amount_idr bigint not null check (amount_idr >= 0),
  description text,
  order_id uuid references public.orders(id) on delete set null,
  occurred_at date not null default current_date,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  audience_role text,
  user_id uuid references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.store_settings (
  id int primary key default 1 check (id = 1),
  store_name text not null default 'Kedai Karuhun',
  logo_url text,
  whatsapp text,
  qris_image_url text,
  bank_name text,
  bank_account_name text,
  bank_account_number text,
  address text,
  open_hours text,
  order_notice text,
  updated_at timestamptz not null default now()
);
insert into public.store_settings(id) values (1) on conflict (id) do nothing;

create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_active on public.products(is_active);
create index if not exists idx_orders_buyer on public.orders(buyer_id, created_at desc);
create index if not exists idx_orders_status on public.orders(status, payment_status);
create index if not exists idx_order_items_order on public.order_items(order_id);
create index if not exists idx_inventory_product on public.inventory_movements(product_id, created_at desc);
create index if not exists idx_finance_date on public.financial_transactions(occurred_at desc);
create index if not exists idx_notifications_user on public.notifications(user_id, read_at, created_at desc);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id,email,full_name) values(new.id,new.email,coalesce(new.raw_user_meta_data->>'full_name',''))
  on conflict (id) do update set email=excluded.email, updated_at=now();
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.update_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end; $$;

do $$ declare t text; begin
  foreach t in array array['profiles','categories','products','delivery_zones','customer_addresses','orders','push_subscriptions','store_settings'] loop
    execute format('drop trigger if exists set_updated_at on public.%I',t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.update_updated_at()',t);
  end loop;
end $$;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.financial_transactions enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notifications enable row level security;
alter table public.store_settings enable row level security;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role in ('staff','manager','admin') and blocked_at is null);
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role in ('manager','admin') and blocked_at is null);
$$;

create policy profiles_self on public.profiles for select to authenticated using (id=auth.uid() or public.is_staff());
create policy profiles_self_update on public.profiles for update to authenticated using (id=auth.uid());
create policy categories_public_read on public.categories for select to anon,authenticated using (is_active or public.is_staff());
create policy products_public_read on public.products for select to anon,authenticated using (is_active or public.is_staff());
create policy zones_public_read on public.delivery_zones for select to authenticated using (is_active or public.is_staff());
create policy address_self_all on public.customer_addresses for all to authenticated using (user_id=auth.uid() or public.is_staff()) with check (user_id=auth.uid() or public.is_staff());
create policy orders_self_read on public.orders for select to authenticated using (buyer_id=auth.uid() or public.is_staff());
create policy order_items_self_read on public.order_items for select to authenticated using (exists(select 1 from public.orders o where o.id=order_items.order_id and (o.buyer_id=auth.uid() or public.is_staff())));
create policy push_self_all on public.push_subscriptions for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy notifications_self_read on public.notifications for select to authenticated using (user_id=auth.uid() or public.is_staff());
create policy notifications_self_update on public.notifications for update to authenticated using (user_id=auth.uid() or public.is_staff());
create policy settings_public_read on public.store_settings for select to anon,authenticated using (true);

create or replace function public.create_order(p_buyer_id uuid, p_items jsonb, p_zone_id uuid, p_payment_method text, p_address jsonb, p_note text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  item jsonb; prod public.products%rowtype; oid uuid; subtotal bigint:=0; fee bigint:=0; total bigint:=0; zone public.delivery_zones%rowtype; q numeric; line bigint; onum text;
begin
  if p_buyer_id <> auth.uid() then raise exception 'UNAUTHORIZED'; end if;
  select * into zone from public.delivery_zones where id=p_zone_id and is_active=true;
  if not found then raise exception 'INVALID_ZONE'; end if;
  if p_payment_method not in ('qris','transfer','cod') then raise exception 'INVALID_PAYMENT'; end if;
  for item in select * from jsonb_array_elements(p_items) loop
    q := (item->>'quantity')::numeric;
    select * into prod from public.products where id=(item->>'product_id')::uuid and is_active=true for update;
    if not found then raise exception 'PRODUCT_NOT_FOUND'; end if;
    if q <= 0 or prod.stock_quantity < q then raise exception 'INSUFFICIENT_STOCK:%', prod.name; end if;
    line := round(prod.price_idr * q);
    subtotal := subtotal + line;
  end loop;
  fee := zone.delivery_fee_idr;
  total := subtotal + fee;
  if total < zone.min_order_idr then raise exception 'MIN_ORDER'; end if;
  onum := 'KK-' || to_char(now(),'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
  insert into public.orders(order_number,buyer_id,status,payment_method,payment_status,subtotal_idr,delivery_fee_idr,total_idr,address_snapshot,note)
  values(onum,p_buyer_id,'new',p_payment_method,case when p_payment_method='cod' then 'cod' else 'pending' end,subtotal,fee,total,p_address,p_note) returning id into oid;
  for item in select * from jsonb_array_elements(p_items) loop
    select * into prod from public.products where id=(item->>'product_id')::uuid for update;
    q := (item->>'quantity')::numeric;
    line := round(prod.price_idr * q);
    insert into public.order_items(order_id,product_id,product_name_snapshot,unit_snapshot,unit_price_idr,quantity,line_total_idr)
    values(oid,prod.id,prod.name,prod.unit,prod.price_idr,q,line);
    update public.products set stock_quantity=stock_quantity-q, updated_at=now() where id=prod.id;
    insert into public.inventory_movements(product_id,movement_type,quantity,reference_type,reference_id,note,created_by)
    values(prod.id,'sale',-q,'order',oid,'Penjualan online',p_buyer_id);
  end loop;
  insert into public.notifications(audience_role,type,title,body,href) values('staff','new_order','Pesanan baru '||onum,'Ada pesanan baru senilai Rp '||total::text,'/admin/orders');
  return oid;
end;
$$;

create or replace function public.set_order_status(p_order_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'FORBIDDEN'; end if;
  update public.orders set status=p_status where id=p_order_id;
  if p_status='completed' then
    insert into public.financial_transactions(type,category,amount_idr,description,order_id,created_by)
    select 'income','Penjualan',o.total_idr,'Penjualan pesanan '||o.order_number,o.id,auth.uid() from public.orders o where o.id=p_order_id and not exists(select 1 from public.financial_transactions f where f.order_id=o.id and f.type='income');
  end if;
end; $$;

insert into storage.buckets(id,name,public) values ('product-images','product-images',true) on conflict (id) do nothing;
insert into storage.buckets(id,name,public) values ('store-assets','store-assets',true) on conflict (id) do nothing;
insert into storage.buckets(id,name,public) values ('payment-proofs','payment-proofs',false) on conflict (id) do nothing;

create policy storage_product_images_read on storage.objects for select to anon,authenticated using (bucket_id='product-images');
create policy storage_product_images_staff_write on storage.objects for insert to authenticated with check (bucket_id='product-images' and public.is_staff());
create policy storage_product_images_staff_update on storage.objects for update to authenticated using (bucket_id='product-images' and public.is_staff());
create policy storage_store_assets_read on storage.objects for select to anon,authenticated using (bucket_id='store-assets');
create policy storage_store_assets_staff_write on storage.objects for insert to authenticated with check (bucket_id='store-assets' and public.is_staff());
