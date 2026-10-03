# 17 · Admin Manual (for the Super Admin & Operations Team)

No coding needed. Everything here is done from the admin area in your browser.

**How to open it:** sign in with your admin email and password (Home → *Sign in* → *Sign in with email*), then click **Admin Desk ↗** in the header, or go to `/admin/listings`.

The admin area has a plain grey look on purpose: even if you choose a bad colour theme for the public site, you can always read the admin screens.

---

## 1. Approval queue: `Admin → Approval queue`

**Your most important daily job.** Every new listing arrives as **Pending**.

1. Use the tabs (pending, live, rejected, draft, sold, all).
2. Read the listing: title, city, price, owner, description.
3. For **each document** on the right:
   - Click **Open file ↗**. It opens the private scan (link works 10 minutes).
   - Check it is genuine, matches the owner, and covers this plot.
   - Type the **document reference number** (e.g., 7/12 extract number).
   - Click **Verify**, **Reject**, or **Reset**.
4. Click **Publish** to make the listing live, or **Reject**.
   - The green **Verified** badge appears automatically **only if every document is verified**.
   - You can publish a listing with unverified documents; it will simply have no Verified badge and its checklist shows the real statuses.
5. Later you can **Unpublish** (back to draft) or **Mark sold**.

**Rules of thumb**
- Never verify a document you did not actually see.
- If something looks wrong, reject and note why (write to the owner by phone or email).
- Watch for the same phone number across many "owners", or prices far below the market.

## 2. Users & brokers: `Admin → Users & brokers`

- **Change role:** pick a role and click Save. Give **admin** only to trusted staff.
- **Broker verification:** check the RERA / agency proof the broker submitted, then click **Verify**. Their public profile and badge appear. Click **Revoke** to hide them again.

## 3. Analytics: `Admin → Analytics`

Cards: listings, live listings, unlocks and enquiries in the last 30 days. Charts: by city, category, status, verification, most viewed, users by role, unlocks per day. A sudden spike in unlocks by one account can mean scraping: change that user's role or contact the developer.

## 4. Theme & design: `Admin → Theme & design`

Left side: controls. Right side: a live preview. Nothing changes on the real site until you click **Save & publish**.

| Control | What it does |
|---|---|
| **Colours** | Seven colours. For each choose **Solid** or **Gradient** (two colours + angle) |
| Heading / body / number fonts | Pick from 12 fonts |
| Heading and body weight | Thin to bold |
| Base font size | Overall text size |
| Body and heading line-height | Space between lines |
| Heading letter-spacing | Tighten or loosen headings |
| Corner radius, border width | Sharp or rounded look |
| Content width, section spacing | Layout density |
| Card shadow | None or soft |
| **Reset to defaults** | Returns to the original brand |

Tips: keep body text dark on a light background (or the reverse); the lime colour is meant only for AI labels; check the preview on a phone-size window.

## 5. Content: `Admin → Content`

Edit any wording on the Home page, header, footer and the Post page title.

1. Find the text (use the search box), for example `home.hero.title`.
2. Type your version. The grey text shown inside the box is the built-in default.
3. **Leave empty** to keep the default.
4. **Save & publish**. Changes show within about a minute.

**Sections:** untick to hide a section (e.g., Testimonials, RERA badges). They start **hidden** on purpose: turn them on only when they are true. To use testimonials you need the developer to add real quotes.

**Homepage numbers:** by default the numbers in the dark strip are computed from real data. Type a value only if you can prove it, for example if you have 45 verified plots offline and want to state that.

## 6. SEO: `Admin → SEO`

