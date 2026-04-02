# Product Requirements Document

## Product Name
**DEGORIO WATER DISTRIBUTION SERVICES (DWDS) Water Utility Management System**

## Product Goal
Build a modular, robust web-based utility operations system that starts with a staff-facing admin app and can later expand into customer-facing channels without splitting the platform into separate products.

## Current State
- The **MVP admin web app is implemented**.
- The current live surface covers authentication, customer records, meter management, tariff setup, reading intake and approval, billing, payment encoding, printable consumer bills, daily collections reporting, and a public marketing site.
- Meter management now includes current-holder replacement with auditable transfer history rather than direct silent reassignment.
- The repo now runs on a validated **PostgreSQL-first data path**.
- The repo now uses internal Auth.js credentials authentication instead of Clerk.
- Internal password management now exists for signed-in admins and SUPER_ADMIN-managed temporary-password resets.
- Temporary-password accounts are now forced to rotate that password before they can access the protected dashboard.
- EH3 reporting expansion is validated and closed.
- EH4 cashiering expansion is validated and closed.
- EH5 overdue, disconnection, and email-first follow-up notification support are validated and closed.
- EH5 now also includes customer-notification support for low-cost email and SMS follow-up.
- EH6 public-surface expansion is now validated and closed after testing.
- EH6 now also includes the active DWDS logo system across core public/admin entry surfaces plus branded browser/app icons.
- EH7 tooling recovery is now complete, and the searchable local design-assistant workflow is usable again from the repo.
- EH8 billing governance is now implemented, tested, and validated.
- EH9 has now started with an operational exceptions workspace for server-side anomaly detection across readings, receivables, payments, and service-status mismatches.
- EH9 has now been tested and validated for the implemented exceptions-monitoring slice.
- EH10 has now started with printable customer notices tied to billing, follow-up, and service-status records.
- EH10 has now been tested and validated.
- EH11 has now been tested and validated.
- EH11 now also includes protected recovery-bundle exports from `/admin/system-readiness/export`.
- EH11 now also includes optional `SUPER_ADMIN` two-factor authentication with authenticator-app setup, recovery codes, and enforced second-factor sign-in when enabled.
- EH12 has now been tested and validated for the implemented route-operations and route-aware billing slice.
- Broader EH12 management analytics inside `/admin/routes` have now been user-validated with billed-versus-collected cycles, overdue-aging visibility, and disconnection-versus-reinstatement activity for the current route view.
- EH12 now also includes route-linked complaint intake and complaint hotspot visibility on `/admin/routes`.
- The deferred EH9 field-service expansion has now been tested and validated on `/admin/exceptions` through complaint-driven work orders, technician assignment, scheduled visits, progress updates, and complaint auto-resolution on completion.
- EH9 now also includes tested and validated first-class leak-report tracking and durable repair-history records so completed field fixes remain visible after queue state changes.
- EH9 now also includes tested and validated first-class meter replacement history tied to completed meter-linked field work, so replaced hardware can be traced to the installed successor meter from both the exceptions workspace and the meter registry.
- EH9 now also includes tested and validated protected field-proof image uploads on completed work orders, with proof review available from both the live work-order queue and completed repair history.
- The next recommended product pass is visual-composition refinement on the existing admin and marketing surfaces so the product feels more deliberate and less template-driven before broader new-domain expansion resumes.
- The strongest current contribution path is now a focused anti-card-sprawl pass that reduces repeated panel nesting and equal-weight tile grids on the most visible surfaces.
- EH13.3a has now been completed as a narrow-screen audit baseline for the current admin shell, dashboard, queues, and table-heavy modules.
- EH13.3b has now been validated.
- EH13.4 is now implemented as the shared visual status-priority pass for pending, overdue, read-only, ready, completed, and attention-required states.
- EH13.5 is now implemented as the final consistency sweep for shared filter wording, live operator copy cleanup, and stronger next-step empty states across the remaining admin boards.
- EH13 has now been fully validated and closed.
- A follow-on visual-composition pass is now recommended because several admin and marketing surfaces still rely on too many similarly styled cards, which makes the product feel more templated than intentional.
- EH14 is now in progress through an initial composition slice on the shared admin shell, admin dashboard, and top marketing entry surfaces.
- EH14.1 is now implemented as a dashboard-only maturity pass that sharpens the current admin console into a more readable, denser enterprise operations surface without redesigning it.
- EH14.2 is now validated as a landing-page refinement pass that makes the homepage more proof-led, more deployment-ready, less dependent on equal-weight feature-card sections, and clearer about DWDS being a staff-facing platform.
- EH14.3 is now implemented as the website-fundamentals pass, adding metadata completeness, generated share previews, crawler readiness, one public rollout-contact path, and stronger trust-plus-conversion handling on the remaining marketing routes.
- EH14.4 is now implemented as the follow-on admin-surface rollout for staff access, system readiness, and tariff registry so those summary-heavy protected boards no longer lag behind the newer EH14 composition language.
- EH14.5 has now been validated as the public accessibility verification sweep, covering skip-link access, visible focus treatment, navigation current-page semantics, semantic list cleanup, decorative-icon hiding, and reduced-motion-safe marketing reveal behavior.
- The EH14 protected-surface follow-on now also reaches collections, exceptions, readings, payments, customers, meters, routes, billing, and follow-up so those supporting admin sections move away from repeated equal-weight summary-card stacks.
- The same EH14 protected-surface follow-on now also reaches the dashboard account-security area so password-management and SUPER_ADMIN two-factor controls no longer sit on the older standalone panel treatment.
- That dashboard account-security slice is now tested and validated.
- EH15 is now defined as a protected staff AI assistant and knowledge-retrieval lane built around documentation-first RAG, role-aware read-only answers, mandatory citations, and a dedicated `/admin/assistant` workspace.
- EH15 now also persists documentation retrieval chunks, ingestion metadata, and per-user saved assistant history inside the core PostgreSQL stack.
- EH15 now also includes admin-facing knowledge operations on `/admin/assistant`, including source review, sync visibility, source-level curation controls, revision-backed rollback, and richer protected-module workflow guidance.
- EH15 now also includes tested and validated narrow live-record explainers for specific visible bill, payment, route, follow-up, and exception questions inside existing role scope.
- EH16 is now in progress as a supervised staff-automation lane built on top of the validated EH15 assistant baseline rather than as an unrestricted autonomous-agent layer.
- EH16.1 is now implemented as a proposal-only follow-up triage worker on `/admin/follow-up`, with persisted worker runs and no direct action execution.
- EH16.2 is now implemented as a proposal-only exception summarization worker on `/admin/exceptions`.
- EH16 should now remain the advisory worker baseline only.
- EH17 is now defined as the approval-based automation foundation.
- EH18 is now defined as the Telegram-first cashier assistant lane.
- EH19 is now defined as the OpenClaw integration lane.
- EH20 is now validated for specialized worker lanes, and EH21 has now started as the production-hardening lane.
- EH17 has now started with exact action-intent, approval-request, and execution-log persistence plus Telegram transport and callback handling for one bounded follow-up approval path.
- EH17 is now validated for its current bounded follow-up approval scope, including real Telegram delivery, approved execution, rejected-request behavior, and replay blocking.
- EH18 is now the next active lane.
- EH19 is now validated through a private OpenClaw gateway planner boundary that can rank follow-up and exception proposals plus interpret bounded Telegram cashier clarification while keeping DWDS as the execution authority.
- EH20 is now validated through a specialized worker-lane baseline that records lane ownership, policy version, execution mode, and bounded tool-access summary on automation runs and exposes that lane context on the existing follow-up and exceptions worker panels.
- EH21 has now started with a protected `/admin/automation` supervision workspace plus durable lease, retry, invalidation, dead-letter, and execution-failure metadata across the current automation records.
- EH21 now also invalidates stale follow-up and cashier intents before execution and supports bounded Telegram approval redelivery with visible dead-letter outcomes after repeated delivery failure.
- EH12 now also includes a route-level loss-risk watchlist on `/admin/routes`, framed explicitly as a revenue-loss proxy from recent billed-versus-collected gaps plus overdue exposure, alongside route-linked complaint hotspot visibility from first-class complaint records.
- Dedicated admin-management audit logging is now implemented, tested, and validated through a first-class account-management event log and a visible audit trail on `/admin/staff-access`.

