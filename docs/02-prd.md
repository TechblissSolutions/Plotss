# 02 · Product Requirements Document (PRD)

**Purpose of this document:** to say *what* the product must do and *why*, in enough detail that a designer, developer, tester and business owner all agree on the same thing. *How* it is built is in the [TRD](05-trd-technical-requirements.md).

**Legend:** ✅ built · 🟡 partly built · 🔲 planned · Priority **P0** = must have for launch, **P1** = soon after, **P2** = later.

---

## 1. Goals and non-goals

**Goals**
1. Let a buyer describe what they need and quickly reach relevant, trustworthy listings.
2. Make verification *visible and honest*, not a decorative badge.
3. Capture verified leads (signed-in buyers) for sellers and brokers.
4. Give the site owner full control over look, wording and SEO without developers.
5. Rank well on Google and be quotable by AI answer engines.

**Non-goals for release 1:** payments/escrow, e-registration, mobile apps, multi-language, auctions, in-app chat.

## 2. Personas (short)

| Persona | Example | Main need | Biggest fear |
|---|---|---|---|
| Buyer | Plant manager at an auto-parts maker | A 3-acre plot with power and a wide road, fast | Buying disputed land |
| Seller | Family owning inherited land near a highway | Reach real buyers without brokers | Wasting time on tyre-kickers |
| Broker | Agent with 20 plots across Pune | Manage listings and leads in one place | Losing leads to competitors |
| Admin | Operations staff | Approve quickly and correctly | Approving something fraudulent |
| Super admin | Site owner | Change the site themselves | Needing a developer for every edit |

## 3. Feature requirements

### 3.1 Discovery (buyer side)

| ID | Requirement | Pri | Status |
|---|---|---|---|
| D1 | Home page with search box, categories, cities, featured listings, "how it works", "what verified means", broker call-to-action, blog preview | P0 | ✅ |
| D2 | Natural-language search: a sentence becomes filters shown as removable chips | P0 | ✅ rules; ✅ AI when key present |
| D3 | Search results with filters (city, category, type, budget, area, zone, verified-only) and sorting | P0 | ✅ |
| D4 | Match score per result that reflects how well it fits the buyer's stated needs (hidden when no needs are stated) | P0 | ✅ |
| D5 | Map view of results (OpenStreetMap) | P1 | ✅ |
| D6 | Compare up to 3 listings side by side | P1 | ✅ |
| D7 | City pages and category pages with editable SEO copy and FAQs | P0 | ✅ |
| D8 | Save listings (per device) | P1 | 🟡 saved on the device only; account-level saving planned |
| D9 | Saved-search alerts (email/WhatsApp when new matches appear) | P2 | 🔲 |

### 3.2 Trust and decision support

| ID | Requirement | Pri | Status |
|---|---|---|---|
| T1 | Property page: photos, key facts, description, area insight, connectivity, price history | P0 | ✅ (insight fields come from what the seller/admin entered) |
| T2 | Verification checklist per document with status and reference number | P0 | ✅ |
| T3 | "Verified" badge only when the listing has documents and *all* are verified | P0 | ✅ |
| T4 | Price fairness indicator versus similar listings | P1 | 🟡 shown from stored values; automatic calculation planned |
| T5 | Owner contact hidden (masked) until sign-in; real value delivered only by the server | P0 | ✅ |
| T6 | Limit contact unlocks (20/day) and enquiries (10/day) per account | P0 | ✅ |
| T7 | Enquiry / site-visit request stored and shown to the owner as a lead | P0 | ✅ |

### 3.3 Accounts and roles

| ID | Requirement | Pri | Status |
|---|---|---|---|
| A1 | Sign in with Google or mobile OTP; no long forms | P0 | ✅ (providers switched on in Supabase) |
| A2 | Email + password sign-in for admins | P0 | ✅ |
| A3 | Choose role after first sign-up: buyer / seller / broker | P0 | ✅ |
| A4 | Users can never make themselves admin; brokers stay "unverified" until an admin checks them | P0 | ✅ enforced in the database |
| A5 | Separate workspaces (own tab, own layout) for buyer, seller, broker, admin | P0 | ✅ |

### 3.4 Selling and broker tools

| ID | Requirement | Pri | Status |
|---|---|---|---|
| S1 | Post-property form usable **without an account**; mobile verification required only at submit | P0 | ✅ |
| S2 | Seven steps: details, location (map pin), documents, photos, description, preview, submit | P0 | ✅ |
| S3 | Real uploads: photos to a public store, documents to a private store | P0 | ✅ (needs the storage part of migration 0002) |
| S4 | AI writing assistant that rewrites the seller's own facts, never invents any | P1 | ✅ template now; AI when Grok key present |
| S5 | New listings start as "Under review" and go live only after admin approval | P0 | ✅ |
| S6 | Seller dashboard: listings, status, views, leads with status tracking | P0 | ✅ |
| S7 | Broker dashboard: profile submission (RERA), listings, lead pipeline (new → contacted → site visit → closed) | P0 | ✅ |
| S8 | Public broker profile shown only after admin verifies the broker | P1 | ✅ |
| S9 | Bulk listing upload (spreadsheet) | P2 | 🔲 |

### 3.5 Admin and super admin

