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
// Allowlist of paths the `next` param may redirect to (prevents open redirect).
const ALLOWED_NEXT = new Set(["/reset-password", "/onboarding", "/dashboard/buyer", "/dashboard/seller", "/dashboard/broker", "/admin"]);

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "";

  if (code) {
    const supabase = await createSessionClient();
    // "already-set" sentinel: session was set client-side by /auth/confirm (implicit flow).
    // Skip code exchange and just read the existing session.
    const { data: { session }, error } = code === "already-set"
      ? await supabase.auth.getSession()
      : await supabase.auth.exchangeCodeForSession(code);
    if (!error && session) {
      // If the link was for password recovery, go straight to reset-password.
      // Do NOT check onboarded_at here — the user needs to set their password first.
      if (next === "/reset-password" || session.user.user_metadata?.recovery) {
        return NextResponse.redirect(`${origin}/reset-password`);
      }

      // For any other allowed `next` destination (e.g. from OAuth), honour it.
      if (next && ALLOWED_NEXT.has(next)) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      // Default: send to onboarding or dashboard based on whether the user has onboarded.
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
