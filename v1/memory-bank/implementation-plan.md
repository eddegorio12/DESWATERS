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
- Prisma v7 config now uses `DATABASE_URL` for the live runtime path, while managed-provider deployment guidance still keeps `DIRECT_URL` available as the direct-connection variable for migration and restore workflows where needed.

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
- Admin-account management actions now also persist first-class audit events through `AuthAdminManagementEvent`, and `/admin/staff-access` now exposes a dedicated audit trail for account creation, role changes, activation changes, lockout clearing, and password-reset activity.

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
- EH6 has been user-validated and is now closed. The next public-site work should build on EH14.2 through website fundamentals, conversion clarity, and trust/accessibility proof rather than reopening basic branding work.

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
4. Add protected field-proof image upload support tied to completed work orders.
5. Validate alert accuracy against seeded abnormal cases and recent billing/payment flows.

Current progress:
- `/admin/exceptions` now exists as the first EH9 operational slice, with protected access for admin, billing, cashier, and technician roles plus server-side alert severity modeling.
- The initial rule set now scans live records for missing readings, abnormal consumption spikes or drops, possible leak patterns, duplicate-payment posting patterns, near-disconnection receivables, and service-status mismatches.
- EH9 has now been user-validated for this implemented exception-monitoring slice.
- Complaint intake now also feeds a tested and validated field-service follow-on: `/admin/exceptions` can dispatch complaint-driven work orders with technician assignment, scheduled visits, progress updates, completion logging, and complaint auto-resolution.
- EH9 now also persists user-validated dedicated `LeakReport` records for leak-category complaints and durable `RepairHistory` records whenever field work completes, so leak tracking and completed repair review no longer depend only on mutable queue state.
- EH9 now also adds tested and validated first-class `MeterReplacementHistory` records tied to completed meter-linked work orders, including replaced-to-installed meter linkage, optional final-reading capture, automatic old-meter `REPLACED` state handling, and visible replacement history on `/admin/exceptions` plus `/admin/meters`.
- EH9 now also adds tested and validated `FieldWorkProof` uploads for completed work orders, with protected local storage, protected file serving on `/admin/exceptions/proofs/[proofId]`, and proof review on both active work orders and completed repair history.

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
- `/admin/system-readiness/export` now provides protected CSV and JSON recovery exports covering the current snapshot register, recent login outcomes, environment-readiness flags, and restore checklist.
- EH11 has now been user-validated and is closed for its core scope, with the export/download refinement now also implemented and validated.
- Optional `SUPER_ADMIN` 2FA is now implemented through protected dashboard setup, encrypted TOTP secret storage, one-time recovery codes, sign-in enforcement, and visible staff-access audit state. Deeper restore automation remains a later EH11 refinement only if explicitly approved.

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
- `/admin/routes` now also exposes a user-validated management-analytics slice with billed-versus-collected cycle rows, overdue-aging balance buckets, and disconnection-versus-reinstatement activity that all honor the active route filter/search view.
- `/admin/routes` now also includes a first-class complaint intake panel plus complaint hotspot visibility built from route-linked complaint records instead of inferred proxies.

### EH13: Workflow Usability & Operator Efficiency
**Priority:** High
**Status:** Complete
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
- `/admin/meters` now also uses the shared pattern with server-side search plus registry filters for active, unassigned, unrouted, defective, and replaced units.
- Dashboard hero and sidebar wording are now shorter and more scan-focused, and key high-frequency forms now surface clearer required-versus-optional or next-step guidance.
- The collections and exceptions pass is now validated, and the follow-up priority pass is now also validated.
- `EH13.3a` is now complete as a narrow-screen audit recorded in `memory-bank/eh13.3a-narrow-screen-audit.md`.
- That audit identifies five immediate responsive targets for `EH13.3b`: compact mobile navigation, shared dense-table card fallbacks, tighter dashboard/page hero shells, normalized follow-up action rows, and route-operations density relief on narrower viewports.
- `EH13.3b` is now validated.

### EH14: Visual Composition & Anti-Template Refinement
**Priority:** High
**Status:** Complete
**Depends on:** EH13 complete; benefits from EH6 already being stable

Scope:
1. Reduce repeated card-on-card composition across key admin and marketing surfaces.
2. Strengthen hierarchy through lighter section framing, row/list composition, and clearer dashboard-console primitives.
3. Refine the public website so it feels deployment-ready, not template-assembled.
4. Add website fundamentals on top of the refined marketing direction: metadata, sitemap/robots, social previews, clearer CTA conversion, trust proof, and accessibility verification.

Exit criteria:
- The most visible admin and marketing surfaces no longer depend on equal-weight card grids for basic hierarchy.
- The homepage and secondary marketing routes communicate one clear staff-facing story with stronger public trust signals.
- Public routes are technically ready for sharing and indexing through complete metadata and crawler-facing basics.

Recommended implementation order:
1. Complete the public-site fundamentals pass after EH14.2: canonical/social metadata, sitemap/robots, share previews, and CTA wiring.
2. Roll the lighter composition language across remaining marketing routes.
3. Extend the same composition discipline to adjacent admin summary and directory surfaces.
4. Re-run public-route smoke checks plus accessibility and reduced-motion verification.

Current progress:
- EH14 is now in progress through shared composition primitives, protected-shell cleanup, dashboard-console refinement, and homepage proof-led refinement.
- EH14.1 is now implemented for the admin dashboard and protected shell.
- EH14.2 is now validated for the homepage.
- EH14.3 is now implemented as the public-site fundamentals pass: shared metadata helpers, canonical and social coverage, generated Open Graph and Twitter previews, `robots` plus `sitemap` routes, a dedicated `/contact` rollout path, and stronger trust/conversion panels on the remaining marketing pages.
- EH14.4 now extends the newer composition language to the remaining summary-heavy admin boards: `/admin/staff-access`, `/admin/system-readiness`, and `/admin/tariffs`.
- EH14.5 now validates the public accessibility verification sweep through skip-link support, shared keyboard-focus visibility, navigation `aria-current` state, semantic list cleanup, decorative-icon hiding, and reduced-motion-safe marketing reveal behavior.
- `EH13.4` is now implemented through a shared semantic status-priority layer for pending, overdue, read-only, ready, success, and attention-required states across the active EH13 surfaces plus adjacent admin workflow boards.
- `EH13.5` is now implemented as the final consistency sweep for explicit filter-action wording, roadmap-copy cleanup on live admin pages, and stronger next-step empty states across adjacent admin boards.
- EH13 has now been fully validated and closed as a complete usability lane before post-EH13 roadmap work begins.
- The follow-on EH14 protected-surface review now also reaches `/admin/customers`, `/admin/meters`, and `/admin/routes`, where creation, assignment, transfer, and route-side support panels now inherit the same lighter admin-surface framing used on the already-updated secondary boards.
- The next EH14-adjacent target is now broader EH12 management analytics on top of that stabilized protected-surface baseline.
- EH12 management analytics and later deferred EH9/EH11 refinements should remain sequenced behind the active EH14 rollout unless the user explicitly reprioritizes.

