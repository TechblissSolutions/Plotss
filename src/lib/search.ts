import type { Filters } from "./types";

const CITY_ALIASES: Record<string, string> = {
  ghaziabad: "ghaziabad", sahibabad: "ghaziabad", loni: "ghaziabad", indirapuram: "ghaziabad", vaishali: "ghaziabad", "raj nagar": "ghaziabad",
  hapur: "ghaziabad", modinagar: "ghaziabad", masuri: "ghaziabad", muradnagar: "ghaziabad", "meerut road": "ghaziabad",
  noida: "noida", "greater noida": "noida", ecotech: "noida", surajpur: "noida", dadri: "noida", "yamuna expressway": "noida",
  delhi: "new-delhi", "new delhi": "new-delhi", narela: "new-delhi", bawana: "new-delhi", okhla: "new-delhi", mundka: "new-delhi",
  mayapuri: "new-delhi", chhatarpur: "new-delhi", mehrauli: "new-delhi",
};

const ZONES = ["UPSIDC", "GNIDA", "DSIIDC", "MIDC", "RIICO", "GIDC", "SIPCOT", "TSIIC"];

/** Deterministic parser used as the fallback (and the validator baseline) for the AI parser. */
export function parseQueryRules(input: string): Filters {
  const text = input.toLowerCase();
  const f: Filters = {};

  for (const [alias, slug] of Object.entries(CITY_ALIASES)) {
    if (new RegExp(`\\b${alias}\\b`).test(text)) { f.city = slug; break; }
  }

  if (/\b(industrial|factory|manufacturing|midc|riico|gidc|sipcot|upsidc|gnida|dsiidc)\b/.test(text)) f.category = "industrial";
  else if (/\b(commercial|warehouse|warehousing|showroom|office|godown)\b/.test(text)) f.category = "commercial";
  else if (/\b(residential|housing|home|villa)\b/.test(text)) f.category = "residential";

  if (/\b(lease|leasing)\b/.test(text)) f.listing_type = "lease";
  else if (/\b(rent|rental)\b/.test(text)) f.listing_type = "rent";
  else if (/\b(buy|sale|purchase)\b/.test(text)) f.listing_type = "sale";

  for (const z of ZONES) if (text.includes(z.toLowerCase())) f.zone = z;

  const money = (n: string, unit?: string) => {
    const v = parseFloat(n);
    if (!unit) return v;
    return /^(cr|crore)/.test(unit) ? v * 1e7 : /^(l|lac|lakh)/.test(unit) ? v * 1e5 : v;
  };
  const priceRe = "(\\d+(?:\\.\\d+)?)\\s*(cr(?:ore)?s?|l(?:ac|akh)?s?)\\b";
  const under = text.match(new RegExp(`(?:under|below|upto|up to|within|max(?:imum)?|less than)\\s*(?:₹|rs\\.?|inr)?\\s*${priceRe}`));
  const over = text.match(new RegExp(`(?:above|over|min(?:imum)?|more than)\\s*(?:₹|rs\\.?|inr)?\\s*${priceRe}`));
  if (under) f.maxPrice = money(under[1], under[2]);
  if (over) f.minPrice = money(over[1], over[2]);
  if (!under && !over) {
    const plain = text.match(new RegExp(`(?:₹|rs\\.?|budget\\s*)\\s*${priceRe}`));
    if (plain) f.maxPrice = money(plain[1], plain[2]);
  }

  const acre = text.match(/(\d+(?:\.\d+)?)\s*(?:\+\s*)?acres?/);
  const sqft = text.match(/(\d[\d,]*)\s*(?:sq\.?\s*ft|sqft|square feet)/);
  const target = acre ? parseFloat(acre[1]) : sqft ? parseInt(sqft[1].replace(/,/g, ""), 10) / 43560 : undefined;
  if (target) { f.targetAcres = target; f.minAcres = target * 0.8; f.maxAcres = target * 2; }

  return f;
}

