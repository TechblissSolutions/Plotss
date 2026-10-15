-- Phase 5: User suspension column
-- Separate from deleted_at (DPDP permanent erasure) — suspension is reversible.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz DEFAULT NULL;

COMMENT ON COLUMN profiles.suspended_at IS
  'Set when an admin suspends the account. NULL = active. Clear to reactivate. NOT for DPDP erasure — use deleted_at for that.';
