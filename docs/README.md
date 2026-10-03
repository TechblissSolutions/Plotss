# PLOTSS Documentation Pack

**Version 1.1 · 21 September 2026 · Status: build complete for launch-readiness review (Delhi-NCR launch: Ghaziabad → Noida → New Delhi)**

PLOTSS is an online marketplace where people in India can find, compare, buy, lease and sell industrial, commercial and residential land. This folder explains the product from every angle: what it is, why it exists, how it looks, how it works inside, how it is kept safe, and how to run it.

Every document is written in plain English. Where a technical word is unavoidable it is explained the first time it appears, and there is a [glossary](18-glossary.md) at the end.

---

## Who should read what

| You are… | Start here | Then read |
|---|---|---|
| **Owner / investor / business person** | [01 Project overview](01-project-overview.md) | [22 Launch decisions](22-launch-decisions-ncr-verification-brokers.md), [21 Analytics](21-analytics-and-user-journey-tracking.md), [02 PRD](02-prd.md), [15 Plan & roadmap](15-project-plan-roadmap.md), [16 Risks & decisions](16-risks-and-decisions.md), [20 Launch checklist](20-launch-checklist.md) |
| **Product / operations / content team** | [03 User journeys](03-user-journeys.md) | [17 Admin manual](17-admin-manual.md), [10 SEO guide](10-seo-and-content.md), [19 Legal & compliance](19-legal-and-compliance.md) |
| **Designer** | [04 UX/UI design](04-ux-ui-design.md) | [03 User journeys](03-user-journeys.md), [17 Admin manual](17-admin-manual.md) (theme editor) |
| **Developer (new to the project)** | [05 TRD](05-trd-technical-requirements.md) | [06 Architecture](06-system-architecture.md), [07 Database](07-database-and-data-dictionary.md), [09 API](09-api-and-server-actions.md), [13 Deployment](13-deployment-and-operations.md) |
| **Security / QA** | [08 Security & privacy](08-security-and-privacy.md) | [12 Testing & QA](12-testing-and-qa.md), [11 AI features](11-ai-features.md) |
| **Project manager** | [14 How we built it (process)](14-development-process.md) | [15 Plan & roadmap](15-project-plan-roadmap.md), [16 Risks & decisions](16-risks-and-decisions.md) |

---

## Document map

| # | Document | What it answers |
|---|---|---|
| 01 | [Project overview](01-project-overview.md) | What is PLOTSS, who is it for, why does it matter? |
| 02 | [Product Requirements (PRD)](02-prd.md) | What must the product do? What is built, half-built, or planned? |
| 03 | [User journeys](03-user-journeys.md) | What does each person (buyer, seller, broker, admin) do, step by step? |
| 04 | [UX / UI design](04-ux-ui-design.md) | How should it look and feel? What are the design rules? |
| 05 | [Technical Requirements (TRD)](05-trd-technical-requirements.md) | What technology, limits and quality targets apply? |
| 06 | [System architecture](06-system-architecture.md) | How do the pieces fit together? |
| 07 | [Database & data dictionary](07-database-and-data-dictionary.md) | What information is stored, and where? |
| 08 | [Security & privacy](08-security-and-privacy.md) | What can go wrong, and what protects us? |
| 09 | [API & server actions](09-api-and-server-actions.md) | What can the browser ask the server to do? |
| 10 | [SEO & content](10-seo-and-content.md) | How do we get found on Google and by AI answer engines? |
| 11 | [AI features](11-ai-features.md) | Where is AI used, what are its limits and safeguards? |
| 12 | [Testing & QA](12-testing-and-qa.md) | How do we know it works? |
| 13 | [Deployment & operations](13-deployment-and-operations.md) | How do we put it online and keep it running? |
| 14 | [Development process](14-development-process.md) | Which working method did we follow (Agile / Waterfall / other)? |
| 15 | [Project plan & roadmap](15-project-plan-roadmap.md) | What is done, what is next, who does what? |
| 16 | [Risks & decision log](16-risks-and-decisions.md) | What could hurt us, and why did we choose each technology? |
| 17 | [Admin manual](17-admin-manual.md) | How does the super admin run the site day to day? |
| 18 | [Glossary](18-glossary.md) | What does this word mean? |
| 19 | [Legal & compliance](19-legal-and-compliance.md) | What claims, policies and laws need attention before launch? |
| 20 | [Launch checklist](20-launch-checklist.md) | What must be true on go-live day? |
| 21 | [Analytics & user-journey tracking](21-analytics-and-user-journey-tracking.md) | Which page, which button, where do people leave, and how far can we track? |
| 22 | [Launch decisions](22-launch-decisions-ncr-verification-brokers.md) | Why phased verification, why these cities, why brokers are off |
| 23 | [Dashboards, near-me search and admin UX](23-dashboards-search-and-admin-ux.md) | What each role sees after login, the seller and buyer dashboards, distance search, admin accessibility |

### For AI coding agents (24-29)

Shorter, more opinionated, spec-driven companions to 01-23 — read these first in a new session, in order. `AGENTS.md` at the repo root points here.

| # | Document | What it answers |
|---|---|---|
| 24 | [Agent project overview](24-agent-project-overview.md) | What PLOTSS is, the four roles, what's in/out of scope |
| 25 | [Agent architecture context](25-agent-architecture.md) | Stack, boundaries, the authorization rule, known architecture debt |
| 26 | [Agent UI context](26-agent-ui-context.md) | Theme tokens, components, conventions |
| 27 | [Agent code standards](27-agent-code-standards.md) | Concrete implementation rules |
| 28 | [Agent workflow rules](28-agent-workflow-rules.md) | How to scope and sequence work safely |
| 29 | [Agent progress tracker](29-agent-progress-tracker.md) | Current phase, completed/in-progress/next, open questions — update every session |

---

## Honesty notes (read these)

1. **What is built vs planned.** Every feature in the PRD carries a status: ✅ built, 🟡 partly built, 🔲 planned. Nothing is marked built unless it exists in the code.
2. **Demo data.** The site ships with 10 demo listings (written for Ghaziabad, Noida and New Delhi) and 3 sample articles so it looks alive. They are tagged as demo and must be replaced or removed before launch (see the [launch checklist](20-launch-checklist.md)).
3. **Legal text.** [Document 19](19-legal-and-compliance.md) is a checklist of things to review with a lawyer. It is not legal advice.
4. **What was verified.** Automated tests (13), type-checking, linting and a production build pass. The full login → unlock → approve flow against the live database still needs to be run once the database migration is applied. This is stated again in [Testing & QA](12-testing-and-qa.md).

---

## Repository layout (one-minute tour)

```
docs/            ← you are here
src/app/         ← the pages and server actions of the website
src/ui/          ← the marketplace screens (home, search, property page, post-property…)
src/lib/         ← business logic: database access, SEO, AI, security helpers
supabase/        ← database migrations (SQL you run once in Supabase)
scripts/         ← one-off helper scripts (seeding demo data, generating content lists)
tests/           ← automated tests
public/          ← images and static files
```
