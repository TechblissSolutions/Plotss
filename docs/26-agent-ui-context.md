# 26. Agent UI Context

**Audience: AI coding agents.** Expands on [04 UX/UI design](04-ux-ui-design.md) with exact tokens and conventions.

## Theme

Light only, warm-editorial, now deliberately rounded/soft (changed 2026-09, see [29 Progress tracker](29-agent-progress-tracker.md)) — not a cold/minimal SaaS look. Every token is admin-editable from `/admin/theme` and persisted in `site_settings.theme`; code only supplies the **defaults** (`src/lib/theme/defaults.ts`) and the **fallback first-paint CSS** (`src/app/globals.css`'s `:root` block) — if you change a default, mirror it in both places or the first paint will flash the old value.

| Role | CSS variable | Current default |
|---|---|---|
| Ink / text / dark fills | `--c-graphite` / `--f-graphite` | `#16181B` |
| Brand accent (terracotta) | `--c-clay` / `--f-clay` | `#B5502C` |
| Page background | `--c-ivory` / `--f-ivory` | `#F7F4EF` |
| High-signal accent (AI, live indicators) | `--c-signal` / `--f-signal` | `#C8FF4D` |
| Secondary text | `--c-stone` / `--f-stone` | `#6B6560` |
| Success / verified | `--c-moss` / `--f-moss` | `#3D5A40` |
| Hairline borders | `--c-line` / `--f-line` | `#DDD8CF` |

Derived Tailwind colors (`color-mix` in `globals.css`): `mist`, `sand`, `ink-2/3/4`, `clay-dark` — use these instead of manually mixing colors.

**Never hardcode a hex value or use a raw Tailwind color (`bg-slate-500`, `text-red-600`, etc.) in `src/ui/` or `src/app/(site)/`, `src/app/(app)/` components.** The one sanctioned exception is `src/app/admin/**` — the admin panel intentionally uses a fixed slate/blue/emerald palette (see `src/app/admin/ui.tsx`'s comment: "Fixed colours on purpose, never themed") because it must stay legible and stable regardless of what a tenant/admin sets the public theme to.

## Typography

- Headings: `--t-font-heading`, default **Fraunces** (serif, editorial). Use the `.font-serif-headline` class or `h1`-`h6` elements.
- Body: `--t-font-body`, default **Inter**.
- Tabular/numeric data (prices, stats, counters): `--t-font-data` / `.font-tabular` class, default **Inter Tight** with `font-variant-numeric: tabular-nums`.
- Font options a super admin can pick from are curated in `FONT_OPTIONS` (`src/lib/theme/defaults.ts`) — don't add a font outside that list without updating it there (it drives the Google Fonts URL builder).

## Border radius and shadow

Driven by `ui.radius` and `ui.shadow` in the theme, mapped through `@theme inline` so **Tailwind's own `rounded-sm`/`rounded-md`/`rounded-lg` utilities already resolve to the theme tokens** — do not hand-pick radius values, just use those three utility classes and the theme controls the actual pixel size sitewide.

| Tailwind class | Resolves to | Current default |
|---|---|---|
| `rounded-sm` | `--t-radius-sm` (`radius * 0.6`) | 8px |
| `rounded-md` | `--t-radius` | 14px |
| `rounded-lg` | `--t-radius-lg` (`radius * 1.6`) | 22px |

`shadow-card` utility maps to `--t-shadow` (currently a soft drop shadow) — prefer it for card-style containers going forward. Tailwind's native `shadow-xs`/`shadow-sm`/`shadow-md` are also used throughout the existing codebase and are fine to keep using for now, but are **not** theme-reactive (a future task: migrate these to `shadow-card` as part of the broader rounded/soft pass — not yet done, see [29 Progress tracker](29-agent-progress-tracker.md)).

## Component library

No shadcn/ui, no generic design system. Hand-built Tailwind + a small set of custom `@utility` classes in `globals.css`:
- `paint-graphite` / `paint-clay` / `paint-ivory` / `paint-signal` / `paint-stone` / `paint-moss` — background fills that respect gradient-mode theme colors (not plain `bg-*`).
- `hairline` — `border: var(--t-border) solid var(--c-line)`.
- `container-site` — the page-width wrapper (`max-width: var(--t-container)`, currently 1240px).
- `section-y` — vertical rhythm (`padding-block: var(--t-section-y)`, currently 96px).
- `.ai-tag` — the small pill marking AI-generated content; every AI-touched surface must carry it (see [11 AI features](11-ai-features.md)).

Admin panel has its own shared primitives in `src/app/admin/ui.tsx` (`PageHeader`, `Card`, `Stat`, `Badge`, `btn`, `Notice`, `EmptyState`) — reuse these for any new admin screen rather than hand-rolling new markup.

## Icons

`lucide-react`, stroke-based only.

## Layout patterns

- Public site: `Header` (sticky) + page content + `Footer`, wrapped in `ContentProvider` (admin-editable text, see `src/ui/content.tsx`) and `AppProvider`/`AppShell` (session, saved IDs, compare tray — part of the "old" system, see [25 Architecture](25-agent-architecture.md)'s known debt).
- Signed-in dashboards (`/dashboard/*`): `Shell` wrapper (`src/ui/dashboards/Shell.tsx`), plain content below, no sidebar.
- Admin panel (`/admin/*`): persistent dark sidebar (`AdminNav`) with grouped sections, mobile slide-in (`MobileNav`), a `CurrentSection` label, always behind `requireAdmin()`.
- Auth (`/login`, `/register`, and the popup `AuthModal`): single card, segmented Login/Register tab toggle at the top (added 2026-09, see [29 Progress tracker](29-agent-progress-tracker.md)), Google button, OTP-by-mobile as the primary passwordless path, email+password always visible below (not hidden in an accordion — that was a deliberate UX fix, don't reintroduce a `<details>` toggle there).

## Editable text

Any new user-facing copy added to `src/ui/**/*.tsx` **or** `src/app/**/*.tsx` should be wrapped in `<T k="namespace.key">Default text</T>` (see `src/ui/content.tsx`) so the super admin can edit it from `/admin/content` without a deploy. After adding new `<T>` usages, run `node scripts/gen-content-registry.mjs` (or `npm run content:registry`) to refresh `src/lib/content/registry.json` — it scans both `src/ui` and `src/app`, so new keys under either tree are picked up automatically.
