# PLOTSS Architecture Reconciliation — CHUNK 0
_Date: 2026-10-06. Read-only inspection. No code was modified._

---

## Executive Summary

The PLOTSS codebase is a functional, production-ready Next.js 16 + Supabase application with a working four-role identity model (`buyer | seller | broker | admin`), complete admin panel, listing lifecycle with moderation, multi-client (agency) scoping, in-app notifications, and a first-party analytics pipeline. The core marketplace is complete. However, five categories of gaps exist between what is deployed and what the approved architecture requires.

**Gap 1 — Identity/Capabilities**: The single-role enum is intentionally kept for launch (per `PLOTSS-ARCHITECTURE-DECISIONS.md` section 10), but the codebase has already begun a partial workaround: buyer requirements are stored in `auth.users.user_metadata` (not a DB table) via `src/app/(app)/requirement-actions.ts:saveRequirement()`. This workaround is not documented as intentional and creates a data model inconsistency: requirements are invisible to RLS, unqueryable by SQL, and will need to be migrated when the approved `buyer_requirements` table is created.

**Gap 2 — Middleware missing entirely**: There is no `middleware.ts` at any path in the project. The approved architecture requires it for the `redirects` table (P1-3 backlog), but its absence also means there is no Next.js middleware for auth, cookies, or session refresh. All authentication is handled in server components and server actions via `src/lib/session.ts:getSession()`. This is correct for the current model but means no central redirect guard exists.

**Gap 3 — Dashboard/Workspace**: The approved `/workspace` consolidation (P3) has not started, which is correct. However the approved P1 fix (add cross-dashboard navigation to `Shell.tsx`) is also not done — `src/ui/dashboards/Shell.tsx` is 11 lines with no navigation at all. A seller who wants to browse cannot reach the buyer dashboard without typing the URL manually.

**Gap 4 — Migration 0008 not applied**: `supabase/migrations/0008_blog_eeat_aeo.sql` exists as a file but the columns (`key_takeaways`, `faq`, `author_role`, `author_bio`) do not exist in the live DB. The admin blog form will error when saving EEAT fields. This is a P0 launch blocker that the user must action.

**Gap 5 — Save sync gap is partially but not fully addressed**: `AppProvider.tsx:toggleSave` writes to localStorage first and fires `setSaved()` as `void` (fire-and-forget). If the DB write fails silently (RLS rejection, network error), the heart icon shows filled but the buyer dashboard shows nothing. The `setSaved` server action itself is correct but the caller discards its return value.

---

## Section 1: Identity / Capabilities Model

### Current Implementation

- **File**: `supabase/migrations/0001_init.sql` line 7: `role text not null default 'buyer' check (role in ('buyer','seller','broker','admin'))`
- **File**: `src/lib/session.ts` line 22: reads `role` and `broker_id` from `profiles` on every authenticated request
- **File**: `src/lib/session.ts` line 35–39: `requireRole()` enforces role at page level; admins bypass all role checks
- **Table**: `profiles` — columns: `id`, `full_name`, `phone`, `role`, `broker_id` (added in 0004), `created_at`
- **No `account_capabilities` table exists** — NOT in any migration file
- Admin: hardcoded single email `dm@techbliss.in` set via `0002_listings_cms_seo.sql` line 237: `update profiles set role = 'admin' where id = (select id from auth.users where email = 'dm@techbliss.in')`
- `is_admin()` function in `0001_init.sql` line 88: `select exists (select 1 from profiles where id = auth.uid() and role = 'admin')`
- `is_broker_staff_for(target_broker uuid)` function in `0004_multi_client.sql` line 21: `select exists (select 1 from profiles where id = auth.uid() and role = 'broker' and broker_id = target_broker)`
- `prevent_role_escalation` trigger (replaced in 0002): allows `buyer → seller` or `buyer → broker` only for signed-in non-admin users; service-role contexts (`auth.uid() is null`) are unrestricted

### Approved Architecture Requires

Per `PLOTSS-ARCHITECTURE-DECISIONS.md` section 1: **keep single-role model for launch**; implement capabilities migration only as P3 post-launch. The `account_capabilities` table proposed in `PLOTSS-ARCHITECTURE-RECOMMENDATIONS.md` is explicitly deferred.

### Gap

No gap for launch. The single-role model is the approved choice. However:

1. **Buyer requirements stored in wrong location**: `src/app/(app)/requirement-actions.ts:saveRequirement()` stores buyer requirements in `auth.users.user_metadata` via `svc.auth.admin.updateUserById()`. The approved architecture says requirements go in a `buyer_requirements` DB table (P2-5). The current workaround is undocumented in any architecture decision doc and will need a data migration when the DB table is created.

2. **No `account_capabilities` table**: Correct per decisions doc (P3 deferred).

3. **Single admin**: Correct per decisions doc. Risk flagged in Section 10.

### Migration Risk

When capabilities migration runs (P3):
- `is_admin()` function (used in 20+ RLS policies) must be rewritten to read from `account_capabilities.is_admin`
- `is_broker_staff_for()` function (used in 4 RLS policies in `0004_multi_client.sql`) must be rewritten to check `account_capabilities.is_broker_staff` + `broker_id`
- `prevent_role_escalation` trigger should be dropped
- `profiles.role` check constraint must be relaxed or removed
- All 7 server actions that branch on `s.role === 'broker'` or `s.role === 'seller'` must be rewritten

