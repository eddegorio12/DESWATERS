# Project Progress

## Summary
- The DWDS MVP is implemented and the memory-bank now treats that MVP as the baseline rather than an active checklist.
- There are **no open MVP blockers** recorded in the memory-bank.
- Future work is now tracked as named enhancement phases `EH1` through `EH7`.
- EH3 and EH4 have now been validated.
- EH5 has now been validated, including the email-first follow-up notification path.
- EH6 has now been validated after public-surface testing.

## Implemented Milestones

### Foundation & Auth
- Next.js App Router, TypeScript, Tailwind CSS, and `shadcn/ui` were initialized successfully.
- Prisma was integrated and the current repo runtime was unblocked through a local SQLite setup.
- Clerk authentication was added with protected admin routing.
- First-login sync was later hardened to reconcile existing local users by `clerkId` first and `email` second.
- Staff access now requires explicit admin or manager approval for first-time Clerk accounts before the dashboard opens.

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
- The public marketing site now includes reusable DWDS brand assets, screenshot-style product previews, and clearer deployment-ready rollout messaging.

## Important Historical Constraints

### Data Platform Constraint
- The repo has now been switched back to a **PostgreSQL-first Prisma runtime**.
- Prisma v7 configuration remains centralized in `prisma.config.ts`.
- A baseline PostgreSQL migration and repeatable environment setup guidance now exist in the repo.
- MVP workflow validation against a live PostgreSQL environment has been completed, so EH1 is now closed.

### Authorization Constraint
- Role-based authorization is now enforced in protected admin routes and server actions.
- Staff access now follows an implemented route and mutation matrix for admin, manager, customer service, meter reader, billing staff, and cashier roles.
- Unknown Clerk accounts are no longer auto-approved into DWDS staff access. They now create pending requests that must be approved from an admin review queue.

### Reporting Constraint
- Reporting now includes **historical collections filters plus receivables visibility** in the admin reporting workspace.
- Overdue and follow-up reporting is now visible, but automated enforcement workflows are still not implemented.
- EH3 has been user-validated and is now closed.

### Cashiering Constraint
- Cashier posting now supports auditable partial settlements plus printable official receipts.
- Customer credit and overpayment handling are still not implemented.
- EH4 has been user-validated and is now closed.

### Overdue Workflow Constraint
- Receivables now include an explicit overdue follow-up workspace with reminder, final-notice, disconnection-review, disconnection, and reinstatement workflow states.
- Bill overdue status is now evaluated operationally on the server instead of remaining display-only language on printed statements.
- EH5 now includes a low-cost notification foundation: customer email capture, notification logging, Resend-ready email delivery, and Semaphore-ready SMS delivery.
- By default, email is attempted for all EH5 customer notices, while SMS is limited to higher-priority templates unless `DWDS_NOTIFICATION_SMS_TEMPLATES` is expanded.
- EH5 has been user-validated and is now closed.

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
- Status: `complete`
- Notes: Historical collections filtering, unpaid and partially paid receivables analytics, and overdue visibility are implemented and validated.

### EH4: Cashiering & Settlement Expansion
- Status: `complete`
- Notes: Official receipt generation and explicit partial-settlement cashiering are implemented and validated. Customer credit handling remains deferred.

### EH5: Overdue & Disconnection Workflow
- Status: `complete`
- Notes: Dedicated receivables follow-up workflow, server-side overdue status syncing, disconnection tracking, reinstatement guardrails, and low-cost SMS/email notification plumbing are implemented and validated.

### EH6: Product Surface Expansion
- Status: `complete`
- Notes: Marketing expansion is implemented and user-validated through brand assets, product previews, and stronger deployment-ready copy. Consumer portal routes remain unstarted.

### EH7: Tooling & Design Workflow Recovery
- Status: `not started`
- Notes: Low product priority, but useful before another major UI redesign cycle.

## Current Next-Step Recommendation
EH6 is closed. EH7 remains not started and should stay deferred unless the user explicitly asks to recover the local design-tooling workflow.
