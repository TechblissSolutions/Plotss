import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { LIVE_ENABLED, type LiveSeed } from './support/live-db';

test.describe('admin panel — structure (demo mode)', () => {
  test.use({ storageState: path.join(__dirname, '.auth', 'admin.json') });

  test('approval queue, clients and users pages load with their empty states', async ({ page }) => {
    // adminListings()/adminClients()/adminUsers() all return [] when isDbReady() is false (see
    // lib/db/admin.ts), so an empty list here is the correct demo-mode behaviour, not a broken page.
    await page.goto('/admin/listings');
    await expect(page.getByRole('heading', { name: 'Approval queue' })).toBeVisible();
    await expect(page.getByText('You are all caught up.')).toBeVisible();

    await page.goto('/admin/clients');
    // "Clients" (page h1) and "Clients (0)" (card h2) both match a loose name filter — be exact.
    await expect(page.getByRole('heading', { name: 'Clients', exact: true })).toBeVisible();
    await expect(page.getByText('No clients yet')).toBeVisible();

    await page.goto('/admin/users');
    await expect(page.getByRole('heading', { name: 'Users & brokers' })).toBeVisible();
  });

  // NOTE: there is deliberately no "non-admin is redirected away from /admin" test in this demo-mode
  // block. lib/auth.ts's requireAdmin() reads: `if (!isSupabaseConfigured) { if (NODE_ENV === "production")
  // redirect("/"); return; }` — i.e. it's an intentional local-dev-only bypass that lets anyone (even a
  // signed-out visitor) reach /admin/* when Supabase isn't configured, specifically so admin pages are
  // browsable without a database during local development. It cannot fire in production (NODE_ENV check)
  // and demo mode is never how the deployed app runs, so this isn't exploitable — but it does mean role
  // enforcement for /admin can only be proven against a real Supabase-configured server. See below.
});

test.describe('admin panel — access control (live tier)', () => {
  test.skip(!LIVE_ENABLED, 'requireAdmin() only enforces role when Supabase is configured — see the note above.');

  test('a non-admin role is redirected away from /admin', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: path.join(__dirname, '.auth', 'live-buyer.json') });
    const page = await ctx.newPage();
    await page.goto('/admin/listings');
    await expect(page).not.toHaveURL(/\/admin/);
    await ctx.close();
  });
});

test.describe('admin panel — real actions (live tier)', () => {
  test.skip(!LIVE_ENABLED, 'Requires a real Supabase project — run with E2E_RUN_LIVE=true (see e2e/README.md).');
  test.use({ storageState: path.join(__dirname, '.auth', 'live-admin.json') });

  const seedFile = path.join(__dirname, '.auth', 'live-seed.json');
  let seed: LiveSeed;
  test.beforeAll(() => {
    if (!existsSync(seedFile)) throw new Error('live-seed.json missing — global-setup did not run before this spec.');
    seed = JSON.parse(readFileSync(seedFile, 'utf8'));
  });

  test('approve the seeded pending listing, then reject a fresh one', async ({ page }) => {
    const pending = seed.properties.find((p) => p.status === 'pending')!;
    await page.goto('/admin/listings?status=pending');
    const row = page.locator('section').filter({ hasText: pending.slug.split('-').slice(0, -1).join('-') }).first();
    // The card shows the listing's title, not its slug — fall back to matching by our test prefix if the
    // exact title text isn't found (title includes a timestamp-free slug segment we control).
    const targetRow = (await row.count()) ? row : page.locator('section').filter({ hasText: 'e2e-plotss-test pending plot' }).first();
    await expect(targetRow).toBeVisible();
    await targetRow.getByRole('button', { name: 'Publish' }).click();

    await page.goto(`/listing/${pending.slug}`);
    await expect(page).toHaveURL(new RegExp(pending.slug)); // now live and publicly reachable

    // Reject path: put it back to pending first is not exposed in the UI once live, so this half of the
    // scenario ("reject a pending property") is exercised by not-yet-approving one of the two client
    // listings instead — but both client listings were seeded 'live' to keep the broker-isolation test
    // simple. This is a coverage gap worth calling out: there is no fixture listing left in 'pending' to
    // demonstrate the Reject button once Publish above has been exercised. Flagging rather than reusing a
    // row in a way that would misrepresent what was actually tested.
    test.info().annotations.push({
      type: 'coverage-gap',
      description: 'Reject was not exercised end-to-end — only one pending fixture existed and it was used for the Publish assertion. Seed a second pending listing to cover Reject independently.',
    });
  });

  test('suspending a client hides its listing from public search, reactivating restores it', async ({ page }) => {
    const clientA = seed.clients.find((c) => c.key === 'client-a')!;
    const clientAListing = seed.properties.find((p) => p.brokerId === clientA.id)!;

    await page.goto(`/listing/${clientAListing.slug}`);
    await expect(page.locator('#property-detail-page')).toBeVisible();

    await page.goto('/admin/clients');
    const row = page.locator('tr').filter({ hasText: 'E2E Client A' });
    await row.getByRole('button', { name: /Suspend/ }).click();
    await expect(row.getByText('Suspended')).toBeVisible();

    // properties_public_read (migration 0004) requires the owning broker_profiles.status = 'active';
    // suspending it should make the listing 404 for a signed-out visitor immediately.
    const anonCtx = await page.context().browser()!.newContext();
    const anonPage = await anonCtx.newPage();
    await anonPage.goto(`/listing/${clientAListing.slug}`);
    await expect(anonPage.getByText(/this page could not be found/i)).toBeVisible();
    await anonCtx.close();

    await row.getByRole('button', { name: /Reactivate/ }).click();
    await expect(row.getByText('Active')).toBeVisible();
  });

  test('assigning a user to a client shows up on the Users page', async ({ page }) => {
    const buyer = seed.users.find((u) => u.key === 'buyer')!;
    const clientB = seed.clients.find((c) => c.key === 'client-b')!;

    await page.goto('/admin/users');
    const row = page.locator('tr').filter({ hasText: buyer.email });
    await row.locator('select[name="role"]').selectOption('broker');
    await row.locator('select[name="brokerId"]').selectOption(clientB.id);
    await row.getByRole('button', { name: 'Save' }).click();

    await page.reload();
    const updatedRow = page.locator('tr').filter({ hasText: buyer.email });
    await expect(updatedRow.getByText('broker')).toBeVisible();
    // Users page shows the client's `name` field (its contact-name column), not `firm_name` — see
    // admin/users/page.tsx: `clients.find((c) => c.id === u.brokerId)?.name`.
    await expect(updatedRow.getByText(clientB.name)).toBeVisible();
  });
});
