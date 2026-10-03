import { test, expect } from '@playwright/test';
import { LIVE_ENABLED } from './support/live-db';

/**
 * Demo-mode tests (default, no secrets) exercise the phone-OTP path and role picker exactly as they run
 * for a real visitor when Supabase Auth isn't configured yet — AuthModal.tsx explicitly documents this as
 * "Demo mode: Supabase Auth is not connected, any number and code works", so this is real, intended
 * behaviour, not a shortcut we invented for testing.
 *
 * Google OAuth and the "Sign in with email" path only render at all when Supabase is configured
 * (`{live && (...)}` in AuthModal.tsx) — in demo mode the buttons are absent, and that absence is itself
 * asserted below. Automating real Google OAuth is both unreliable (anti-bot) and unnecessary here — the
 * button firing `signInWithOAuth` is Supabase's contract, not ours, so those two are covered by an
 * explicit skip against the live tier's real Supabase project instead of being faked.
 */
test.describe('demo mode (phone OTP + role picker)', () => {
  // AuthModal.verify(): in demo mode `!live` always routes to the role-pick step regardless of inline
  // mode, so register and login behave identically here — the intended-role radio on /register only
  // matters on the live tier (it is only read inside verify()'s `if (live)` branch).
  test('register: phone OTP, then role selection, lands on the matching dashboard', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByText('Continue with Google')).toHaveCount(0);
    await expect(page.getByText('Sign in with email')).toHaveCount(0);

    await page.getByText('Sell my land').click();
    await page.getByPlaceholder('10-digit number').fill('9876543210');
    await page.getByRole('button', { name: 'Send one-time code' }).click();

    await expect(page.getByText(/Code sent to \+91 9876543210/)).toBeVisible();
    await page.locator('input[maxlength="6"]').fill('123456');
    await page.getByRole('button', { name: /Verify/ }).click();

    await expect(page.getByRole('heading', { name: 'How will you use PLOTSS?' })).toBeVisible();
    await page.getByRole('button', { name: /Seller/ }).click();
    await page.waitForURL(/\/dashboard\/seller/, { timeout: 10_000 });
  });

  test('login: phone OTP asks which dashboard to use', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('10-digit number').fill('9123456780');
    await page.getByRole('button', { name: 'Send one-time code' }).click();
    await page.locator('input[maxlength="6"]').fill('654321');
    await page.getByRole('button', { name: /Verify/ }).click();

    await expect(page.getByRole('heading', { name: 'How will you use PLOTSS?' })).toBeVisible();
    await page.getByRole('button', { name: /Buyer/ }).click();
    await page.waitForURL(/\/dashboard\/buyer/, { timeout: 10_000 });
  });

  test('browsing search does not require signing in, and the header links to /login (not a popup)', async ({ page }) => {
    await page.goto('/search');
    await expect(page).toHaveURL(/\/search/);
    const loginLink = page.getByRole('link', { name: /Login \/ Register/i });
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toHaveAttribute('href', '/login');
  });
});

test.describe('live Supabase auth (email/password)', () => {
  test.skip(!LIVE_ENABLED, 'Requires a real Supabase project — run with E2E_RUN_LIVE=true (see e2e/README.md).');

  test('email/password login redirects to the correct role dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByText('Sign in with email').click();
    await page.getByPlaceholder('Email').fill(process.env.E2E_LOGIN_EMAIL ?? '');
    await page.getByPlaceholder('Password').fill(process.env.E2E_LOGIN_PASSWORD ?? '');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15_000 });
  });

  test('Google button is present once Supabase is actually configured', async ({ page }) => {
    // We do not attempt to complete the OAuth handshake (Google blocks automated sign-in); this only
    // proves the button appears once `live` is true, which is what demo mode above proved it does NOT do.
    await page.goto('/login');
    await expect(page.getByText('Continue with Google')).toBeVisible();
  });
});
