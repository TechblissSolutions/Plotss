import "server-only";
import { formatINR } from "../format";
import { parseQueryRules } from "../search";
import type { Filters } from "../types";
import { aiEnabled, chat } from "./llm";

const CACHE = new Map<string, { filters: Filters; source: "ai" | "rules" }>();

/** Natural language -> structured filters. AI output is validated; any failure falls back to the rule parser. */
export async function parseQuery(query: string): Promise<{ filters: Filters; source: "ai" | "rules" }> {
  const key = query.toLowerCase().trim();
  const hit = CACHE.get(key);
  if (hit) return hit;
  const rules = parseQueryRules(query);
  if (!aiEnabled()) return { filters: rules, source: "rules" };
  try {
    const out = await chat(
      `You convert Indian land-search requests into JSON. Reply with ONLY a JSON object using these optional keys:
city (lowercase slug: ghaziabad, noida, new-delhi), category (industrial|warehousing|commercial|residential),
listing_type (sale|lease|rent), maxPrice and minPrice (INR numbers; 1 Cr = 10000000, 1 Lakh = 100000), minAcres and maxAcres (numbers), zone (UPSIDC|GNIDA|DSIIDC).
Omit keys that were not stated. Never invent values.`,
      query.slice(0, 300),
      250,
    );
    const j = JSON.parse(out.slice(out.indexOf("{"), out.lastIndexOf("}") + 1));
    const filters: Filters = {};
    if (typeof j.city === "string") filters.city = j.city.toLowerCase().slice(0, 30);
    if (["industrial", "warehousing", "commercial", "residential"].includes(j.category)) filters.category = j.category;
    if (["sale", "lease", "rent"].includes(j.listing_type)) filters.listing_type = j.listing_type;
    for (const k of ["maxPrice", "minPrice", "minAcres", "maxAcres"] as const) {
      if (typeof j[k] === "number" && j[k] > 0 && Number.isFinite(j[k])) filters[k] = j[k];
    }
    if (typeof j.zone === "string") filters.zone = j.zone.toUpperCase().slice(0, 12);
    // Small models sometimes mis-scale numbers (2Cr -> 20 lakh). Where the rule parser found an explicit number, trust it.
    for (const k of ["maxPrice", "minPrice", "minAcres", "maxAcres", "targetAcres"] as const) if (rules[k] !== undefined) filters[k] = rules[k];
    if (!filters.city && rules.city) filters.city = rules.city;
    const result = { filters, source: "ai" as const };
    CACHE.set(key, result);
    if (CACHE.size > 500) CACHE.delete(CACHE.keys().next().value!);
    return result;
  } catch {
    return { filters: rules, source: "rules" };
  }
}

export type RawListing = {
  category: string; city: string; microMarket?: string; area: number; price: number;
  roadWidth?: string; power?: string; zone?: string; notes?: string; tone?: "institutional" | "concise" | "technical";
};

/** Polished listing copy from the seller's raw notes. Only uses facts the seller gave, never invents amenities or legal status. */
export async function generateDescription(raw: RawListing): Promise<{ text: string; source: "ai" | "template" }> {
  const where = `${raw.microMarket ? raw.microMarket + ", " : ""}${raw.city}`;
  const facts = [
    `${raw.area} acre ${raw.category} land in ${where}`,
    `Asking price ${raw.price} Cr`,
    raw.zone && `Zone: ${raw.zone}`, raw.roadWidth && `Road: ${raw.roadWidth}`, raw.power && `Power: ${raw.power}`,
    raw.notes && `Owner notes: ${raw.notes}`,
  ].filter(Boolean).join(". ");
  const template =
    `${raw.area}-acre ${raw.category.toLowerCase()} land in ${where}, priced at ${formatINR(raw.price * 1e7)}.` +
    `${raw.zone ? ` Zone: ${raw.zone}.` : ""}${raw.roadWidth ? ` Road access: ${raw.roadWidth}.` : ""}${raw.power ? ` Power: ${raw.power}.` : ""}${raw.notes ? ` ${raw.notes}` : ""}`;
  if (!aiEnabled()) return { text: template, source: "template" };
  const style =
    raw.tone === "concise" ? "Keep it under 60 words."
    : raw.tone === "technical" ? "Use a specification-style tone (80-110 words)."
    : "Use a professional tone (90-130 words).";
  try {
    const text = await chat(
      `You write factual, SEO-friendly land listing descriptions for an Indian marketplace. Use ONLY the facts given: never invent amenities, distances, approvals or legal status. Plain text, no markdown. ${style}`,
      facts.slice(0, 1800),
      400,
    );
    return { text: text || template, source: text ? "ai" : "template" };
  } catch {
    return { text: template, source: "template" };
  }
}
