# PLOTSS Capability Architecture — CHUNK 1 Design Spec
_Date: 2026-10-07. Status: AWAITING APPROVAL — no code changes made._

---

## Approved decisions (not re-litigated here)

The following are confirmed in `docs/PLOTSS-ARCHITECTURE-DECISIONS.md` (updated 2026-10-07):

1. Multi-capability model is a **pre-launch requirement** — not P3/post-launch.
2. `account_capabilities` table replaces `profiles.role` enum as the authorization source.
3. Admin remains on a separate path (`profiles.role = 'admin'`); it is NOT a capability row.
4. `prevent_role_escalation` trigger is dropped when the capabilities table lands.
5. `profiles.role` column is kept as a backward-compatibility alias during the transition; it is not written after capabilities land.
6. `buyer_requirements` table replaces the `auth.users.user_metadata.requirement` workaround (to ship alongside capabilities migration).
7. Onboarding welcome step ships with capabilities migration and is skippable (default = `can_buy=true`).
8. `can_sell` is self-service. `is_broker_staff` requires admin assignment (matches current model).
9. `/workspace` consolidation ships after capabilities schema is live (CHUNK 7).
10. `is_broker_staff_for()` DB function must be the very first thing rewritten in the capabilities migration — it is the critical RLS dependency.

---

## 1. Account → Capabilities Model

### 1.1 Capability definitions

**`can_buy`**
- Enables: browse public listings (public by default, no auth needed), save listings to account, submit enquiries, unlock owner contact details (rate-limited), access Buyer Dashboard, set buyer requirements.
- Acquired: automatically at signup — every new `profiles` row gets `can_buy = true` via the `handle_new_user` trigger.
- Removal: ⚠️ BUSINESS DECISION — removing `can_buy` from an existing account is not expected in normal operation. If removed, saved listings and enquiries remain in the DB but the user cannot access the buyer dashboard or submit new enquiries. For now: **not removable via UI** (admin can set directly in DB if ever needed).

**`can_sell`**
- Enables: post new listings (draft/submit), edit own listings, mark sold, access Seller Dashboard, view leads/enquiries for own listings.
- Acquired: self-service — user flips this on via "Account settings → I want to list land" or via the onboarding welcome step. No admin involvement.
- Removal: ⚠️ BUSINESS DECISION required (see Section 1.5 below). Default design: removing `can_sell` hides the seller dashboard but does NOT affect existing listings — listings remain live, admin can still manage them. The user just loses the UI path to manage them until they re-enable.

