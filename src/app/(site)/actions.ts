"use server";

import { logServerEvent } from "@/lib/analytics/ingest";
import { createEnquiry, revealContact } from "@/lib/db/contacts";
import { isDbReady } from "@/lib/db/listings";
import { getSession } from "@/lib/session";
import { createServiceClient } from "@/lib/supabase/service";

const UUID = /^[0-9a-f-]{36}$/i;
const okId = (id: unknown): id is string => typeof id === "string" && (UUID.test(id) || /^plot-\d+$/.test(id));

export async function revealContactAction(propertyId: string) {
  const s = await getSession();
  if (!s) return { ok: false as const, error: "Sign in required" };
  if (!okId(propertyId)) return { ok: false as const, error: "Invalid listing" };
  const r = await revealContact(propertyId, s);
  if (r.ok) await logServerEvent("contact_unlock", s.id, propertyId);
  return r;
}

export async function submitEnquiryAction(propertyId: string, message: string, visitDate: string) {
  const s = await getSession();
  if (!s) return { ok: false as const, error: "Sign in required" };
  if (!okId(propertyId)) return { ok: false as const, error: "Invalid listing" };
  const r = await createEnquiry(propertyId, s, String(message ?? ""), visitDate);
  if (r.ok) await logServerEvent("enquiry_sent", s.id, propertyId);
  return r;
}

/** Fire-and-forget page-view counter (called once per session per listing from the browser, so crawlers don't inflate it). */
export async function trackViewAction(propertyId: string) {
  if (!okId(propertyId) || !(await isDbReady())) return;
  await createServiceClient().rpc("increment_views", { p_id: propertyId });
}
