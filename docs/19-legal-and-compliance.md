# 19 · Legal & Compliance Checklist

> **Important:** this is a *checklist of topics to review with a qualified Indian lawyer*, not legal advice. Laws and rules change and differ by state. Nothing here should be published as legal text without professional review.

## 1. Why this matters more for PLOTSS than for a normal website

- We hold **personal data** (names, phones, documents).
- We make **trust claims** ("verified") that people rely on when spending large sums.
- We connect **buyers with agents/brokers**, which touches real-estate regulation.
- We host **content from users** (listings, photos), so we have intermediary responsibilities.

## 2. Claims review: what the site says vs what is true

Review every public claim. Keep it only if you can prove it *today*.

| Claim on the site (default text) | Status | Action |
|---|---|---|
| "Every listing shows the documents we have reviewed and the status of each" | True by design | Keep |
| "Verified" badge = all documents verified by our team | True only if your team really verifies | Write the exact standard; train reviewers |
| "DGPS surveyed" style badges on demo cards, "DGPS boundary" wording in demo texts | **Not true unless a DGPS survey was done** | Remove or use only when a survey report is attached |
| "Title verified" | Only if a title search was done | Tie to a specific document status |
| "30-year title audits", "100% pre-audited" (old prototype text) | Removed from defaults | Do not reintroduce without proof |
| Homepage numbers (verified plots, cities, deals) | Computed from data | Keep; override only with provable figures |
| Testimonials | Hidden by default | Publish only real, consented quotes |
| RERA badges (MAHARERA etc.) | Hidden by default | Show only registrations you actually hold |
| Broker "RERA no." in demo data | Fake demo numbers | Replace with real, verified numbers |
| Photos labelled as photos | Demo images are **AI-generated** | Replace with real photos or label as illustrations |
| Price fairness, "below market" | Demo values | Show only when calculated from real comparables, with the method disclosed |

### 2b. Wording rules for the phased verification launch

- With **staff verification off**, never use the words "verified", "checked" or "audited" about a listing's title or documents. Use **"AI-screened"** and always add: *"AI screening looks for red flags. It is not a legal verification. Verify ownership and documents yourself with the owner and your lawyer."*
- With **documents off**, do not show or imply a document checklist.
- Keep "Verified" for the day a real team verifies documents against a written standard.
- The Privacy Policy must mention: analytics tracking (what is recorded, cookies, 13-month retention, how to decline), the AI screen and AI search (text sent to a third-party AI provider), and lead sharing when a buyer unlocks a contact.
- The footer's Terms / Privacy / RERA links are placeholders until the pages exist.

## 3. Pages and policies to publish before launch

| Page | Key contents |
|---|---|
| **Terms of Use** | Who may use the site; listing rules; prohibited content; role of PLOTSS (platform vs. party to deals); limitation of liability; dispute resolution and jurisdiction; that unlocking a contact creates a lead shared with the owner/broker |
| **Privacy Policy** | What data, why, who sees it, retention, security, user rights, grievance contact, cookies/analytics, international transfers (Supabase/Vercel/xAI regions) |
| **Verification Disclaimer** | Exactly what "verified" means and does not mean; not a legal opinion or guarantee of title; advise independent legal due diligence |
| **Cookie notice** | Only if analytics/marketing cookies are used |
| **Grievance Officer page** | Name and contact of the officer as required for intermediaries; response timelines |
| **Listing/Content Policy** | What is allowed; takedown process; repeat-violation policy |
| **Refund/Cancellation** | Only when paid features launch |
| **Broker Terms** | RERA obligations, accurate advertising, conduct, lead-use rules |

## 4. Laws and rules to discuss with your lawyer

| Area | Topics |
|---|---|
| **Data protection** | DPDP Act 2023 and rules: notice, consent, purpose limitation, children's data, breach notification, data-principal rights, retention, processors (Supabase, Vercel, SMS, xAI) |
| **IT Act 2000 & Intermediary Guidelines 2021** | Safe-harbour conditions, takedown timelines, grievance officer, user-content due diligence |
| **Real estate regulation (RERA)** | Whether/how agent and project registration numbers must be displayed in advertising; agent obligations; your role as a platform |
| **Consumer protection** | Misleading claims, unfair trade practices, e-commerce rules if paid services are sold |
| **Advertising standards** | Rules on comparative claims and testimonials |
| **Contract & payments (future)** | GST, invoicing, payment aggregator rules if you take money, escrow limits |
| **KYC/AML (future)** | If you ever hold funds or facilitate transactions |
| **Intellectual property** | Trademark for "PLOTSS" and logo; licences for fonts, images, map data (OpenStreetMap requires attribution: already shown) |
| **Sector specifics** | Agricultural-land purchase restrictions by state; NA conversion; industrial-estate transfer conditions: reflect these in listing guidance, not as advice |

## 5. Data-protection practical checklist

- [ ] Data map: what we store, where, who can access
- [ ] Consent text in the sign-in window (with links to Terms and Privacy)
- [ ] Process to export/correct/delete a user's data on request (owner, email, deadline)
- [ ] Retention schedule applied ([Database doc §7](07-database-and-data-dictionary.md#7-data-retention-and-backups-recommended-policy))
- [ ] Vendor list with their locations and data-processing terms
- [ ] Breach response plan and contact list ([Security doc §6](08-security-and-privacy.md#6-incident-response-simple-playbook))
- [ ] Staff access is by role; admin accounts use strong passwords and 2-factor
- [ ] No Aadhaar/PAN/bank details collected or stored

## 6. Verification operations: make the promise real

A "Verified" badge is a **legal and reputational promise**. Before launch:

1. Write a one-page **Verification Standard**: which documents, checked against which sources, by whom, how long it takes, what happens if a document later proves false.
2. Train reviewers; require a **reference number** for every verified document (the admin screen supports this).
3. Keep evidence and a log of decisions (until the automated audit log exists, keep a spreadsheet).
4. Decide the **remedy** if a verified listing turns out fraudulent (takedown, notification, cooperation with authorities).
5. Consider professional indemnity or legal-partner backing.

## 6b. Content moderation

- Reporting: add a visible "Report this listing" path (planned) and a monitored email.
- Removal: admins can unpublish immediately.
- Repeat offenders: role change/blocking policy.

## 7. Ownership of content and images

- Sellers/brokers grant PLOTSS a licence to display their photos and text: put this in the Terms.
- Demo images (from the design prototype) are AI-generated: **do not present as real property photos**.
- Blog articles you publish must be original or properly licensed.

## 8. Before-launch legal sign-off

- [ ] Lawyer has reviewed Terms, Privacy, Disclaimer
- [ ] Claims table in §2 completed and signed off by the owner
- [ ] Grievance officer named and reachable
- [ ] Trademark search/filing started
- [ ] Company registrations, GST (if applicable) and bank account ready
