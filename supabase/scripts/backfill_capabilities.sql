-- Backfill: insert one account_capabilities row for every existing profiles row.
-- Run AFTER migration 0009 has been applied (account_capabilities table must exist).
-- Safe to re-run: ON CONFLICT (user_id) DO NOTHING makes it idempotent.
--
-- Mapping rules (approved 2026-10-07):
--   buyer  → can_buy=true,  can_sell=false, is_broker_staff=false, broker_id=null
--   seller → can_buy=true,  can_sell=true,  is_broker_staff=false, broker_id=null
--   broker (broker_id NOT NULL) → can_buy=true, can_sell=false, is_broker_staff=true, broker_id=profiles.broker_id
--   broker (broker_id IS NULL)  → treated as buyer (is_broker_staff=false, broker_id=null)
--     NOTE: broker rows with null broker_id are broken data — the CHECK constraint
--     (not is_broker_staff OR broker_id is not null) prevents storing them as broker staff.
--     They are mapped to buyer-equivalent capabilities and flagged in verification query 5.
--     Admin should resolve these rows and manually update their capabilities once the
--     correct broker_profiles.id is known.
--   admin  → can_buy=true,  can_sell=false, is_broker_staff=false, broker_id=null

INSERT INTO account_capabilities (
  user_id,
  can_buy,
  can_sell,
  is_broker_staff,
  broker_id,
  can_buy_activated_at,
  can_sell_activated_at,
  is_broker_staff_activated_at
)
SELECT
  p.id                                                  AS user_id,
  true                                                  AS can_buy,
  CASE WHEN p.role = 'seller' THEN true ELSE false END  AS can_sell,
  CASE WHEN p.role = 'broker' AND p.broker_id IS NOT NULL THEN true ELSE false END AS is_broker_staff,
  CASE WHEN p.role = 'broker' AND p.broker_id IS NOT NULL THEN p.broker_id ELSE null END AS broker_id,
  p.created_at                                          AS can_buy_activated_at,
  CASE WHEN p.role = 'seller' THEN p.created_at ELSE null END AS can_sell_activated_at,
  CASE WHEN p.role = 'broker' AND p.broker_id IS NOT NULL THEN p.created_at ELSE null END AS is_broker_staff_activated_at
FROM profiles p
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- Verification queries
-- ============================================================

-- V1. Total rows inserted
SELECT count(*) AS total_capability_rows FROM account_capabilities;

-- V2. Rows by capability combination
SELECT can_buy, can_sell, is_broker_staff, count(*) AS count
FROM account_capabilities
GROUP BY can_buy, can_sell, is_broker_staff
ORDER BY can_sell, is_broker_staff;

-- V3. Broker staff count match (should be equal)
SELECT
  (SELECT count(*) FROM profiles WHERE role = 'broker' AND broker_id IS NOT NULL) AS profiles_broker_count,
  (SELECT count(*) FROM account_capabilities WHERE is_broker_staff = true)         AS capabilities_broker_count;

-- V4. Seller count match (should be equal)
SELECT
  (SELECT count(*) FROM profiles WHERE role = 'seller')                                          AS profiles_seller_count,
  (SELECT count(*) FROM account_capabilities WHERE can_sell = true AND is_broker_staff = false)  AS capabilities_seller_count;

-- V5. Broker rows with null broker_id that were mapped as buyer-equivalent (need admin attention)
SELECT count(*) AS broker_rows_mapped_as_buyer
FROM account_capabilities
WHERE is_broker_staff = false
  AND user_id IN (SELECT id FROM profiles WHERE role = 'broker');

-- V6. Mismatch check: profiles with no corresponding capability row (should return 0 rows)
SELECT p.id, p.role, p.broker_id,
       ac.can_buy, ac.can_sell, ac.is_broker_staff, ac.broker_id AS cap_broker_id
FROM profiles p
LEFT JOIN account_capabilities ac ON ac.user_id = p.id
WHERE ac.id IS NULL;
