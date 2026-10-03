<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Application Building Context

Read the following files in order before implementing or making any architectural decision:

1. `docs/24-agent-project-overview.md` — what PLOTSS is, the four roles (buyer, seller, broker/client-staff, super admin), scope
2. `docs/25-agent-architecture.md` — stack, system boundaries, storage/multi-tenant model, the authorization rule, known architecture debt
3. `docs/26-agent-ui-context.md` — theme tokens, typography, component conventions
4. `docs/27-agent-code-standards.md` — implementation rules
5. `docs/28-agent-workflow-rules.md` — how to scope, sequence, and safely run destructive/live-DB work
6. `docs/29-agent-progress-tracker.md` — current phase, completed work, open questions, and next steps

Update `docs/29-agent-progress-tracker.md` after each meaningful implementation change. The numbered `docs/01-23-*.md` files are the longer-form, human-facing documentation pack (PRD, user journeys, security, SEO, legal, launch checklist) — read the relevant one when a task touches that area.

If implementation changes the architecture, scope, or standards documented in `docs/25-27`, update the relevant file before continuing.
