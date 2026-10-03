import { createClient } from '@supabase/supabase-js';

/**
 * Live-DB tier support. Only used when E2E_RUN_LIVE=true. Talks directly to Supabase with the service
 * role key (bypasses RLS, same as the app's own admin code) to seed and tear down disposable test data.
 *
 * SAFETY: this reads the exact same NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY the app itself
 * uses. If those point at your production project (as they currently do for PLOTSS — see .env), running
 * the live tier creates and deletes real rows in production. A second env var, E2E_CONFIRM_NOT_PRODUCTION,
 * must also be set to "true" before any seeding runs, purely as a deliberate speed bump against an
 * accidental `E2E_RUN_LIVE=true` in the wrong shell. The recommended setup is a separate, free-tier
 * Supabase project used only for CI/E2E, with its own .env values passed as E2E_SUPABASE_URL /
 * E2E_SUPABASE_SERVICE_ROLE_KEY (checked first, falling back to the app's own vars only if unset).
 */
export const LIVE_ENABLED = process.env.E2E_RUN_LIVE === 'true';

export function assertSafeToRunLive() {
  if (!LIVE_ENABLED) return;
  if (process.env.E2E_CONFIRM_NOT_PRODUCTION !== 'true') {
    throw new Error(
      'E2E_RUN_LIVE=true but E2E_CONFIRM_NOT_PRODUCTION is not set. This tier seeds and deletes real rows ' +
      'via the service role key. Set E2E_CONFIRM_NOT_PRODUCTION=true only once you are certain ' +
      '(E2E_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY, or their fallbacks) point at a non-production project.'
    );
  }
}

export function liveServiceClient() {
  const url = process.env.E2E_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Live E2E tier needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or their E2E_-prefixed overrides).');
  return createClient(url, key, { auth: { persistSession: false } });
}

export const TEST_PASSWORD = 'PlotssE2E!2026';
/** Every seeded row/user carries this prefix so teardown (and a human skimming the DB) can identify them at a glance. */
export const TEST_PREFIX = 'e2e-plotss-test';

export type LiveSeed = {
  /** `key` names the storageState file (live-<key>.json) — 'buyer' | 'seller' | 'broker-a' | 'broker-b' | 'admin'. */
  users: { email: string; id: string; key: string }[];
  /** `key` is the logical 'client-a' / 'client-b' identifier; `name`/`firmName` are the actual DB columns (what the UI renders). */
  clients: { id: string; key: string; name: string; firmName: string }[];
  properties: { id: string; slug: string; brokerId: string | null; status: string }[];
};
