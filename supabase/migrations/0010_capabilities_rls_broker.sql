-- Migration 0010: rewrite is_broker_staff_for() to read from account_capabilities
-- Date: 2026-10-08
--
-- PREREQUISITE: migration 0009 must be applied AND the backfill script must have run
-- successfully (all 6 verification queries must pass) before applying this migration.
--
-- CRITICAL: applying this migration immediately changes broker staff RLS authorization.
-- All broker staff access is now gated on account_capabilities.is_broker_staff = true.
-- Verify broker staff access works correctly in a test session immediately after applying.
--
-- Policies affected (no policy text changes needed — they call the function by name):
--   properties_broker_staff, images_broker_staff, vdocs_broker_staff,
--   enquiries_broker_staff, broker_staff_read

-- ============================================================
-- A. Rewrite is_broker_staff_for() to read from account_capabilities
-- ============================================================

create or replace function is_broker_staff_for(target_broker uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1
    from account_capabilities
    where user_id = auth.uid()
      and is_broker_staff = true
      and broker_id = target_broker
  );
$$;

-- ============================================================
-- B. is_admin() is intentionally NOT modified in this migration.
-- It continues to read profiles.role = 'admin' until a dedicated admin hardening migration is planned.
-- ============================================================
