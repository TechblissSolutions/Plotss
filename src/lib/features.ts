import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { Features } from "./features-shared";
import { DEFAULT_FEATURES, cleanFeatures } from "./features-shared";

async function read(): Promise<Features> {
  if (!isSupabaseConfigured) return DEFAULT_FEATURES;
  try {
    const { data } = await createPublicClient().from("site_settings").select("value").eq("key", "features").maybeSingle();
    return cleanFeatures(data?.value);
  } catch {
    return DEFAULT_FEATURES;
  }
}

/** Launch switches controlled by the super admin (Admin > Settings). Cached; refreshed when saved. */
export const getFeatures = unstable_cache(read, ["site-features"], { tags: ["features"], revalidate: 300 });

export async function writeFeatures(input: unknown): Promise<Features> {
  const f = cleanFeatures(input);
  const { error } = await createServiceClient()
    .from("site_settings").upsert({ key: "features", value: f, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
  return f;
}
