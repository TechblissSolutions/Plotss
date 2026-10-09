-- 0012_admin_audit_log.sql
-- Compliance: audit trail for admin actions (listing approval/rejection, capability grants).
-- Apply in Supabase SQL Editor after 0011. Do NOT modify migrations 0001–0010.
-- Service role inserts rows; authenticated admins can read; no client-side writes allowed.

create table if not exists admin_audit_log (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid references auth.users(id) on delete set null,
  action      text not null,        -- e.g. 'approve_listing', 'reject_listing', 'grant_capability'
  target_type text not null,        -- e.g. 'listing', 'user', 'capability'
  target_id   uuid,
  details     jsonb,
  created_at  timestamptz not null default now()
);

alter table admin_audit_log enable row level security;

create policy "Admins can read audit log"
  on admin_audit_log for select
  to authenticated
  using (is_admin());

-- No insert/update/delete policy for authenticated role.
-- All writes go through service role (server actions only).