Recommended task sequence:
1. `EH14.1` Admin dashboard console refinement. Implemented.
2. `EH14.2` Landing-page proof-led refinement. Validated.
3. `EH14.3` Website fundamentals: metadata, crawler routes, share previews, and public rollout conversion path. Implemented.
4. `EH14.4` Summary-heavy admin-board composition rollout. Implemented.
5. `EH14.5` Public accessibility verification sweep. Validated.

## Current Next Recommendation

Continue the roadmap from the validated EH12 management analytics slice, with dedicated admin-management audit logging now in place on top of the stabilized EH14 protected-surface baseline.

Target outcomes:
1. Reduce card overuse and nested panel density on the most visible admin and marketing surfaces.
2. Preserve the implemented EH8 through EH13 workflows while making the product feel more deliberate and less template-driven.
3. Keep deployment hardening and Supabase/Vercel setup on the release path while treating composition refinement, analytics, and audit logging as the current product-facing follow-up work.

### EH14: Visual Composition & Anti-Template Refinement
**Priority:** High
**Status:** Validated
**Depends on:** EH13 complete

Scope:
1. Reduce repeated card-on-card composition across dashboard, page shells, record-summary areas, and marketing sections.
2. Replace some equal-weight tile grids used for navigation or supporting content with denser list, row, split-layout, or editorial section patterns.
3. Reserve full card treatments for actionable, stateful, or high-signal content such as queues, alerts, records, and workflow objects.
4. Tighten visual hierarchy by relying more on spacing, typography, dividers, and section rhythm, and less on repeated border-radius-plus-shadow containers.
5. Preserve the current DWDS brand direction and enterprise-operational readability while removing the strongest "vibecoded" signals.

Exit criteria:
- Core admin and marketing entry surfaces no longer feel dominated by repeated equal-weight cards.
- Dashboard hierarchy clearly emphasizes the first taskable area instead of many competing framed blocks.
- Navigation, proof, and summary areas use lighter-weight composition where cards do not add meaning.
- The UI still reads as DWDS and does not regress on scanability, responsiveness, or role-driven workflow clarity.

Recommended implementation order:
1. Audit dashboard, page shell, and marketing-home composition for unnecessary card nesting.
2. Refactor module-launch and proof sections into mixed layout patterns with fewer equal-weight tiles.
3. Normalize shared section primitives so lightweight groups are not forced into the same visual treatment as actionable cards.
4. Revalidate narrow-screen behavior after the hierarchy changes.

Current auth note:
- Local Auth.js migration is now complete and working with a seeded `SUPER_ADMIN`.
- The next auth-related work should focus on production environment setup plus EH11 security controls, not on restoring external identity providers.

Current dependency note:
- Until the production auth variables and first-admin seed are in place, treat the hosted app as staging rather than the final production release.
- For managed Postgres deployment, keep `DATABASE_URL` on the provider pooler/runtime path. Use `DIRECT_URL` as the direct migration or restore connection variable only where the target environment and tooling are configured to consume it.
- EH8 should not be treated as done until finalized bills can no longer be edited through any existing billing or payment mutation path.

Current rollout status:
- Vercel is already building from the `v1` root directory.
- Supabase pooled and direct connection strings have been validated far enough for Prisma to reach the managed database and enumerate the committed migrations.
- Final deployment hardening is not yet closed until migration deployment finishes successfully and the hosted app is confirmed against those environment variables.

Post-EH13 sequencing:
1. Run EH14 visual composition and anti-template refinement.
2. Resume EH12 with broader management analytics.
3. Revisit only later EH11 security refinements beyond the now-implemented optional `SUPER_ADMIN` 2FA if product priorities reopen that lane.

Current progress:
- Shared composition primitives now distinguish lighter-weight sections from full `dwds-panel` cards so summary and navigation content do not always inherit the same heavy treatment.
- `src/features/admin/components/admin-page-shell.tsx` and the protected shell now use fewer nested inset cards and more divider-led grouping for page-level framing.
- `/admin/dashboard` now emphasizes one primary workflow board, one compact KPI strip, and one denser module directory instead of multiple competing card grids.
- The public home and platform pages plus the shared product-showcase component now use editorial row/split-layout patterns instead of repeating equal-weight tile sections.
- `EH14.1` is now implemented through shared `DashboardMetricCard`, `DashboardPanel`, `ActionRow`, and `SectionHeader` primitives plus a tighter `SidebarNavItem` treatment for the protected shell and admin dashboard.
- `EH14.2` is now validated on the homepage itself: the hero now carries one sharper operational promise, the page introduces an early deployment-readiness trust strip, workflow proof is screenshot-led, CTA language now repeats a tighter platform-versus-rollout pair, and the homepage no longer depends on several equal-weight feature-card sections.
- Remaining EH14 work should now continue across the other marketing pages and any secondary admin summary surfaces that still overuse nested bordered tiles.

### EH14.1: Admin Dashboard Console Refinement
**Priority:** Highest within EH14
**Status:** Implemented, pending user validation
**Depends on:** current EH14 composition baseline already in repo

Scope:
1. Refine the existing admin dashboard and protected shell without changing the overall dashboard structure, sidebar placement, or DWDS visual identity.
2. Improve readability through stronger type scale separation, slightly larger body copy, better secondary-text contrast, and less dependence on tiny uppercase helper labels.
3. Tighten the left gradient sidebar into a clearer control panel with stronger active-state treatment, cleaner icon alignment, less noisy helper text, and more deliberate vertical rhythm.
4. Strengthen the top dashboard banner so the primary operation path is more obvious and the banner reads as an operations overview rather than a generic hero.
5. Refine the KPI strip into stricter enterprise counters with more consistent padding, label placement, value hierarchy, and subdued state color handling.
6. Improve the "What needs attention next" and "Open the module you need" panels through denser row design, clearer hover/selection behavior, better alignment of action indicators, and less wasted interior space.
7. Standardize shared dashboard-facing primitives such as `SidebarNavItem`, `DashboardMetricCard`, `DashboardPanel`, `ActionRow`, `StatusBadge`, and `SectionHeader` so later admin surfaces can reuse the same enterprise-console language.

Exit criteria:
- The dashboard still reads as the same DWDS product, not a redesign.
- Sidebar, hero, KPI strip, and main operational panels feel more mature, more readable, and more enterprise-oriented.
- Text hierarchy is clearer at a glance and inactive/helper copy no longer weakens scan speed.
- Hover, active, and button states feel operational and intentional rather than decorative.
- Shared primitives reduce one-off spacing and typography drift in the dashboard layer.

