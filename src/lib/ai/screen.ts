import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { aiEnabled, chat } from "./llm";

/**
 * Automatic risk screen for new listings.
 *
 * This is NOT a legal verification and never says a title is clean. It looks for things a careful human would
 * also notice: missing basics, duplicate listings, prices far from comparable listings, and red-flag wording
 * ("pay advance", "no documents needed"). The result is shown to admins; listings that pass earn an
 * "AI-screened" label (never "Verified").
 */
export type Flag = { level: "high" | "medium" | "low"; text: string };
export type ScreenResult = { risk: number; flags: Flag[]; summary: string; source: "rules" | "rules+ai"; at: string };

export type ScreenInput = {
  id: string; title: string; description: string; price: number; areaAcres: number; cityId: string | null; categoryId: string | null;
  hasPhoto: boolean; hasPin: boolean; phone: string;
};

const WEIGHT = { high: 35, medium: 15, low: 5 } as const;
const RED_FLAGS = /(advance|token)\s+(money\s+)?(first|urgent|immediately)|pay\s+first|no\s+documents?\s+(needed|required)|100%\s+guarantee|guaranteed\s+returns?|whatsapp\s+only|urgent\s+sale.*(cash|token)|sign\s+today/i;

export async function screenListing(input: ScreenInput): Promise<ScreenResult> {
  const flags: Flag[] = [];
  const add = (level: Flag["level"], text: string) => flags.push({ level, text });
  const svc = createServiceClient();

  // 1. Basics
  if (input.description.trim().length < 40) add("medium", "Description is very short.");
  if (!input.hasPhoto) add("low", "No photos uploaded.");
  if (!input.hasPin) add("low", "No map pin set.");
  if (input.areaAcres > 500) add("medium", "Area is unusually large; confirm the unit.");
  const perAcre = input.areaAcres > 0 ? input.price / input.areaAcres : 0;
  if (perAcre > 0 && perAcre < 500_000) add("high", "Price per acre is extremely low (under ₹5 lakh); possible typo or bait listing.");

  // 2. Price vs comparable live listings (same city + category)
  if (input.cityId && input.categoryId && perAcre > 0) {
    const { data } = await svc.from("properties").select("price,area_value,area_unit").eq("city_id", input.cityId).eq("category_id", input.categoryId).eq("status", "live").neq("id", input.id).limit(60);
    const comps = (data ?? [])
      .map((r) => (r.area_unit === "acre" ? Number(r.price) / Number(r.area_value) : r.area_unit === "sqft" ? Number(r.price) / (Number(r.area_value) / 43560) : NaN))
      .filter((x) => Number.isFinite(x) && x > 0);
    if (comps.length >= 3) {
      const median = comps.sort((a, b) => a - b)[Math.floor(comps.length / 2)];
      const ratio = perAcre / median;
      if (ratio < 0.4) add("high", `Price per acre is ${Math.round(ratio * 100)}% of similar listings in this city; unusually cheap.`);
      else if (ratio > 3) add("medium", `Price per acre is ${ratio.toFixed(1)}× similar listings in this city.`);
    }
  }

  // 3. Duplicates
  if (input.phone) {
    const { count } = await svc.from("listing_contacts").select("property_id", { count: "exact", head: true }).eq("phone", input.phone).neq("property_id", input.id);
    if ((count ?? 0) >= 3) add("medium", `The same contact number is used on ${count} other listings.`);
  }
  const { count: sameTitle } = await svc.from("properties").select("id", { count: "exact", head: true }).ilike("title", input.title).neq("id", input.id);
  if ((sameTitle ?? 0) > 0) add("high", "Another listing has the same title (possible duplicate).");

  // 4. Red-flag wording
  if (RED_FLAGS.test(`${input.title} ${input.description}`)) add("high", "Wording asks for advance payment, or claims no documents are needed.");

  let source: ScreenResult["source"] = "rules";

  // 5. Optional AI second opinion (extra red flags only; validated; never lowers the risk)
  if (aiEnabled()) {
    try {
      const out = await chat(
        'You review Indian land listings for fraud red flags. Reply ONLY with JSON: {"flags":[{"level":"high|medium|low","text":"short reason"}]}. Return an empty list if nothing looks wrong. Do not judge legal title.',
        `Title: ${input.title}\nPrice: ₹${Math.round(input.price)}\nArea: ${input.areaAcres} acres\nDescription: ${input.description.slice(0, 1200)}`,
        300,
      );
      const j = JSON.parse(out.slice(out.indexOf("{"), out.lastIndexOf("}") + 1));
      for (const f of Array.isArray(j.flags) ? j.flags.slice(0, 4) : []) {
        if (["high", "medium", "low"].includes(f?.level) && typeof f?.text === "string") add(f.level, String(f.text).slice(0, 160));
      }
      source = "rules+ai";
    } catch { /* AI unavailable: rules result stands */ }
  }

  const risk = Math.min(100, flags.reduce((sum, f) => sum + WEIGHT[f.level], 0));
  const summary = risk >= 60 ? "High risk: review carefully before publishing." : risk >= 40 ? "Some concerns: check the flags." : risk > 0 ? "Minor notes only." : "No red flags found.";
  return { risk, flags, summary, source, at: new Date().toISOString() };
}

/** Run the screen for a stored listing and save the result inside properties.details.ai_screen. */
export async function screenAndStore(propertyId: string): Promise<ScreenResult | null> {
  const svc = createServiceClient();
  const { data: p } = await svc
    .from("properties")
    .select("id,title,description,ai_description,price,area_value,area_unit,city_id,category_id,hero_image,lat,details,listing_contacts(phone)")
    .eq("id", propertyId).maybeSingle();
  if (!p) return null;
  const areaAcres = p.area_unit === "acre" ? Number(p.area_value) : p.area_unit === "sqft" ? Number(p.area_value) / 43560 : Number(p.area_value) / 4046.86;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contact: any = Array.isArray(p.listing_contacts) ? p.listing_contacts[0] : p.listing_contacts;
  const result = await screenListing({
    id: p.id, title: p.title, description: p.ai_description ?? p.description ?? "", price: Number(p.price ?? 0), areaAcres,
    cityId: p.city_id, categoryId: p.category_id, hasPhoto: Boolean(p.hero_image), hasPin: p.lat != null, phone: contact?.phone ?? "",
  });
  await svc.from("properties").update({ details: { ...(p.details ?? {}), ai_screen: result } }).eq("id", propertyId);
  return result;
}
