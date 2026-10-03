// Seeds demo listings (Ghaziabad / Noida / New Delhi), SEO copy and blog posts into Supabase. No demo brokers: broker features start switched off.
// Usage (after running migrations 0002 and 0003):  npx tsx --env-file=.env scripts/seed-db.ts
// Demo rows are tagged details.demo = true. Remove them later with:
//   delete from properties where details->>'demo' = 'true';
import { createClient } from "@supabase/supabase-js";
import { NCR_DEMO_LISTINGS as MOCK_LISTINGS } from "../src/ui/data/demoNcr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env");
const db = createClient(url, key, { auth: { persistSession: false } });

const slugify = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const die = (what: string, e: { message: string } | null) => { if (e) throw new Error(`${what}: ${e.message}`); };

async function main() {
  const { data: cities } = await db.from("cities").select("id,slug");
  const { data: cats } = await db.from("categories").select("id,slug");
  const cityId = new Map((cities ?? []).map((c) => [c.slug, c.id]));
  const catId = new Map((cats ?? []).map((c) => [c.slug, c.id]));
  if (!cityId.size || !catId.has("warehousing")) throw new Error("Run migration 0002 first (cities / warehousing category missing).");

  const brokerMap = new Map<string, string>(); // brokers are not seeded

  let n = 0;
  for (const l of MOCK_LISTINGS) {
    const slug = l.slug;
    const { data: exists } = await db.from("properties").select("id").eq("slug", slug).maybeSingle();
    if (exists) continue;
    const citySlug = slugify(l.city.split("/")[0].trim());
    // In the demo data `area` is always expressed in acres; areaDisplay carries the friendly text (e.g. "4,500 sq.ft").
    const unit = "acre";
    const areaValue = l.area;
    const {
      id, slug: _s, title, tagline, category, listingType, zoneType, price, area, areaUnit, city, microMarket, state, aiDescription,
      ownerFullName, ownerPhone, ownerMaskedName, ownerMaskedPhone, ownerType, brokerId, verified, status, viewsCount, enquiriesCount,
      createdAt, realImageUrl, galleryImages, documents, ...rest
    } = l as typeof l & Record<string, unknown>;
    void id; void _s; void area; void areaUnit; void state; void ownerMaskedName; void ownerMaskedPhone; void enquiriesCount; void category; void listingType; void price;

    const { data: prop, error } = await db.from("properties").insert({
      title, slug, tagline, description: aiDescription, ai_description: aiDescription,
      listing_type: { Buy: "sale", Lease: "lease", Rent: "rent" }[listingType] ?? "sale",
      category_id: catId.get(slugify(category)), city_id: cityId.get(citySlug), micro_market: microMarket,
      price, area_value: areaValue, area_unit: unit, zone_type: zoneType, status: status ?? "live", is_verified: verified,
      hero_image: realImageUrl, gallery: galleryImages ?? [], broker_id: brokerId ? brokerMap.get(brokerId) ?? null : null,
      views: viewsCount ?? 0, created_at: createdAt,
      details: { ...rest, cityLabel: city, priceDisplay: l.priceDisplay, pricePerUnit: l.pricePerUnit, areaDisplay: l.areaDisplay, demo: true },
    }).select("id").single();
    die(`property ${slug}`, error);

    await db.from("listing_contacts").insert({ property_id: prop!.id, name: ownerFullName, phone: ownerPhone, owner_type: ownerType });
    if (documents?.length) {
      await db.from("verification_documents").insert(documents.map((d) => ({
        property_id: prop!.id, doc_type: d.name, category: d.category, status: d.status, doc_ref: d.documentRef ?? null,
        verified_on: d.verifiedDate ? new Date(d.verifiedDate).toISOString().slice(0, 10) : null, description: d.description,
      })));
    }
    n++;
  }
  console.log(`listings inserted: ${n} (of ${MOCK_LISTINGS.length})`);

  // SEO copy: intro + FAQ per category and city (plain, factual, no invented statistics)
  const catCopy: Record<string, { h1: string; intro: string; faq: [string, string][] }> = {
    industrial: {
      h1: "Industrial land for sale and lease in India",
      intro: "Browse plots in UPSIDC, GNIDA, DSIIDC and private industrial estates. Each listing shows the price, area, road access and zoning supplied by the owner, so you can shortlist quickly before calling.\n\nUse the filters on the search page to narrow by city, acreage and budget.",
      faq: [
        ["What documents should I check before buying industrial land?", "Ask for the title or allotment document, the latest revenue record (khatauni), an encumbrance certificate, applicable NOCs from the industrial authority or pollution control board, and a boundary survey. Have your own lawyer verify them."],
        ["What is the difference between authority (UPSIDC/GNIDA/DSIIDC) land and private industrial land?", "Estate land is usually leasehold with transfer conditions set by the authority, while private industrial land is typically freehold but needs the right zoning and approvals. Ask the owner for the ownership type and transfer rules."],
      ],
    },
    warehousing: {
      h1: "Warehousing and logistics land in India",
      intro: "Land near highways, ports and freight corridors for warehouses and logistics parks. Compare frontage, road width and connectivity for each parcel.",
      faq: [["What should I look for in warehousing land?", "Truck turning radius and road width, highway and port connectivity, power availability and zoning that permits storage and logistics use."]],
    },
    commercial: {
      h1: "Commercial land for sale in India",
      intro: "Commercial and mixed-use land parcels with the zoning, FSI and access details you need to plan a development.",
      faq: [["How do I check if land can be used commercially?", "Check the zoning in the master plan and the permissible FSI/FAR. Each listing lists the zone type and floor-area details supplied by the owner."]],
    },
    residential: {
      h1: "Residential plots for sale in India",
      intro: "Residential plots and plotted developments in growth corridors. Confirm approvals and layout status with the owner and your lawyer.",
      faq: [["Why does NA (non-agricultural) status matter?", "Agricultural land needs a conversion order before residential construction. Ask the owner for the order and the approved layout, and have your lawyer check them."]],
    },
  };
  for (const [slug, c] of Object.entries(catCopy)) {
    const { error } = await db.from("seo_pages").upsert({
      path: `/category/${slug}`, h1: c.h1, intro: c.intro, faq: c.faq.map(([q, a]) => ({ q, a })),
      title: c.h1, description: c.intro.split("\n")[0].slice(0, 155),
    });
    die("seo category", error);
  }
  const cityRows = [
    ["ghaziabad", "Ghaziabad", "Sahibabad Industrial Area, the Meerut Road belt, Loni and the NH-9 / NH-24 corridors are the main industrial and residential areas around Ghaziabad."],
    ["noida", "Noida", "Noida and Greater Noida, including the Expressway sectors, Ecotech, Surajpur and the Yamuna Expressway belt, hold industrial, commercial and residential land."],
    ["new-delhi", "New Delhi", "Industrial belts such as Narela, Bawana and Mundka, and residential belts such as Chhatarpur, make up the land market in the capital."],
  ];
  for (const [slug, name, blurb] of cityRows) {
    const { error } = await db.from("seo_pages").upsert({
      path: `/city/${slug}`, h1: `Land for sale and lease in ${name}`,
      intro: `${blurb}\n\nSign in to unlock the owner's contact details, then visit the site and have your lawyer check the papers.`,
      faq: [{ q: `How do I buy industrial land in ${name}?`, a: "Shortlist parcels by zone and budget, review the document checklist on each listing, then unlock the owner's contact and schedule a site visit before any payment." }],
    });
    die("seo city", error);
  }

  // Blog: general guidance only (no fabricated statistics)
  const posts = [
    {
      slug: "how-to-verify-industrial-land-in-india", title: "How to verify industrial land in India: a practical checklist", tags: ["Legal & Compliance"],
      excerpt: "Seven checks to run before you pay a token amount on an industrial plot.",
      body: "# Before you pay a token\n\nThis is general information, not legal advice. Have a lawyer review your specific deal.\n\n## 1. Ownership and title\n\nAsk for the sale deed or allotment letter and match the seller's identity to it. For estate land, confirm the seller is the registered allottee.\n\n## 2. Revenue record\n\nGet the latest 7/12 extract (or the state's equivalent) and check for mutation entries and pending disputes.\n\n## 3. Encumbrance\n\nAn encumbrance certificate for a sufficiently long period shows registered mortgages and charges.\n\n## 4. Approvals and NOCs\n\n- Industrial authority consent for transfer (estate land)\n- Pollution control board consent where applicable\n- Non-agricultural conversion for private land\n\n## 5. Boundaries\n\nCommission a boundary survey and compare it with the area on paper.\n\n## 6. Utilities\n\nConfirm the sanctioned power load and water connection in writing.\n\n## 7. Taxes\n\nCollect recent property-tax receipts to confirm there are no arrears.\n\nOn PLOTSS, each listing shows which of these documents our team has reviewed and the status of each.",
    },
    {
      slug: "authority-vs-private-industrial-plots", title: "Authority plots vs private industrial land: which fits your unit?", tags: ["Compare"],
      excerpt: "Leasehold estate plots and freehold private land trade off cost, approvals and flexibility.",
      body: "## Authority plots (UPSIDC, GNIDA, DSIIDC)\n\nUsually leasehold, with infrastructure and approvals sorted. Transfers need the authority's consent and may attract a transfer fee, so read the lease terms.\n\n## Private industrial land\n\nOften freehold and flexible, but you must confirm zoning, conversion and access yourself.\n\n## How to choose\n\n- Need speed and ready utilities: estate plot\n- Need a specific location or larger contiguous area: private land\n- Either way: verify title, approvals and boundaries before paying",
    },
    {
      slug: "what-to-check-before-buying-warehousing-land", title: "What to check before buying warehousing land", tags: ["Guide"],
      excerpt: "Road width, turning radius, power and zoning matter more than headline price.",
      body: "## Access\n\nTrailers need width and turning room. Check the approach road width and the frontage on the plot itself.\n\n## Connectivity\n\nNote the distance to the highway, the nearest port or rail terminal, and the customer base you serve.\n\n## Power and water\n\nConfirm the sanctioned load and whether a substation is close.\n\n## Zoning\n\nMake sure the zone permits storage and logistics use.",
    },
  ];
  for (const p of posts) {
    const { error } = await db.from("blog_posts").upsert({ ...p, status: "published", published_at: new Date().toISOString() }, { onConflict: "slug" });
    die("blog", error);
  }
  console.log(`seo pages: ${Object.keys(catCopy).length + cityRows.length}, blog posts: ${posts.length}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