## Product Principles
- **Modularity is mandatory:** Features must be separated into focused modules.
- **Operational clarity first:** Optimize for billing accuracy, cashier workflows, auditability, and low-friction daily operations.
- **Server-enforced business rules:** Validation, settlement, billing math, and workflow state changes must remain authoritative on the server.
- **Expand without rewrites:** Future customer channels, notifications, and advanced workflows should layer onto the same core data model.
- **Operator efficiency matters:** The admin UI should minimize scan time, shorten repetitive workflows, and surface the next important action clearly.
- **Intentional composition over card sprawl:** Cards should be reserved for actionable or stateful content. Simple grouping, navigation, and supporting information should more often use lists, rows, sections, dividers, and typography instead of repeated nested panels.
- **Public trust must be explicit:** The marketing site should communicate deployment readiness, governance, security posture, role clarity, and real workflow proof instead of stopping at feature description.
- **One clear public action path:** The website should drive one primary conversion route such as demo/contact/access request rather than behaving only as an informational brochure.
- **Staff AI must be trustworthy before it is powerful:** The internal assistant should start as a citation-backed explanatory tool with strict role boundaries and no action-taking authority.
- **Automation must be reviewable before it is actionable:** Any AI worker should first produce bounded, auditable recommendations that staff can approve, edit, or reject before DWDS executes a real workflow change.