### Recommendation

Before starting capabilities migration: document the buyer-requirements-in-user_metadata workaround as a known debt item and confirm the migration plan. This is the only data that will need a one-time export from user_metadata to a new DB table.

---

## Section 2: Dashboards / Workspace

### Current Routes

Authenticated routes confirmed from `src/app/(app)/`:
| Route | File | Purpose |
|---|---|---|
| `/dashboard/buyer` | `src/app/(app)/dashboard/buyer/page.tsx` | Saved listings, enquiries, matches |
| `/dashboard/seller` | `src/app/(app)/dashboard/seller/page.tsx` | Listings, leads, SLA |
| `/dashboard/broker` | `src/app/(app)/dashboard/broker/page.tsx` | Business listings, leads, team |
| `/dashboard/edit/[id]` | `src/app/(app)/dashboard/edit/[id]/page.tsx` | Edit listing |
| `/post-listing` | (separate) | Post listing wizard |

Admin routes confirmed from `src/app/admin/`:
`/admin`, `/admin/listings`, `/admin/clients`, `/admin/users`, `/admin/blog`, `/admin/blog/new`, `/admin/blog/[id]`, `/admin/content`, `/admin/seo`, `/admin/settings`, `/admin/theme`, `/admin/analytics`, `/admin/journey`, `/admin/redirects`, `/admin/notifications`

**No `/workspace` routes exist.** None of the proposed `/workspace/*` routes from `PLOTSS-ARCHITECTURE-DECISIONS.md` section 3 have been created. This is correct per decision (P3 deferred).

### Sidebar/Navigation

**`src/ui/dashboards/Shell.tsx`** is 11 lines. It renders a `<main>` with a title and subtitle — **no sidebar, no navigation links, no cross-dashboard links**. This is a P1 gap per the decisions doc (Option C hybrid: add cross-dashboard links).

Admin navigation: `src/app/admin/` has its own `AdminNav` with a full dark sidebar (separate from `Shell.tsx`). This is working correctly.

### Gap vs Approved /workspace Architecture

The approved P1 fix (add cross-dashboard nav links to `Shell.tsx`) has NOT been implemented. A seller cannot navigate to the buyer dashboard from the seller dashboard without manually editing the URL.

The approved P3 full `/workspace` consolidation has not started — correct per priority.

### Migration Risk

LOW. Shell.tsx is a simple wrapper with no state. Adding cross-nav links is additive and has no DB dependency.

### Recommendation

Implement the Option C hybrid before launch: add "Browse as Buyer" / "Switch to Seller" links to `Shell.tsx`. This is `src/ui/dashboards/Shell.tsx` — change is purely UI, no schema or action changes needed.

---

## Section 3: Listing Ownership Model

### Current Implementation

- `properties.owner_id` — FK to `profiles.id`: who posted the listing (set in `0001_init.sql` line 40)
- `properties.broker_id` — FK to `broker_profiles.id`: which client business owns the listing (nullable — null = FSBO) (added in `0002_listings_cms_seo.sql` line 52)
- `listing_contacts` table (`0002_listings_cms_seo.sql` line 62): `property_id`, `name`, `phone`, `owner_type` — holds the real contact, masked in app layer
- Triple-check authorization in server actions (`src/app/(app)/actions.ts`): `prop.owner_id === s.id || (s.brokerId && prop.broker_id === s.brokerId) || s.role === 'admin'`

### The Five Ownership Scenarios — Current Support Status

| Scenario | Status | Notes |
|---|---|---|
| A. Owner listing own property (FSBO) | SUPPORTED | `owner_id = user.id`, `broker_id = null`. `properties_owner_all` RLS policy covers this. |
| B. Broker listing client's property | SUPPORTED | `owner_id = staff.id`, `broker_id = client.id`. `properties_broker_staff` RLS covers all staff of the business. |
| C. Company owning land | SUPPORTED (partial) | Company registers as a seller `profiles` row. No company-profile type — company name is free text in `listing_contacts.name`. |
| D. Broker staff managing company listings | SUPPORTED | `is_broker_staff_for()` RLS function handles multiple staff per business. |
| E. Owner who is also a broker | NOT SUPPORTED | A `role='broker'` user has `broker_id` FK — ALL their listings are attributed to that business. Cannot post FSBO listings. Workaround: separate personal account. Flagged as ⚠️ BUSINESS DECISION in decisions doc. |

### Gap

Scenario E (owner who is also a broker) is not supported and cannot be without the capabilities model (P3). This is a known and documented limitation — acceptable for launch.

### Migration Risk

LOW for launch. When capabilities model is introduced, `properties_broker_staff` RLS policy (which calls `is_broker_staff_for()`) must be updated. The `is_broker_staff_for()` function currently checks `role = 'broker'` — this will break if `profiles.role` is removed.

### Recommendation

Document Scenario E explicitly in the capability-removal business decision (decision doc item 6 is already flagged). No code change needed for launch.

---

## Section 4: Enquiry System

### Current Implementation

