"use server";

import { headers } from "next/headers";
import { generateDescription, parseQuery, type RawListing } from "@/lib/ai/assistant";
import { rateLimitDb } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import type { ParsedQuery } from "@/ui/types";

async function clientKey(prefix: string) {
  const h = await headers();
  return `${prefix}:${(h.get("x-forwarded-for") ?? "local").split(",")[0].trim()}`;
}

/** Public: turns the search box text into filters. Limited per IP because it can call a paid AI model. */
export async function parseQueryAction(q: string): Promise<ParsedQuery | null> {
  const text = String(q ?? "").trim().slice(0, 300);
  if (!text) return null;
  if (!(await rateLimitDb(await clientKey("parse"), 20, 60_000))) return null;
  const { filters } = await parseQuery(text);
  return filters as ParsedQuery;
}

/** Signed-in sellers only. */
export async function generateDescriptionAction(raw: RawListing): Promise<{ text: string; source: "ai" | "template" } | { error: string }> {
  const s = await getSession();
  if (!s) return { error: "Sign in to use the description assistant" };
  if (!(await rateLimitDb(`desc:${s.id}`, 15, 3600_000))) return { error: "Too many requests. Try again in an hour." };
  const n = (v: unknown, max: number) => String(v ?? "").slice(0, max);
  return generateDescription({
    category: n(raw.category, 40), city: n(raw.city, 60), microMarket: n(raw.microMarket, 120), area: Number(raw.area) || 0,
    price: Number(raw.price) || 0, roadWidth: n(raw.roadWidth, 120), power: n(raw.power, 120), zone: n(raw.zone, 80),
    notes: n(raw.notes, 1500), tone: raw.tone === "concise" || raw.tone === "technical" ? raw.tone : "institutional",
  });
}
