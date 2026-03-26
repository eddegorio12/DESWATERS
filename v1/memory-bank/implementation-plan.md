# Implementation Plan

This document now serves two purposes:
- capture the **implemented MVP baseline**
- define the **named enhancement roadmap** that replaces the old loose backlog

Developers should not reopen completed MVP steps unless they are fixing regressions or intentionally revising an existing module.

## Implemented MVP Baseline

### Foundation
- Next.js App Router project initialized with TypeScript and Tailwind CSS
- `shadcn/ui` base primitives configured under `src/components/ui`
- Prisma integrated with the validated PostgreSQL-first runtime setup
- Internal Auth.js credentials authentication now protects `/dashboard` and `/admin/*`
- Admin accounts now authenticate directly against Prisma with bcrypt password hashes
- Clerk has now been fully removed from the live auth flow and dependency surface

### Core Utility Records
- Customer management implemented
- Meter registry and customer assignment implemented
- Meter holder transfer history and reassignment workflow implemented
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
- Shared DWDS PNG logo lockup and branded app icons integrated across marketing, auth, and dashboard surfaces
- Public GitHub repo landing page polished with stronger README structure, CI, license, and real redacted product screenshots

## Current Validation Baseline
Use this as the minimum smoke test after major refactors:

1. Public routes `/`, `/platform`, `/workflows`, and `/rollout` load correctly.
2. `/admin/dashboard` loads after sign-in with a valid internal admin account.
3. Core admin routes for customers, meters, tariffs, readings, billing, payments, and collections all render without broken navigation.
4. A customer can still move from meter assignment to reading, bill generation, payment recording, and printable bill view.
5. A currently assigned meter can be transferred to a replacement account holder without deleting the meter or overwriting transfer history.
6. Daily collections still match the sum of completed payments in the active operating-day window.
7. The seeded `SUPER_ADMIN` can sign in at `/sign-in` and reach the protected dashboard successfully.
8. Signed-in admins can update their own password, and SUPER_ADMIN can set a replacement temporary password for staff accounts.
9. Temporary-password accounts are redirected to `/change-password` and cannot open `/dashboard` or `/admin/*` until they complete that change.

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
- Prisma v7 config now also supports the production-style split of pooled `DATABASE_URL` runtime connections and direct `DIRECT_URL` migration connections needed by managed providers such as Supabase.

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
- There is no public signup path for DWDS admin access.
- `/admin/staff-access` is now the SUPER_ADMIN-only admin management surface.
- Active versus inactive admin access is now enforced directly in the auth layer.
- The local migration, seeded super-admin path, and sign-in verification have now been completed successfully.
- Password management is now minimally covered through self-service password change and SUPER_ADMIN temporary-password reset actions.
- Temporary-password enforcement is now active through Auth.js session flags, route protection, and server-side authorization checks.

Implemented role access expectations:
- `SUPER_ADMIN`: full access across all protected admin modules plus admin management.
- `ADMIN`: full operational access across all protected admin modules and sensitive mutations.
- `TECHNICIAN`: customer and meter modules only.
- `METER_READER`: dashboard plus reading-entry workspace, including deletion of their own pending readings only.
- `BILLING`: tariff visibility, reading approval, billing, and collections visibility.
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
- The shared DWDS logo lockup now uses transparent PNG brand assets across the navbar, footer, auth shell, and dashboard hero, with branded browser/app icons under `src/app/`.
- EH6 has been user-validated and is now closed. Do not begin EH7 unless the user explicitly approves that tooling work.

### EH7: Tooling & Design Workflow Recovery
**Priority:** Low
**Status:** Complete
**Depends on:** local environment fixes

Scope:
1. Restore executable local Python support for the installed `ui-ux-pro-max` workflow.
2. Re-enable the searchable design-system script for future UI passes.

Exit criteria:
- The local design skill can run in its intended search-assisted mode instead of written-rule fallback.

Current progress:
- The `ui-ux-pro-max` Python entrypoints now register their script directory before importing sibling modules, so execution no longer depends on interpreter-specific default import behavior.
- DWDS now includes `scripts/run-ui-ux-pro-max.ps1`, which skips the broken Windows Store `python.exe` alias and locates a usable local interpreter instead.
- `package.json` now exposes `npm run design:search -- ...` as the stable repo entrypoint for searchable design-system and domain lookups.
- Search and `--design-system` execution have been verified successfully from the repo after the recovery work.

