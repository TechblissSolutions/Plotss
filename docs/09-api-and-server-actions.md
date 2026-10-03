# 09 · API & Server Actions

PLOTSS mostly uses **server actions**: functions that run on the server but are called directly from a button or form in the page. There are very few classic "API endpoints". Each action re-checks who is calling; the browser is never trusted.

## 1. Public marketplace actions

| Action (file) | Caller | Checks | Returns |
|---|---|---|---|
| `revealContactAction(propertyId)` (`(site)/actions.ts`) | Signed-in user | Listing exists and is live; unlocks today < 20 (repeat unlocks of the same listing are free); records an `unlock` lead | `{ ok, name, phone, ownerType }` or `{ ok:false, error }` |
| `submitEnquiryAction(propertyId, message, visitDate)` | Signed-in user | Message ≥ 3 chars (trimmed to 1000); date format; enquiries today < 10 | `{ ok }` or error |
| `trackViewAction(propertyId)` | Browser (once per session per listing) | Valid id; DB ready | nothing (increments `views` atomically) |
| `parseQueryAction(text)` (`(site)/ai-actions.ts`) | Anyone | Rate limit 20/min per IP; text ≤ 300 chars | Filters object (`city`, `category`, `maxPrice`, …) |
| `generateDescriptionAction(fields)` | Signed-in seller/broker | Rate limit 15/hour per user; lengths capped | `{ text, source: 'ai'|'template' }` |
| `submitListingAction(payload, uploaded)` (`(site)/post-property/actions.ts`) | Signed-in **seller or broker** | Role; 10 listings/day; numbers in range; supported city/category; valid 10-digit phone; map pin within India; only files inside the user's own storage folder | `{ slug }` or `{ error }` |

## 2. Workspace actions

| Action | Caller | Checks |
|---|---|---|
| `setLeadStatus(enquiryId, status)` (`(app)/actions.ts`) | Listing owner | Status in `open/contacted/visit/closed`; caller must own the listing (or be admin) |
| `saveBrokerProfile(form)` | Broker | Role; creates/updates own profile, always **unverified** |

## 3. Admin actions (`admin/actions.ts`) — every one starts with `requireAdmin()`

| Action | Effect |
|---|---|
| `decideListing` | Set status live / rejected / draft / sold; recompute verified badge |
| `decideDocument` | Verify / reject / reset a document and set its reference number |
| `changeRole`, `verifyBroker` | Change a user's role; verify or revoke a broker |
| `saveContentAction` | Save text overrides and hidden sections |
| `saveSeoGlobal`, `saveSeoRow`, `deleteSeoRow` | Site-wide SEO; per-page overrides (path validated) |
| `saveBlog`, `deleteBlog` | Create/update/delete posts (slug sanitised) |
| `addRedirect`, `deleteRedirect` | Manage redirects (must start with `/`; no self-redirects) |
| `saveThemeAction` (`admin/theme/actions.ts`) | Save theme (values sanitised) |

After each save, the relevant cache tags are refreshed so the site updates.

### 3b. Launch and analytics actions (added 21 Sep 2026)

| Action | Effect |
|---|---|
| `saveFeaturesAction` | Save the launch switches (docs, AI screen, staff verification, brokers, tracking, consent banner, unlock limit) |
| `toggleCityAction` | Activate or hide a city |
| `rerunScreenAction` | Run the AI risk screen again for a listing |

## 4. Route handlers (URLs that return files/data)

| URL | Purpose | Notes |
|---|---|---|
| `/sitemap.xml` | Sitemap of live listings, cities, categories, blog | Generated from the database |
| `/robots.txt` | Crawler rules | Blocks `/admin`, `/dashboard`, `/api`, `/search?`; can block everything (staging switch) |
| `/llms.txt` | Plain-text site summary for AI answer engines | Live listings included |
| `POST /api/track` | First-party analytics collector (browser batches). Validates event types, clips text, drops bots and Do-Not-Track, rate-limits per visitor and per IP, attaches the user id server-side if signed in. Returns 204 |
| `/api/dev-login` | **Development-only** sign-in stand-in | Returns 404 when a database is connected or in production |

## 5. Database calls made from the browser

The browser uses the **publishable key** only for: sign-in/out, reading the user's own profile, choosing a role (buyer → seller/broker, enforced by trigger), and **uploading files into its own storage folder**. Everything else goes through the server.

## 6. Error handling convention

Server actions never throw raw errors at the user. They return `{ ok:false, error:"short sentence" }` (or `{ error }`), which the UI shows in a clay-coloured message with `role="alert"`. Unexpected failures are logged on the server.

## 7. Adding a new action (developer recipe)

1. Create the function in the right `actions.ts` with `"use server"`.
2. Get the session (`getSession()`); reject if missing or wrong role.
3. Validate and cap every input.
4. Apply a rate limit if it costs money or can be abused.
5. Use the service client **only after** steps 2 to 4.
6. Return a small typed result; refresh cache tags if public data changed.
7. Add a unit test for the pure logic.