Design guardrails:
- Preserve the left gradient sidebar, DWDS blue/teal/white identity, KPI strip, modular dashboard structure, and internal utility-operations tone.
- Do not add decorative charts, flashy widgets, consumer-SaaS motifs, or playful styling.
- Keep the layout desktop-first and enterprise-dense, but breathable.
- Prefer stronger dividers, disciplined spacing, and clearer type hierarchy over heavier shadows or more rounded containers.

Planned implementation order:
1. Audit and normalize shared dashboard spacing, typography, and radius conventions in the active shell/dashboard components.
2. Refactor sidebar navigation into a reusable high-clarity `SidebarNavItem` pattern with compressed helper copy and stronger active-state cues.
3. Refine the dashboard banner into a clearer operations-overview header with one dominant primary action and cleaner support metadata.
4. Introduce a shared `DashboardMetricCard` treatment and migrate the KPI strip to that pattern.
5. Introduce reusable `DashboardPanel`, `SectionHeader`, and `ActionRow` primitives, then migrate the two main dashboard panels.
6. Re-run dashboard-level visual and responsive validation before extending the refined dashboard language to adjacent admin entry pages.

Current progress:
- `src/features/admin/components/dashboard-console.tsx` now centralizes the shared dashboard-console primitives for metrics, section headers, action rows, and panel framing.
- `src/features/admin/components/dashboard-nav.tsx` now uses a reusable higher-clarity sidebar item treatment with stronger active-state contrast, cleaner icon framing, and tighter helper-copy rhythm.
- `src/app/(dashboard)/layout.tsx` now reads more like a control panel than a stacked marketing sidebar while preserving the current shell structure.
- `src/app/(dashboard)/admin/dashboard/page.tsx` now uses denser metric cards and reusable action rows for both the operational pulse board and module directory.
- Targeted linting and a short Next.js startup pass have completed successfully; user-facing validation is the remaining checkpoint before wider EH14 rollout.

### EH14.2: Landing Page Proof-Led Refinement
**Priority:** Highest within EH14 after EH14.1 validation
**Status:** Implemented, pending user validation
**Depends on:** EH14 composition baseline and current public marketing assets already in repo

Scope:
1. Rebuild the homepage hero around one clear operational promise for DWDS as an internal utility-operations platform.
2. Replace generic or equal-weight feature-card sections with screenshot-led workflow narratives that show meter-to-bill, billing/collections control, and overdue/route operations.
3. Add an early trust-and-readiness strip that confirms deployment fit, internal-auth posture, billing governance, and managed Postgres readiness.
4. Tighten CTA vocabulary so the page repeats only a small set of deliberate actions such as viewing the platform and planning rollout.
5. Clarify product fit for utility operators and administrators, including the fact that DWDS is staff-facing and not a consumer self-service portal.

Exit criteria:
- The homepage communicates one dominant product promise instead of reading like a balanced feature catalog.
- Product proof comes primarily from larger screenshots and workflow outcomes rather than many small tiles.
- Readiness and trust cues appear high enough on the page to support evaluation by operational buyers.
- CTA labels feel deliberate and repeated, not ad hoc.
- The homepage still fits the existing DWDS brand and does not regress into generic SaaS marketing language.

Planned implementation order:
1. Rewrite the homepage hero headline, subcopy, and CTA pair around one stronger operational promise.
2. Add a near-hero trust/readiness strip for internal auth, role controls, printable outputs, billing governance, and deployment posture.
3. Refactor the main body into three screenshot-led workflow sections with concise outcome bullets.
4. Remove or collapse remaining equal-weight feature grids that do not add proof.
5. Rework the final CTA block so the page closes with the same focused CTA language used above the fold.

Current progress:
- `src/app/(marketing)/page.tsx` now centers the homepage hero on one operations-first promise and reuses a tighter CTA pair: `View platform` and `Plan rollout`.
- The homepage now introduces an early readiness strip for internal auth posture, billing governance, managed-Postgres deployment fit, and printable-output coverage.
- Product proof now leans on three large screenshot-led workflow sections covering meter-to-bill control, daily billing-plus-collections oversight, and overdue or route-aware operational follow-through.
- The prior equal-weight module, product-view, reporting, and brand-principle blocks have been collapsed into a denser editorial structure so the homepage reads less like a feature catalog.

### EH14.3: Website Fundamentals & Public Conversion Path
**Priority:** Highest within EH14 after EH14.2 validation
**Status:** Implemented
**Depends on:** EH14.2 validated

Scope:
1. Add canonical and social metadata support across the public routes.
2. Add crawler-facing `robots` and `sitemap` coverage.
3. Generate a share-ready Open Graph and Twitter preview inside the app.
4. Establish one clear public rollout/contact path instead of leaving CTA flow purely informational.
5. Add stronger trust and deployment-readiness framing to the secondary marketing pages.

Exit criteria:
- Public routes expose canonical, Open Graph, and Twitter metadata through shared configuration.
- The app serves `robots.txt`, `sitemap.xml`, and a reusable share image route.
- Public CTA flow leads to one rollout/contact route instead of scattered page-only navigation.
- Secondary marketing pages reinforce trust, governance, and deployment readiness rather than stopping at feature description.

Current progress:
- `src/features/marketing/lib/site-config.ts` and `metadata.ts` now centralize the site URL, public contact email, canonical handling, and social metadata generation.
- `src/app/opengraph-image.tsx`, `src/app/twitter-image.tsx`, `src/app/robots.ts`, and `src/app/sitemap.ts` now provide share-preview generation plus crawler coverage from the app.
- `/contact` now exists as the public rollout-contact route, and the homepage plus secondary marketing pages now drive users toward that single implementation-oriented path.
- Secondary marketing pages now close with repeated trust-and-conversion panels so public messaging stays closer to deployment readiness than to generic brochure copy.

### EH14.4: Summary-Heavy Admin Surface Rollout
**Priority:** High within EH14 after EH14.3
**Status:** Implemented
**Depends on:** EH14.1 and the active shared composition primitives

Scope:
1. Extend the newer divider-led admin composition language to the remaining summary-heavy protected boards.
2. Reduce repeated bordered-card stacking on staff access, system readiness, and tariff registry surfaces.
3. Reuse shared admin-surface primitives instead of introducing another one-off styling branch.

Exit criteria:
- `staff-access`, `system-readiness`, and `tariffs` read as part of the same EH14 admin language as the dashboard and shared shell.
- Summary and management content rely less on nested cards and more on divider-led grouping, compact stat blocks, and denser row composition.
- The updated surfaces still pass lint/build and do not change any underlying server-authoritative workflows.

Current progress:
- `src/features/admin/components/admin-surface-panel.tsx` now defines the shared lighter-weight panel and section-header treatment for these protected admin boards.
- `src/features/auth/components/staff-access-board.tsx` now uses divider-led directory rows, denser account summaries, and less repeated panel framing.
- `src/features/system-readiness/components/system-readiness-board.tsx` now uses the same shared treatment across snapshot logging, environment readiness, restore guidance, history, and recent sign-in signal.
- `src/features/tariffs/components/tariff-list.tsx` plus `/admin/tariffs` now use the same composition baseline for the tariff registry and read-only access state.

