import { existsSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { LIVE_ENABLED, liveServiceClient, type LiveSeed } from './support/live-db';

const AUTH_DIR = path.join(__dirname, '.auth');
const SEED_FILE = path.join(AUTH_DIR, 'live-seed.json');

export default async function globalTeardown() {
  if (!LIVE_ENABLED || !existsSync(SEED_FILE)) return;
  const seed = JSON.parse(readFileSync(SEED_FILE, 'utf8')) as LiveSeed;
  const svc = liveServiceClient();

  // Delete properties first: profiles/broker_profiles are referenced by owner_id/broker_id without
  // cascade, so deleting the users/clients first would fail (or silently orphan rows) while these exist.
  for (const p of seed.properties) await svc.from('properties').delete().eq('id', p.id);
  // Deleting the auth user cascades its profiles row (see 0001_init.sql: profiles.id references auth.users
  // on delete cascade).
  for (const u of seed.users) await svc.auth.admin.deleteUser(u.id);
  for (const c of seed.clients) await svc.from('broker_profiles').delete().eq('id', c.id);

  for (const key of ['buyer', 'seller', 'broker-a', 'broker-b', 'admin']) {
    const f = path.join(AUTH_DIR, `live-${key}.json`);
    if (existsSync(f)) rmSync(f);
  }
  rmSync(SEED_FILE);
}
