# 14 · Development Process: Which Working Method Did We Use?

**Short answer:** a **hybrid**: a written plan up front (Waterfall-style discovery), then **prototype-first, iterative and incremental delivery in short feedback loops** (Agile-style). We did **not** run formal Scrum ceremonies. This document explains the options in plain language, what we actually did, and what we recommend from here.

---

## 1. The common methods, explained simply

| Method | Idea (everyday example) | Good when | Weak when |
|---|---|---|---|
| **Waterfall** | Build a house: full blueprint, then foundations, walls, roof: one stage at a time, no going back | Requirements are fixed and well understood (e.g., regulated systems) | Needs change often; you only see the result at the end |
| **Agile** | Cook a meal course by course; taste and adjust after each dish | Requirements are uncertain and feedback is available | Without discipline it can drift with no plan |
| **Scrum** (a kind of Agile) | Fixed 1 to 4-week "sprints" with a planning meeting, daily check-in, demo, and retrospective | Team of 3+ with a product owner | Heavy for a solo builder |
| **Kanban** (a kind of Agile) | A board with To do → Doing → Done; limit work in progress; continuous flow | Support/maintenance and small teams | No time-boxes to force decisions |
| **Iterative / Incremental** | Build a small usable version, then improve it in rounds | Most product work | Needs a clear vision to avoid endless tweaking |
| **Prototyping** | Make a quick mock-up to test the idea before investing | Design uncertainty is high | A prototype can be mistaken for the real thing |
| **DevOps / CI-CD** | Automate testing and deployment so releases are small and safe | Anything that changes often | Needs setup effort |

## 2. What we actually did (honest timeline)

| Phase | Approach | What happened |
|---|---|---|
| **0. Discovery** *(Waterfall-like)* | Write first, build later | Competitor study, problem statement, personas, feature list, brand system, database plan, journeys, build order (the original PRD/TRD brief) |
| **1. Design prototype** *(Prototyping)* | Throw-away visuals | Full multi-screen prototype produced in Google AI Studio (two variants), compared against reference sites; the better one chosen |
| **2. Foundation** *(Iterative)* | Small vertical slice first | Next.js project, Supabase schema and security, **super-admin theme editor** (colour/gradient/fonts/spacing) |
| **3. Full build** *(Incremental)* | Add one capability per round | Homepage, search with AI chips, property page, contact gating, login, posting flow, dashboards, admin approval, blog/SEO basics |
| **4. Design port** *(Iterative)* | Adopt the prototype's look into the real app | Ported screens, mapped hard-coded colours to theme tokens so the theme editor still controls everything |
| **5. Hardening** *(Audit → fix)* | Review for loopholes, then fix | Security review; database triggers; private contacts; rate limits; honest claims; CMS/SEO manager; separate workspaces |
| **6. Completion & documentation** | Close gaps, write the pack | Real uploads, map pin, AI search/description via Grok, login fixes, tests, this document set |

**Feedback loop used in every round:** owner request → build → run it → check (build, tests, browser screenshots) → report what works and what does not → next request.

## 3. What was *not* done (so you can decide)

- No fixed-length sprints, sprint planning or retrospectives.
- No separate QA team; no user testing with real buyers yet.
- No staging environment, no automated CI pipeline, no code review by a second person.
- No formal backlog tool (Jira/Linear/Trello).

For a first release built quickly by a very small team, this was a reasonable trade-off. For a live product handling other people's data and money, it is time to add the lightweight structure below.

## 4. Recommended process from here: "Scrum-lite + Kanban + CI/CD"

### Roles

| Role | Person | Job |
|---|---|---|
| Product owner | Business owner | Decides priorities and what "done" means |
| Tech lead | Lead developer | Architecture, code review, releases |
| Developers | 1 to 3 | Build and test |
| Designer / content | 1 | UI, copy, SEO articles |
| Operations / reviewer | 1 to 2 | Listing and document verification |

### Rhythm (2-week cycle)

| When | Meeting | Length | Output |
|---|---|---|---|
| Day 1 | Planning | 1 hr | Chosen backlog items, each with clear acceptance criteria |
| Daily | Stand-up (async chat is fine) | 10 min | What I did, what I will do, what blocks me |
| Mid-cycle | Backlog grooming | 30 min | Next items understood and sized |
| Last day | Demo + review | 45 min | Working software shown to the owner |
| Last day | Retrospective | 30 min | 1 to 3 improvements to try |

### Board columns (Kanban)

`Backlog → Ready → In progress → In review → In test (staging) → Done (production)`

Limit "In progress" to 2 items per person.

### Definition of Ready (before work starts)

Clear goal, acceptance criteria, design (if UI), security impact noted, sized (S/M/L).

### Definition of Done (before it counts as finished)

Code reviewed · lint, type-check, tests and build pass · tested on phone width · security considered · docs updated · deployed to staging and checked · released.

### Branching and releases

- `main` = production. Work in short-lived feature branches; open a pull request; at least one review.
- Merge → automatic preview → staging → production release (weekly, or as needed).
- Version the docs with the code; tag releases (`v1.0.0`).

### Automation (CI/CD) to add

1. On every pull request: run `lint`, `tsc`, `test`, `build`.
2. Dependency vulnerability scan.
3. Preview deployment for each branch.
4. Optional: Playwright tests for the critical flows.

### Change control for sensitive areas

Database migrations, security rules, verification wording and legal claims need the product owner's sign-off plus a second reviewer.

## 5. Governance: how decisions get made

| Decision type | Who decides | Recorded where |
|---|---|---|
| Product scope and priority | Product owner | Backlog + [PRD](02-prd.md) |
| Technology choice | Tech lead (consult owner on cost) | [Decision log](16-risks-and-decisions.md) |
| Legal/verification claims | Owner with a lawyer | [Legal & compliance](19-legal-and-compliance.md) |
| Security exceptions | Tech lead + owner | [Security doc](08-security-and-privacy.md) |

## 6. Metrics to track the process itself

Lead time (idea → live), deployment frequency, change failure rate (how many releases needed a fix), time to fix critical bugs, and backlog age. Review them monthly.
