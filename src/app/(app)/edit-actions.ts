"use server";

import { updateTag } from "next/cache";
import { screenAndStore } from "@/lib/ai/screen";
import { getFeatures } from "@/lib/features";
import { isDbReady } from "@/lib/db/listings";
import { rateLimitDb } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import { createServiceClient } from "@/lib/supabase/service";

export type EditPayload = {
  id: string; description: string; priceCr: string; area: string; microMarket: string;
  roadWidth: string; powerLoad: string; contactPhone: string; lat: number | null; lng: number | null;
};

const text = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

/** The owner edits a listing. Any edit sends it back to review so nothing unchecked goes live. */
export async function updateListingAction(p: EditPayload): Promise<{ error: string } | { ok: true }> {
  const s = await getSession();
  if (!s) return { error: "Sign in again to save your changes." };
  if (!/^[0-9a-f-]{36}$/i.test(p.id) || !(await isDbReady())) return { error: "Listing not found." };
  if (!(await rateLimitDb(`edit:${s.id}`, 30, 3600_000))) return { error: "Too many edits. Try again in a while." };

  const svc = createServiceClient();
  const { data: cur } = await svc.from("properties").select("id,owner_id,broker_id,status,details,area_unit,city:cities(name)").eq("id", p.id).maybeSingle();
  const allowed = cur && (cur.owner_id === s.id || (s.brokerId && cur.broker_id === s.brokerId) || s.role === "admin");
  if (!cur || !allowed) return { error: "You can only edit your own listings." };
  if (cur.status === "sold") return { error: "A sold listing cannot be edited." };

  const area = Number(p.area), priceCr = Number(p.priceCr);
  if (!(area > 0 && area < 100000)) return { error: "Enter a valid area in acres." };
  if (!(priceCr > 0 && priceCr < 100000)) return { error: "Enter a valid price in ₹ crore." };
  const phone = "+91" + String(p.contactPhone ?? "").replace(/\D/g, "").slice(-10);
  if (phone.length !== 13) return { error: "Enter a valid 10-digit contact number." };
  const lat = Number(p.lat), lng = Number(p.lng);
  const hasPin = p.lat !== null && p.lng !== null && Number.isFinite(lat) && Number.isFinite(lng) && lat >= 6 && lat <= 38 && lng >= 68 && lng <= 98;
  const description = text(p.description, 4000);
  const micro = text(p.microMarket, 120);
  const details = { ...((cur.details as Record<string, unknown> | null) ?? {}), roadWidth: text(p.roadWidth, 120), powerSanction: text(p.powerLoad, 120) };
  delete (details as Record<string, unknown>).review_note;

  const { error } = await svc.from("properties").update({
    description, ai_description: description, price: Math.round(priceCr * 1e7), area_value: area, area_unit: "acre",
    micro_market: micro, lat: hasPin ? lat : null, lng: hasPin ? lng : null, details, status: "pending",
  }).eq("id", p.id);
  if (error) return { error: "Could not save your changes. Try again." };
  await svc.from("listing_contacts").update({ phone }).eq("property_id", p.id);

  if ((await getFeatures()).aiScreening) { try { await screenAndStore(p.id); } catch { /* never block an edit */ } }
  updateTag("site-data");
  return { ok: true };
}
