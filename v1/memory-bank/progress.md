# Project Progress

## Summary
- The DWDS MVP is implemented and the memory-bank now treats that MVP as the baseline rather than an active checklist.
- There are **no open MVP blockers** recorded in the memory-bank.
- Future work is now tracked as named enhancement phases `EH1` through `EH7`.
- Clerk has now been removed from the live repo and replaced with internal Auth.js credentials authentication.
- Internal admin password management is now available through a signed-in change-password form and a SUPER_ADMIN set-temporary-password flow.
- Temporary-password accounts are now blocked from `/dashboard` and `/admin/*` until they complete a required password change.
- EH3 and EH4 have now been validated.
- EH5 has now been validated, including the email-first follow-up notification path.
- EH6 has now been validated after public-surface testing.
- EH7 has now restored the searchable local design-tooling workflow.
- The public GitHub repository surface has now been cleaned up with a stronger root README, CI workflow, license, and real redacted product screenshots.
- DWDS now includes a custom PNG logo system with transparent brand asset handling, shared marketing/auth/dashboard lockups, and branded browser/app icons.
- DWDS deployment planning now uses Supabase Postgres as the practical managed database target, with pooled runtime connections and direct migration connections validated from the repo.

## Implemented Milestones

### Foundation & Auth
- Next.js App Router, TypeScript, Tailwind CSS, and `shadcn/ui` were initialized successfully.
- Prisma was integrated and the current repo runtime was unblocked through a local SQLite setup.
- Internal Auth.js credentials authentication now protects `/dashboard` and `/admin/*`.
- Admin accounts now authenticate directly against the Prisma `User` table with bcrypt password hashes.
- SUPER_ADMIN now manages admin access internally instead of relying on external identity provisioning.
- A local seeded `SUPER_ADMIN` account has now been verified to sign in successfully after the migration.
- Signed-in admins can now change their own password from the dashboard.
- SUPER_ADMIN can now set a replacement temporary password for any admin account from the admin-management page.
- Newly created admins and password-reset admins are now forced through `/change-password` before they can access protected modules.

### Core Records
- Customer creation and listing were implemented.
- Meter registration and assignment were implemented.
- Meter holder replacement with transfer history, effective date, and turnover reading capture was implemented.
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
- The marketing header and footer plus auth and dashboard entry surfaces now use the shared DWDS logo lockup with refined size handling for each placement.
- The repository root now presents the product more clearly for public review, including real redacted screenshots of the dashboard, billing, and follow-up surfaces.

## Important Historical Constraints

### Data Platform Constraint
- The repo has now been switched back to a **PostgreSQL-first Prisma runtime**.
- Prisma v7 configuration remains centralized in `prisma.config.ts`.
- A baseline PostgreSQL migration and repeatable environment setup guidance now exist in the repo.
- MVP workflow validation against a live PostgreSQL environment has been completed, so EH1 is now closed.
- Supabase pooler-based `DATABASE_URL` plus direct `DIRECT_URL` testing now reaches the managed Postgres target from the repo, and Prisma can enumerate the committed migrations against that environment.

### Authorization Constraint
- Role-based authorization is now enforced in protected admin routes and server actions.
- Staff access now follows an implemented route and mutation matrix for super admin, admin, technician, meter reader, billing, cashier, and viewer roles.
- There is no public registration path for DWDS admin access. Admin accounts are created internally by SUPER_ADMIN users.
- The `/admin/staff-access` surface is now the internal admin-management page for account creation, role updates, and activation state changes.

### Meter Account Transfer Constraint
- Meter ownership changes are now modeled as account-holder transfers, not meter replacement.
- The active holder still lives on `Meter.customerId` for compatibility with existing reading and billing flows.
- Transfer events are now recorded in `MeterHolderTransfer` with previous holder, new holder, effective date, optional turnover reading, and optional reason.
- Historical reading pages still resolve holder display from the meter's current `customerId`, so holder-as-of-reading-date display remains a future refinement.

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
- The Windows Store `python.exe` alias remains broken on this machine, but DWDS now bypasses it through a repo-local launcher that resolves a usable interpreter and restores searchable skill execution.

### Deployment Readiness Constraint
- The current product is ready to be positioned as a staff/admin utility operations system plus public marketing site.
- The consumer portal remains deferred and should not be implied in deployment or repo copy.
- The next operational step is production deployment setup, with Vercel currently treated as the preferred hosting target.
- Production readiness still depends on real PostgreSQL, secure Auth.js environment configuration, and first-admin bootstrap in the target environment.
- Until production auth variables and the first seeded admin are in place, the Vercel deployment should be treated as a staging surface rather than the final public production release.
- Supabase is now the practical managed Postgres target for the next deployment pass, but the database password should be rotated because it was exposed during connection troubleshooting.

## Enhancement Phase Status

### EH1: Data Platform Hardening
- Status: `complete`
- Notes: PostgreSQL-first runtime, migration baseline, setup guidance, live-environment validation, and Supabase pooled/direct connection validation are complete.

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
- Notes: Marketing expansion is implemented and user-validated through brand assets, product previews, stronger deployment-ready copy, shared DWDS logo integration, and branded app icons. Consumer portal routes remain unstarted.

### EH7: Tooling & Design Workflow Recovery
- Status: `complete`
- Notes: Search-assisted `ui-ux-pro-max` execution now works through `scripts/run-ui-ux-pro-max.ps1` and `npm run design:search -- ...`, with sibling Python imports hardened inside the skill entrypoints.

## Current Next-Step Recommendation
The next recommended step is to **finish Vercel deployment setup** for the current staff/admin DWDS product surface by closing the remaining infrastructure tasks: successful Supabase migration deployment, production Auth.js environment setup, and first-admin bootstrap.