## Implemented MVP Scope
1. **Authentication:** internal admin email/password sign-in and protected admin routes.
2. **Core records:** Customer, meter, and tariff management.
   Meter records now preserve account-holder transfer history.
3. **Meter operations:** Reading encoding plus approval workflow.
4. **Billing:** Progressive-tier bill generation and printable consumer bill statements.
5. **Cashiering:** Manual payment entry with bill settlement updates.
6. **Reporting:** Daily collections summary with auditable payment detail.
7. **Public product surface:** Marketing pages that present DWDS as a finished MVP.

## Known MVP Limits
- Reporting is limited to the **current operating day collections view**.
- Overdue and disconnection handling are currently **display and status concepts**, not a full automated receivables workflow.
- Payments support **manual cashier encoding only** in the implemented MVP.
- Historical reading surfaces still do not resolve the holder strictly as of transfer date; they rely on the meter's current linked holder for some displays.

## Enhancement Roadmap

### EH1: Data Platform Hardening
Goal: Replace the temporary SQLite setup with the intended PostgreSQL-first workflow and production-safe database practices.

Expected outcomes:
- PostgreSQL-aligned Prisma schema and migrations
- documented local/staging/production database workflow
- environment parity for testing and deployment

Current status:
- PostgreSQL-first schema/runtime wiring, baseline migration, and live workflow validation are complete.

### EH2: Authorization & Staff Controls
Goal: Enforce role-based authorization beyond simple authentication and role storage.

Expected outcomes:
- permission-aware server actions and route guards
- clearer staff-role boundaries across dashboard modules
- safer separation of cashier, billing, reader, and admin capabilities

Current status:
- Role-based authorization is now enforced in protected admin routes and server actions.
- Mixed-access modules now expose read-only views where appropriate instead of relying on UI display alone.
- Admin access is internal-only and created by SUPER_ADMIN accounts.
- The migrated seeded `SUPER_ADMIN` account has now been validated successfully through the live sign-in route.
- The repo now includes a minimal password-management path without introducing email-reset infrastructure.
- That password-management path now includes forced temporary-password rotation before protected-route access.

### EH3: Reporting & Receivables Intelligence
Goal: Expand reporting beyond today's collections into a usable finance and follow-up workspace.

Expected outcomes:
- historical filters
- receivables and unpaid-account views
- overdue visibility
- charts or trend summaries where they materially help operations

Current status:
- Historical date filtering, receivables visibility, and overdue reporting are implemented in the admin reporting workspace.
- EH3 has been validated and is now complete.

### EH4: Cashiering & Settlement Expansion
Goal: Support a broader real-world cashier workflow after the exact-balance MVP flow.

