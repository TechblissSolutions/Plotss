import "server-only";
import { createServiceClient } from "./supabase/service";
import { isDbReady } from "./db/listings";

// Small in-memory sliding-window limiter. Per server instance — fine for the high-frequency, low-stakes
// analytics ingestion throttle (src/app/api/track/route.ts), where under-limiting on a cold instance is
// not a real exploit. For anything that actually gates abuse (contact unlocks, listing edits/submissions,
// AI calls), use `rateLimitDb` below instead — see its comment for why.
const hits = new Map<string, number[]>();

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) { hits.set(key, recent); return false; }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  return true;
}

/**
 * Durable sliding-window limiter backed by `rate_limit_hits` (migration 0005), shared across every server
 * instance — unlike `rateLimit` above, this one cannot be defeated just by landing on a fresh instance.
 * Falls back to the in-memory limiter when there's no database (demo mode / before 0005 is applied), so
 * local dev keeps working without a live Supabase project.
 */
export async function rateLimitDb(key: string, max: number, windowMs: number): Promise<boolean> {
  if (!(await isDbReady())) return rateLimit(key, max, windowMs);
  const svc = createServiceClient();
  const since = new Date(Date.now() - windowMs).toISOString();
  const { count, error } = await svc.from("rate_limit_hits").select("id", { count: "exact", head: true }).eq("key", key).gte("created_at", since);
  if (error) return rateLimit(key, max, windowMs); // e.g. migration 0005 not applied yet — degrade, don't break the action
  if ((count ?? 0) >= max) return false;
  await svc.from("rate_limit_hits").insert({ key });
  // Opportunistic cleanup of this key's own stale rows so the table doesn't grow unbounded.
  await svc.from("rate_limit_hits").delete().eq("key", key).lt("created_at", since);
  return true;
}
