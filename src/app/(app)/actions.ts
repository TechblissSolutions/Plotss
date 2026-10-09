"use server";

import { revalidatePath, updateTag } from "next/cache";
import { isDbReady } from "@/lib/db/listings";
import { notify } from "@/lib/notify";
import { getSession } from "@/lib/session";
import { createServiceClient } from "@/lib/supabase/service";

const LEAD_STATUSES = ["open", "contacted", "visit", "closed"];

/** Marks every unread notification as read for the signed-in user (called when they open the bell). */
export async function markNotificationsRead() {
  const s = await getSession();
  if (!s || !(await isDbReady())) return;
  await createServiceClient().from("notifications").update({ read: true }).eq("user_id", s.id).eq("read", false);
  revalidatePath("/dashboard/buyer");
  revalidatePath("/dashboard/seller");
  revalidatePath("/dashboard/broker");
}

/** Only the owner of the listing an enquiry is about may change its lead status. */
export async function setLeadStatus(enquiryId: string, status: string) {
  const s = await getSession();
  if (!s || !LEAD_STATUSES.includes(status) || !/^[0-9a-f-]{36}$/i.test(enquiryId)) return { ok: false as const };
  if (!(await isDbReady())) return { ok: false as const };
  const svc = createServiceClient();
  const { data } = await svc.from("enquiries").select("property_id, property:properties(owner_id,broker_id)").eq("id", enquiryId).maybeSingle();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prop = (data as any)?.property;
  const allowed = prop && (prop.owner_id === s.id || (s.brokerId && prop.broker_id === s.brokerId) || s.isAdmin);
  if (!allowed) return { ok: false as const };
  await svc.from("enquiries").update({ status }).eq("id", enquiryId);
  revalidatePath("/dashboard/seller");
  revalidatePath("/dashboard/broker");
  return { ok: true as const };
}