- **Table**: `enquiries` in `0001_init.sql` line 65, extended in `0002_listings_cms_seo.sql` line 79
- Columns: `id`, `property_id`, `buyer_id`, `message`, `status` (default `'open'`), `created_at`, `kind` (`'enquiry' | 'unlock'`), `visit_date`
- Status values: stored as free text — `open`, `contacted`, `visit`, `closed` (hardcoded whitelist in `src/app/(app)/actions.ts:setLeadStatus` line 9)
- RLS: buyers insert own; owner/admin/broker-staff read; admin all (`0001_init.sql` lines 160–165; `0004_multi_client.sql` line 44)
- Server actions: `submitEnquiryAction` (buyer creates), `setLeadStatus` (seller/broker/admin updates)
- Buyer dashboard reads enquiries via `buyerData()` in `src/lib/db/dashboards.ts` (NOT VERIFIED content but referenced in audit)

### Gap vs Approved Lifecycle

The approved lifecycle (Sent → Viewed → Contacted → Site Visit → Closed) is partially implemented:
- `Sent` = `kind='enquiry'` on insert
- `Viewed` = NOT TRACKED — no trigger or action sets a "viewed" status when seller opens an enquiry
- `Contacted` = `status='contacted'` (seller manually sets via `setLeadStatus`)
- `Site Visit` = `status='visit'`
- `Closed` = `status='closed'`

Buyer has no visibility into the lead status — buyer can read their own enquiries (via `enquiries_read` RLS) but no buyer-facing status display exists. This is documented as intentional (P3-10 in backlog).

### Duplication Risk

`enquiries.kind` is `'enquiry' | 'unlock'` — the table serves dual duty as both an enquiry log and a contact-unlock log. The rate limit for unlocks uses `count enquiries where kind='unlock'`. This is a known design choice, not accidental duplication. No separate `leads` or `contacts` table exists.

### Recommendation

No changes needed for launch. Add the "Viewed" status trigger and buyer visibility display as P3-10 work.

---

## Section 5: Saved Properties

### Current Implementation

- **Table**: `saved_listings` in `0001_init.sql` line 74: composite PK `(user_id, property_id)`, FK to `profiles` and `properties`
- **RLS**: `saved_own` policy — self-read/write only
- **Server actions**: `src/app/(site)/saved-actions.ts` — `loadSavedIds()`, `setSaved()`, `mergeSaved()` — all DB-backed via service client
- **Client-side**: `src/ui/AppProvider.tsx` lines 59–101 — the `AppShell` component

### The Sync Gap

**Exact location**: `src/ui/AppProvider.tsx` lines 95–101:

```typescript
const toggleSave = useCallback((id: string) => {
  const on = !savedIds.includes(id);
  const next = on ? [...savedIds, id] : savedIds.filter((x) => x !== id);
  setSavedIds(next);  // optimistic UI update
  try { localStorage.setItem(SAVED_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  if (signedIn) void setSaved(id, on);  // fire-and-forget — errors silently discarded
}, [savedIds, signedIn]);
```

The problem: `void setSaved(id, on)` discards the return value. `setSaved()` returns `{ ok: false }` on RLS rejection or when `isDbReady()` returns false. The user sees the heart icon stay filled but the buyer dashboard (which reads from DB only) shows nothing saved. Additionally, localStorage is written before the DB write, so even a transient network failure leaves the state desynchronized across devices.

**Secondary race condition** (lines 81–93): when the user signs in, localStorage is merged into the DB via `mergeSaved()`. However, demo-mode IDs (format `plot-\d+`) pass the `UUID.test()` filter in `mergeSaved` — NOT VERIFIED — if they do not, demo saves are silently dropped on merge.

### Recommendation

Change line 101 to: `if (signedIn) { setSaved(id, on).catch(() => { /* revert optimistic */ }); }` — or better, remove the localStorage write entirely for signed-in users (localStorage as primary store for logged-out users only). This is the P1-7 fix already specified in the decisions doc.

---

## Section 6: Buyer Requirements

### Current Implementation

- **No `buyer_requirements` table** exists in any migration file
- **Workaround**: `src/app/(app)/requirement-actions.ts:saveRequirement()` (line 21–27) stores requirements as JSON in `auth.users.user_metadata.requirement` key via `svc.auth.admin.updateUserById()`
- Schema of stored object (`Requirement` type, line 8): `{ city: string, category: string, maxBudgetCr: number | null }`
- This data is NOT in the Postgres database — it lives in Supabase Auth's user metadata storage, invisible to RLS, SQL queries, and analytics

### Gap vs Approved Architecture

The approved architecture (`PLOTSS-ARCHITECTURE-RECOMMENDATIONS.md` section 7) proposes a `buyer_requirements` table with `user_id`, `city`, `category`, `min_area`, `max_area`, `max_price`, `created_at`. The current implementation:
- Stores only city, category, and budget (no area range)
- Is stored in auth metadata not a DB table
- Cannot be queried by SQL for match notifications
- Has no `created_at` audit trail
- The decisions doc says this is P2-5 (post-launch) — but the **code to write requirements already exists and is writing to the wrong location**

### Recommendation

This is an undocumented architectural divergence. Before the `buyer_requirements` table is created, add a note in `docs/29-agent-progress-tracker.md` that existing requirements stored in user_metadata will need a one-time migration script to populate the new table. The `saveRequirement` action must be updated when the table is created.

---

## Section 7: Document Upload & Verification

### Current Implementation

