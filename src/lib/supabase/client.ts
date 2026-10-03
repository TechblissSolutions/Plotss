import { createBrowserClient } from "@supabase/ssr";

// Accept both the new "publishable" key name and the legacy "anon" name.
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseBrowser = () =>
  createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, KEY!);

export const isSupabaseBrowserConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && KEY,
);
