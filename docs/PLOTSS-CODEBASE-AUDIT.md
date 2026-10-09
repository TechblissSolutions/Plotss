# PLOTSS Codebase Forensic Audit

_Conducted: 2026-10-05. Auditor: Claude Sonnet 4.6 (read-only — no application code modified)._

---

## 1. Stack & Infrastructure

| Layer | Technology | Version / Notes |
|---|---|---|
| Framework | Next.js App Router | ^16.3.8 (patched from 16.3.5 RCE) |
| Language | TypeScript | strict mode, `^5` |
| Styling | Tailwind CSS v4 | `@theme inline`, admin panel uses fixed palette |
| Database | Supabase Postgres + RLS | |
| Auth | Supabase Auth | OTP/Google/email+password |
| Storage | Supabase Storage | `listing-photos` (public), `listing-docs` (private) |
| AI | xAI Grok / Groq | via `XAI_API_KEY` or `GROQ_API_KEY` |
| Notifications (email) | Resend | NOT YET wired — no `RESEND_API_KEY` confirmed |
| Notifications (WhatsApp/SMS) | MSG91 (placeholder) | NOT YET wired |
| Animations | framer-motion | `^13.4.0` |
| 3D | @react-three/fiber + three | present in deps, `Hero3D.tsx` exists, unclear if active |
| Maps | leaflet + react-simple-maps (dead) | leaflet for listing detail; react-simple-maps replaced by static SVG |
| Unit tests | Vitest | `^5`, 26 tests passing per progress tracker |
| E2E tests | Playwright | two tiers: demo (no secrets) and live (opt-in) |
| Deployment | NOT VERIFIED | Vercel mentioned incidentally in bug fix; no `vercel.json`, no CI config |
| CI/CD | NOT FOUND | no `.github/workflows/` or similar |
| Logging | `console.error` in `notify.ts` only | no structured logging or error tracking service |
| Error monitoring | NOT FOUND | no Sentry / similar |
| Analytics | First-party only | `events` table, `/api/track`, `TrackingProvider` |

**Dead dependencies in `package.json`:** `react-simple-maps`, `d3-geo`, `@react-three/fiber`, `three`, `leaflet` (partially used).

---

## 2. Application Route Map

| Route | Public/Auth | User Type | Purpose | Server/Client | Data Used | Status |
|---|---|---|---|---|---|---|
| `/` | Public | All | Homepage — search, categories, map, listings | Mixed (layout=server, screens=client) | Demo/live listings, site data | WORKING |
| `/search` | Public | All | Full search with filters | Client (SearchScreen) | Demo/live listings | WORKING |
| `/listing/[slug]` | Public | All | Property detail | Server (page) + Client (detail screen) | DB listing | WORKING |
| `/city` | Public | All | Browse all cities | Server | DB cities | WORKING |
| `/city/[slug]` | Public | All | City landing page | Server + Client (ListingLanding) | DB listings | WORKING |
| `/category/[slug]` | Public | All | Category landing | Server + Client | DB listings | WORKING |
| `/blog` | Public | All | Blog/Market Insights index | Server | DB blog_posts | WORKING |
| `/blog/[slug]` | Public | All | Blog article | Server | DB blog_posts | WORKING (0008 migration pending for EEAT fields) |
| `/broker/[id]` | Public | All | Broker/client profile | Server | broker_profiles (falls back to MOCK_BROKERS) | PARTIALLY_WORKING |
| `/about` | Public | All | Static about page | Server | Static/content | WORKING |
| `/contact` | Public | All | Contact page | Server | Static/content | WORKING |
| `/faq` | Public | All | FAQ page | Server | Static/content | WORKING |
| `/terms` | Public | All | Terms of service | Server | Static | WORKING |
| `/privacy` | Public | All | Privacy policy | Server | Static | WORKING |
| `/rera-disclaimer` | Public | All | RERA disclaimer | Server | Static | WORKING |
| `/post-listing` | Auth (seller/broker) | Seller, Broker | Post a listing wizard | Client (PostPropertyScreen) | DB submit | WORKING |
| `/login` | Public | Unauthenticated | Login/Register tabs | Client | Supabase Auth | WORKING |
| `/register` | Public | Unauthenticated | Register (shared component with login) | Client | Supabase Auth | WORKING |
| `/reset-password` | Public | Unauthenticated | Password reset | Client (ResetPasswordForm) | Supabase Auth | WORKING |
| `/dashboard/buyer` | Auth (buyer) | Buyer | Saved, contacted, matches | Server | DB saved_listings, enquiries | PARTIALLY_WORKING (save sync gap with old system) |
| `/dashboard/seller` | Auth (seller) | Seller | Listings, leads, quality | Server | DB properties, enquiries | WORKING |
| `/dashboard/broker` | Auth (broker) | Broker staff | Business listings, leads, team invite | Server | DB properties scoped to broker_id | WORKING |
| `/dashboard/edit/[id]` | Auth (seller/broker) | Seller, Broker | Edit a listing | Server + Client (EditListingForm) | DB properties | WORKING |
| `/admin` | Auth (admin) | Super admin | Admin dashboard overview | Server | DB stats | WORKING |
| `/admin/listings` | Auth (admin) | Super admin | Approval queue | Server | DB all properties | WORKING |
| `/admin/clients` | Auth (admin) | Super admin | Client businesses CRUD | Server | broker_profiles | WORKING |
| `/admin/users` | Auth (admin) | Super admin | User roles + client assignment | Server | profiles | WORKING |
| `/admin/blog` | Auth (admin) | Super admin | Blog CRUD | Server + Client (PostForm) | blog_posts | WORKING (EEAT fields blocked by pending migration 0008) |
| `/admin/blog/new` | Auth (admin) | Super admin | New blog post | Server + Client | blog_posts | WORKING |
| `/admin/blog/[id]` | Auth (admin) | Super admin | Edit blog post | Server + Client | blog_posts | WORKING |
| `/admin/content` | Auth (admin) | Super admin | Editable UI copy | Server + Client (ContentEditor) | site_settings key=content | WORKING |
| `/admin/seo` | Auth (admin) | Super admin | SEO overrides | Server | site_settings key=seo_global, seo_pages | WORKING |
| `/admin/settings` | Auth (admin) | Super admin | Feature flags | Server | site_settings key=features | WORKING |
| `/admin/theme` | Auth (admin) | Super admin | Theme tokens | Server + Client (ThemeEditor) | site_settings key=theme | WORKING |
| `/admin/analytics` | Auth (admin) | Super admin | Journey analytics | Server | events table | WORKING |
| `/admin/redirects` | Auth (admin) | Super admin | URL redirects | Server | redirects table | WORKING |
| `/admin/notifications` | Auth (admin) | Super admin | Notification audit | Server | notifications table | WORKING |
| `/admin/journey` | Auth (admin) | Super admin | Journey funnel view | Server | events | WORKING |
| `/api/track` | Public (POST) | Browser | Analytics event ingestion | Server | events table | WORKING |
| `/api/dev-login` | Dev only | Dev | Dev session cookie | Server | None | WORKING (disabled in prod) |
| `/sitemap.xml` | Public | Crawlers | XML sitemap | Server | DB listings, blogs, cities | WORKING |
| `/robots.txt` | Public | Crawlers | Robots file | Server | site_settings | WORKING |
| `/llms.txt` | Public | AI crawlers | AEO/GEO plain text | Server | DB live listings | WORKING |

