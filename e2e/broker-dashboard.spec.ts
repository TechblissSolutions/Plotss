import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { LIVE_ENABLED, TEST_PASSWORD, type LiveSeed } from './support/live-db';

/**
 * CRITICAL: this is the test the whole multi-client model exists to satisfy. It requires real RLS
 * enforcement (see supabase/migrations/0004_multi_client.sql), which only exists in a real Postgres
 * database — there is no meaningful way to test cross-tenant isolation against demo-mode fallback data,
 * so this entire file is gated behind the live tier.
 */
test.describe('broker dashboard — cross-tenant isolation (live tier)', () => {
  test.skip(!LIVE_ENABLED, 'Requires a real Supabase project — run with E2E_RUN_LIVE=true (see e2e/README.md).');

  const seedFile = path.join(__dirname, '.auth', 'live-seed.json');
  let seed: LiveSeed;
  test.beforeAll(() => {
    if (!existsSync(seedFile)) throw new Error('live-seed.json missing — global-setup did not run before this spec.');
    seed = JSON.parse(readFileSync(seedFile, 'utf8'));
  });

  test('broker-a only sees client-a\'s own listing on the dashboard, never client-b\'s', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: path.join(__dirname, '.auth', 'live-broker-a.json') });
    const page = await ctx.newPage();
    await page.goto('/dashboard/broker');

    const clientAListing = seed.properties.find((p) => p.brokerId === seed.clients.find((c) => c.key === 'client-a')!.id)!;

    await expect(page.getByText(clientAListing.slug, { exact: false }).or(page.locator(`text=${clientAListing.slug}`))).toBeVisible().catch(async () => {
      // Fall back to matching by the listing title text if the slug itself isn't rendered anywhere.
      await expect(page.getByText('client-a plot')).toBeVisible();
    });
    await expect(page.getByText('client-b plot')).toHaveCount(0);

    await ctx.close();
  });

  test('broker-a cannot open client-b\'s listing edit page via direct URL', async ({ browser }) => {
    // FINDING (fixed during this test suite's development, see the commit touching edit/[id]/page.tsx and
    // edit-actions.ts): both used the service role to bypass RLS and only checked `owner_id === session.id`,
    // never `broker_id` — so a client's OWN staff couldn't edit a teammate's listing either. Not a
    // cross-tenant leak (owner_id is unique per user, so it never matched a different business by
    // accident), but exactly the kind of "service role + incomplete manual check" pattern step 4 asks to
    // flag. Now fixed to also allow `session.brokerId === property.broker_id`. This test locks in the
    // boundary in both directions: broker-a CAN reach client-a's own listing, and still cannot reach
    // client-b's.
    const ctx = await browser.newContext({ storageState: path.join(__dirname, '.auth', 'live-broker-a.json') });
    const page = await ctx.newPage();
    const clientAListing = seed.properties.find((p) => p.brokerId === seed.clients.find((c) => c.key === 'client-a')!.id)!;
    const clientBListing = seed.properties.find((p) => p.brokerId === seed.clients.find((c) => c.key === 'client-b')!.id)!;

    await page.goto(`/dashboard/edit/${clientAListing.id}`);
    await expect(page.getByRole('button', { name: 'Save changes' })).toBeVisible();

    await page.goto(`/dashboard/edit/${clientBListing.id}`);
    await expect(page.getByText(/this page could not be found/i).or(page.getByRole('heading', { name: /404/ }))).toBeVisible();

    await ctx.close();
  });

  test('DB-level proof: broker-a\'s Supabase session cannot read or write client-b\'s listing (RLS)', async () => {
    // This is the real proof of isolation — it authenticates as broker-a's actual Supabase user (not the
    // service role) and asks Postgres directly, which is exactly what RLS is supposed to guarantee
    // regardless of what the Next.js UI happens to render.
    const { createClient } = await import('@supabase/supabase-js');
    const url = process.env.E2E_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const client = createClient(url, anon);

    const brokerA = seed.users.find((u) => u.key === 'broker-a')!;
    const { error: signInErr } = await client.auth.signInWithPassword({ email: brokerA.email, password: TEST_PASSWORD });
    expect(signInErr).toBeNull();

    const clientBListing = seed.properties.find((p) => p.brokerId === seed.clients.find((c) => c.key === 'client-b')!.id)!;

    // Read: broker-a's own RLS-scoped client should not see client-b's row via the broker-staff policy
    // (it will still see it if it's status='live', because properties_public_read is intentionally open —
    // that is correct: buyers must see all live listings. The isolation guarantee is about *management*
    // rights, i.e. UPDATE, not visibility of public listings.)
    const { data: readable } = await client.from('properties').select('id,broker_id').eq('id', clientBListing.id).maybeSingle();
    expect(readable?.id).toBe(clientBListing.id); // visible (it's live) — expected, not a leak.

    // Write: this is the actual isolation guarantee. broker-a must NOT be able to update a property whose
    // broker_id is client-b's, even though they can read it. properties_broker_staff's `using`/`with
    // check` clause requires is_broker_staff_for(broker_id) to be true for the row being modified.
    const { data: updated, error: updateErr } = await client
      .from('properties')
      .update({ tagline: 'hijacked by broker-a' })
      .eq('id', clientBListing.id)
      .select('id');
    // RLS silently filters rows the policy doesn't allow rather than raising an error, so a successful
    // no-op update (0 rows affected) is the expected, correct outcome — not an update error.
    expect(updateErr).toBeNull();
    expect(updated ?? []).toHaveLength(0);

    await client.auth.signOut();
  });
});