Expected outcomes:
- official receipt generation
- installment or partial-payment policy support
- customer credit or overpayment handling if approved by the business

Current status:
- Official receipt generation and partial-settlement cashier posting are implemented in the admin payments workspace.
- Overpayment and customer-credit handling remain intentionally deferred until explicitly approved.
- EH4 is validated and complete.

### EH5: Overdue & Disconnection Workflow
Goal: Move from display-only penalty language to explicit receivables follow-up logic if the business wants enforced workflow support.

Expected outcomes:
- automated overdue evaluation
- account follow-up states
- optional disconnection tracking and reinstatement workflow

Current status:
- Automated overdue evaluation and explicit receivables follow-up stages are implemented.
- A protected follow-up workspace now supports reminder escalation, service disconnection, and reinstatement.
- Customer notifications now have an app-native logging layer plus provider-ready email/SMS delivery hooks.
- EH5 is validated and complete.

### EH6: Product Surface Expansion
Goal: Extend the public-facing and customer-facing parts of DWDS once the operations core is stable.

Expected outcomes:
- richer marketing content and assets
- future consumer portal routes
- optional notifications and online-payment integrations when explicitly scoped

Current status:
- The marketing site now includes DWDS brand assets, screenshot-style product previews, stronger deployment-ready copy, and shared logo treatment across the navbar, footer, auth shell, and dashboard entry surfaces.
- Consumer portal routes, public notifications, and online consumer payments remain deferred until explicitly approved.
- EH6 has been validated and is now complete.

### EH7: Tooling & Design Workflow Recovery
Goal: Restore the full local design-assistant workflow that is currently blocked by the Python environment.

Expected outcomes:
- working local Python execution for the installed design skill
- searchable design-system workflow for future UI passes

Current status:
- The searchable `ui-ux-pro-max` workflow has been restored through a repo-local PowerShell launcher and `npm run design:search -- ...`.
- Skill entrypoints now resolve local sibling imports reliably across supported interpreter paths.

### EH8: Billing Governance & Distribution Controls
Goal: Make the monthly billing cycle safer, auditable, and operationally trackable from bill preparation through physical distribution.

Expected outcomes:
- billing cycle controls, including open/close billing periods
- draft and finalized bill states
- bill locking after finalization
- billing reopen flow restricted to `SUPER_ADMIN`
- bill-batch regeneration with required audit reason
- month-end billing checklist
- monthly billing batches
- print workflows by zone, route, or purok
- single-bill reprint support
- printed and distributed bill statuses
- distribution date and assigned staff tracking
- failed-delivery and returned-bill status handling

Rationale:
- Prevent accidental edits after bills have already been finalized or distributed.
- Turn printing and home distribution into a first-class workflow instead of a one-click output action.

Current status:
- Billing cycles now support open, closed, and finalized states, plus draft-versus-finalized bill locking.
- SUPER_ADMIN-only reopen control, audited batch regeneration reasons, print-batch creation, and printed/distributed/returned/failed-delivery tracking are implemented.
- The billing workspace now includes a month-end checklist and cycle audit trail, and printable bill views can log single-bill reprints.
- Batch print output now renders as consumer-bill-first A5-ready pages without the dashboard operations-console shell.
- EH8 is validated and closed.

### EH9: Operational Exceptions & Field Service Workflow
Goal: Detect billing and metering anomalies early while connecting office records to field technician work.

Expected outcomes:
- exception alerts for missing meter readings
- unusually high or unusually low consumption detection
- possible leak flagging
- duplicate-payment alerts
- unpaid accounts nearing disconnection
- disconnected accounts with recent payment activity
- inactive consumers with new readings
- complaint ticketing
- technician assignment
- work-order status tracking
- repair history
- leak report tracking
- meter replacement history
- photo upload for field proof

Rationale:
- Help administrators catch data issues and service risks before they escalate.
- Create continuity between customer complaints, technician action, and historical asset/service records.

