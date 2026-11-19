-- Kedai Karuhun - DB health check (read-only).
-- Paste in Supabase SQL Editor and Run. Every row should say ok = true.
-- A false row names the object and the migration that creates it.

with checks(kind, name, migration, ok) as (
  values
  -- functions
  ('function', 'is_staff()',                                   '001', to_regprocedure('public.is_staff()') is not null),
  ('function', 'is_admin()',                                   '001', to_regprocedure('public.is_admin()') is not null),
  ('function', 'create_order(uuid,jsonb,uuid,text,jsonb,text)', '015', to_regprocedure('public.create_order(uuid,jsonb,uuid,text,jsonb,text)') is not null),
  ('function', '_notify_low_stock(uuid)',                      '015', to_regprocedure('public._notify_low_stock(uuid)') is not null),
  ('function', '_post_income(uuid,uuid)',                      '015', to_regprocedure('public._post_income(uuid,uuid)') is not null),
  ('function', 'adjust_stock(uuid,text,numeric,text)',         '015', to_regprocedure('public.adjust_stock(uuid,text,numeric,text)') is not null),
  ('function', '_assert_admin_actor(uuid)',                    '004', to_regprocedure('public._assert_admin_actor(uuid)') is not null),
  ('function', 'admin_set_payment_status(uuid,text,text,uuid)','004', to_regprocedure('public.admin_set_payment_status(uuid,text,text,uuid)') is not null),
  ('function', 'admin_set_order_status(uuid,text,text,uuid)',  '010', to_regprocedure('public.admin_set_order_status(uuid,text,text,uuid)') is not null),
  ('function', 'handle_new_user()',                            '011', to_regprocedure('public.handle_new_user()') is not null),
  ('function', 'normalize_id_phone(text)',                     '011', to_regprocedure('public.normalize_id_phone(text)') is not null),
  ('function', 'phone_is_registered(text,uuid)',               '011', to_regprocedure('public.phone_is_registered(text,uuid)') is not null),
  ('function', 'admin_adjust_stock(uuid,text,numeric,text,uuid)','012', to_regprocedure('public.admin_adjust_stock(uuid,text,numeric,text,uuid)') is not null),
  -- create_order must be the 003 version (calls _notify_low_stock, logs order_events)
  ('function body', 'create_order is v003+',                   '015', coalesce((select prosrc like '%order_events%' from pg_proc where oid = to_regprocedure('public.create_order(uuid,jsonb,uuid,text,jsonb,text)')), false)),
  -- tables
  ('table', 'order_events',            '003/004', to_regclass('public.order_events') is not null),
  ('table', 'notification_broadcasts', '007',     to_regclass('public.notification_broadcasts') is not null),
  ('table', 'phone_auth_accounts',     '009',     to_regclass('public.phone_auth_accounts') is not null),
  ('table', 'push_subscriptions',      '001',     to_regclass('public.push_subscriptions') is not null),
  -- columns
  ('column', 'customer_addresses.zone_id',              '015', exists(select 1 from information_schema.columns where table_schema='public' and table_name='customer_addresses' and column_name='zone_id')),
  ('column', 'orders.payment_note',                     '004', exists(select 1 from information_schema.columns where table_schema='public' and table_name='orders' and column_name='payment_note')),
  ('column', 'orders.cancel_reason',                    '004', exists(select 1 from information_schema.columns where table_schema='public' and table_name='orders' and column_name='cancel_reason')),
  ('column', 'orders.verified_by',                      '004', exists(select 1 from information_schema.columns where table_schema='public' and table_name='orders' and column_name='verified_by')),
  ('column', 'orders.verified_at',                      '004', exists(select 1 from information_schema.columns where table_schema='public' and table_name='orders' and column_name='verified_at')),
  ('column', 'store_settings.logo_contains_store_name', '004', exists(select 1 from information_schema.columns where table_schema='public' and table_name='store_settings' and column_name='logo_contains_store_name')),
  ('column', 'store_settings.theme_primary_hex',        '005', exists(select 1 from information_schema.columns where table_schema='public' and table_name='store_settings' and column_name='theme_primary_hex')),
  ('column', 'store_settings.favicon_url',              '006', exists(select 1 from information_schema.columns where table_schema='public' and table_name='store_settings' and column_name='favicon_url')),
  ('column', 'categories.icon_name',                    '006', exists(select 1 from information_schema.columns where table_schema='public' and table_name='categories' and column_name='icon_name')),
  ('column', 'notifications.broadcast_id',              '007', exists(select 1 from information_schema.columns where table_schema='public' and table_name='notifications' and column_name='broadcast_id')),
  -- trigger + policies
  ('trigger', 'on_auth_user_created',        '009', exists(select 1 from pg_trigger where tgname='on_auth_user_created' and tgrelid='auth.users'::regclass)),
  ('policy',  'notifications_self_read',     '015', exists(select 1 from pg_policies where schemaname='public' and tablename='notifications' and policyname='notifications_self_read')),
  ('policy',  'order_events_read',           '004', exists(select 1 from pg_policies where schemaname='public' and tablename='order_events' and policyname='order_events_read')),
  -- storage
  ('bucket', 'product-images', '001', exists(select 1 from storage.buckets where id='product-images')),
  ('bucket', 'store-assets',   '001', exists(select 1 from storage.buckets where id='store-assets')),
  ('bucket', 'payment-proofs (private)', '001/015', exists(select 1 from storage.buckets where id='payment-proofs' and public = false))
)
select kind, name, migration, ok from checks order by ok, kind, name;
