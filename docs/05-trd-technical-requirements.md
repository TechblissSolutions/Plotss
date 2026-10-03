# 05 · Technical Requirements Document (TRD)

**Purpose:** the technical counterpart of the [PRD](02-prd.md): technology choices, standards, limits and quality targets. Written so that a mid-technical reader can follow it, with the deeper detail in later documents.

---

## 1. Technology stack

| Layer | Choice | Why (plain English) |
|---|---|---|
| Website framework | **Next.js 16** (App Router) with **React 19** | Builds pages on the server so Google can read them, and still feels app-like in the browser |
| Language | **TypeScript** | Catches many mistakes before the site runs |
| Styling | **Tailwind CSS 4** + CSS variables | Fast to build; variables let the admin change the theme live |
| Database | **PostgreSQL** via **Supabase** | Our data is naturally relational (cities → listings → documents); Postgres is the industry standard |
| Login | **Supabase Auth** (Google, phone OTP, email/password) | Secure sign-in without building our own |
| File storage | **Supabase Storage** | Public bucket for photos, private bucket for documents |
| Access control | **Row Level Security (RLS)** + database triggers | Rules enforced inside the database, not only in app code |
| Maps | **Leaflet + OpenStreetMap** | Free, no API key, good enough for pins and result maps |
| AI | **Groq Cloud** (default `openai/gpt-oss-20b`) or **xAI Grok**, via OpenAI-compatible APIs and plain `fetch` | Uses whichever key the team has; provider is swappable in one file |
| 3D hero | **three.js** (loaded only on large screens) | Distinctive first impression without slowing phones |
| Icons | lucide-react | Consistent icon set |
| Tests | **Vitest** | Fast unit tests |
| Hosting (target) | **Vercel** (site) + Supabase (backend) | Simple deploys; scales automatically |

## 2. Functional-technical requirements

| ID | Requirement |
|---|---|
| TR-1 | Public pages are **server-rendered** with full metadata and structured data |
| TR-2 | Owner contact details are stored in a separate private table and read only by the server after checks |
| TR-3 | Moderation fields (status, verified) are changeable only by admins, enforced by database triggers |
| TR-4 | All admin actions re-check the admin role on the server (not just the layout) |
| TR-5 | Theme, content, SEO and redirects are data, editable at runtime, cached and refreshed on save |
| TR-6 | Uploads: photos JPG/PNG/WebP ≤ 5 MB (max 6); documents PDF/JPG/PNG ≤ 10 MB; users may write only in their own folder |
| TR-7 | Rate limits: 20 contact unlocks/day, 10 enquiries/day, 10 new listings/day, 20 AI searches/min per visitor, 15 AI descriptions/hour per user |
| TR-8 | If the database schema is missing or unreachable, the site falls back to demo data instead of crashing (development safety net) |
| TR-9 | Secrets (service key, AI key) exist only on the server and never reach the browser |
| TR-10 | Launch switches (docs, AI screen, staff verification, brokers, tracking, unlock limit) are stored as data (`site_settings.features`), cached with a tag, and applied on both server and UI |
| TR-11 | Cities are data with an `active` flag; every city-dependent feature reads the active list |
| TR-12 | Journey events are collected by a first-party endpoint, validated and rate-limited, stored server-side, and purged after 13 months |

## 3. Non-functional targets

| Quality | Target | How verified |
|---|---|---|
| Performance | Largest content paint < 2.5 s; total JS for public pages kept modest; images lazy-loaded | Lighthouse (to run before launch) |
| SEO | Lighthouse SEO ≥ 95; valid structured data | Google Rich Results test |
| Security | No known critical issues; RLS on all tables; headers set | [Security doc](08-security-and-privacy.md), penetration test recommended |
| Reliability | Graceful fallbacks; no unhandled crashes on empty data | Manual + automated tests |
| Maintainability | Strict TypeScript; lint clean; migrations versioned; docs current | CI (recommended) |
| Compatibility | Latest 2 versions of major browsers; iOS Safari 16+ | Manual matrix |
| Accessibility | WCAG 2.1 AA (target) | Audit (planned) |

## 4. Constraints

- **No payment data** is handled in release 1 (keeps compliance scope small).
- **Single-region database** (Supabase project region chosen at creation; choose Mumbai/Singapore for Indian users).
- **In-memory rate limiter** works per server instance; replace with Redis/Upstash when running several instances.
- **Search runs in the browser** over the listings the server sends; fine for hundreds, needs server-side search for thousands.
- **Free/entry plans** of Supabase and Vercel have limits (database size, bandwidth, SMS costs for OTP). See [Plan & roadmap](15-project-plan-roadmap.md#5-cost-drivers).

## 5. Environment configuration

| Variable | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | Project address |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | browser + server | Public (anon-level) key; safe to expose because RLS protects data |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | Bypasses RLS for trusted operations (reveal contact, admin). **Never expose.** |
| `GROQ_API_KEY`, `GROQ_MODEL` **or** `XAI_API_KEY`, `XAI_MODEL` | **server only** | AI access (optional; Groq is used first if both are set) |
| `NEXT_PUBLIC_SITE_URL` | both | Canonical site address for SEO |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | browser | Enables the exit-intent WhatsApp prompt (optional) |

The template is `.env.example`. The real `.env` file is never committed.

## 6. Coding standards

- Strict TypeScript; no unused variables; ESLint must pass (`npm run lint`).
- Server-only code is marked (`import "server-only"`) so it cannot be bundled into the browser.
- User input is validated on the server (length, type, allowed values) even if the form already checked it.
- Database changes only through numbered SQL files in `supabase/migrations/`.
- Editable text in the UI is wrapped in `<T k="key">default</T>` so it appears in the Content editor automatically.

## 7. Third-party services

| Service | Role | Cost driver | If it fails |
|---|---|---|---|
| Supabase | Database, login, files | Database size, storage, monthly active users, SMS | Site falls back to demo data in dev; in production show maintenance page |
| SMS provider (e.g., Twilio) | OTP delivery | Per SMS | Users can still use Google sign-in |
| Google OAuth | Google sign-in | Free | Phone/email sign-in remain |
| xAI Grok | AI search + descriptions | Per token | Rules-based search and template descriptions take over |
| OpenStreetMap tiles | Map background | Free within fair-use | Map area is blank; pins still recorded |
| Google Fonts | Fonts | Free | System fonts used |

## 8. Known technical debt (honest list)

1. Ported prototype screens (`src/ui`) are large files; they should be split into smaller components over time.
2. Some screen labels (search filters, property-page headings) are not yet editable in the Content editor.
3. Demo/mock data still lives in code as a fallback and seed source.
4. No continuous-integration pipeline or staging environment yet.
5. Performance and accessibility audits are pending.
