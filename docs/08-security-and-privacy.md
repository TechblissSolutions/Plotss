# 08 · Security & Privacy

**The plain-English idea:** assume some visitors will try to cheat: scrape phone numbers, publish fake listings, pretend to be admin, or break the site. Every rule below exists because of a specific way that could happen.

---

## 1. What we are protecting

| Asset | Why it matters | Main protection |
|---|---|---|
| Owner/broker phone numbers | Core value of the product; privacy of individuals | Stored in private tables; released only by the server, per listing, after sign-in, under daily limits |
| The trust promise ("verified") | If fake listings look verified, the brand dies | Only admins can verify; badge computed from document statuses |
| Private documents (deeds, NOCs) | Sensitive personal/property data | Private storage bucket, owner/admin only, 10-minute signed links |
| Admin powers and site look | Whoever controls them controls the business | Server-side role checks everywhere; database triggers |
| User accounts | Login = identity | Supabase Auth (Google, OTP, email); rate limits; no custom password code |
| Server secrets | The service key bypasses all rules | Server-only environment variable; never sent to browsers |

## 2. Loopholes found in our own build, and their fixes

An internal review (September 2026) found these. All are fixed in code/migrations; the database ones take effect when migration 0002 is applied.

| # | Loophole | What an attacker could do | Fix |
|---|---|---|---|
| 1 | Owners could update *any* column of their own listing | Set `status='live'` and `is_verified=true` straight from the API, bypassing review | Trigger `guard_property_moderation` |
| 2 | Owners could edit their own document rows | Mark documents "verified" | Trigger `guard_document_status` |
| 3 | First admin could not be created | (Operational bug) The role guard blocked even trusted SQL | Trigger now allows trusted contexts; migration promotes the first admin |
| 4 | Owner phone numbers were part of the data sent to the browser | Anyone could read all numbers from the page source | Separate private table; masked strings only in public data; real number only via server action |
| 5 | Logged-in users could unlock unlimited contacts | Scrape the whole database of numbers | 20 unlocks/day limit; 10 enquiries/day |
| 6 | The enquiry form showed "sent" without sending | Sellers silently lost leads | Real save with error messages |
| 7 | Approving a listing auto-verified all its documents | Trust badge without real checks | Admins verify each document; badge computed |
| 8 | Admin pages protected only by a layout | Next.js does not re-run layouts on every navigation, so a check could be skipped | Every admin page and action calls `requireAdmin()` |
| 9 | Homepage numbers were invented ("890 deals closed") | Misleading claims, legal exposure | Numbers computed from data; admin override is explicit |
| 10 | Fake testimonials, RERA badges, "DGPS surveyed", "OCR verified", fake email addresses | Consumer-protection and reputation risk | Hidden by default, wording made factual, fake data removed |
| 11 | Seller form was pre-filled with demo values and reported fake progress | Junk listings; false promises | Blank form, validation, honest statuses |
| 12 | JSON-LD script escaping typo (found by an automated test) | A `</script>` inside listing text could break the page or inject markup | Correct escaping + regression test |
| 13 | Public AI search endpoint had no limit | Cost abuse of a paid AI API | Per-visitor rate limit, caching, server-only key |
| 14 | No security headers | Clickjacking, content sniffing | Headers added (see below) |

### 2b. Added with the launch settings and analytics (21 Sep 2026)

| # | Risk | Control |
|---|---|---|
| 15 | A public event collector could be flooded or used to store junk/personal data | `/api/track` accepts only whitelisted event types, clips every string, keeps only small primitive properties, caps batch size (25 events, 32 KB), rate-limits per visitor and per IP, ignores bots and Do-Not-Track, and is write-only through the server |
| 16 | Tracking storing what people type | The tracker records the *name* of a touched field, never its value; password fields ignored; no keystrokes; no page text from private areas |
| 17 | Visitors tracked without consent | Consent banner; declining clears the tracking cookies and stops all recording; admin can switch tracking off |
| 18 | "AI verified" misleading the public | The AI feature is labelled a risk screen; the public label is "AI-screened (not a legal verification)"; **Verified** exists only with staff verification |
| 19 | Users choosing the broker role while brokers are switched off | No public presence for unverified brokers; broker URLs and dashboard are disabled by the switch |
| 20 | Raw events growing forever | 13-month retention via `purge_old_events()` |

