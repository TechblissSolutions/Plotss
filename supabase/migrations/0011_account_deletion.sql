-- 0011_account_deletion.sql
-- DPDP Act compliance: right-to-erasure path via soft deletion.
-- Apply in Supabase SQL Editor. Do NOT modify migrations 0001–0010.
--
-- LIMITATION NOTE: Supabase auth does not block sign-in based on profiles columns.
-- Blocked accounts are caught in getSession() server-side: if deleted_at IS NOT NULL,
-- the session is cleared and the user is redirected to /login?error=account_deleted.
-- A truly hard-blocked account would require deleting from auth.users (admin-only operation,
-- done manually or via a Supabase Edge Function after a grace period).

alter table profiles
  add column if not exists deleted_at timestamptz default null;

comment on column profiles.deleted_at is
  'Non-null = soft-deleted. getSession() checks this and signs the user out. '
  'Hard delete from auth.users is a separate manual/Edge-Function step after a grace period.';
