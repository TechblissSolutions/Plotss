"use server";

import { isDbReady } from "@/lib/db/listings";
import { getSession } from "@/lib/session";
import { createServiceClient } from "@/lib/supabase/service";

const UUID = /^[0-9a-f-]{36}$/i;

/** Listings the signed-in user has saved (kept in their account, so they follow them across devices). */
export async function loadSavedIds(): Promise<string[]> {
  const s = await getSession();
  if (!s || !(await isDbReady())) return [];
  const { data } = await createServiceClient().from("saved_listings").select("property_id").eq("user_id", s.id);
  return (data ?? []).map((r) => r.property_id as string);
}

export async function setSaved(propertyId: string, saved: boolean) {
  const s = await getSession();
  if (!s || !UUID.test(propertyId) || !(await isDbReady())) return { ok: false as const };
  const svc = createServiceClient();
  if (saved) {
    const { count } = await svc.from("saved_listings").select("property_id", { count: "exact", head: true }).eq("user_id", s.id);
    if ((count ?? 0) >= 200) return { ok: false as const };
    await svc.from("saved_listings").upsert({ user_id: s.id, property_id: propertyId });
  } else {
    await svc.from("saved_listings").delete().eq("user_id", s.id).eq("property_id", propertyId);
  }
  return { ok: true as const };
}

/** One-time merge of listings saved on this device before signing in. */
export async function mergeSaved(ids: string[]) {
  const s = await getSession();
  if (!s || !(await isDbReady())) return;
  const rows = [...new Set(ids.filter((i) => UUID.test(i)))].slice(0, 50).map((property_id) => ({ user_id: s.id, property_id }));
  if (rows.length) await createServiceClient().from("saved_listings").upsert(rows, { ignoreDuplicates: true });
}
