# Implementation Plan

This document now serves two purposes:
- capture the **implemented MVP baseline**
- define the **named enhancement roadmap** that replaces the old loose backlog

Developers should not reopen completed MVP steps unless they are fixing regressions or intentionally revising an existing module.

## Implemented MVP Baseline

### Foundation
- Next.js App Router project initialized with TypeScript and Tailwind CSS
- `shadcn/ui` base primitives configured under `src/components/ui`
- Prisma integrated with the current local SQLite-backed development setup
- Clerk authentication added with protected `/admin/*` routes
- First-login local user sync implemented and later hardened to reconcile by `clerkId` first and `email` second

### Core Utility Records
- Customer management implemented
- Meter registry and customer assignment implemented
- Tariff configuration with progressive tiers implemented

### Operations Workflow
- Meter reading encoding implemented
- Reading approval workflow implemented
- Bill generation implemented
- Manual payment recording implemented
- Printable per-bill consumer statement implemented

### Reporting & Product Surface
- Daily collections reporting implemented
- Public marketing route group implemented
- Admin dashboard redesigned into a production-facing operations hub

## Current Validation Baseline
Use this as the minimum smoke test after major refactors:

1. Public routes `/`, `/platform`, `/workflows`, and `/rollout` load correctly.
2. `/admin/dashboard` loads after sign-in and completes first-login sync without duplicate-user failure for existing staff emails.
3. Core admin routes for customers, meters, tariffs, readings, billing, payments, and collections all render without broken navigation.
4. A customer can still move from meter assignment to reading, bill generation, payment recording, and printable bill view.
5. Daily collections still match the sum of completed payments in the active operating-day window.

## Enhancement Roadmap

### EH1: Data Platform Hardening
**Priority:** Highest
**Status:** Not started
**Why it exists:** The repo still runs on a temporary SQLite local setup while the intended operational target is PostgreSQL.

Scope:
1. Restore PostgreSQL as the intended primary runtime outside temporary local development.
2. Align Prisma schema, runtime client setup, and migration workflow with PostgreSQL.
3. Define repeatable local, staging, and production database setup instructions.
4. Revalidate existing billing, payment, and reporting workflows against the PostgreSQL-backed environment.

Exit criteria:
- PostgreSQL workflow is documented and working.
- The Prisma runtime no longer depends on the temporary SQLite-only adapter for the intended primary path.
- MVP workflows still pass the baseline validation.

### EH2: Authorization & Staff Controls
**Priority:** High
**Status:** Not started
**Depends on:** none

Scope:
1. Enforce role-based authorization in server actions and protected route surfaces.
2. Define role access expectations for admin, billing, cashier, meter reader, customer service, and manager.
3. Prevent unauthorized staff from mutating records outside their role scope.

Exit criteria:
- Roles affect access, not just display.
- Sensitive actions reject authenticated but unauthorized users.

### EH3: Reporting & Receivables Intelligence
**Priority:** High
**Status:** Not started
**Depends on:** EH1 recommended, but not strictly required

Scope:
1. Add historical date filters to collections reporting.
2. Add unpaid, partially paid, and overdue account analytics.
3. Add trend summaries or charts only where they improve operational decisions.

Exit criteria:
- Staff can review more than the current operating day.
- Receivables follow-up is visible from dedicated reporting surfaces.

### EH4: Cashiering & Settlement Expansion
**Priority:** Medium
**Status:** Not started
**Depends on:** EH2 for permission boundaries

Scope:
1. Add official receipt generation.
2. Support approved installment or partial-payment policies beyond the current exact-balance guardrails.
3. Add customer credit or overpayment handling if the business approves that workflow.

Exit criteria:
- Cashiering no longer stops at simple exact-balance manual posting.
- Receipt output and settlement rules are explicit and auditable.

### EH5: Overdue & Disconnection Workflow
**Priority:** Medium
**Status:** Not started
**Depends on:** EH3 recommended

Scope:
1. Turn overdue handling into an explicit workflow instead of display-only messaging.
2. Add follow-up states, escalation checkpoints, or optional disconnection tracking.
3. Define reinstatement or resolution rules if disconnection is modeled in-app.

Exit criteria:
- Overdue handling is operationally actionable, not just printed on the bill template.

### EH6: Product Surface Expansion
**Priority:** Medium
**Status:** Not started
**Depends on:** MVP stability

Scope:
1. Expand the marketing site with real screenshots, deployment-ready copy, and brand assets.
2. Add future consumer-portal routes when explicitly approved.
3. Add notifications or online payments only when the business wants those channels in scope.

Exit criteria:
- Public and future customer-facing surfaces are supported intentionally rather than implied by MVP copy.

### EH7: Tooling & Design Workflow Recovery
**Priority:** Low
**Status:** Not started
**Depends on:** local environment fixes

Scope:
1. Restore executable local Python support for the installed `ui-ux-pro-max` workflow.
2. Re-enable the searchable design-system script for future UI passes.

Exit criteria:
- The local design skill can run in its intended search-assisted mode instead of written-rule fallback.

## Backlog Intake Rule
Any new future work should be added here as a named enhancement phase with:
- priority
- dependency notes
- scope bullets
- exit criteria

Do not append anonymous backlog bullets anymore.
