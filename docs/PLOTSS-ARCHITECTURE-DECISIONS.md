# PLOTSS Architecture Decisions
_Generated: 2026-10-05. Updated: 2026-10-07._
_Status: ACTIVE — multi-capability model is a PRE-LAUNCH requirement (decision confirmed 2026-10-07)._

> **⚠️ IMPORTANT REVISION (2026-10-07)**
> The multi-capability account model is no longer deferred to P3/post-launch.
> It is a **pre-launch architecture requirement**.
> Every section below that previously said "P3 — after launch" now reads "PRE-LAUNCH".
> See Section 1 Recommended Model and Section 10 Final Decision Table for updated priorities.

---

## 1. User Identity Model

### Current Implementation

`profiles.role` is a single `text` column constrained to `'buyer' | 'seller' | 'broker' | 'admin'` (source: `supabase/migrations/0001_init.sql`, line 7). One role per user — mutually exclusive.

- New users are created with `role = 'buyer'` by the `handle_new_user()` trigger (`0001_init.sql` line 96).
- `prevent_role_escalation` trigger allows only `buyer → seller` or `buyer → broker` self-upgrades; admin changes are unrestricted when called from the service role.
- `profiles.broker_id` (added in `0004_multi_client.sql`) links a `role='broker'` user to their business (`broker_profiles` row). This is set only by admin via `changeRole` server action.
- Admin is a single hardcoded email (`dm@techbliss.in`) set via migration 0002.
- `requireRole()` in `src/lib/session.ts` gates dashboard pages at the app layer. `is_admin()` DB function (`0001_init.sql`) is used by RLS.

**Evidence of limitation**: A seller who wants to browse listings is stuck with a seller dashboard — they cannot access buyer features without manually typing `/dashboard/buyer`. The `prevent_role_escalation` trigger prevents them from downgrading back to buyer. Source: `PLOTSS-CODEBASE-AUDIT.md` section 3 and section 13.

### Comparison Table

| Question | Current | Recommended | Decision |
|---|---|---|---|
| Can one account be Buyer + Seller? | NO — single role enum | YES — `can_buy=true` by default; user opts into `can_sell` | **PRE-LAUNCH REQUIREMENT** |
| Can one account be Buyer + Broker? | NO | YES — `can_buy=true` + `is_broker_staff=true` | **PRE-LAUNCH REQUIREMENT** |
| Can one account be Seller + Broker? | NO (broker role covers this at business level) | YES — `can_sell=true` + `is_broker_staff=true` | **PRE-LAUNCH REQUIREMENT** |
| Can one account have all three? | NO | YES | **PRE-LAUNCH REQUIREMENT** |
| How should Admin be represented? | `profiles.role = 'admin'` single value | Separate concept entirely — NOT in the capabilities row | Keep `is_admin()` path; migrate to DB-backed multi-admin table pre-launch |
| How should Broker Staff be represented? | `role='broker'` + `broker_id FK` | `is_broker_staff=true` + `broker_id FK` in `account_capabilities` | **PRE-LAUNCH — migrate from role column** |
| How can capabilities be added later? | Cannot — role change is one-way | User opens "Account settings → Add capability" | Onboarding step + settings page, pre-launch |
| Can a user remove a capability? | N/A | `can_sell` and `is_broker_staff`: ⚠️ BUSINESS DECISION — does removing `can_sell` hide listings or just remove dashboard access? | Must decide before implementing capability removal UI |
| Which capabilities require admin approval? | Admin assigns broker role manually | `is_broker_staff`: YES — admin assigns (as today). `can_sell`: NO — self-service | Matches current model |
| Which capabilities can user self-enable? | `buyer → seller` upgrade once | `can_sell`: self-service. `can_buy`: automatic at signup | Simpler than current |

### Recommended Model (Conceptual)

Every account starts with the ability to browse and save listings (buyer capability, automatic). Users may additionally opt into the ability to post and manage listings (seller capability, self-service, no admin involvement). Admin staff of a client business get an additional capability (broker staff) which scopes them to that business's inventory — this is admin-assigned as it is today.

Admin remains outside this model entirely: it is a global override on a separate path, not a capability that can be combined with others.

The `prevent_role_escalation` trigger becomes unnecessary and should be dropped when capabilities are introduced. The `profiles.role` column can be kept as a backward-compatibility alias, materialized from the capabilities table.

**Implementation priority**: **PRE-LAUNCH** (revised 2026-10-07). The single-role model must be migrated to the capabilities model before production launch. The migration affects profiles, RLS, server actions, dashboard navigation, and authorization helpers. It must be sequenced carefully after the launch blockers (P0) and before the workspace navigation work.

---

## 2. Onboarding Flow

### Current State

After signup there is no onboarding. The `handle_new_user()` trigger creates a `profiles` row with `role = 'buyer'` and `full_name`/`phone` from auth metadata. The user lands on the homepage. There is no guided path to either browse or post a listing. Source: `PLOTSS-CODEBASE-AUDIT.md` section 14.

