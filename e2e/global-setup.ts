import { chromium, type FullConfig } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { LIVE_ENABLED, assertSafeToRunLive, liveServiceClient, TEST_PASSWORD, TEST_PREFIX, type LiveSeed } from './support/live-db';

const AUTH_DIR = path.join(__dirname, '.auth');
const SEED_FILE = path.join(AUTH_DIR, 'live-seed.json');

/** Signs in through the real login form (email/password) and saves storageState for a seeded test user. */
async function captureStorageState(baseURL: string, email: string, outFile: string) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`${baseURL}/login`);
  // The email/password path is behind a "Sign in with email" details/summary toggle (see AuthModal.tsx).
  await page.getByText('Sign in with email').click();
  await page.getByPlaceholder('Email').fill(email);
  await page.getByPlaceholder('Password').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15_000 });
  await page.context().storageState({ path: outFile });
  await browser.close();
}

export default async function globalSetup(config: FullConfig) {
  if (!LIVE_ENABLED) return;
  assertSafeToRunLive();

  const svc = liveServiceClient();
  const seed: LiveSeed = { users: [], clients: [], properties: [] };

  const { data: city } = await svc.from('cities').select('id').eq('active', true).limit(1).maybeSingle();
  const { data: category } = await svc.from('categories').select('id').limit(1).maybeSingle();
  if (!city || !category) throw new Error('Live E2E tier needs at least one active city and one category already in the target database.');

  // Two separate client businesses — the whole point is that broker-a must never see clientB's data.
  const { data: clientA, error: clientAErr } = await svc.from('broker_profiles').insert({ name: `${TEST_PREFIX}-client-a`, firm_name: 'E2E Client A' }).select('id').single();
  const { data: clientB, error: clientBErr } = await svc.from('broker_profiles').insert({ name: `${TEST_PREFIX}-client-b`, firm_name: 'E2E Client B' }).select('id').single();
  if (clientAErr || !clientA || clientBErr || !clientB) throw new Error(`Could not seed test clients: ${clientAErr?.message ?? clientBErr?.message}`);
  seed.clients.push(
    { id: clientA.id, key: 'client-a', name: `${TEST_PREFIX}-client-a`, firmName: 'E2E Client A' },
    { id: clientB.id, key: 'client-b', name: `${TEST_PREFIX}-client-b`, firmName: 'E2E Client B' },
  );

  const users: { key: string; email: string; role: 'buyer' | 'seller' | 'broker' | 'admin'; brokerId?: string }[] = [
    { key: 'buyer', email: `${TEST_PREFIX}-buyer@example.com`, role: 'buyer' },
    { key: 'seller', email: `${TEST_PREFIX}-seller@example.com`, role: 'seller' },
    { key: 'broker-a', email: `${TEST_PREFIX}-broker-a@example.com`, role: 'broker', brokerId: clientA.id },
    { key: 'broker-b', email: `${TEST_PREFIX}-broker-b@example.com`, role: 'broker', brokerId: clientB.id },
    { key: 'admin', email: `${TEST_PREFIX}-admin@example.com`, role: 'admin' },
  ];

  for (const u of users) {
    const { data: created, error } = await svc.auth.admin.createUser({ email: u.email, password: TEST_PASSWORD, email_confirm: true });
    if (error || !created.user) throw new Error(`Could not create test user ${u.email}: ${error?.message}`);
    // The on_auth_user_created trigger inserts a 'buyer' profile row; escalate role/broker_id with the service key.
    const { error: profErr } = await svc.from('profiles').update({ role: u.role, broker_id: u.brokerId ?? null }).eq('id', created.user.id);
    if (profErr) throw new Error(`Could not set role for ${u.email}: ${profErr.message}`);
    seed.users.push({ email: u.email, id: created.user.id, key: u.key });
  }

  const sellerId = seed.users.find((u) => u.key === 'seller')!.id;

  // A pending listing for the admin approve/reject test.
  const { data: pending, error: pendingErr } = await svc.from('properties').insert({
    title: `${TEST_PREFIX} pending plot`, slug: `${TEST_PREFIX}-pending-${Date.now()}`, listing_type: 'sale',
    category_id: category.id, city_id: city.id, price: 5_00_00_000, area_value: 2, area_unit: 'acre',
    status: 'pending', owner_id: sellerId,
  }).select('id,slug').single();
  if (pendingErr || !pending) throw new Error(`Could not seed the pending test listing: ${pendingErr?.message}`);
  seed.properties.push({ id: pending.id, slug: pending.slug, brokerId: null, status: 'pending' });

  // One live listing per client, so broker-a and broker-b each have exactly one listing to tell apart.
  for (const [name, client] of [['a', clientA], ['b', clientB]] as const) {
    const { data: prop, error: propErr } = await svc.from('properties').insert({
      title: `${TEST_PREFIX} client-${name} plot`, slug: `${TEST_PREFIX}-client-${name}-${Date.now()}`, listing_type: 'sale',
      category_id: category.id, city_id: city.id, price: 3_00_00_000, area_value: 1.5, area_unit: 'acre',
      status: 'live', broker_id: client.id,
    }).select('id,slug').single();
    if (propErr || !prop) throw new Error(`Could not seed client-${name}'s test listing: ${propErr?.message}`);
    seed.properties.push({ id: prop.id, slug: prop.slug, brokerId: client.id, status: 'live' });
  }

  writeFileSync(SEED_FILE, JSON.stringify(seed, null, 2));

  const baseURL = config.projects[0]?.use?.baseURL ?? 'http://localhost:3000';
  for (const u of seed.users) {
    await captureStorageState(baseURL, u.email, path.join(AUTH_DIR, `live-${u.key}.json`));
  }
}