See the step-by-step in [SEO & content](10-seo-and-content.md#2-how-to-use-admin--seo-step-by-step). Quick version:

1. **Site-wide:** site URL, name, default description, social image, organisation details. Tick "Block search engines" **only** on a test site.
2. **Listing page template:** one pattern for all property pages.
3. **Pages with custom SEO:** open a page (like `/city/pune`) → title, description, heading, intro text, FAQs → Save.
4. **Add a page:** use the "+ Add / edit a page" box; the path must start with `/`.

## 7. Blog: `Admin → Blog`

1. **+ New post** → title, excerpt (short summary), body, cover image URL, tags.
2. Body uses simple Markdown: `## Heading`, `- list item`, `**bold**`, `[link text](https://…)`, `![alt](image-url)`.
3. Status **Draft** (hidden) or **Published** (live at `/blog/your-slug`, also on Home and in the sitemap).
4. Add an **SEO title/description** for better Google results.
5. Delete removes it permanently.

## 8. Redirects: `Admin → Redirects`

When you rename or remove a page, add a redirect so old links still work: **From** `/old-path` → **To** `/new-path` (or a full URL). Use **301** (permanent) normally; **302** for temporary.

## 8b. Settings: `Admin → Settings`

| Switch | What it does | Suggested at launch |
|---|---|---|
| Collect documents | Adds the Documents step to the seller form and the checklist to listing pages | Off |
| AI risk screen | Screens every new listing; you see flags in the queue; passing listings show "AI-screened" | On |
| Staff verification | Enables the "Verified" badge and filter (only use with a real review team) | Off |
| Enable broker features | Broker banner, nav, sign-up option, profiles, dashboard | Off |
| Record visitor journeys | Turns analytics on | On |
| Ask for consent | Shows the Accept/Decline banner | On |
| Contact unlocks per day | Daily cap per user | 20 |
| **Cities** | Activate or hide cities | Ghaziabad, Noida, New Delhi active |

Changes apply within a minute. See [Launch decisions](22-launch-decisions-ncr-verification-brokers.md) for the reasoning.

## 8c. User journey: `Admin → User journey`

Read it top to bottom: headline numbers → **Buyer funnel** and **Seller funnel** (look for the biggest drop) → **Where sellers left the form** → **Most clicked buttons** → pages, sources, devices → searches (especially **empty** ones, which tell you which listings to add) → **Recent visitor journeys** (click one to see the exact sequence). Full guide: [Analytics & tracking](21-analytics-and-user-journey-tracking.md).

The AI risk screen appears on each listing in the **Approval queue** ("Risk 0 to 100", flags, and a **Run screen** button). Use it as a guide, never as proof: high risk → look closer or reject; low risk still needs your own judgement.

## 9. Common tasks (cheat sheet)

| I want to… | Go to |
|---|---|
| Publish a new listing | Approval queue → verify documents → Publish |
| Remove a listing | Approval queue → Unpublish or Reject |
| Change the main button colour | Theme → Colours → Clay |
| Change the homepage headline | Content → `home.hero.title` |
| Improve Google title of a city page | SEO → the city path |
| Add an article | Blog → New post |
| Hide the testimonials/RERA badges | Content → Sections |
| Make someone a broker/seller/admin | Users & brokers → role |
| Verify a broker | Users & brokers → Verify |
| Turn documents/AI screen/brokers on or off | Settings |
| See where visitors drop off | User journey |
| Open a new city | Settings → Cities → Activate |

## 10. When something looks wrong

| Problem | Try |
|---|---|
| My change is not visible | Wait 1 to 5 minutes; hard-refresh (Ctrl+F5) |
| Site looks broken after a theme change | Theme → **Reset to defaults** → Save |
| A listing shows no Verified badge | Some document is not verified; open the queue and check each |
| I cannot sign in to admin | Ask the developer to confirm your role is `admin` |
| Something feels unsafe | Unpublish the listing, then contact the developer |

## 11. Good habits

- Approve within your promised time; unanswered listings hurt trust.
- Keep a private log (spreadsheet) of who verified what and when until an audit log is added.
- Do not share your admin password; use a password manager; ask the developer to enable two-factor sign-in.