Current status:
- EH9 is now validated through the new `/admin/exceptions` workspace.
- The current implementation covers missing readings, abnormal consumption, possible leaks, duplicate-payment patterns, near-disconnection accounts, and service-status mismatches using live operational records.
- Complaint intake now also feeds tested and validated complaint-driven field work orders on `/admin/exceptions`, including technician assignment, scheduled visits, progress updates, completion logging, and complaint auto-resolution.
- Dedicated leak-report tracking and durable repair-history records are now implemented and validated in the EH9 baseline.
- Meter replacement history is now implemented in the EH9 baseline through completed meter-linked work orders.
- Protected field-proof image uploads are now tested and validated in the EH9 baseline through completed work-order updates, protected proof serving, and proof review on `/admin/exceptions`.

### EH10: Consumer Communication & Notice Management
Goal: Standardize customer-facing notices once billing and receivables workflows are stable.

Expected outcomes:
- printable notice templates
- billing reminders
- overdue reminders
- disconnection notices
- reconnection confirmations
- service interruption announcements

Rationale:
- Printed/template-driven notices provide immediate operational value even before full SMS integration is approved.
- Customer communication should build on authoritative billing, overdue, and service-status data.

Current status:
- Printable notice generation now exists for billing reminders plus core follow-up and service-status notices, with records rendered from `/admin/notices/[notificationId]`.
- Printed notices now appear in the same communication log as email and SMS activity through a first-class `PRINT` channel.
- EH10 has now been validated and is complete.

### EH11: Tariff Governance, Backup Recovery, and Admin Security
Goal: Strengthen production readiness by making rate changes traceable, data recovery explicit, and internal access controls more resilient.

Expected outcomes:
- tariff table history
- tariff effectivity dates
- minimum-bill settings
- penalty settings
- reconnection-fee settings
- audit trail for who changed rates and when
- automatic database backups
- backup-status visibility
- downloadable exports
- documented restore procedure
- monthly snapshot exports
- forced password reset for newly created admins
- inactive-session timeout
- failed-login lockout
- optional 2FA for `SUPER_ADMIN`
- IP/device logs
- login history

Rationale:
- Rate changes must remain traceable to the exact billing cycle and rule set used.
- Backup and restore capability is a core production requirement for a money-handling internal system.
- Admin security controls are higher-value near-term safeguards than nonessential UI polish.

Current status:
- EH11 is now complete.
- Tariffs now save as versioned, effectivity-dated records with change reasons, penalty/reconnection settings, and lightweight audit history.
- New bills now link to the tariff version used during generation.
- Admin login attempts are now logged with lockout handling and recent sign-in visibility.
- `/admin/system-readiness` now provides backup snapshot logging, environment-readiness checks, and an in-app restore checklist.
- `/admin/system-readiness/export` now provides protected CSV and JSON recovery exports covering the current snapshot register, recent login outcomes, environment-readiness flags, and restore checklist guidance.
- Optional `SUPER_ADMIN` 2FA is now implemented through protected dashboard setup, encrypted TOTP secret storage, one-time recovery codes, enforced second-factor sign-in for enabled `SUPER_ADMIN` accounts, and visible 2FA state on admin-management surfaces.

### EH12: Route Operations & Management Analytics
Goal: Improve day-to-day field execution and give owners/managers visibility into collection performance and operational risk.

Expected outcomes:
- route assignment per meter reader
- route assignment per bill distributor
- zone performance reporting
- route-based overdue lists
- route-based print batches
- dashboards for collection efficiency
- dashboards for overdue aging
- top-delinquent-zone visibility
- high-loss or high-complaint area visibility
- average consumption per zone
- monthly billed-versus-collected tracking
- disconnection-to-reconnection trend reporting

Rationale:
- Route-aware tooling improves actual reading and distribution operations, not just recordkeeping.
- Management dashboards should support decisions, prioritization, and accountability rather than only exposing raw reports.

