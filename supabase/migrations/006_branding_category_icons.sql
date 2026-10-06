-- Kedai Karuhun v5: brand icon/favicon + custom category icons
-- Run after migrations 001-005.

alter table public.store_settings
  add column if not exists favicon_url text;

alter table public.categories
  add column if not exists icon_name text;

-- Keep existing categories working: null icon_name means automatic icon fallback.
create index if not exists categories_sort_active_idx on public.categories(is_active, sort_order, name);