Routes after signup:
- No `/onboarding` route exists.
- A new seller must navigate to `/post-listing` manually or find the nav CTA.
- Role upgrade (buyer → seller) happens implicitly when the user tries to post a listing — the server action `submitListingAction` requires seller or broker role; the UI for role change is NOT_VERIFIED as clearly presented.

### Recommended Flow

```
Signup (email/Google/OTP)
  ↓
Welcome step [REQUIRED]
  "What brings you to PLOTSS?"
  → "I want to find land"  → can_buy confirmed, go to /search  [SELF-SERVICE]
  → "I want to list land"  → role set to seller, go to /post-listing  [SELF-SERVICE]
  → "I represent an agency" → request form sent to admin  [ADMIN-APPROVED]
  ↓ (for "I want to find land" path only)
Buyer requirements [OPTIONAL]
  City, category, area range, budget → saved as buyer_requirements row (future)
  "Skip for now" always available
  ↓
Workspace (dashboard appropriate to capabilities)
```

| Step | Status |
|---|---|
| Signup (auth) | REQUIRED — already implemented |
| Welcome step (capability selection) | REQUIRED — NOT YET BUILT |
| Buyer requirements | OPTIONAL — NOT YET BUILT, depends on `buyer_requirements` table (not yet in schema) |
| Seller onboarding (shortcut to post-listing) | OPTIONAL — `/post-listing` exists, needs to be surfaced |
| Broker onboarding (agency request form) | ADMIN-APPROVED — NOT YET BUILT |

**⚠️ BUSINESS DECISION**: Should the welcome step be skippable? If skipped, the user gets buyer capability by default (same as today). This is the recommended default.

---

## 3. Workspace / Dashboard Architecture

### Current State

Three separate dashboards, each a different route, no sidebar, minimal top bar shared:

| Route | Exists | Navigation |
|---|---|---|
| `/dashboard/buyer` | YES (`PARTIALLY_WORKING`) | Top bar only: PLOTSS logo, Browse, Post |
| `/dashboard/seller` | YES (`WORKING`) | Same top bar |
| `/dashboard/broker` | YES (`WORKING`) | Same top bar |
| `/admin` + sub-routes | YES (`WORKING`) | Full dark sidebar (`AdminNav`) |

Source: `PLOTSS-CODEBASE-AUDIT.md` section 13. Dashboard shell: `src/ui/dashboards/Shell.tsx`.

A seller who wants to browse as a buyer has no UI path — they must manually type `/dashboard/buyer`. There is no cross-dashboard navigation.

### Options

**A. Keep separate dashboards**: Three routes, add links between them in the top bar. Minimal effort, addresses the immediate navigation gap.

**B. Merge into one capability-based workspace** (`/workspace`): Single shell with a sidebar, sections shown/hidden by capability. Higher effort but scales with capabilities model.

**C. Hybrid (recommended for launch)**: Keep the three routes as-is, add "Switch to buyer view" / "Switch to seller view" links to the top bar. This requires only a navigation change (no DB migration, no new schema). Plan route consolidation as part of the capabilities model migration (P3).

### Recommendation

**Option C — Hybrid** as the immediate P1 fix (add cross-dashboard nav links to `Shell.tsx`). This unblocks the navigation gap with no DB migration.

**Revised**: Because the capabilities model is now pre-launch, the full `/workspace` consolidation (Option B) is a **pre-launch goal**, not P3. The hybrid state (separate routes + cross-nav links) is the **transitional state** while the capabilities migration is in progress. Once `account_capabilities` is live, the workspace routes should replace the separate dashboards. The `/workspace` consolidation is sequenced AFTER the capabilities schema migration completes.

### Proposed Sidebar IA

The following represents the full future state for the `/workspace` route (Option B, P3). The current state equivalents are noted.

#### Sidebar Items — Future `/workspace` Route

| Label | Route (proposed) | Capability Required | Data Source | Currently Exists? | Needs Migration? | Auth Required? |
|---|---|---|---|---|---|---|
| Browse Listings | `/search` | any (buyer default) | `properties` table | YES | NO | NO (public) |
| Saved Listings | `/workspace/saved` | `can_buy` | `saved_listings` | YES as `/dashboard/buyer` | NO | YES |
| My Enquiries | `/workspace/enquiries` | `can_buy` | `enquiries` | PARTIAL (no status shown) | NO | YES |
| My Listings | `/workspace/listings` | `can_sell` | `properties` (owner_id) | YES as `/dashboard/seller` | NO | YES |
| Leads Inbox | `/workspace/leads` | `can_sell` | `enquiries` (property join) | YES | NO | YES |
| Business Listings | `/workspace/listings` (broker scope) | `is_broker_staff` | `properties` (broker_id) | YES as `/dashboard/broker` | NO | YES |
| Team | `/workspace/team` | `is_broker_staff` | `profiles` (broker_id) | YES (inline in broker dashboard) | NO | YES |
| Notifications | `/workspace/notifications` | any authenticated | `notifications` | PARTIAL (bell icon only) | NO | YES |
| Account Settings | `/workspace/settings` | any authenticated | `profiles` | NO | NO | YES |

