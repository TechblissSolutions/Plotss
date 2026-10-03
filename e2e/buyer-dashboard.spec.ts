import { test, expect } from '@playwright/test';
import path from 'node:path';
import { LIVE_ENABLED } from './support/live-db';

test.use({ storageState: path.join(__dirname, '.auth', 'buyer.json') });

/**
 * Demo mode still serves the 10 NCR_DEMO_LISTINGS as "live" listings (see lib/db/listings.ts:
 * getLiveListings falls back to demo data whenever isDbReady() is false), so the buyer dashboard has
 * real cards to interact with even without a database.
 *
 * FINDING: the public listing page (`/listing/[slug]`, rendered via src/ui/routes.tsx's DetailRoute +
 * AppProvider) and the real /dashboard/buyer route (a plain server component reading buyerData(s) from
 * the `saved_listings` table — see src/app/(app)/dashboard/buyer/page.tsx) are two genuinely separate
 * systems that don't talk to each other in demo mode. AppProvider.toggleSave writes to localStorage
 * optimistically and fires a `setSaved()` server action that silently no-ops when isDbReady() is false,
 * so clicking "Save Plot" never reaches the `saved_listings` row the dashboard actually reads. In the
 * live tier (real DB), the same click DOES persist via setSaved() and WOULD show up on the dashboard
 * after a reload — that half of the scenario is only provable there. Demo mode below only proves the
 * button itself works and persists via localStorage; it does not claim to prove the dashboard sync.
 */
test.describe('buyer dashboard', () => {
  test('loads with the expected stat cards and sections', async ({ page }) => {
    await page.goto('/dashboard/buyer');
    await expect(page.getByText('Unlocks left today')).toBeVisible();
    await expect(page.getByRole('heading', { name: /New matches for you|Latest listings/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Owners you contacted' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Saved listings' })).toBeVisible();
  });

  test('save a listing from its detail page and unsave it (localStorage-backed, demo mode)', async ({ page }) => {
    await page.goto('/dashboard/buyer');
    const firstCardLink = page.locator('a[href^="/listing/"]').first();
    await firstCardLink.click();
    await page.waitForURL(/\/listing\//);

    const saveBtn = page.getByRole('button', { name: /Save Plot|Saved to Dossier/ });
    await expect(saveBtn).toHaveText('Save Plot');
    await saveBtn.click();
    await expect(saveBtn).toHaveText('Saved to Dossier');

    // Persists across a reload via localStorage (see AppProvider.toggleSave) — this much is real
    // client-side behaviour independent of the database. It does NOT appear on /dashboard/buyer's
    // "Saved listings" in demo mode; see the file header and the live-tier test below for why.
    await page.reload();
    await expect(page.getByRole('button', { name: /Save Plot|Saved to Dossier/ })).toHaveText('Saved to Dossier');

    await saveBtn.click();
    await expect(saveBtn).toHaveText('Save Plot');
  });

  test.describe('save syncs to the real dashboard (live tier)', () => {
    test.skip(!LIVE_ENABLED, 'Requires a real Supabase project — demo mode\'s setSaved() no-ops (see file header).');
    test.use({ storageState: path.join(__dirname, '.auth', 'live-buyer.json') });

    test('appears in "Saved listings" after saving, disappears after unsaving', async ({ page }) => {
      await page.goto('/dashboard/buyer');
      await expect(page.getByText('Nothing saved yet.')).toBeVisible();

      const firstCardLink = page.locator('a[href^="/listing/"]').first();
      const href = await firstCardLink.getAttribute('href');
      await firstCardLink.click();
      await page.waitForURL(/\/listing\//);
      await page.getByRole('button', { name: 'Save Plot' }).click();
      await expect(page.getByRole('button', { name: 'Saved to Dossier' })).toBeVisible();

      await page.goto('/dashboard/buyer'); // server component re-fetches saved_listings on every request
      await expect(page.getByRole('heading', { name: 'Saved listings' }).locator('..').getByRole('link', { name: /./ }).first()).toHaveAttribute('href', href!);

      await page.getByRole('button', { name: /^Remove/ }).first().click();
      await expect(page.getByText('Nothing saved yet.')).toBeVisible();
    });
  });

  test('submitting an enquiry ("I\'m interested") shows a success state', async ({ page }) => {
    const firstCardLink = page.locator('a[href^="/listing/"]').first();
    await page.goto('/dashboard/buyer');
    await firstCardLink.click();
    await page.waitForURL(/\/listing\//);

    // NOTE: PLOTSS models "I'm interested" as the "Schedule a Site Visit" enquiry form (submitEnquiryAction),
    // not a separate request object with its own status. There is currently no buyer-facing "view request
    // status" screen — enquiry/lead status (open/contacted/visit/closed) is only surfaced to the
    // seller/broker in their dashboard's "Lead pipeline". That half of this scenario doesn't exist yet as
    // a buyer feature; flagging it here rather than asserting against UI that isn't there.
    await page.locator('#enquiry-schedule-form textarea').fill('Interested — please share more details.');
    await page.locator('#submit-enquiry-btn').click();
    // In demo mode createEnquiry() short-circuits to { ok: true } without persisting (see lib/db/contacts.ts),
    // so the only thing we can assert here is that the UI reports success, not that a row exists.
    await expect(page.getByRole('heading', { name: 'Site Inspection Request Confirmed' })).toBeVisible();
  });
});
