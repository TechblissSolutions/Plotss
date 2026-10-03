# 15 · Project Plan & Roadmap

## 1. Where we are (21 September 2026)

| Area | Status |
|---|---|
| Product definition (PRD, journeys, brand) | ✅ Done |
| Design (prototype chosen and ported) | ✅ Done; usability testing pending |
| Core marketplace (search, property page, contact gating, comparison, map) | ✅ Built |
| Accounts (Google, OTP, email) and roles | ✅ Built; needs live-database run-through |
| Selling flow with uploads and map pin | ✅ Built; needs live-database run-through |
| Dashboards (buyer, seller, broker) | ✅ Built (real data once DB is migrated) |
| Admin (approval, users/brokers, analytics) | ✅ Built |
| Super-admin control (theme, content, SEO, blog, redirects) | ✅ Built |
| Security hardening | ✅ Code done; database part activates with migration 0002 |
| AI (search + description) | ✅ Built; provider = Grok; add key |
| Documentation | ✅ This pack |
| **Launch readiness** | 🟡 Blocked on: apply migration, real content, legal pages, performance/accessibility checks |

## 2. Roadmap

### Release 1.0: "Launch-ready" (next 2 to 4 weeks)

| # | Work item | Owner | Effort |
|---|---|---|---|
| 1 | Apply migration 0002; run the full manual test script ([QA](12-testing-and-qa.md)) | Developer | 0.5 day |
| 2 | Add Grok key; tune prompts with 20 real queries | Developer | 0.5 day |
| 3 | Replace demo listings, brokers and AI-generated images with real ones | Operations | ongoing |
| 4 | Legal pages: Terms, Privacy, Disclaimer, Grievance contact (with a lawyer) | Owner | 1 week |
| 5 | Decide and write the exact "Verified" promise; align site copy | Owner | 1 day |
| 6 | Turn on CAPTCHA for OTP; admin 2-factor | Developer | 0.5 day |
| 7 | Performance pass (Lighthouse ≥ 90 mobile), image optimisation | Developer | 2 days |
| 8 | Accessibility pass (keyboard, contrast, labels) | Developer + designer | 2 days |
| 9 | Staging environment + CI pipeline | Developer | 1 day |
| 10 | Analytics + Search Console + uptime monitor + error tracking | Developer | 1 day |
| 11 | Usability test with 5 real buyers and 3 sellers | Product | 1 week |
| 12 | Soft launch in 1 to 2 cities | Owner | — |

### Rollout by city (decided 21 Sep 2026)

1. **Ghaziabad** first: onboard 15 to 30 owners; measure approval time and unlock funnel.
2. **Noida** when Ghaziabad has about 15 live listings.
3. **New Delhi** after Noida is running smoothly (Delhi land rules need extra care in content).

### Verification phases

Phase 1 (launch): AI risk screen only. Phase 2: collect documents. Phase 3: staff verification with a review team. See [Launch decisions](22-launch-decisions-ncr-verification-brokers.md).

### Release 1.1: "Grow" (month 2 to 3)

- Server-side search and pagination; database indexes on filters
- Account-level saved listings and saved-search email alerts
- Notifications to sellers/brokers when a lead arrives (email + WhatsApp)
- Admin audit log; bulk actions in the approval queue
- More editable content (search filters, property page labels, dashboards)
- Content plan: 2 articles per week; city pages for all launch cities
- Broker bulk upload (spreadsheet) and enabling broker features once a team is confirmed
- Move analytics aggregation into database views; alerts on funnel drops; session replay via a consent-gated tool

### Release 2.0: "Transact" (month 4 to 8)

- On-platform chat and WhatsApp concierge (AI-assisted)
- Site-visit scheduling with calendar sync
- Automatic price-fairness and area-insight from real comparables
- Paid features: featured listings, broker plans, lead packs (payments + invoices + GST)
- Document e-verification partners (title search, encumbrance, e-registration hooks)
- Hindi and one regional language

### Release 3.0: "Platform"

- Mobile apps (or a PWA first)
- Partner APIs (banks, valuers, lawyers)
- Data products: corridor price index, reports

## 3. Milestones

| Milestone | Definition | Target |
|---|---|---|
| M1 Database live | Migration applied, admin can sign in, demo seeded | Week 1 |
| M2 Content ready | ≥ 30 real listings, 10 articles, all city/category copy | Week 3 |
| M3 Compliance ready | Legal pages published; claims reviewed | Week 3 |
| M4 Quality gate | Lighthouse ≥ 90, accessibility pass, security checklist done | Week 4 |
| M5 Soft launch | Invite-only or one city | Week 5 |
| M6 Public launch | All target cities, marketing on | Week 8 |

## 4. RACI (who is Responsible, Accountable, Consulted, Informed)

| Activity | Owner | Tech lead | Designer | Ops/Review | Lawyer |
|---|---|---|---|---|---|
| Product priorities | **A/R** | C | C | C | I |
| Build & release | I | **A/R** | C | I | I |
| Design & brand | A | C | **R** | I | I |
| Listing verification | A | I | I | **R** | C |
| Legal pages & claims | **A** | I | I | C | **R** |
| Security & backups | A | **R** | I | I | C |
| SEO & content | A | C | C | **R** | I |

## 5. Cost drivers

| Item | Notes |
|---|---|
| Hosting (Vercel) | Free/hobby is not for commercial use; budget a Pro plan |
| Supabase | Paid plan for backups, larger database, more storage and users |
| SMS (OTP) | Per message; abuse can be expensive, so add CAPTCHA and limits |
| AI (Grok) | Per token; low at first; monitor |
| Domain, email | Small yearly cost |
| Monitoring/error tracking | Often free tiers first |
| Legal, accounting, GST | Professional fees |
| **Operations team** | The biggest ongoing cost: people who verify documents |
| Content and marketing | Articles, photography, ads |

## 6. Dependencies and critical path

Migration applied → real content loaded → legal pages ready → quality gate → launch. The **verification team and process** must exist *before* the "Verified" promise goes public.

## 7. Backlog (unscheduled ideas)

WhatsApp/email alerts · CSV export for leads · lead scoring · review/ratings of brokers · listing expiry and renewal reminders · duplicate listing detection · fraud signals (same phone across many owners) · virtual site tours · loan/EMI calculator · stamp-duty calculator · admin roles (reviewer vs super admin) · public API.
