import { getLiveListings } from "@/lib/db/listings";
import { getSeoGlobal } from "@/lib/seo";
import { getCities } from "@/lib/db/cities";
import { CATEGORY_LIST } from "@/ui/data/taxonomy";

// llms.txt for answer engines (AEO/GEO): a plain-text map of what the site offers, generated from live data.
export async function GET() {
  const [g, listings, cityRows] = await Promise.all([getSeoGlobal(), getLiveListings(), getCities()]);
  const body = [
    `# ${g.siteName}`,
    `> ${g.description}`,
    "",
    "## Browse",
    ...CATEGORY_LIST.map((c) => `- [${c.name} land](${g.siteUrl}/category/${c.slug}): ${c.blurb}`),
    ...cityRows.map((c) => `- [Land in ${c.name}](${g.siteUrl}/city/${c.slug})`),
    "",
    "## Listings",
    ...listings.slice(0, 100).map((l) => `- [${l.title}](${g.siteUrl}/listing/${l.slug}): ${l.areaDisplay.split("(")[0].trim()}, ${l.priceDisplay}, ${l.city}`),
    "",
    "## Notes",
    "- Owner contact details are shown to signed-in users only.",
    "- New listings are screened before they go live.",
  ].join("\n");
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