### EH14.5: Public Accessibility Verification Sweep
**Priority:** High within EH14 after EH14.4
**Status:** Validated
**Depends on:** EH14.3 public-site baseline

Scope:
1. Verify keyboard traversal and visible focus on the public marketing routes.
2. Add a skip link and other structural navigation affordances where needed.
3. Ensure reduced-motion users do not start with hidden or delayed marketing content.
4. Tighten public navigation semantics such as active-page indication.

Exit criteria:
- Keyboard users can skip directly to main content and retain visible focus treatment across public navigation and CTA controls.
- Marketing reveal components do not leave content hidden when `prefers-reduced-motion` is enabled.
- Public navigation exposes stronger semantic current-page state.

Current progress:
- `src/features/marketing/components/marketing-shell.tsx` now exposes a skip link plus a stable `main` target.
- `src/app/globals.css` now adds shared visible focus treatment for links, buttons, fields, and summary controls.
- `src/features/marketing/components/site-nav.tsx` now exposes `aria-current="page"` for the active public route and stronger focus-visible treatment.
- `src/features/marketing/components/scroll-animate.tsx` now initializes visible state safely for reduced-motion users so content is not hidden by the reveal helper.
- Public marketing content now removes false click affordances from non-interactive homepage summary cards, exposes a labeled footer navigation landmark, and uses more semantic list structure for checklist-style content.
- Decorative Lucide icons used in public marketing copy are now explicitly hidden from assistive technology where they do not add meaning.
- Manual QA across `/`, `/platform`, `/workflows`, `/rollout`, and `/contact` has now passed for keyboard traversal, skip-link behavior, visible focus, active-route semantics, and reduced-motion handling.

### EH14 Follow-On Protected Surface Review
**Priority:** High after EH14.5 validation
**Status:** In progress
**Depends on:** EH14.4 and EH14.5 validated

Scope:
1. Review remaining protected admin boards that still lean on older equal-weight summary-card stacks.
2. Move the clearest lagging surfaces onto the shared `AdminSurfacePanel` and divider-led composition language.
3. Keep queue-heavy workflow areas intact while reducing unnecessary nested framing on supporting summary sections.

Current progress:
- `/admin/collections` now refactors its filter, collections summary, and receivables summary surfaces away from repeated standalone cards into shared admin-surface panels with denser stat rows and grouped follow-up mix treatment.
- `/admin/exceptions` now refactors its detection-policy and severity-overview sections into the same lighter-weight protected-surface language so the alert queue remains the dominant task object.
- `/admin/readings` now moves its field-entry panel, recent-history panel, and read-only fallback onto the same shared admin-surface framing so the page no longer mixes newer queues with older standalone summary cards.
- `/admin/payments` now moves its cashier-entry panel and settlement-preview blocks onto that same lighter-weight composition baseline while preserving the existing payment-history list behavior.
- `/admin/customers`, `/admin/meters`, and `/admin/routes` now also use the same EH14 protected-surface framing for creation, assignment, transfer, and route-side support sections instead of the older equal-weight panel stack.
- `/admin/billing` now also uses that shared EH14 protected-surface language for cycle-governance support sections and open-bill review so the main billing queue no longer sits beside older heavy summary cards.
- `/admin/follow-up` now also uses the same lighter-weight protected-surface framing for the action ladder, communication log, and service-action boards while keeping the bill-level urgency queue as the dominant task object.
- The billing open-bill review and follow-up communication log now also use the shared responsive table fallback with stacked mobile cards, and that narrower-screen EH14 follow-on is now user-validated.
- The dashboard support area now also uses the same protected-surface language for self-service password changes and SUPER_ADMIN two-factor setup, so the account-security controls no longer fall back to the older standalone panel treatment.
- That dashboard account-security slice has now been user-validated.
- The protected printable bill, notice, and receipt routes now also share one reusable print-surface shell for the hero and paper container so document-facing admin pages no longer maintain parallel one-off framing logic.
- The EH14 protected-surface follow-on is now fully validated and should be treated as closed rather than as an active in-progress sweep.
- Targeted linting for the touched collections, exceptions, readings, and payments components has completed successfully.

### EH15: Staff AI Assistant & Knowledge Retrieval
**Priority:** High after the current validated EH14 protected-surface baseline
**Status:** Complete
**Depends on:** EH2 role boundaries, EH14 protected admin baseline, PostgreSQL runtime stability

Scope:
1. Add a protected `/admin/assistant` route for signed-in staff.
2. Implement documentation-first RAG against the `memory-bank` and curated in-app workflow guidance.
3. Keep answers role-aware and read-only in the initial slice.
4. Add narrow live-record explanation lookups only for explicitly requested records within the user’s existing module access.
5. Add citations, uncertainty handling, and per-user chat history.
6. Use OpenRouter with `openrouter/free` as the default primary route plus a configurable fallback model chain.
7. Store retrieval data inside the current PostgreSQL stack, preferably with `pgvector`, instead of adding a separate vector service.

Exit criteria:
- Staff can ask workflow and module-clarification questions from a protected assistant workspace.
- Answers cite the supporting DWDS sources used.
- The assistant refuses or narrows answers outside the user’s role scope.
- V1 remains read-only and cannot trigger workflow mutations.
- Retrieval quality is validated against a fixed internal question set before broader rollout.

Recommended implementation order:
1. Add the feature spec and roadmap documentation for EH15.
2. Define the data model for embeddings, chunks, chat history, and retrieval metadata.
3. Build ingestion/chunking for `memory-bank` and curated workflow guidance.
4. Implement retrieval, reranking, and answer assembly with citations.
5. Add the protected `/admin/assistant` UI and per-user conversation history.
6. Add narrow live-record explanation helpers with role-aware access checks.
7. Run an evaluation pass for workflow, refusal, ambiguity, and record-specific questions.

Current recommendation:
- Start with documentation-first RAG and avoid open-ended querying across all transactional records in the first slice.
- Keep the assistant read-only in V1.
- Use hybrid retrieval with metadata-aware filtering instead of pure semantic search.
- The repo now includes an OpenRouter model-config layer that defaults to `openrouter/free` and falls back to `stepfun/step-3.5-flash:free` then `nvidia/nemotron-3-super-120b-a12b:free` when model-backed answer synthesis is switched on.
- EH15.1 is now validated.
- EH15.2 is now validated as the trust, safety, and governance baseline on top of the validated retrieval path.
- EH15.3 evaluation-plus-observability is now implemented and user-validated in the repo, and `EH15.4` knowledge operations are now implemented and user-validated in the repo.
- EH15 should now be treated as a validated, closed enhancement lane whose current scope remains read-only and governance-first.

