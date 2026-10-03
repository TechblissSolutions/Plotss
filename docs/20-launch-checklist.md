# 20 · Launch Checklist

Tick every box before going public. Items marked **⛔ blocker** must be done; others are strongly recommended.

## A. Database & accounts

- [ ] ⛔ Migrations `0001`, `0002` and `0003` applied on the **production** Supabase project
- [ ] ⛔ Admin → Settings reviewed: documents off, AI screen on, staff verification off, brokers off, tracking + consent on (or your chosen values)
- [ ] ⛔ Only Ghaziabad, Noida and New Delhi are active cities (Settings → Cities)
- [ ] ⛔ First admin created and can sign in; role is `admin`
- [ ] ⛔ `SUPABASE_SERVICE_ROLE_KEY` set **only** on the server; never shared in chat/screenshots (rotate if it was)
- [ ] ⛔ Google sign-in works on the production domain (redirect URLs correct)
- [ ] ⛔ Phone OTP works and delivers within seconds; CAPTCHA enabled
- [ ] Admin accounts use strong unique passwords; 2-factor enabled if available
- [ ] Storage buckets exist (`listing-photos`, `listing-docs`) with the right policies
- [ ] Daily backups on; a restore was tested once

## B. Content & data

- [ ] ⛔ Demo listings removed (`delete from properties where details->>'demo'='true';`)
- [ ] ⛔ Demo brokers removed or replaced with real verified brokers
- [ ] ⛔ No AI-generated/fake images presented as real photos
- [ ] At least 30 real listings live in launch cities; each with real photos and documents reviewed
- [ ] City and category SEO copy and FAQs reviewed for accuracy
- [ ] 5 to 10 real articles published
- [ ] Testimonials hidden unless real and consented; RERA badges hidden unless held
- [ ] Homepage numbers are computed or provably correct

- [ ] Consent banner appears for a new visitor; declining stops events; accepting records events (check Admin → User journey)
- [ ] Privacy Policy mentions analytics, AI screening and AI search

## C. Legal & trust

- [ ] ⛔ Terms, Privacy Policy, Verification Disclaimer published and linked in footer and sign-in window
- [ ] ⛔ Grievance officer contact visible
- [ ] ⛔ "Verified" standard written; review team trained; SLA decided
- [ ] Claims table in [Legal doc](19-legal-and-compliance.md) reviewed by a lawyer
- [ ] Data-deletion request process defined

## D. Technical quality

- [ ] `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` all pass on the release commit
- [ ] Manual test script ([QA §3](12-testing-and-qa.md#3-manual-test-script-run-once-the-database-is-set-up)) completed on production-like data
- [ ] Phone unlock check: view page source of a property; **no phone number present**
- [ ] Owner tries to self-publish through the API → rejected
- [ ] Security headers present on the live domain
- [ ] Lighthouse mobile: Performance ≥ 90, SEO ≥ 95, Accessibility ≥ 90 (target)
- [ ] Tested on iPhone Safari, Android Chrome, desktop Chrome/Edge/Firefox
- [ ] Custom 404 and error pages look right
- [ ] `NEXT_PUBLIC_SITE_URL` and Admin → SEO **Site URL** set to the real domain; "Block search engines" **off**

## E. SEO & analytics

- [ ] Domain HTTPS; www/non-www redirect decided
- [ ] `/sitemap.xml` and `/robots.txt` correct on the live domain
- [ ] Submitted to Google Search Console and Bing Webmaster Tools
- [ ] Rich Results test passes for a listing, a city page, a blog post
- [ ] Analytics installed (with consent approach decided)
- [ ] Google Business Profile and social pages created

## F. Operations

- [ ] Uptime monitor and error tracking configured; alerts go to a real person
- [ ] AI key added and a monthly spend cap set (or AI left off)
- [ ] SMS budget cap set with the provider
- [ ] Support email/WhatsApp number monitored
- [ ] Admin manual read by everyone who will use the admin area
- [ ] Incident contact list (developer, owner, hosting support) written down
- [ ] Rollback plan understood (Vercel previous deployment; database backup)

## G. Launch day

1. Freeze changes 24 hours before.
2. Final smoke test on production (sign up, search, unlock, post, approve).
3. Announce to a small group first (soft launch), watch logs and Analytics for 48 hours.
4. Fix issues; then widen to all target cities.

## H. First 30 days after launch

- Review the approval queue daily; track median review time.
- Check unlock counts for abuse; adjust limits if needed.
- Read Search Console weekly; fix crawl errors.
- Collect feedback from 10 users; update the backlog.
- Publish at least 2 articles per week.
- Hold a retrospective at day 30 ([process doc](14-development-process.md)).
