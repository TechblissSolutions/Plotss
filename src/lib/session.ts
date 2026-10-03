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
      return JSON.parse(decodeURIComponent(raw)) as Session;
    } catch {
      return null;
    }
  }
  const supabase = await createSessionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: p } = await supabase.from("profiles").select("full_name, phone, role, broker_id").eq("id", user.id).single();
  return {
    id: user.id,
    name: p?.full_name ?? user.email ?? "Member",
    phone: p?.phone ?? undefined,
    role: (p?.role as Role) ?? "buyer",
    brokerId: p?.broker_id ?? undefined,
  };
}

export const dashboardPath = (role: Role) => (role === "admin" ? "/admin/listings" : `/dashboard/${role}`);

/** Page guard: signed-in user with one of the roles (admins may view every dashboard). */
export async function requireRole(...roles: Role[]): Promise<Session> {
  const s = await getSession();
  if (!s) redirect("/?login=1");
  if (s.role !== "admin" && !roles.includes(s.role)) redirect(dashboardPath(s.role));
  return s;
}