---

## 3. User Identity / Role Architecture

### Current implementation

- `profiles.role` is a single `text` column: `'buyer' | 'seller' | 'broker' | 'admin'`
- **One role per user.** A user cannot be both a buyer and a seller simultaneously.
- `profiles.broker_id` links a `role='broker'` user to a `broker_profiles` row (their client business).
- Admin is hardcoded to a single email (`dm@techbliss.in`) set via migration 0002's `UPDATE profiles`.
- Role escalation is guarded by a DB trigger (`prevent_role_escalation`):
  - A signed-in user (non-admin) may only change from `buyer` → `seller` or `buyer` → `broker` (one-time).
  - Server/SQL contexts (`auth.uid() is null`) are unrestricted — allows the seed/admin assignment scripts.
- `requireRole()` in `src/lib/session.ts` gates dashboard pages; admins bypass all role checks.
- `getSession()` reads `role` and `broker_id` from `profiles` on every request (no JWT claim caching).

### Can one user have multiple roles?

No. The schema enforces exactly one role per user. A "seller" who also wants to browse as a buyer cannot — they get a seller dashboard. The docs acknowledge this is incomplete (buyer gets no feedback on enquiry status).

### Security of role storage

- Role is stored in `profiles` table under RLS, not in the JWT/auth metadata.
- The `prevent_role_escalation` trigger prevents self-promotion to admin.
- However: a broker-role user can call `saveBrokerProfile` to update their client business's row if they have a `broker_id` — this is intentional and correct.
- Risk: if `profiles.broker_id` is somehow manipulated to point to another client's `broker_profiles` row, that user gains access to all of that client's listings. Currently only admins can set `broker_id` (via `changeRole` action) or staff invite uses the same service-role path.

### Recommended future architecture

- Model buyer/seller/broker as **capabilities** (a user can have multiple), not mutually exclusive roles.
- Keep admin as a separate superpower, not a role in the same enum.
- See `docs/PLOTSS-ARCHITECTURE-RECOMMENDATIONS.md` for detail.

---

## 4. Authentication & Authorization Security Audit

| # | Location | What happens | Why it matters | Exploit scenario | Fix | Launch blocker? | Severity |
|---|---|---|---|---|---|---|---|
| A1 | `src/lib/auth.ts:requireAdmin()` | Dev bypass: if Supabase is unconfigured and `NODE_ENV !== 'production'`, admin access is open. | Documented as intentional; harmless in production because the env check catches it. | Only exploitable if `NODE_ENV=production` and `SUPABASE_SERVICE_ROLE_KEY` is somehow unset in prod. | Doc says "don't fix without understanding" — acceptable as-is with env gating. | NO | LOW |
| A2 | `src/lib/session.ts:getSession()` | Dev mode: reads role from a signed cookie (`plotss_dev_session`). Cookie is set by `/api/dev-login` which accepts a `role` param. | If dev mode (no Supabase) is accidentally hit in a shared environment, anyone can become admin. | Not a prod issue — blocked by `isSupabaseConfigured` check in `/api/dev-login`. | Already guarded — ensure `NEXT_PUBLIC_SUPABASE_URL` is always set in production. | NO | LOW |
| A3 | `src/app/(app)/actions.ts:inviteStaffAction` | Uses `svc.auth.admin.listUsers({ perPage: 1000 })` to find an existing user by email. | Full user list with 1000 cap. If platform grows to >1000 users, matching will silently fail (misses users beyond page 1). | An attacker who is already a broker staff member cannot exploit this; worst case: re-invite sends a new magic link. | Add pagination loop or use `getUserByEmail` API if available. | NO | MEDIUM |
| A4 | `src/lib/db/contacts.ts:revealContact` | Rate limit checks via `enquiries` table count. | Correct and durable (DB-backed). | None identified. | N/A | NO | LOW |
| A5 | `src/app/(site)/actions.ts:revealContactAction` | Validates `propertyId` with `/^[0-9a-f-]{36}$/i` OR `/^plot-\d+$/`. The `plot-\d+` pattern is for demo mode IDs. | In live mode the service client will query with a demo-format ID and return null, but no real data leaks. | Minor: demo IDs in a live-mode request waste a DB query but can't reach real contact data. | Low priority — acceptable. | NO | LOW |
| A6 | `src/app/(app)/actions.ts:setLeadStatus` | Uses `.maybeSingle()` on a join; typed as `any`. | Type safety risk, not a security issue. | None. | Use typed response. | NO | LOW |
| A7 | `supabase/migrations/0001_init.sql` | `listing_contacts` has no RLS — created in 0001 with `is admin()` only. | listing_contacts holds real phone numbers. The policy means normal authenticated users cannot SELECT it directly via PostgREST. **But:** `src/lib/db/listings.ts` queries `listing_contacts` via the service client (bypasses RLS) in `rowToListing` — the public listing read path includes `listing_contacts` in the SELECT. | If `rowToListing` accidentally exposes `ownerFullName`/`ownerPhone` (currently empty strings in the return value), callers could see raw phone numbers. The masking logic correctly leaves those fields empty. Verify that no other code path returns the raw contact row to the browser. | Audit all call sites of `rowToListing`. Current code appears safe — `ownerFullName: ""` and `ownerPhone: ""` are hardcoded. | NO | MEDIUM |
| A8 | Multiple actions using `createServiceClient()` | The authorization triple-check (`owner_id === session.id || brokerId === session.brokerId || role === 'admin'`) is correctly present in `markListingSold`, `updateListingAction`, `setLeadStatus`. | Previously violated in 3 places (fixed). Must stay correct. | If a new action using service client omits the broker_id check, broker staff can no longer manage listings. | Ongoing — every new mutation involving `properties` must follow this pattern. | YES (if violated) | HIGH |
| A9 | `src/app/api/track/route.ts` | Rate limited by IP and visitor ID (in-memory `rateLimit`). | In-memory rate limit doesn't survive server restarts or scale to multiple instances. | An attacker could spam the analytics endpoint from multiple IPs. Intentionally documented as acceptable (DB cost per ping not worth it). | Acceptable per docs decision. | NO | LOW |