### EH8: Billing Governance & Distribution Controls
**Priority:** Highest
**Status:** Complete
**Depends on:** EH1 and EH2 complete; benefits from EH4 and EH5 being complete

Scope:
1. Add billing-period lifecycle controls for open, closed, draft, and finalized states.
2. Lock bills after finalization and restrict billing reopen actions to `SUPER_ADMIN`.
3. Require an audit reason when regenerating a bill batch.
4. Add monthly billing batches with print and distribution workflow tracking.
5. Support print grouping by zone, route, or purok plus single-bill reprint.
6. Track printed, distributed, returned, and failed-delivery statuses with assigned staff and dates.
7. Add a month-end billing checklist so closeout becomes operationally explicit.

Exit criteria:
- Staff cannot accidentally edit or regenerate finalized billing data without an authorized workflow.
- Monthly bill printing and home distribution are tracked as operational states, not ad hoc actions.
- Audit history clearly shows who finalized, reopened, regenerated, printed, and distributed billing batches.

Recommended implementation order:
1. Introduce billing-cycle and bill-batch data model changes.
2. Add finalization, locking, reopen, and regeneration server rules.
3. Add print-batch creation plus print/distribution status transitions.
4. Add month-end checklist UI and validation.
5. Re-run full billing, payment, and printable-output smoke tests.

Current progress:
- Prisma now models `BillingCycle`, `BillPrintBatch`, and `BillingCycleEvent`, while `Bill` now carries lifecycle-lock and physical-distribution fields.
- Bill generation now auto-attaches records to a month-specific billing cycle and blocks new bills once that cycle is closed or finalized.
- The billing workspace now exposes the EH8 checklist, close/finalize controls, SUPER_ADMIN reopen flow, audited regeneration reason capture, print-batch creation, batch print access, distribution state transitions, and audit history.
- Printable bill views now surface EH8 lock/distribution context and can log single-bill reprints into the cycle audit trail.
- Batch print output now renders as consumer-bill-first A5-ready pages without inheriting the dashboard operations-console shell.
- EH8 has been user-validated and is now closed.

### EH9: Operational Exceptions & Field Service Workflow
**Priority:** High
**Status:** Complete
**Depends on:** EH8 recommended for stable billing state; EH2 required for role boundaries

Scope:
1. Add exception detection for missing readings, abnormal consumption, possible leaks, duplicate payments, and status mismatches.
2. Add complaint ticketing and technician assignment.
3. Add work-order lifecycle tracking for field operations.
4. Add repair history, leak report tracking, meter replacement history, and field-proof photo support.

Exit criteria:
- Admins can identify operational anomalies from a dedicated workspace without manually scanning records.
- Complaints and technician work are traceable from intake through resolution.
- Field actions can be tied back to consumers, meters, and service history.

Recommended implementation order:
1. Define exception rules and alert severity model.
2. Add complaint, work-order, and service-history schema support.
3. Build protected exception-monitoring and field-service routes.
4. Add optional photo upload path only when storage is explicitly enabled.
5. Validate alert accuracy against seeded abnormal cases and recent billing/payment flows.

Current progress:
- `/admin/exceptions` now exists as the first EH9 operational slice, with protected access for admin, billing, cashier, and technician roles plus server-side alert severity modeling.
- The initial rule set now scans live records for missing readings, abnormal consumption spikes or drops, possible leak patterns, duplicate-payment posting patterns, near-disconnection receivables, and service-status mismatches.
- EH9 has now been user-validated for this implemented exception-monitoring slice.
- Complaint ticketing, technician assignment, work-order lifecycle tracking, repair history, leak-report records, and optional photo upload support remain deferred until explicitly approved as a future expansion pass.

### EH10: Consumer Communication & Notice Management
**Priority:** Medium
**Status:** Complete
**Depends on:** EH5 complete; EH8 recommended; EH9 optional for service-related notices

Scope:
1. Add printable notice templates for billing reminders, overdue reminders, and disconnection notices.
2. Add reconnection confirmations and service interruption announcements.
3. Keep notice generation tied to billing, follow-up, and service-status data.
4. Preserve notification logging and approval context for each generated notice.

