# 12 · Testing & QA

**Why this matters:** for a marketplace, one bug can mean a leaked phone number or a fake "verified" badge. Testing is how we prove the rules hold.

## 1. Test levels

| Level | What it checks | Tool | Status |
|---|---|---|---|
| Type checking | Wrong types, missing fields | TypeScript (`tsc`) | ✅ passes |
| Linting | Style and common mistakes | ESLint | ✅ passes |
| Unit tests | Small pieces of logic | Vitest | ✅ 13 tests pass |
| Build | The whole site compiles for production | `npm run build` | ✅ passes |
| Integration (DB + login) | Flows against real Supabase | Manual now; automate later | 🟡 **pending until migration 0002 is applied** |
| End-to-end (browser) | Click through as a user | Playwright (recommended) | 🔲 |
| Security | Abuse attempts, permissions | Manual checklist below; external pen-test recommended | 🟡 |
| Performance | Speed on phones | Lighthouse, WebPageTest | 🔲 |
| Accessibility | Keyboard/screen reader | Axe + manual | 🔲 |
| User acceptance (UAT) | Real people try real tasks | Script below | 🔲 |

## 2. What the 13 automated tests cover

- Search sentence parsing (city, category, budget in Cr/Lakh, lease/zone, size, gibberish).
- Theme safety: bad colour values rejected, numbers clamped, gradient output.
- Contact masking and rupee/area formatting.
- Markdown renderer cannot inject scripts or `javascript:` links.
- SEO title templates; JSON-LD cannot close a script tag (this test caught a real bug).
- Rate limiter allows N then blocks.

Run all checks:

```
npm run lint
npx tsc --noEmit
npm test
npm run build
```

## 3. Manual test script (run once the database is set up)

Use two browsers or one normal + one private window.

### A. Buyer
1. Open Home → search "3 acre industrial land near Pune under 5Cr" → chips appear; results narrow.
2. Remove a chip → results widen.
3. Switch to map view → pins appear; click a pin → "View dossier".
4. Open a property → **view page source** and search for a phone number → **must not be found**.
5. Click Unlock while signed out → sign-in window opens.
6. Sign in with Google (new account) → asked for role → choose Buyer → contact shows.
7. Unlock 21 different listings in a day (or lower the limit temporarily) → 21st shows the daily-limit message.
8. Send an enquiry with a visit date → success message → owner sees a lead.

### B. Seller
1. Open Post your land while signed out → fill details, pick city, click map to drop a pin.
2. Add 2 documents with files, 2 photos; generate a description; edit it.
3. Submit → asked for mobile OTP → choose Seller → "Submitted for review".
4. Seller dashboard shows "Under review".
5. Try the browser console trick: update your listing's `status` to `live` through the Supabase client → **must be rejected**.

### C. Admin
1. Sign in with email → Admin → Approval queue.
2. Open a document link → opens; wait 10 minutes → link no longer works.
3. Verify all documents → Publish → listing appears on the site with the **Verified** badge.
4. Reject one document → republish → badge disappears.
5. Change a user's role; verify a broker → broker page appears.

### D. Super admin
1. Theme: change clay to a gradient → Save → homepage buttons show the gradient.
2. Content: change the hero title → Save → refresh Home within a minute.
3. SEO: set a custom title for `/city/pune` → view page source → title matches.
4. Blog: publish a post → visible at `/blog` and in `/sitemap.xml`.
5. Redirects: add `/old` → `/search` → visiting `/old` lands on Search.

### E. Security spot checks
- Visit `/admin/listings` signed out → redirected to sign-in.
- Signed in as buyer, visit `/dashboard/seller` and `/admin/users` → redirected.
- Upload a `.exe` renamed to `.jpg` as a photo → rejected by type check.
- Try to upload into another user's folder path → rejected by policy.
- Response headers on any page include `X-Frame-Options: DENY`.

## 4. Browser/device matrix (minimum)

Chrome and Edge (Windows), Safari (iPhone), Chrome (Android mid-range), Firefox (desktop). Widths: 360, 768, 1280, 1920.

## 5. Bug severity guide

| Level | Meaning | Example | Fix within |
|---|---|---|---|
| S1 Critical | Data leak, wrong verification, site down | Phone visible in page source | Same day |
| S2 High | Core flow broken | Cannot submit a listing | 2 days |
| S3 Medium | Wrong but workaround exists | Filter chip not removable | Next release |
| S4 Low | Cosmetic | Misaligned icon | Backlog |

## 6. Definition of Done (for any change)

- Code reviewed; `lint`, `tsc`, `test`, `build` all pass.
- Security impact considered (new input? new data exposure? new limit needed?).
- Docs updated if behaviour or rules changed.
- Tested on a phone-width screen.

## 7. Recommended next steps for QA

1. Add Playwright tests for the buyer unlock flow and admin approval.
2. Add a CI pipeline (GitHub Actions) that runs the four commands on every change.
3. Add a staging environment with a separate Supabase project.
4. Run Lighthouse and Axe and fix the top issues before launch.