---

## 5. Database Forensic Audit

### Table Inventory

| Table | Purpose | PK | FKs | RLS | Sensitive Data | Issues |
|---|---|---|---|---|---|---|
| `profiles` | User profiles, role | `id` (= auth.users.id) | `auth.users`, `broker_profiles` (broker_id) | YES | role, phone | Role enum only 4 fixed values; no multi-role support |
| `cities` | Launch cities | `id` | — | YES (public read, admin write) | None | `active` flag controls marketplace availability |
| `categories` | Listing categories | `id` | — | YES (public read) | None | Only 4 categories; no admin UI to add new ones |
| `properties` | Core listing data | `id` | `cities`, `categories`, `profiles` (owner_id), `broker_profiles` (broker_id) | YES | price, location (lat/lng) | `details` jsonb for extensibility; price stored in paise (multiplied by 1e7) |
| `property_images` | Listing photos | `id` | `properties` | YES | None | No delete policy for non-owner |
| `verification_documents` | Docs uploaded for verification | `id` | `properties` | YES | file_url path | Guard trigger prevents owner from changing status |
| `enquiries` | Contact unlocks + buyer enquiries | `id` | `properties`, `profiles` (buyer_id) | YES | buyer phone (via profiles join) | `kind` field: 'unlock' or 'enquiry' — dual-purpose table |
| `saved_listings` | Saved/favourited listings | composite | `profiles`, `properties` | YES | None | Sync gap with localStorage in old UI system |
| `site_settings` | Global config: theme, features, SEO, content | `key` (text) | — | YES (public read, admin write) | None | Admin can write any value via key; no schema validation beyond app-level |
| `broker_profiles` | Client businesses / broker accounts | `id` | `profiles` (user_id) | YES | rera_number, verified status | `user_id` nullable after assignment; `status` active/suspended |
| `broker_contacts` | Private broker contact details | `broker_id` | `broker_profiles` | YES (admin only) | phone, email | No public read; service role only for practical access |
| `listing_contacts` | Private owner phone per listing | `property_id` | `properties` | YES (admin only) | phone, name | Service role used in reads; masking happens in app layer |
| `seo_pages` | Per-path SEO overrides + FAQ | `path` | — | YES (public read) | None | |
| `blog_posts` | Blog/Market Insights articles | `id` | — | YES (published or admin) | None | `key_takeaways`, `faq`, `author_role`, `author_bio` columns pending migration 0008 |
| `redirects` | 301/302 URL redirects | `from_path` | — | YES (public read) | None | NOT VERIFIED: middleware doesn't appear to consume this table |
| `events` | First-party analytics | bigint identity | `profiles` (user_id, nullable) | YES (admin only SELECT; no write policy) | user_id, path, referrer, utm | No write policy — only service role can insert |
| `rate_limit_hits` | Durable rate limiting | bigint identity | — | YES (no public policies) | None | Only service role access |
| `notifications` | In-app notification inbox | `id` | `profiles` (user_id) | YES | notification content | No insert policy for regular users — server only |

### RLS Coverage Status

All tables have RLS enabled. The critical tables (`properties`, `listing_contacts`, `broker_contacts`) have correct policies. Key policies to verify:

- `properties_public_read`: only `status = 'live'` AND broker not suspended — CORRECT
- `listing_contacts_admin`: admin only — CORRECT (service role bypasses in app code)
- `events`: no insert policy (only service role) — CORRECT, but means no direct PostgREST insert possible

### Potential bypass

- `guard_property_moderation` trigger prevents a user from self-approving, but it checks `auth.uid()` — trusted server contexts (service role) bypass this trigger. App-level actions using service client must still manually set correct `status` values. Currently all service-role listing mutations set explicit statuses.

---

## 6. Supabase / RLS Security Audit

| Issue | Severity | Details |
|---|---|---|
| `is_admin()` function uses `profiles.role` | MEDIUM | If someone could escalate their role in profiles (mitigated by `prevent_role_escalation` trigger), they would become admin. The trigger's bypass for `auth.uid() is null` is safe but relies on Supabase not setting auth.uid for service-role. |
| No delete policy on `properties` | LOW | Sellers can't delete listings, only mark sold. Intentional per docs. |
| `broker_public_read` allows unverified self-read | LOW | `verified OR user_id = auth.uid()` — a broker can read their own unverified profile. Intentional. |
| No RLS insert policy on `notifications` | INFO | Only service role can insert — correct. But no audit of notification content validity at DB level. |
| `rate_limit_hits` has no policies | INFO | Only service role touches it. Correct. |
| `events` has no insert policy | INFO | Correct. |
| `storage.objects` "photos owner insert" | MEDIUM | Checks `(storage.foldername(name))[1] = auth.uid()::text` — users can only upload to their own user-id folder. Correct. |
| `storage.objects` "docs owner or admin read" | MEDIUM | Only owner or admin can read docs. Signed URLs not verified (NOT_VERIFIED: `signedDocUrl()` function not found in audit). |
| Duplicate `0004_` prefix on migrations | MEDIUM | Both `0004_multi_client.sql` and `0004_profile_phone_from_metadata.sql` share the `0004` prefix. If any tooling applies them alphabetically or by filename, order could be wrong. Applied manually so impact is unclear, but naming creates ambiguity. |

