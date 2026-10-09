import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { notify, notifyMany } from "@/lib/notify";
import type { PropertyStatus, Role } from "@/lib/types";
import { isDbReady } from "./listings";

export type AdminListing = {
  id: string; slug: string; title: string; status: PropertyStatus; is_verified: boolean; city: string; category: string;
  image: string | null; price: number; views: number; created_at: string; owner: string; ownerPhone: string; description: string;
  docs: { id: string; name: string; status: string; ref: string | null; file: string | null }[];
  screen: { risk: number; flags: { level: string; text: string }[]; summary: string; source: string; at: string } | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapListing = (r: any): AdminListing => {
  const c = Array.isArray(r.listing_contacts) ? r.listing_contacts[0] : r.listing_contacts;
  return {
    id: r.id, slug: r.slug, title: r.title, status: r.status, is_verified: r.is_verified, city: r.city?.name ?? "",
    category: r.category?.name ?? "", image: r.hero_image ?? null, price: Number(r.price ?? 0), views: r.views ?? 0, created_at: r.created_at,
    owner: c?.name ?? r.owner?.full_name ?? "—", ownerPhone: c?.phone ?? r.owner?.phone ?? "", description: r.ai_description ?? r.description ?? "",
    screen: r.details?.ai_screen ?? null,
    docs: (r.verification_documents ?? []).map((d: { id: string; doc_type: string; status: string; doc_ref: string | null; file_url: string | null }) => ({ id: d.id, name: d.doc_type, status: d.status, ref: d.doc_ref, file: d.file_url })),
  };
};

export async function adminListings(status?: string): Promise<AdminListing[]> {
  if (!(await isDbReady())) return [];
  // The pending queue sorts oldest-first so the ones closest to breaching the verification SLA surface
  // at the top; every other tab is newest-first as before.
  let q = createServiceClient()
    .from("properties")
    .select("*, city:cities(name), category:categories(name), owner:profiles(full_name,phone), listing_contacts(name,phone), verification_documents(id,doc_type,status,doc_ref,file_url)")
    .order("created_at", { ascending: status === "pending" })
    .limit(100); // safety cap — full pagination is P2-8
  if (status && status !== "all") q = q.eq("status", status);
  const { data } = await q;
  return (data ?? []).map(mapListing);
}

/** A listing shows the Verified badge only when it has documents and every one of them is verified. */
async function recomputeVerified(propertyId: string) {
  const svc = createServiceClient();
  const { data } = await svc.from("verification_documents").select("status").eq("property_id", propertyId);
  const all = (data ?? []) as { status: string }[];
  const verified = all.length > 0 && all.every((d) => d.status === "verified");
  await svc.from("properties").update({ is_verified: verified }).eq("id", propertyId);
}

export async function setListingStatus(id: string, status: "live" | "rejected" | "draft" | "pending" | "sold", note?: string) {
  const svc = createServiceClient();
  const { data: cur } = await svc.from("properties").select("details,title,slug,owner_id,broker_id").eq("id", id).maybeSingle();
  const details = { ...((cur?.details as Record<string, unknown> | null) ?? {}) };
  const reviewNote = (note ?? "").trim().slice(0, 500);
  if (status === "rejected") details.review_note = reviewNote || undefined; else delete details.review_note;
  const { error } = await svc.from("properties").update({ status, details }).eq("id", id);
  if (error) throw new Error(error.message);
  if (status === "live") await recomputeVerified(id);
  if (cur && (status === "live" || status === "rejected")) await notifyListingDecision(cur, status, reviewNote);
}

/** Tells the seller (and, if the listing belongs to a client business, every staff member of that business). */
async function notifyListingDecision(
  cur: { title: string; slug: string; owner_id: string | null; broker_id: string | null },
  status: "live" | "rejected",
  reviewNote: string,
): Promise<void> {
  const svc = createServiceClient();
  const live = status === "live";
  const sellerMessage = {
    title: live ? "Your listing is live" : "Your listing was not approved",
    body: live ? `"${cur.title}" is now live on PLOTSS.` : `"${cur.title}" was not approved.${reviewNote ? ` Reason: ${reviewNote}` : ""}`,
    link: live ? `/listing/${cur.slug}` : "/dashboard/seller",
  };
  if (cur.owner_id) await notify({ userId: cur.owner_id, ...sellerMessage });
  if (cur.broker_id) {
    const { data: staff } = await svc.from("profiles").select("id").eq("broker_id", cur.broker_id);
    const staffIds = (staff ?? []).map((p) => p.id).filter((id) => id !== cur.owner_id);
    if (staffIds.length) {
      await notifyMany(staffIds, live
        ? { title: "New listing is live", body: `"${cur.title}" went live for your business.`, link: `/listing/${cur.slug}` }
        : sellerMessage);
    }
  }
}

export async function setDocumentStatus(docId: string, status: "verified" | "rejected" | "pending", ref: string) {
  const svc = createServiceClient();
  const { data, error } = await svc
    .from("verification_documents")
    .update({ status, doc_ref: ref.slice(0, 120) || null, verified_on: status === "verified" ? new Date().toISOString().slice(0, 10) : null })
    .eq("id", docId).select("property_id").single();
  if (error) throw new Error(error.message);
  await recomputeVerified(data.property_id);
}

export type AdminUser = { id: string; name: string; phone: string; role: Role; created_at: string; email: string; brokerId: string | null };
export async function adminUsers(): Promise<AdminUser[]> {
  if (!(await isDbReady())) return [];
  const svc = createServiceClient();
  const [{ data: profiles }, auth] = await Promise.all([
    svc.from("profiles").select("id,full_name,phone,role,created_at,broker_id").order("created_at", { ascending: false }),
    svc.auth.admin.listUsers({ perPage: 200 }),
  ]);
  const email = new Map((auth.data?.users ?? []).map((u) => [u.id, u.email ?? ""]));
  return (profiles ?? []).map((p) => ({
    id: p.id, name: p.full_name ?? "", phone: p.phone ?? "", role: p.role as Role, created_at: p.created_at,
    email: email.get(p.id) ?? "", brokerId: p.broker_id ?? null,
  }));
}

/** brokerId assigns/moves the person to a client (only meaningful for role 'broker'); pass null to detach. */
export async function setUserRole(id: string, role: Role, brokerId?: string | null) {
  const update: { role: Role; broker_id?: string | null } = { role };
  if (brokerId !== undefined) update.broker_id = role === "broker" ? brokerId : null;
  const { error } = await createServiceClient().from("profiles").update(update).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function adminBrokers() {
  if (!(await isDbReady())) return [];
  const { data } = await createServiceClient().from("broker_profiles").select("id,name,firm_name,rera_number,verified,user_id").order("created_at", { ascending: false });
  return data ?? [];
}
export async function setBrokerVerified(id: string, verified: boolean) {
  const { error } = await createServiceClient().from("broker_profiles").update({ verified }).eq("id", id);
  if (error) throw new Error(error.message);
}

/* ---------- clients (multi-tenant businesses; see broker_profiles in the schema) ---------- */
export type AdminClient = {
  id: string; name: string; firmName: string; status: "active" | "suspended"; verified: boolean;
  staffCount: number; listingCount: number; created_at: string;
};
export async function adminClients(): Promise<AdminClient[]> {
  if (!(await isDbReady())) return [];
  const svc = createServiceClient();
  const [{ data: clients }, { data: staff }, { data: listings }] = await Promise.all([
    svc.from("broker_profiles").select("id,name,firm_name,status,verified,created_at").order("created_at", { ascending: false }),
    svc.from("profiles").select("broker_id").not("broker_id", "is", null),
    svc.from("properties").select("broker_id").not("broker_id", "is", null),
  ]);
  const staffCount = new Map<string, number>();
  for (const s of staff ?? []) staffCount.set(s.broker_id, (staffCount.get(s.broker_id) ?? 0) + 1);
  const listingCount = new Map<string, number>();
  for (const l of listings ?? []) listingCount.set(l.broker_id, (listingCount.get(l.broker_id) ?? 0) + 1);
  return (clients ?? []).map((c) => ({
    id: c.id, name: c.name, firmName: c.firm_name ?? "", status: (c.status as "active" | "suspended") ?? "active",
    verified: c.verified, staffCount: staffCount.get(c.id) ?? 0, listingCount: listingCount.get(c.id) ?? 0, created_at: c.created_at,
  }));
}

export type UserCapabilities = { user_id: string; can_buy: boolean; can_sell: boolean; is_broker_staff: boolean; broker_id: string | null };
export async function adminUserCapabilities(): Promise<Map<string, UserCapabilities>> {
  if (!(await isDbReady())) return new Map();
  const { data } = await createServiceClient()
    .from("account_capabilities")
    .select("user_id,can_buy,can_sell,is_broker_staff,broker_id");
  const map = new Map<string, UserCapabilities>();
  for (const row of data ?? []) {
    map.set(row.user_id, { user_id: row.user_id, can_buy: row.can_buy ?? true, can_sell: row.can_sell ?? false, is_broker_staff: row.is_broker_staff ?? false, broker_id: row.broker_id ?? null });
  }
  return map;
}

export async function createClient(name: string, firmName: string) {
  const { error } = await createServiceClient().from("broker_profiles").insert({ name, firm_name: firmName || null });
  if (error) throw new Error(error.message);
}

export async function setClientStatus(id: string, status: "active" | "suspended") {
  const { error } = await createServiceClient().from("broker_profiles").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}

/* ---------- notifications (audit view — super admin only, see /admin/notifications) ---------- */
export type AdminNotification = { id: string; title: string; body: string; link: string | null; read: boolean; created_at: string; recipient: string };
export async function adminNotifications(limit = 100): Promise<AdminNotification[]> {
  if (!(await isDbReady())) return [];
  const svc = createServiceClient();
  const [{ data: rows }, { data: profiles }] = await Promise.all([
    svc.from("notifications").select("id,user_id,title,body,link,read,created_at").order("created_at", { ascending: false }).limit(limit),
    svc.from("profiles").select("id,full_name,phone"),
  ]);
  const names = new Map((profiles ?? []).map((p) => [p.id, p.full_name || p.phone || p.id.slice(0, 8)]));
  return (rows ?? []).map((r) => ({
    id: r.id, title: r.title, body: r.body, link: r.link, read: r.read, created_at: r.created_at,
    recipient: names.get(r.user_id) ?? r.user_id.slice(0, 8),
  }));
}

export async function analytics() {
  if (!(await isDbReady())) return null;
  const svc = createServiceClient();
  const [props, enq, users] = await Promise.all([
    svc.from("properties").select("status,is_verified,views,title,city:cities(name),category:categories(name)"),
    svc.from("enquiries").select("kind,created_at").gte("created_at", new Date(Date.now() - 30 * 86400_000).toISOString()),
    svc.from("profiles").select("role"),
  ]);
  return { props: props.data ?? [], enquiries: enq.data ?? [], users: users.data ?? [] };
}

/** Short-lived link to a privately stored document (admins only; never exposed to the public site). */
export async function signedDocUrl(path: string): Promise<string | null> {
  const { data } = await createServiceClient().storage.from("listing-docs").createSignedUrl(path, 600);
  return data?.signedUrl ?? null;
}

/**
 * Write an entry to admin_audit_log (table created in migration 0012).
 * Silently swallows errors — audit logging must never block the main action.
 * Only callable server-side via service role; no client policy allows writes.
 */
export async function logAdminAction(
  adminId: string,
  action: string,
  targetType: string,
  targetId?: string,
  details?: Record<string, unknown>,
): Promise<void> {
  try {
    await createServiceClient()
      .from("admin_audit_log")
      .insert({
        admin_id: adminId,
        action,
        target_type: targetType,
        target_id: targetId ?? null,
        details: details ?? null,
      });
  } catch {
    // Intentionally silent — audit log should never block the main action
  }
}