- **Table**: `verification_documents` in `0001_init.sql` line 57, extended in `0002_listings_cms_seo.sql` line 70
- Columns: `id`, `property_id`, `doc_type`, `file_url`, `status` (`pending|verified|rejected|action_required`), `category`, `doc_ref`, `verified_on`, `description`
- **Storage buckets** (`0002_listings_cms_seo.sql` line 219):
  - `listing-photos`: `public = true`, 5MB max, JPEG/PNG/WebP
  - `listing-docs`: `public = false`, 10MB max, PDF/JPEG/PNG
- Storage policies: `"docs owner insert"` — authenticated, folder = `auth.uid()::text`; `"docs owner or admin read"` — owner or admin
- **Guard trigger**: `guard_document_status` in `0002_listings_cms_seo.sql` line 191 — prevents owner from changing `status` to `verified`; `guard_property_moderation` prevents owner from setting `is_verified = true` directly
- **`signedDocUrl()`**: NOT FOUND in codebase (confirmed by audit). Admin cannot currently open uploaded private documents via the API. This is P1-9 in the backlog.

### Verification State Machine (Actual vs Approved)

| State | Actual in Code | Approved | Match? |
|---|---|---|---|
| Unverified (default) | `is_verified = false` (boolean) | `unverified` level | Functionally equivalent |
| AI screened | `properties.details.ai_screen` jsonb | `ai_screened` badge level | Partial — AI result stored but no separate badge |
| Documents submitted | `verification_documents` rows with `status='pending'` | `documents_submitted` level | Present in DB but no badge shown to buyer |
| Verified | `is_verified = true` via `recomputeVerified()` | `verified` level | Works but only if all docs `status='verified'` |

The approved multi-level verification state machine (P2 per decisions doc section 6) has not been implemented. The current boolean is correct for launch.

### Gaps

- `signedDocUrl()` function not found: admin cannot view uploaded verification documents (P1-9)
- `collectDocuments` feature flag is off by default — verification docs UI may not be surfaced to sellers currently

### Security Risks

- `listing-docs` bucket is private and RLS-correct. The storage policy `"docs owner or admin read"` is properly set.
- Without `signedDocUrl()`, docs are effectively inaccessible to admin — potential silent failure when admin tries to verify.

---

## Section 8: AI Screening

### Current Implementation

- `properties.details.ai_screen` — jsonb sub-object stored by `screenAndStore()` (referenced in audit, path: `src/lib/ai.ts` or similar — NOT directly read in this inspection)
- Feature flag: `aiScreening` (default `true`) controls whether screening runs
- Triggered after `submitListingAction` and `updateListingAction` — fire-and-forget via `void screenAndStore()`
- Result shown to admin only in listing approval queue (NOT shown to sellers or buyers)
- `humanReview` feature flag (default `false`) gates the "Verified" badge display

### Advisory vs Blocking — Current Behavior

**Advisory only**: `screenAndStore()` runs after the listing is submitted; it never blocks the submission or auto-rejects. The listing still goes to `pending` status regardless of the AI result. The AI result only appears in the admin queue as additional context.

### Gap vs Approved

The decisions doc `PLOTSS-ARCHITECTURE-DECISIONS.md` section 6 says AI screening is advisory only — this is correct. No gap for launch.

The open ⚠️ BUSINESS DECISION (should AI risk score block approval?) has not been answered. If the answer is "yes", new code would be needed in the admin `decideListing` action to warn admins when AI risk is high.

---

## Section 9: Notifications

### Current Implementation

- **Table**: `notifications` in `0006_notifications.sql`: `id`, `user_id`, `title`, `body`, `link`, `read`, `created_at`
- **RLS**: `notifications_self_read` (select), `notifications_self_update` (update read status), `notifications_admin` (admin all) — no insert policy for users; service role only
- **Welcome notification**: `0007_welcome_notification.sql` — triggers on new user signup via updated `handle_new_user()` trigger
- **Channels**: In-app (`notifyInApp` flag), email via Resend (`notifyEmail` flag), WhatsApp via MSG91 (`notifyWhatsapp` flag)
- **Email**: `RESEND_API_KEY` not configured — email notifications are a no-op. P0-2 blocker.
- **WhatsApp**: `MSG91_API_KEY` not configured — WhatsApp is a no-op.
- **In-app bell**: notification bell in `AppProvider`/Header — reads notifications table; `markNotificationsRead()` action in `src/app/(app)/actions.ts` line 14

### What Works vs What Is a No-Op

| Notification | Works? | Notes |
|---|---|---|
| Welcome notification on signup | WORKS | DB trigger in 0007 |
| Listing submitted (to admin) | WORKS (in-app) | `notify()` call in submit action |
| Listing approved/rejected (to seller/broker) | IN-APP ONLY | Email is no-op — P0-2 blocker |
| Staff invited (to invitee) | IN-APP ONLY | `notify()` call in `inviteStaffAction` |
| Mark notifications read | WORKS | `markNotificationsRead()` action |
| Email notifications | NO-OP | No `RESEND_API_KEY` |
| WhatsApp notifications | NO-OP | No `MSG91_API_KEY` |

---

## Section 10: Admin Authorization

### Current Implementation

