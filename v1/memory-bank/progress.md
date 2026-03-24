# Project Progress

## Summary
- The DWDS MVP is implemented and the memory-bank now treats that MVP as the baseline rather than an active checklist.
- There are **no open MVP blockers** recorded in the memory-bank.
- Future work is now tracked as named enhancement phases `EH1` through `EH7`.

## Implemented Milestones

### Foundation & Auth
- Next.js App Router, TypeScript, Tailwind CSS, and `shadcn/ui` were initialized successfully.
- Prisma was integrated and the current repo runtime was unblocked through a local SQLite setup.
- Clerk authentication was added with protected admin routing.
- First-login sync was later hardened to reconcile existing local users by `clerkId` first and `email` second.

### Core Records
- Customer creation and listing were implemented.
- Meter registration and assignment were implemented.
- Tariff configuration with active-tier validation was implemented.

### Operations
- Meter reading intake and pending-review workflow were implemented.
- Reading approval, bill generation, and manual payment recording were implemented.
- Printable consumer bill output with issue date, due date, grace period, and disconnection notice was implemented.

### Reporting & Product Surface
- Daily collections reporting was implemented for completed payments in the Manila operating day.
- The marketing site and production-facing admin UI copy were implemented.
- The admin dashboard was redesigned into a stronger operations hub.

## Important Historical Constraints

### Data Platform Constraint
- The repo has now been switched back to a **PostgreSQL-first Prisma runtime**.
- Prisma v7 configuration remains centralized in `prisma.config.ts`.
- A baseline PostgreSQL migration and repeatable environment setup guidance now exist in the repo.
- MVP workflow validation against a live PostgreSQL environment has been completed, so EH1 is now closed.

### Authorization Constraint
- Role-based authorization is now enforced in protected admin routes and server actions.
- Staff access now follows an implemented route and mutation matrix for admin, manager, customer service, meter reader, billing staff, and cashier roles.

### Reporting Constraint
- Reporting now includes **historical collections filters plus receivables visibility** in the admin reporting workspace.
- Overdue and follow-up reporting is now visible, but automated enforcement workflows are still not implemented.
- EH3 is implemented in code and awaiting user validation before it is marked complete.

### Cashiering Constraint
- Payment handling currently assumes the exact-balance manual cashier workflow.
- Official receipts, installment logic, and customer credit handling are not yet implemented.
- This is now tracked under **EH4: Cashiering & Settlement Expansion**.

### Overdue Workflow Constraint
- Bill templates mention penalties and disconnection, but there is **no automated overdue or disconnection workflow** yet.
- This is now tracked under **EH5: Overdue & Disconnection Workflow**.

### Tooling Constraint
- The installed `ui-ux-pro-max` skill had to run in written-rule fallback mode because the local Python path could not execute the searchable script workflow.
- This is now tracked under **EH7: Tooling & Design Workflow Recovery**.

## Enhancement Phase Status

### EH1: Data Platform Hardening
- Status: `complete`
- Notes: PostgreSQL-first runtime, migration baseline, setup guidance, and live-environment validation are complete.

### EH2: Authorization & Staff Controls
- Status: `complete`
- Notes: Protected route access, mutation enforcement, and role-specific read-only fallbacks are now in place.

### EH3: Reporting & Receivables Intelligence
- Status: `in validation`
- Notes: Historical collections filtering, unpaid and partially paid receivables analytics, and overdue visibility are implemented and awaiting validation.

### EH4: Cashiering & Settlement Expansion
- Status: `not started`
- Notes: Relevant once cashier operations outgrow exact-balance manual posting.

### EH5: Overdue & Disconnection Workflow
- Status: `not started`
- Notes: Should follow once receivables visibility and policy decisions are clear.

### EH6: Product Surface Expansion
- Status: `not started`
- Notes: Marketing and consumer-facing expansion remain optional until the business asks for them explicitly.

### EH7: Tooling & Design Workflow Recovery
- Status: `not started`
- Notes: Low product priority, but useful before another major UI redesign cycle.

## Current Next-Step Recommendation
Validate **EH3: Reporting & Receivables Intelligence** in the live UI. Do not begin **EH4** until EH3 validation is accepted.
