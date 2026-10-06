-- Kedai Karuhun v8 - phone + password authentication
-- Run after migrations 001-007.
-- UI uses phone + password. No email is required for new customer accounts.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(id, email, full_name, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    nullif(coalesce(new.raw_user_meta_data->>'phone', new.phone), '')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = case when excluded.full_name <> '' then excluded.full_name else public.profiles.full_name end,
    phone = coalesce(excluded.phone, public.profiles.phone),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Sync phone numbers for accounts that already have them in Supabase Auth.
update public.profiles p
set phone = nullif(u.phone, ''), updated_at = now()
from auth.users u
where u.id = p.id
  and u.phone is not null
  and u.phone <> ''
  and (p.phone is null or p.phone = '');