Current status:
- EH12 is now validated for the implemented first slice.
- The repo now includes first-class service zones, service routes, staff route assignments, and routed-meter coverage.
- `/admin/routes` now provides the first EH12 workspace for route setup, route ownership assignment, meter mapping, and route/zone overdue plus collection-efficiency visibility.
- Route-aware reading entry is now active for meter readers assigned to specific routes.
- Billing print and distribution tracking now auto-scopes bills by grouping, defaults batch labels from the selected route/zone scope, and can default the assigned distributor from route ownership.
- A user-validated analytics slice now adds billed-versus-collected cycle rows, overdue-aging balance visibility, and disconnection-versus-reinstatement activity to `/admin/routes` without leaving the existing route domain.
- A follow-on analytics slice now also adds a route-level loss-risk watchlist, explicitly scoped as a revenue-loss proxy from recent collection gaps plus overdue exposure rather than a physical-loss or complaint model.
- Complaint-area visibility is now implemented through route-linked complaint intake and hotspot ranking on `/admin/routes`, while broader complaint-resolution and field-service workflow remains deferred to later EH9 work.

### EH13: Workflow Usability & Operator Efficiency
Goal: Make the implemented DWDS admin surface easier and faster to use for trained staff before expanding into more major workflow domains.

Expected outcomes:
- simpler dashboard and navigation copy
- clearer role-relevant actions from the main workspace
- reusable search and filtering on record-heavy pages
- stronger empty states, status cues, and next-step guidance
- better narrow-screen behavior for internal tablet and laptop use

Rationale:
- The current product is structurally strong but still dense on several operator-facing screens.
- Faster scanning and clearer priorities will improve real daily use more than adding another top-level module right now.

Current status:
- EH13 is now complete.
- The memory-bank now records a formal usability assessment and treats operator-efficiency refinement as the active product lane.
- The first implemented EH13 slice now covers shorter dashboard/sidebar wording, reusable search-and-filter controls on core record lists, stronger empty states, and clearer next-step guidance on high-frequency operator forms.
- EH13.2a now extends those shared list/filter/status patterns to `/admin/meters`, including server-side search plus registry filters for active, unassigned, unrouted, defective, and replaced units.
- The collections and exceptions pass is now validated, and the follow-up priority pass is now validated.
- EH13.3a now records the explicit narrow-screen audit baseline in `memory-bank/eh13.3a-narrow-screen-audit.md`, covering the shell, dashboard hero depth, queue action wrapping, and table-heavy module behavior below desktop width.
- Narrow-screen and tablet resilience have now been validated through the implemented EH13.3b responsive fallback pass.
- Visual priority treatment for pending, overdue, read-only, success, and attention-required states is now implemented across the active admin workflow surfaces.

## Current Contribution Priority
1. Extend EH12 again only if management asks for another route-analytics layer beyond the current loss-risk and complaint-hotspot baseline.
2. Revisit later EH11 security refinements only if priorities move beyond the now-implemented `SUPER_ADMIN` 2FA baseline.
3. Continue EH16 only if the goal remains supervised staff automation on top of the validated EH15 baseline, not general autonomous control.
4. Start EH18 on top of the validated EH17 approval foundation rather than reopening follow-up approval-core work.
5. Treat OpenClaw as the bounded planner and conversation coordinator, not as the financial or operational source of truth.
6. Treat Telegram-first cashiering as a separate lane from the approval foundation so field workflow, planner runtime, and execution safety can be validated in stages.
7. Continue EH21 only if the goal remains bounded supervision, retry safety, and observability rather than broader autonomous authority.

### Visual-Composition Refinement Direction
Goal: make DWDS feel intentionally designed rather than template-assembled by reducing repeated card patterns and letting hierarchy come more from layout, typography, and state emphasis.

Expected outcomes:
- fewer nested cards inside already framed sections
- navigation and module directories rendered as denser lists, rows, or split layouts instead of equal-weight tiles
- cards reserved primarily for queues, alerts, records, and other actionable or stateful objects
- dashboard hierarchy that emphasizes one primary control surface, one compact KPI band, and one urgency-first workflow area
- public marketing sections that alternate between screenshot-led, editorial, process, and proof layouts instead of repeating the same card grid treatment

Rationale:
- The current information architecture is sound, but too many similarly styled rounded panels create a generic "vibecoded" feel.
- Reducing decorative container repetition should improve scan speed and make the product feel more confident and product-specific.

