# 16 · Risk Register & Decision Log

## Part A: Risk register

**Scale:** Likelihood and Impact are Low / Medium / High. "Score" is a rough priority.

| # | Risk | Likelihood | Impact | Score | What we do about it | Owner |
|---|---|---|---|---|---|---|
| R1 | "Verified" claim is challenged (a verified listing turns out fraudulent) | Medium | **High** | **High** | Define exactly what is checked; require reference numbers; keep evidence; clear disclaimer; insurance/legal review; never auto-verify | Owner |
| R2 | Not enough real listings at launch (empty marketplace) | High | High | **High** | Onboard brokers first; seed with 30+ real listings; launch city by city | Ops |
| R3 | Operations cannot keep up with verification | Medium | High | **High** | Clear SLA; admin queue; hire/partner; auto-reminders (roadmap) | Ops |
| R4 | Scraping/harvesting of contact numbers | Medium | High | **High** | Private table, sign-in, daily limits, CAPTCHA, monitor unlock spikes | Tech |
| R5 | Legal exposure: misleading claims, missing terms/privacy, RERA advertising rules, intermediary liability | Medium | High | **High** | Lawyer review ([doc 19](19-legal-and-compliance.md)); hidden-by-default risky claims; grievance officer | Owner |
| R6 | Data breach or key leak | Low | **High** | Medium | Server-only secrets, rotate if shared, RLS, backups, incident playbook | Tech |
| R7 | OTP/SMS cost abuse | Medium | Medium | Medium | CAPTCHA, rate limits, monitoring | Tech |
| R8 | AI gives wrong or costly output | Medium | Low/Med | Medium | Validation, fallbacks, rate limits, labels, budget cap | Tech |
| R9 | Vendor lock-in or outage (Supabase, Vercel, xAI) | Low | Medium | Low | Standard Postgres (portable); AI behind one adapter; backups | Tech |
| R10 | Poor SEO/slow site → no traffic | Medium | High | **High** | SEO manager, content plan, performance pass, Search Console | Content |
| R11 | Admin misconfigures theme (unreadable site) | Low | Medium | Low | Admin screens use fixed colours; "Reset to defaults"; contrast guidance | Owner |
| R12 | Scale: browser-side search slows with many listings | Medium (later) | Medium | Medium | Server-side search and pagination in release 1.1 | Tech |
| R13 | Single point of knowledge (one builder) | Medium | Medium | Medium | This documentation; code review; second developer | Owner |
| R14 | Demo/AI-generated images or fake demo data left live | Medium | High | **High** | Launch checklist item; delete demo rows by tag | Ops |
| R15 | Competitors copy the idea | Medium | Medium | Medium | Speed of execution, data and verification quality, brand | Owner |

## Part B: Decision log (why we chose what we chose)

Each entry: **Context → Decision → Alternatives considered → Consequences.**

### D1. Supabase (PostgreSQL) only; not Firebase
- **Context:** Data is relational (cities → listings → documents → enquiries) and needs role-based access.
- **Decision:** Supabase (Postgres + Auth + Storage + RLS).
- **Alternatives:** Firebase (NoSQL, weaker for joins/reporting); custom backend (more work).
- **Consequences:** Security rules live in SQL (powerful, needs care); easy reporting; portable to any Postgres.

### D2. Next.js with server rendering
- **Context:** SEO is a core acquisition channel.
- **Decision:** Next.js App Router; pages rendered on the server.
- **Alternatives:** Single-page app (bad for SEO); WordPress (fast for content, weak for custom marketplace logic).
- **Consequences:** Good SEO and speed; team needs Next.js/React skills.

### D3. Enforce trust rules inside the database
- **Context:** A bug in app code must not let someone self-verify or read private data.
- **Decision:** RLS + triggers; private tables for contacts; service key only on the server.
- **Alternatives:** App-only checks (simpler, riskier).
- **Consequences:** Migration must be applied for the rules to exist; small learning curve.

### D4. Theme, content and SEO as editable data
- **Context:** Owner wants WordPress-like control without developers.
- **Decision:** Store settings as JSON/rows; render via CSS variables and `<T>` components; cache with tags.
- **Alternatives:** Hard-code and redeploy for every change; adopt a headless CMS (extra cost/complexity).
- **Consequences:** Instant changes; editable scope grows over time (currently Home, Header, Footer, Post title).

### D5. Prototype-first design (Google AI Studio), then port
- **Context:** Needed to see the design quickly.
- **Decision:** Compare two AI-Studio prototypes; port the better one into the real app, mapping colours to theme tokens.
- **Alternatives:** Design in Figma first; build from scratch.
- **Consequences:** Fast; ported screens are large and need refactoring; prototype text contained claims that had to be removed.

### D6. Free map stack (Leaflet + OpenStreetMap)
- **Context:** Need maps without cost or API keys.
- **Decision:** Leaflet with OSM tiles.
- **Alternatives:** Google Maps (better look, needs billing).
- **Consequences:** Free; upgrade path exists if branding or traffic demands it.

### D7. AI vendor: Groq / xAI Grok (was Claude)
- **Context:** The team has no Anthropic key; it has a Groq key (and may also use xAI Grok).
- **Decision:** One small adapter (`llm.ts`) using the OpenAI-compatible API.
- **Alternatives:** Anthropic, OpenAI, Gemini.
- **Consequences:** Swappable in one file; the chosen provider is picked by which key is set (Groq first); model names come from the account (`GROQ_MODEL` / `XAI_MODEL`).

### D8. Login: Google + mobile OTP (no passwords for the public)
- **Context:** Reduce sign-up friction; get verified phone numbers.
- **Decision:** Google and OTP for public users; email/password for admins only.
- **Alternatives:** Password + captcha registration (more friction).
- **Consequences:** SMS cost and abuse risk (mitigate with CAPTCHA); Google users have no phone, so sellers must provide one at submit.

### D9. Contact unlock limits and lead capture
- **Context:** Contacts are the product's value and its biggest abuse target.
- **Decision:** 20 unlocks/day; every unlock is a recorded lead.
- **Consequences:** Protects owners; buyers may hit the cap (tunable in `UNLOCK_LIMIT_PER_DAY`).

### D10. Seller form before login
- **Context:** Long sign-ups lose sellers.
- **Decision:** Fill the form first; OTP at submit.
- **Consequences:** Higher completion; must handle "already signed in as buyer" (shown as a clear message).

### D11. Demo fallback mode
- **Context:** Development should not stop when the database is unavailable.
- **Decision:** If the v2 schema is missing, run on demo data (contacts still masked).
- **Consequences:** Convenient; must never be relied on in production (checklist item).

### D12. Hide risky claims by default
- **Context:** Prototype included testimonials, regulatory badges and technical claims that were not real.
- **Decision:** Testimonials and RERA badges hidden until the owner enables them; statistics computed.
- **Consequences:** Site looks a little plainer until real proof exists: intentionally.
