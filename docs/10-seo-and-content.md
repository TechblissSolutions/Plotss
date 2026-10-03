# 10 · SEO, AEO & Content Guide

**SEO** = being found on Google. **AEO/GEO** = being quoted by AI answer engines (ChatGPT, Perplexity, Google AI answers). The site is built so both can read it, and so a non-developer can improve it.

## 1. What is already in place

| Feature | What it does |
|---|---|
| Server-rendered pages | Google receives full HTML, not an empty shell |
| Per-page title, description, canonical, social preview | Set automatically; overridable in **Admin → SEO** |
| Site-wide settings | Site name, title template (`%s | PLOTSS`), default description, social image, organisation details, social profiles, and a "block search engines" switch for staging |
| Listing template | One title/description pattern for all property pages, e.g. `{title} — {city}`. Tokens: `{title} {city} {area} {price} {category} {zone}` |
| City & category pages | Editable heading, intro text and **FAQs** per page |
| Structured data (JSON-LD) | Organization, WebSite with search box, BreadcrumbList, RealEstateListing + Offer, Article, FAQPage |
| Sitemap | `/sitemap.xml`: home, search, blog, cities, categories, every live listing, every published post |
| Robots | `/robots.txt` blocks admin, dashboards, API and search-result URLs |
| `noindex` for search results | Query pages are thin/duplicate, so they are hidden from the index but links are still followed |
| `llms.txt` | Machine-readable summary of what the site offers |
| Redirects | Keep link value when a URL changes (301) |
| Blog | Long-form articles that target questions buyers ask |
| Clean URLs | `/property/3-acre-midc-plot-chakan…`, `/city/pune`, `/category/industrial` |

## 2. How to use Admin → SEO (step by step)

1. **Site-wide first.** Set the correct **Site URL** (your real domain, no trailing slash), site name, default description and a good default social image (1200×630 works best).
2. **Organisation.** Add logo URL, phone, email, and social profile links. These feed Google's knowledge panel.
3. **Listing template.** Under "Listing page template", write a title pattern like `{title} for sale in {city} | {price}` and a description such as `{area} of {category} land in {city}. See documents reviewed, road access and price per acre.`
4. **City and category pages.** For each page:
   - Title ≈ 50 to 60 characters, description ≈ 140 to 160.
   - Write 2 to 4 short paragraphs of useful, *original* text in **Visible intro copy**.
   - Add 2 to 5 FAQs as `Question||Answer`, one per line. They appear on the page and in Google as FAQ results.
5. **Blog.** Publish helpful guides regularly (see §4).
6. **Before launch.** Make sure "Block search engines" is **off** on the live site (and **on** for staging).

## 3. Writing content that ranks (rules of thumb for the content team)

- Answer one clear question per page. Put the answer in the first 2 sentences.
- Use the words buyers use: "industrial plot in Chakan", "MIDC land price per acre", "warehouse land near Bhiwandi".
- Never copy other sites. Duplicate text hurts ranking.
- Add real numbers and sources (with dates). Avoid invented statistics.
- Link related pages (city ↔ category ↔ article).
- Update old articles; freshness matters for prices and rules.
- Every listing description should be unique and factual (the AI helper rewrites the seller's facts; it must not invent).

## 4. Suggested content plan (first 3 months)

| Type | Examples |
|---|---|
| Guides | How to verify industrial land; MIDC vs private plots; warehousing land checklist; NA conversion explained |
| City pages | Land in Pune / Chakan / Talegaon; Sanand GIDC; Bhiwandi warehousing; Sriperumbudur |
| Comparisons | Lease vs buy industrial land; freehold vs leasehold |
| Market notes | Price per acre by corridor (only with sourced data) |
| FAQs | Stamp duty, transfer fees, due diligence timeline (have a lawyer review) |

## 5. Technical SEO checklist before launch

- [ ] Real domain set in **Site URL** and in `NEXT_PUBLIC_SITE_URL`
- [ ] HTTPS enabled; www/non-www redirect decided
- [ ] Submit `/sitemap.xml` in Google Search Console and Bing Webmaster
- [ ] Test 5 sample URLs in Google's Rich Results Test
- [ ] Lighthouse SEO and performance ≥ 90 on mobile
- [ ] Every page has one H1; images have `alt` text
- [ ] 404 page exists; old URLs redirected
- [ ] Remove or rewrite demo listings (thin/fake content hurts trust)
- [ ] Google Business Profile and social profiles created and linked

## 6. Measuring

Connect Google Search Console (impressions, clicks, queries) and an analytics tool (e.g., Google Analytics or a privacy-friendly one). Track: organic visits, top landing pages, search-to-unlock conversion, sign-ups by source. (Analytics scripts are **not** installed yet, so add one after deciding your cookie/consent approach.)

## 7. Answer-engine (AEO/GEO) tips

- Keep FAQs on city/category pages: they map directly to questions AI assistants answer.
- Use clear, factual sentences with units and dates.
- Keep `llms.txt` and the sitemap fresh (they update automatically).
- Earn citations: publish original data (e.g., median price per acre by corridor from your own listings once you have volume).