Current progress:
- `/admin/assistant` is now live as a protected staff workspace with role-aware guidance search, visible citations, and starter prompts.
- Assistant retrieval is now persisted in PostgreSQL through dedicated assistant knowledge-document and chunk tables plus ingestion-run metadata for `memory-bank` and curated workflow-guide sources.
- The assistant now saves per-user conversation history through dedicated conversation and message tables, and the protected UI now exposes recent saved threads for the signed-in account only.
- The assistant now also supports OpenRouter-backed answer synthesis on top of retrieved role-safe sources, defaulting to `openrouter/free` with a configured free-model fallback chain when the API key is available.
- The current popup-assistant implementation is now tested and validated for its shell-level chat UI, saved-thread behavior, multilingual prompt handling, and tariff-estimate helper path.
- EH15.1 retrieval hardening is now implemented in the repo through tighter section-aware chunking, incremental corpus sync, embedding freshness tracking, hybrid lexical-plus-semantic retrieval, and deterministic source-priority reranking.
- The EH15.1 embedding path now persists embeddings in JSONB so local Postgres works without `pgvector`, while the same retrieval path can also populate an optional `embeddingVector` column whenever the database exposes the `vector` extension.
- Local EH15.1 validation has now completed through Prisma client generation, targeted linting on the touched assistant files, successful migration deployment, and a successful full production `npm run build`.
- EH15.1 has now been user-tested and validated.
- EH15.2 trust/safety/governance has now been user-tested and validated.
- EH15.3 evaluation-plus-observability is now implemented through fixed regression cases, persisted response telemetry, persisted evaluation runs/results, and an admin-visible quality panel on `/admin/assistant`.
- Local EH15.3 validation has now completed through targeted assistant linting and a successful full `tsc --noEmit` pass.
- EH15.3 has now been user-tested and validated.
- EH15.4 knowledge operations are now implemented through admin-facing sync plus curation controls, source diff review, document pin/disable controls, revision-backed rollback, and richer workflow-guide summaries in the protected assistant workspace.
- Local EH15.4 validation has now completed through Prisma client generation, targeted assistant linting, and a successful full `tsc --noEmit` pass.
- EH15.4 has now been user-tested and validated.
- EH15.5 is now implemented through protected live-record explainers for specific bill IDs, receipt numbers, route codes, and targeted exception or follow-up records.
- Broad record-discovery or bulk live-data requests still escalate instead of turning the assistant into an unrestricted transaction search surface.
- Local EH15.5 validation has now completed through targeted assistant linting and a successful full `tsc --noEmit` pass.
- EH15.5 has now been user-tested and validated.

### EH15.1: Retrieval Quality Hardening
**Priority:** Highest within EH15
**Status:** Validated
**Depends on:** current EH15 persisted-storage baseline already in repo

Scope:
1. Add hybrid retrieval using lexical matching plus `pgvector` embeddings.
2. Add reranking before prompt assembly.
3. Improve chunking and metadata filtering by role, module, source type, and route scope.
4. Add source-priority weighting so workflow guides and approved operator-safe material outrank roadmap/progress text for operational queries.
5. Tighten multilingual and informal-query normalization only where it improves retrieval without weakening precision.

Exit criteria:
- Operational questions retrieve workflow-safe guidance ahead of planning text.
- Citation quality improves because the top retrieved chunks are more relevant.
- Retrieval still degrades safely when embeddings, reranking, or the model path are unavailable.

Recommended implementation order:
1. Enable `pgvector` in the PostgreSQL runtime and extend the assistant schema for embeddings and retrieval metadata.
2. Rebuild ingestion to generate stable embeddings and improved chunk metadata.
3. Add hybrid retrieval scoring plus source-priority rules.
4. Add reranking on the top candidate set before final prompt assembly.
5. Compare retrieval outcomes against the fixed assistant validation set.

Current progress:
- `src/features/assistant/lib/assistant-corpus.ts` now applies chunk-size limits and overlap so large markdown sections no longer stay as one retrieval block.
- `src/features/assistant/lib/assistant-store.ts` now performs incremental sync, tracks embedding freshness by content hash, and skips unnecessary full re-ingestion when the corpus is already current.
- Retrieval now merges lexical candidates with embedding-backed semantic candidates when embeddings are available, then reranks them with deterministic source-priority logic so workflow guides and operator-safe material outrank roadmap/progress text for operational questions.
- `prisma/schema.prisma` plus `prisma/migrations/20260329_eh15_retrieval_hardening/` now add the EH15.1 embedding storage path, using JSONB as the guaranteed baseline and optional `pgvector` acceleration when the database exposes the extension.
- `.env.example` now documents the EH15.1 embedding-model controls, and the revised migration path plus full build have both succeeded locally.

### EH15.2: Trust, Safety, and Governance
**Priority:** High within EH15 after EH15.1
**Status:** Validated
**Depends on:** EH15.1 retrieval baseline

Scope:
1. Add an assistant policy layer for allowed, narrowed, refused, and escalation-required requests.
2. Add prompt-injection and secret-exfiltration defenses around retrieved content and final answer assembly.
3. Add source-governance states such as `approved`, `draft`, and `deprecated`.
4. Enforce citation-presence and low-confidence fallback behavior server-side.
5. Keep the assistant read-only while governance and refusal behavior are still being validated.

Exit criteria:
- Unsafe or out-of-scope requests are refused or narrowed consistently.
- Production-safe guidance can be separated from planning or deprecated material.
- The assistant never depends on client-side conventions alone for safety behavior.
- Implementation status:
  - The repo now applies a server-side assistant policy layer that classifies requests into allowed, narrowed, refused, and escalation-required outcomes before answer assembly.
  - Prompt-injection and secret-exfiltration attempts are now refused directly, and suspicious retrieved source content is excluded before synthesis.
  - Assistant knowledge documents now persist governance states so workflow guides stay `approved`, planning-heavy memory-bank sources stay `draft`, and historical status tracking can be marked `deprecated`.
  - Server-side answer assembly now refuses weakly supported responses, requires citation-backed retrieval, and narrows operational answers when only planning-oriented material matches.
  - Local validation has now completed through Prisma generation, targeted assistant-file linting, successful migration deployment, and a successful full production build.
  - EH15.2 has now been user-tested and validated.
  - EH15.3 has now started, been implemented in the repo, and is now user-validated as the next assistant maturity layer.

### EH15.3: Evaluation and Observability
**Priority:** High within EH15 after EH15.2
**Status:** Validated
**Depends on:** EH15.1 and EH15.2

Scope:
1. Build a fixed evaluation set for workflow guidance, module routing, refusal quality, ambiguity handling, multilingual questions, and later record explanations.
2. Log assistant metadata such as latency, model used, retrieval hits, cited hits, fallback path, refusal reason, and failure state.
3. Add an internal quality view for no-hit, low-confidence, and failed-answer patterns.
4. Add regression checks so assistant changes can be validated before rollout.

