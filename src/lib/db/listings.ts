import "server-only";
import { formatINR, maskName, maskPhone } from "@/lib/format";
import { createPublicClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { MOCK_BROKERS } from "@/ui/data/mockData";
import { NCR_DEMO_LISTINGS } from "@/ui/data/demoNcr";
import { cityMatches } from "./cities";
import { getFeatures } from "@/lib/features";
import type { Features } from "@/lib/features-shared";
import type { BrokerProfile, CityInfo, Listing, ListingCategory, VerificationDocument, ZoneType } from "@/ui/types";

/**
 * Public read model. Owner contact details NEVER appear here: names/phones are masked and the real values
 * are only returned by `revealContact` (login + rate limit). See src/lib/db/contacts.ts.
 */
export const hasServiceKey = () => Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
const db = () => (hasServiceKey() ? createServiceClient() : createPublicClient());

const LISTING_TYPE = { sale: "Buy", lease: "Lease", rent: "Rent" } as const;
const AREA_UNIT = { acre: "Acres", sqft: "Sq.Ft", sqm: "Sq.Ft" } as const;
const DOC_STATUS = new Set(["verified", "pending", "action_required"]);

const SELECT =
  "*, city:cities(name,slug,state), category:categories(name,slug), verification_documents(*), listing_contacts(name,phone,owner_type), enquiries(count)";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

function rowToListing(r: Row): Listing {
  const d = r.details ?? {};
  const contact = Array.isArray(r.listing_contacts) ? r.listing_contacts[0] : r.listing_contacts;
  const price = Number(r.price ?? 0);
  const area = Number(r.area_value ?? 0);
  const unit = AREA_UNIT[r.area_unit as keyof typeof AREA_UNIT] ?? "Acres";
  const perAcre = r.area_unit === "acre" && area > 0 ? formatINR(Math.round(price / area)) + " / Acre" : "";
  const docs: VerificationDocument[] = (r.verification_documents ?? []).map((v: Row) => ({
    id: v.id,
    name: v.doc_type ?? "Document",
    category: v.category ?? "Verification",
    status: DOC_STATUS.has(v.status) ? v.status : "pending",
    verifiedDate: v.verified_on ?? undefined,
    documentRef: v.doc_ref ?? undefined,
    description: v.description ?? "",
  }));
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    tagline: r.tagline ?? "",
    category: (r.category?.name ?? "Industrial") as ListingCategory,
    listingType: LISTING_TYPE[r.listing_type as keyof typeof LISTING_TYPE] ?? "Buy",
    zoneType: (r.zone_type ?? "Industrial (Light/Engineering)") as ZoneType,
    price,
    priceDisplay: d.priceDisplay ?? formatINR(price),
    pricePerUnit: d.pricePerUnit ?? perAcre,
    area,
    areaUnit: unit,
    areaDisplay: d.areaDisplay ?? `${area.toLocaleString("en-IN")} ${unit}`,
    city: d.cityLabel ?? r.city?.name ?? "",
    microMarket: r.micro_market ?? "",
    state: r.city?.state ?? "",
    roadWidth: d.roadWidth ?? (r.road_width_ft ? `${r.road_width_ft} ft road` : ""),
    frontage: d.frontage ?? "",
    powerSanction: d.powerSanction ?? "",
    waterAvailability: d.waterAvailability ?? "",
    farFsi: d.farFsi ?? "",
    aiMatchScore: d.aiMatchScore ?? 0,
    matchReasons: d.matchReasons ?? [],
    verified: Boolean(r.is_verified),
    verificationDate: d.verificationDate ?? "",
    ownerMaskedName: contact ? maskName(contact.name) : "Owner",
    ownerMaskedPhone: contact ? maskPhone(contact.phone) : "+91 ** *****",
    ownerFullName: "", // never sent to the browser; see revealContact()
    ownerPhone: "",
    ownerType: (contact?.owner_type ?? "Direct Owner") as Listing["ownerType"],
    brokerId: r.broker_id ?? undefined,
    plotGeometryType: d.plotGeometryType ?? "rectangular",
    fairnessRating: d.fairnessRating ?? "Fair Market",
    fairnessDelta: d.fairnessDelta ?? "",
    connectivity: d.connectivity ?? { highway: "", expresswayDistance: "", portOrRailDistance: "", airportDistance: "" },
    nearbyClusters: d.nearbyClusters ?? [],
    documents: docs,
    rawDescription: d.rawDescription,
    aiDescription: r.ai_description ?? r.description ?? "",
    priceHistory: d.priceHistory ?? [],
    status: r.status,
    viewsCount: r.views ?? 0,
    enquiriesCount: r.enquiries?.[0]?.count ?? 0,
    createdAt: r.created_at,
    realImageUrl: r.hero_image ?? undefined,
    galleryImages: r.gallery ?? [],
    aiScreened: d.ai_screen ? Number(d.ai_screen.risk) < 40 : false,
    lat: r.lat != null ? Number(r.lat) : undefined,
    lng: r.lng != null ? Number(r.lng) : undefined,
  };
}

