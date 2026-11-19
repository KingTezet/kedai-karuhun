-- Kedai Karuhun v13
-- Block registering a phone number that already belongs to another account,
-- including legacy email-based accounts whose number only lives in profiles.phone
-- (stored in mixed formats: 0812..., +62812..., 62812...).
-- Run after migrations 001-010.

-- Any Indonesian mobile format -> '+628...' (null when not a valid mobile number).
create or replace function public.normalize_id_phone(p_phone text)
returns text
language plpgsql
immutable
as $$
declare
  d text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
begin
  if d like '62%' then d := substr(d, 3);
  elsif d like '0%' then d := substr(d, 2);
  end if;
  if d ~ '^8[0-9]{8,12}$' then
    return '+62' || d;
  end if;
  return null;
end;
$$;

create index if not exists idx_profiles_phone_normalized
  on public.profiles (public.normalize_id_phone(phone));

-- True when the number is already used by any account other than p_exclude.
create or replace function public.phone_is_registered(p_phone text, p_exclude uuid default null)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with n as (select public.normalize_id_phone(p_phone) as phone)
  select exists (
    select 1 from n
    where n.phone is not null and (
      exists (
        select 1 from public.profiles p
        where public.normalize_id_phone(p.phone) = n.phone
          and (p_exclude is null or p.id <> p_exclude)
      )
      or exists (
        select 1 from public.phone_auth_accounts a
        where a.phone_e164 = n.phone
          and (p_exclude is null or a.user_id <> p_exclude)
      )
    )
  );
$$;

revoke all on function public.phone_is_registered(text, uuid) from public;
grant execute on function public.phone_is_registered(text, uuid) to anon, authenticated, service_role;

-- Same as 009, plus a hard stop when the phone is already taken.
-- Raising here rolls back the auth.users insert, so signUp fails.
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

  if v_phone is not null and public.phone_is_registered(v_phone, new.id) then
    raise exception 'PHONE_ALREADY_REGISTERED' using errcode = 'unique_violation';
  end if;

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

-- Duplicates already in the database are NOT removed here. List them with:
-- select public.normalize_id_phone(phone) as phone, array_agg(full_name || ' / ' || role || ' / ' || id)
-- from public.profiles
-- where public.normalize_id_phone(phone) is not null
-- group by 1 having count(*) > 1;