Exit criteria:
- Staff can produce standardized notices from the system without external templates.
- Generated notices are traceable to the relevant billing, follow-up, or service event.
- Notice content remains consistent with current account status and workflow stage.

Recommended implementation order:
1. Define template types and shared notice data contracts.
2. Build printable server-rendered notice views.
3. Add notice generation actions from follow-up, billing, and service screens.
4. Extend notification logs to cover printed/manual notices as first-class records.

Current progress:
- Notification logging now supports printable customer notices as first-class `PRINT` communication records.
- A standalone printable notice route now exists at `/admin/notices/[notificationId]`.
- Bill detail and follow-up workflows can now generate standardized billing reminders, overdue reminders, final notices, and disconnection notices from authoritative records.
- Service disconnection and reinstatement actions now also leave printable notice records in the communication log.
- EH10 has now been user-validated and closed. Broader interruption-announcement rollout remains pending for a later approved EH10 refinement only if requested.

### EH11: Tariff Governance, Backup Recovery, and Admin Security
**Priority:** Highest
**Status:** Complete
**Depends on:** EH1 and EH2 complete

Scope:
1. Add tariff versioning with effectivity dates plus audit history for rate changes.
2. Add minimum-bill, penalty, and reconnection-fee settings with explicit change tracking.
3. Add backup-status visibility, monthly snapshot exports, and restore-procedure documentation surfaces.
4. Add stronger internal admin protections: forced password reset for new admins, session timeout, failed-login lockout, optional `SUPER_ADMIN` 2FA, IP/device logs, and login history.

Exit criteria:
- Each billing cycle can be traced to the tariff rules active at generation time.
- Backup and restore readiness is visible and documented from within operations.
- Internal admin access has production-safe baseline safeguards for a money-handling system.

Recommended implementation order:
1. Add tariff-version and billing-rule schema support.
2. Attach billing generation to effective tariff snapshots instead of mutable current settings.
3. Add login audit and session-security controls within the existing Auth.js model.
4. Expose backup status, exports, and restore documentation in an admin-only operations surface.
5. Validate auth edge cases, tariff roll-forward behavior, and rollback/recovery documentation.

Current progress:
- Tariffs now save as versioned, effectivity-dated records with change reasons, penalty/reconnection settings, and lightweight tariff audit events.
- New bill generation now links each bill to the tariff version used at generation time through `Bill.tariffId`.
- Auth.js credentials sign-in now records login attempts, captures IP and user-agent metadata when available, enforces failed-login lockout, and uses a shorter session lifetime.
- `/admin/staff-access` now shows lockout state plus recent login history, and `SUPER_ADMIN` can clear a locked account.
- `/admin/system-readiness` now exposes backup snapshot logging, environment-readiness checks, and an in-app restore checklist.
- EH11 has now been user-validated and is closed.
- Optional `SUPER_ADMIN` 2FA, automated backup/export downloads, and deeper restore automation remain pending only as later EH11 refinements if explicitly approved.

### EH12: Route Operations & Management Analytics
**Priority:** Medium
**Status:** Complete
**Depends on:** EH8 for route-based bill batches; EH9 recommended for richer field metrics

Scope:
1. Add route assignment per meter reader and bill distributor.
2. Add route-based print batches, overdue lists, and zone performance reporting.
3. Add management dashboards for collection efficiency, overdue aging, top delinquent zones, high-loss/high-complaint areas, average consumption per zone, billed-versus-collected trends, and disconnection-to-reconnection trends.

Exit criteria:
- Daily route operations can be planned and reviewed directly in the system.
- Managers can evaluate collection performance and problem areas without assembling data manually.
- Analytics remain derived from authoritative transactional records in the main application database.

Recommended implementation order:
1. Add route, zone, and assignment data structures.
2. Extend billing/distribution and readings workflow to use route ownership.
3. Build route-focused operational reports.
4. Add management dashboards using server-side queries first, with charting only if needed.

