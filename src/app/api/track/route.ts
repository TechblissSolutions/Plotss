import { NextResponse } from "next/server";
import { insertEvents, validId } from "@/lib/analytics/ingest";
import { rateLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";

// First-party event collector. Receives small batches from the browser (sendBeacon) and stores them server-side.
export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  if (!rateLimit(`track-ip:${ip}`, 600, 60_000)) return new NextResponse(null, { status: 429 });

  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > 32_000) return new NextResponse(null, { status: 413 });

  let body: { vid?: unknown; sid?: unknown; signedIn?: unknown; referrer?: unknown; utm?: Record<string, unknown>; events?: unknown[] };
  try { body = JSON.parse(await req.text()); } catch { return new NextResponse(null, { status: 400 }); }
  if (!validId(body.vid) || !validId(body.sid) || !Array.isArray(body.events)) return new NextResponse(null, { status: 400 });
  if (!rateLimit(`track-vid:${body.vid}`, 300, 60_000)) return new NextResponse(null, { status: 429 });

  // Link to the account only when the browser says the visitor is signed in (saves an auth lookup for anonymous traffic).
  const userId = body.signedIn === true ? ((await getSession())?.id ?? null) : null;
  const s = (v: unknown) => (typeof v === "string" ? v : undefined);
  await insertEvents(body.events, {
    vid: body.vid, sid: body.sid, userId, referrer: s(body.referrer),
    utm: { source: s(body.utm?.source), medium: s(body.utm?.medium), campaign: s(body.utm?.campaign) },
  });
  return new NextResponse(null, { status: 204 });
}
