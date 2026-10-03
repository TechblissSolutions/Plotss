# 25. Agent Architecture Context

**Audience: AI coding agents.** Read before any architectural decision. Expands on [06 System architecture](06-system-architecture.md) with the parts that matter most for correct, safe changes.

## Stack

| Layer | Technology | Role |
|---|---|---|
| Framework | Next.js 16 (App Router) + TypeScript, strict mode | Server/client boundary, routing, server actions |
| Styling | Tailwind CSS v4 (`@theme inline`) | All visual tokens come from `src/app/globals.css`, driven by `src/lib/theme/*` (admin-editable) |
| Database + Auth | Supabase (Postgres + Row Level Security + Supabase Auth + Storage) | Single source of truth; RLS is the real authorization boundary, not just app code |
| AI | xAI Grok (not Claude/OpenAI) via `XAI_API_KEY`/`XAI_MODEL` | Listing-description assist, natural-language search parsing, risk screening |
| Unit tests | Vitest | `tests/*.test.tsx`, pure-function and rendering-safety checks |
| E2E tests | Playwright | `e2e/*.spec.ts` — two tiers, demo (no secrets) and live (real Supabase), see `e2e/README.md` |

No Prisma, no Clerk, no Liveblocks, no Trigger.dev — those belong to a different reference project; do not introduce them here without an explicit decision recorded in [29 Progress tracker](29-agent-progress-tracker.md).

## System boundaries

- `src/app/` — routes. `(site)` = public marketplace, `(app)` = signed-in dashboards, `admin/` = super-admin panel, `api/` = the few real HTTP endpoints (tracking, dev-login).
- `src/app/**/actions.ts` — Next.js server actions. This is where mutations happen. **Every one of these that uses the service-role client must replicate authorization exactly — see the Authorization rule below.**
- `src/lib/db/*` — read/query functions (`listings.ts`, `admin.ts`, `dashboards.ts`, `contacts.ts`, `cities.ts`, `blog.ts`). Business logic for shaping DB rows into UI-facing types lives here, not in components.
- `src/lib/supabase/{server,service,client}.ts` — three distinct Supabase clients: `server.ts` (cookie-bound, respects RLS, public reads), `service.ts` (service-role key, **bypasses RLS entirely** — server-only, never import from a client component), `client.ts` (browser, respects RLS, used by `AuthModal` and anything calling Supabase Auth directly from the browser).
- `src/ui/` — **two coexisting UI systems, see "Known architecture debt" below.**
- `supabase/migrations/*.sql` — numbered, additive, idempotent where practical. Never edit an already-applied migration; add a new one.
- `e2e/`, `tests/` — see [12 Testing & QA](12-testing-and-qa.md) and `e2e/README.md`.

## Storage model

- All metadata (listings, users, clients, enquiries, content, SEO, analytics) lives in Postgres via Supabase.
- Listing photos → Supabase Storage bucket `listing-photos` (public read). Verification documents → `listing-docs` (private, signed URLs only, admin-only).
- No blob storage, no separate artifact layer — this is a simpler storage model than a canvas/spec-generation product; don't add one speculatively.

## Multi-tenant (multi-client) model

- A **client** = a row in `broker_profiles` (name, firm_name, `status: active|suspended`, `verified`). This table predates the multi-client feature (it used to model a single self-registered broker) and was deliberately extended rather than replaced with a new `clients` table — see the decision log in [29 Progress tracker](29-agent-progress-tracker.md).
- A client can have **multiple staff logins**: `profiles.broker_id` points a `role = 'broker'` user at their business.
- A listing belongs to a client via `properties.broker_id` (nullable — null means an individual FSBO seller, attributed only via `owner_id`).
- **RLS is the real boundary** (`supabase/migrations/0004_multi_client.sql`): `is_broker_staff_for(broker_id)` lets a business's staff manage only that business's properties/images/docs/enquiries. A suspended client's listings are hidden from `properties_public_read` automatically.
- Super admin (`role = 'admin'`) bypasses every RLS policy globally — this is intentional and existing, not something to narrow.