Current progress:
- Prisma now models `ServiceZone`, `ServiceRoute`, and `StaffRouteAssignment`, while `Meter` and `BillPrintBatch` now carry linked route/zone references.
- `/admin/routes` now exists as the first EH12 workspace for zone setup, route setup, staff route ownership, meter-route mapping, and route/zone performance visibility.
- `METER_READER` reading entry now narrows available meters by active route ownership, and routed meter details now surface inside the readings and meters workflows.
- Route-grouped and zone-grouped print batches now persist linked route/zone IDs when all selected bills belong to a single mapped route or zone.
- Billing print and distribution tracking now auto-filters bill selection by grouping, derives default batch labels from the chosen scope, and can auto-fill the assigned distributor from route ownership.
- EH12 has now been user-validated for this implemented route-operations slice.
- Broader management dashboards for billed-versus-collected trends, top-loss/high-complaint areas, and disconnection-to-reconnection trends remain pending.

### EH13: Workflow Usability & Operator Efficiency
**Priority:** High
**Status:** In Progress
**Depends on:** EH2 complete; benefits from EH8 through EH12 being stable

Scope:
1. Simplify dashboard and navigation copy so role-relevant actions are easier to scan.
2. Add reusable search, filtering, status-chip, and empty-state patterns to record-heavy modules.
3. Tighten high-frequency create/edit forms with clearer required-versus-optional input and stronger next-step guidance.
4. Improve narrow-screen and tablet resilience for dashboard sections and table-heavy operational pages.
5. Standardize visual priority treatment for pending, overdue, read-only, success, and attention-required states.

Exit criteria:
- Daily-use operator screens are faster to scan and require less explanatory copy.
- Core record modules expose search/filter controls consistently where volume justifies them.
- High-frequency workflows guide staff clearly to the next operational action after a successful save.
- Usability improvements remain modular and do not weaken role boundaries, auditability, or server-authoritative business logic.

Recommended implementation order:
1. Simplify `/admin/dashboard` and sidebar/navigation wording plus action emphasis.
2. Add a shared list-surface interaction pattern to customers, readings, billing, and payments.
3. Tighten record-create and queue-review forms with clearer feedback and next-step prompts.
4. Audit narrow-screen fallback layouts for dashboard cards, tables, and key admin pages.

Current progress:
- The usability assessment is now recorded across the memory-bank.
- Architecture guidance now treats lower operator effort and reduced interface density as the next planning target.
- The first EH13 slice is now implemented on `/admin/dashboard`, `/admin/customers`, `/admin/readings`, `/admin/billing`, and `/admin/payments`.
- A shared record-list section now provides search inputs, optional filters, reset actions, result counts, empty-state handling, and next-step prompts without changing server-authoritative business logic.
- The customer registry, pending readings queue, approved-reading billing queue, and payment history now use that shared pattern with server-side `searchParams` handling.
- Dashboard hero and sidebar wording are now shorter and more scan-focused, and key high-frequency forms now surface clearer required-versus-optional or next-step guidance.
- Narrow-screen fallback auditing and rollout of the shared list pattern to more record-heavy modules remain pending inside EH13.

## Current Next Recommendation

Continue EH13. Improve operator efficiency on the existing product surface before reopening broader expansion work.

Target outcomes:
1. Extend the shared list pattern to more record-heavy modules and keep the filter vocabulary consistent.
2. Audit tablet and narrow-laptop behavior on dashboard cards, tables, and queue surfaces.
3. Preserve the implemented EH8 through EH12 workflows while making them faster and easier to operate.
4. Keep deployment hardening and Supabase/Vercel setup on the release path, but treat workflow usability as the active product-facing improvement lane.

Current auth note:
- Local Auth.js migration is now complete and working with a seeded `SUPER_ADMIN`.
- The next auth-related work should focus on production environment setup plus EH11 security controls, not on restoring external identity providers.

Current dependency note:
- Until the production auth variables and first-admin seed are in place, treat the hosted app as staging rather than the final production release.
- For managed Postgres deployment, keep `DATABASE_URL` on the provider pooler/runtime path and `DIRECT_URL` on the provider direct migration path.
- EH8 should not be treated as done until finalized bills can no longer be edited through any existing billing or payment mutation path.

Current rollout status:
- Vercel is already building from the `v1` root directory.
- Supabase pooled and direct connection strings have been validated far enough for Prisma to reach the managed database and enumerate the committed migrations.
- Final deployment hardening is not yet closed until migration deployment finishes successfully and the hosted app is confirmed against those environment variables.

## Backlog Intake Rule
Any new future work should be added here as a named enhancement phase with:
- priority
- dependency notes
- scope bullets
- exit criteria

Do not append anonymous backlog bullets anymore.
