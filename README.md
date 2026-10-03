# PLOTSS

India's AI-verified marketplace for industrial, commercial and residential land.
Search in plain language, see exactly which documents were reviewed, unlock the owner's contact after sign-in.

**Full documentation (plain English): [`docs/`](docs/README.md)**: product, design, technical, security, SEO, AI, testing, operations, process, roadmap, admin manual, legal checklist, launch checklist.

## Quick start

```bash
npm install
cp .env.example .env      # fill in the values (see docs/13-deployment-and-operations.md)
npm run dev               # http://localhost:3000
```

Without Supabase keys the site runs on demo data so you can explore it.

## One-time database setup

In the Supabase SQL Editor run, in order:

1. `supabase/migrations/0001_init.sql`
2. `supabase/migrations/0002_listings_cms_seo.sql`

Then (optional demo content): `npx tsx --env-file=.env scripts/seed-db.ts`

## Checks

```bash
npm run lint && npx tsc --noEmit && npm test && npm run build
```

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind 4 · Supabase (Postgres, Auth, Storage, RLS) · Leaflet/OpenStreetMap · xAI Grok (optional) · Vitest.

## Where things are

| Folder | Contents |
|---|---|
| `src/app` | Pages, admin, workspaces, server actions |
| `src/ui` | Marketplace screens and components |
| `src/lib` | Database access, SEO, AI, security helpers |
| `supabase/migrations` | SQL migrations |
| `scripts` | Seeding and helper scripts |
| `docs` | Documentation pack |

## Secrets

Never commit `.env`. The `SUPABASE_SERVICE_ROLE_KEY` and `XAI_API_KEY` are server-only.
