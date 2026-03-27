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
- `EH13.4` is now implemented through a shared semantic status-priority layer for pending, overdue, read-only, ready, success, and attention-required states across the active EH13 surfaces plus adjacent admin workflow boards.
- `EH13.5` is now implemented as the final consistency sweep for explicit filter-action wording, roadmap-copy cleanup on live admin pages, and stronger next-step empty states across adjacent admin boards.
- EH13 has now been fully validated and closed as a complete usability lane before post-EH13 roadmap work begins.
- EH12 management analytics, dedicated admin-management audit logging, and later deferred EH9/EH11 refinements should remain sequenced behind this active EH13 completion pass unless the user explicitly reprioritizes.

Recommended task sequence:
1. `EH13.2a` Meters list-surface upgrade. Completed.
2. `EH13.2b` Routes workspace scanability pass. Validated.
3. `EH13.2c` Collections and exceptions consistency pass. Validated.
4. `EH13.2d` Follow-up workspace priority pass. Validated.
5. `EH13.3a` Narrow-screen audit across dashboard, navigation, queues, and table-heavy modules. Completed and validated.
6. `EH13.3b` Responsive fallback patterns for dense tables and action-heavy surfaces. Implemented and validated.
7. `EH13.4` Shared visual priority system for pending, overdue, read-only, ready, success, and attention-required states. Implemented.
8. `EH13.5` Final usability sweep for copy, filter vocabulary, empty states, and next-step cues. Implemented.

## Current Next Recommendation

EH13 is now closed. Continue the focused EH14 visual-composition rollout across the remaining marketing and admin summary surfaces, then resume the roadmap with broader EH12 management analytics, then dedicated admin-management audit logging.

Target outcomes:
1. Reduce card overuse and nested panel density on the most visible admin and marketing surfaces.
2. Preserve the implemented EH8 through EH13 workflows while making the product feel more deliberate and less template-driven.
3. Resume broader EH12 management analytics on top of that more stable visual baseline.
4. Add dedicated admin-management audit logging without reopening the completed EH13 workflow-usability lane.
5. Keep deployment hardening and Supabase/Vercel setup on the release path while treating composition refinement, analytics, and audit logging as the current product-facing follow-up work.

### EH14: Visual Composition & Anti-Template Refinement
**Priority:** High
**Status:** In progress
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
3. Add dedicated admin-management audit logging.
4. Revisit later EH11 refinements such as optional `SUPER_ADMIN` 2FA and automated backup/export support only if still needed.
5. Revisit later EH9 field-service expansion only if operations explicitly prioritizes it.

Current progress:
- Shared composition primitives now distinguish lighter-weight sections from full `dwds-panel` cards so summary and navigation content do not always inherit the same heavy treatment.
- `src/features/admin/components/admin-page-shell.tsx` and the protected shell now use fewer nested inset cards and more divider-led grouping for page-level framing.
- `/admin/dashboard` now emphasizes one primary workflow board, one compact KPI strip, and one denser module directory instead of multiple competing card grids.
- The public home and platform pages plus the shared product-showcase component now use editorial row/split-layout patterns instead of repeating equal-weight tile sections.
- `EH14.1` is now implemented through shared `DashboardMetricCard`, `DashboardPanel`, `ActionRow`, and `SectionHeader` primitives plus a tighter `SidebarNavItem` treatment for the protected shell and admin dashboard.
- `EH14.2` is now implemented on the homepage itself: the hero now carries one sharper operational promise, the page introduces an early deployment-readiness trust strip, workflow proof is screenshot-led, CTA language now repeats a tighter platform-versus-rollout pair, and the homepage no longer depends on several equal-weight feature-card sections.
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

## Backlog Intake Rule
Any new future work should be added here as a named enhancement phase with:
- priority
- dependency notes
- scope bullets
- exit criteria

Do not append anonymous backlog bullets anymore.