#### Sidebar Views by Capability Combination

**Buyer only**: Browse Listings, Saved Listings, My Enquiries, Notifications, Account Settings

**Seller only**: Browse Listings, My Listings, Leads Inbox, Notifications, Account Settings

**Broker only**: Browse Listings, Business Listings, Leads Inbox, Team, Notifications, Account Settings

**Buyer + Seller**: Browse Listings, Saved Listings, My Enquiries, My Listings, Leads Inbox, Notifications, Account Settings

**Buyer + Broker**: Browse Listings, Saved Listings, My Enquiries, Business Listings, Leads Inbox, Team, Notifications, Account Settings

**Seller + Broker**: Browse Listings, My Listings, Business Listings, Leads Inbox, Team, Notifications, Account Settings

**All three**: Full sidebar — all items above

**Admin**: Separate application at `/admin` with its own `AdminNav` — does not use the workspace sidebar

---

## 4. Listing Ownership Model

### Current Schema

From migrations:
- `properties.owner_id` → FK to `profiles.id` — who posted the listing (FSBO seller or broker staff who created it)
- `properties.broker_id` → FK to `broker_profiles.id` — which client business owns/manages this listing (nullable — null means FSBO)
- `listing_contacts.property_id` → FK to `properties` — holds the owner's real phone/name, masked in public reads

Source: `0001_init.sql` (properties table), `0004_multi_client.sql` (broker_id column context).

### Five Scenarios

**A. Owner listing their own land (FSBO)**
- `properties.owner_id = user.id`, `properties.broker_id = null`
- Current schema: SUPPORTED
- RLS: `properties_owner_all` policy covers this

**B. Broker listing land for a client business**
- `properties.owner_id = staff_user.id`, `properties.broker_id = client.id`
- Current schema: SUPPORTED
- RLS: `properties_broker_staff` covers all staff in that business
- Gap: the actual land owner is a third party (their client), not the staff member. `listing_contacts` holds this third party's number, but there is no "underlying owner" entity in the schema separate from the broker staff poster. The `listing_contacts.owner_type` field partially addresses this conceptually but does not create a relational link.

**C. Company owning land**
- Treated as FSBO — the company registers an account and posts as seller
- Current schema: SUPPORTED (company is just a `profiles` row)
- Gap: no "company profile" type — the seller profile is always individual. Company name appears only in `listing_contacts.name` free-text field.

**D. Broker staff managing company listings**
- Same as Scenario B from the schema perspective — `broker_id` points at the client business, any staff member can manage it
- Current schema: SUPPORTED fully via `is_broker_staff_for()` RLS function

**E. Owner who is also a broker**
- With current single-role model: NOT SUPPORTED cleanly. A `role='broker'` user has `broker_id` pointing to a client business, which means ALL their listings are attributed to that business. They cannot also post an FSBO listing attributed only to themselves.
- Workaround today: admin creates a listing on their behalf, or they register a separate personal account.
- With capabilities model: SUPPORTED — `is_broker_staff=true` for business listings, `can_sell=true` independently for personal FSBO listings.

### Recommended Conceptual Model

A **User** can post listings in two modes:

1. **Personal mode** (`owner_id = user, broker_id = null`): they own the land themselves or represent themselves as an individual FSBO seller.
2. **Business mode** (`owner_id = poster_staff, broker_id = client_business`): they post on behalf of the client business. The business owns the listing — any staff member of that business can manage it.

The underlying land owner (a third party the broker represents) is captured only in `listing_contacts.name` (free text, masked). There is no "Owner" entity separate from the posting user in the current schema. This is acceptable for launch but creates a trust gap — buyers cannot verify that the broker actually represents the land owner.

**Cardinalities**:
- One User → many Properties (as owner_id, FSBO)
- One Client Business → many Properties (as broker_id)
- One Property → one ListingContacts row (the raw contact, private)
- One Client Business → many Staff Users (via profiles.broker_id)

### Risk: Duplication / Orphan Risks

- If a broker staff member's `profiles.broker_id` is somehow changed to point to a different client (e.g., admin error in `/admin/users`), that user instantly gains RLS access to the new client's listings. No audit trail exists for this change today.
- A listing with `broker_id` set but the client subsequently suspended becomes hidden from the public marketplace (correct per RLS) but remains visible to the broker's staff (also correct). If admin later deletes the `broker_profiles` row, `properties.broker_id` would become an orphan (FK is not cascade-delete). This scenario is not fully tested.

---

## 5. Authorization / Permission Matrix

