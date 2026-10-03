# 27. Agent Code Standards

**Audience: AI coding agents.** Concrete implementation rules, grounded in what this codebase actually does (not aspirational).

## General

- Keep modules small and single-purpose; `src/lib/db/*` is organized by entity (`listings.ts`, `admin.ts`, `dashboards.ts`, `contacts.ts`), not by screen.
- Fix root causes. Example of what "root cause" means here: when a listing-edit permission bug was found, the fix was adding `session.brokerId` to the authorization check in all three places it was duplicated — not adding a one-off special case.
- Don't mix unrelated concerns: a server action should do one thing (e.g. `setClientStatusAction` only flips `broker_profiles.status`; it does not also touch `profiles`).

## TypeScript

- Strict mode throughout (`tsconfig.json`). `tsc --noEmit` must be clean before considering a change done.
- Avoid `any`; where a Supabase join result is genuinely too dynamic to type precisely (common in `src/lib/db/*`'s row-mapping functions), a local `// eslint-disable-next-line @typescript-eslint/no-explicit-any` with a one-line reason is acceptable — don't spread untyped `any` further than the mapping function itself.
- Validate unknown external input (form data, server action params, URL params) before trusting it — see the `s()`/`text()` trimming-and-length-capping helpers used throughout `src/app/admin/actions.ts` and `src/app/(site)/post-listing/actions.ts` as the existing pattern to follow.

## Next.js

- Default to React Server Components. `"use client"` only for: forms with local state, anything using Supabase Auth from the browser (`AuthModal`, `AppProvider`), or genuine interactivity (filters, maps, the AI search box).
- Server actions (`"use server"` files) are the primary mutation mechanism — there is almost no REST API (`src/app/api/` only has `track` and the demo-only `dev-login`). Don't add a new API route when a server action will do.
- Route handlers / server actions stay focused: validate → authorize → mutate → revalidate/redirect. See `src/app/admin/actions.ts` for the house style (`requireAdmin()` first line of every action, `bust()` helper for cache invalidation, `revalidatePath()` last).

## Authorization (the rule that has been violated before — see [25 Architecture](25-agent-architecture.md))

- Every mutation that touches a `properties` row and uses `createServiceClient()` must check: `row.owner_id === session.id || (session.brokerId && row.broker_id === session.brokerId) || session.role === "admin"`. Don't ship a check that only covers `owner_id`.
- Prefer matching what the RLS policy for that table already allows (`supabase/migrations/0004_multi_client.sql` has the canonical policies) rather than inventing a new authorization shape.
- `requireAdmin()` (`src/lib/auth.ts`) has a **documented, intentional** bypass when Supabase isn't configured and `NODE_ENV !== "production"` — this is for local dev convenience and cannot fire in production. Don't "fix" it without understanding why it's there; don't rely on it for anything that matters either.

## Feature flags

- Any new togglable behavior belongs in `site_settings.features` (`src/lib/features.ts`/`features-shared.ts`), exposed as a toggle on `/admin/settings`, read via `getFeatures()`. Do not hardcode a role- or env-based gate for something that is really a product on/off switch.

## Styling

- Use the theme CSS variables and their Tailwind utility names (`bg-ivory`, `text-graphite`, `border-line`, `paint-clay`, `rounded-sm/md/lg`, `shadow-card`) — see [26 UI context](26-agent-ui-context.md). No raw hex or default Tailwind color palette (`slate-*`, `red-*`, etc.) outside `src/app/admin/**`, which is deliberately fixed-palette.
- New user-facing text: wrap in `<T k="...">` and regenerate the content registry (see [26 UI context](26-agent-ui-context.md)).

## Data and storage

- All relational data in Postgres via Supabase; no other datastore.
- Listing photos → `listing-photos` bucket (public); verification docs → `listing-docs` bucket (private, `signedDocUrl()` only, admin-only).
- Don't store secrets, service-role results, or large generated content in client-readable tables or response payloads.

## Testing

- Unit tests (Vitest, `tests/*.test.tsx`) for pure logic: formatting, masking, markdown rendering safety (XSS), rate limiting, SEO helpers. Run with `npm test`.
- E2E tests (Playwright, `e2e/*.spec.ts`): two tiers, demo (default, no secrets, `npm run test:e2e`) and live (`E2E_RUN_LIVE=true E2E_CONFIRM_NOT_PRODUCTION=true`, needs a real — ideally non-production — Supabase project). See `e2e/README.md` before adding a new live-tier test: it must seed its own disposable data (prefixed `e2e-plotss-test`) and tear it down in `global-teardown.ts`.
- A change to authorization logic is not done until there's a Playwright test proving the boundary in both directions (can reach what it should, cannot reach what it shouldn't) — see `e2e/broker-dashboard.spec.ts` as the template.

## File organization

- `src/lib/` — shared infrastructure: Supabase clients, auth/session helpers, business-logic query functions, SEO, AI, formatting.
- `src/app/**/actions.ts` — server actions, colocated with the route tree they serve.
- `src/ui/` — UI composition for the public/dashboard screens (two systems coexist — see [25 Architecture](25-agent-architecture.md)).
- `src/app/admin/` — the super-admin panel, including its own `ui.tsx` primitives and `actions.ts`.
- `supabase/migrations/` — numbered SQL migrations, additive only.
- `e2e/`, `tests/` — see Testing above.
- Name files after the responsibility they contain (`dashboards.ts`, `contacts.ts`), not after a screen or a technology.
