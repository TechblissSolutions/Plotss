import { NextRequest, NextResponse } from "next/server";
import { createSessionClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

function dashboardPath(role?: string): string {
  if (role === "admin") return "/admin";
  if (role === "broker") return "/dashboard/broker";
  if (role === "seller") return "/dashboard/seller";
  return "/dashboard/buyer";
}

/**
 * Supabase email-confirmation / OAuth callback.
 * After a user confirms their email or completes OAuth, Supabase redirects here with a `code` param.
 * If the user has already completed onboarding, send them to their dashboard.
 * Otherwise, send them to /onboarding.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createSessionClient();
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && session) {
      // Check if the user has already been onboarded
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarded_at, role")
        .eq("id", session.user.id)
        .single();
      const dest = profile?.onboarded_at
        ? dashboardPath(profile.role as Role)
        : "/onboarding";
      return NextResponse.redirect(`${origin}${dest}`);
    }
  }

  // If code exchange fails, send to login with an error hint
  return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
}