### Authorization rule (non-negotiable)

Every server action that uses `createServiceClient()` to mutate a `properties` row **must** check both:
```ts
const allowed = row.owner_id === session.id || (session.brokerId && row.broker_id === session.brokerId) || session.role === "admin";
```
This exact bug (checking only `owner_id`, never `broker_id`) was found and fixed three times in one pass (`dashboard/edit/[id]/page.tsx`, `edit-actions.ts`, `(app)/actions.ts`'s `markListingSold`) — see `e2e/README.md`'s "Known gaps" section. **Treat RLS as the spec for what app-level checks should allow; never let a hand-written check be narrower than the RLS policy, and never let it be wider.**

## Feature flags

`site_settings.features` (row `key = 'features'`, read via `getFeatures()`/written via `writeFeatures()`) is the **only** sanctioned way to toggle a feature publicly. Current flags: `collectDocuments`, `aiScreening`, `humanReview`, `brokers`, `tracking`, `consentBanner`, `unlockLimitPerDay`. When adding the notification system (see [29 Progress tracker](29-agent-progress-tracker.md)), extend this same object (e.g. `notifyEmail`, `notifyWhatsapp`, `notifyInApp`) and expose the toggles on `/admin/settings` — do not invent a second flags mechanism.

## Known architecture debt

1. **Two parallel UI/data systems for the public-facing buyer experience.**
   - **Old**: `src/ui/screens/*` (`HomeScreen`, `SearchScreen`, `PropertyDetailScreen`) + `src/ui/AppProvider.tsx`, driven by client-side React state and `localStorage` for saved listings (`AppShell.toggleSave`). Used by `/`, `/search`, `/listing/[slug]` via `src/ui/routes.tsx`.
   - **New**: `src/app/(app)/dashboard/*` + `src/ui/dashboards/*`, plain server components reading real DB state (`buyerData()`, `sellerData()`, `brokerData()` in `lib/db/dashboards.ts`). No localStorage involved.
   - These two don't talk to each other: saving a listing on `/listing/[slug]` (old system) does not reliably appear in `/dashboard/buyer`'s "Saved listings" (new system) in demo mode, and only syncs in live mode because `setSaved()` happens to write to the same `saved_listings` table the dashboard reads — see the finding in `e2e/buyer-dashboard.spec.ts`.
   - **Decision (recorded here per user instruction 2026-09-xx): unify onto the new (server-rendered, DB-backed) pattern.** This is a planned migration, not yet started — track it in [29 Progress tracker](29-agent-progress-tracker.md) before beginning. Until it's unified, do not add new localStorage-dependent features to the old screens.
2. **Single Supabase project.** Production and (any future) test/staging data share one project — the `e2e/` live tier is deliberately opt-in and double-gated (`E2E_RUN_LIVE` + `E2E_CONFIRM_NOT_PRODUCTION`) because of this. Get a dedicated staging project before relying on the live E2E tier in CI.
3. **No notification system yet.** Nothing in the codebase sends email/SMS/WhatsApp or writes in-app notification rows. This is required for the listing-approval flow (see [24 Project overview](24-agent-project-overview.md)) and is planned, not built — see [29 Progress tracker](29-agent-progress-tracker.md).

## Invariants

1. Request handlers / server actions do not do long-running work; AI calls (`src/lib/ai/*`) are fire-and-forget best-effort (e.g. `screenAndStore` failures never block a submission).
2. RLS is the authorization source of truth; app-level checks mirror it exactly (see Authorization rule above).
3. `createServiceClient()` is server-only — never imported into a `"use client"` file.
4. Feature toggles live only in `site_settings.features`.
5. Client components (`"use client"`) are used only where browser interactivity, hooks, or Supabase Auth-from-the-browser is actually required; dashboards and admin pages default to server components.
6. A listing's `broker_id` (client attribution) and `owner_id` (who posted it) are independent — code must not assume one implies the other.
7. Migrations are additive and numbered; never edit one already applied to a real database.
