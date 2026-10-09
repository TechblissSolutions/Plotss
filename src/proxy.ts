import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Applies the admin-managed redirect table. Runs before routing; the table is cached in memory for 60s.
type Redirect = { from_path: string; to_path: string; status_code: number };
let cache: { at: number; map: Map<string, Redirect> } | null = null;

async function loadRedirects(): Promise<Map<string, Redirect>> {
  if (cache && Date.now() - cache.at < 60_000) return cache.map;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const map = new Map<string, Redirect>();
  if (url && key) {
    try {
      const res = await fetch(`${url}/rest/v1/redirects?select=from_path,to_path,status_code`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(1500),
      });
      if (res.ok) for (const r of (await res.json()) as Redirect[]) map.set(r.from_path, r);
    } catch { /* table missing or network hiccup: no redirects this minute */ }
  }
  cache = { at: Date.now(), map };
  return map;
}

export async function proxy(req: NextRequest) {
  // Check admin-managed redirect table first
  const hit = (await loadRedirects()).get(req.nextUrl.pathname);
  if (hit) {
    const target = hit.to_path.startsWith("http") ? new URL(hit.to_path) : new URL(hit.to_path, req.url);
    return NextResponse.redirect(target, hit.status_code === 302 ? 302 : 301);
  }

  // Refresh Supabase session cookie so SSR pages always see a valid session
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseAnon) {
    const response = NextResponse.next();
    const supabase = createServerClient(supabaseUrl, supabaseAnon, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
      },
    });
    await supabase.auth.getUser();
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|api|admin|favicon.ico|listings/|.*\\.(?:png|jpg|jpeg|svg|webp|ico|css|js|txt|xml)$).*)"],
};