/** Brokers submit / update their profile; it stays unverified until an admin checks the RERA / agency proof. */
export async function saveBrokerProfile(f: FormData) {
  const s = await getSession();
  if (!s || (!s.isBrokerStaff && !s.isAdmin)) return;
  if (!(await isDbReady())) return;
  const t = (k: string, max = 200) => String(f.get(k) ?? "").trim().slice(0, max);
  const name = t("name", 100);
  if (!name) return;
  const svc = createServiceClient();
  const row = {
    name, firm_name: t("firm"), rera_number: t("rera", 60), bio: t("bio", 1000),
    cities: t("cities").split(",").map((c) => c.trim()).filter(Boolean).slice(0, 10),
    years_active: Math.min(60, Math.max(0, Number(t("years", 3)) || 0)),
  };
  if (s.brokerId) {
    // Staff assigned to a client business (see /admin/clients) update that shared business row, not a personal one.
    await svc.from("broker_profiles").update(row).eq("id", s.brokerId);
  } else {
    const { data: existing } = await svc.from("broker_profiles").select("id").eq("user_id", s.id).maybeSingle();
    if (existing) await svc.from("broker_profiles").update(row).eq("id", existing.id);
    else await svc.from("broker_profiles").insert({ ...row, user_id: s.id, verified: false });
  }
  revalidatePath("/dashboard/broker");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * A client business's own staff can add a teammate without going through the super admin.
 * New email -> Supabase sends a real invite (magic-link, no provider needed, built into Supabase Auth).
 * Existing account -> attached to this business directly and notified in-app/email per their preference.
 */
export async function inviteStaffAction(f: FormData): Promise<{ ok: true } | { ok: false; error: string }> {
  const s = await getSession();
  if (!s || (!s.isBrokerStaff && !s.isAdmin) || !s.brokerId) return { ok: false, error: "Only a business's own staff can invite a teammate." };
  if (!(await isDbReady())) return { ok: false, error: "Not available in demo mode." };
  const email = String(f.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Enter a valid email address." };

  const svc = createServiceClient();
  const { data: invited, error: inviteErr } = await svc.auth.admin.inviteUserByEmail(email);
  let userId = invited?.user?.id ?? null;

  if (inviteErr) {
    // Most likely "a user with this email already exists" — attach the existing account instead of failing.
    const { data: list, error: listErr } = await svc.auth.admin.listUsers({ perPage: 1000 });
    if (listErr) return { ok: false, error: inviteErr.message };
    userId = list.users.find((u) => u.email?.toLowerCase() === email)?.id ?? null;
  }
  if (!userId) return { ok: false, error: inviteErr?.message ?? "Could not find or create that account." };

  // Write to account_capabilities (source of truth going forward).
  await svc
    .from("account_capabilities")
    .upsert(
      {
        user_id: userId,
        is_broker_staff: true,
        broker_id: s.brokerId,
        is_broker_staff_activated_at: new Date().toISOString(),
        can_buy: true,
      },
      { onConflict: "user_id" }
    );

  // Keep profiles.broker_id in sync for backward compatibility during transition.
  await svc.from("profiles").update({ broker_id: s.brokerId }).eq("id", userId);
  // Do NOT write profiles.role = 'broker' any more — capabilities is the source of truth.

  await notify({
    userId, title: "You've been added to a team on PLOTSS",
    body: "You can now manage listings and leads for this business.", link: "/dashboard/broker",
  });
  revalidatePath("/dashboard/broker");
  return { ok: true };
}

/** A seller marks their own listing as sold (an admin can do this for any listing). */
export async function markListingSold(propertyId: string) {
  const s = await getSession();
  if (!s || !/^[0-9a-f-]{36}$/i.test(propertyId) || !(await isDbReady())) return { ok: false as const };
  const svc = createServiceClient();
  const { data } = await svc.from("properties").select("owner_id,broker_id,status").eq("id", propertyId).maybeSingle();
  const allowed = data && (data.owner_id === s.id || (s.brokerId && data.broker_id === s.brokerId) || s.isAdmin);
  if (!allowed || data.status !== "live") return { ok: false as const };
  await svc.from("properties").update({ status: "sold" }).eq("id", propertyId);
  updateTag("site-data");
  revalidatePath("/dashboard/seller");
  revalidatePath("/dashboard/broker");
  return { ok: true as const };
}

// ============================================================
// Admin capability management actions
// ============================================================

type ManageableCapability = "can_sell" | "is_broker_staff";

/** Admin-only: grant a capability to a user. */
export async function addCapabilityAction(
  userId: string,
  capability: ManageableCapability,
  brokerId?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const s = await getSession();
  if (!s || !s.isAdmin) return { ok: false, error: "Admin only." };
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return { ok: false, error: "Invalid user ID." };
  if (!(await isDbReady())) return { ok: false, error: "Not available in demo mode." };

  const svc = createServiceClient();
  const update: Record<string, unknown> = {};
  if (capability === "can_sell") {
    update.can_sell = true;
    update.can_sell_activated_at = new Date().toISOString();
  } else if (capability === "is_broker_staff") {
    if (!brokerId || !/^[0-9a-f-]{36}$/i.test(brokerId)) return { ok: false, error: "broker_id is required when granting is_broker_staff." };
    update.is_broker_staff = true;
    update.broker_id = brokerId;
    update.is_broker_staff_activated_at = new Date().toISOString();
    update.can_buy = true; // broker_staff_must_can_buy constraint
    // Keep profiles.broker_id in sync
    await svc.from("profiles").update({ broker_id: brokerId }).eq("id", userId);
  }

  const { error } = await svc
    .from("account_capabilities")
    .upsert({ user_id: userId, ...update }, { onConflict: "user_id" });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/listings");
  return { ok: true };
}

/** Admin-only: remove a capability from a user. Cannot remove can_sell if they have active listings. */
export async function removeCapabilityAction(
  userId: string,
  capability: ManageableCapability
): Promise<{ ok: true } | { ok: false; error: string }> {
  const s = await getSession();
  if (!s || !s.isAdmin) return { ok: false, error: "Admin only." };
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return { ok: false, error: "Invalid user ID." };
  if (!(await isDbReady())) return { ok: false, error: "Not available in demo mode." };

  const svc = createServiceClient();

  if (capability === "can_sell") {
    // Check for active listings before removing
    const { count } = await svc
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", userId)
      .in("status", ["draft", "pending", "live"]);
    if ((count ?? 0) > 0) {
      return { ok: false, error: `User has ${count} active listing(s). Resolve them before removing the sell capability.` };
    }
  }

  const update: Record<string, unknown> = {};
  if (capability === "can_sell") {
    update.can_sell = false;
    update.can_sell_activated_at = null;
  } else if (capability === "is_broker_staff") {
    update.is_broker_staff = false;
    update.broker_id = null;
    update.is_broker_staff_activated_at = null;
    // Clear profiles.broker_id too
    await svc.from("profiles").update({ broker_id: null }).eq("id", userId);
  }

  const { error } = await svc
    .from("account_capabilities")
    .upsert({ user_id: userId, ...update }, { onConflict: "user_id" });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/listings");
  return { ok: true };
}
