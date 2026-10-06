-- Kedai Karuhun - configurable store theme color
-- Run after migrations 001-004.

alter table public.store_settings
  add column if not exists theme_primary_hex text not null default '#2F7D3A';

update public.store_settings
set theme_primary_hex = '#2F7D3A'
where theme_primary_hex is null
   or theme_primary_hex !~ '^#[0-9A-Fa-f]{6}$';

alter table public.store_settings
  drop constraint if exists store_settings_theme_primary_hex_check;

alter table public.store_settings
  add constraint store_settings_theme_primary_hex_check
  check (theme_primary_hex ~ '^#[0-9A-Fa-f]{6}$');