Exit criteria:
- Assistant quality is measurable rather than anecdotal.
- Retrieval and answer regressions can be detected before shipping.
- The product can identify which question types still fail and why.

Current progress:
- `AssistantResponseLog`, `AssistantEvaluationRun`, and `AssistantEvaluationResult` now persist telemetry plus regression outcomes in PostgreSQL.
- `src/features/assistant/lib/assistant-knowledge.ts` now records latency, disposition, hit counts, cited hit counts, fallback path, refusal reason, and failure state for both user-chat and evaluation-triggered assistant responses.
- `src/features/assistant/lib/assistant-evaluation.ts` now defines a fixed regression set covering workflow routing, policy explanation, role boundaries, ambiguity, multilingual prompts, and safety/escalation cases.
- `/admin/assistant` now exposes an admin-visible quality view with recent flagged prompts, latest suite outcome, and failing evaluation cases.
- Local validation has now completed through targeted assistant linting and a successful full `tsc --noEmit` pass.
- EH15.3 has now been user-tested and validated.

### EH15.4: Knowledge Operations
**Priority:** Medium within EH15 after EH15.3
**Status:** Validated
**Depends on:** EH15.3 validated

Scope:
1. Add admin-facing ingestion and curation controls for assistant knowledge.
2. Support ingestion status, source review, diff visibility, rollback, and source-level disable or pin actions.
3. Expand curated workflow guidance so protected modules rely less on raw planning text and more on operator-safe summaries.
4. Treat knowledge quality as a managed product concern rather than a one-time ingestion task.

Exit criteria:
- Assistant knowledge can be reviewed and controlled without code edits alone.
- Operators see more direct workflow-safe guidance and less planning-heavy language.

Current progress:
- `/admin/assistant` now exposes an admin-only knowledge-operations panel with current sync status, pending-source counts, pinned or disabled source counts, and one-click knowledge sync.
- Assistant knowledge sources now support admin-reviewed governance state, document-level pinning, explicit disable with reason capture, and recorded review timestamps without requiring direct code edits.
- The assistant now stores revision snapshots for managed knowledge documents so admins can compare diff summaries and roll a source back to its previous stored revision from the protected assistant workspace.
- Removed live-corpus sources are now preserved as disabled managed records instead of being silently dropped, so review and rollback remain possible.
- Curated workflow-guide summaries have now been expanded across the protected modules so retrieval can rely more on operator-safe guidance and less on planning-heavy memory-bank text.
- Local validation has now completed through Prisma client generation, targeted assistant linting, and a successful full `tsc --noEmit` pass.
- EH15.4 has now been user-tested and validated.

### EH15.5: Narrow Live-Record Explanations
**Priority:** Medium within EH15 after EH15.4
**Status:** Validated
**Depends on:** EH15.1 through EH15.4

Scope:
1. Add read-only explainers for specific records already visible to the signed-in user.
2. Minimize record payloads to status explanation, supporting facts, and next-step reasoning.
3. Start with high-value domains such as billing status, payment settlement state, follow-up stage, route pressure, and exceptions severity.
4. Keep all live-data answers inside current role scope with explicit server-side authorization checks.

Exit criteria:
- Staff can ask why a visible record shows a given state without broad transactional-data querying.
- Live-record answers remain explanatory, narrow, and auditable.

Current progress:
- The assistant now supports narrow read-only explainers for specific bill IDs, receipt numbers, route codes, and targeted exception or follow-up records shown in the protected DWDS UI.
- Each explainer now runs through explicit server-side module checks before reading live data, so the assistant inherits existing billing, payments, route, follow-up, and exceptions boundaries instead of bypassing them.
- Returned live context is minimized to the status reason, a few supporting facts, visible citation metadata, and related-module next steps rather than dumping raw record payloads.
- The request-policy layer still escalates broad record discovery, list-all, and show-me queries, so EH15.5 expands explanation depth without opening unrestricted live transactional search.
- The assistant evaluation suite now keeps a broad live-record safety case and can also add dynamic live-record explanation cases from the current database when representative records exist.

### EH16: Staff Automation & AI Workers
**Priority:** Medium after the validated EH15.5 baseline
**Status:** In progress
**Depends on:** EH15 validated governance baseline, EH2 role boundaries, PostgreSQL runtime stability

Scope:
1. Add supervised worker runs for bounded internal tasks, with follow-up triage defined as the first EH16 implementation slice.
2. Keep worker output proposal-first and read-only in V1: summaries, recommendations, and ranked queues that staff can review before any action is taken.
3. Persist worker-run, proposal, review, and execution-log records so every automation output remains inspectable and auditable.
4. Keep EH16 advisory-only and move approved operational change paths into a later dedicated lane rather than letting workers mutate records directly inside EH16.
5. Support a pluggable worker runtime or orchestration adapter such as OpenClaw only behind the protected app boundary.
6. Defer broad autonomous multi-step execution, unrestricted record search, payment or billing mutation, and admin-security actions.

Exit criteria:
- Staff can trigger a bounded follow-up triage worker run from the protected follow-up module and review a clear proposal with supporting rationale.
- Worker output remains advisory only and does not execute any DWDS workflow mutation.
- Rejected, expired, or ignored proposals do not mutate records.
- The system exposes enough telemetry to review worker quality, latency, acceptance rate, and failure causes.
- OpenClaw or any equivalent worker runtime remains an implementation detail behind DWDS rather than a second source of truth.

Recommended implementation order:
1. Define the worker data model and proposal-review lifecycle.
2. Ship one read-only worker lane for follow-up triage inside `/admin/follow-up`.
3. Add UI for proposal review, dismissal, and run history in the protected follow-up module.
4. Add observability, evaluation, and refusal rules for out-of-scope worker requests.
5. Only after that, hand off approved execution to a separate follow-on lane instead of broadening EH16 itself.

Technical design note:
- Treat `memory-bank/eh16.1-follow-up-triage-design.md` as the concrete implementation design for the first EH16 slice.

Current recommendation:
- Treat EH16 as supervised orchestration, not autonomous agency.
- Use EH15 retrieval, policy, evaluation, and knowledge-governance primitives as the base context layer for any worker reasoning.
- Keep the first OpenClaw integration behind a server-side adapter so DWDS remains the authority for auth, data access, and mutation rules.
- Keep EH16.1 and EH16.2 as the current proposal-only worker baseline.
- Freeze EH16 as the advisory baseline and move approved execution into EH17 and later lanes.
- Avoid queue infrastructure, background daemons, or direct database write privileges until a narrow production need proves they are required.