---

## 7. Listing / Property Lifecycle

1. **Draft** → User starts (not yet submitted)
2. **Pending** → `submitListingAction` sets `status = 'pending'`; admin notified (in-app only currently)
3. **Live** → Admin approves via `decideListing` → `setListingStatus('live')` → `recomputeVerified` → `notifyListingDecision` (seller + broker staff)
4. **Rejected** → Admin rejects → `review_note` stored in `details` jsonb → seller/staff notified
5. **Sold** → Seller or broker staff calls `markListingSold` → removed from public search
6. Any edit of a live listing resets status to `pending` (via `updateListingAction`)

**SLA**: `src/lib/sla.ts` computes 23-business-day deadline from `created_at`. Surfaced as badges on admin queue (oldest-first) and seller/broker dashboards. Does NOT include Indian public holidays.

**AI screening**: If `features.aiScreening` is on, `screenAndStore()` is called after submit/edit (fire-and-forget, never blocks). Result stored in `properties.details.ai_screen`. Shown to admin only.

**Gap**: No email/WhatsApp notification when a listing goes live. Only in-app. `notifyEmail` and `notifyWhatsapp` features are off by default (no provider configured).

---

## 8. Private Document Security

- Verification docs stored in `listing-docs` Supabase Storage bucket (private, `public = false`).
- Storage policy `"docs owner or admin read"`: only file owner or admin can read via PostgREST storage API.
- App code uses service client to access docs — `signedDocUrl()` function not found in the audit (possibly not yet implemented or in admin code not fully read). NOT_VERIFIED.
- Doc status is guarded by `guard_document_status` trigger — owner cannot change status to `verified`.

---

## 9. Owner Contact Protection

- `listing_contacts` table: `listing_contacts_admin` RLS policy = admin only via PostgREST.
- App reads contacts via `createServiceClient()` (bypasses RLS) only in `revealContact()`.
- Public listing pages receive `ownerMaskedName` and `ownerMaskedPhone` (masked in `rowToListing`).
- `ownerFullName: ""` and `ownerPhone: ""` are hardcoded empty in public read model.
- Rate limit: 20 unlocks/day per user (configurable via `features.unlockLimitPerDay`), DB-backed (durable).
- RISK: `rowToListing` in `src/lib/db/listings.ts` does SELECT `listing_contacts(name,phone,owner_type)` as part of the main query. The `db()` function uses service client when `SUPABASE_SERVICE_ROLE_KEY` is set (which it is in production), meaning `listing_contacts` rows ARE fetched for all public listing reads. The masking in `rowToListing` correctly leaves `ownerFullName: ""` and `ownerPhone: ""` empty. But if any caller accidentally accesses `r.listing_contacts[0].phone` before mapping, raw data is available. This is a code-review concern, not a verified exploit.

---

## 10. Seller Experience Audit

| Feature | Status | Notes |
|---|---|---|
| Post listing wizard | WORKING | `/post-listing` → `PostPropertyScreen` → `submitListingAction` |
| Listing appears in seller dashboard | WORKING | `sellerData()` in `dashboards.ts` |
| Edit listing | WORKING | Any edit resets to pending |
| Mark as sold | WORKING | `markListingSold` action |
| Delete listing | NOT_FOUND | Intentional — only mark-as-sold |
| View lead status | WORKING | `LeadsInbox` component |
| SLA badge | WORKING | `sla.ts` computed, shown as badge |
| Listing quality score | PARTIALLY_WORKING | `listing-quality.ts` exists; UI renders it on seller dashboard |
| Notification on approval | WORKING (in-app only) | email/WhatsApp not yet wired |
| Bulk operations | NOT_FOUND | Intentional per docs |

---

## 11. Buyer Experience Audit

| Feature | Status | Notes |
|---|---|---|
| Search/browse | WORKING | |
| Listing detail | WORKING | |
| Save listing (localStorage) | WORKING | Old system — not synced to DB reliably |
| Save listing (DB) | PARTIALLY_WORKING | `saved-actions.ts` exists; old screen writes to localStorage first, merges to DB only when logged in |
| Unlock owner contact | WORKING | `revealContactAction` |
| Submit enquiry | WORKING | `submitEnquiryAction` |
| Buyer dashboard | PARTIALLY_WORKING | Shows saved, contacted, matches — but saved relies on DB which may lag behind old system's localStorage |
| Enquiry status visibility | NOT_IMPLEMENTED | Docs note buyer has no visibility into lead status (intentional) |
| Notification when seller responds | NOT_IMPLEMENTED | No trigger for this scenario |
| AI match score | PARTIALLY_WORKING | `aiMatchScore` field exists in listing type but scoring logic NOT_VERIFIED in current code |
| Price fairness indicator | UI_ONLY | `fairnessRating` / `fairnessDelta` in mock data; NOT_VERIFIED against live DB data |
| Compare tray | WORKING | `CompareTray` component in old system |

---

## 12. Broker Experience Audit

| Feature | Status | Notes |
|---|---|---|
| Broker dashboard | WORKING | Scoped to `broker_id` via `brokerData()` |
| See all business listings | WORKING | `getListingsByBroker()` |
| See all business leads | WORKING | `leadsForBroker()` |
| Edit any business listing | WORKING | Authorization triple-check correct |
| Invite a teammate | WORKING | `inviteStaffAction` — uses Supabase admin.inviteUserByEmail |
| Public broker profile page | PARTIALLY_WORKING | Falls back to `MOCK_BROKERS` when no verified client exists |
| "Listed by X" badge on listings | NOT_IMPLEMENTED | `features.brokers` logic exists but badge display NOT_VERIFIED |
| Client suspension hides listings | WORKING | RLS policy in 0004 |
| Broker profile update | WORKING | `saveBrokerProfile` updates shared client row |

---

## 13. Dashboard / Information Architecture Audit

| Dashboard | Navigation | Shell | Issues |
|---|---|---|---|
| Buyer `/dashboard/buyer` | Top bar only (PLOTSS logo, Browse, Post) | `WorkspaceLayout` | No sidebar; notification bell present |
| Seller `/dashboard/seller` | Same top bar | `WorkspaceLayout` | No sidebar; switching between dashboards requires manual URL edit |
| Broker `/dashboard/broker` | Same top bar | `WorkspaceLayout` | No sidebar |
| Admin `/admin/*` | Dark sidebar (`AdminNav`) + mobile slide-in | `AdminLayout` | Separate tab/session; complete navigation |

