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
**Status:** Complete
**Why it exists:** The repo needed to be moved off the earlier temporary SQLite workaround and revalidated on the intended PostgreSQL target.

Scope:
1. Restore PostgreSQL as the intended primary runtime outside temporary local development.
2. Align Prisma schema, runtime client setup, and migration workflow with PostgreSQL.
3. Define repeatable local, staging, and production database setup instructions.
4. Revalidate existing billing, payment, and reporting workflows against the PostgreSQL-backed environment.

Exit criteria:
- PostgreSQL workflow is documented and working.
- The Prisma runtime no longer depends on the temporary SQLite-only adapter for the intended primary path.
- MVP workflows still pass the baseline validation.

Current progress:
- Prisma schema and runtime have been switched to PostgreSQL-first operation.
- The repo now includes a PostgreSQL baseline migration and local/staging/production setup guidance.
- MVP baseline validation against a live PostgreSQL environment has been completed and validated.

### EH2: Authorization & Staff Controls
**Priority:** High
**Status:** Complete
**Depends on:** none

Scope:
1. Enforce role-based authorization in server actions and protected route surfaces.
2. Define role access expectations for admin, billing, cashier, meter reader, customer service, and manager.
3. Prevent unauthorized staff from mutating records outside their role scope.

Exit criteria:
- Roles affect access, not just display.
- Sensitive actions reject authenticated but unauthorized users.

Current progress:
- Central role-based authorization now exists in `src/features/auth/lib/authorization.ts`.
- Protected admin routes now enforce role access before loading module data.
- Server actions now reject authenticated-but-unauthorized staff for customer, meter, tariff, reading, billing, and payment mutations.
- The readings and tariffs surfaces now degrade into role-appropriate read-only states where mutation authority is intentionally absent.
- First-time Clerk sign-ins no longer self-provision active staff access by default.
- Unknown Clerk accounts now land in a pending approval state until an admin or manager reviews them from `/admin/staff-access`.
- Approved staff access, rejected requests, and deactivated staff access are now separate operational states in the auth layer.

Implemented role access expectations:
- `ADMIN`: full access across all protected admin modules and sensitive mutations.
- `MANAGER`: full operational access across all protected admin modules and sensitive mutations.
- `CUSTOMER_SERVICE`: customer and meter modules only.
- `METER_READER`: dashboard plus reading-entry workspace, including deletion of their own pending readings only.
- `BILLING_STAFF`: tariffs read-only, reading approval, billing, and collections visibility.
- `CASHIER`: payments, printable bill view, and collections visibility.

### EH3: Reporting & Receivables Intelligence
**Priority:** High
**Status:** Complete
**Depends on:** EH1 recommended, but not strictly required

Scope:
1. Add historical date filters to collections reporting.
2. Add unpaid, partially paid, and overdue account analytics.
3. Add trend summaries or charts only where they improve operational decisions.

Exit criteria:
- Staff can review more than the current operating day.
- Receivables follow-up is visible from dedicated reporting surfaces.

Current progress:
- `/admin/collections` now accepts server-side historical date filters through Next.js page `searchParams`.
- The reporting workspace now shows completed-payment history for the selected range plus receivables summaries for unpaid, partially paid, and overdue bills.
- Overdue reporting is derived from due dates and outstanding balances so staff can see follow-up pressure even when no separate enforcement workflow exists yet.
- EH3 has been validated by the user and is now closed.

### EH4: Cashiering & Settlement Expansion
**Priority:** Medium
**Status:** Complete
**Depends on:** EH2 for permission boundaries

Scope:
1. Add official receipt generation.
2. Support approved installment or partial-payment policies beyond the current exact-balance guardrails.
3. Add customer credit or overpayment handling if the business approves that workflow.

Exit criteria:
- Cashiering no longer stops at simple exact-balance manual posting.
- Receipt output and settlement rules are explicit and auditable.

Current progress:
- Payments now generate unique official receipt numbers plus before/after balance snapshots tied to the cashier who posted them.
- `/admin/payments` now supports explicit partial-settlement posting instead of presenting the flow as exact-balance only.
- Printable official receipts now exist at `/admin/payments/[paymentId]/receipt`.
- Customer credit and overpayment handling remain out of scope until the business approves that workflow.
- EH4 has been validated by the user and is now closed.

### EH5: Overdue & Disconnection Workflow
**Priority:** Medium
**Status:** Complete
**Depends on:** EH3 recommended

Scope:
1. Turn overdue handling into an explicit workflow instead of display-only messaging.
2. Add follow-up states, escalation checkpoints, or optional disconnection tracking.
3. Define reinstatement or resolution rules if disconnection is modeled in-app.

Exit criteria:
- Overdue handling is operationally actionable, not just printed on the bill template.

Current progress:
- Bills now carry explicit receivables follow-up stages for current, reminder sent, final notice sent, disconnection review, disconnected, and resolved.
- `/admin/follow-up` now provides a protected overdue-operations workspace for reminder escalation, service disconnection, and reinstatement.
- Customer service status changes are now tracked in-app, and reinstatement is blocked while overdue balances remain open.
- Open-bill status is now synchronized server-side so overdue balances remain operationally actionable across dashboard, billing, payments, collections, and follow-up surfaces.
- Customer records now support optional email capture for outbound notices.
- A notification audit log plus provider-ready Resend email and Semaphore SMS delivery now exist for EH5 notices.
- The default low-cost policy sends email for all follow-up notices and limits SMS to higher-priority templates unless configuration expands that list.
- EH5 has been validated by the user, including the email-first follow-up notification path, and is now closed.

### EH6: Product Surface Expansion
**Priority:** Medium
**Status:** Complete
**Depends on:** MVP stability

Scope:
1. Expand the marketing site with real screenshots, deployment-ready copy, and brand assets.
2. Add future consumer-portal routes when explicitly approved.
3. Add notifications or online payments only when the business wants those channels in scope.

Exit criteria:
- Public and future customer-facing surfaces are supported intentionally rather than implied by MVP copy.

Current progress:
- The public marketing surface now includes reusable DWDS brand assets plus screenshot-style product previews aligned to the implemented dashboard, billing, and follow-up modules.
- Home, platform, workflows, and rollout pages now use deployment-ready copy that distinguishes live operational scope from future consumer-facing expansion.
- EH6 has been user-validated and is now closed. Do not begin EH7 unless the user explicitly approves that tooling work.

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