- **Method**: `profiles.role = 'admin'` — single hardcoded email `dm@techbliss.in` set in `0002_listings_cms_seo.sql` line 237
- **`is_admin()` DB function**: `0001_init.sql` line 88 — used in every RLS policy that has admin access
- **`requireAdmin()` function**: referenced in audit at `src/lib/auth.ts` — has a dev bypass when Supabase is unconfigured and `NODE_ENV !== 'production'`
- **Dev bypass**: acceptable per audit (A1); guarded by env check
- **Multi-admin**: NOT supported — single `profiles.role = 'admin'` row. A second admin requires another `UPDATE profiles SET role = 'admin'` SQL call. No UI exists for this.

### RLS — Admin Policies

Every table has an `*_admin` policy using `is_admin()`. Confirmed in migrations:
- `profiles`: `profiles_self_read`, `profiles_self_update` — both include `is_admin()`
- `properties`: `properties_admin_all`
- `broker_profiles`: `broker_admin`
- `notifications`: `notifications_admin`
- `blog_posts`: `blog_admin`
- `seo_pages`: `seo_admin`
- `site_settings`: `settings_admin_write`
- `redirects`: `redirects_admin`
- `events`: `events_admin_read`
- All contact tables: admin-only policies

### Gap (Single Admin Risk)

- If `dm@techbliss.in` account is compromised, there is no second admin to revoke access
- No `admin_audit_log` table — no record of which admin action was taken when (P2-7)
- No UI to add a second admin — must be done via SQL

### Recommendation

Before launch: confirm whether a second admin is needed (⚠️ BUSINESS DECISION item 7 in decisions doc). Post-launch: implement `admin_audit_log` as P2-7.

---

## Section 11: RLS Policy Audit

### Confirmed Policies Across All Migrations

| Table | SELECT | INSERT | UPDATE | DELETE | Role Dependency | Risk if Role → Capabilities |
|---|---|---|---|---|---|---|
| `profiles` | `id = auth.uid() OR is_admin()` | (none — trigger creates row) | `id = auth.uid() OR is_admin()` | (none) | `is_admin()` uses `profiles.role` | HIGH — `is_admin()` must be rewritten |
| `cities` | `true` (public) | admin only | admin only | admin only | `is_admin()` | MEDIUM |
| `categories` | `true` (public) | admin only | admin only | admin only | `is_admin()` | MEDIUM |
| `properties` | `status='live' AND broker not suspended` | owner or admin | owner, broker_staff, or admin | owner, broker_staff, or admin | `is_admin()`, `is_broker_staff_for()` uses `role='broker'` | HIGH — both functions must be rewritten |
| `property_images` | live or owner or admin | owner or admin or broker_staff | same | same | `is_admin()`, `is_broker_staff_for()` | HIGH |
| `verification_documents` | owner or admin or broker_staff | same | same | same | `is_admin()`, `is_broker_staff_for()` | HIGH |
| `enquiries` | buyer_id=uid OR property owner OR admin OR broker_staff | buyer_id=auth.uid() | (admin policy) | (admin policy) | `is_admin()`, `is_broker_staff_for()` | HIGH |
| `saved_listings` | `user_id = auth.uid()` | `user_id = auth.uid()` | same | same | none | LOW — no role dependency |
| `site_settings` | `true` (public) | admin only | admin only | admin only | `is_admin()` | MEDIUM |
| `broker_profiles` | `verified OR user_id = uid OR is_admin()` + broker_staff read | admin only | owner (`user_id`) or admin | admin only | `is_admin()`, `is_broker_staff_for()` | HIGH |
| `broker_contacts` | admin only | admin only | admin only | admin only | `is_admin()` | MEDIUM |
| `listing_contacts` | admin only | admin only | admin only | admin only | `is_admin()` | MEDIUM |
| `seo_pages` | `true` (public) | admin only | admin only | admin only | `is_admin()` | MEDIUM |
| `blog_posts` | `status='published' OR is_admin()` | admin only | admin only | admin only | `is_admin()` | MEDIUM |
| `redirects` | `true` (public) | admin only | admin only | admin only | `is_admin()` | MEDIUM |
| `events` | admin only | (none — service role only) | n/a | n/a | `is_admin()` | MEDIUM |
| `rate_limit_hits` | (none) | (none) | n/a | n/a | none | LOW |
| `notifications` | `user_id = auth.uid()` | (none — service role only) | `user_id = auth.uid()` | n/a | `is_admin()` | MEDIUM |
| `storage.objects` (photos) | `true` | `bucket_id='listing-photos' AND folder=uid` | n/a | n/a | none | LOW |
| `storage.objects` (docs) | `folder=uid OR is_admin()` | `bucket_id='listing-docs' AND folder=uid` | n/a | n/a | `is_admin()` | MEDIUM |

**Policies that use `role = 'broker'` directly** (will break with capabilities migration):
- `is_broker_staff_for()` function (`0004_multi_client.sql` line 23): `and role = 'broker' and broker_id = target_broker`
- This function is called in 4 policies: `properties_broker_staff`, `images_broker_staff`, `vdocs_broker_staff`, `enquiries_broker_staff`, `broker_staff_read`

**Policies that use `is_admin()` directly** (will need `is_admin()` rewrite):
- Every table's admin policy — approximately 20 policy clauses total

---