**`is_broker_staff`**
- Enables: manage all listings belonging to `broker_id` business (via `is_broker_staff_for()` RLS), access Broker Dashboard, invite team members, update the business's broker profile, view all business enquiries.
- Acquired: admin-only. Admin assigns via `/admin/users` (same as today's `changeRole` to `broker` with `broker_id`). Never self-service.
- Removal: admin-only. If removed: user loses access to the Broker Dashboard and all broker-scoped RLS access. Their previously posted listings remain attributed to the business (`owner_id` is unchanged) and other staff can still manage them. `broker_id` in `account_capabilities` is set to NULL on removal.

**Admin**
- NOT a capability row. Represented as `profiles.role = 'admin'` (current model). Checked via `is_admin()` DB function (`0001_init.sql` line 88).
- Admin bypasses ALL capability checks and ALL RLS policies globally. This is intentional and must not be narrowed.
- Proposed migration: after capabilities are stable in production, create a separate `admin_users` table mapping user IDs to admin level. The `is_admin()` function is then rewritten to query that table. This is post-launch scope (see `PLOTSS-ARCHITECTURE-DECISIONS.md` section 10 item 7).
- During the entire capabilities migration (CHUNK 4–7): admin keeps `profiles.role = 'admin'` and `is_admin()` is NOT rewritten. This is the safe path.

### 1.2 Proposed `account_capabilities` table

Column-level spec (no SQL yet):

| Column | Type | Constraint | Default | Notes |
|---|---|---|---|---|
| `id` | `uuid` | PK, `gen_random_uuid()` | — | surrogate key |
| `user_id` | `uuid` | NOT NULL, FK → `profiles(id)` ON DELETE CASCADE, UNIQUE | — | one row per user |
| `can_buy` | `boolean` | NOT NULL | `true` | all users start as buyers |
| `can_sell` | `boolean` | NOT NULL | `false` | self-service activation |
| `is_broker_staff` | `boolean` | NOT NULL | `false` | admin-assigned |
| `broker_id` | `uuid` | nullable, FK → `broker_profiles(id)` ON DELETE SET NULL | `null` | only set when `is_broker_staff = true` |
| `can_buy_activated_at` | `timestamptz` | nullable | `null` | set at row creation (signup time) |
| `can_sell_activated_at` | `timestamptz` | nullable | `null` | set when user activates |
| `is_broker_staff_activated_at` | `timestamptz` | nullable | `null` | set when admin assigns |
| `created_at` | `timestamptz` | NOT NULL | `now()` | row creation (equals signup) |
| `updated_at` | `timestamptz` | NOT NULL | `now()` | updated by trigger on change |

**Constraint**: `CHECK (NOT is_broker_staff OR broker_id IS NOT NULL)` — if `is_broker_staff = true`, `broker_id` must be non-null.
**Constraint**: `CHECK (is_broker_staff = false OR can_buy = true)` — broker staff should also be able to browse (same reasoning as seller).

### 1.3 Default at signup

A brand-new user gets one `account_capabilities` row with:
- `can_buy = true`, `can_buy_activated_at = now()`
- `can_sell = false`, `can_sell_activated_at = null`
- `is_broker_staff = false`, `is_broker_staff_activated_at = null`
- `broker_id = null`

This is inserted by the `handle_new_user()` DB trigger (the same trigger that creates the `profiles` row today — it will be updated to also insert into `account_capabilities`).

### 1.4 Capability activation

| Capability | Who triggers | How |
|---|---|---|
| `can_buy` | System | Automatically at signup. Not manually triggered. |
| `can_sell` | User (self-service) | Onboarding welcome step ("I want to list land") OR Account settings → "Enable seller access". Server action sets `can_sell = true, can_sell_activated_at = now()`. |
| `is_broker_staff` | Admin only | Admin assigns via `/admin/users` — sets `is_broker_staff = true, broker_id = <target>, is_broker_staff_activated_at = now()`. Replaces current `changeRole('broker')` action. |

### 1.5 Capability removal

| Capability | Who can remove | Blocker check | What happens to data |
|---|---|---|---|
| `can_buy` | Admin only (not via UI — direct DB) | None planned | Saved listings and enquiries remain in DB. User loses buyer dashboard access. |
| `can_sell` | ⚠️ BUSINESS DECISION: User self-service OR admin-only? | ⚠️ BUSINESS DECISION: Should active `live` listings block removal? | If removal allowed: listings remain live (they don't disappear), user loses seller dashboard. RLS `properties_owner_all` is NOT tied to the capability — the listing's `owner_id` still matches the user. |
| `is_broker_staff` | Admin only | None (admin can always remove) | User loses broker dashboard and `is_broker_staff_for()` RLS access. Their posted listings remain attributed to the business. `broker_id` set to null in `account_capabilities`. |

**Note on `can_sell` removal**: The current `properties_owner_all` RLS policy (`0001_init.sql` line 141) grants access based on `owner_id = auth.uid()` — not on `profiles.role`. This means removing `can_sell` capability does NOT automatically revoke RLS access to listings. The RLS policies for `properties_owner_all`, `images_owner_write`, `vdocs_owner` need to be left as-is (they are correct for FSBO ownership) or augmented to check `can_sell`. **Decision: leave `properties_owner_all` RLS unchanged for now.** The capability controls dashboard UI access, not the underlying data ownership.

---

## 2. Current `profiles.role` — Mapping and Migration

### 2.1 Where `profiles.role` is read or written today

| Location | File | Line / Notes |
|---|---|---|
| `profiles` table check constraint | `supabase/migrations/0001_init.sql` | Line 7: `check (role in ('buyer','seller','broker','admin'))` |
| `is_admin()` DB function | `supabase/migrations/0001_init.sql` | Line 90: `role = 'admin'` |
| `prevent_role_escalation` trigger | `supabase/migrations/0001_init.sql` / `0002_listings_cms_seo.sql` | Lines 119–131 and 7–17 (0002 replaces 0001 version) |
| `handle_new_user()` trigger | `supabase/migrations/0001_init.sql` | Line 96–100: inserts row without `role` (default 'buyer' applies) |
| `is_broker_staff_for(target_broker uuid)` function | `supabase/migrations/0004_multi_client.sql` | Line 22–24: `role = 'broker' and broker_id = target_broker` |
| `getSession()` — reads `role` | `src/lib/session.ts` | Line 22: `.select("full_name, phone, role, broker_id")` |
| `requireRole()` — checks `role` | `src/lib/session.ts` | Line 38: `s.role !== "admin" && !roles.includes(s.role)` |
| Buyer dashboard page guard | `src/app/(app)/dashboard/buyer/page.tsx` | Line 10: `requireRole("buyer")` |
| Seller dashboard page guard | `src/app/(app)/dashboard/seller/page.tsx` | Line 10: `requireRole("seller")` |
| Broker dashboard page guard | `src/app/(app)/dashboard/broker/page.tsx` | Line 12: `requireRole("broker")` |
| `setLeadStatus` action | `src/app/(app)/actions.ts` | Line 30: `s.role === "admin"` |
| `saveBrokerProfile` action | `src/app/(app)/actions.ts` | Line 41: `s.role !== "broker" && s.role !== "admin"` |
| `inviteStaffAction` | `src/app/(app)/actions.ts` | Line 72: `s.role !== "broker"` |
| `markListingSold` action | `src/app/(app)/actions.ts` | Line 104: `s.role === "admin"` |
| Admin user role assignment | `0002_listings_cms_seo.sql` | Line 237: hardcoded `SET role = 'admin'` for `dm@techbliss.in` |
| `inviteStaffAction` writes role | `src/app/(app)/actions.ts` | Line 89: `profiles.update({ role: "broker", broker_id: s.brokerId })` |
| `AppProvider.tsx` role context | `src/ui/AppProvider.tsx` | Line 44: `role: UserRole` in context type (reads from `Session.role`) |

### 2.2 Proposed migration strategy

All steps are additive first — existing functionality keeps working. Nothing breaks until the final switch-over.

**Step 1 (CHUNK 4a) — Create `account_capabilities` table + `buyer_requirements` table**
- New migration file. Both tables created. No data yet.
- `handle_new_user()` trigger updated to also insert into `account_capabilities` (`can_buy=true`).
- `prevent_role_escalation` trigger dropped in this same migration.
- Zero risk to existing users — the new table is empty.

**Step 2 (CHUNK 4b) — Backfill existing profiles into `account_capabilities`**
- New migration or a separate backfill script (run once): for every row in `profiles`, insert one row in `account_capabilities` using the mapping in Section 2.3.
- Admin rows (`role = 'admin'`) get `can_buy=true, can_sell=false, is_broker_staff=false` — admin is not a capability.
- Idempotent: use `INSERT ... ON CONFLICT (user_id) DO NOTHING`.

**Step 3 (CHUNK 4c) — Rewrite `is_broker_staff_for()`**
- Change the function body to read from `account_capabilities` (not `profiles.role`).
- All four policies that call this function (`properties_broker_staff`, `images_broker_staff`, `vdocs_broker_staff`, `enquiries_broker_staff`, `broker_staff_read`) automatically pick up the fix — no policy changes needed.
- Test: existing broker staff must still have access after this step. Verify with a live DB query.

**Step 4 (CHUNK 5a) — Update `getSession()` to read capabilities**
- Change `select("full_name, phone, role, broker_id")` to also join `account_capabilities`.
- Return `canBuy`, `canSell`, `isBrokerStaff` in the `Session` type alongside (or replacing) `role`.
- Keep `role` in Session during the compatibility period for code that hasn't been updated yet.

**Step 5 (CHUNK 5b) — Update `requireRole()` and add `requireCapability()`**
- `requireRole("buyer")` → `requireCapability("can_buy")`
- `requireRole("seller")` → `requireCapability("can_sell")`
- `requireRole("broker")` → `requireCapability("is_broker_staff")`
- Keep `requireRole()` as a compatibility shim that redirects to `requireCapability()`.

**Step 6 (CHUNK 5c) — Update server actions**
- `setLeadStatus`: change `s.role === "admin"` check to `s.isAdmin` (a derived boolean from session).
- `saveBrokerProfile`: change `s.role !== "broker"` to `!s.isBrokerStaff`.
- `inviteStaffAction`: change `s.role !== "broker"` to `!s.isBrokerStaff`.
- `inviteStaffAction` line 89: change `profiles.update({ role: "broker", broker_id: s.brokerId })` to `account_capabilities.update({ is_broker_staff: true, broker_id: s.brokerId, is_broker_staff_activated_at: now() })`.
- `markListingSold`: change `s.role === "admin"` to `s.isAdmin`.
- Admin action `changeRole` → replace with `addCapability` / `removeCapability` actions.

**Step 7 (CHUNK 5d) — Migrate `saveRequirement` from user_metadata → `buyer_requirements`**
- Update `src/app/(app)/requirement-actions.ts:saveRequirement()` to write to `buyer_requirements` table.
- One-time migration script: export existing `user_metadata.requirement` for all users and insert into `buyer_requirements`.

**Step 8 (CHUNK 6) — Update dashboard page guards**
- Buyer, Seller, Broker pages switch from `requireRole(x)` to `requireCapability(x)`.

**Step 9 (post-CHUNK 7 compatibility cleanup) — Stop writing `profiles.role`**
- Remove all code that writes `profiles.role` (other than the `is_admin()` admin path).
- Keep `profiles.role` column for admin only (value `'admin'`); all other values become stale.

**Step 10 (future, post-launch) — Drop non-admin `profiles.role` values**
- After confirming all paths read from `account_capabilities`, constrain `profiles.role` to `('admin','legacy')` or remove the check constraint. Drop `prevent_role_escalation` (already dropped in Step 1).

### 2.3 `profiles.role` values → capabilities mapping

| `profiles.role` | `can_buy` | `can_sell` | `is_broker_staff` | `broker_id` | Reasoning |
|---|---|---|---|---|---|
| `buyer` | `true` | `false` | `false` | `null` | Direct mapping. Buyer can browse and save. |
| `seller` | `true` | `true` | `false` | `null` | Seller gets `can_buy=true` — every seller should also be able to browse. This was a limitation of the old single-role model. |
| `broker` | `true` | `false` | `true` | existing `profiles.broker_id` | Broker staff gets `can_buy=true` for same reason. `is_broker_staff=true` with the existing `broker_id` FK. Note: broker staff with `can_sell=false` means they cannot post FSBO personal listings — see ⚠️ BUSINESS DECISION item 6. |
| `admin` | `true` | `false` | `false` | `null` | Admin is NOT a capability. Admin keeps `profiles.role='admin'`. Capabilities row is created with buyer defaults only — admin bypasses all capability checks anyway. |

**Notes**:
- `role='seller'` gets `can_buy=true` because the old single-role model prevented sellers from accessing buyer features. This is a feature improvement, not a regression.
- `role='broker'` gets `can_sell=false` by default. If the business decision is that broker staff should be able to post personal FSBO listings, then the backfill should set `can_sell=true` for broker rows. ⚠️ BUSINESS DECISION item 6 must be answered before the backfill runs.

### 2.4 `prevent_role_escalation` trigger — disposition

**Drop it in CHUNK 4a** (the same migration that creates `account_capabilities`).

Reasoning: the trigger exists to prevent users from self-escalating their role. Once the capabilities model is live, `profiles.role` is no longer the authorization mechanism. The capabilities table has its own access control (see Section 10.6). The trigger becomes noise and conflicts with the capability update logic.

The trigger is defined in `0002_listings_cms_seo.sql` (lines 7–17). Drop with:
```
DROP TRIGGER IF EXISTS profiles_role_guard ON profiles;
DROP FUNCTION IF EXISTS prevent_role_escalation();
```

---

## 3. Broker Architecture

### 3.1 Current model

Source: `supabase/migrations/0002_listings_cms_seo.sql` lines 24–37 and `supabase/migrations/0004_multi_client.sql`.

`broker_profiles` table: `id`, `user_id` (FK → profiles), `name`, `firm_name`, `rera_number`, `years_active`, `photo_url`, `bio`, `cities[]`, `specializations[]`, `verified` (boolean), `status` (`active|suspended`), `created_at`.

`profiles.broker_id` (added in `0004_multi_client.sql` line 17): FK → `broker_profiles(id)`. A user with `role='broker'` and `broker_id` set is staff of that business.

Multiple staff members can share one `broker_profiles` row. `properties.broker_id` FK on the listing ties that listing to the business (not to the individual staff member who posted it).

### 3.2 `is_broker_staff_for(target_broker uuid)` — current implementation

From `supabase/migrations/0004_multi_client.sql` lines 20–25:
```sql
create or replace function is_broker_staff_for(target_broker uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'broker' and broker_id = target_broker
  );
$$;
```

This reads `profiles.role = 'broker'` and `profiles.broker_id`. Both will change when capabilities land.

### 3.3 Proposed rewrite

After CHUNK 4c, the function body changes to read from `account_capabilities`:

Proposed logic (column spec — no SQL yet):
- Check `account_capabilities` where `user_id = auth.uid()` AND `is_broker_staff = true` AND `broker_id = target_broker`.
- Remove the `profiles.role = 'broker'` check entirely.
- `broker_id` now comes from `account_capabilities.broker_id` (not from `profiles.broker_id`).

**Important**: during the compatibility period (between CHUNK 4c and CHUNK 5c), the server actions that set `profiles.broker_id` must be updated to also set `account_capabilities.broker_id`. These two columns must stay in sync until `profiles.broker_id` is deprecated.

### 3.4 Owner vs listing manager separation

The actual land owner (the broker's client) is NOT required to have a PLOTSS account. Their contact details are stored in `listing_contacts` (`0002_listings_cms_seo.sql` line 62–67): `property_id`, `name`, `phone`, `owner_type` (default `'Direct Owner'`).

Is `listing_contacts` sufficient? YES for launch. The fields capture the real contact name and phone, with `owner_type` distinguishing `'Direct Owner'` vs broker-managed. The masking (service role reads raw, app layer redacts) is correct.

What is "representation proof"? This is NOT currently modeled anywhere in the codebase. A broker asserting "I represent this land owner" has no verification path beyond uploading documents to `verification_documents`. This is acceptable for launch (admin manually verifies during listing approval) but creates a trust gap.

**Who decides whether representation proof is required?** Admin — via the `collectDocuments` feature flag (`site_settings.features.collectDocuments`). If true, verification documents are collected.

Proposed representation proof storage (post-launch scope, not CHUNK 4): Add a `representation_type` column to `listing_contacts` with values `'direct_owner' | 'authorized_agent' | 'power_of_attorney'`. A new `representation_documents` table (or reuse `verification_documents` with `doc_type='representation_proof'`) holds the proof document. For launch: use the existing `verification_documents` table with `doc_type = 'representation_proof'` — no schema change needed.

### 3.5 Broker client model

`broker_profiles` table is correct. It needs no structural changes for the capability model. The only change is:
- `broker_profiles.user_id` column: currently used to link the "primary" staff member. With the capability model, this column becomes less important (all staff link via `account_capabilities.broker_id`). Keep it as-is for backward compatibility — existing broker profile pages and admin UI still use it.
- No new columns needed in `broker_profiles` for CHUNK 4.

---

## 4. Listing Lifecycle

### 4.1 Current states

From `supabase/migrations/0001_init.sql` line 39:
```
check (status in ('draft','pending','live','sold','rejected'))
```

Five values. `draft` is the default.

### 4.2 Proposed complete lifecycle

```
draft
  → submitted (by seller clicking "Submit for review" — sets status to 'pending')
     → ai_screened (automatic, fire-and-forget, advisory — stored in properties.details.ai_screen)
        → pending_review (admin sees in queue — this IS the 'pending' status today)
           ┌→ pending_documents (if collectDocuments flag on AND docs required — new status)
           |    → (seller uploads docs) → back to pending_review
           └→ approved → live (admin publishes — single admin action today)
                            → sold (seller or admin marks sold)
                            → unpublished (admin pulls back — currently no 'unpublished' status)
           └→ rejected (admin rejects — status = 'rejected')
                → (seller edits + resubmits → back to pending)
```

For CHUNK 4, the lifecycle does not change. The `status` values stay as-is. New statuses (`pending_documents`, `unpublished`/`suspended`) are CHUNK 8/9 scope.

For each current transition:
| Transition | Who triggers | DB field change | Notification |
|---|---|---|---|
| `draft → pending` | Seller via `submitListingAction` | `status = 'pending'` | `notify()` to admin (in-app) |
| `pending → live` | Admin via `decideListing` + `setListingStatus('live')` | `status = 'live'` | `notify()` to seller/broker (in-app, email if configured) |
| `pending → rejected` | Admin via `decideListing` | `status = 'rejected'` | `notify()` to seller/broker |
| `live → sold` | Seller/broker/admin via `markListingSold` | `status = 'sold'` | None currently |
| Any → pending | Seller edits a submitted listing | `status = 'pending'` | None currently |

### 4.3 `status` check constraint changes needed for CHUNK 4

None. Keep `draft|pending|live|sold|rejected` for now.

Future additions (post-CHUNK 4, separate migrations):
- `'suspended'` — admin temporary takedown (P2-6, `PLOTSS-ARCHITECTURE-DECISIONS.md` section 11)
- `'pending_documents'` — if document collection flow is enhanced (P3 scope)

### 4.4 AI screening

Current storage: `properties.details.ai_screen` jsonb sub-object, set by `screenAndStore()` (fire-and-forget, called after submit/update). Source: `PLOTSS-CHUNK0-RECONCILIATION.md` section 8.

What admin sees: the `details.ai_screen` result is displayed in the admin listing approval queue. Sellers and buyers do NOT see it.

Confirmed: AI cannot auto-publish or auto-reject. The screening is advisory — the listing still moves to `pending` regardless of the AI result. The feature flag `aiScreening` (default `true`) controls whether screening runs at all. This behavior is unchanged in CHUNK 4.

### 4.5 Material edit definition

⚠️ BUSINESS DECISION required (item 2 in `PLOTSS-ARCHITECTURE-DECISIONS.md` section 11). For CHUNK 4, use the following as the working definition:

**Material fields** (trigger re-review — set `status = 'pending'`, `is_verified = false`):
- `price`
- `area_value`
- `area_unit`
- `listing_type`
- `category_id`
- `city_id`
- `address`
- `lat`, `lng`
- `zone_type`

**Cosmetic fields** (no re-review):
- `title`
- `tagline`
- `description`
- `ai_description`
- `micro_market`
- `hero_image`
- `gallery`
- `road_width_ft`

**Current behavior**: any edit via `updateListingAction` resets `status` to `pending` (confirmed from audit). The `is_verified` flag is recomputed via `recomputeVerified()` which checks document statuses — document statuses do NOT reset on an edit. So `is_verified` may remain `true` after a cosmetic edit if all docs are still `verified`.

The ⚠️ BUSINESS DECISION is: should a material field edit also reset `is_verified = false` (forcing admin to re-verify documents)? Until decided, the current behavior (document statuses unchanged, `is_verified` recomputed from docs) is the safe default.

---

## 5. Ownership / Representation Model

### 5.1 Current schema

- `properties.owner_id` (uuid, FK → `profiles(id)`) — set in `0001_init.sql` line 42. The user who posted the listing. For broker staff, this is the staff member's user ID, NOT the underlying land owner.
- `properties.broker_id` (uuid, FK → `broker_profiles(id)`, nullable) — added in `0002_listings_cms_seo.sql` line 52. Which client business owns/manages this listing. `null` = FSBO.
- `listing_contacts` (`0002_listings_cms_seo.sql` lines 62–67): `property_id` (PK, FK → properties), `name` (text NOT NULL), `phone` (text NOT NULL), `owner_type` (text, default `'Direct Owner'`). Private — only service role reads.

### 5.2 The two listing modes

**Mode A — Personal/FSBO**: `owner_id = authenticated user`, `broker_id = null`.
The user posted their own land. `listing_contacts.name` = their display name, `listing_contacts.phone` = their phone.

**Mode B — Broker-managed**: `owner_id = staff poster`, `broker_id = client business`.
A broker staff member posted on behalf of a client. `listing_contacts.name` = actual land owner's name, `listing_contacts.phone` = land owner's phone, `listing_contacts.owner_type` = `'Represented Owner'` (or similar). The land owner does not have a PLOTSS account.

### 5.3 Representation proof

Current state: no dedicated `representation_proof` field. The closest is `verification_documents` with `doc_type` as free text.

For CHUNK 4: no schema change needed. Brokers should upload a representation proof document to `verification_documents` with `doc_type = 'representation_proof'`. Admin reviews it during listing moderation.

Post-launch (P3): a dedicated `representation_proof` sub-table or column in `listing_contacts` could be added:
- `representation_type`: `'direct_owner' | 'authorized_agent' | 'power_of_attorney' | 'developer_mandate'`
- `proof_document_id`: FK → `verification_documents(id)`, nullable
- `verified_by`: uuid FK → `profiles(id)`, nullable (admin who verified)
- `verified_on`: date, nullable

### 5.4 What changes for CHUNK 4

Nothing in the ownership/representation schema changes in CHUNK 4. The only change is that broker staff's authorization check (`is_broker_staff_for()`) reads from `account_capabilities` instead of `profiles.role`. The data model (`owner_id`, `broker_id`, `listing_contacts`) stays identical.

---

## 6. Verification Model

### 6.1 "Verified by PLOTSS" definition

From `PLOTSS-ARCHITECTURE-DECISIONS.md` section 6 (⚠️ BUSINESS DECISION pending, item 1):
Proposed definition: **"Verified by PLOTSS" means the listing's key details have been reviewed and approved by the PLOTSS team, and the seller has provided supporting documents that were found consistent with the listing.** It does NOT imply RERA registration check. This wording must be confirmed by the product owner before the "Verified" badge is shown publicly.

### 6.2 Current implementation

- `properties.is_verified` — boolean, default `false` (`0001_init.sql` line 40)
- `guard_property_moderation` trigger (`0002_listings_cms_seo.sql`) — prevents owner from setting `is_verified = true` directly
- `guard_document_status` trigger (`0002_listings_cms_seo.sql`) — prevents owner from changing `verification_documents.status` to `'verified'`
- `recomputeVerified()` — server-side function (referenced in audit, in `src/app/admin/` actions) that sets `is_verified = true` if all `verification_documents` rows for the listing have `status = 'verified'`
- Feature flag: `humanReview` (default `false`) — controls whether the "Verified" badge is shown to buyers. Even if `is_verified = true`, the badge is hidden unless `humanReview = true`.

### 6.3 What stays the same

The boolean `is_verified` can remain for launch. Reason: the multi-level verification state machine (states: `unverified → ai_screened → documents_submitted → verified`) adds significant complexity with minimal launch benefit — the current boolean + feature flag achieves the same outcome. The multi-level states can be added post-launch as a separate migration without touching existing data (a computed column or a view can represent the richer state from `verification_documents.status` rows).

### 6.4 Required documents — configurable by property type

Current: there is no `document_type_rules` table. Required document types are not configured per property type — the admin sees all `verification_documents` rows for a listing regardless of type.

For CHUNK 4: no change needed. The `collectDocuments` feature flag gates document collection globally.

Post-launch data model (P2): a `document_requirements` table with `category_id` (FK → categories), `doc_type` (text), `is_required` (boolean), `description` (text). The post-listing wizard uses this to tell sellers what to upload. Admin can configure it. No implementation for CHUNK 4.

---

## 7. Material Edits — Re-review Policy

### 7.1 Material fields (trigger re-review)

`properties` columns: `price`, `area_value`, `area_unit`, `listing_type`, `category_id`, `city_id`, `address`, `lat`, `lng`, `zone_type`.

### 7.2 Cosmetic fields (no re-review)

`properties` columns: `title`, `tagline`, `description`, `ai_description`, `micro_market`, `hero_image`, `gallery`, `road_width_ft`.

`details` jsonb sub-keys: connectivity notes, match reasons, price history are cosmetic. `details.ai_screen` is set only by the server, not by seller edits.

### 7.3 Proposed implementation

**For CHUNK 4**: no change. Current behavior (any edit → `status = 'pending'`) is a conservative safe default.

**Post-launch (CHUNK 8/9)**: add a material-field check in `updateListingAction`. If any material field changed: `status → 'pending'`, `is_verified → false`. If only cosmetic fields changed: `status` and `is_verified` unchanged.

Implementation options:
- **Server action check** (recommended): in `updateListingAction`, compare the incoming form values against the current DB row for the material fields list. If any differ, set `status = 'pending'`. Simpler than a DB trigger and easier to maintain.
- **DB trigger** (alternative): a `BEFORE UPDATE` trigger on `properties` that detects material field changes. More robust against direct SQL but harder to test.

Recommended: server action check for launch. DB trigger as a belt-and-suspenders addition post-launch.

---

## 8. Enquiry System

### 8.1 Current implementation

Table: `enquiries` (`0001_init.sql` line 65, extended in `0002_listings_cms_seo.sql` line 79).
Columns: `id`, `property_id`, `buyer_id`, `message`, `status` (free text, default `'open'`), `created_at`, `kind` (`'enquiry' | 'unlock'`), `visit_date`.

Valid `status` values (hardcoded whitelist in `src/app/(app)/actions.ts` line 9): `["open", "contacted", "visit", "closed"]`.

RLS: buyers insert own (`enquiries_buyer_insert`); `enquiries_read` — buyer reads own, property owner reads their listings' enquiries, admin reads all; `enquiries_broker_staff` — broker staff read enquiries for their business's listings; `enquiries_admin` — admin all.

### 8.2 Routing model

| Listing type | Default recipient | Dashboard |
|---|---|---|
| Direct owner (`broker_id = null`) | `properties.owner_id` user | Seller dashboard (Leads Inbox) |
| Broker-managed (`broker_id` set) | Any staff of `broker_id` business | Broker dashboard (Leads Inbox) |

### 8.3 Buyer-visible lifecycle

Approved lifecycle: Sent → Viewed → Contacted → Site Visit → Closed.

Current status: `open` (Sent), `contacted` (Contacted), `visit` (Site Visit), `closed` (Closed). The `Viewed` state does NOT exist.

What needs to be added (CHUNK 4 scope — additive only):
- Add `'viewed'` to the valid statuses list in `src/app/(app)/actions.ts` (server action change only — no migration needed since `status` is free text with no DB check constraint on `enquiries`).
- Add a DB trigger or a server action hook: when a seller/broker first opens an enquiry detail (e.g., via a future "view enquiry" action), set `status = 'viewed'` if it is currently `'open'`.

**Note**: "Viewed" tracking is listed as P3-10 in the backlog. For CHUNK 4, no change needed.

### 8.4 Permissions matrix

| Action | Buyer | Seller (own listings) | Broker Staff (business listings) | Admin |
|---|---|---|---|---|
| Submit enquiry | ALLOWED (own buyer_id) | ALLOWED | ALLOWED | ALLOWED |
| View own submitted enquiries | ALLOWED (RLS: buyer_id=uid) | N/A | N/A | ALLOWED |
| View received enquiries | DENIED | ALLOWED (RLS: owner_id) | ALLOWED (RLS: is_broker_staff_for) | ALLOWED |
| Update status (open/contacted/visit/closed) | DENIED | ALLOWED (own listings only) | ALLOWED (own business only) | ALLOWED |
| Mark as closed | DENIED | ALLOWED | ALLOWED | ALLOWED |

After capabilities migration: "Seller" = user with `can_sell=true`, "Broker Staff" = user with `is_broker_staff=true`. The RLS policies do not change — they read `owner_id` and `is_broker_staff_for()`. What changes is how the server action checks authorization (uses `s.canSell` / `s.isBrokerStaff` instead of `s.role`).

### 8.5 Owner contact protection

In broker-managed listings, `listing_contacts.phone` is the actual land owner's phone — not the broker staff member's phone. This is the correct model.

Contact protection: `listing_contacts` has admin-only RLS (no public or authenticated read). The `unlockContact` server action reads it via service client after checking: authenticated user + rate limit (20 unlocks/day via `enquiries` table with `kind='unlock'`). The masked display (partial phone number) is done in the app layer in `rowToListing()` in `src/lib/db/listings.ts`.

This is sufficient and does NOT need to change in CHUNK 4.

---

## 9. Buyer Requirements

### 9.1 Current implementation

**File**: `src/app/(app)/requirement-actions.ts`
**Type**: `Requirement = { city: string; category: string; maxBudgetCr: number | null }` (line 8)
**Storage**: `auth.users.user_metadata` key `requirement` — set via `svc.auth.admin.updateUserById()` (line 25). This data is in Supabase Auth, NOT in Postgres. Invisible to RLS, SQL queries, and analytics.

### 9.2 Proposed `buyer_requirements` table

Column-level spec:

| Column | Type | Constraint | Default | Notes |
|---|---|---|---|---|
| `id` | `uuid` | PK, `gen_random_uuid()` | — | — |
| `user_id` | `uuid` | NOT NULL, FK → `profiles(id)` ON DELETE CASCADE, UNIQUE | — | one requirement record per user for now (can relax to multi-row later) |
| `city` | `text` | nullable | `null` | free text matching `cities.name` |
| `category` | `text` | nullable | `null` | free text matching `categories.name` |
| `min_area_sqft` | `numeric` | nullable, `>= 0` | `null` | new field — not in current user_metadata |
| `max_area_sqft` | `numeric` | nullable, `>= 0` | `null` | new field — not in current user_metadata |
| `max_budget_cr` | `numeric` | nullable, `>= 0` | `null` | maps from `user_metadata.requirement.maxBudgetCr` |
| `notes` | `text` | nullable | `null` | free text, optional |
| `created_at` | `timestamptz` | NOT NULL | `now()` | — |
| `updated_at` | `timestamptz` | NOT NULL | `now()` | updated by trigger |

**Constraint**: `CHECK (min_area_sqft IS NULL OR max_area_sqft IS NULL OR min_area_sqft <= max_area_sqft)`

### 9.3 Migration plan

1. Create `buyer_requirements` table (CHUNK 4a migration).
2. One-time backfill script (run once after CHUNK 4a is applied): iterate `auth.users`, read `user_metadata.requirement`, insert into `buyer_requirements`. This script is run by the developer manually in Supabase SQL Editor.
3. In CHUNK 5d: update `saveRequirement()` action to write to `buyer_requirements` table. Set `min_area_sqft = null` and `max_area_sqft = null` for now (no UI for area range yet; add in onboarding CHUNK 6).
4. Dual-write period (between CHUNK 4a and CHUNK 5d): old code still writes to `user_metadata`. New requirements written after CHUNK 5d go to DB only. There is no sync — but since requirements are overwritten (not appended) each time, the DB version will be authoritative as soon as any user saves again.

### 9.4 What does NOT change

`saved_listings` table and `src/app/(site)/saved-actions.ts` are correct and compatible with the capabilities model. Do not redesign.

`AppProvider.toggleSave` fire-and-forget fix (`void setSaved()` → awaited with error revert) is a P1 fix tracked separately in `docs/PLOTSS-LAUNCH-BACKLOG.md` P1-7. It is NOT part of this spec.

---

## 10. RLS Migration Plan

### 10.1 `is_admin()` function

Current (`0001_init.sql` line 88–91): reads `profiles.role = 'admin'`.

**Proposed for CHUNK 4**: NO CHANGE. Keep `profiles.role = 'admin'` as the admin authorization path. The `is_admin()` function is called in approximately 20 RLS policies. Rewriting it is the highest-risk single change in the codebase. It will be deferred until a dedicated `admin_users` table is designed and validated.

The `is_admin()` function stays exactly as-is through CHUNK 4, 5, 6, and 7. It is only rewritten in the post-launch admin hardening work.

### 10.2 `is_broker_staff_for(target_broker uuid)` function

Current SQL (`0004_multi_client.sql` lines 20–25):
```sql
select exists (
  select 1 from profiles where id = auth.uid() and role = 'broker' and broker_id = target_broker
);
```

Proposed SQL after CHUNK 4c (description — no SQL yet):
- SELECT from `account_capabilities` WHERE `user_id = auth.uid()` AND `is_broker_staff = true` AND `broker_id = target_broker`.
- Remove all reference to `profiles.role`.
- The function signature stays identical — only the body changes.

The five policies that call this function — `properties_broker_staff`, `images_broker_staff`, `vdocs_broker_staff`, `enquiries_broker_staff`, `broker_staff_read` — do NOT need to change. They call the function by name; the function's new body does the right thing.

### 10.3 Policies that reference `role = 'broker'` directly

From the full policy audit in `PLOTSS-CHUNK0-RECONCILIATION.md` section 11:

Only `is_broker_staff_for()` function references `role = 'broker'` directly (not in policy `USING` clauses). No other policy has a literal `role = 'broker'` check.

All broker-scoped policies go through `is_broker_staff_for()`. Rewriting that one function is sufficient — no individual policy changes needed for the broker role migration.

### 10.4 Policies that reference `is_admin()`

All policies using `is_admin()` continue to work unchanged. `is_admin()` keeps reading `profiles.role = 'admin'`. No policy changes needed for CHUNK 4.

### 10.5 `prevent_role_escalation` trigger

**Drop it in CHUNK 4a.** See Section 2.4 for full reasoning.

After the trigger is dropped, `profiles.role` becomes a simple column with no enforcement other than the check constraint `(role in ('buyer','seller','broker','admin'))`. Code will still write to it during the compatibility period, but no trigger guards those writes.

Optionally: leave the check constraint in place during compatibility. Remove it in the cleanup migration (post-CHUNK 7).

### 10.6 New RLS policies needed for `account_capabilities` table

| Operation | Who can | Policy logic |
|---|---|---|
| SELECT | Own row only; admin all | `user_id = auth.uid() OR is_admin()` |
| INSERT | Never by users (trigger and admin server action only) | No INSERT policy for `authenticated` role; service role bypasses RLS |
| UPDATE | Admin only (via service client) | No UPDATE policy for `authenticated` role; admin uses service client |
| DELETE | Admin only | No DELETE policy for `authenticated`; admin uses service client |

RLS MUST be enabled on `account_capabilities`. Users can read their own row (to display their capabilities in the UI). All writes go through the service client (admin server actions or the `handle_new_user` trigger which uses `security definer`).

### 10.7 New RLS policies needed for `buyer_requirements` table

| Operation | Who can | Policy logic |
|---|---|---|
| SELECT | Own row only; admin all | `user_id = auth.uid() OR is_admin()` |
| INSERT | Own row only | `user_id = auth.uid()` (or service role from server action — use service client) |
| UPDATE | Own row only | `user_id = auth.uid()` (or service role) |
| DELETE | Own row only; admin | `user_id = auth.uid() OR is_admin()` |

---

## 11. Onboarding

### 11.1 Recommended flow

```
Signup (email/Google/OTP)
  ↓
handle_new_user() trigger fires:
  - Creates profiles row (as today)
  - Creates account_capabilities row (can_buy=true, can_sell=false, is_broker_staff=false)
  ↓
Optional welcome step: "What brings you to PLOTSS?"
  → "Find land" → stay buyer, redirect to /search
  → "List land" → server action sets can_sell=true, redirect to /post-listing
  → "I'm an agent/broker" → show contact form / request to admin → notify admin
  → (skip) → stay buyer, redirect to /search or /dashboard/buyer
  ↓
Workspace (capability-aware dashboard)
```

### 11.2 Skippability

YES — skippable. Skipping gives buyer capability by default.

**Activating Seller later** (post-signup): Account Settings → "I want to list land" → calls `addCapability('can_sell')` server action → sets `can_sell = true`. No admin involvement.

**Activating Broker later** (post-signup): Account Settings → "I'm a broker / agent" → request form → admin reviews → calls `addCapability('is_broker_staff', brokerId)` server action → sets `is_broker_staff = true` with `broker_id`.

---

## 12. Workspace Navigation Plan

### 12.1 Transitional state (CHUNK 4–6)

Keep `/dashboard/buyer`, `/dashboard/seller`, `/dashboard/broker` routes unchanged.

P1 fix (already decided, `PLOTSS-ARCHITECTURE-DECISIONS.md` section 11 item 3): add cross-navigation links to `Shell.tsx` (e.g., "Switch to buyer view", "Go to seller dashboard"). This is a purely additive change to `src/ui/dashboards/Shell.tsx` — no schema dependency.

During CHUNK 5: each dashboard page's `requireRole()` call is updated to `requireCapability()`. The user is redirected appropriately if they lack the required capability.

### 12.2 Final state (CHUNK 7)

`/workspace` single route with a capability-driven sidebar. The three separate dashboard routes become server-side redirects to the appropriate `/workspace` sub-section.

Sidebar items are controlled by `canBuy`, `canSell`, `isBrokerStaff` from the session. See `PLOTSS-ARCHITECTURE-DECISIONS.md` section 3 for the full sidebar IA.

### 12.3 What each dashboard page must check (CHUNK 5 target state)

- `/dashboard/buyer/page.tsx`: `requireCapability("can_buy")` — all users have this by default, so this is effectively just "must be authenticated".
- `/dashboard/seller/page.tsx`: `requireCapability("can_sell")` — only users who opted in or were upgraded.
- `/dashboard/broker/page.tsx`: `requireCapability("is_broker_staff")` — only admin-assigned broker staff.

Admin users bypass all capability checks (via `s.role === 'admin'` check in `requireCapability()` — same as `requireRole()` today).

---

## 13. Migration / Backfill Plan

### 13.1 New tables and columns

In sequence:

| Migration file (proposed name) | Contents |
|---|---|
| `0009_capabilities.sql` | Create `account_capabilities` table; create `buyer_requirements` table; drop `prevent_role_escalation` trigger + function; update `handle_new_user()` to also insert into `account_capabilities` |
| (Backfill script, not a migration) | One-time SQL: for each row in `profiles`, insert into `account_capabilities` using the role→capability mapping from Section 2.3 |
| `0010_capabilities_rls_broker.sql` | Rewrite `is_broker_staff_for()` to read from `account_capabilities`; add RLS policies for `account_capabilities` and `buyer_requirements` |

**Why split into two migrations?** Step 1 (0009) creates the tables and is safe to run any time. Step 2 (0010) rewrites `is_broker_staff_for()` which immediately changes broker staff authorization — this should be applied only AFTER the backfill script confirms all broker staff rows are correctly in `account_capabilities`.

### 13.2 Existing data mapping

| `profiles.role` | `account_capabilities` row |
|---|---|
| `'buyer'` | `can_buy=true, can_sell=false, is_broker_staff=false, broker_id=null` |
| `'seller'` | `can_buy=true, can_sell=true, is_broker_staff=false, broker_id=null` |
| `'broker'` | `can_buy=true, can_sell=false*, is_broker_staff=true, broker_id=profiles.broker_id` |
| `'admin'` | `can_buy=true, can_sell=false, is_broker_staff=false, broker_id=null` |

*`can_sell` for existing brokers: set per ⚠️ BUSINESS DECISION item 6. Default `false` unless decided otherwise.

### 13.3 Rollback considerations

If `0009_capabilities.sql` fails mid-way: the table may be partially created. Run `DROP TABLE IF EXISTS account_capabilities; DROP TABLE IF EXISTS buyer_requirements;` to clean up. The `prevent_role_escalation` trigger may have been dropped — it can be recreated from the `0002` migration. The `handle_new_user` trigger reverts are: recreate the function without the `account_capabilities` insert.

If `0010_capabilities_rls_broker.sql` fails: the `is_broker_staff_for()` function may be in an intermediate state. Re-run the original function from `0004_multi_client.sql` to restore the known-good version. The four broker RLS policies continue to work because they call the function by name.

**`profiles.role` as fallback**: YES — during the entire compatibility period, `profiles.role` remains readable and correct. If the capabilities table is somehow corrupted or unavailable, rolling back `getSession()` to read only `profiles.role` restores the old behavior within minutes (code rollback only, no data migration).

### 13.4 Compatibility period

| Period | `profiles.role` write status | Notes |
|---|---|---|
| CHUNK 4 (DB migration) | Still written | `inviteStaffAction` still writes `role='broker'`. New signups get `role='buyer'` from default. |
| CHUNK 5 (server actions) | Writes being removed one by one | `inviteStaffAction` updated in CHUNK 5c to write to `account_capabilities` instead. Other writes removed as actions are updated. |
| CHUNK 6–7 | Write-only for admin path | Only `profiles.role = 'admin'` is still written (by SQL migration, not server actions). |
| Post-CHUNK 7 | Read-only except admin | `profiles.role` column kept but no server action writes to it. Values are stale for non-admin users. |
| Post-launch cleanup | Drop or constrain | Constraint changed to `role in ('admin')` OR column dropped. `is_admin()` rewritten if admin table is ready. |

---

## 14. Dependency Graph

```
CHUNK 3 design approved (this document)
  ↓
CHUNK 4a: Create account_capabilities + buyer_requirements tables
          Drop prevent_role_escalation trigger
          Update handle_new_user() trigger
          (0009_capabilities.sql)
  ↓
CHUNK 4b: Backfill existing profiles.role → account_capabilities rows
          (one-time SQL script, manual run)
  ↓
CHUNK 4c: Rewrite is_broker_staff_for() to read from account_capabilities
          Add RLS policies for account_capabilities + buyer_requirements
          (0010_capabilities_rls_broker.sql)
  ↓
CHUNK 5a: Update getSession() to return canBuy, canSell, isBrokerStaff, isAdmin
          Update Session type in src/lib/types.ts
  ↓
CHUNK 5b: Update requireRole() → requireCapability()
          Add compatibility shim so requireRole() still works
  ↓
CHUNK 5c: Update server actions
          - setLeadStatus: s.role === 'admin' → s.isAdmin
          - saveBrokerProfile: role check → isBrokerStaff check
          - inviteStaffAction: role check → isBrokerStaff; write account_capabilities not profiles.role
          - markListingSold: role check → isAdmin
          - Admin: add addCapability / removeCapability actions
  ↓
CHUNK 5d: Migrate saveRequirement() from user_metadata → buyer_requirements table
          Run one-time backfill of existing user_metadata requirements
  ↓
CHUNK 6a: Onboarding route (/onboarding) + capability selection UI
  ↓
CHUNK 6b: Account settings capability management UI
          (user enables can_sell, admin assigns is_broker_staff)
  ↓
CHUNK 7: Workspace consolidation + capability-driven sidebar
         /workspace/* routes
         Deprecate /dashboard/* routes (server-side redirects)
```

**Parallel work** (safe to do alongside CHUNK 4 schema work):
- P1 fixes: `Shell.tsx` cross-nav links (no schema dependency)
- P1 fixes: `toggleSave` fire-and-forget fix in `AppProvider.tsx` (no schema dependency)
- P1 fixes: `adminListings()` pagination (no schema dependency)
- P0: Run migration 0008 (blog EEAT columns — fully independent)
- P0: Set up CI/CD pipeline (independent)
- P0: Configure `RESEND_API_KEY` (independent)

**Cannot start until dependency completes**:
- CHUNK 4c cannot run until CHUNK 4b (backfill) is verified — if `is_broker_staff_for()` is rewritten before the backfill, broker staff immediately lose access.
- CHUNK 5a cannot run until CHUNK 4c — `getSession()` needs to read from `account_capabilities` which must exist and be populated.
- CHUNK 5b/5c cannot run until CHUNK 5a — they depend on the new `Session` type.
- CHUNK 6 UI cannot be built until CHUNK 5c — the `addCapability` action must exist.
- CHUNK 7 workspace consolidation cannot start until CHUNK 6 — capabilities UI must exist for the workspace to show correct items.

---

## 15. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| `is_broker_staff_for()` rewritten before backfill completes — all broker staff lose RLS access immediately | CRITICAL | Apply `0010` (function rewrite) only AFTER verifying backfill with a count check: `SELECT count(*) FROM account_capabilities WHERE is_broker_staff = true` must equal `SELECT count(*) FROM profiles WHERE role = 'broker'` |
| Admin lockout if `is_admin()` is accidentally modified | CRITICAL | Do NOT modify `is_admin()` in CHUNK 4. Leave it reading `profiles.role = 'admin'` until a separate admin hardening CHUNK is planned. |
| Buyer requirements data loss — user_metadata not auto-migrated | HIGH | Run the one-time backfill script BEFORE updating `saveRequirement()` action. The backfill window is the gap between CHUNK 4a and CHUNK 5d. If CHUNK 5d ships without a backfill, existing requirements are orphaned. |
| `profiles.role` and `account_capabilities` drift during compatibility period | HIGH | The compatibility period has two sources of truth. Drift is possible if a code path writes to `profiles.role` but not `account_capabilities`. Audit: confirm every server action that writes `profiles.role` is updated in CHUNK 5c. |
| Existing broker staff missing `broker_id` in `profiles` | MEDIUM | Verify before backfill: `SELECT count(*) FROM profiles WHERE role = 'broker' AND broker_id IS NULL`. Any broker with null `broker_id` will have `is_broker_staff=true` but no `broker_id` in `account_capabilities` — violating the CHECK constraint. Fix in the backfill script by defaulting these to `is_broker_staff=false` or resolving with admin. |
| `prevent_role_escalation` drop breaks a test | LOW | Check `tests/*.test.tsx` for any tests that exercise role escalation before dropping the trigger. |
| Performance: `account_capabilities` join on every `getSession()` call | MEDIUM | `account_capabilities.user_id` is UNIQUE — the join is always a single row lookup. Add an index on `user_id`. Perf impact is negligible vs the existing `profiles` join. |
| Listings becoming unreachable if `properties_broker_staff` policy breaks during migration | HIGH | Test broker staff access immediately after `0010` is applied in staging (when staging exists). Until staging is available, apply `0010` in a maintenance window and test immediately with a known broker staff account. |
| `inviteStaffAction` writes `profiles.role='broker'` after CHUNK 4c — `is_broker_staff_for()` reads from capabilities but new invitees have no capabilities row | HIGH | Update `inviteStaffAction` in CHUNK 5c BEFORE it is possible to invite new staff. Since CHUNK 5c is before any production use, the window is acceptable. But do not delay CHUNK 5c. |
| Dual `0004_` migration filename causing confusion | LOW | Confirmed issue from `PLOTSS-CHUNK0-RECONCILIATION.md` section 16. No functional risk to CHUNK 4 — just ensure `0009` is the next number and not a duplicate. |

---

## 16. Files That Will Need Modification

| File | Chunk | Change Required | Can Stay Unchanged Until |
|---|---|---|---|
| `supabase/migrations/` | CHUNK 4a | New file `0009_capabilities.sql` | N/A — this IS the migration |
| `supabase/migrations/` | CHUNK 4c | New file `0010_capabilities_rls_broker.sql` | After backfill verified |
| `src/lib/types.ts` | CHUNK 5a | Add `canBuy`, `canSell`, `isBrokerStaff`, `isAdmin` to `Session` type | After CHUNK 4c |
| `src/lib/session.ts` | CHUNK 5a | `getSession()`: also select from `account_capabilities`; return new fields. `requireRole()` → `requireCapability()` shim | After CHUNK 4c |
| `src/app/(app)/actions.ts` | CHUNK 5c | Update role checks in `setLeadStatus`, `saveBrokerProfile`, `inviteStaffAction`, `markListingSold` | After CHUNK 5a |
| `src/app/(app)/requirement-actions.ts` | CHUNK 5d | Rewrite `saveRequirement()` to write to `buyer_requirements` table | After CHUNK 4a |
| `src/app/(app)/dashboard/buyer/page.tsx` | CHUNK 5b | `requireRole("buyer")` → `requireCapability("can_buy")` | After CHUNK 5b shim lands |
| `src/app/(app)/dashboard/seller/page.tsx` | CHUNK 5b | `requireRole("seller")` → `requireCapability("can_sell")` | After CHUNK 5b shim lands |
| `src/app/(app)/dashboard/broker/page.tsx` | CHUNK 5b | `requireRole("broker")` → `requireCapability("is_broker_staff")` | After CHUNK 5b shim lands |
| `src/ui/dashboards/Shell.tsx` | P1 (independent of CHUNK 4) | Add cross-dashboard navigation links | Can ship now — no schema dependency |
| `src/ui/AppProvider.tsx` | P1 (independent) | Fix `toggleSave` fire-and-forget (`void setSaved`) | Can fix now |
| Admin server actions (path not confirmed — in `src/app/admin/`) | CHUNK 5c | Add `addCapability` / `removeCapability` actions; update `changeRole` action | After CHUNK 5a |
| `src/app/(site)/` routes (onboarding) | CHUNK 6a | New `/onboarding` route + UI | After CHUNK 5c |
| Account settings page (path not confirmed) | CHUNK 6b | Capability management UI | After CHUNK 5c |

---

## 17. What Can Safely Remain Unchanged

The following systems are confirmed compatible with the capabilities model and require NO changes through CHUNK 4–7:

- **`saved_listings` table** — RLS is `user_id = auth.uid()`, no role dependency. Compatible.
- **`src/app/(site)/saved-actions.ts`** — `loadSavedIds()`, `setSaved()`, `mergeSaved()` use service client and check session ID only. Compatible.
- **`enquiries` table** — RLS uses `buyer_id = auth.uid()`, `owner_id` join, and `is_broker_staff_for()`. The last will be fixed by the `is_broker_staff_for()` rewrite. Otherwise compatible.
- **`notifications` table + `notify()` function** — service-role insert only, user-scoped reads. No role dependency. Compatible.
- **`listing_contacts` masking** — service client read after session check. No role-based filtering. Compatible.
- **`properties.owner_id` / `properties.broker_id` model** — unaffected by capabilities migration. Compatible.
- **`broker_profiles` table** — no structural changes needed. Compatible.
- **`verification_documents` table** — RLS uses `owner_id` join and `is_broker_staff_for()`. Compatible after the function rewrite.
- **`site_settings` + feature flags** — admin-only writes, public reads. `is_admin()` path unchanged. Compatible.
- **`blog_posts`, `seo_pages`, `redirects`** — all use `is_admin()` which is unchanged. Compatible.
- **`events` table + `TrackingProvider`** — no auth role dependency. Compatible.
- **`rate_limit_hits` table** — no role dependency. Compatible.
- **`broker_contacts` table** — admin-only RLS. Compatible.
- **Storage buckets** (`listing-photos`, `listing-docs`) — policies use `auth.uid()` for folder matching and `is_admin()`. Compatible.
- **`src/lib/db/dashboards.ts`** — `buyerData()`, `sellerData()`, `brokerData()` read from DB using service client, scoped by session ID. These will need minor updates in CHUNK 5 to accept new session shape, but no schema changes.
- **Admin panel routes** (`/admin/*`) — all use `requireAdmin()` which reads `profiles.role = 'admin'`. Unchanged through capabilities migration.

---

_End of spec. Status: AWAITING APPROVAL. No code or migrations have been modified._
