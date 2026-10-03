import { test, expect } from '@playwright/test';
import path from 'node:path';
import { LIVE_ENABLED } from './support/live-db';

test.use({ storageState: path.join(__dirname, '.auth', 'seller.json') });

test.describe('seller dashboard — structure (demo mode)', () => {
  test('shows the empty state when there are no listings yet', async ({ page }) => {
    // getListingsByOwner() returns [] whenever isDbReady() is false (see lib/db/dashboards.ts), which is
    // always true in demo mode, so this is the real, correct empty state — not a placeholder we chose.
    await page.goto('/dashboard/seller');
    await expect(page.getByRole('heading', { name: 'List your first piece of land' })).toBeVisible();
    // Header also has a "Post a Listing" nav button (different case, but Playwright's default name
    // matching is case-insensitive) — scope to <main> to get SellerDashboard's own CTA specifically.
    await expect(page.getByRole('main').getByRole('link', { name: 'Post a listing' })).toHaveAttribute('href', '/post-listing');
  });

  test('the post-listing wizard can be filled in and reaches the submitted screen', async ({ page }) => {
    await page.goto('/post-listing');

    // Step 1: Property details
    await page.getByPlaceholder('e.g. 3.5').fill('3.5');
    await page.getByPlaceholder('e.g. 4.8').fill('4.8');
    await page.getByRole('button', { name: 'Next step' }).click();

    // Step 2: Location — pick whatever city is first in the (launch-cities) list.
    const citySelect = page.locator('select').filter({ has: page.locator('option', { hasText: 'Select city' }) });
    await citySelect.selectOption({ index: 1 });
    await page.getByRole('button', { name: 'Next step' }).click();

    // Step 3 (Photos step — Documents is skipped by default since features.collectDocuments is off):
    // no photo is required, so Next proceeds straight through.
    await page.getByRole('button', { name: 'Next step' }).click();

    // Step 4: Description — must be at least 30 characters (see stepValid in PostPropertyScreen.tsx).
    // The "Listing description" and "Your notes" textareas are label siblings, not label-wrapped, so
    // getByLabel doesn't resolve them — the description box is the second (right-hand column) textarea.
    await page.locator('textarea').nth(1).fill('A well-located plot, road-facing, ready for immediate possession.');
    await page.getByRole('button', { name: 'Next step' }).click();

    // Step 5: Preview & contact
    await page.getByPlaceholder('10-digit mobile number').fill('9988776655');
    await page.getByRole('button', { name: 'Submit for review' }).click();

    await expect(page.getByRole('heading', { name: 'Submitted for review' })).toBeVisible({ timeout: 10_000 });
    // Demo mode's submitListingAction returns { slug: "demo-mode-not-saved" } without writing to the
    // database (see lib/app/(site)/post-listing/actions.ts), so this only proves the wizard's UI flow
    // works end to end — it does NOT prove a listing was actually created. See the live-tier test below
    // for that.
  });
});

test.describe('seller dashboard — real listing lifecycle (live tier)', () => {
  test.skip(!LIVE_ENABLED, 'Requires a real Supabase project — run with E2E_RUN_LIVE=true (see e2e/README.md).');
  test.use({ storageState: path.join(__dirname, '.auth', 'live-seller.json') });

  test('a submitted listing appears in "My listings" as pending, and can be edited', async ({ page }) => {
    await page.goto('/dashboard/seller');
    const card = page.getByRole('article').filter({ hasText: 'e2e-plotss-test' }).first();
    await expect(card).toBeVisible();
    await expect(card.getByText('Under review')).toBeVisible();

    await card.getByRole('link', { name: 'Edit' }).click();
    await page.waitForURL(/\/dashboard\/edit\//);
    await page.getByLabel(/^Description/).fill('Updated description for the E2E test listing.');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await page.waitForURL(/\/dashboard\/seller/);
  });

  // PLOTSS currently has no delete capability for a seller's own listing anywhere in the codebase —
  // SellerDashboard.tsx only offers View live / Edit / Mark as sold / Fix and resubmit. "Mark as sold"
  // is the closest equivalent (hides it from search) but the row is never removed. This is a real
  // product gap, not a missing test: flagging it rather than writing a test against a feature that
  // does not exist.
  test.fixme('delete a listing', async () => {
    throw new Error('Not implemented anywhere in the app; only "Mark as sold" (soft-hide) exists.');
  });
});
