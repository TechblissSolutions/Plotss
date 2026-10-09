import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionClient, isSupabaseConfigured } from "./supabase/server";
import type { Role, Session } from "./types";

export const DEV_COOKIE = "plotss_dev_session";

/** Current signed-in user, or null. Without Supabase, a dev cookie stands in for a real session. */
export async function getSession(): Promise<Session | null> {
  if (!isSupabaseConfigured) {
    const raw = (await cookies()).get(DEV_COOKIE)?.value;
    if (!raw) return null;
    try {
      const parsed = JSON.parse(decodeURIComponent(raw)) as Partial<Session>;
      // Back-fill capability fields if not present in cookie (dev mode)
      const role = (parsed.role ?? "buyer") as Role;
      return {
        id: parsed.id ?? "",
        name: parsed.name ?? "Member",
        phone: parsed.phone,
        role,
        brokerId: parsed.brokerId,
        canBuy: parsed.canBuy ?? true,
        canSell: parsed.canSell ?? (role === "seller" || role === "broker" || role === "admin"),
        isBrokerStaff: parsed.isBrokerStaff ?? (role === "broker"),
        isAdmin: parsed.isAdmin ?? (role === "admin"),
        isOnboarded: parsed.isOnboarded ?? true, // dev mode: skip onboarding
      };
    } catch {
      return null;
    }
  }
  const supabase = await createSessionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: p } = await supabase
    .from("profiles")
    .select("full_name, phone, role, broker_id, deleted_at, onboarded_at")
    .eq("id", user.id)
    .single();

  // DPDP soft-delete: sign out deleted accounts and redirect to login
  if (p?.deleted_at) {
    await supabase.auth.signOut();
    redirect("/login?error=account_deleted");
  }

  const { data: cap } = await supabase
    .from("account_capabilities")
    .select("can_buy, can_sell, is_broker_staff, broker_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const role = (p?.role as Role) ?? "buyer";
  const isAdmin = role === "admin";

  return {
    id: user.id,
    name: p?.full_name ?? user.email ?? "Member",
    phone: p?.phone ?? undefined,
    role,
    // broker_id: prefer account_capabilities, fall back to profiles.broker_id
    brokerId: cap?.broker_id ?? p?.broker_id ?? undefined,
    // Capability flags: use capabilities row if present; fall back to role-based defaults
    canBuy: isAdmin ? true : (cap?.can_buy ?? true),
    canSell: isAdmin ? true : (cap?.can_sell ?? (role === "seller" || role === "broker")),
    isBrokerStaff: isAdmin ? false : (cap?.is_broker_staff ?? (role === "broker")),
    isAdmin,
    isOnboarded: p?.onboarded_at !== null && p?.onboarded_at !== undefined,
  };
}

export const dashboardPath = (role: Role) => (role === "admin" ? "/admin/listings" : `/dashboard/${role}`);

export type Capability = "can_buy" | "can_sell" | "is_broker_staff";

/** Page guard: signed-in user with a specific capability (admins bypass all capability checks). */
export async function requireCapability(capability: Capability): Promise<Session> {
  const s = await getSession();
  if (!s) redirect("/?login=1");
  if (s.isAdmin) return s; // admins bypass all capability checks
  let has = false;
  if (capability === "can_buy") has = s.canBuy;
  else if (capability === "can_sell") has = s.canSell;
  else if (capability === "is_broker_staff") has = s.isBrokerStaff;
  if (!has) redirect(dashboardPath(s.role));
  return s;
}

/**
 * Page guard: signed-in user with one of the roles.
 * @deprecated Prefer requireCapability(). Kept as compatibility shim.
 */
export async function requireRole(...roles: Role[]): Promise<Session> {
  const s = await getSession();
  if (!s) redirect("/?login=1");
  if (s.isAdmin) return s; // admins bypass all role checks
  // Map role to capability check
  const hasAny = roles.some((r) => {
    if (r === "admin") return s.isAdmin;
    if (r === "buyer") return s.canBuy;
    if (r === "seller") return s.canSell;
    if (r === "broker") return s.isBrokerStaff;
    return false;
  });
  if (!hasAny) redirect(dashboardPath(s.role));
  return s;
}
