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

export type AdminUser = {
  id: string; name: string; phone: string; role: Role; created_at: string; email: string; brokerId: string | null;
  suspended_at: string | null; deleted_at: string | null;
  can_buy: boolean; can_sell: boolean; is_broker_staff: boolean;
};

export type SearchUsersOpts = {
  q?: string;
  status?: "all" | "active" | "suspended" | "deleted";
  capability?: "can_buy" | "can_sell" | "is_broker_staff";
  brokerId?: string;
  page?: number;
  perPage?: number;
};

export async function searchUsers(opts: SearchUsersOpts = {}): Promise<{ rows: AdminUser[]; total: number }> {
  if (!(await isDbReady())) return { rows: [], total: 0 };
  const svc = createServiceClient();
  const page = Math.max(1, opts.page ?? 1);
  const perPage = Math.min(100, Math.max(1, opts.perPage ?? 25));

  // When filtering by capability we can't express it as a SQL filter without a join view.
  // Strategy: fetch all profiles matching status/search filters (up to 2000 safety cap),
  // join capabilities in memory, filter, then slice for the requested page.
  // This keeps total and pagination accurate for capability filters.
  const usesCapabilityFilter = !!opts.capability;
  const dbLimit = usesCapabilityFilter ? 2000 : perPage;
  const dbFrom = usesCapabilityFilter ? 0 : (page - 1) * perPage;

  let q = svc
    .from("profiles")
    .select("id,full_name,phone,role,created_at,broker_id,suspended_at,deleted_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(dbFrom, dbFrom + dbLimit - 1);

  if (opts.q) {
    const like = `%${opts.q.trim()}%`;
    q = q.or(`full_name.ilike.${like},phone.ilike.${like}`);
  }
  if (opts.status === "active") q = q.is("deleted_at", null).is("suspended_at", null);
  else if (opts.status === "suspended") q = q.not("suspended_at", "is", null);
  else if (opts.status === "deleted") q = q.not("deleted_at", "is", null);
  if (opts.brokerId) q = q.eq("broker_id", opts.brokerId);

  const { data: profiles, count } = await q;

  const ids = (profiles ?? []).map((p) => p.id);
  const [auth, caps] = await Promise.all([
    ids.length ? svc.auth.admin.listUsers({ perPage: 1000 }) : Promise.resolve({ data: { users: [] } }),
    ids.length
      ? svc.from("account_capabilities").select("user_id,can_buy,can_sell,is_broker_staff").in("user_id", ids)
      : Promise.resolve({ data: [] }),
  ]);

  const email = new Map((auth.data?.users ?? []).map((u) => [u.id, u.email ?? ""]));
  const capMap = new Map((caps.data ?? []).map((c) => [c.user_id, c]));

  let allRows: AdminUser[] = (profiles ?? []).map((p) => {
    const c = capMap.get(p.id);
    return {
      id: p.id, name: p.full_name ?? "", phone: p.phone ?? "", role: p.role as Role,
      created_at: p.created_at, email: email.get(p.id) ?? "",
      brokerId: p.broker_id ?? null,
      suspended_at: p.suspended_at ?? null, deleted_at: p.deleted_at ?? null,
      can_buy: c?.can_buy ?? true, can_sell: c?.can_sell ?? false, is_broker_staff: c?.is_broker_staff ?? false,
    };
  });

  if (usesCapabilityFilter) {
    const cap = opts.capability!;
    allRows = allRows.filter((r) => r[cap]);
    const total = allRows.length;
    const from = (page - 1) * perPage;
    return { rows: allRows.slice(from, from + perPage), total };
  }

  return { rows: allRows, total: count ?? 0 };
}

export async function adminUsers(): Promise<AdminUser[]> {
  const { rows } = await searchUsers({ perPage: 200 });
  return rows;
}

export type UserDetail = AdminUser & {
  capabilities: { can_buy: boolean; can_sell: boolean; is_broker_staff: boolean; broker_id: string | null };
  brokerName: string | null;
  listingCount: number;
  activeListingCount: number;
  recentAudit: { id: string; action: string; admin_id: string | null; adminName: string; created_at: string; details: Record<string, unknown> | null }[];
};

export async function getUserDetail(userId: string): Promise<UserDetail | null> {
  if (!(await isDbReady())) return null;
  const svc = createServiceClient();

  const [{ data: p }, authRes, { data: cap }, { data: listings }, { data: auditRows }] = await Promise.all([
    svc.from("profiles").select("id,full_name,phone,role,created_at,broker_id,suspended_at,deleted_at").eq("id", userId).maybeSingle(),
    svc.auth.admin.getUserById(userId),
    svc.from("account_capabilities").select("can_buy,can_sell,is_broker_staff,broker_id").eq("user_id", userId).maybeSingle(),
    svc.from("properties").select("status").eq("owner_id", userId),
    svc.from("admin_audit_log").select("id,action,admin_id,created_at,details").eq("target_id", userId).order("created_at", { ascending: false }).limit(10),
  ]);

  if (!p) return null;

  const brokerName = p.broker_id
    ? (await svc.from("broker_profiles").select("name").eq("id", p.broker_id).maybeSingle()).data?.name ?? null
    : null;

  const adminIds = [...new Set((auditRows ?? []).map((r) => r.admin_id).filter(Boolean) as string[])];
  const adminNames = new Map<string, string>();
  if (adminIds.length) {
    const { data: admins } = await svc.from("profiles").select("id,full_name").in("id", adminIds);
    for (const a of admins ?? []) adminNames.set(a.id, a.full_name ?? "Admin");
  }

  const caps = { can_buy: cap?.can_buy ?? true, can_sell: cap?.can_sell ?? false, is_broker_staff: cap?.is_broker_staff ?? false, broker_id: cap?.broker_id ?? null };
  const allListings = listings ?? [];

  return {
    id: p.id, name: p.full_name ?? "", phone: p.phone ?? "", role: p.role as Role,
    created_at: p.created_at, email: authRes.data?.user?.email ?? "",
    brokerId: p.broker_id ?? null, suspended_at: p.suspended_at ?? null, deleted_at: p.deleted_at ?? null,
    can_buy: caps.can_buy, can_sell: caps.can_sell, is_broker_staff: caps.is_broker_staff,
    capabilities: caps,
    brokerName,
    listingCount: allListings.length,
    activeListingCount: allListings.filter((l) => l.status === "live").length,
    recentAudit: (auditRows ?? []).map((r) => ({
      id: r.id, action: r.action, admin_id: r.admin_id,
      adminName: r.admin_id ? (adminNames.get(r.admin_id) ?? r.admin_id.slice(0, 8)) : "System",
      created_at: r.created_at,
      details: r.details as Record<string, unknown> | null,
    })),
  };
}

export type SuspendImpact = { activeListings: number; pendingEnquiries: number };

export async function getSuspendImpact(userId: string): Promise<SuspendImpact> {
  if (!(await isDbReady())) return { activeListings: 0, pendingEnquiries: 0 };
  const svc = createServiceClient();
  // Count live listings this person owns
  const { count: activeListings } = await svc
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", userId)
    .eq("status", "live");
  // Count open enquiries on this person's listings (enquiries.buyer_id is the enquirer;
  // to find enquiries on their listings we join via property_id)
  const { data: userListings } = await svc
    .from("properties")
    .select("id")
    .eq("owner_id", userId)
    .eq("status", "live");
  const listingIds = (userListings ?? []).map((l) => l.id);
  let pendingEnquiries = 0;
  if (listingIds.length > 0) {
    const { count } = await svc
      .from("enquiries")
      .select("id", { count: "exact", head: true })
      .in("property_id", listingIds)
      .eq("status", "open");
    pendingEnquiries = count ?? 0;
  }
  return { activeListings: activeListings ?? 0, pendingEnquiries };
}

export async function suspendUser(adminId: string, userId: string, reason: string): Promise<void> {
  const svc = createServiceClient();
  const { error } = await svc.from("profiles").update({ suspended_at: new Date().toISOString() }).eq("id", userId);
  if (error) throw new Error(error.message);
  // Revoke all active Supabase sessions for this user immediately.
  // This invalidates the refresh token so the JWT cannot be renewed after expiry.
  // The user will be blocked on their next protected-route navigation (within JWT TTL).
  await svc.auth.admin.signOut(userId, "global").catch(() => { /* non-fatal */ });
  await logAdminAction(adminId, "suspend_user", "user", userId, { reason });
}

export async function reactivateUser(adminId: string, userId: string): Promise<void> {
  const svc = createServiceClient();
  const { error } = await svc.from("profiles").update({ suspended_at: null }).eq("id", userId);
  if (error) throw new Error(error.message);
  await logAdminAction(adminId, "reactivate_user", "user", userId, {});
}

export type CapabilityKey = "can_buy" | "can_sell" | "is_broker_staff";

export async function updateUserCapability(
  adminId: string,
  userId: string,
  capability: CapabilityKey,
  value: boolean,
  opts: { brokerId?: string; reason?: string } = {},
): Promise<void> {
  const svc = createServiceClient();

  const { data: cur } = await svc.from("account_capabilities").select("can_buy,can_sell,is_broker_staff,broker_id").eq("user_id", userId).maybeSingle();

  const next = {
    can_buy: cur?.can_buy ?? true,
    can_sell: cur?.can_sell ?? false,
    is_broker_staff: cur?.is_broker_staff ?? false,
    broker_id: cur?.broker_id ?? null,
  };

  next[capability] = value;

  // Constraint: broker staff must have can_buy=true
  if (next.is_broker_staff && !next.can_buy) {
    throw new Error("Cannot revoke can_buy while is_broker_staff is active. Remove broker staff first.");
  }
  // Constraint: broker staff requires a broker_id
  if (next.is_broker_staff && !opts.brokerId && !next.broker_id) {
    throw new Error("Broker staff requires a broker ID.");
  }
  if (capability === "is_broker_staff" && value && opts.brokerId) {
    next.broker_id = opts.brokerId;
  }
  if (capability === "is_broker_staff" && !value) {
    next.broker_id = null;
    // Also clear profiles.broker_id
    await svc.from("profiles").update({ broker_id: null }).eq("id", userId);
  }

  const { error } = await svc.from("account_capabilities")
    .upsert({ user_id: userId, ...next, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) throw new Error(error.message);

  // Keep profiles.broker_id in sync when assigning broker staff
  if (capability === "is_broker_staff" && value && opts.brokerId) {
    await svc.from("profiles").update({ broker_id: opts.brokerId }).eq("id", userId);
  }

  await logAdminAction(adminId, value ? "grant_capability" : "revoke_capability", "capability", userId, {
    capability, value, brokerId: opts.brokerId, reason: opts.reason,
  });
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
