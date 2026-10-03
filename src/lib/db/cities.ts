import "server-only";
import { createPublicClient, isSupabaseConfigured } from "@/lib/supabase/server";

export type CityRow = { slug: string; name: string; state: string; active: boolean; sort_order: number };

/** Launch cities, in rollout order. Used when the database is not available or not migrated yet. */
export const LAUNCH_CITIES: CityRow[] = [
  { slug: "ghaziabad", name: "Ghaziabad", state: "Uttar Pradesh", active: true, sort_order: 1 },
  { slug: "noida", name: "Noida", state: "Uttar Pradesh", active: true, sort_order: 2 },
  { slug: "new-delhi", name: "New Delhi", state: "Delhi", active: true, sort_order: 3 },
];

/** Cities the site offers (search, post form, city pages, sitemap). Pass includeInactive for the admin screen. */
export async function getCities(includeInactive = false): Promise<CityRow[]> {
  if (!isSupabaseConfigured) return LAUNCH_CITIES;
  try {
    const sb = createPublicClient();
    const { data, error } = await sb.from("cities").select("slug,name,state,active,sort_order").order("sort_order").order("name");
    if (!error && data) {
      const rows = data as CityRow[];
      return includeInactive ? rows : rows.filter((c) => c.active);
    }
    // 0003 not applied yet (no "active" column): offer only the launch cities that exist
    const { data: plain } = await sb.from("cities").select("slug,name,state");
    const known = (plain ?? []).filter((c) => LAUNCH_CITIES.some((l) => l.slug === c.slug));
    return known.length ? LAUNCH_CITIES.filter((l) => known.some((k) => k.slug === l.slug)) : LAUNCH_CITIES;
  } catch {
    return LAUNCH_CITIES;
  }
}

export const cityMatches = (listingCity: string, cityName: string) =>
  listingCity.toLowerCase().trim().startsWith(cityName.toLowerCase());
