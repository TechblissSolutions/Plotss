import { promises as fs } from "node:fs";
import path from "node:path";
import { unstable_cache } from "next/cache";
import { createPublicClient, createSessionClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { normalizeTheme } from "./css";
import { DEFAULT_THEME } from "./defaults";
import type { ThemeSettings } from "./types";

// Local dev fallback so the theme editor works before a Supabase project exists.
const DEV_FILE = path.join(process.cwd(), ".data", "theme.json");

async function readTheme(): Promise<ThemeSettings> {
  try {
    if (isSupabaseConfigured) {
      const { data } = await createPublicClient()
        .from("site_settings")
        .select("value")
        .eq("key", "theme")
        .maybeSingle();
      return normalizeTheme(data?.value);
    }
    return normalizeTheme(JSON.parse(await fs.readFile(DEV_FILE, "utf8")));
  } catch {
    return DEFAULT_THEME;
  }
}

export const getTheme = unstable_cache(readTheme, ["site-theme"], { tags: ["theme"] });

export async function writeTheme(input: unknown): Promise<ThemeSettings> {
  const theme = normalizeTheme(input);
  if (isSupabaseConfigured) {
    const supabase = await createSessionClient();
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: "theme", value: theme, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message); // RLS rejects non-admins
  } else {
    await fs.mkdir(path.dirname(DEV_FILE), { recursive: true });
    await fs.writeFile(DEV_FILE, JSON.stringify(theme, null, 2));
  }
  return theme;
}
