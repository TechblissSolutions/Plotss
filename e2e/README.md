# PLOTSS E2E tests

Two tiers, because PLOTSS only has one Supabase project today (production — see `.env`), and RLS/multi-tenant
behaviour can only be proven against a real Postgres database.

## Default tier — no secrets, runs everywhere

`npm run test:e2e` (or `npx playwright test`). `playwright.config.ts` starts `next dev` with the
Supabase env vars blanked out, which puts the app in **demo mode**:

- `/api/dev-login` becomes reachable (it 404s whenever Supabase is configured or `NODE_ENV=production`)
  — `e2e/auth.setup.ts` uses it to generate `e2e/.auth/{buyer,seller,broker,admin}.json` storageState
  files before the real specs run, so they don't click through login every time.
- `getLiveListings()` falls back to the 10 built-in NCR demo listings, so buyer-dashboard flows (save,
  enquiry) have real cards to click.
- Anything that needs `isDbReady()` (seller listings, admin queues, broker leads, clients) returns empty —
  those specs assert the correct **empty state**, not fabricated data.

This tier is what runs in CI on every push/PR (`.github/workflows/playwright.yml`, the `test` job) and
never touches any real database.

## Live tier — opt-in, needs a real (non-production) Supabase project

Some things are impossible to test without a real database:

- **Cross-tenant RLS isolation** (`broker-dashboard.spec.ts`) — RLS is a Postgres feature.
- **Real listing lifecycle** (`seller-dashboard.spec.ts`'s live block, `admin-panel.spec.ts`'s live block) —
  `submitListingAction`/`adminListings`/etc. are all `isDbReady()`-gated.
- **Real email/password auth** (`auth.spec.ts`'s live block) — the email/password and Google buttons only
  render once Supabase is actually configured.

Run with:

```
E2E_RUN_LIVE=true E2E_CONFIRM_NOT_PRODUCTION=true npx playwright test
```

Both env vars are required — `E2E_CONFIRM_NOT_PRODUCTION` is a deliberate speed bump (see
`e2e/support/live-db.ts`) against accidentally pointing this at production. **Set it to `true` only once
you've confirmed** `E2E_SUPABASE_URL`/`E2E_SUPABASE_SERVICE_ROLE_KEY` (or their fallbacks,
`NEXT_PUBLIC_SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`) point at a **separate, disposable** Supabase
project — ideally its own free-tier project with the same migrations applied, not the one PLOTSS actually
launches on.

What it does:

1. `e2e/global-setup.ts` seeds, via the service role: two client businesses (`broker_profiles`), one
   buyer/seller/admin test user and two broker staff users (one per client), and a handful of listings —
   all prefixed `e2e-plotss-test` so they're identifiable and disposable. It then signs each user in
   through the *real* login form and saves `e2e/.auth/live-{key}.json`.
2. Specs run against that seeded data.
3. `e2e/global-teardown.ts` deletes every seeded row and every seeded auth user (which cascades their
   `profiles` row) regardless of pass/fail.

If you interrupt a live run before teardown, look for `broker_profiles`/`auth.users` rows named
`e2e-plotss-test-*` and remove them by hand.

### CI

`.github/workflows/playwright.yml` has a `test-live` job, commented out, that runs this tier against repo
secrets (`E2E_SUPABASE_URL`, `E2E_SUPABASE_SERVICE_ROLE_KEY`, `E2E_SUPABASE_ANON_KEY`). Uncomment it only
after creating a dedicated staging Supabase project and adding those secrets — do not point it at
PLOTSS's production project/URL.

## Known gaps, found while writing these specs (not test bugs — product gaps)

- **No delete capability for a seller's own listing** anywhere in the app (only "Mark as sold", which
  hides rather than removes). `seller-dashboard.spec.ts` has a `test.fixme` documenting this instead of
  testing a feature that doesn't exist.
- **No buyer-facing "view request status" screen.** An enquiry's status (open/contacted/visit/closed) is
  only ever shown to the seller/broker in their "Lead pipeline" — a buyer who submits one has no way to
  check on it. Noted in `buyer-dashboard.spec.ts`.
- **Fixed while building these tests:** three server actions used the service-role client to bypass RLS
  and only checked `owner_id === session.id`, never `broker_id` — `dashboard/edit/[id]/page.tsx`,
  `edit-actions.ts`'s `updateListingAction`, and `(app)/actions.ts`'s `markListingSold` (the last one even
  explicitly revalidated `/dashboard/broker`, implying it was meant to work for brokers already). Net
  effect: a client's own staff could never edit or mark sold a teammate's listing, even one correctly
  attributed to their shared business via `broker_id` — only the specific person who originally posted it
  (whose `owner_id` matches) could touch it. Not a cross-tenant leak (`owner_id` is unique per user, so it
  never accidentally matched a *different* business), but exactly the "service role + incomplete manual
  authorization" pattern step 4 asks to flag — the RLS policies in `0004_multi_client.sql` already
  supported this correctly; the hand-written checks in these three places just hadn't caught up. All three
  now also allow `session.brokerId === property.broker_id`. See `broker-dashboard.spec.ts`'s second test,
  which locks in the corrected boundary in both directions.