/** What the public may see depends on the launch switches: no fake "verified" when staff verification is off. */
const publicView = (l: Listing, f: Features): Listing => ({
  ...l,
  verified: f.humanReview && l.verified,
  aiScreened: f.aiScreening && Boolean(l.aiScreened),
  documents: f.collectDocuments ? l.documents : [],
});

/** Demo data with the real contact stripped, so even fallback mode cannot leak numbers to the client. */
const maskedDemo = (l: Listing): Listing => ({
  ...l,
  ownerFullName: "",
  ownerPhone: "",
  ownerMaskedName: l.ownerMaskedName || maskName(l.ownerFullName),
  ownerMaskedPhone: l.ownerMaskedPhone || maskPhone(l.ownerPhone),
});

async function fetchListings(build: (q: ReturnType<ReturnType<typeof db>["from"]>) => PromiseLike<{ data: Row[] | null; error: { message: string } | null }>) {
  const { data, error } = await build(db().from("properties") as never);
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToListing);
}

/** True when the v2 schema (0002 migration) is present; otherwise the site runs on demo data. */
async function probeDb(): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const { error } = await db().from("properties").select("tagline,details,hero_image").limit(1);
  return !error;
}
let readyCache: { at: number; ok: boolean } | null = null;
export async function isDbReady(): Promise<boolean> {
  if (readyCache && Date.now() - readyCache.at < 30_000) return readyCache.ok;
  const ok = await probeDb();
  readyCache = { at: Date.now(), ok };
  return ok;
}

export async function getLiveListings(): Promise<Listing[]> {
  const f = await getFeatures();
  if (!(await isDbReady())) return NCR_DEMO_LISTINGS.map(maskedDemo).map((l) => publicView(l, f));
  const rows = await fetchListings((q) => q.select(SELECT).eq("status", "live").order("created_at", { ascending: false }) as never);
  return rows.map((l) => publicView(l, f));
}

export async function getListingBySlug(slug: string): Promise<Listing | null> {
  return (await getLiveListings()).find((l) => l.slug === slug) ?? null;
}

export async function getListingsByOwner(userId: string): Promise<Listing[]> {
  if (!(await isDbReady())) return [];
  return fetchListings((q) => q.select(SELECT).eq("owner_id", userId).order("created_at", { ascending: false }) as never);
}

/** Listings that belong to a client business (multi-staff agency account), regardless of which staff member added them. */
export async function getListingsByBroker(brokerId: string): Promise<Listing[]> {
  if (!(await isDbReady())) return [];
  return fetchListings((q) => q.select(SELECT).eq("broker_id", brokerId).order("created_at", { ascending: false }) as never);
}

export async function getBrokers(): Promise<BrokerProfile[]> {
  const demo = MOCK_BROKERS.map((b) => ({ ...b, phone: "", email: "" }));
  if (!(await isDbReady())) return demo;
  const { data } = await db().from("broker_profiles").select("*, listings:properties(count)").eq("verified", true);
  // Falls back to the sample profiles only when there isn't a single real verified business yet, so the
  // public directory never renders empty — the moment one real client is verified, this stops being used.
  if (!data || data.length === 0) return demo;
  return data.map((b: Row) => ({
    id: b.id,
    name: b.name,
    firmName: b.firm_name ?? "",
    reraNumber: b.rera_number ?? "",
    photoUrl: b.photo_url ?? undefined,
    yearsActive: b.years_active ?? 0,
    propertiesListed: b.listings?.[0]?.count ?? 0,
    propertiesClosed: 0,
    verified: b.verified,
    rating: 0,
    reviewCount: 0,
    cities: b.cities ?? [],
    phone: "", // revealed only after login, like listing contacts
    email: "",
    bio: b.bio ?? "",
    specializations: b.specializations ?? [],
  }));
}

/** City cards: counts, average price and hubs are computed from live listings, not hard-coded marketing numbers. */
export function cityCards(listings: Listing[], cities: { name: string; state: string }[]): CityInfo[] {
  return cities.map((c) => {
    const inCity = listings.filter((l) => cityMatches(l.city, c.name));
    const acre = inCity.filter((l) => l.areaUnit === "Acres" && l.area > 0);
    const avg = acre.length ? acre.reduce((sum, l) => sum + l.price / l.area, 0) / acre.length : 0;
    const hubs = [...new Set(inCity.map((l) => l.microMarket).filter(Boolean))].slice(0, 4);
    return { name: c.name, state: c.state, plotCount: inCity.length, avgPricePerAcre: avg ? formatINR(Math.round(avg)) : "—", popularHubs: hubs };
  });
}
