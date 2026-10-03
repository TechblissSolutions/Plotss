# 13 · Deployment & Operations

How to run PLOTSS on your computer, how to put it online, and how to keep it healthy.

## 1. Environments

| Environment | Purpose | Database | Notes |
|---|---|---|---|
| **Local** | Developers build and test | Your Supabase project (or none: demo data) | `npm run dev` at http://localhost:3000 |
| **Staging** (recommended, not set up yet) | Rehearse releases safely | A **separate** Supabase project | Turn on "Block search engines" |
| **Production** | Real users | Production Supabase project | Real domain, backups on |

Never share one database between staging and production.

## 2. Run locally (developer or curious owner)

1. Install **Node.js 20+** (the project was built with Node 24).
2. In the project folder run `npm install`.
3. Copy `.env.example` to `.env` and fill in the values (see [TRD §5](05-trd-technical-requirements.md#5-environment-configuration)).
4. `npm run dev` → open http://localhost:3000.

Useful commands:

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server (also refreshes the editable-content list) |
| `npm run build` then `npm start` | Production build and run |
| `npm run lint` / `npx tsc --noEmit` / `npm test` | Quality checks |
| `npx tsx --env-file=.env scripts/seed-db.ts` | Add demo listings, brokers, SEO copy and posts |

If you see an odd cache problem: stop the server, delete the `.next` folder, start again.

## 3. One-time Supabase setup (checklist)

1. **Create project** (choose a region close to India, e.g., Mumbai or Singapore).
2. **SQL Editor:** run `0001_init.sql`, then `0002_listings_cms_seo.sql`. (Safe to re-run 0002.)
3. **Authentication → Providers**
   - **Email:** on (used by admins).
   - **Google:** on. Create an OAuth client in Google Cloud; add Supabase's callback URL as an authorised redirect.
   - **Phone:** on; connect an SMS provider (Twilio or similar). Consider enabling **CAPTCHA** (Cloudflare Turnstile) to stop OTP abuse.
4. **Authentication → URL configuration:** set **Site URL** to your real domain and add your local and production URLs to **Redirect URLs**.
5. **Create the admin:** Authentication → Users → *Add user* (email + password, auto-confirm). Migration 0002 promotes `dm@techbliss.in`; for another address run  
   `update profiles set role='admin' where id=(select id from auth.users where email='you@example.com');`
6. **Storage:** migration 0002 creates the two buckets. Check they exist under Storage.
7. **Seed (optional):** run the seed script for demo content.
8. **Backups:** Project Settings → Database → enable daily backups / Point-in-Time Recovery on a paid plan.

## 4. Deploy to production (Vercel)

1. Put the code in a private Git repository (GitHub).
2. In Vercel: *New Project* → import the repo. Framework: Next.js (auto-detected).
3. **Environment variables** (Production): the six variables from the TRD. `NEXT_PUBLIC_SITE_URL` = your real domain. Mark the service key and AI key as **Sensitive**.
4. Deploy. Then add your **custom domain** and enable HTTPS (automatic).
5. In Supabase, update Site URL / Redirect URLs to the domain.
6. Smoke test with the [launch checklist](20-launch-checklist.md).

**Every later change:** push to the main branch → Vercel builds and deploys automatically. Use *Preview deployments* (per branch) to review before merging.

## 5. Releasing database changes

- Every change is a new numbered file in `supabase/migrations/` (e.g., `0003_…sql`).
- Run it first on **staging**, test, then on production during a quiet hour.
- Prefer additive changes (new columns/tables) so the old site version keeps working during a rollout.
- Keep a copy of the SQL you ran and the date.

## 6. Monitoring (what to watch)

| What | Where | Alert when |
|---|---|---|
| Site up/down | Uptime monitor (e.g., UptimeRobot, Better Stack) on the home page and `/sitemap.xml` | Down for 2 minutes |
| Errors | Vercel logs; add an error tracker (e.g., Sentry) | New error spikes |
| Database health | Supabase dashboard (CPU, connections, storage) | Above ~70% |
| Abuse | Admin → Analytics (unlocks per day, enquiries) | Sudden spikes |
| AI cost | xAI console | Above monthly budget |
| SMS cost | SMS provider dashboard | Unusual OTP volume (possible abuse) |
| SEO | Google Search Console | Coverage errors, drop in impressions |

## 7. Routine operations

| Frequency | Task | Owner |
|---|---|---|
| Daily | Review the approval queue; answer user reports | Admin |
| Weekly | Check Analytics; publish an article; scan Search Console | Content/SEO |
| Monthly | Update dependencies; review costs and limits; check backups exist; rotate any shared secret | Developer |
| Quarterly | Restore-test a backup; review roles list; review legal pages | Owner + developer |

## 8. Troubleshooting runbook

| Symptom | Likely cause | Fix |
|---|---|---|
| Site shows the 10 demo listings although the database has data | Migration 0002 not applied, or service key missing/mistyped | Run 0002; check `SUPABASE_SERVICE_ROLE_KEY` name and value; restart |
| "SUPABASE_SERVICE_ROLE_KEY is not set" | Wrong variable name in `.env` | Name must be exactly `SUPABASE_SERVICE_ROLE_KEY` |
| Cannot sign in as admin / redirected to Home | Role is still `buyer` | Run the `update profiles set role='admin'…` SQL |
| "role change not permitted" when promoting an admin | Old 0001 trigger still active | Run migration 0002 (it replaces the trigger) |
| Google sign-in loops or errors | Redirect URL not authorised | Add the exact URL in Supabase and Google console |
| OTP not received | SMS provider not configured, or trial number restrictions | Configure Twilio; verify test numbers |
| Photo/document upload fails | Buckets/policies missing, file too large or wrong type | Re-run 0002 storage section; check limits (5 MB / 10 MB) |
| Content edits do not appear | Cache window (up to 5 min) | Wait or save again; check for save error message |
| Sitemap is empty | No live listings or database not ready | Seed or approve listings |
| Map is blank | Blocked network to OpenStreetMap, or no listings with coordinates | Check network; add pins |
| AI features "not smart" | No `XAI_API_KEY` | Add key; restart |

## 9. Rollback

- **Website:** in Vercel, open Deployments → pick the last good one → *Promote/Rollback* (takes seconds).
- **Database:** additive migrations need no rollback. For a bad data change, restore from backup (point-in-time). Test this once before launch.
- **Theme/content/SEO mistakes:** re-save the previous values; use *Reset to defaults* in the theme editor.

## 10. Disaster recovery targets (suggested)

| Measure | Target |
|---|---|
| Recovery point (data you can lose) | ≤ 24 hours (≤ 5 minutes with Point-in-Time Recovery) |
| Recovery time (time to be back) | ≤ 4 hours |