**Problem**: Buyer, seller, broker dashboards share one minimal top bar with no sidebar navigation. If a user has the "seller" role and wants to switch to browsing as a buyer, they must manually navigate to `/dashboard/buyer` — there's no clear link. A seller who is also a buyer (realistic scenario) has no way to access buyer features from the seller dashboard.

**Problem**: No "switch dashboard" UI for users whose role could legitimately view multiple dashboard types (e.g. a seller who also browses listings).

---

## 14. UI / UX Audit

| Issue | Severity | Location | Notes |
|---|---|---|---|
| Two parallel UI systems | P0 | `src/ui/screens/*` (old) vs `src/ui/dashboards/*` (new) | Save sync gap; localStorage vs DB; documented debt, not yet unified |
| No role-switch navigation | P1 | All dashboards | A seller cannot easily browse as a buyer |
| No dark mode | P3 | Global | Explicitly deferred per docs |
| `react-simple-maps`, `d3-geo`, `@react-three/fiber`, `three`, `leaflet` dead/partial in bundle | P2 | `package.json` | Adds bundle weight; leaflet may still be imported by `ListingsMap.tsx` |
| AuthModal still exists alongside dedicated login/register pages | P2 | `src/components/AuthModal.tsx` | Redundant; may cause user confusion |
| No empty-state for buyer dashboard when no saved listings | P2 | `src/ui/dashboards/BuyerDashboard.tsx` | NOT_VERIFIED |
| Listing card: save heart / map pin added but NOT wired in HomeScreen/SearchScreen | PARTIALLY_WORKING | per progress tracker | "Added a Heart/save button" per notes but "never wired to a click handler" in old screens was the original issue |
| CompareTray only in old system | P2 | `src/ui/components/CompareTray.tsx` | Not present in dashboard system |
| No onboarding flow | P1 | After signup | New users land on homepage with no guidance; role assignment is self-service via profile |

---

## 15. CRO Audit

| Issue | Severity | Notes |
|---|---|---|
| Auth wall before contact unlock | P1 | Login required before seeing owner contact — correct for lead quality but may increase bounce |
| No post-enquiry follow-up flow | P1 | Buyer sends enquiry, sees notification, but no next-step prompt ("What happens next?") |
| No WhatsApp CTA on listing detail | P2 | `MobileActionBar` has WhatsApp button; NOT_VERIFIED it has a real number |
| "Post listing" CTA reachable from nav | WORKING | Yes, `/post-listing` linked from top bar |
| No urgency signals | P2 | Views count shown; no "X enquiries this week" visible to buyers |
| No seller response rate signal | P2 | No data collected for this |
| Blog "Browse listings" CTA | WORKING | Kept at end of blog posts after FAQ per docs |

---

## 16. SEO Audit

| Feature | Status | Notes |
|---|---|---|
| Sitemap.xml | IMPLEMENTED | Dynamic, includes listings + blog + cities + categories |
| Robots.txt | IMPLEMENTED | Blocks `/admin`, `/dashboard`, `/api`, `/search?` |
| llms.txt | IMPLEMENTED | AEO-aware plain-text file at `/llms.txt` |
| Per-page metadata | IMPLEMENTED | `buildMetadata()` with admin override layer |
| OG / Twitter card | IMPLEMENTED | Via `buildMetadata()` |
| Canonical URL | IMPLEMENTED | In `buildMetadata()` |
| Breadcrumb JSON-LD | IMPLEMENTED | `breadcrumbLd()` on listing + blog pages |
| RealEstateListing JSON-LD | IMPLEMENTED | On listing detail pages |
| Article JSON-LD | IMPLEMENTED | On blog pages |
| FAQPage JSON-LD | IMPLEMENTED | On blog posts (if faq array non-empty); on seo_pages |
| Organization JSON-LD | IMPLEMENTED | In `seo.ts:orgLd()` — NOT_VERIFIED it's actually rendered in root layout |
| WebSite JSON-LD + SearchAction | IMPLEMENTED | In `seo.ts:websiteLd()` — NOT_VERIFIED it's rendered in root layout |
| `generateStaticParams` for listings | NOT_FOUND | Listing detail pages appear to be dynamic (no ISR or static generation) |
| ISR / cache revalidation | IMPLEMENTED | `unstable_cache` with tags (`site-data`, `seo`, `content`) |
| Structured data for categories/cities | NOT_VERIFIED | City/category pages have breadcrumb JSON-LD; RealEstateListing list schema NOT_FOUND |
| Hreflang | NOT_FOUND | Site is India-only English; acceptable |
| Image alt text | NOT_VERIFIED | |
| Core Web Vitals | NOT_VERIFIED | No measurement setup found |
| `noindex` on dashboards | IMPLEMENTED | `metadata` in `(app)/layout.tsx` sets `robots: { index: false }` |
| Admin panel noindex | NOT_VERIFIED | `admin/layout.tsx` not fully read — likely blocked by robots.txt `/admin` rule |

---

## 17. AEO / GEO Audit

| Feature | Status | Notes |
|---|---|---|
| `/llms.txt` | IMPLEMENTED | Dynamic, lists categories, cities, live listings (up to 100) |
| Blog key_takeaways | IMPLEMENTED in code | Blocked by pending migration 0008 |
| Blog FAQ accordion + FAQPage schema | IMPLEMENTED in code | Blocked by pending migration 0008 |
| Named author with role/bio | IMPLEMENTED in code | Blocked by pending migration 0008 |
| Concise answer blocks | NOT_FOUND | No structured "quick answer" boxes on listing or city pages |
| Internal linking strategy | NOT_VERIFIED | |

---

## 18. EEAT Audit

