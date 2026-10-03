"use server";

import { screenAndStore } from "@/lib/ai/screen";
import { logServerEvent } from "@/lib/analytics/ingest";
import { getFeatures } from "@/lib/features";
import { isDbReady } from "@/lib/db/listings";
import { notify } from "@/lib/notify";
import { rateLimitDb } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import { createServiceClient } from "@/lib/supabase/service";
import type { SubmitPayload } from "@/ui/screens/PostPropertyScreen";

export type Uploaded = { photos: string[]; docs: { name: string; path: string }[] };

const LISTING_TYPE: Record<string, string> = { Buy: "sale", Lease: "lease", Rent: "rent" };
const CATEGORIES = ["industrial", "warehousing", "commercial", "residential"];
const slugify = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const text = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

export async function submitListingAction(p: SubmitPayload, uploaded: Uploaded): Promise<{ error: string } | { slug: string }> {
  const s = await getSession();
  if (!s) return { error: "Sign in to submit your listing" };
  if (s.role !== "seller" && s.role !== "broker") return { error: "Your account is a buyer account. Sign out and sign in again as a seller or broker to post." };
  if (!(await rateLimitDb(`post:${s.id}`, 10, 24 * 3600_000))) return { error: "You have reached today's limit for new listings." };

  const area = Number(p.area), priceCr = Number(p.price);
  if (!(area > 0 && area < 100000)) return { error: "Enter a valid area in acres" };
  if (!(priceCr > 0 && priceCr < 100000)) return { error: "Enter a valid price in ₹ Cr" };
  const category = slugify(p.category);
  if (!CATEGORIES.includes(category)) return { error: "Choose a category" };
  const city = text(p.city, 60), micro = text(p.microMarket, 120);
  if (!city) return { error: "City is required" };
  const phone = "+91" + String(p.contactPhone ?? "").replace(/\D/g, "").slice(-10);
  if (phone.length !== 13) return { error: "Enter a valid 10-digit contact number" };
  const lat = Number(p.lat), lng = Number(p.lng);
  const hasPin = Number.isFinite(lat) && Number.isFinite(lng) && p.lat !== null && lat >= 6 && lat <= 38 && lng >= 68 && lng <= 98;

  if (!(await isDbReady())) return { slug: "demo-mode-not-saved" };

  const svc = createServiceClient();

  // Only accept files that were uploaded into this user's own folders.
  const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listing-photos/${s.id}/`;
  const photos = (uploaded?.photos ?? []).filter((u) => typeof u === "string" && u.startsWith(base)).slice(0, 6);
  const docFiles = (uploaded?.docs ?? []).filter((d) => typeof d.path === "string" && d.path.startsWith(`${s.id}/`)).slice(0, 10);

  const [{ data: cityRow }, { data: catRow }, brokerId] = await Promise.all([
    svc.from("cities").select("id,active").eq("slug", slugify(city.split("/")[0])).maybeSingle(),
    svc.from("categories").select("id").eq("slug", category).maybeSingle(),
    // Staff assigned to a client business (s.brokerId) attribute the listing to that business, so any of its
    // staff can see it; a self-registered broker without one falls back to their own broker_profiles row.
    s.brokerId ?? svc.from("broker_profiles").select("id").eq("user_id", s.id).maybeSingle().then((r) => r.data?.id ?? null),
  ]);
  if (!cityRow || cityRow.active === false) return { error: `We don't list ${city} yet. Pick one of the supported cities.` };

  const title = `${area} acre ${p.category.toLowerCase()} land in ${micro || city.split("/")[0].trim()}`;
  const slug = `${slugify(title)}-${Date.now().toString(36)}`;
  const description = text(p.description, 4000);

  const { data: prop, error } = await svc.from("properties").insert({
    title, slug, description, ai_description: description, listing_type: LISTING_TYPE[p.listingType] ?? "sale",
    category_id: catRow?.id, city_id: cityRow.id, micro_market: micro, price: Math.round(priceCr * 1e7), area_value: area, area_unit: "acre",
    zone_type: text(p.zoneType, 80), status: "pending", owner_id: s.id, broker_id: brokerId,
    hero_image: photos[0] ?? null, gallery: photos, lat: hasPin ? lat : null, lng: hasPin ? lng : null,
    details: { roadWidth: text(p.roadWidth, 120), powerSanction: text(p.powerLoad, 120), rawDescription: text(p.rawText, 2000), cityLabel: city },
  }).select("id").single();
  if (error || !prop) return { error: "Could not save your listing. Try again." };

  const features = await getFeatures();
  const wanted = (features.collectDocuments ? p.docs ?? [] : []).slice(0, 10).map((d) => text(d.name, 120)).filter(Boolean);
  const rows = wanted.map((name) => ({
    property_id: prop.id, doc_type: name, category: "Owner supplied", status: "pending",
    file_url: docFiles.find((f) => f.name === name)?.path ?? null,
  }));
  if (rows.length) await svc.from("verification_documents").insert(rows);
  await svc.from("listing_contacts").insert({ property_id: prop.id, name: s.name || "Owner", phone, owner_type: s.role === "broker" ? "Broker" : "Direct Owner" });
  if (features.aiScreening) { try { await screenAndStore(prop.id); } catch { /* screening must never block a submission */ } }
  await logServerEvent("listing_submitted", s.id, slug);
  await notify({ userId: s.id, title: "Listing submitted for review", body: `"${title}" was received. We review new listings before they go live.`, link: "/dashboard/seller" });
  return { slug };
}
