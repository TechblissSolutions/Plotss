import { test as setup } from '@playwright/test';
import path from 'node:path';

/**
 * Demo-mode storage states (see playwright.config.ts: the default tier runs `next dev` with Supabase env
 * vars blanked out, so /api/dev-login is enabled). This is NOT how real users authenticate — it's a
 * fast, dependency-free stand-in that only exists so buyer/seller/admin UI tests don't have to click
 * through the login form every time. It cannot be used to test real Supabase auth or RLS; see
 * e2e/global-setup.ts and e2e/README.md for the live-DB tier that does.
 */
const ROLES = ['buyer', 'seller', 'broker', 'admin'] as const;

for (const role of ROLES) {
  setup(`authenticate as ${role} (demo mode)`, async ({ page, baseURL }) => {
    // IMPORTANT: this must be `page.request`, not the standalone `request` fixture — the latter is an
    // isolated APIRequestContext with its own cookie jar, so a Set-Cookie response there never reaches
    // the browser context `page`/`storageState()` operate on, and the captured storageState ends up with
    // zero cookies (silently — no error, just a session-less "auth" file). Learned the hard way: every
    // demo-mode dashboard spec failed with "element not found" because each one got redirected to
    // /?login=1 instead of actually being signed in.
    const res = await page.request.post(`${baseURL}/api/dev-login`, { data: { role, name: `Demo ${role}` } });
    if (!res.ok()) {
      throw new Error(
        `/api/dev-login returned ${res.status()} — it only works when Supabase env vars are unset (demo mode). ` +
        `If you're running against a live-configured server, use the live tier (E2E_RUN_LIVE=true) instead.`
      );
    }
    await page.goto(`${baseURL}/`);
    await page.context().storageState({ path: path.join(__dirname, '.auth', `${role}.json`) });
  });
}
