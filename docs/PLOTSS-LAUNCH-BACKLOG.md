# PLOTSS Launch Backlog

_Generated: 2026-10-05. Updated: 2026-10-07 — capabilities model moved from P3-1 to P1-0 (pre-launch requirement)._
_Effort: S = hours, M = 1-2 days, L = 3-5 days, XL = 1+ week._

> **⚠️ PRIORITY REVISION (2026-10-07)**
> Multi-capability account model (previously P3-1) is now a **pre-launch requirement**.
> It has been moved to P1-0 (highest P1 priority, must complete before workspace navigation work).
> See `docs/PLOTSS-ARCHITECTURE-DECISIONS.md` Section 10 for the full decision.

---

## P0 — Launch Blockers

| # | Title | Area | What's missing/broken | Effort | Depends on |
|---|---|---|---|---|---|
| P0-1 | Run migration 0008 (blog EEAT fields) | Database | `blog_posts.key_takeaways`, `faq`, `author_role`, `author_bio` columns missing. Admin blog form will error when saving EEAT fields. | S (user runs SQL) | — |
| P0-2 | Configure email notification provider | Notifications | `notifyEmail` feature flag is off; no `RESEND_API_KEY` set. Sellers never receive listing decision emails. Critical for a seller-trust loop. | S (env var) + M (pick provider, test) | — |
| P0-3 | Verify `Organization` and `WebSite` JSON-LD are rendered in root layout | SEO | `orgLd()` and `websiteLd()` are defined in `src/lib/seo.ts` but not found being rendered in `src/app/layout.tsx` during audit. Missing structured data affects Google Knowledge Panel and SearchAction. | S (add script tags to layout) | — |
| P0-4 | Set up CI/CD pipeline | DevOps | No `.github/workflows/` found. Any push to master can silently break production. | M | — |

---

## P1 — Pre-launch (Important)

| # | Title | Area | What's missing/broken | Effort | Depends on |
|---|---|---|---|---|---|
| **P1-0** | **Multi-capability account model** | **Architecture** | **`profiles.role` single enum prevents one user being Buyer + Seller + Broker. Must introduce `account_capabilities` table, rewrite `is_broker_staff_for()` and `is_admin()` RLS functions, update all server actions that branch on `role`, build capability onboarding step, migrate all existing role data. This is the largest single pre-launch change.** | **XL** | **P0 complete; CHUNK 0 approved** |
| P1-1 | Add LIMIT to `adminListings()` | Performance/DB | `src/lib/db/admin.ts:adminListings()` has no `.limit()` call. Will degrade as listing count grows into hundreds. Add pagination (cursor or offset). | S | — |
| P1-2 | Remove dead npm dependencies | Performance | `react-simple-maps`, `d3-geo` confirmed dead. `@react-three/fiber`, `three` need verification (`Hero3D.tsx`). Removing dead deps reduces client bundle. | S | Verify Hero3D.tsx usage |
| P1-3 | Verify / wire middleware for `redirects` table | SEO | `redirects` table exists and is admin-editable, but no `middleware.ts` found that reads it. Redirect rules have no effect. | M | — |
| P1-4 | Schedule `purge_old_events()` | Privacy/DPDP | The 13-month analytics retention function exists in migration 0003 but is never called. Needs a Supabase scheduled function or external cron. | S | — |
| P1-5 | Create a staging Supabase project | DevOps | Single production project is the only environment. E2E live tier cannot safely run in CI without a staging project. | M | — |
| P1-6 | Add account deletion flow (DPDP compliance) | Legal | India's DPDP Act requires a right-to-erasure path. No account deletion UI or server action found. | M | P1-5 (test against staging) |
| P1-7 | Fix buyer dashboard save sync gap | UX | Old UI system writes saves to `localStorage` and merges to DB only on login. New dashboard reads from DB. Saves made while logged out may not appear in buyer dashboard. | L | Decision on dual-UI migration |
| P1-8 | Add `noindex` to admin layout | SEO | `/admin` is blocked in `robots.txt` but if `admin/layout.tsx` doesn't set `robots: { index: false }` in metadata, direct URL access without crawl protection would be indexable. Verify and add. | S | — |
| P1-9 | Verify `signedDocUrl()` implementation for private docs | Security | Admin viewing verification documents needs signed URLs (private bucket). `signedDocUrl()` was not found in the audit. If missing, admin cannot open uploaded docs. | S-M | — |
| P1-10 | Resolve dual `0004_` migration filename | DevOps | `0004_multi_client.sql` and `0004_profile_phone_from_metadata.sql` share the same numeric prefix. Document the applied order in a comment, and establish a naming convention to prevent future conflicts. | S | — |

---

## P2 — Post-launch (Soon)