| Action | Anonymous | Buyer | Seller | Broker Staff | Admin |
|---|---|---|---|---|---|
| Search/browse public listings | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED |
| View listing detail (public fields) | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED |
| See owner contact (masked) | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED |
| Unlock owner contact (real number) | DENIED | ALLOWED (rate-limited 20/day) | ALLOWED | ALLOWED | ALLOWED |
| Submit enquiry | DENIED | ALLOWED | ALLOWED | ALLOWED | ALLOWED |
| Save listing | DENIED (localStorage only) | ALLOWED (DB) | ALLOWED | ALLOWED | ALLOWED |
| Post new listing | DENIED | DENIED | ALLOWED (own) | ALLOWED (broker scoped) | ALLOWED |
| Edit own listing | DENIED | DENIED | OWN_ONLY | OWN_BROKER_ONLY | ALLOWED |
| Mark listing sold | DENIED | DENIED | OWN_ONLY | OWN_BROKER_ONLY | ALLOWED |
| Delete listing | DENIED | DENIED | DENIED | DENIED | DENIED (intentional) |
| View seller dashboard (own listings) | DENIED | DENIED | ALLOWED | ALLOWED | ALLOWED |
| View leads/enquiries for a listing | DENIED | DENIED | OWN_ONLY | OWN_BROKER_ONLY | ALLOWED |
| Set lead status (open/contacted/etc) | DENIED | DENIED | OWN_ONLY | OWN_BROKER_ONLY | ALLOWED |
| Invite team members | DENIED | DENIED | DENIED | ALLOWED (own broker only) | ALLOWED |
| Upload verification documents | DENIED | DENIED | OWN_ONLY | OWN_BROKER_ONLY | ALLOWED |
| Approve/reject listing | DENIED | DENIED | DENIED | DENIED | ALLOWED |
| Create/edit client business | DENIED | DENIED | DENIED | DENIED | ALLOWED |
| Suspend client business | DENIED | DENIED | DENIED | DENIED | ALLOWED |
| Assign user to client | DENIED | DENIED | DENIED | DENIED | ALLOWED |
| Edit blog posts | DENIED | DENIED | DENIED | DENIED | ALLOWED |
| Edit site settings/theme/SEO | DENIED | DENIED | DENIED | DENIED | ALLOWED |
| View analytics | DENIED | DENIED | DENIED | DENIED | ALLOWED |

#### Enforcement Notes

| Action | Current Enforcement | Gap? |
|---|---|---|
| Unlock owner contact | `requireRole()` + rate limit (DB) + RLS service bypass | SUFFICIENT |
| Post listing | `getSession()` checks role in `submitListingAction` | SUFFICIENT for launch |
| Edit listing | Triple auth check: `owner_id OR broker_id OR admin` in `updateListingAction` | SUFFICIENT — verified in audit |
| Mark sold | Same triple auth check in `markListingSold` | SUFFICIENT |
| Set lead status | Same triple auth check in `setLeadStatus` | SUFFICIENT |
| Invite team | `getSession()` checks `brokerId` present in `inviteStaffAction` | SUFFICIENT |
| Admin actions | `requireAdmin()` in all admin actions | SUFFICIENT — dev-bypass gated by env |
| Anonymous saving | UI only (localStorage) — no server mutation | RISK: saved state not durable; syncs to DB only on login |

---

## 6. Verification Architecture

### Current States

From `0001_init.sql` and codebase audit:
- `properties.is_verified` — boolean, computed by `recomputeVerified()` function in server actions
- `verification_documents.status` — `pending | verified | rejected` per document
- `guard_document_status` trigger — prevents owner from changing document status to `verified`
- `properties.details.ai_screen` — jsonb field, populated by `screenAndStore()` fire-and-forget
- Feature flags: `collectDocuments` (default off), `aiScreening` (default on), `humanReview` (default off)
- Source: `PLOTSS-CODEBASE-AUDIT.md` sections 7, 8 and migration `0001_init.sql`

### Proposed State Machine

```
[property posted]
       ↓
   pending ──→ (admin reviews) ──→ rejected
       ↓                                ↓
   [if aiScreening on]          [seller edits + resubmits]
       ↓                                ↓
  ai_screened ←───────────────────────←┘
       ↓
   [if collectDocuments on]
       ↓
  documents_submitted
       ↓
   [admin manually verifies docs]
       ↓
    verified (is_verified = true)
```

| State | Who Triggers | Public User Sees | Admin Sees | Resets on Edit? |
|---|---|---|---|---|
| `pending` | Seller submits (`submitListingAction`) | "Under review" badge | In review queue with SLA badge | YES — any edit resets to pending |
| AI screened | `screenAndStore()` fire-and-forget | No change visible | "AI screened: low risk" label in admin queue | YES — edit resubmits, AI rescreens |
| `documents_submitted` | Seller uploads verification docs | "Documents submitted" badge (if `collectDocuments` on) | Document review section in admin | ⚠️ BUSINESS DECISION — should uploading new docs after rejection reset the AI screen? |
| `verified` | Admin approves all docs via `decideDocument()` + `recomputeVerified()` | "Verified" badge (if `humanReview` flag on) | Green verified tag | ⚠️ BUSINESS DECISION — does a material edit (price, area) un-verify the listing? |
| `rejected` | Admin rejects via `decideListing()` | "Not approved — see dashboard" | Red rejected tag with note | YES — re-edit sends back to pending |
| `live` | Admin approves via `decideListing()` + `setListingStatus('live')` | Full public listing | Listed with verification badge level | YES — any edit resets to pending |

