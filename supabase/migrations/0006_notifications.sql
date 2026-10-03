-- PLOTSS migration 0006: notifications.
-- Run once in Supabase SQL Editor (after 0001-0005). Safe to re-run.
--
-- In-app notification inbox. Email/WhatsApp/SMS delivery (see src/lib/notify.ts) are separate, optional
-- channels gated by their own site_settings.features flags and a provider API key in env — this table only
-- covers the always-on, no-external-dependency in-app channel.

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  body text not null,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on notifications(user_id, created_at desc);

alter table notifications enable row level security;

drop policy if exists notifications_self_read on notifications;
create policy notifications_self_read on notifications for select using (user_id = auth.uid());

drop policy if exists notifications_self_update on notifications;
create policy notifications_self_update on notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Only the server (service role) ever inserts a notification — no insert policy for regular users.
drop policy if exists notifications_admin on notifications;
create policy notifications_admin on notifications for all using (is_admin()) with check (is_admin());