| Signal | Status | Notes |
|---|---|---|
| Author bio on blog | IMPLEMENTED in code (pending migration) | `author_role`, `author_bio` columns + UI done |
| Organization details in SEO settings | IMPLEMENTED | `orgName`, `orgPhone`, `orgEmail`, `orgLogo` configurable in `/admin/seo` |
| Verification badge system | PARTIALLY_WORKING | `is_verified` computed correctly; `aiScreened` label exists; "humanReview" feature flag off |
| RERA disclaimer page | IMPLEMENTED | `/rera-disclaimer` route exists |
| "Listed by X" broker attribution | NOT_IMPLEMENTED | Feature planned, badge not rendered |
| Trust signals on homepage | WORKING | Floating trust cards in hero (verified count, avg price from live data) |
| About page | WORKING | `/about` route |
| Privacy policy | WORKING | `/privacy` |
| Terms of service | WORKING | `/terms` |

---

## 19. Performance Audit

| Issue | Severity | Notes |
|---|---|---|
| Dead npm dependencies in bundle | P2 | `react-simple-maps`, `d3-geo`, `@react-three/fiber`, `three` in `dependencies` (not devDependencies) — will be included in client bundle even if tree-shaken |
| `getSession()` calls `profiles` SELECT on every authenticated request | P2 | No JWT claim caching; extra DB round trip per request |
| `getFeatures()` and `getSeoGlobal()` are cached via `unstable_cache` | WORKING | 300s revalidation |
| No `generateStaticParams` for listing detail | P2 | All listing pages are dynamic; high-traffic listings will hit DB on every request |
| `rowToListing` runs for every listing in a list query | P2 | No pagination in some admin views (`adminListings` has no LIMIT) |
| `adminListings` with no `LIMIT` | MEDIUM | Could return thousands of rows as listing count grows |
| Images | NOT_VERIFIED | `hero_image` and `gallery` are raw URLs; no Next.js Image optimization confirmed |
| framer-motion in client bundle | INFO | Used for homepage animations; accepted dependency |

---

## 20. Frontend Architecture Audit

| Issue | Status | Notes |
|---|---|---|
| Two UI systems | KNOWN_DEBT | Old: `src/ui/screens/*` + `AppProvider`/localStorage. New: `src/ui/dashboards/*` + server components. Documented, migration planned. |
| `AppShell` is a large client component | KNOWN_DEBT | Wraps entire site layout; handles saved/compare state |
| `DataProvider` passes all demo/live listing data to client | P2 | `getSiteData()` result passed to every public page via context; may over-fetch |
| No `"use client"` discipline violation found | WORKING | Server components default; client components appropriately marked |
| Admin panel uses its own primitive set | WORKING | `src/app/admin/ui.tsx` — intentional fixed-palette design system |
| `src/ui/types.ts` and `src/lib/types.ts` are separate type files | P2 | Some type duplication (both define listing-related shapes) |

---

## 21. Backend / Service Architecture Audit