### Legal/Trust Flags

- ⚠️ BUSINESS DECISION: Should AI screening block listing approval (i.e., "if AI flags high risk, require manual review before publishing") or remain advisory only? Currently advisory only.
- ⚠️ BUSINESS DECISION: What does "verified" mean to a buyer? Is it RERA-checked, document-checked, or just admin-approved? This affects trust signals and potential legal liability.
- ⚠️ BUSINESS DECISION: If a seller edits price or area after verification, should `is_verified` be reset to false? Currently, any edit resets status to `pending` and triggers `recomputeVerified` but the final `is_verified` state depends on document status — document statuses do NOT reset on an edit.

---

## 7. Old UI vs New UI Migration Strategy

### Inventory

**`src/ui/screens/*` (Old system)**

| File | Purpose | Uses localStorage? | Status |
|---|---|---|---|
| `HomeScreen.tsx` | Homepage, hero, featured listings, search | YES (via AppProvider/AppShell.toggleSave) | Active, on `/` |
| `SearchScreen.tsx` | Full-text search, filters, listing grid | YES (saved state via AppProvider) | Active, on `/search` |
| `PropertyDetailScreen.tsx` | Listing detail, contact unlock, enquiry | YES (save toggle) | Active, on `/listing/[slug]` |
| `PostPropertyScreen.tsx` | Post listing wizard | NO (server action) | Active, on `/post-listing` |
| `BrokerProfileScreen.tsx` | Public broker/client profile | NO | Active, on `/broker/[id]` |

**`src/ui/dashboards/*` (New system)**

| File | Purpose | Uses localStorage? | Status |
|---|---|---|---|
| `Shell.tsx` | Dashboard wrapper, top bar | NO | Active, all dashboards |
| `BuyerDashboard.tsx` | Buyer: saved, contacted, matches | NO (reads DB via `buyerData()`) | Active, `/dashboard/buyer` |
| `SellerDashboard.tsx` | Seller: listings, leads, SLA | NO | Active, `/dashboard/seller` |
| `Dashboards.tsx` | Broker dashboard composition | NO | Active, `/dashboard/broker` |
| `LeadsInbox.tsx` | Lead management component | NO | Active, seller/broker dashboards |
| `EditListingForm.tsx` | Edit listing form | NO | Active, `/dashboard/edit/[id]` |

### Saved-Listing Sync Problem

The race condition: a user browses listings while logged in, saves one via `HomeScreen` or `PropertyDetailScreen`. The old `AppShell.toggleSave` writes to `localStorage` AND attempts to write to `saved_listings` DB via `setSaved()`. The buyer dashboard at `/dashboard/buyer` reads from `buyerData()` which queries `saved_listings` DB table only. In **live mode** (Supabase configured), saves should propagate to DB. In **demo mode** (no Supabase), DB writes are no-ops and the buyer dashboard shows nothing even though the heart icon is filled. This is documented as a known issue in `e2e/buyer-dashboard.spec.ts` and `docs/25-agent-architecture.md`.

The deeper issue: even in live mode, if the `setSaved()` DB write fails silently (network error, RLS rejection), the localStorage write succeeds and the heart icon stays filled, but the buyer dashboard never shows the saved listing. The user experiences a silent loss of state.

### Migration Strategy Options

**A. Big bang**: Replace `HomeScreen`, `SearchScreen`, `PropertyDetailScreen` with server-rendered equivalents using DB-backed saved state in one milestone. No more localStorage.

**B. Gradual** (recommended for near-term): 
1. Fix the save sync gap first (make `toggleSave` await the DB write and surface errors — or remove the localStorage write entirely and go DB-only).
2. Leave `HomeScreen` and `SearchScreen` as client components but switch their save mechanism to DB-only (with optimistic UI via React state, not localStorage).
3. Migrate `PropertyDetailScreen` to a server/client hybrid as part of the listing detail improvement pass.
4. `PostPropertyScreen` is already fine — no localStorage.

**C. Parallel (avoid)**: Maintaining both systems with a sync layer adds complexity without benefit. The sync is the source of the current bug.

### Recommendation: Option B (Gradual)

The localStorage dependency is the only dangerous part of the old system. The rest of `HomeScreen`, `SearchScreen`, `PropertyDetailScreen` functions correctly. Fix the save mechanism before launch (P1-7 in backlog), then migrate the screens one at a time.