Current status:
- EH14 is now in progress.
- The first implemented slice adds lighter-weight section treatments, a denser admin dashboard directory/workflow composition, and editorial row/split-layout patterns on the marketing home and platform pages.
- EH14.1 now adds reusable dashboard-console primitives, a tighter protected-shell sidebar treatment, stricter KPI hierarchy, and denser action-row composition on `/admin/dashboard`.
- EH14.2 now tightens the homepage hero around one operational promise, moves more of the proof burden onto larger workflow screenshots, adds a trust/readiness strip near the top of the page, and reduces the remaining equal-weight feature-card patterns on `/`.
- Broader rollout across the remaining marketing routes and secondary admin summary surfaces remains pending.

### Landing Page Refinement Direction
Goal: make the DWDS homepage read like a deployment-ready utility-operations product with stronger proof, clearer buyer fit, and less feature-grid sprawl.

Expected outcomes:
- one sharper hero promise with only one primary CTA and one secondary CTA
- a trust/readiness strip near the top of the homepage
- screenshot-led workflow sections for meter-to-bill operations, billing and collections control, and overdue/route operations
- fewer equal-weight cards and more editorial split layouts or proof rows
- clearer positioning that DWDS is an internal staff/admin platform, not a consumer self-service portal

Rationale:
- The current marketing direction is coherent, but the homepage can still read too evenly distributed across multiple sections.
- Buyers evaluating an internal operations platform should see operational proof and deployment readiness earlier than a broad list of features.
- Stronger hierarchy should make the page feel more intentional and more specific to the utility-operations problem DWDS solves.

Current status:
- EH14.2 is now validated on the homepage.
- The hero, CTA language, and closing block now repeat the same focused platform-versus-rollout decision instead of mixing multiple access prompts.
- The page now surfaces internal-auth posture, billing governance, managed-Postgres readiness, and printable-output coverage near the top.
- Workflow proof now relies on larger screenshot-led editorial sections instead of several equal-weight feature grids.
- EH14.3 now closes the technical website-fundamentals gap through shared metadata helpers, generated Open Graph and Twitter previews, `robots` plus `sitemap` routes, a dedicated `/contact` rollout path, and stronger trust/conversion panels on the secondary marketing routes.
- The next website pass should now focus on explicit accessibility verification on top of that stronger public baseline, not on reopening metadata or crawler basics.

### EH13 Recommended Task Breakdown
1. `EH13.2a` Upgrade the meters module to the shared list/filter/empty-state interaction pattern. Completed.
2. `EH13.2b` Tighten route-operations scanability with the same search, status, and ownership vocabulary. This is now validated.
3. `EH13.2c` Bring collections and exceptions into the same interaction model for filters, counts, reset actions, and urgency cues. This is now validated.
4. `EH13.2d` Rework follow-up priority treatment so urgent receivables actions read clearly before supporting detail. This is now validated.
5. `EH13.3a` Audit tablet and narrow-laptop behavior on dashboard, sidebar, queue, and table-heavy surfaces. Completed and validated.
6. `EH13.3b` Add responsive fallback patterns that preserve primary actions when tables collapse. Implemented and validated.
7. `EH13.4` Standardize visual treatment for pending, overdue, read-only, ready, completed, and attention-required states. Implemented and validated.
8. `EH13.5` Run a final usability sweep for consistency of copy, filters, empty states, and next-step cues. Implemented and validated.

### Post-EH13 Priority Order
1. Visual composition and anti-template refinement across the admin and marketing surfaces.
2. Broader EH12 management analytics.
3. Optional later EH11 security and backup refinements.
4. Optional later EH9 field-service expansion beyond the new proof baseline only if richer media or storage workflows are explicitly approved.
6. Supervised staff automation should stay governance-first and bounded across EH16 through EH21, with DWDS remaining the execution authority for any approved financial or operational mutation.

## Rule of Thumb for Developers
Always read [@architecture.md](C:\Users\eddeg\OneDrive\Documents\GitHub\DESWATERS\v1\memory-bank\@architecture.md) before changing schema or architecture. Every major addition must map either to the implemented MVP surface or to a named enhancement phase in [implementation-plan.md](C:\Users\eddeg\OneDrive\Documents\GitHub\DESWATERS\v1\memory-bank\implementation-plan.md).
