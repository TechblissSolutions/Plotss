import "server-only";
import { cookies, headers } from "next/headers";
import { getFeatures } from "@/lib/features";
import { isDbReady } from "@/lib/db/listings";
import { createServiceClient } from "@/lib/supabase/service";
import { BOT_UA, cleanEvent, deviceFromUA, type TrackEvent } from "./schema";

export const VID_COOKIE = "plotss_vid";
export const SID_COOKIE = "plotss_sid";

type Ctx = { vid: string; sid: string; userId: string | null; referrer?: string; utm?: { source?: string; medium?: string; campaign?: string } };

const ID = /^[a-z0-9-]{8,64}$/i;
export const validId = (v: unknown): v is string => typeof v === "string" && ID.test(v);

/** Insert cleaned events. Never throws: analytics must not break the site. */
export async function insertEvents(raw: unknown[], ctx: Ctx): Promise<number> {
  try {
    const f = await getFeatures();
    if (!f.tracking || !(await isDbReady())) return 0;
    const h = await headers();
    const ua = h.get("user-agent") ?? "";
    if (BOT_UA.test(ua) || h.get("dnt") === "1") return 0;
    const device = deviceFromUA(ua);
    const country = h.get("x-vercel-ip-country") ?? null;
    const city = h.get("x-vercel-ip-city") ? decodeURIComponent(h.get("x-vercel-ip-city")!).slice(0, 60) : null;

    const rows = raw.slice(0, 25).map(cleanEvent).filter((e): e is TrackEvent => Boolean(e)).map((e) => ({
      vid: ctx.vid, sid: ctx.sid, user_id: ctx.userId, type: e.type, path: e.path ?? null, label: e.label ?? null, props: e.props ?? {},
      referrer: ctx.referrer?.slice(0, 200) || null, utm_source: ctx.utm?.source?.slice(0, 60) || null,
      utm_medium: ctx.utm?.medium?.slice(0, 60) || null, utm_campaign: ctx.utm?.campaign?.slice(0, 80) || null,
      device, country, city,
    }));
    if (!rows.length) return 0;
    const { error } = await createServiceClient().from("events").insert(rows);
    return error ? 0 : rows.length;
  } catch {
    return 0;
  }
}

/** Conversions recorded from server actions (the source of truth for unlocks, enquiries and submissions). */
export async function logServerEvent(type: TrackEvent["type"], userId: string | null, label?: string, props?: TrackEvent["props"]) {
  try {
    const jar = await cookies();
    const vid = jar.get(VID_COOKIE)?.value;
    const sid = jar.get(SID_COOKIE)?.value;
    if (!validId(vid) || !validId(sid)) return; // visitor did not consent to tracking
    await insertEvents([{ type, label, props }], { vid, sid, userId });
  } catch { /* ignore */ }
}