### Components Safe to Keep As-Is
- `PostPropertyScreen.tsx` — no localStorage, server action based
- `BrokerProfileScreen.tsx` — no localStorage
- All `src/ui/dashboards/*` — already DB-backed

### Components That Must Be Migrated Before Launch
- Save/favourite mechanism in `HomeScreen.tsx`, `SearchScreen.tsx`, `PropertyDetailScreen.tsx` — change from localStorage-primary to DB-primary with in-memory optimistic UI. The `AppShell.toggleSave` and `AppProvider` localStorage save path should be replaced.

### Components That Can Be Migrated Post-Launch
- Full server-component replacement of `HomeScreen`, `SearchScreen`, `PropertyDetailScreen` (the visual/rendering migration, not the save-sync fix)
- `CompareTray` component — stays in old system, acceptable for launch
- `AppProvider` context — remove after all localStorage consumers are migrated

---

## 8. Public Marketplace vs Authenticated Workspace

### Route Classification

| Route | Current Auth | Should Be | Gap |
|---|---|---|---|
| `/` | PUBLIC | PUBLIC | None |
| `/search` | PUBLIC | PUBLIC | None |
| `/listing/[slug]` | PUBLIC | PUBLIC | None |
| `/city/*` | PUBLIC | PUBLIC | None |
| `/category/*` | PUBLIC | PUBLIC | None |
| `/blog/*` | PUBLIC | PUBLIC | None |
| `/broker/[id]` | PUBLIC | PUBLIC | None |
| `/about`, `/contact`, `/faq`, `/terms`, `/privacy`, `/rera-disclaimer` | PUBLIC | PUBLIC | None |
| `/login`, `/register`, `/reset-password` | PUBLIC (unauthenticated redirect) | PUBLIC | None |
| `/post-listing` | AUTH (seller/broker) | AUTHENTICATED | Correctly gated |
| `/dashboard/buyer` | AUTH (buyer) | AUTHENTICATED | Correctly gated |
| `/dashboard/seller` | AUTH (seller) | AUTHENTICATED | Correctly gated |
| `/dashboard/broker` | AUTH (broker) | AUTHENTICATED | Correctly gated |
| `/dashboard/edit/[id]` | AUTH (seller/broker) | AUTHENTICATED | Correctly gated |
| `/admin/*` | AUTH (admin) | ADMIN | Correctly gated |
| `/api/track` | PUBLIC (anonymous POST) | PUBLIC | Intentional — rate-limited |
| `/api/dev-login` | DEV ONLY | DEV ONLY | Gated by env, not a launch concern |
| `/sitemap.xml`, `/robots.txt`, `/llms.txt` | PUBLIC | PUBLIC | None |

### Boundary Violations

- **Redirects table not consumed**: The `redirects` table is admin-editable and public-read via RLS, but `middleware.ts` does not read it to perform actual HTTP redirects. Redirect rules configured in the admin panel have no effect. Source: `PLOTSS-LAUNCH-BACKLOG.md` P1-3. This is a backend-only implementation gap, not an auth boundary violation.
- **`adminListings()` no LIMIT**: Admin route `/admin/listings` fetches all properties with no pagination. As listing count grows, this page will become slow or time out. Not an auth issue but a data boundary issue.
- **Contact data in public listing reads**: `rowToListing()` fetches `listing_contacts` via service client on every listing read (including public list queries). The masking is correct at the app layer, but the raw data is present in the server process for every public page render. Source: `PLOTSS-CODEBASE-AUDIT.md` section 9. NOT a boundary violation as currently implemented, but a code-review risk for future changes.

---

## 9. Database Impact Summary

| Decision | Tables Affected | New Tables Needed | RLS Changes | Server Actions | UI Routes |
|---|---|---|---|---|---|
| Capabilities model (P3) | `profiles` (drop `role` or keep as alias) | `account_capabilities` (new) | All role-based RLS policies need updating to read from capabilities table; `is_admin()` function unchanged | All role-checking actions updated | All dashboards, `/admin/users`, onboarding |
| Onboarding flow (P2) | `profiles` (no change needed for MVP) | `buyer_requirements` (future, for match notifications) | None for MVP onboarding step | New `setCapabilityAction` to flip can_sell on self-service | New `/onboarding` route |
| Workspace consolidation (P3) | None | None | None | None | New `/workspace/*` routes, deprecate `/dashboard/*` |
| `suspended` listing status (P2) | `properties` (add 'suspended' to status check) | None | Update `properties_public_read` policy | New `suspendListing` admin action | `/admin/listings` — add suspend button |
| `property_notes` (P2) | `properties` (remove `details.review_note` usage) | `property_notes` (new) | New RLS: admin insert/read, owner read-own | `decideListing` to write notes table instead of jsonb | `/dashboard/seller` (show rejection reason), admin |
| `admin_audit_log` (P2) | None | `admin_audit_log` (new) | No public read — service role only | All admin actions to write audit row | `/admin` — new audit page |
| `buyer_requirements` (P3) | None | `buyer_requirements` (new) | Self-read RLS (`user_id = auth.uid()`) | New save/update requirements action | `/onboarding`, `/workspace/settings` |
| Saved listings DB-primary (P1) | `saved_listings` (existing — no schema change) | None | None — RLS already correct | `toggleSave` in `(site)/actions.ts` — remove localStorage write | `HomeScreen`, `SearchScreen`, `PropertyDetailScreen` save toggle |
| Redirects middleware (P1) | `redirects` (existing — no schema change) | None | None | None | `middleware.ts` — add redirect handler |
| Blog EEAT migration 0008 (P0) | `blog_posts` (add columns) | None | None | Blog admin form fields unblocked | `/admin/blog/*` |
| `adminListings()` LIMIT (P1) | None | None | None | `src/lib/db/admin.ts` — add `.limit()` and cursor | `/admin/listings` — add pagination UI |