## Section 12: EXISTING AND CORRECT
_(Features that already satisfy the approved architecture — reuse these)_

- `saved_listings` table and `saved-actions.ts` server actions — DB schema is correct; only the caller in `AppProvider.tsx` needs fixing
- `enquiries` table with `kind`, `status`, `visit_date` columns — covers the approved lifecycle states
- `properties_broker_staff` RLS policy and `is_broker_staff_for()` — correct multi-tenant scoping
- `guard_property_moderation` and `guard_document_status` triggers — prevent owner self-approval
- `listing_contacts` with masking in app layer — contact protection is correct
- `notifications` table and in-app channel — complete and working
- First-party analytics pipeline (`events` table, `TrackingProvider`, `/api/track`) — complete
- Admin panel with full CRUD — complete
- Blog system with RLS — complete (EEAT columns blocked by pending migration 0008)
- Listing lifecycle (draft → pending → live → sold/rejected) — complete
- SLA computation in `src/lib/sla.ts` — unit tested, working
- `rate_limit_hits` table for durable rate limiting — correct
- Storage buckets `listing-photos` (public) and `listing-docs` (private) with correct policies
- `broker_profiles` with `status` (active/suspended) and suspension hiding public listings via RLS
- `prevent_role_escalation` trigger (0002 version) — correctly allows service-role contexts

---

## Section 13: NEEDS MIGRATION
_(Existing implementations that conflict with approved architecture — list with exact files/tables)_

1. **Save sync gap** — `src/ui/AppProvider.tsx` lines 95–101: `toggleSave` uses `void setSaved()` (fire-and-forget) and localStorage as primary store. Must change to DB-primary with optimistic UI and error surfacing. (P1-7)

2. **Buyer requirements stored in wrong location** — `src/app/(app)/requirement-actions.ts` line 25: writes to `auth.users.user_metadata` instead of a DB table. When `buyer_requirements` table is created (P2-5), this action must be rewritten and existing data migrated.

3. **`adminListings()` missing LIMIT** — `src/lib/db/admin.ts:adminListings()` (NOT directly read but confirmed by audit). Must add `.limit()` and pagination before listing count grows. (P1-1)

4. **`Shell.tsx` missing cross-navigation** — `src/ui/dashboards/Shell.tsx` has no sidebar or cross-dashboard links. Must add links before launch per P1 decision. (Architecture decisions section 3, Option C)

5. **No middleware.ts** — missing entirely. Needed for `redirects` table consumption (P1-3). The absence also means no central auth guard — acceptable for now since all auth is in server components, but unusual.

---

## Section 14: MISSING
_(Features required by approved architecture that genuinely do not exist)_

1. **Migration 0008 not applied** — `supabase/migrations/0008_blog_eeat_aeo.sql` file exists but columns are not in live DB. User must run this SQL. (P0-1)

2. **`signedDocUrl()` function** — not found in codebase. Admin cannot open uploaded private verification documents. (P1-9)

3. **`Organization` + `WebSite` JSON-LD in root layout** — `src/lib/seo.ts` has the generators but NOT VERIFIED they are rendered in `src/app/layout.tsx`. (P0-3)

4. **CI/CD pipeline** — no `.github/workflows/` or equivalent found. (P0-4)

5. **Redirects table handler in middleware** — no `middleware.ts` exists; redirect rules configured in admin panel have no effect. (P1-3)

6. **`purge_old_events()` scheduler** — function exists in `0003_launch_cities_and_analytics.sql` line 45 but no cron or scheduled function is configured. (P1-4)

7. **Account deletion / DPDP** — no account deletion UI or server action. (P1-6)

8. **`suspended` listing status** — `properties.status` check constraint (line 39 of `0001_init.sql`) only allows `draft|pending|live|sold|rejected`. The `suspended` status does not exist. (P2-6)

9. **`admin_audit_log` table** — not in any migration. (P2-7)

10. **`buyer_requirements` table** — not in any migration. (P2-5)

11. **Staging Supabase project** — no second environment. (P1-5)

12. **Cross-dashboard navigation** — `Shell.tsx` has no nav links. (P1 hybrid fix)

13. **Onboarding welcome step** — no `/onboarding` route, no post-signup guidance. (P2-4)

---

## Section 15: DUPLICATION RISK
_(Existing features that must be reused instead of rebuilt)_

1. **`saved_listings` table + `saved-actions.ts`** — the DB model is complete and correct. Do NOT rebuild saved listings. Only fix the caller (`AppProvider.tsx:toggleSave`) to await the DB write. Any new workspace saved-listings page must use the existing `loadSavedIds()` / `setSaved()` / `mergeSaved()` server actions.

2. **`enquiries` table** — serves as both enquiry log AND contact-unlock log via `kind` field. Do NOT create a separate `leads` or `contacts` table. All buyer-enquiry status pages must read from this table.

3. **`notifications` table + `notify()` function** — complete in-app notification system. Any new notification type (e.g., "seller viewed your enquiry") must call `notify()` in `src/lib/notify.ts` rather than implementing a separate system.

4. **`broker_profiles` table** — already models both individual brokers (`user_id` FK) and client businesses (multiple staff via `profiles.broker_id`). Do NOT create a separate client or agency table.

5. **`site_settings` table** — stores all feature flags, theme tokens, SEO settings, and editable content as JSON keyed rows. Any new platform configuration must use this table (new key), not environment variables or hardcoded defaults.