| Issue | Status | Notes |
|---|---|---|
| Three Supabase clients | WORKING | `server.ts` (RLS cookie), `service.ts` (bypasses RLS), `client.ts` (browser) — clear separation |
| `server-only` import guard | WORKING | `service.ts` and db/* files use `import "server-only"` |
| Server actions as primary mutation path | WORKING | Very few REST API routes (track, dev-login) |
| No external queue/job system | INFO | AI calls are fire-and-forget; notifications synchronous per request |
| No staging Supabase project | RISK | Single production Supabase project; E2E live tier gated by double env check |
| `notify()` errors are swallowed | WORKING | `console.error` on channel failure; notification never blocks the triggering action |
| `screenAndStore()` errors are swallowed | WORKING | Intentional — AI screening must never block a submission |

---

## 22. API / Server Action Audit

| Endpoint/Action | Method | Auth | Role | Input Validation | DB Access | Sensitive Data | Risk |
|---|---|---|---|---|---|---|---|
| `POST /api/track` | POST | None (anonymous) | Any | vid/sid format, content-length, rate limit | `events` (service role insert) | user_id (if signed in) | LOW |
| `POST /api/dev-login` | POST | None | Dev only | Role enum validation | None | Dev cookie set | LOW (disabled in prod) |
| `decideListing` | Server action | `requireAdmin()` | Admin | status enum, id length | `properties` (service) | None | LOW |
| `decideDocument` | Server action | `requireAdmin()` | Admin | status enum, id length | `verification_documents` (service) | None | LOW |
| `changeRole` | Server action | `requireAdmin()` | Admin | role enum, id length | `profiles` (service via db/admin) | None | MEDIUM (role assignment) |
| `verifyBroker` | Server action | `requireAdmin()` | Admin | id length, verified bool | `broker_profiles` (service) | None | LOW |
| `createClientAction` | Server action | `requireAdmin()` | Admin | name required, trim/slice | `broker_profiles` (service) | None | LOW |
| `setClientStatusAction` | Server action | `requireAdmin()` | Admin | status enum | `broker_profiles` (service) | None | LOW |
| `saveSeoGlobal` | Server action | `requireAdmin()` | Admin | all fields trimmed/sliced | `site_settings` (service) | orgPhone/Email | LOW |
| `submitListingAction` | Server action | `getSession()` | seller/broker | extensive validation | `properties`, `listing_contacts`, `verification_documents` (service) | contactPhone | MEDIUM |
| `updateListingAction` | Server action | `getSession()` | owner/broker/admin | area/price/phone validation, triple auth check | `properties`, `listing_contacts` (service) | contactPhone | MEDIUM |
| `markListingSold` | Server action | `getSession()` | owner/broker/admin | uuid format, triple auth check | `properties` (service) | None | LOW |
| `setLeadStatus` | Server action | `getSession()` | owner/broker/admin | status whitelist, uuid format, triple auth check | `enquiries` (service) | None | LOW |
| `saveBrokerProfile` | Server action | `getSession()` | broker/admin | field trim/slice | `broker_profiles` (service) | None | LOW |
| `inviteStaffAction` | Server action | `getSession()` | broker only (must have brokerId) | email regex | `profiles`, auth.admin (service) | email | MEDIUM |
| `revealContactAction` | Server action | `getSession()` | Any signed-in | uuid/demo-id check | `listing_contacts` (service), rate limit | phone, name | MEDIUM |
| `submitEnquiryAction` | Server action | `getSession()` | Any signed-in | id, message trim, date format | `enquiries` (service) | None | LOW |
| `trackViewAction` | Server action | None | Any | uuid/demo-id check | `properties` rpc (service) | None | LOW |
| `markNotificationsRead` | Server action | `getSession()` | Any signed-in | — | `notifications` (service) | None | LOW |

---

## 23. Analytics / Tracking Audit

- First-party analytics via `src/ui/tracking/TrackingProvider.tsx` + `src/app/api/track` + `events` table.
- Events tracked: `page_view`, `click`, `scroll`, `page_leave`, `form_step`, `form_field`, `search`, `listing_submitted`, `contact_unlock`, `enquiry_sent`.
- Anonymous visitor ID (`vid`) stored as a first-party cookie; session ID (`sid`) resets after 30 min inactivity.
- Admin can view analytics at `/admin/analytics` and `/admin/journey`.
- `purge_old_events()` function exists for 13-month retention; NOT_VERIFIED if scheduled anywhere.
- No GA4, no Meta Pixel, no third-party analytics found — intentional per consent architecture.
- Consent banner controlled by `features.consentBanner` flag.

---

## 24. Privacy / DPDP Readiness

| Requirement | Status | Notes |
|---|---|---|
| Privacy policy page | IMPLEMENTED | `/privacy` |
| Consent banner | IMPLEMENTED (gated) | `features.consentBanner`, `ExitIntent.tsx` | 
| No third-party trackers | IMPLEMENTED | First-party only |
| Data retention policy | IMPLEMENTED in DB | 13-month purge function for events |
| Phone number masking in public API | IMPLEMENTED | `maskPhone()` in `format.ts` |
| Right to erasure / DPDP | NOT_VERIFIED | No account deletion flow found |
| Data processor agreements (Supabase) | NOT_VERIFIED | |

---

## 25. Accessibility Audit

| Issue | Status | Notes |
|---|---|---|
| Stretched-link pattern (ListingGrid) | FIXED | `role="link"`, keyboard-accessible, `onClick`/`onKeyDown` |
| Icon buttons in listing cards have `z-10` | FIXED | Sit above stretched link hit area |
| Auth modal accessible | NOT_VERIFIED | |
| Focus management | NOT_VERIFIED | |
| Semantic heading hierarchy | NOT_VERIFIED | |
| ARIA labels on icon-only buttons | NOT_VERIFIED | |

---

## 26. SEO Content Architecture

- City pages: `/city/[slug]` with stats bar, popular-areas chips, listing grid — WORKING
- Category pages: `/category/[slug]` — WORKING
- Blog/Market Insights: `/blog` + `/blog/[slug]` — WORKING (EEAT fields pending migration)
- No content hub strategy beyond blog and city/category pages
- No programmatic SEO for micro-markets (e.g. `/city/noida/sector-62`) — NOT_IMPLEMENTED
- Redirects table exists but NOT_VERIFIED if middleware consumes it

---

## 27. Feature Flag / Settings Audit

| Flag | Default | Current in DB | Notes |
|---|---|---|---|
| `collectDocuments` | false | NOT_VERIFIED | |
| `aiScreening` | true | NOT_VERIFIED | AI calls fire-and-forget |
| `humanReview` | false | NOT_VERIFIED | Controls "Verified" badge display |
| `brokers` | false | ON (confirmed live per progress tracker) | |
| `tracking` | true | NOT_VERIFIED | |
| `consentBanner` | true | NOT_VERIFIED | |
| `unlockLimitPerDay` | 20 | NOT_VERIFIED | DB-backed rate limit |
| `notifyInApp` | true | NOT_VERIFIED | 0006 migration applied |
| `notifyEmail` | false | NOT_VERIFIED | Needs RESEND_API_KEY |
| `notifyWhatsapp` | false | NOT_VERIFIED | Needs MSG91_API_KEY |

---

## 28. Code Quality

| Item | Location | Notes |
|---|---|---|
| `console.error` | `src/lib/notify.ts` | Intentional — channel failure logging |
| Dead `react-simple-maps` / `d3-geo` imports still in `package.json` | `package.json` | Remove in next cleanup |
| Dead `@react-three/fiber`, `three` | `package.json` | `Hero3D.tsx` exists; NOT_VERIFIED if active |
| `// eslint-disable-next-line @typescript-eslint/no-explicit-any` | `src/lib/db/*.ts` | Acceptable per doc standards in row-mapping functions |
| Mock data still in production path | `src/ui/data/demoNcr.ts`, `mockData.ts` | Used as fallback when DB returns no data |
| `MOCK_BROKERS` falls back in production | `src/lib/db/listings.ts` | Intentional — until first verified client |
| `TODO`s / `FIXME`s | Not found in audit | |
| Hardcoded HSN phone removed | per progress tracker | Was caught and fixed before shipping |
| `GROQ_MODEL=openai/gpt-oss-20b` in `.env.example` | `.env.example` | Model name looks unusual — may be a Groq-specific alias |

---

## 29. Environment / Secrets Audit

| Variable | Classification | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | PUBLIC | Exposed to browser; expected |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | PUBLIC | Anon/publishable key; expected |
| `SUPABASE_SERVICE_ROLE_KEY` | SECRET | Server-only; bypasses RLS — must never reach browser |
| `GROQ_API_KEY` | SECRET | Server-only AI calls |
| `XAI_API_KEY` | SECRET | Server-only AI calls |
| `GROQ_MODEL` | SERVER-ONLY | Not a secret but not public |
| `XAI_MODEL` | SERVER-ONLY | Not a secret but not public |
| `NEXT_PUBLIC_SITE_URL` | PUBLIC | Used in SEO metadata |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | PUBLIC | Business WhatsApp number |
| `RESEND_API_KEY` | SECRET | Not yet set (email notifications not live) |
| `MSG91_API_KEY` | SECRET | Not yet set (WhatsApp not live) |
| `NOTIFY_EMAIL_FROM` | SERVER-ONLY | Defaults to `PLOTSS <notifications@plotss.in>` if unset |

`.env` file exists at project root — NOT read by this audit (as instructed). `.env.example` has no real values.

---

## 30. Testing Audit

| Test Suite | Coverage | Status |
|---|---|---|
| `tests/core.test.tsx` | Core logic (format, mask, markdown XSS) | PASSING (26/26 per progress tracker) |
| `tests/geo-quality.test.ts` | Geo/location logic | PASSING |
| `tests/journey.test.ts` | User journey helpers | PASSING |
| `tests/search.test.ts` | Search/filter logic | PASSING |
| `tests/sla.test.ts` | SLA calculation (business days) | PASSING |
| `e2e/auth.spec.ts` | Auth flows | PASSING (demo tier) |
| `e2e/buyer-dashboard.spec.ts` | Buyer dashboard, save sync gap documented | PASSING (demo tier) |
| `e2e/seller-dashboard.spec.ts` | Seller flows | PASSING (demo tier) |
| `e2e/broker-dashboard.spec.ts` | Broker cross-tenant isolation | PASSING (demo tier + live tier template) |
| `e2e/admin-panel.spec.ts` | Admin approve/reject, client suspend | PASSING (demo tier) |
| CI integration | NOT_FOUND | No `.github/workflows/` or CI config found |
| Live E2E in CI | NOT_POSSIBLE | No staging Supabase project; live tier requires prod confirmation gate |

---

## 31. Documentation vs Reality

| Feature | Docs say | Code says | Reality |
|---|---|---|---|
| `features.brokers` default | false | `DEFAULT_FEATURES.brokers = false` | ON in live DB (confirmed per progress tracker) |
| Email notifications | "Wired but no-op until provider" | `sendEmail()` checks `RESEND_API_KEY` | Correct — no-op |
| WhatsApp notifications | "Wired but no-op until provider" | `sendWhatsapp()` checks `MSG91_API_KEY` | Correct — no-op |
| 0008 migration | "Needs to be run" | Blog admin form writes these fields | BLOCKED — `blog_posts.key_takeaways` column missing |
| 0007 migration | "Needs to be run" per earlier entry, then "confirmed applied" | trigger in 0007 | Applied (notifications table reachable per tracker) |
| Admin email | `dm@techbliss.in` in migration | `UPDATE profiles SET role = 'admin'` | Applied — single super admin |
| `react-simple-maps` | "Replaced by static SVG" | Still in `package.json` | Dead dependency |
| Dual UI systems | "Documented debt, not yet unified" | Two parallel systems coexist | Confirmed — migration not started |
| Blog EEAT | "In progress" | Code is ready, migration not applied | BLOCKED on user running 0008 |

---

## 32. Truth Map

### Built and verified
- Multi-client (broker) data model, RLS, staff scoping
- Admin panel: listings approval, clients, users, SEO, content, theme, blog, analytics, notifications, redirects
- Seller dashboard: listing CRUD, leads, SLA badge
- Broker dashboard: multi-listing, leads, team invite
- Notification system (in-app channel)
- Durable rate limiting
- Password reset flow
- Auth (email+password, Google, OTP)
- First-party analytics pipeline
- SEO infrastructure (sitemap, robots, llms.txt, JSON-LD, metadata)
- AEO/GEO (llms.txt, blog FAQ/key_takeaways code)
- India map (static SVG, honest "Coming soon" pins)
- Homepage hero with live trust signals
- SLA computation (sla.ts, unit tested)

### Built but incomplete
- Buyer dashboard (save sync gap with old UI system)
- Blog EEAT fields (code ready, migration 0008 not yet applied)
- Broker public profile (falls back to mock data)
- Email/WhatsApp notifications (code ready, no provider configured)

### Built but risky
- `adminListings()` has no LIMIT — will degrade as listing count grows
- `inviteStaffAction` caps user search at 1000 users
- Contact data fetched in all listing reads via service client (masking relies on app layer)

### UI only
- Price fairness indicator (populated from mock `details` jsonb; NOT_VERIFIED against live data)
- AI match score (field exists; scoring pipeline NOT_VERIFIED as live)

### Backend only
- Redirects table (no middleware handler verified)
- `purge_old_events()` function (no scheduler)

### Planned but missing
- Dark mode
- Micro-market SEO landing pages
- "Switch dashboard" navigation
- Account deletion / DPDP right-to-erasure
- Multi-role user model (capabilities)
- Staging Supabase project
- CI/CD pipeline

### Unknown / not verified
- `signedDocUrl()` for private verification documents
- `Organization` and `WebSite` JSON-LD rendering in root layout
- Indian public holiday support in SLA
- Redirects table consumed by middleware

---

## 33. Priority Matrix

| Issue | Area | Severity | Business Impact | Security Impact | Effort | Priority |
|---|---|---|---|---|---|---|
| Migration 0008 not applied (blog EEAT fields) | SEO/AEO | HIGH | Blog admin broken for new fields | None | S (user runs SQL) | P0 |
| No CI/CD pipeline | DevOps | HIGH | Any push can break prod silently | MEDIUM | M | P0 |
| Email notification provider not configured | UX | HIGH | Listing approval notifications not reaching sellers | None | S (env var + flip flag) | P0 |
| `adminListings()` no LIMIT | Performance | MEDIUM | Will degrade as listing count grows | None | S | P1 |
| Dead npm dependencies in bundle | Performance | MEDIUM | Bundle bloat | None | S | P1 |
| Buyer dashboard save sync gap (dual UI systems) | UX | HIGH | Core buyer feature unreliable | None | XL | P1 |
| No role-switch / multi-capability navigation | UX | MEDIUM | Sellers can't browse as buyer | None | M | P1 |
| No staging Supabase project | DevOps | HIGH | E2E tests run against production | HIGH | M | P1 |
| `inviteStaffAction` caps at 1000 users | Auth | MEDIUM | Breaks at scale | None | S | P2 |
| Redirects table not consumed by middleware | SEO | MEDIUM | Redirect rules have no effect | None | S | P2 |
| No account deletion flow (DPDP) | Legal | MEDIUM | India DPDP compliance | None | M | P2 |
| `Organization` / `WebSite` JSON-LD not verified in root layout | SEO | MEDIUM | Missing structured data for Google | None | S | P2 |
| `purge_old_events()` not scheduled | Privacy | MEDIUM | Analytics events accumulate indefinitely | None | S (cron setup) | P2 |
| No programmatic micro-market SEO pages | SEO | MEDIUM | Missed long-tail traffic | None | L | P3 |
| Dark mode | UX | LOW | User preference | None | XL | P3 |
| `Hero3D.tsx` dead code with heavy deps | Performance | LOW | Bundle bloat | None | S | P3 |
