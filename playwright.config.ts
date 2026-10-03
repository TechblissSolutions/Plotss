import { defineConfig, devices } from '@playwright/test';

/**
 * Two tiers of E2E coverage:
 *  - Default (no secrets needed): runs against `next dev` with no Supabase env vars, so the app falls back
 *    to demo mode. This exercises UI structure, role-based routing and client-side (localStorage) behaviour.
 *  - Live tier (opt-in via E2E_RUN_LIVE=true + real Supabase credentials, ideally a separate staging
 *    project — never production): seeds real test users/clients/listings via the service role, logs in
 *    through the real UI to capture storageState per role, and tears everything down afterwards. This is
 *    the only tier that can prove RLS-backed multi-tenant isolation, since RLS is a Postgres feature.
 *    See e2e/global-setup.ts / e2e/global-teardown.ts and e2e/README.md.
 */
const LIVE = process.env.E2E_RUN_LIVE === 'true';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  globalSetup: LIVE ? './e2e/global-setup.ts' : undefined,
  globalTeardown: LIVE ? './e2e/global-teardown.ts' : undefined,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    // Generates e2e/.auth/*.json storage states via dev-login (demo mode) before the role-scoped projects run.
    { name: 'setup-demo-auth', testMatch: /auth\.setup\.ts/ },

    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup-demo-auth'],
      testIgnore: /\.setup\.ts$/,
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup-demo-auth'],
      testIgnore: /\.setup\.ts$/,
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Deliberately no Supabase env vars for the default tier: this forces demo mode so dev-login works
    // and no test ever touches a real database unless E2E_RUN_LIVE=true is set (see notes above).
    env: LIVE ? {} : {
      NEXT_PUBLIC_SUPABASE_URL: '',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
      SUPABASE_SERVICE_ROLE_KEY: '',
    },
  },
});
