import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { ContentState } from "@/ui/content";

const DEV_FILE = path.join(process.cwd(), ".data", "content.json");
const EMPTY: ContentState = { texts: {}, hidden: {} };

/** Copy that ships hidden until someone confirms it is true (fabricated testimonials, regulatory claims). */
export const HIDDEN_BY_DEFAULT = ["home.testimonials", "footer.rera-badges"];

function clean(raw: unknown): ContentState {
  const r = (raw ?? {}) as Partial<ContentState>;
  const texts: Record<string, string> = {};
  for (const [k, v] of Object.entries(r.texts ?? {})) {
    if (/^[a-z0-9._-]{1,120}$/i.test(k) && typeof v === "string") texts[k] = v.slice(0, 2000);
  }
  const hidden: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(r.hidden ?? {})) if (/^[a-z0-9._-]{1,120}$/i.test(k)) hidden[k] = Boolean(v);
  return { texts, hidden };
}

async function read(): Promise<ContentState> {
  let state = EMPTY;
  try {
    if (isSupabaseConfigured) {
      const { data } = await createPublicClient().from("site_settings").select("value").eq("key", "content").maybeSingle();
      state = clean(data?.value);
    } else {
      state = clean(JSON.parse(await fs.readFile(DEV_FILE, "utf8")));
    }
  } catch { /* table missing or no file yet: defaults apply */ }
  const hidden = { ...Object.fromEntries(HIDDEN_BY_DEFAULT.map((k) => [k, true])), ...state.hidden };
  return { texts: state.texts, hidden };
}

export const getContent = unstable_cache(read, ["site-content"], { tags: ["content"], revalidate: 300 });

export async function writeContent(input: unknown): Promise<ContentState> {
  const state = clean(input);
  if (isSupabaseConfigured) {
    const { error } = await createServiceClient()
      .from("site_settings").upsert({ key: "content", value: state, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
  } else {
    await fs.mkdir(path.dirname(DEV_FILE), { recursive: true });
    await fs.writeFile(DEV_FILE, JSON.stringify(state, null, 2));
  }
  return state;
}
