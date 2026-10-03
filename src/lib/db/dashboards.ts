import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import type { Session } from "@/lib/types";
import { getFeatures } from "@/lib/features";
import { leadsForBroker, leadsForOwner, unlockedPropertyIds, unlocksUsedToday } from "./contacts";
import { getCities } from "./cities";
import { getLiveListings, getListingsByBroker, getListingsByOwner, isDbReady } from "./listings";
import { listingQuality, type Quality } from "@/lib/listing-quality";
import type { Listing } from "@/ui/types";

export type SellerListing = Listing & { statusRaw: string; reviewNote: string; unlocks: number; enquiries: number; saves: number; quality: Quality };

async function withStats(listings: Listing[], userId: string): Promise<SellerListing[]> {
  if (!listings.length || !(await isDbReady())) return listings.map((l) => ({ ...l, statusRaw: l.status, reviewNote: "", unlocks: 0, enquiries: 0, saves: 0, quality: listingQuality(l) }));
  const svc = createServiceClient();
  const ids = listings.map((l) => l.id);
  const [{ data: props }, { data: enq }, { data: saved }] = await Promise.all([
    svc.from("properties").select("id,status,details").eq("owner_id", userId),
    svc.from("enquiries").select("property_id,kind").in("property_id", ids),
    svc.from("saved_listings").select("property_id").in("property_id", ids),
  ]);
  const raw = new Map((props ?? []).map((p) => [p.id as string, p]));
  const count = (rows: { property_id: string; kind?: string }[] | null, id: string, kind?: string) => (rows ?? []).filter((r) => r.property_id === id && (!kind || r.kind === kind)).length;
  return listings.map((l) => {
    const p = raw.get(l.id);
    return {
      ...l,
      statusRaw: (p?.status as string) ?? l.status,
      reviewNote: String((p?.details as { review_note?: string } | null)?.review_note ?? ""),
      unlocks: count(enq, l.id, "unlock"), enquiries: count(enq, l.id, "enquiry"), saves: count(saved, l.id),
      quality: listingQuality(l),
    };
  });
}

export type BuyerContacted = Listing & { contact: { name: string; phone: string } | null };
export type BuyerRequirement = { city: string; category: string; maxBudgetCr: number | null };

const inCity = (listingCity: string, city: string) => listingCity.toLowerCase().startsWith(city.toLowerCase());

export async function buyerData(s: Session) {
  const [live, ids, used, features, cities] = await Promise.all([getLiveListings(), unlockedPropertyIds(s.id), unlocksUsedToday(s.id), getFeatures(), getCities()]);
  const seen = new Set(ids);

  let savedIds: string[] = [];
  let requirement: BuyerRequirement = { city: "", category: "", maxBudgetCr: null };
  let contacts = new Map<string, { name: string; phone: string }>();
  if (await isDbReady()) {
    const svc = createServiceClient();
    const [sv, u, c] = await Promise.all([
      svc.from("saved_listings").select("property_id").eq("user_id", s.id),
      svc.auth.admin.getUserById(s.id),
      ids.length ? svc.from("listing_contacts").select("property_id,name,phone").in("property_id", ids) : Promise.resolve({ data: [] as { property_id: string; name: string; phone: string }[] }),
    ]);
    savedIds = (sv.data ?? []).map((r) => r.property_id as string);
    const r = (u.data.user?.user_metadata as { requirement?: BuyerRequirement } | undefined)?.requirement;
    if (r) requirement = { city: r.city ?? "", category: r.category ?? "", maxBudgetCr: r.maxBudgetCr ?? null };
    contacts = new Map((c.data ?? []).map((x) => [x.property_id, { name: x.name, phone: x.phone }]));
  }

  const matches = live.filter((l) =>
    !seen.has(l.id) &&
    (!requirement.city || inCity(l.city, requirement.city)) &&
    (!requirement.category || l.category === requirement.category) &&
    (!requirement.maxBudgetCr || l.price <= requirement.maxBudgetCr * 1e7));
  const hasRequirement = Boolean(requirement.city || requirement.category || requirement.maxBudgetCr);

  return {
    contacted: live.filter((l) => seen.has(l.id)).map((l) => ({ ...l, contact: contacts.get(l.id) ?? null })) as BuyerContacted[],
    saved: live.filter((l) => savedIds.includes(l.id)),
    matches: (hasRequirement ? matches : live.filter((l) => !seen.has(l.id))).slice(0, 6),
    hasRequirement,
    requirement,
    cities: cities.map((c) => c.name),
    unlocksLeft: Math.max(0, features.unlockLimitPerDay - used),
    unlockLimit: features.unlockLimitPerDay,
  };
}

export async function sellerData(s: Session) {
  const [base, leads] = await Promise.all([getListingsByOwner(s.id), leadsForOwner(s.id)]);
  return { listings: await withStats(base, s.id), leads };
}

/** A signed-in broker either manages a client business (assigned by admin, s.brokerId set) or is a self-registered
 * independent broker (own broker_profiles row keyed by user_id). Either way the dashboard also shows anything they
 * personally own directly (owner_id), so nothing they list themselves gets lost. */
export async function brokerData(s: Session) {
  const [ownListings, ownLeads] = await Promise.all([getListingsByOwner(s.id), leadsForOwner(s.id)]);
  let profile: { id: string; name: string; firm_name: string | null; rera_number: string | null; verified: boolean } | null = null;
  let listings = ownListings;
  let leads = ownLeads;
  if (await isDbReady()) {
    const svc = createServiceClient();
    if (s.brokerId) {
      const [{ data }, clientListings, clientLeads] = await Promise.all([
        svc.from("broker_profiles").select("id,name,firm_name,rera_number,verified").eq("id", s.brokerId).maybeSingle(),
        getListingsByBroker(s.brokerId),
        leadsForBroker(s.brokerId),
      ]);
      profile = data;
      const seen = new Set(clientListings.map((l) => l.id));
      listings = [...clientListings, ...ownListings.filter((l) => !seen.has(l.id))];
      const seenLeads = new Set(clientLeads.map((l) => l.id));
      leads = [...clientLeads, ...ownLeads.filter((l) => !seenLeads.has(l.id))];
    } else {
      const { data } = await svc.from("broker_profiles").select("id,name,firm_name,rera_number,verified").eq("user_id", s.id).maybeSingle();
      profile = data;
    }
  }
  return { listings, leads, profile };
}
