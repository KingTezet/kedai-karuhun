-- Kedai Karuhun v7 - customer/admin Web Push + broadcast history
-- Run after migrations 001-006.

create table if not exists public.notification_broadcasts (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  type text not null default 'announcement' check (type in ('announcement','new_product','promotion','stock','other')),
  title text not null,
  body text not null,
  href text,
  target text not null default 'all_customers' check (target in ('all_customers')),
  recipient_count integer not null default 0,
  push_sent_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.notifications
  add column if not exists broadcast_id uuid references public.notification_broadcasts(id) on delete set null;

create index if not exists idx_push_subscriptions_user on public.push_subscriptions(user_id);
create index if not exists idx_notifications_broadcast on public.notifications(broadcast_id, created_at desc);
create index if not exists idx_notification_broadcasts_created on public.notification_broadcasts(created_at desc);

alter table public.notification_broadcasts enable row level security;
drop policy if exists notification_broadcasts_admin_read on public.notification_broadcasts;
create policy notification_broadcasts_admin_read on public.notification_broadcasts
  for select to authenticated using (public.is_staff());
