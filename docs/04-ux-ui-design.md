# 04 · UX / UI Design Document

**UX** (user experience) = how easy and pleasant it is to get things done. **UI** (user interface) = what things look like. This document is the rulebook that keeps every screen consistent, and explains what the super admin can change.

---

## 1. Design idea in one paragraph

Most Indian land portals look like the same "navy blue + gold" real-estate template, which signals *broker portal*. PLOTSS deliberately looks different: **earthy and editorial with one sharp "AI" accent**. Large serif headlines feel confident and trustworthy; thin borders and generous white space feel modern; abstract survey-style graphics avoid cheap stock photos. The result should feel like *"premium industrial + AI-native"*.

## 2. Design principles

1. **Proof over promise.** Anything that claims trust (verified, surveyed) must be backed by something the visitor can open.
2. **Say it in one sentence.** Search accepts natural language; forms ask the minimum.
3. **No dead ends.** If a step needs sign-in, the sign-in window opens right there and returns the user to what they were doing.
4. **Calm, not noisy.** Flat surfaces, thin 1px borders, almost no shadows, motion only to explain (e.g., checklist ticks appearing).
5. **Honest empty states.** If there is no data, say so plainly instead of showing fake numbers.
6. **Phone first.** Most visitors will use a phone; every screen must work at 360px width.

## 3. Brand system (defaults; all editable by the super admin)

### Colours

| Name | Hex | Used for |
|---|---|---|
| Graphite | `#16181B` | Text, dark sections, primary buttons |
| Clay (terracotta) | `#B5502C` | Main call-to-action, links, highlights |
| Ivory | `#F7F4EF` | Page background (warm off-white) |
| Signal lime | `#C8FF4D` | **Only** for AI tags and match scores |
| Stone | `#6B6560` | Secondary text |
| Moss | `#3D5A40` | Verified / success |
| Line | `#DDD8CF` | Borders and dividers |

Derived shades (lighter/darker tints, "sand", "mist") are calculated automatically from these, so changing a base colour recolours everything consistently.

### Typography

| Use | Default font | Notes |
|---|---|---|
| Headlines | Fraunces (serif) | Big, confident; never for body text |
| Body / interface | Inter | Clean and very readable |
| Numbers (prices, areas) | Inter Tight, tabular numerals | Digits line up in columns |
| AI labels | Inter, small caps, letter-spaced, lime background | One consistent micro-pattern for anything AI-generated |

Twelve Google fonts are offered in the theme editor. Line-height (body and headings), base size, weights and letter-spacing are adjustable.

### Shape and space

Corner radius 4 to 8 px (adjustable 0 to 32), 1px borders (0 to 4), content width 1240px (adjustable), section spacing 96px (adjustable), optional soft card shadow.

### Solid or gradient

Every brand colour can be a solid colour **or** a two-colour gradient with an angle. Buttons, banners and dark sections use the "paint" style which automatically follows the choice. Text and borders always use the solid colour (for readability).

## 4. Layout and screens

| Screen | Purpose | Key elements |
|---|---|---|
| **Home** | Convince and start a search | Dark hero with survey-style graphic + search box, live stats strip, categories, featured listings, cities, how it works, "what verified means", broker banner, blog preview |
| **Search** | Find and compare | AI chips, filter sidebar, grid/list/map toggle, sort, compare tray |
| **Property** | Decide and contact | Gallery, fact strip, appraisal, connectivity, price history, document checklist, contact box, enquiry form, similar listings |
| **Post property** | Guided listing | 7 steps with a progress bar, map pin, upload widgets, AI helper |
| **Workspaces** | Do the job | Buyer / seller / broker / admin, each with its own top bar |
| **City / Category** | Google landing pages | Editable headline + intro, listing cards, FAQs |
| **Blog** | Authority and SEO | Article list and article pages |

## 5. Interface patterns

- **Match score badge:** lime, small, shows only when the buyer stated needs.
- **Verified badge:** moss green; appears only when all documents are verified.
- **Masked contact:** `R***** S***** · +91 98***345` with a lock icon; hover/tap explains that sign-in unlocks it.
- **Chips:** removable filter tags; removing a chip removes the filter.
- **Compare tray:** sticky bar at the bottom once 1 to 3 listings are selected; "Compare now" at 2+.
- **Sign-in window:** two columns on desktop (value points on the left, form on the right), single column on phones. Google, mobile OTP, then role cards for first-time users.
- **Checklist animation:** ticks appear one by one when a verification panel opens, to make verification feel like a process.
- **Buttons:** primary = clay fill; secondary = outlined; dark = graphite fill; AI = lime.

## 6. States every screen must handle

| State | Example message / behaviour |
|---|---|
| Loading | Skeleton or "Unlocking…", "Writing…", "Submitting…" on buttons |
| Empty | "No listings match. Try removing a filter." / "No leads yet…" |
| Error | Short plain sentence in clay colour with `role="alert"` |
| Limit reached | "Daily limit of 20 contact unlocks reached. Try again tomorrow." |
| Not signed in | Opens sign-in window (never a blank page) |
| Offline / blocked storage | Site still works; only "saved" and "compare" lose persistence |

## 7. Content style (voice)

- Plain words. "Unlock contact details", not "Initiate stakeholder disclosure".
- Short sentences. Numbers in ₹ Cr / Lakh, areas in acres, Indian digit grouping.
- Never claim what we cannot prove (see [Legal & compliance](19-legal-and-compliance.md)).
- Anything AI-written is labelled with the lime **AI** tag.

## 8. Responsive behaviour

| Width | Behaviour |
|---|---|
| ≥ 1024px | Multi-column grids, sticky sidebars, split-screen sign-in |
| 640 to 1023px | Two-column grids, collapsible filters |
| < 640px | Single column, full-width buttons, filters in a drawer, no 3D hero |

The 3D hero background loads only on desktop-size screens and never when the visitor prefers reduced motion (better speed and battery).

## 9. Accessibility

- All buttons/links reachable by keyboard; visible focus.
- Images have alt text where they carry meaning; decorative art is hidden from screen readers.
- Colour is never the only signal (badges also carry text).
- Errors use `role="alert"`; dialogs use `aria-modal`.
- **Watch-out:** because colours are editable, a badly chosen theme can hurt contrast. Rule of thumb: text vs background contrast ratio ≥ 4.5:1. The admin screens use fixed neutral colours so a bad theme can never lock the owner out.

## 10. Design tokens (how the theme editor works, for designers)

The theme is stored as data and turned into CSS variables at request time: `--c-clay` (solid), `--f-clay` (solid or gradient), `--t-font-heading`, `--t-lh-body`, `--t-radius`, and so on. Components reference these variables, so changing the data restyles the whole site instantly without rebuilding. Details: [Architecture](06-system-architecture.md#5-theme-system).

## 11. What is not designed yet

- Dark mode for the marketplace (the palette supports it; not built).
- Print styles for property dossiers.
- Email and WhatsApp notification templates.
- A formal accessibility audit and usability tests with real buyers (recommended before launch).
