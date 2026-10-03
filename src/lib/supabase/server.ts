import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anon);

/** Cookie-less anon client for public reads (safe inside unstable_cache). */
export function createPublicClient() {
  return createClient(url!, anon!, { auth: { persistSession: false } });
}

/** Session-aware client: RLS runs as the signed-in user. */
export async function createSessionClient() {
  const store = await cookies();
  return createServerClient(url!, anon!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // called from a Server Component; middleware/proxy refreshes the session instead
        }
      },
    },
  });
}
