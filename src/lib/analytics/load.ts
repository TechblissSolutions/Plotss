import "server-only";
import { isDbReady } from "@/lib/db/listings";
import { createServiceClient } from "@/lib/supabase/service";
import type { Ev } from "./report";

const PAGE = 1000;
const MAX_PAGES = 40; // 40,000 events per report. Beyond this, move the aggregation into SQL views.

export async function loadEvents(days: number): Promise<{ events: Ev[]; truncated: boolean } | null> {
  if (!(await isDbReady())) return null;
  const svc = createServiceClient();
  const since = new Date(Date.now() - days * 86400_000).toISOString();
  const out: Ev[] = [];
  for (let i = 0; i < MAX_PAGES; i++) {
    const { data, error } = await svc
      .from("events")
      .select("at,vid,sid,user_id,type,path,label,props,referrer,utm_source,device")
      .gte("at", since).order("at", { ascending: false }).range(i * PAGE, i * PAGE + PAGE - 1);
    if (error) return null; // table missing (migration 0003 not applied)
    out.push(...((data ?? []) as Ev[]));
    if (!data || data.length < PAGE) return { events: out, truncated: false };
  }
  return { events: out, truncated: true };
}