---

## 10. Final Decision Table

> **⚠️ REVISED 2026-10-07** — capability model priority changed to PRE-LAUNCH throughout this table.

| Decision | Recommended Choice | Why | Impact | Must Decide Before Coding? |
|---|---|---|---|---|
| **Capability model vs single role** | **Implement pre-launch** — `account_capabilities` table replaces `profiles.role` enum | One user must be Buyer + Seller + Broker simultaneously before first real users. Single role is a permanent UX blocker for mixed-use accounts. | HIGH — touches RLS, server actions, dashboards, onboarding | **YES — design schema before CHUNK 1 code changes** |
| Admin model | Keep `is_admin()` + `profiles.role='admin'` for now; migrate to DB-backed multi-admin as part of capabilities migration | Admin is a separate path, not a capability | MEDIUM | YES — add second admin before launch |
| Onboarding | Add welcome step (capability selection) as part of capabilities migration | Required for user to choose Buyer/Seller/Broker at signup | MEDIUM | YES — ships with capability migration |
| Workspace architecture | Hybrid transitional: add cross-nav links now (P1), full `/workspace` consolidation immediately after capabilities schema lands | Capabilities migration enables workspace consolidation; they ship together | HIGH | YES — plan together |
| Sidebar | Cross-dashboard links immediately (no schema); full capability-driven sidebar with workspace consolidation | Two-phase: links first, sidebar after capabilities | MEDIUM | YES — add links before launch, full sidebar with capabilities |
| Listing ownership | Keep current `owner_id` + `broker_id` model — compatible with capabilities model | Works with both old role and new capabilities approaches | LOW | NO |
| Broker representation | **Migrate from `role='broker'` to `is_broker_staff=true` in `account_capabilities`** as part of capability migration | `role='broker'` is the main thing preventing a broker from also being a buyer | HIGH — `is_broker_staff_for()` RLS function must be rewritten | YES — this is the core of the capability migration |
| Verification model | Keep boolean `is_verified` for launch; state machine is post-launch | Boolean works with feature flags; state machine adds complexity | LOW | NO |
| UI consolidation | Fix save sync gap immediately (DB-primary); old screens migrate after capabilities land | Save sync is a trust issue; screen migration is scoped post-capabilities | HIGH for save sync | YES — fix before launch |
| Saved listings source of truth | DB-primary, fix `toggleSave` fire-and-forget | localStorage is per-device, non-durable, causes buyer dashboard bugs | HIGH | YES — fix before launch |
| Buyer requirements | Create `buyer_requirements` table as part of capabilities migration (alongside onboarding) | Data currently in user_metadata; must move when onboarding is built | MEDIUM | YES — decide schema before capabilities CHUNK |
| Enquiry lifecycle | Keep current states for launch; add buyer visibility post-launch | Seller/broker side already works | LOW | NO |
| Notification architecture | Synchronous for launch; decouple post-launch | Email volume too low to warrant a queue at launch | LOW | NO — configure RESEND_API_KEY before launch |

---

## 11. Decision Classification

### Safe to Decide and Implement Immediately (No Business Input Needed)

Evidence from codebase confirms these are unambiguous:

1. **Fix `adminListings()` LIMIT** — `src/lib/db/admin.ts` — add pagination. No schema change. (`PLOTSS-LAUNCH-BACKLOG.md` P1-1)
2. **Wire `redirects` table in middleware** — `middleware.ts` — read `redirects` table and perform HTTP 301/302. No schema change. (P1-3)
3. **Add cross-dashboard navigation links** to `src/ui/dashboards/Shell.tsx` top bar. No schema change.
4. **Fix save sync gap**: change `AppShell.toggleSave` to be DB-primary, remove localStorage as primary store. No schema change — `saved_listings` table already exists. (P1-7)
5. **Run migration 0008** (user action, not a code change) — unblocks blog EEAT admin fields. (P0-1)
6. **Verify `Organization` + `WebSite` JSON-LD in root layout** — add missing `<script type="application/ld+json">` tags to `src/app/layout.tsx` if absent. (P0-3)
7. **Remove dead npm dependencies** — `react-simple-maps`, `d3-geo`, confirm `@react-three/fiber`/`three` (check `Hero3D.tsx` usage). (P1-2)
8. **Schedule `purge_old_events()`** — Supabase scheduled function or external cron. No schema change. (P1-4)