| # | Title | Area | What's missing/broken | Effort | Depends on |
|---|---|---|---|---|---|
| P2-1 | Configure WhatsApp/SMS notification provider | Notifications | `MSG91_API_KEY` not set; WhatsApp channel is a no-op. Needed for broad India reach where email open rates are low. | S (env var) + M (provider setup, template approval) | P0-2 (pick provider strategy) |
| P2-2 | Dual UI system unification | Architecture | `HomeScreen`, `SearchScreen`, `PropertyDetailScreen` still use `AppProvider`/localStorage pattern. The new server-rendered dashboard pattern is the target. | XL | Scope as separate unit per doc 28 rules |
| P2-3 | Add "switch view" navigation to dashboards | UX | A seller who wants to browse listings has no UI path. Dashboards have no sidebar. | M | P2-2 (or at minimum add links) |
| P2-4 | Add buyer requirements capture (onboarding) | CRO | No post-signup onboarding. New users have no guided path to either browse or post. | M | — |
| P2-5 | Add `buyer_requirements` table + match notifications | Features | Buyer states requirements; system sends notifications when matching listings go live. Currently only "new matches" appears as a UI concept — no DB model. | L | P2-4 |
| P2-6 | Add `suspended` status to properties | Features | Admin has no way to temporarily remove a live listing without rejecting it. Only `live → sold` or `live → rejected` exist. | S | — |
| P2-7 | Add `admin_audit_log` | Compliance | No audit trail for admin actions (approve, suspend, role change). | M | — |
| P2-8 | Pagination for `adminListings()` | Admin UX | P1-1 adds a LIMIT; this adds cursor/offset pagination UI in `/admin/listings`. | M | P1-1 |
| P2-9 | Add `Organization` / `WebSite` JSON-LD to homepage | SEO | If not already present (P0-3). WebSite JSON-LD enables Google's SearchAction (sitelinks search box). | S | P0-3 |
| P2-10 | Move notifications to Supabase Edge Functions | Architecture | Calling email/WhatsApp APIs synchronously from server actions can slow down listing approval. Decouple with a background job. | L | P0-2 |
| P2-11 | Verify AI match score pipeline in live mode | Features | `aiMatchScore` and `matchReasons` fields appear populated from `details` jsonb but the scoring pipeline (`screenAndStore`) stores a `risk` score, not a match score. Clarify or implement match scoring. | M | — |
| P2-12 | Add Core Web Vitals monitoring | Performance | No CWV measurement. Set up with Vercel Analytics or a Lighthouse CI step. | S | P0-4 (CI) |
| P2-13 | Cleanup dead imports and components | Code quality | `AbstractPlotVisual.tsx`, `Hero3D.tsx`, dead map deps — audit what's actually used and prune. | S-M | — |
| P2-14 | Add `generateStaticParams` for listing detail | Performance | All `/listing/[slug]` pages are fully dynamic. ISR with `revalidate` would dramatically reduce DB load for popular listings. | M | — |

---

## P3 — Nice to Have

| # | Title | Area | What's missing/broken | Effort | Depends on |
|---|---|---|---|---|---|
| ~~P3-1~~ | ~~Multi-role / capabilities model~~ | ~~Architecture~~ | **MOVED TO P1-0** (2026-10-07 — pre-launch requirement). | — | — |
| P3-2 | Micro-market SEO landing pages | SEO | No programmatic pages for `/city/noida/sector-62` etc. Long-tail search opportunity. | L | — |
| P3-3 | Dark mode | UX | Explicitly deferred. Requires audit of all components — not a token swap. | XL | P2-2 (UI unification first) |
| P3-4 | Post-enquiry buyer flow | CRO | Buyer sends enquiry → no "what happens next" prompt, no status tracking. | M | — |
| P3-5 | Seller response rate signal | Trust | No data collected. Would require tracking seller response events. | M | — |
| P3-6 | Indian public holidays in SLA | Operations | `sla.ts` excludes weekends only. Adding holidays list requires a configurable holiday dataset. | M | — |
| P3-7 | Per-client billing/plan tiers | Monetization | Explicitly out of scope for launch. | XL | Platform maturity |
| P3-8 | "Listed by X" broker badge on listing cards | Features | `features.brokers` is on; badge rendering not verified. Requires checking `ListingGrid` and `PropertyDetailScreen`. | S | Verify current state |
| P3-9 | Sitemap `changefreq` and priority tuning | SEO | Current sitemap has static priorities. Dynamic listing pages change frequently; blog changes rarely. | S | — |
| P3-10 | Buyer enquiry status visibility | UX | Buyer cannot see if a seller has read or responded to their enquiry. Requires new lead status events and a buyer leads view. | M | — |