6. **`events` table + `TrackingProvider`** — first-party analytics is complete. Do NOT add Google Analytics or any third-party tracker without a full consent architecture review. New user events must use `trackEvent()` in `TrackingProvider`.

7. **`is_admin()` DB function** — used in 20+ RLS policies. Do NOT bypass it by hardcoding email checks in app code. When the capabilities model is built, rewrite this one function and all policies update automatically.

---

## Section 16: RISK REGISTER

| Risk | Area | Severity | Notes |
|---|---|---|---|
| Migration 0008 not applied — blog admin errors | SEO/CMS | HIGH | P0 launch blocker. User must run SQL. |
| `void setSaved()` — silent save failures | UX/Trust | HIGH | Buyer saves appear filled but buyer dashboard is empty. Fix before launch. |
| `signedDocUrl()` missing — admin cannot view uploaded docs | Security/Ops | HIGH | Admin cannot complete document verification workflow. P1-9. |
| No CI/CD pipeline | DevOps | HIGH | Any push can silently break production. P0-4. |
| Buyer requirements in user_metadata — data will be orphaned | Data integrity | MEDIUM | When `buyer_requirements` table is created, existing data in user_metadata will not auto-migrate. |
| `is_broker_staff_for()` uses `role='broker'` directly | Security | HIGH (P3) | Will break all broker staff RLS when capabilities migration runs. Must be the first thing rewritten in CHUNK for capabilities. |
| `adminListings()` no LIMIT | Performance | MEDIUM | Will degrade/timeout as listing count grows. P1-1. |
| No staging Supabase project | DevOps | HIGH | Live E2E runs against production. P1-5. |
| Single admin account — no recovery path | Operations | MEDIUM | If `dm@techbliss.in` is locked out, no backup admin exists. |
| Dual `0004_` migration filename | DevOps | MEDIUM | `0004_multi_client.sql` and `0004_profile_phone_from_metadata.sql` both have prefix 0004. Applied order is ambiguous for any automated tooling. |
| No `middleware.ts` | SEO/Ops | MEDIUM | Admin-configured redirects have no effect. P1-3. |
| `purge_old_events()` unscheduled | Privacy/DPDP | MEDIUM | Analytics events accumulate indefinitely. P1-4. |
| `inviteStaffAction` caps user search at 1000 | Scalability | LOW | Silent failure beyond 1000 users. P2 fix. |
| `Hero3D.tsx` dead code with heavy deps | Performance | LOW | `@react-three/fiber` and `three` in production dependencies. |
| No account deletion / DPDP | Legal | MEDIUM | India DPDP Act requires right-to-erasure. P1-6. |

---

## Section 17: Recommended Chunk Sequence

> **⚠️ REVISED 2026-10-07**: Multi-capability model is now a **pre-launch requirement** (decision confirmed by product owner). The sequence below reflects this. Capabilities work is no longer P3/post-launch — it is the largest pre-launch architecture chunk.

### Revised Pre-Launch Sequence

**CHUNK 1 — Launch Blockers (no schema change)**
- Run migration 0008 (user action — unblocks blog EEAT admin)
- Verify / add `Organization` + `WebSite` JSON-LD to `src/app/layout.tsx`
- Configure `RESEND_API_KEY` and enable `notifyEmail` flag
- Set up CI/CD pipeline

**CHUNK 2 — P1 Code Fixes (no schema change, can run in parallel with CHUNK 1)**
- Fix `adminListings()` — add `.limit()` + pagination (`src/lib/db/admin.ts`)
- Remove dead npm dependencies (`react-simple-maps`, `d3-geo`, verify `Hero3D.tsx`)
- Fix `toggleSave` in `src/ui/AppProvider.tsx` — DB-primary, await result (save sync fix)
- Add cross-dashboard nav links to `src/ui/dashboards/Shell.tsx` (hybrid transitional nav)

**CHUNK 3 — Capabilities Schema Design (no code yet — design and approve only)**
Before writing a single migration, produce the complete schema design for review:
- `account_capabilities` table columns and constraints
- `buyer_requirements` table (replaces user_metadata workaround)
- Data migration plan: existing `profiles.role` → capabilities rows
- Rewrite spec for `is_broker_staff_for()` and `is_admin()` DB functions
- List of every server action that branches on `s.role` that must be updated
- List of every dashboard page that uses `requireRole()` that must be updated
- Backward-compatibility alias plan (keep `profiles.role` column or drop?)

**CHUNK 4 — Capabilities Migration (DB + RLS, additive)**
- New migration: `account_capabilities` table + `buyer_requirements` table
- Rewrite `is_broker_staff_for()` to use `account_capabilities` (not `role='broker'`)
- Rewrite `is_admin()` to use `account_capabilities` (not `role='admin'`) — or keep for now if safe
- Data backfill: copy existing `profiles.role` values into `account_capabilities`
- `prevent_role_escalation` trigger dropped (replaced by capabilities model)
- Update `handle_new_user()` trigger to populate `account_capabilities`
- **No UI changes yet** — verify all existing functionality still works with new schema

