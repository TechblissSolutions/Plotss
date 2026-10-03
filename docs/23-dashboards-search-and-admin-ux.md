# 23. Dashboards, near-me search and admin panel (UX update)

This page explains, in plain words, what changed after the first launch build and why.

## 1. Who lands where after login

| Person | Where they go | Opens in |
|---|---|---|
| Super admin | Admin panel (`/admin`) | A separate browser tab |
| Seller | Seller dashboard | Same tab |
| Buyer | Buyer dashboard | Same tab |
| Broker | Broker dashboard (only when broker features are on) | Same tab |

Everyone has a Sign out button. The admin can preview the other dashboards from the admin menu, but they will look empty because the admin has no listings of their own. To test a real seller or buyer, sign in with a different account and change its role under Admin, Users.

## 2. Seller dashboard

- Four numbers at the top: live listings, total views, new leads, all leads.
- A "Needs your attention" box: buyers waiting for a reply, and listings that were not approved (with the reason the admin typed).
- One card per listing: photo, plain-language status, and what to do next.
  - Live listings show a small funnel: views, saves, contacts unlocked, enquiries.
  - A **listing quality score** (0 to 100) with up to three tips, such as "Add 2 more photos" or "Pin the exact location on the map".
  - Buttons: View live, Edit, Mark as sold, Fix and resubmit. Editing sends the listing back for review, so nothing unchecked goes live.
- A **Leads inbox** with filters (New, Contacted, Site visit, Closed, All). Each lead has one-tap Call and WhatsApp buttons and a status menu.
- An empty state that explains how to post the first listing.

**Admin side:** when rejecting a listing the admin can type a short reason. It is shown to the seller. No database change is needed; the reason is stored inside the listing details.

## 3. Buyer dashboard

- "What are you looking for?": city, type of land and highest budget. Saved on the buyer's account. Matching listings appear under "New matches for you".
- **Saved listings now live in the account**, so they follow the buyer to any phone or computer. Anything saved on a device before signing in is merged in once.
- "Owners you contacted" shows the owner name with Call and WhatsApp buttons.
- If nothing matches, a plain-language search box is shown.

## 4. Near-me search

On the search page a buyer can press **Use my location** or pick a starting area (for example Indirapuram or Noida Sector 62).

- Listings are sorted nearest first, each card says "About 4.4 km away", and the buyer can limit the distance (5, 10, 25 or 50 km).
- The map shows the starting point as a blue dot and each listing as a red dot.
- Distances are in a straight line, so real road distance is longer. The page says so.
- If location is refused, the buyer is asked to pick an area. Nothing is stored on our servers.

Every listing needs coordinates for this to work. The seller form already asks for a map pin. The 10 demo listings were given approximate coordinates.

## 5. Admin panel: what changed

- Works on phones and tablets (a Menu button opens the navigation).
- Skip-to-content link, visible keyboard focus, labelled buttons and form fields, table captions and column headers, better text contrast, and reduced-motion support.
- Launch settings and Users pages use the same cards, badges and empty states as the rest of the admin.
- The admin's own clicks are no longer recorded in the visitor journey report, so the numbers reflect real visitors.

## 6. Ideas not built yet

- Buyer notes and a visit planner, and a compare screen on the dashboard.
- Alerts (email or WhatsApp) for new leads and new matches.
- Automatic expiry reminders for old listings, and photo changes on the edit page.
- Broker dashboard redesign, once brokers are switched on.

## 7. Sign-in pages, blog and footer (later update)

- **/login and /register** are full pages. Register first asks "I want to: Buy land / Sell my land" and applies that role after the first sign-in (Google or phone code). Signed-in people are sent straight to their dashboard. The pop-up login still works everywhere else.
- **Blog:** topic filters, a featured article, reading time, pagination, breadcrumbs, share buttons (WhatsApp, X, LinkedIn, Facebook), a "Keep reading" section and a call-to-action.
- **Listing page map:** every listing shows a map. With an exact pin it shows the pin; without one it shows the general area and says so.
- **Footer:** now lists only Ghaziabad, Noida and New Delhi, real category and city links, and company pages. The old Pune, Mumbai and Chennai links are gone. All footer text can be edited under Admin, Content.
