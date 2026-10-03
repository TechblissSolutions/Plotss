# 24. Agent Project Overview

**Audience: AI coding agents and new developers, read this first.** This is the spec-driven companion to [01 Project overview](01-project-overview.md) — shorter, more opinionated, and meant to be read before touching code, the way `AGENTS.md` points to it.

## What PLOTSS is

PLOTSS is a multi-client land marketplace for India (launch: Ghaziabad → Noida → New Delhi). Individuals list land directly (FSBO), and separately, onboarded **client businesses** (agencies, builders, brokers — modelled as `broker_profiles` rows, see [25 Architecture](25-agent-architecture.md)) list land through their own staff logins, all pooled into one public marketplace. A super admin (you) runs the whole platform from `/admin`.

This is **not** a white-label system — every client's listings appear on the same `plotss.com` search, tagged "Listed by X" (once `features.brokers` is on). Each client only gets a private dashboard to manage their own inventory and leads.

## The four roles

| Role | What they get after signing in | What they don't get |
|---|---|---|
| **Buyer** | Search/save listings, unlock owner contact (rate-limited), send a site-visit enquiry, see their requirement-based matches | No visibility into their enquiry's status (open/contacted/visit/closed) — that's seller/broker-only today. No notification when a seller responds. |
| **Seller** (FSBO) | Post a listing (free, no payment anywhere in the app), see views/leads/quality score, edit, mark sold | No delete — only "mark as sold" (soft-hide). No multi-listing bulk tools. |
| **Broker / client staff** | Everything a seller gets, scoped to every listing their business (`broker_id`) owns, not just ones they personally posted — any teammate at the same business can manage any of its listings | No public broker profile or "Listed by X" badge yet — `features.brokers` is off by default (see Roadmap below) |
| **Super admin** | Approve/reject listings, manage every client (`/admin/clients`: onboard, suspend/reactivate), assign a user to a client + role (`/admin/users`), edit site content/SEO/blog/theme, flip feature switches | No per-client billing/plan tiers yet (deliberately deferred — see Roadmap), no per-client analytics dashboard, no "view as this client" impersonation |

## Core user flow (buyer)

1. Search (natural-language box, parsed into filters) or browse by city/category.
2. Open a listing → see verification signals, AI match score, price-fairness.
3. Sign in (OTP, Google, or email+password — see [03-auth.md equivalent: AuthModal](../src/components/AuthModal.tsx)) to unlock the owner's contact or submit a site-visit enquiry.
4. Dashboard shows saved listings, contacted owners, and new matches.

## Core user flow (seller / broker listing)

1. Post a listing via the wizard (`/post-listing`) — category, location, photos, AI-assisted description, contact number.
2. Listing lands as `status = 'pending'`.
3. **Admin verification SLA (roadmap, not yet enforced in code): 23 business days** from submission to decision. See [29 Progress tracker](29-agent-progress-tracker.md) for what's built vs planned here.
4. Admin approves → listing goes `live`, both the seller **and** the client business's staff (if the listing has a `broker_id`) are notified. Admin rejects → seller sees the reason on their dashboard and can fix & resubmit.
5. Notifications (planned): email always; WhatsApp/SMS and in-app are additional channels, each independently switchable from `/admin/settings` (extends the existing `site_settings.features` pattern — see [25 Architecture](25-agent-architecture.md)).

## Scope

### In scope
- Multi-client marketplace: client onboarding, multi-staff logins per client, RLS-enforced isolation between clients.
- Free listing for everyone at launch (no payment/billing anywhere).
- Document-based verification workflow with an admin decision SLA.
- Multi-channel listing-status notifications, each channel admin-configurable.
- Traffic scale: the app must stay correct and fast as client count and listing volume grow — this governs query patterns in [25 Architecture](25-agent-architecture.md) (no unbounded `select *` across growing tables, pagination on admin/dashboard lists).

### Explicitly out of scope (for now)
- Billing / subscription plans for client businesses — planned for later, not this phase.
- White-label per-client branded sub-sites — the shared-marketplace model was a deliberate decision (see [22 Launch decisions](22-launch-decisions-ncr-verification-brokers.md) and the multi-client build log in [29 Progress tracker](29-agent-progress-tracker.md)).
- Mobile-native apps.

## Success criteria

1. A client business can be onboarded, staffed with more than one login, and every staff member sees only that business's listings/leads — provably, via RLS, not just app-level checks.
2. A seller or broker-staff listing submission reaches a go/no-go decision and both relevant parties are notified, without a human needing to manually check in.
3. The public marketplace stays a single shared search across every client plus every FSBO seller.
4. Buyer, seller, broker and admin each only ever see pages/data appropriate to their role — enforced at the database layer (RLS), not only in the UI.
