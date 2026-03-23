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

### Database Constraint
- The repo currently uses **SQLite for local development** because the earlier PostgreSQL path was blocked during setup.
- Prisma v7 configuration is handled through `prisma.config.ts`.
- The current runtime uses `@prisma/adapter-better-sqlite3`.
- This remains the main technical debt item and is now tracked under **EH1: Data Platform Hardening**.

### Authorization Constraint
- Local users have a `role`, but the app does **not yet fully enforce role-based authorization** across modules.
- This is now tracked under **EH2: Authorization & Staff Controls**.

### Reporting Constraint
- Reporting currently stops at **current-day collections**.
- Historical filters, receivables analytics, and overdue analysis are not yet implemented.
- This is now tracked under **EH3: Reporting & Receivables Intelligence**.

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
- Status: `not started`
- Notes: Highest-priority technical debt. Should be completed before treating the system as environment-ready beyond the current local flow.

### EH2: Authorization & Staff Controls
- Status: `not started`
- Notes: Required before the current role model can be considered operationally safe.

### EH3: Reporting & Receivables Intelligence
- Status: `not started`
- Notes: Needed to fulfill the broader reporting expectations implied by the product vision.

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
Start with **EH1: Data Platform Hardening** unless a business-driven need makes authorization or reporting more urgent in the short term.
