-- Verification queries for migration 0010
-- Run these in Supabase SQL Editor immediately after applying 0010_capabilities_rls_broker.sql

-- V1: Confirm function body was updated (should reference account_capabilities, not profiles)
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_name = 'is_broker_staff_for'
  AND routine_schema = 'public';

-- V2: Spot-check: for any known broker staff user, confirm the underlying table check returns rows.
-- Replace <user_id> and <broker_id> with actual values from account_capabilities.
-- SELECT is_broker_staff_for('<broker_id>'::uuid);
-- (Run this while authenticated as the broker staff user, or use service role to simulate)
SELECT ac.user_id, ac.is_broker_staff, ac.broker_id,
       -- This call works only if executed as the user (auth.uid() = ac.user_id)
       -- In SQL Editor as service role, use the direct table check instead:
       (SELECT count(*) FROM account_capabilities
        WHERE user_id = ac.user_id AND is_broker_staff = true AND broker_id = ac.broker_id) AS direct_check
FROM account_capabilities
WHERE is_broker_staff = true;

-- V3: Confirm all 5 dependent policies still exist
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE policyname IN (
  'properties_broker_staff',
  'images_broker_staff',
  'vdocs_broker_staff',
  'enquiries_broker_staff',
  'broker_staff_read'
)
ORDER BY tablename;
