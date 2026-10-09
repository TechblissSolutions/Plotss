# PLOTSS Architecture Recommendations

_Recommended future state only — NOT current implementation. No code to be written from this document without scoping in `docs/29-agent-progress-tracker.md` first._

---

## 1. User Account + Capabilities Model

### Problem with current model
The current `profiles.role` is a mutually exclusive single value (`buyer | seller | broker | admin`). In practice:
- A land owner who also wants to browse other listings is a "seller" — they have no buyer features.
- An agency staff member is a "broker" — they cannot browse as a buyer either.
- This creates unnecessary friction for real users who wear multiple hats.

### Recommended: capabilities, not roles

Replace the single-role enum with a capabilities bitfield or a separate `account_capabilities` table:

```
account_capabilities:
  user_id        uuid (PK, FK profiles)
  can_buy        boolean  (can save, unlock contacts, send enquiries)
  can_sell       boolean  (can post/edit/manage own listings)
  is_broker_staff boolean (belongs to a client business — implies can_sell)
  broker_id      uuid     (FK broker_profiles, nullable)
  is_admin       boolean  (super admin — separate from the rest)
```

- Every new account starts with `can_buy = true` by default.
- A user opts into `can_sell` via an onboarding step (no admin involvement needed).
- Admin assigns `is_broker_staff + broker_id` (as today) for client staff.
- `is_admin` is set only by a database/migration step, never via the UI.

This removes the "one-time buyer → seller" transition logic and the `prevent_role_escalation` trigger complexity. A user just adds capabilities without losing others.

### Dashboard consequence
With capabilities:
- A user with both `can_buy` and `can_sell` sees both dashboard sections (tabs or a selector).
- The `WorkspaceLayout` top bar gets a "My Listings" vs "Saved / Browse" switcher.
- No redirect-to-appropriate-dashboard logic needed.

### Keep admin separate
`is_admin` should remain a totally separate concept from buyer/seller/broker. The admin panel is a different application with a different visual design. Do not put admin in the capabilities model.

---

## 2. Admin / Super Admin Privilege Model

Current model (hardcoded email in migration, `profiles.role = 'admin'`) is fine for a single super admin. As the platform grows:

- **Multi-admin support**: add an `admin_users` table with a `level` column (`super | staff`) to allow onboarding admin staff with restricted access (e.g. listing approver, but not theme editor).
- **Audit log**: every admin action (listing approve/reject, client suspend, role change) should write to an `admin_audit_log` table with `actor_id`, `action`, `target_id`, `at`.
- **No impersonation yet**: keep it off until there is a clear business need and proper audit trail.

---

## 3. Listing Lifecycle

Recommended formalised lifecycle:

```
draft → pending → [under_review] → live | rejected
live → sold (seller/broker)
live → [suspended] (admin, without deleting) 
rejected → pending (resubmit after edit)
```

- Add a `suspended` status distinct from `sold` and `rejected` — lets admin take down a live listing temporarily without losing its data.
- Admin notes (`review_note`) should be a separate `property_notes` table instead of buried in `details` jsonb — easier to query, audit, and notify on.

---

## 4. Verification Model

Current: all-or-nothing `is_verified` boolean computed by `recomputeVerified()`.

Recommended incremental model:

| Level | What it means | How earned |
|---|---|---|
| `unverified` | Default | |
| `ai_screened` | Passed the automatic risk screen | `features.aiScreening` on, screenListing() low risk |
| `documents_submitted` | Owner uploaded the requested docs | `verification_documents` rows with `status=pending` |
| `verified` | Staff checked all docs | All `verification_documents.status = 'verified'` |

Surface these as four distinct badges (not just verified/not-verified) in the UI and in JSON-LD `verificationStatus`.

---

## 5. Dashboard IA and Sidebar

### Current problem
Three separate dashboards with no sidebar and no cross-navigation. Users with multiple capabilities have no way to switch.

### Recommended dashboard IA

```
/workspace                    (redirects to most-relevant tab based on capabilities)
/workspace/listings           (can_sell: my listings + SLA badges)
/workspace/leads              (can_sell: enquiries / leads inbox)
/workspace/saved              (can_buy: saved listings)
/workspace/enquiries          (can_buy: my enquiries + status)
/workspace/team               (is_broker_staff: invite, team members)
/workspace/notifications      (all: notification inbox)
/workspace/settings           (all: name, phone, password)
```

Shell component gets a left sidebar with these sections (collapsed on mobile):
- "My Listings" section only visible if `can_sell`
- "My Searches" section only visible if `can_buy`
- "Team" section only visible if `is_broker_staff`

---

## 6. Auth / Onboarding Flow

Current: no onboarding after signup — users land on homepage with no guidance on what to do next.

Recommended post-signup onboarding:

1. **Welcome step** (always): "What brings you to PLOTSS?" → "I want to find land" (enables `can_buy`) | "I want to list land" (enables `can_sell`) | "I represent an agency" (shows broker request form).
2. **Buyer onboarding** (optional): "Tell us your requirements" → city, category, area range, budget → creates a saved `requirements` row for match notifications.
3. **Seller onboarding**: "Tell us about your listing" → shortcuts to post-listing wizard.
4. **Broker onboarding**: staff invited by their business admin skip this; self-registered brokers fill a "Request agency account" form (reviewed by super admin).

This replaces the current `buyer → seller` role-change UX which has no guided path.

---

## 7. Recommended Database Schema Changes (Conceptual)

These are conceptual — no SQL, no specific column types. Implement as new migrations only.

- **Replace `profiles.role` enum**: migrate to `account_capabilities` table (see section 1). Keep `profiles.role` as a compatibility view initially.
- **`property_notes` table**: extract `details.review_note` from jsonb into a proper relational table with `property_id`, `author_id`, `note`, `at`, `note_type` (admin_rejection | admin_approval | editor_note).
- **`admin_audit_log` table**: `id`, `actor_id`, `action` (text), `target_type` (property | profile | broker | site_settings), `target_id`, `old_value jsonb`, `new_value jsonb`, `at`.
- **`buyer_requirements` table**: `id`, `user_id`, `city`, `category`, `min_area`, `max_area`, `max_price`, `created_at` — for match notifications.
- **`properties` status**: add `suspended` to the status enum.
- **Remove** the dual `0004_` migration filename ambiguity — rename `0004_profile_phone_from_metadata.sql` to `0004b_profile_phone_from_metadata.sql` or `0005b_...` going forward (cannot edit applied migrations, so document the naming gap).

---

## 8. Recommended Permission / RLS Approach

- **Keep RLS as the authorization source of truth.** Do not move to app-only auth checks.
- **Keep the authorization triple-check** (`owner_id | broker_id | admin`) in every service-role mutation — document it as a required code review checklist item.
- **Add a `is_broker_staff_for_v2(target_broker, target_capability)` function** when capabilities model is introduced, to keep RLS clean.
- **`admin_audit_log` table**: grant INSERT to service role only; no client reads.
- **`buyer_requirements` table**: standard self-read RLS (`user_id = auth.uid()`), admin-all.
- **Consider Supabase Edge Functions** for notifications instead of calling external APIs from server actions — keeps server action response times predictable and decouples notification delivery from the request lifecycle.