Current progress:
- EH16.1 is now implemented in the repo as a proposal-only follow-up triage worker on `/admin/follow-up`.
- The current slice now persists `AutomationRun`, `AutomationProposal`, and `AutomationReview` records in PostgreSQL for bounded worker history and dismissal tracking.
- `/admin/follow-up` now exposes an `AI Triage` panel that can run the bounded worker, show ranked proposals, and dismiss proposals without mutating follow-up stage, notices, or service state.
- The current OpenClaw adapter remains a protected server-side boundary and intentionally falls back to deterministic local triage logic until a real integration is explicitly approved.
- Local validation has now covered Prisma client regeneration, a successful full `tsc --noEmit` pass, realistic sample-data seeding, seeded staff sign-in, in-app triage runs, persisted dismissal behavior, and manual confirmation that workflow mutations remain blocked.
- Initial operator feedback on the refined seeded local cases is now positive, so EH16.1 should remain in active validation as the current bounded worker baseline.
- EH16.2 exception summarization is now implemented in the repo as a proposal-only worker on `/admin/exceptions`.
- The new slice reuses the shared `AutomationRun`, `AutomationProposal`, and `AutomationReview` persistence path, adds `EXCEPTION_SUMMARIZATION` as a worker type, and keeps the current OpenClaw adapter behind the same protected server-side boundary.
- `/admin/exceptions` now exposes an `AI Summary` panel that can run the bounded worker, show ranked exception-review proposals, and dismiss proposals without dispatching field work or mutating billing or service records.
- The active fallback ranks visible alerts by severity plus category priority and generates operator-facing summary notes, suggested review steps, rationale text, and confidence labels while preserving existing module links for human follow-through.
- EH16 should now be treated as complete enough at the advisory-worker level for the currently approved scope.
- The next approved architecture target is EH17 approval-based automation foundation rather than a broader EH16 expansion.

### EH17: Approval-Based Automation Foundation
**Priority:** High after the validated EH16 advisory baseline
**Status:** Validated
**Depends on:** EH16.1 and EH16.2 in place, EH2 role boundaries, EH15 governance baseline

Scope:
1. Add bounded worker action intents such as `PAYMENT_POST`, `FOLLOW_UP_SEND_REMINDER`, or later approved equivalents.
2. Add approval-request persistence with pending, approved, rejected, expired, and executed states.
3. Use Telegram as the approval transport for high-risk or owner-review-required actions.
4. Add execution-log persistence, expiry handling, and replay protection for approved actions.
5. Keep DWDS as the only execution authority for validation, role checks, record mutation, receipts, and audit logs.
6. Keep the planner boundary provider-agnostic so a deterministic or stub planner can prove the workflow before OpenClaw is connected.

Exit criteria:
- A bounded worker can prepare one exact action intent and stop for approval instead of mutating records immediately.
- Telegram can deliver the approval request and return a secure approve or reject signal tied to one exact intent.
- DWDS can execute the approved action through its normal server-authoritative workflow and store the full audit trail.
- Rejected, expired, or mismatched approval requests do not execute anything.

Recommended implementation order:
1. Add action-intent and approval-request schema plus execution-log support.
2. Add Telegram outbound request delivery and secure callback handling.
3. Add deterministic or stub planner plumbing behind the protected adapter.
4. Add observability, expiry handling, replay protection, and refusal behavior before enabling the first execution path.

Current progress:
- Prisma now includes `AutomationActionIntent`, `AutomationApprovalRequest`, and `AutomationExecutionLog` plus enums for approved action type, approval transport, approval status, and execution status.
- The first EH17 execution path is now wired on `/admin/follow-up`, where eligible AI triage proposals can request Telegram approval for exact bounded follow-up actions without broadening into cashier workflows.
- The approval foundation now hashes callback tokens, stores pending-versus-approved-versus-rejected-versus-expired-versus-executed request state, records execution outcomes, and blocks replay after an approval link has already been used.
- Telegram delivery now stays transport-only through `src/features/automation/lib/telegram-transport.ts`, while the callback route at `/api/automation/telegram` returns the decision to DWDS for server-authoritative execution.
- The first approved action path intentionally stays inside receivables follow-up, using the existing DWDS follow-up mutation rules for reminder, final-notice, and disconnection-review advancement instead of starting the later EH18 cashier lane.
- Local validation has now covered Prisma client regeneration, a successful full `tsc --noEmit` pass, and a successful full `eslint` run.
- End-to-end validation has now also covered local schema deployment on the repo Postgres container, real Telegram message delivery, approved follow-up execution through DWDS server rules, rejected-request behavior, and replay blocking on a reused approval link.
- EH17 should now be treated as validated and closed for its current scope, with EH18 as the next active lane.

### EH18: Telegram-First Cashier Assistant
**Priority:** High after EH17
**Status:** Implemented, pending user validation
**Depends on:** EH17 approval foundation, EH4 cashiering baseline, EH2 role boundaries

Scope:
1. Let authorized onsite staff initiate cashier-assist flows from Telegram instead of requiring the web app.
2. Parse free-text payment intake such as payer name plus claimed amount into a bounded `PAYMENT_POST` intent.
3. Ask follow-up questions when multiple bills, ambiguous customers, or partial-payment conditions exist.
4. Support explicit onsite confirmation that payment was physically received before DWDS posts anything.
5. Keep the web app as the audit and monitoring surface for Telegram-originated payment intents and results.

Exit criteria:
- Authorized staff can initiate a payment-intent flow from Telegram.
- The flow can identify one exact bill or request clarification when the input is ambiguous.
- DWDS can post one approved single-bill payment from the Telegram-assisted intent path and return the receipt outcome.
- Partial payments remain explicit and cannot be silently inferred.

Recommended implementation order:
1. Add Telegram user-to-staff identity mapping and conversation-session state.
2. Add free-text payment-intent parsing with deterministic fallback behavior.
3. Add single-bill matching, ambiguity questions, and partial-payment confirmation prompts.
4. Execute approved `PAYMENT_POST` through the existing DWDS payment workflow.
5. Surface Telegram-originated cashier activity inside `/admin/payments` or a linked audit view.

Current progress:
- Prisma now includes `TelegramStaffIdentity` and `TelegramCashierSession`, so linked cashier identities, bounded Telegram conversation state, approval linkage, and payment outcome linkage are persisted in PostgreSQL.
- `/api/automation/telegram` now accepts inbound Telegram webhook messages for linked cashier accounts while preserving the existing approval callback path from EH17.
- The active EH18 baseline now uses deterministic parsing for payer-plus-amount text, open-bill matching, numbered clarification prompts, explicit partial-payment confirmation, and explicit cash-received confirmation before approval is requested.
- Approved `PAYMENT_POST` intents now execute through the existing DWDS payment-posting workflow rather than a second cashier mutation path, and the Telegram origin chat now receives success, rejection, expiry, or failure follow-up messages.
- `/admin/payments` now exposes cashier-owned Telegram identity linking plus a visible Telegram cashier audit panel for recent sessions, approval state, and receipt outcomes.
- Local validation has now covered Prisma client generation, a successful full `tsc --noEmit` pass, a successful full `eslint` run, and successful migration deployment on the local PostgreSQL database.
- EH18 should now be treated as implemented but still pending user validation. EH19 must not start until that validation is complete.

