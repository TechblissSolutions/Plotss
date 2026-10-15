/**
 * Dev-only login shortcut — created by burn-after-login skill.
 *
 * Returns 404 in production. In development, accepts email+password as query
 * params, signs in via Supabase, sets session cookies, and redirects to /admin
 * (or / for non-admin users).
 *
 * Usage:
 *   http://localhost:3000/dev-login?email=you@example.com&password=yourpass
 *   http://localhost:3000/dev-login?email=buyer@test.com&password=test1234&redirect=/dashboard/buyer
 *
 * For Playwright / browser agents in CLAUDE.md:
 *   await page.goto('http://localhost:3000/dev-login?email=...&password=...');
 */

import { NextRequest } from "next/server";
import { createSessionClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Hard gate: never expose in production
  if (process.env.NODE_ENV !== "development") {
    return new Response("Not found", { status: 404 });
  }

  const url = new URL(req.url);
  const email = url.searchParams.get("email");
  const password = url.searchParams.get("password");
  const redirectTo = url.searchParams.get("redirect") ?? null;

  if (!email || !password) {
    return new Response(
      [
        "Dev login — missing params.",
        "",
        "Usage: /dev-login?email=you@example.com&password=yourpass",
        "Optional: &redirect=/admin or &redirect=/dashboard/buyer",
      ].join("\n"),
      { status: 400, headers: { "Content-Type": "text/plain" } },
    );
  }

  const supabase = await createSessionClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return new Response(`Auth failed: ${error.message}`, { status: 401, headers: { "Content-Type": "text/plain" } });
  }

  // Determine where to redirect based on session capabilities
  let destination = redirectTo;
  if (!destination) {
    const session = await getSession();
    destination = session?.isAdmin ? "/admin" : "/dashboard/buyer";
  }

  return Response.redirect(new URL(destination, req.url), 302);
}
