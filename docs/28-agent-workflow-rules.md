# 28. Agent Workflow Rules

**Audience: AI coding agents.** How to work on PLOTSS, not what to build (that's docs 24-26) or how to write it (that's doc 27).

## Approach

Build incrementally, spec-driven. Docs 24-29 in this folder (plus the numbered 01-23 pack) define what to build and the current state — implement against them, don't invent product behavior from scratch. If a requirement genuinely isn't written down anywhere, that's a sign to stop and add it as an open question in [29 Progress tracker](29-agent-progress-tracker.md) (or ask the user) before writing code.

## Reading order for a new session

1. `AGENTS.md` (root) — pointer to this list.
2. [24 Project overview](24-agent-project-overview.md) — what PLOTSS is, the four roles.
3. [25 Architecture](25-agent-architecture.md) — stack, boundaries, the authorization rule, known debt.
4. [26 UI context](26-agent-ui-context.md) — theme, components, conventions.
5. [27 Code standards](27-agent-code-standards.md) — implementation rules.
6. [29 Progress tracker](29-agent-progress-tracker.md) — current phase, what's done, what's next, open questions.

The numbered 01-23 pack is the longer-form, human-facing documentation (PRD, user journeys, security, SEO, legal, launch checklist) — read the relevant one when a task touches that area, but 24-29 are the fast-start set.

## Scoping rules

- One feature unit or subsystem per change. Example from this project's own history: "fix the dependency conflict," "set up Playwright storageState," and "write the E2E suites" were kept as distinct, separately-verified steps even though they were requested together.
- Prefer small, verifiable increments. Every change in this codebase so far has been checked with `tsc --noEmit`, `eslint`, and (where relevant) `npm test` / a Playwright run before being called done — keep doing that.
- Don't combine unrelated boundaries in one step: a UI change and an RLS/migration change are different steps even if they're for the same feature; a product-code authorization fix found while writing a test is worth calling out separately, not silently folded into "wrote the test."

## When to split work

Split if a change combines:
- A new Supabase migration **and** the app code that depends on it landing in the same unverified step — migrations get run manually by the user in the Supabase SQL editor; confirm they've been applied (a quick service-role probe query, as done repeatedly in this project's history) before assuming new columns/tables exist.
- A UI/theme change and a data-model change.
- Multiple unrelated server actions or admin screens.
- Anything not clearly defined in docs 24-27 — stop and resolve the ambiguity first (see Handling Missing Requirements).

## Handling missing or ambiguous requirements

- Do not invent product behavior. If unsure whether a feature is "planned" or "built," check [29 Progress tracker](29-agent-progress-tracker.md) and the actual code — don't assume either way.
- For a genuinely ambiguous or high-blast-radius decision (schema shape, which Supabase project to run destructive tests against, whether to unify the two UI systems), ask the user — this project's history has several examples (the multi-client data-model shape, the public-site-shape question, the live-E2E-tier permission gate) where a clarifying question before implementing saved a wrong build.
- If a requirement is missing, add it to "Open Questions" in [29 Progress tracker](29-agent-progress-tracker.md) rather than guessing silently.

## Safety rules specific to this project

- **Never run a destructive or data-seeding operation against the production Supabase project without explicit confirmation.** This project has exactly one Supabase project (production) today — there is no separate staging environment yet. Any live-tier test or manual seed/cleanup script must be visibly reviewed before running, and cleaned up immediately after (see `e2e/global-teardown.ts` as the pattern: prefix test data clearly, e.g. `e2e-plotss-test-*`, delete it in the same session).
- **Never edit an already-applied migration file.** Add a new numbered one instead (`0005_...`), even for a one-line fix.
- Treat a running `next dev` process as disposable but still ask before stopping someone else's — it's not destructive (just needs a restart), but it is disruptive if someone is actively viewing the site through it.

## Keeping docs in sync

Update the relevant doc whenever implementation changes:
- Architecture or boundaries → [25 Architecture](25-agent-architecture.md).
- Theme tokens or component conventions → [26 UI context](26-agent-ui-context.md).
- A new coding convention or a bug pattern worth standardizing against → [27 Code standards](27-agent-code-standards.md).
- Anything at all about current state → [29 Progress tracker](29-agent-progress-tracker.md), **every session**, not just at milestones.

[29 Progress tracker](29-agent-progress-tracker.md) must reflect actual implementation state, not intended state — if a feature is half-built, say so, don't round up to "done."

## Before moving to the next unit

1. The current unit works end to end within its stated scope, verified with the tools available (`tsc`, `eslint`, `npm test`, a Playwright run, or a direct DB probe where app-level testing can't reach — e.g. confirming a migration actually applied).
2. No invariant in [25 Architecture](25-agent-architecture.md) was violated (especially the authorization rule).
3. [29 Progress tracker](29-agent-progress-tracker.md) reflects the completed work and any new open questions.
