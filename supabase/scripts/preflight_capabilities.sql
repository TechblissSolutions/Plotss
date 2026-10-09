-- Preflight check: run BEFORE applying migration 0009 or the backfill.
-- Verifies the current state of profiles and confirms account_capabilities doesn't exist yet.

-- 1. Total profiles
SELECT count(*) AS total_profiles FROM profiles;

-- 2. Profiles by role
SELECT role, count(*) AS count
FROM profiles
GROUP BY role
ORDER BY role;

-- 3. Broker users with null broker_id (broken rows — need admin attention before backfill)
SELECT count(*) AS brokers_with_null_broker_id
FROM profiles
WHERE role = 'broker' AND broker_id IS NULL;

-- 4. List broker users with null broker_id (id + email for manual resolution)
SELECT p.id, u.email, p.created_at
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.role = 'broker' AND p.broker_id IS NULL
ORDER BY p.created_at;

-- 5. Existing account_capabilities rows (should be 0 before backfill)
SELECT count(*) AS existing_capabilities_rows
FROM account_capabilities;

-- 6. Confirm account_capabilities table exists
SELECT to_regclass('public.account_capabilities') IS NOT NULL AS table_exists;
