import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import type { Session } from "@/lib/types";
import { NCR_DEMO_LISTINGS } from "@/ui/data/demoNcr";
import { getFeatures } from "@/lib/features";
import { notify, notifyMany } from "@/lib/notify";
import { isDbReady } from "./listings";

/** Max distinct contacts one account may unlock per rolling 24h — stops a logged-in scraper harvesting every number. */
export const UNLOCK_LIMIT_PER_DAY = 20;
export const ENQUIRY_LIMIT_PER_DAY = 10;

export type Contact = { name: string; phone: string; ownerType: string };
export type RevealResult = ({ ok: true } & Contact) | { ok: false; error: string };

export const unlocksUsedToday = async (userId: string): Promise<number> => {
  if (!(await isDbReady())) return 0;
  const { count } = await createServiceClient().from("enquiries").select("id", { count: "exact", head: true }).eq("buyer_id", userId).eq("kind", "unlock").gte("created_at", since());
  return count ?? 0;
};

const since = () => new Date(Date.now() - 24 * 3600 * 1000).toISOString();

export async function revealContact(propertyId: string, session: Session): Promise<RevealResult> {
  if (!(await isDbReady())) {
    const l = NCR_DEMO_LISTINGS.find((x) => x.id === propertyId);
    return l ? { ok: true, name: l.ownerFullName, phone: l.ownerPhone, ownerType: l.ownerType } : { ok: false, error: "Listing not found" };
  }
  const svc = createServiceClient();

  const { data: prop } = await svc.from("properties").select("id,status").eq("id", propertyId).maybeSingle();
  if (!prop || prop.status !== "live") return { ok: false, error: "Listing not available" };

  const { data: existing } = await svc
    .from("enquiries").select("id").eq("buyer_id", session.id).eq("property_id", propertyId).eq("kind", "unlock").limit(1);
  if (!existing?.length) {
    const { count } = await svc
      .from("enquiries").select("id", { count: "exact", head: true })
      .eq("buyer_id", session.id).eq("kind", "unlock").gte("created_at", since());
    const limit = (await getFeatures()).unlockLimitPerDay;
    if ((count ?? 0) >= limit) {
      return { ok: false, error: `Daily limit of ${limit} contact unlocks reached. Try again tomorrow.` };
    }
    const { error } = await svc.from("enquiries").insert({ buyer_id: session.id, property_id: propertyId, kind: "unlock", message: "Contact unlocked" });
    if (error) return { ok: false, error: "Could not unlock, try again" };
  }

  const { data: c } = await svc.from("listing_contacts").select("name,phone,owner_type").eq("property_id", propertyId).maybeSingle();
  if (!c) return { ok: false, error: "Contact not available for this listing" };
  return { ok: true, name: c.name, phone: c.phone, ownerType: c.owner_type ?? "Direct Owner" };
}

export async function hasUnlockedListing(userId: string, propertyId: string): Promise<boolean> {
  if (!(await isDbReady())) return false;
  const { data } = await createServiceClient()
    .from("enquiries").select("id").eq("buyer_id", userId).eq("property_id", propertyId).eq("kind", "unlock").limit(1);
  return Boolean(data?.length);
}

export async function createEnquiry(propertyId: string, session: Session, message: string, visitDate?: string) {
  const text = message.trim().slice(0, 1000);
  if (text.length < 3) return { ok: false as const, error: "Write a short message" };
  const date = visitDate && /^\d{4}-\d{2}-\d{2}$/.test(visitDate) ? visitDate : null;
  if (!(await isDbReady())) return { ok: true as const };
  const svc = createServiceClient();
  const { count } = await svc
    .from("enquiries").select("id", { count: "exact", head: true })
    .eq("buyer_id", session.id).eq("kind", "enquiry").gte("created_at", since());
  if ((count ?? 0) >= ENQUIRY_LIMIT_PER_DAY) return { ok: false as const, error: "Too many enquiries today. Try again tomorrow." };
  const { error } = await svc.from("enquiries").insert({ buyer_id: session.id, property_id: propertyId, kind: "enquiry", message: text, visit_date: date });
  if (error) return { ok: false as const, error: "Could not send enquiry" };
  const { data: prop } = await svc.from("properties").select("title,owner_id,broker_id").eq("id", propertyId).maybeSingle();
  if (prop) {
    const recipients = prop.owner_id ? [prop.owner_id] : [];
    // broker-attributed listings notify every staff member of that business, not just the original poster
    if (prop.broker_id) {
      const { data: staff } = await svc.from("profiles").select("id").eq("broker_id", prop.broker_id);
      for (const s of staff ?? []) recipients.push(s.id);
    }
    await notify({
      userId: session.id, title: "We've received your enquiry",
      body: `Your message about "${prop.title}" has been sent to the owner. They'll reach out on the number you unlocked.`,
      link: "/dashboard/buyer",
    });
    await notifyMany([...new Set(recipients)], {
      title: "New enquiry on your listing",
      body: `${session.name || "A buyer"} is interested in "${prop.title}".`,
      link: "/dashboard/seller",
    });
  }
  return { ok: true as const };
}

export async function unlockedPropertyIds(userId: string): Promise<string[]> {
  if (!(await isDbReady())) return [];
  const { data } = await createServiceClient().from("enquiries").select("property_id").eq("buyer_id", userId).eq("kind", "unlock");
  return [...new Set((data ?? []).map((r) => r.property_id as string))];
}

export type Lead = { id: string; listingId: string; listingTitle: string; buyerName: string; buyerPhone: string; message: string; at: string; kind: string; visitDate: string | null; status: string };

/** Leads on the listings a user owns (seller) or manages (broker). Buyer contact is shared because they unlocked the listing. */
export async function leadsForOwner(userId: string): Promise<Lead[]> {
  if (!(await isDbReady())) return [];
  const { data: props } = await createServiceClient().from("properties").select("id,title").eq("owner_id", userId);
  return leadsForProperties(props ?? []);
}

/** Leads on the listings a client business owns (multi-staff agency account), regardless of which staff added them. */
export async function leadsForBroker(brokerId: string): Promise<Lead[]> {
  if (!(await isDbReady())) return [];
  const { data: props } = await createServiceClient().from("properties").select("id,title").eq("broker_id", brokerId);
  return leadsForProperties(props ?? []);
}

async function leadsForProperties(props: { id: string; title: string }[]): Promise<Lead[]> {
  const ids = props.map((p) => p.id);
  if (!ids.length) return [];
  const svc = createServiceClient();
  const { data } = await svc
    .from("enquiries").select("id,property_id,message,kind,visit_date,status,created_at,buyer:profiles(full_name,phone)")
    .in("property_id", ids).order("created_at", { ascending: false }).limit(200);
  const title = new Map(props.map((p) => [p.id, p.title]));
  return (data ?? []).map((e: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
    id: e.id, listingId: e.property_id, listingTitle: title.get(e.property_id) ?? "",
    buyerName: e.buyer?.full_name ?? "Buyer", buyerPhone: e.buyer?.phone ?? "",
    message: e.message ?? "", at: e.created_at, kind: e.kind, visitDate: e.visit_date, status: e.status ?? "open",
  }));
}