## 3. Access control model

| Role | Can do | Cannot do |
|---|---|---|
| Visitor | Read live listings, blog, SEO pages | See any contact, private data, or dashboards |
| Buyer | Everything above + unlock contacts (limited), send enquiries | Post as a seller unless role changed to seller/broker |
| Seller | Post listings (pending), see own listings and leads | Publish, verify, see others' data |
| Broker | Same as seller + broker profile | Verify themselves |
| Admin | Approve/verify, manage users, brokers, content, SEO, blog, redirects, theme | (Trusted; actions should be logged: see backlog) |

Roles live in `profiles.role` and are checked in three places: database policies, server pages, and server actions.

## 4. Technical controls checklist

| Control | Status |
|---|---|
| Row Level Security on all tables | ✅ |
| Database triggers for moderation, roles, broker verification | ✅ (after migration 0002) |
| Service key only on the server; `server-only` imports | ✅ |
| Input validation and length limits in every server action | ✅ |
| Theme input whitelist (hex colours, approved fonts, clamped numbers) | ✅ |
| Blog Markdown rendered by a safe renderer (no raw HTML, `javascript:` links blocked) | ✅ tested |
| JSON-LD escaped | ✅ tested |
| Upload limits and type checks (client + storage bucket) | ✅ |
| Uploads confined to the user's own folder | ✅ |
| Private documents via short-lived signed links | ✅ |
| Rate limits (unlock, enquiry, listing, AI) | ✅ per instance |
| Security headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security` | ✅ |
| `Content-Security-Policy` (CSP) | 🔲 needs care because of inline theme CSS and JSON-LD; plan with nonces |
| CAPTCHA on OTP requests | 🔲 enable Supabase CAPTCHA (Cloudflare Turnstile) before launch |
| Audit log of admin actions | 🔲 |
| Automated dependency vulnerability scan | 🔲 add to CI |
| Penetration test by a third party | 🔲 recommended before public launch |
| Two-factor authentication for admins | 🔲 Supabase MFA available |

## 5. Privacy (India's DPDP Act mindset)

What personal data we hold: name, phone, email, role, listing details, documents, enquiries, contact unlock history.

Principles to follow:

1. **Purpose limitation:** use data only to run the marketplace (listings, leads, safety).
2. **Consent and notice:** the sign-in window and terms must say plainly that buyers who unlock a contact become a lead for that owner/broker.
3. **Minimisation:** we do not ask for more than needed (no Aadhaar/PAN collection).
4. **Security safeguards:** as above.
5. **Rights:** users can ask to see, correct or delete their data → provide a contact email and a process (see [Legal & compliance](19-legal-and-compliance.md)).
6. **Retention:** see [Database doc](07-database-and-data-dictionary.md#7-data-retention-and-backups-recommended-policy).
7. **Breach response:** decide the owner, the timeline for informing users/authorities, and keep a contact list.

## 6. Incident response (simple playbook)

| Step | Action |
|---|---|
| 1. Detect | Alerts from hosting/Supabase, user reports, unusual unlock counts in Analytics |
| 2. Contain | Rotate the affected key (Supabase → API keys; hosting env vars) and redeploy; unpublish affected listings; block abusive accounts |
| 3. Assess | What data, which users, since when? Use Supabase logs |
| 4. Notify | Affected users and authorities as required by law |
| 5. Fix | Patch the cause, add a test, update this document |
| 6. Review | Write a short post-mortem within a week |

## 7. Secrets hygiene

- Never paste keys into chat, email, screenshots or source code.
- `.env` is git-ignored. Production secrets live in the hosting dashboard.
- If a key was ever shared, **rotate it** (create a new one and delete the old).
- The publishable Supabase key is meant to be public; the **service role** key is not.
