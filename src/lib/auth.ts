import { redirect } from "next/navigation";
import { createSessionClient, isSupabaseConfigured } from "@/lib/supabase/server";

/** Gate for admin pages and actions. Without Supabase (local dev only) access is open. */
export async function requireAdmin() {
  if (!isSupabaseConfigured) {
    if (process.env.NODE_ENV === "production") redirect("/");
    return;
  }
  const supabase = await createSessionClient();
  const { data: { user } } = await supabase.auth.getUser();
  // Full-page sign-in for the super admin: Google or email + password only, never phone OTP.
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");
}
