-- Kedai Karuhun v10 - phone number + password WITHOUT Supabase Phone provider / SMS
-- Run after migrations 001-008.
-- The UI uses a phone number as the login identifier. Internally, Supabase
-- Email + Password auth is used with a deterministic, non-delivery email alias.
-- Example: 628123456789@auth.kedaikaruhun.my.id

create table if not exists public.phone_auth_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  phone_e164 text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_phone_auth_accounts_phone on public.phone_auth_accounts(phone_e164);

alter table public.phone_auth_accounts enable row level security;
drop policy if exists phone_auth_accounts_self_read on public.phone_auth_accounts;
create policy phone_auth_accounts_self_read on public.phone_auth_accounts
  for select to authenticated using (user_id = auth.uid());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text;
  v_email text;
begin
  v_phone := nullif(coalesce(new.raw_user_meta_data->>'phone', new.phone), '');
  v_email := case
    when new.email ilike '%@auth.kedaikaruhun.my.id' then null
    else new.email
  end;

  insert into public.profiles(id, email, full_name, phone)
  values (
    new.id,
    v_email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    v_phone
  )
  on conflict (id) do update set
    email = case when excluded.email is not null then excluded.email else public.profiles.email end,
    full_name = case when excluded.full_name <> '' then excluded.full_name else public.profiles.full_name end,
    phone = coalesce(excluded.phone, public.profiles.phone),
    updated_at = now();

  if v_phone ~ '^\+628[0-9]{8,12}$' then
    insert into public.phone_auth_accounts(user_id, phone_e164)
    values (new.id, v_phone)
    on conflict (phone_e164) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Normalize the existing profile display state for internal auth aliases.
update public.profiles p
set email = null, updated_at = now()
from auth.users u
where u.id = p.id
  and u.email ilike '%@auth.kedaikaruhun.my.id';

-- Seed the mapping table for phone-auth accounts created by v8/v9.
insert into public.phone_auth_accounts(user_id, phone_e164)
select u.id, u.phone
from auth.users u
where u.phone ~ '^\+628[0-9]{8,12}$'
on conflict (phone_e164) do nothing;

update public.phone_auth_accounts
set updated_at = now();