### EH19: OpenClaw Integration
**Priority:** Medium after EH18
**Status:** Validated
**Depends on:** EH17 and EH18 foundations, OpenClaw environment availability

Scope:
1. Replace the deterministic or stub planner with OpenClaw behind the existing protected adapter boundary.
2. Let OpenClaw coordinate bounded clarification, intent preparation, and approval-escalation decisions.
3. Keep provider output constrained to approved intent schemas and never let it call business mutations directly.
4. Support module-specific tools and policy rules while preserving one shared execution authority in DWDS.

Exit criteria:
- OpenClaw can prepare bounded intents and clarification steps without becoming the system of record.
- The same approval, execution, and audit flows continue working if the planner is swapped from stub logic to OpenClaw.
- Provider unavailability still degrades safely to the deterministic fallback where required.

Current progress:
- `src/features/automation/lib/openclaw-gateway.ts` now provides the private OpenClaw gateway client for bearer-authenticated `/v1/responses` requests plus timeout handling and strict structured-output parsing, so provider output remains schema-checked inside DWDS.
- `src/features/automation/lib/openclaw-adapter.ts` is no longer a hardcoded stub. It now sends bounded follow-up, exception, and Telegram cashier-planning prompts to OpenClaw when the gateway URL plus token are configured and still returns `null` on provider failure so the existing deterministic fallback remains authoritative.
- EH16.1 follow-up triage and EH16.2 exception summarization now accept OpenClaw-ranked structured proposals from that shared adapter boundary while preserving the current heuristic ranking path whenever OpenClaw is unavailable or returns invalid output.
- EH18 Telegram cashiering now also uses the same adapter boundary for bounded payment-detail extraction, numbered bill-choice interpretation, partial-payment confirmation, and cash-received confirmation while keeping bill matching, approval creation, payment posting, receipts, and audit logs inside DWDS.
- Worker panels now persist and display provider or model metadata plus visible fallback-reason details, so validation can distinguish a real OpenClaw run from deterministic fallback without inspecting server logs.
- The validated OpenClaw path now uses a dedicated `dwds` agent, normalizes ranking-only provider output into bounded DWDS proposal records, and keeps deterministic fallback active whenever OpenClaw is unavailable, invalid, or returns a nonconforming payload.
- The required environment baseline is a private OpenClaw gateway URL plus bearer token, with optional agent-ID and timeout overrides. The feature remains safe to ship before those values exist because the deterministic baseline still handles all current paths.

### EH20: Specialized Worker Lanes
**Priority:** Medium after EH19
**Status:** Validated
**Depends on:** EH17 through EH19 foundations

Scope:
1. Split long-running or highly specialized work into dedicated worker lanes only when justified by tooling, latency, or approval differences.
2. Support future long-running follow-up queue management.
3. Support future exception investigation workflows with isolated tool access and ownership.
4. Allow different worker policies, queue rules, and approval requirements without giving any worker direct mutation authority.

Exit criteria:
- DWDS can support multiple specialized worker lanes with isolated ownership and policy controls.
- Parallel worker activity does not bypass approval, locking, or audit requirements.
- Multi-lane behavior remains explainable and debuggable from stored run history.

Current progress:
- EH20 has now started with a shared worker-lane registry in `src/features/automation/lib/worker-lanes.ts`.
- `AutomationRun` now persists a first-class `laneKey` plus a stored `laneSnapshot`, so lane ownership, policy version, execution mode, and bounded tool-access summary are preserved with each run instead of staying implicit in worker-specific code.
- The existing follow-up and exceptions workers now create runs through the shared lane registry, using the specialized `FOLLOW_UP_QUEUE` and `EXCEPTION_REVIEW` lane definitions rather than duplicating lane metadata by hand inside each module.
- `/admin/follow-up` and `/admin/exceptions` now expose the current lane label, owner, policy version, execution mode, and bounded tool-access summary on their worker panels so operators can distinguish specialized lanes before broader multi-lane expansion resumes.
- User validation has now confirmed the lane-governance baseline on both `/admin/follow-up` and `/admin/exceptions`, with the expected specialized-lane labels, ownership, policy versions, execution modes, bounded tool-access summaries, and OpenClaw source visibility shown on live worker runs.

### EH21: Autonomous Operations Hardening
**Priority:** Medium after EH20
**Status:** Planned
**Depends on:** EH17 through EH20 foundations

Scope:
1. Add lease handling, retries, supervisor controls, and dead-letter behavior for bounded autonomous operations.
2. Add observability, evaluation, and operational dashboards for intent quality, approvals, execution success, and failure causes.
3. Add stronger replay protection, stale-intent invalidation, and queue ownership controls for parallel worker activity.
4. Prove that bounded background reasoning can run safely before any broader autonomous expansion is considered.

Exit criteria:
- Worker execution quality and failure causes are measurable.
- Long-running or parallel worker operations can be supervised without hidden mutations.
- Operational hardening is in place before any broader autonomous behavior is approved.

### EH12 Follow-On Analytics: Loss-Risk Watchlist
**Priority:** High after the current validated route analytics baseline
**Status:** Implemented
**Depends on:** current EH12 route analytics baseline already in repo

Scope:
1. Add a route-level watchlist for the largest recent billed-versus-collected gaps.
2. Keep the feature explicitly framed as a revenue-loss proxy rather than a physical-loss or complaint model.
3. Reuse existing route, bill, and payment records so the feature does not imply unsupported source-production or complaint analytics.

Exit criteria:
- `/admin/routes` exposes a clearly labeled route watchlist for recent collection-gap pressure.
- The UI states that the metric is a proxy built from recent billed-versus-collected data plus overdue exposure.
- Complaint-area visibility remains deferred until the repo has an approved complaint data model.

Current progress:
- `src/app/(dashboard)/admin/routes/page.tsx` now derives a route loss-risk watchlist from the last three billing months of billed-versus-collected gap plus current overdue exposure.
- `src/features/routes/components/route-scoreboard.tsx` now surfaces that watchlist as a dedicated management panel and explicitly labels it as a revenue-loss proxy.
- The supporting helper layer in `src/features/routes/lib/route-analytics.ts` now includes a shared clamp helper used by the route-risk score calculation.
- Complaint-area visibility is no longer deferred: Prisma now includes a first-class `Complaint` model, `/admin/routes` can log route-linked complaints, and the route scoreboard now ranks complaint hotspots alongside the existing loss-risk proxy.

## Backlog Intake Rule
Any new future work should be added here as a named enhancement phase with:
- priority
- dependency notes
- scope bullets
- exit criteria

Do not append anonymous backlog bullets anymore.