### Requires Business Confirmation Before Implementation

⚠️ **These decisions have operational or legal implications that the product owner must confirm:**

1. ⚠️ **BUSINESS DECISION**: What does "Verified" mean to a buyer? Is it RERA-checked, document-checked, or admin-approved? Affects trust signal wording and legal liability.
2. ⚠️ **BUSINESS DECISION**: Should a material edit (price, area change) reset verification status (`is_verified → false`) even though the documents already passed review?
3. ⚠️ **BUSINESS DECISION**: Should the onboarding welcome step be skippable? If skipped, default to buyer capability.
4. ⚠️ **BUSINESS DECISION**: Can a user remove a capability they've added (e.g., un-enroll from seller)? If yes, what happens to their existing listings?
5. ⚠️ **BUSINESS DECISION**: Should AI screening results block approval (listings with high AI risk score require mandatory human review) or remain advisory-only? Currently advisory.
6. ⚠️ **BUSINESS DECISION**: Should broker staff be allowed to post FSBO listings (personal, not tied to their client business) from the same account? Current model makes this impossible.
7. ⚠️ **BUSINESS DECISION**: Is there a plan for a second admin user before launch? If yes, the hardcoded single-admin model needs a timeline for the `admin_users` table.

### Requires Database Migration

1. **`suspended` listing status** — additive: add `'suspended'` to `properties.status` check constraint. Low risk — existing data unaffected. (P2-6)
2. **`property_notes` table** — additive: new table for admin/editor notes on listings. Existing `details.review_note` data would need a one-time copy migration. (P2 scope)
3. **`admin_audit_log` table** — additive: new table. No impact on existing tables. (P2-7)
4. **`buyer_requirements` table** — additive: new table. No impact on existing tables. (P2-5)
5. **Capabilities model** — breaking: drops or replaces `profiles.role` enum. Requires coordinated RLS policy rewrite, server action updates, and new `account_capabilities` table. **Do NOT start this migration without a full-day uninterrupted scope.** (P3)

### Requires UX Redesign

1. **Cross-dashboard navigation** (P1 — minimal change to `Shell.tsx`)
2. **Onboarding flow** (P2 — new `/onboarding` route + welcome step UI)
3. **Buyer requirements capture** (P2 — form in onboarding or settings)
4. **Full workspace consolidation with sidebar** (P3 — significant redesign)
5. **Buyer enquiry status visibility** (P3 — new "My Enquiries" section with status tracking)

### Requires Security / RLS Changes

1. **Capabilities model** — all role-based RLS policies (`is_admin()`, `is_broker_staff_for()`, all `profiles_*` policies) must be updated to read from `account_capabilities` instead of `profiles.role`. This is the highest-risk migration.
2. **`admin_audit_log`** — new RLS: service-role insert only, no public read, admin read via admin bypass. Additive — no existing policies affected.
3. **`suspended` listing status** — `properties_public_read` policy needs `status not in ('live')` to become `status = 'live'` (already correct; verify `'suspended'` is excluded by the existing exact-match `status = 'live'` condition — it is, so this is NOT a change).
4. **`property_notes` table** — new RLS policies needed: admin all, owner read-own, service-role insert.

### Recommended Implementation Order

The following sequence ensures each step is safe to ship independently:

1. **Run migration 0008** (user) — unblocks blog admin and AEO content. No code change.
2. **Fix `adminListings()` LIMIT + add pagination** — prevents future performance cliff. No schema change.
3. **Wire `redirects` table in middleware** — activates redirect rules already configured by admin. No schema change.
4. **Add `Organization` + `WebSite` JSON-LD to root layout** — SEO quick win. No schema change.
5. **Fix save sync gap (DB-primary saves)** — remove localStorage as primary store for favourites. Critical for buyer trust. No schema change.
6. **Add cross-dashboard navigation links to Shell.tsx** — fixes seller-who-browses problem. No schema change.
7. **Configure RESEND_API_KEY + enable `notifyEmail` flag** — activates listing decision emails. No code change (email path already coded).
8. **Set up CI/CD pipeline** — before any further code changes. Devops hygiene.
9. **Create staging Supabase project** — before running live E2E in CI.
10. **Add `suspended` listing status** (additive migration) — gives admin a temporary-takedown tool.
11. **Add `admin_audit_log` table** (additive migration) — compliance trail before admin team grows.
12. **Add minimal onboarding welcome step** — seller acquisition improvement.
13. **`property_notes` table** (additive migration) — structured rejection notes.
14. **Capabilities model** (breaking migration) — only after platform is stable with real users and the business has confirmed capability-removal behaviour and broker-as-FSBO policy.
