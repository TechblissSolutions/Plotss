# 01 · Project Overview

## In one sentence

PLOTSS is a website where a business owner can describe the land they need in plain language, see only listings whose paperwork has been checked, and contact the owner, all without leaving the platform.

## The problem, in everyday words

Buying industrial or commercial land in India today is slow and risky.

- **You cannot tell who to trust.** Land fraud is common (fake owners, disputed titles). Most portals show a green "verified" badge with nothing behind it.
- **Searching is clumsy.** Old portals give you drop-down boxes. A factory owner actually thinks: *"I need 3 acres near Pune with a wide road and power, under ₹5 crore."*
- **The story is scattered.** You find a plot on one site, chase a broker for documents on WhatsApp, hire a lawyer elsewhere, and hope nothing was missed.
- **Sellers get no help.** Listing a plot is a long form with no guidance.

## What PLOTSS does about it

| Pillar | Plain meaning | Status |
|---|---|---|
| **Search in plain language** | Type a sentence; the site turns it into filters (city, size, budget, type). | ✅ Built (rule-based today; smarter with the Grok AI key) |
| **Visible proof of verification** | Each listing shows a checklist: which documents exist, which our team has actually reviewed, and the status of each. The "Verified" badge only appears when *every* document is verified. | ✅ Built |
| **Decision help on the page** | Price-per-acre history, connectivity, nearby industrial clusters, price fairness, side-by-side comparison. | 🟡 Built for demo data; needs real market data per listing |
| **Protected contact details** | Owner phone numbers are hidden until a buyer signs in. Limits stop people harvesting numbers. | ✅ Built |
| **Guided selling** | Step-by-step posting with map pin, document and photo upload, and an AI writing assistant. | ✅ Built |
| **Full control for the site owner** | The super admin can change colours, fonts, page text, SEO details, blog posts and redirects without a developer. | ✅ Built |

## Who uses it

| Person | What they want | Where they work |
|---|---|---|
| **Buyer** (factory owner, logistics firm, developer, investor) | Find suitable, trustworthy land quickly | Marketplace + buyer dashboard |
| **Seller** (individual land owner) | List land without a broker, reach serious buyers | Post flow + seller dashboard |
| **Broker / agent** | Manage many listings, receive leads | Broker dashboard + public profile |
| **Admin** | Approve listings, verify documents and brokers, watch numbers | Admin panel |
| **Super admin** (site owner) | Control look, wording, SEO and content | Admin panel (theme, content, SEO, blog, redirects) |

## What "success" looks like

These are suggested targets. Adjust them once you know your budget and market.

| Goal | Measure | First target (first 6 months) |
|---|---|---|
| Real supply | Live, verified listings | 100 to 300 |
| Real demand | Signed-in buyers who unlock at least one contact | 1,000 |
| Trust | Share of live listings with every document verified | 70%+ |
| Quality | Median time from listing submission to decision | under 3 working days |
| Discovery | Organic (Google) visits per month | grows month on month |
| Business | Leads passed to sellers/brokers | tracked from day one |

## What PLOTSS is *not* (for now)

- It does **not** handle payments, escrow or registration paperwork.
- It does **not** give legal advice or guarantee any title. It shows the status of documents our team reviewed.
- It is a **website first**. A mobile app is a later decision (see [roadmap](15-project-plan-roadmap.md)); the site already works well on phones.

## How the business can earn (options, not decisions)

Free basic listings + paid featured listings; broker subscriptions; paid lead packs; verification-as-a-service fees; advertising by legal/valuation/finance partners. None is built yet: money handling is intentionally out of the first release.

## Where to go next

- What exactly must it do? → [PRD](02-prd.md)
- How do people use it? → [User journeys](03-user-journeys.md)
- How far along are we? → [Plan & roadmap](15-project-plan-roadmap.md)
