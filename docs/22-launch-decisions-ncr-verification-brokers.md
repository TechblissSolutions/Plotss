# 22 · Launch Decisions: Delhi-NCR, Verification Phases, Brokers, Tracking

**Status:** decided 21 September 2026 (owner request + recommendation). Each decision can be reversed from **Admin → Settings**; nothing is hard-coded.

---

## D13 · Verification is phased, and split into three separate switches

**Owner's need:** many owners only discuss documents *after an offline meeting*, so making them upload papers at listing time is unnecessary friction. Start with AI screening; add human review later.

**Decision (recommended and implemented):**

| Switch (Admin → Settings) | Launch value | Meaning |
|---|---|---|
| **Collect documents** | **OFF** | Seller form has no Documents step; listing pages have no document checklist |
| **AI risk screen** | **ON** | Every new listing is automatically checked; admins see flags; passing listings show an **AI-screened** label |
| **Staff verification** | **OFF** | The word **Verified** and the "Verified only" filter are switched off |

**Why three switches and not one:** each phase has a different cost and a different promise.

| Phase | Setup | Public promise | Effort | Risk |
|---|---|---|---|---|
| **1 · Launch** | Docs off, AI on, staff off | "Listings are screened for red flags." Buyers verify papers with the owner and their own lawyer | Low: admin still approves each listing | Low, *if* the wording stays honest |
| **2 · Add documents** | Docs on, staff off | Sellers upload; buyers see what exists, but no badge | Medium | Medium (people may assume it is verified: keep the disclaimer) |
| **3 · Human review** | Docs on, staff on | **Verified** = staff checked every document | High (needs a review team, SLA, evidence log) | Highest promise, so needs [legal sign-off](19-legal-and-compliance.md) |

**Honest limit of "AI verification":** a language model **cannot** verify a land title. It cannot confirm a stamped deed is genuine or that the seller owns the plot. So the AI feature is a **risk screen**, and the public label is **"AI-screened (not a legal verification)"**, never "Verified". This protects the brand and the owner legally.

**What the AI screen actually checks** (rules first, optional Grok second opinion):
- Missing basics (very short description, no photo, no map pin)
- Price per acre far below or above comparable live listings in the same city and category
- Duplicate title, or the same phone number on many listings
- Red-flag wording ("pay advance/token first", "no documents needed", "100% guaranteed")
- Extreme areas or prices that look like typing errors

Result: a **risk score 0 to 100**, flags with severity, stored on the listing and shown to admins in the approval queue (with a "Run screen" button). A listing under 40 shows the AI-screened label. **Admin approval is still required to publish**: the AI never publishes anything by itself.

**When to move to Phase 2 or 3:** when you (a) see buyers asking "is this verified?" often, (b) have a team or partner (lawyer/valuer) able to review within a promised time, and (c) have a written Verification Standard.

---

## D14 · Launch cities: Ghaziabad → Noida → New Delhi

- Only these three are **active**. All others stay in the database but hidden; the super admin can activate or hide any city in **Admin → Settings → Cities**.
- Everything city-related is now data-driven: search filter, seller form, city pages, sitemap, `llms.txt`, and the AI parser (which also understands local areas such as Sahibabad, Loni, Indirapuram, Greater Noida, Ecotech, Surajpur, Narela, Bawana, Okhla, Chhatarpur).
- **Suggested rollout:** Ghaziabad first (core supply and demand), then Noida after ~15 live listings in Ghaziabad, then New Delhi. Announce each city with its own landing page and a few articles.
- **Local knowledge to add to content:** authorities differ: **UPSIDC / GNIDA / NOIDA Authority / GDA** (Uttar Pradesh) and **DSIIDC** (Delhi). Delhi has restrictions and special rules on land use: have the city guides reviewed by a local lawyer.
- Existing demo listings were rewritten for these areas and are clearly labelled demo. Replace them with real listings before launch.

## D15 · Brokers are OFF until a team is confirmed

- **Settings → Enable broker features** is **off**. While off: the broker banner, the nav link, the broker option in sign-up, broker profiles and the broker dashboard are hidden (broker URLs return "not found").
- Direct owners can list; they see the seller dashboard. Unfamiliar "owners" who look like brokers are caught by the AI screen (many listings on one phone number).
- When you are ready: switch it on, verify broker RERA numbers in **Users & brokers**, and consider a broker onboarding call.
- **Note:** the database still allows a user to choose the broker role in the sign-up window if the UI were bypassed; such a broker has **no public presence** until an admin verifies them.

## D16 · Journey tracking is first-party and consent-based

- Stored on our own server (not a third-party analytics script), shown in **Admin → User journey**, behind an Accept/Decline banner. Details, limits and the five tracking levels: [doc 21](21-analytics-and-user-journey-tracking.md).
- **Why first-party:** ad blockers do not remove it, we own the data, and consent and retention are under our control.
- **What we chose not to do:** record what people type, keystrokes, or session replay (heavier privacy burden; can be added later behind consent).

## D17 · Claims cleanup for a truthful launch

Removed or rewritten: "Absolute Verification", "30-year title audits", "100% pre-audited", "DGPS surveyed/verified", Maharashtra-specific claims (MIDC lease transfer, 7/12 audits), invented company name, price-growth percentages and match scores not backed by data. Verified/AI-screened labels now follow the switches above.

---

## What changes for each person

| Person | Launch experience |
|---|---|
| **Seller** | Shorter form (no documents step), map pin, photos, description helper. Listing goes to "Under review" |
| **Buyer** | Sees listings in the three cities, an **AI-screened** label, unlock contact after sign-in, and is told to verify papers directly with the owner |
| **Admin** | Approval queue shows the AI risk flags; approves or rejects; no document work |
| **Super admin** | Settings page with the switches; User journey dashboard; content, SEO and theme as before |

## Open items for the owner

1. Exact wording of the **AI-screened** disclaimer (shown near the badge and in Terms).
2. Who approves listings on day one, and the promised approval time?
3. Legal pages with a lawyer (mention AI screening and tracking).
4. First 15 to 30 real Ghaziabad listings: who will source them?