| ID | Requirement | Pri | Status |
|---|---|---|---|
| M1 | Approval queue: review listing, open each private document, verify/reject each with a reference number, publish/unpublish/reject/mark sold | P0 | ✅ |
| M2 | User list, role change, broker verification | P0 | ✅ |
| M3 | Analytics: listings by city/category/status, most viewed, unlocks per day, users by role | P1 | ✅ |
| M4 | **Theme editor:** colours (solid or gradient), fonts, line-heights, spacing, corner radius, shadows; live preview | P0 | ✅ |
| M5 | **Content editor:** every text on Home, Header, Footer; show/hide sections; override the homepage numbers | P0 | ✅ (84 texts) |
| M6 | **SEO manager:** site-wide settings, per-page title/description/heading/intro/FAQ/canonical/noindex, listing template | P0 | ✅ |
| M7 | **Blog:** write, publish, unpublish posts in Markdown | P1 | ✅ |
| M8 | **Redirects:** old URL → new URL (301/302) | P1 | ✅ |
| M9 | Content on more pages (Search, Property page labels, dashboards) editable | P2 | 🔲 (Home, Header, Footer, Post page title done) |
| M10 | Audit log of admin actions | P1 | 🔲 |

### 3.6 SEO and AI-discoverability

| ID | Requirement | Pri | Status |
|---|---|---|---|
| E1 | Unique title, description, canonical, social preview on every public page | P0 | ✅ |
| E2 | Structured data: Organization, WebSite (+search box), Breadcrumbs, Listing, Article, FAQ | P0 | ✅ |
| E3 | Sitemap and robots.txt generated from live data; search-result pages kept out of Google | P0 | ✅ |
| E4 | `llms.txt` describing the site for AI answer engines | P1 | ✅ |
| E5 | Fast pages (target Lighthouse 90+) | P0 | 🔲 to be measured after real images and data are in |

### 3.7 Launch switches and journey analytics (added 21 Sep 2026)

| ID | Requirement | Pri | Status |
|---|---|---|---|
| L1 | Verification split into three switches: collect documents, AI risk screen, staff verification. Launch: docs off, AI on, staff off | P0 | ✅ |
| L2 | AI risk screen on every new listing (basics, duplicates, price outliers, red-flag wording) with a 0-100 risk score shown to admins; passing listings show "AI-screened", never "Verified" | P0 | ✅ |
| L3 | Broker features can be switched off as a group (default off) | P0 | ✅ |
| L4 | Cities are data with an active switch; launch cities Ghaziabad, Noida, New Delhi | P0 | ✅ |
| L5 | First-party journey tracking (page views, every CTA click, scroll, time, form steps and last field touched, searches, conversions) behind a consent banner | P0 | ✅ |
| L6 | Admin "User journey" dashboard: funnels, drop-off, CTA table, sources, zero-result searches, session viewer | P0 | ✅ |
| L7 | Admin-editable unlock limit per day | P1 | ✅ |
| L8 | Alerts on funnel drops; session replay/heatmaps | P2 | 🔲 |

## 4. Business rules (the "laws" of the product)

1. A listing is visible to the public only when its status is **live**.
2. Only an **admin** can set a listing to live or mark documents verified. Owners cannot, even by calling the database directly.
3. The **Verified badge** appears only when *staff verification is switched on* **and** the listing has at least one document **and** every document is verified. With staff verification off, no listing is ever called Verified; listings that pass the AI screen show **AI-screened** instead.
4. Owner name and phone are **never** in the public page data. They are returned only to a signed-in user, one listing at a time, within daily limits.
5. A broker's public profile appears only after an admin verifies them.
6. Buyers who unlock a contact or send an enquiry become a **lead** visible to that listing's owner (this is disclosed in the terms).
7. Homepage statistics are **computed from real data**; an admin may override them but should only use figures they can prove.
8. Testimonials and regulatory badges (e.g., RERA) are **hidden by default** until the owner confirms they are true.

## 5. Non-functional requirements (quality bar)

| Area | Requirement |
|---|---|
| Speed | Main pages interactive in under 3 seconds on a mid-range phone over 4G |
| Availability | Target 99.5% monthly (depends on hosting plan) |
| Security | See [Security & privacy](08-security-and-privacy.md): least privilege, no secrets in the browser, rate limits |
| Privacy | Follow India's DPDP Act principles: collect only what is needed, clear consent, deletion on request |
| Accessibility | Keyboard usable, readable contrast, meaningful labels (target WCAG 2.1 AA; formal audit planned) |
| Compatibility | Latest two versions of Chrome, Edge, Safari, Firefox; Android and iOS browsers |
| Maintainability | Typed code, automated tests for critical logic, documented migrations |
| Scalability | Comfortable to a few hundred listings today; server-side search and pagination needed beyond ~1,000 (see roadmap) |

## 6. Assumptions and dependencies

- Supabase (database, login, file storage) is available and the SQL migrations are applied.
- Google and phone-OTP sign-in are configured (SMS provider such as Twilio needed for OTP).
- A human review team exists to approve listings and verify documents. **The "verification" promise is only as good as this team.**
- Content claims (verification methods, survey methods) must match what the team really does.

## 7. Open questions for the owner

1. Which legal entity owns the platform and appears in the terms?
2. What exactly does "verified" promise, and who signs off? (Wording appears on the site.)
3. Will there be a fee for listing, for unlocking, or both?
4. Target cities for launch (currently 8 configured)?
5. Will you run your own review team or partner with legal/valuation firms?