**CHUNK 5 — Capabilities Server Actions + Auth Layer**
- Update `getSession()` to return capabilities instead of single role
- Update `requireRole()` to check capabilities
- Update `submitListingAction`, `updateListingAction`, `setLeadStatus`, `inviteStaffAction`, `changeRole` (replace with `addCapability`/`removeCapability`)
- Migrate `saveRequirement` from user_metadata → `buyer_requirements` table
- Admin: add `addCapability` / `removeCapability` actions

**CHUNK 6 — Onboarding + Capability Selection UI**
- Post-signup capability selection step (`/onboarding` route)
- Account settings: add/remove capability UI
- Admin: assign broker-staff capability with `broker_id`

**CHUNK 7 — Workspace Navigation Consolidation**
- Full `/workspace/*` routes replacing the three separate dashboards
- Capability-driven sidebar (items shown/hidden by `can_buy`, `can_sell`, `is_broker_staff`)
- Deprecate `/dashboard/buyer`, `/dashboard/seller`, `/dashboard/broker` (keep as redirects)

**CHUNK 8 — Security / Ops / DPDP**
- Staging Supabase project setup
- Schedule `purge_old_events()` via Supabase cron
- Implement account deletion flow (DPDP P1-6)
- Implement `signedDocUrl()` for admin document viewing (P1-9)
- Wire `redirects` table in new `middleware.ts`
- `admin_audit_log` table + RLS

**CHUNK 9 — UI Migration + Performance**
- `generateStaticParams` for listing detail pages (ISR)
- Fix dual UI systems — `HomeScreen`/`SearchScreen`/`PropertyDetailScreen` DB-primary saves
- `suspended` listing status

**CHUNK 10 — Testing + Launch Hardening**
- Full E2E test pass across all capability combinations
- RLS security test matrix (buyer, seller, broker, mixed)
- Performance audit: dead deps removed, ISR confirmed

**Post-launch (deferred)**
- Buyer enquiry status visibility
- WhatsApp/MSG91 provider
- `admin_audit_log` UI
- Micro-market SEO pages
- Dark mode

**Hidden dependency confirmed from codebase**: CHUNK 4 (DB migration) must complete before CHUNK 5 (server actions) because the capabilities table must exist before `getSession()` can read from it. CHUNK 3 design review must be approved before CHUNK 4 starts.

---

## Section 18: Pre-Chunk-1 Checklist

> **Revised 2026-10-07**: Capabilities model is now pre-launch. CHUNK 1 (launch blockers) can start immediately. CHUNK 3 (capabilities schema design) requires the business decisions below to be answered first.

List every item that must be confirmed/decided before CHUNK 1 (launch blockers) begins:

- [ ] **Run migration 0008** — user runs `supabase/migrations/0008_blog_eeat_aeo.sql` in SQL Editor. Verify by checking `blog_posts` table columns include `key_takeaways`, `faq`, `author_role`, `author_bio`.
- [ ] **Confirm `RESEND_API_KEY`** — pick an email provider (Resend recommended per existing code), create API key, add to environment, then flip `notifyEmail` to `true` in `/admin/settings`.
- [ ] **Confirm admin email recovery plan** — is there a plan for a second admin before launch? If yes, run `UPDATE profiles SET role = 'admin' WHERE id = (SELECT id FROM auth.users WHERE email = 'second@email.com')` as a one-off SQL.
- [ ] **⚠️ BUSINESS DECISION: What does "Verified" mean to a buyer?** — RERA-checked, document-checked, or admin-approved? Affects trust signal wording on listing cards.
- [ ] **⚠️ BUSINESS DECISION: Should AI screening block approval or stay advisory?** — current code is advisory-only; if answer changes, `decideListing` admin action must be updated.
- [ ] **⚠️ BUSINESS DECISION: Is the onboarding welcome step skippable?** — determines whether post-signup redirect is mandatory or optional.
- [ ] **⚠️ BUSINESS DECISION: Can users remove capabilities after adding them?** — required before capabilities migration (P3) scoping can begin.
- [ ] **⚠️ BUSINESS DECISION: Should broker staff be allowed personal FSBO listings?** — determines scope of Scenario E fix in capabilities migration.
- [ ] **Verify `Organization` + `WebSite` JSON-LD** — check `src/app/layout.tsx` for `<script type="application/ld+json">` tags using `orgLd()` and `websiteLd()` from `src/lib/seo.ts`. Add if missing.
- [ ] **Confirm migration 0004 applied order** — both `0004_multi_client.sql` and `0004_profile_phone_from_metadata.sql` must have been applied in the correct order. Check that `profiles.broker_id` column exists (multi_client) AND that the phone-from-metadata trigger update was applied after. Add a comment or rename doc to record the order.
- [ ] **Confirm `features.brokers` is ON in live DB** — per progress tracker it is on; verify in `/admin/settings` before launch so broker public profiles are visible.
- [ ] **Confirm Hero3D.tsx is dead code** — check if `Hero3D.tsx` is imported anywhere in active code paths. If dead, remove `@react-three/fiber` and `three` from `package.json`.
- [ ] **Confirm NEXT_PUBLIC_WHATSAPP_NUMBER is set** — the `MobileActionBar` on listing detail pages may have a broken WhatsApp CTA if this env var is missing.
- [ ] **Confirm `NEXT_PUBLIC_SITE_URL` is set in production** — used in SEO canonical URLs and OG metadata.
