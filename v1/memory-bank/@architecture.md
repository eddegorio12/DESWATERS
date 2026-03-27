# Architecture Document

## Core Architectural Principles

1. **Modularity over monoliths**
   - Organize by domain under `src/features/<domain>/...`
   - Keep route files focused on composition
   - Isolate server mutations, validation, and calculation logic into dedicated modules

2. **One codebase, multiple surfaces**
   - Public marketing pages and protected staff operations live in the same Next.js app
   - Future consumer-facing routes should remain in the same repository unless a later decision explicitly changes that

3. **Server-authoritative business rules**
   - Billing math, payment settlement, reading approval, and any future authorization checks must be enforced on the server
   - Client components should guide input, not define business truth

4. **Memory-bank-driven architecture**
   - This file records both the implemented system structure and the intended direction of named enhancement phases
   - Any major feature, schema, or workflow change must update this document

5. **Operational usability over interface density**
   - DWDS should optimize for fast, repeatable staff work, not only for completeness of module coverage
   - New UI work should reduce decision friction, shorten scan time, and make urgent next actions obvious
   - Prefer progressive disclosure, concise labels, and task-prioritized surfaces over long explanatory blocks

6. **Intentional composition over repeated containers**
   - Do not solve every layout problem with another rounded panel
   - Reserve card treatments for actionable, stateful, or high-signal objects such as queues, alerts, records, and workflow items
   - Prefer lists, grouped rows, dividers, split layouts, and typography-led hierarchy for navigation, summaries, and supporting information

## Product Naming Convention
- **Formal name:** `DEGORIO WATER DISTRIBUTION SERVICES`
- **Short name:** `DWDS`

## Current Runtime State

### Framework & App Structure
- **Framework:** Next.js 16 App Router + TypeScript
- **Styling:** Tailwind CSS + `shadcn/ui`
- **Auth:** Auth.js credentials for authentication and session handling
- **ORM:** Prisma v7
- **Current intended DB runtime:** PostgreSQL

### Important Runtime Clarification
- The repository has been moved back to a **PostgreSQL-first runtime path**.
- The prior SQLite adapter path has been removed from the intended runtime.
- EH1 has been validated and closed, so PostgreSQL is now the confirmed primary runtime path in the repo.
- Prisma v7 connection configuration now lives in `prisma.config.ts`, which currently binds the repo runtime to `DATABASE_URL`. `DIRECT_URL` remains an optional deployment/readiness variable for direct migration or restore workflows in managed Postgres environments.

## Physical Architecture: Implemented Surfaces

### Routing
- `src/app/(marketing)/`
  - Public marketing surface for `/`, `/platform`, `/workflows`, and `/rollout`
- `src/app/(auth)/`
  - Internal admin sign-in route with no public sign-up route
- `src/app/(auth)/change-password/`
  - Forced password-rotation route for temporary-password accounts
- `src/app/(dashboard)/dashboard/`
  - Auth landing route that redirects authenticated staff into `/admin/dashboard`
- `src/app/(dashboard)/admin/`
  - Protected staff operations area for dashboard, staff access approvals, customers, meters, tariffs, readings, billing, payments, and collections
- `src/app/(dashboard)/admin/routes/`
  - EH12 protected route-operations workspace for zone setup, route ownership, coverage mapping, and route-level management visibility
- `src/app/(dashboard)/admin/notices/[notificationId]/`
  - Standalone printable notice route for EH10 customer communication records
- `src/app/(dashboard)/admin/system-readiness/`
  - EH11 admin-only route for backup snapshot logging, restore guidance, and security/readiness visibility

### Cross-Cutting Modules
- `src/proxy.ts`
  - Auth.js-backed route protection for `/dashboard` and `/admin/*` in Next.js 16
  - Proxy now also redirects temporary-password accounts to `/change-password`
- `src/auth.ts`
  - Central Auth.js credentials configuration, JWT session callbacks, and bcrypt-backed credential verification
- `src/lib/prisma.ts`
  - Central Prisma singleton used by server components and server actions with environment-driven PostgreSQL connections
- `prisma.config.ts`
  - Central Prisma v7 datasource binding for the current `DATABASE_URL` runtime path, with deployment guidance that may also use `DIRECT_URL` for direct migration or restore workflows
- `src/features/auth/lib/authorization.ts`
  - Central role matrix for protected module access and sensitive server-side capability checks
- `src/features/auth/actions/auth-actions.ts`
  - Auth sign-in/sign-out, self-service password change, and SUPER_ADMIN account-management actions
- `src/features/system-readiness/`
  - EH11 backup snapshot logging actions and the system-readiness workspace UI
- `src/features/routes/`
  - EH12 service-zone setup, service-route setup, staff route ownership, meter-route assignment, and route analytics
- `src/components/ui/`
  - Shared `shadcn/ui` primitives only

### Feature Modules
- `src/features/auth/`
  - Auth-shell components, sign-in form, password-management UI, and admin-account management actions
- `src/features/customers/`
  - Customer creation validation, action logic, and listing UI
- `src/features/meters/`
  - Meter registration, assignment, holder-transfer validation/actions, and registry UI
- `src/features/tariffs/`
  - Tariff creation, tier validation, and tariff registry UI
- `src/features/readings/`
  - Reading intake, deletion guardrails, approval actions, and approval/history UI
- `src/features/billing/`
  - Billing math, bill generation, billing-cycle governance, print/distribution tracking, and printable bill actions/UI
- `src/features/payments/`
  - Manual payment validation, cashier entry UI, payment history UI, and printable receipt workflow
- `src/features/reports/`
  - Historical collections filtering, receivables analytics, and reporting components
- `src/features/routes/`
  - Route/zone data contracts, assignment actions, and route-level operational analytics
- `src/features/follow-up/`
  - Overdue workflow actions, service-status enforcement, and the dedicated follow-up workspace
- `src/features/exceptions/`
  - EH9 exception rules, severity modeling, and the dedicated operational-exceptions workspace
- `src/features/notifications/`
  - Notification templates, provider integrations, phone normalization, and delivery logging for customer notices
- `src/features/notices/`
  - EH10 printable notice generation actions, print-log creation, and standalone notice rendering
- `src/features/marketing/`
  - Shared public-site layout, navigation, footer, brand lockup, screenshot showcase components, and centralized site content
- `public/brand/`
  - DWDS PNG logo assets used by the shared brand lockup and related public/admin brand surfaces
- `src/app/icon.png` and `src/app/apple-icon.png`
  - App Router icon files generated from the DWDS shield mark for browser and device icon usage

## Implemented Workflow Boundaries

### Authentication
- Auth.js proves identity against internal Prisma-backed admin accounts.
- There is no public registration path for DWDS admin access.
- Admin access is created internally and enforced through role-aware server checks.
- Local role data is enforced through centralized route and capability checks before protected data loads or mutations execute.
- A seeded `SUPER_ADMIN` path now exists through `prisma/seed.mjs`, and local sign-in verification has succeeded against the migrated database.
- Password changes are handled internally through server actions: signed-in users can change their own password, and SUPER_ADMIN can set a temporary replacement password for any admin account.
- Temporary-password enforcement is implemented at both the proxy layer and the server-authorization layer so protected data is blocked until rotation is complete.
- EH11 now also records admin login attempts, stores lockout counters and timestamps on `User`, captures request IP/user-agent where available, and enforces a shorter Auth.js session lifetime for protected admin use.

### Meter Reading Workflow
- Readings are encoded as `PENDING_REVIEW`.
- Approval transitions readings to `APPROVED`.
- Billing only occurs from approved, still-unbilled readings.
- EH12 now allows meter-reader access to be narrowed by assigned route ownership, so `METER_READER` accounts only see the meters mapped to their active reading routes.

### Meter Holder Workflow
- A physical meter remains attached to the service point while the active account holder can change over time.
- `Meter.customerId` remains the live holder pointer for compatibility with downstream reading and billing queries.
- `MeterHolderTransfer` records the holder-change audit trail, including initial assignment events and later reassignment events.
- Transfer capture currently records previous holder, replacement holder, effective date, optional turnover reading, and optional reason.

### Billing Workflow
- Bills are generated from approved readings using the currently effective tariff.
- EH11 now links each newly generated bill to the exact tariff version used at generation time through `Bill.tariffId`.
- Bill generation now auto-attaches each bill to a month-specific `BillingCycle` so close, finalize, reopen, and regeneration rules are enforced per cycle.
- Finalizing a billing cycle locks its bills into `FINALIZED` lifecycle state, while reopen remains restricted to `SUPER_ADMIN` and is blocked after completed payments exist.
- Monthly print handling now runs through `BillPrintBatch` records with grouping, assigned staff, printed/distributed/returned/failed-delivery states, and auditable cycle events.
- Printable bill views expose issue date, due date, grace period, EH8 lifecycle/distribution context, and single-bill reprint logging.
- EH12 now lets route-grouped and zone-grouped print batches persist linked `ServiceRoute` and `ServiceZone` references when the selected bills belong to one mapped route or zone.

### Payment Workflow
- Payments are recorded manually against open bills.
- Settlement is derived from cumulative `COMPLETED` payments.
- Official receipts are generated from posted payments with cashier attribution and before/after balance snapshots.
- Partial settlement is now explicit in the cashier workflow.
- Overpayment is still blocked because customer credit handling does not yet exist.

### Reporting Workflow
- Reporting now supports a Manila-aligned date range for completed payment history.
- The reporting workspace also summarizes unpaid, partially paid, and overdue receivables from open bills.
- Overdue visibility now feeds an explicit follow-up workflow, but reporting remains focused on visibility rather than mutation controls.

### Overdue & Disconnection Workflow
- Open bills now carry explicit receivables follow-up states separate from printed bill wording.
- Server-side synchronization keeps open bill status aligned with due dates and completed-payment totals.
- Dedicated follow-up actions move overdue bills through reminder, final-notice, and disconnection-review stages.
- Customer service status now tracks disconnection and reinstatement actions with staff attribution fields.
- Reinstatement is blocked while overdue balances remain open.
- Follow-up actions can now trigger provider-backed customer notifications, and every attempt is logged in-app for auditability.

## Usability Assessment: Current Product State

### Current Strengths
- The public marketing surface is navigationally simple and communicates one coherent product story.
- The protected workspace is organized by recognizable utility domains instead of one overloaded admin screen.
- Role-aware access narrowing reduces irrelevant navigation for many staff roles.
- The dashboard already frames the product around operational workflow rather than generic analytics.

### Current Friction
- The dashboard and module-entry surfaces are still text-heavy, which increases scan time and first-use friction.
- List-heavy modules depend heavily on wide tables, making routine lookup and mobile use less forgiving.
- Key operational pages still expose data well, but they do not consistently expose the fastest next action.
- Search, filtering, prioritization, and urgency cues are not yet strong enough on high-volume record screens.
- Some screens currently assume trained operators and will feel dense to occasional users or newly onboarded staff.
- Several admin and marketing surfaces still stack too many similarly styled panels and sub-cards, which flattens hierarchy and makes the product feel more template-driven than product-specific.

### Architectural Interpretation
- DWDS is already structurally sound, but its next UX gains should come from workflow compression rather than new top-level modules.
- Future usability work should favor shared interaction patterns inside existing feature domains instead of one-off page rewrites.
- The goal is not consumer-style simplification; the goal is lower operator effort for repetitive daily work.
- The most useful near-term architecture work is rollout and consistency work inside existing modules, not new domain sprawl.
- The next visual-quality gain should come from composition discipline: fewer containers, less nested card-on-card structure, and clearer contrast between navigation, summary, and task objects.
- EH14 has now started by introducing lighter-weight composition primitives for summary and navigation areas, while keeping stronger card treatments for workflow queues and stateful records.
- EH14.1 now introduces shared dashboard-console primitives so the protected shell and admin dashboard can preserve their current structure while improving enterprise-console readability, sidebar control density, KPI consistency, and reusable operational row patterns.
- EH14.2 now applies that same refinement logic to the homepage: one dominant operational promise, larger screenshot-led workflow sections, an early readiness/trust strip, repeated CTA vocabulary, and clearer staff-facing positioning instead of a broad feature-grid narrative.

## Usability Architecture Targets

### Shared UX Direction
- Keep the existing domain-driven module structure.
- Introduce reusable list-surface patterns for search, filters, empty states, summary counts, and row-level quick actions.
- Introduce reusable form-surface patterns for field grouping, inline validation, save-state feedback, and post-submit next steps.
- Standardize "priority first" page composition so urgent queues, blocking exceptions, and time-sensitive actions appear before long descriptive content.
- Preserve server-authoritative workflows while making client surfaces more obvious and less verbose.
- Use section-level framing sparingly; not every subsection needs its own bordered card if spacing, headings, and dividers already establish structure.

### Prioritized UX Work

#### UX1: Navigation & Dashboard Simplification
- Reduce descriptive copy length in dashboard hero, workflow cards, and sidebar navigation where labels already carry enough meaning.
- Promote the most common actions for each role more clearly from `/admin/dashboard`.
- Keep dashboard cards focused on decision support: what needs attention now, what can wait, and where to go next.

#### UX2: Reusable Record-List Interaction Pattern
- Add consistent search, status filtering, and useful empty states to high-volume modules such as customers, meters, readings, billing, and payments.
- Prefer quick operational cues such as counts, status chips, and overdue/pending emphasis above passive descriptive text.
- Where tables remain necessary, keep them but pair them with stronger filter and action affordances rather than replacing them blindly.

#### UX3: Form Workflow Tightening
- Make create/edit forms easier to complete by grouping related fields, clarifying optional versus required input, and exposing the immediate next step after success.
- Minimize dead-end create flows; after a successful record save, guide users toward the next operational action where appropriate.
- Keep validation feedback inline and brief, with server failures translated into operator-readable language.

#### UX4: Mobile and Narrow-Viewport Resilience
- Treat tablet and narrow laptop widths as first-class internal-use targets.
- Audit wide data tables and multi-column dashboard sections for stacked or summarized fallback layouts.
- Preserve essential actions on smaller screens even when full record detail must collapse.

#### UX5: Visual Priority System
- Use stronger severity, pending, overdue, and success states consistently across exceptions, billing, readings, and follow-up.
- Reserve dense descriptive copy for secondary help text; primary surfaces should communicate state through structure and emphasis first.
- Build shared visual rules for "attention required", "read-only", "ready", and "completed" states across modules.

#### UX6: Composition and Card-Density Reduction
- Audit dashboard, module directories, page shells, and marketing sections for repeated card-on-card composition.
- Replace equal-weight tile grids used for navigation or supporting information with denser list, row, or split-layout patterns where appropriate.
- Keep one strong page frame when needed, but reduce nested bordered/shadowed containers inside that frame.
- Let typography, spacing, alignment, and dividers carry more hierarchy so the UI reads as deliberate instead of template-generated.

### Current Usability Sequence
1. Extend the EH13 shared record-list and status treatment to remaining record-heavy modules such as follow-up, then validate that pass before moving on. This is now complete through the validated follow-up pass.
2. Audit `/admin/dashboard`, dashboard navigation, queue surfaces, and table-heavy modules for narrow-screen fallback quality. This is now complete through `memory-bank/eh13.3a-narrow-screen-audit.md`.
3. Validate the implemented EH13.3b responsive fallbacks on the audited admin surfaces, then continue the wider EH13 consistency pass.
4. Keep future EH12 analytics work attached to existing route/reporting domains after the operator-efficiency pass is stable, rather than bypassing EH13 with isolated dashboard additions.
5. Treat dedicated admin-management audit logging as the next auditability refinement once the active usability pass is in better shape.
6. Before expanding management analytics further, run a composition pass that reduces card sprawl across the most visible admin and marketing surfaces.

### EH13 Execution Order
1. `EH13.2a` Meters should be the first remaining module brought onto the shared list/filter/status baseline. This is now implemented on `/admin/meters`.
2. `EH13.2b` Route operations are now on the shared scanability baseline with search, focus filters, ownership cues, and filtered route-support panels. This route pass is now validated.
3. `EH13.2c` Collections and exceptions are now on the same interaction baseline with server-side search/filter handling, shared result-count and reset behavior, and stronger urgency cues for finance and anomaly review. This pass is now validated.
4. `EH13.2d` Follow-up now receives a stronger urgency-first hierarchy for receivables actions through server-side escalation filters, bill-level ordering, and separated service-action panels. This pass is now validated.
5. `EH13.3a` is now complete as a code-level audit of the current narrow-screen pressure points across the protected shell, dashboard, queue cards, and table-heavy modules.
6. `EH13.3b` has now validated the narrow-screen and responsive fallback behavior across those updated surfaces.
7. `EH13.4` is now implemented through a shared status-priority layer that standardizes pending, overdue, read-only, ready, success, and attention-required treatment across the active admin workflow surfaces.
8. `EH13.5` is now implemented as the final consistency sweep across shared filter wording, live operator copy, and empty-state next-step guidance on the remaining secondary admin boards. EH13 is now fully validated and closed.

## Enhancement Architecture Targets

### EH1: Data Platform Hardening
- Replace the temporary SQLite-first local runtime with a PostgreSQL-aligned workflow.
- Reconfirm schema compatibility for all existing models and relations.
- Preserve a single Prisma access layer in `src/lib/prisma.ts`.
- Keep environment-specific connection logic centralized in `prisma.config.ts` and related config, not scattered across features.
- A PostgreSQL baseline migration now exists under `prisma/migrations/20260323_eh1_postgresql_baseline/`.
- EH1 validation has been completed. Remaining platform work now falls outside EH1.

### EH2: Authorization & Staff Controls
- Explicit authorization checks now exist in protected routes and server actions through `src/features/auth/lib/authorization.ts`.
- The current implemented module boundaries are:
  - `SUPER_ADMIN` and `ADMIN`: full admin-surface access
  - `TECHNICIAN`: customers and meters
  - `METER_READER`: readings entry/history, with deletion restricted to their own pending readings
  - `BILLING`: tariffs visibility, readings approval, billing, and collections
  - `CASHIER`: payments, collections, and printable bill view
- If permissions outgrow the current role enum, introduce a permission layer without collapsing feature modularity.

### EH3: Reporting & Receivables Intelligence
- Expand `src/features/reports/` into a broader reporting domain rather than placing analytics directly in route files.
- Keep date filtering, receivables calculations, and overdue summaries in dedicated reporting libs.
- Add charts only when they serve an operational use case, not for decoration.
- The current implementation now uses dedicated report libs for date-range parsing and receivables summarization under `src/features/reports/lib/`.
- EH3 has been validated and closed.

### EH4: Cashiering & Settlement Expansion
- Extend `src/features/payments/` for receipts, installment policies, or customer credit handling.
- Add receipt generation as a dedicated submodule instead of mixing it directly into the current payment form component.
- Keep settlement rules centralized so bill status logic remains consistent.
- The current EH4 implementation adds receipt-backed payment posting and a dedicated printable receipt route at `/admin/payments/[paymentId]/receipt`.
- Customer credit remains intentionally out of scope until explicitly approved.
- EH4 has been validated and is now closed.

### EH5: Overdue & Disconnection Workflow
- Introduce dedicated receivables-follow-up or account-status modules rather than overloading billing page logic.
- Treat overdue evaluation, disconnection tracking, and reinstatement as explicit workflow states if they are built.
- Avoid making printed bill language the source of truth for enforcement logic.
- The current EH5 implementation now uses `src/features/follow-up/` plus customer and bill state fields to track reminder, final-notice, disconnection-review, disconnected, and resolved follow-up stages.
- `/admin/follow-up` is the protected operational surface for those actions.
- Notification delivery for EH5 now lives under `src/features/notifications/`, with Resend-ready email and Semaphore-ready SMS integrations chosen as the low-cost initial path.
- EH5 has been user-validated and is now closed.

### EH6: Product Surface Expansion
- Keep future consumer-portal routes separate from admin routes by route group, not by repository split.
- Public marketing content should stay under `src/features/marketing/` unless a future consumer domain becomes large enough to justify its own feature tree.
- Online payment or notification integrations should be attached to explicit feature modules when those channels are approved.
- The current EH6 implementation adds reusable DWDS public brand assets under `public/brand/` and screenshot-style product previews under `public/marketing/`.
- The shared `BrandLockup` component now scales the DWDS PNG logo by placement so navbar, footer, auth, and dashboard surfaces stay visually balanced without separate ad hoc markup.
- App icon metadata is now represented through `src/app/icon.png` and `src/app/apple-icon.png`, derived from the DWDS shield mark.
- Marketing pages now present deployment-ready product evidence without introducing consumer-portal routes ahead of approval.
- EH6 has been user-validated and is now closed.

### EH7: Tooling & Design Workflow Recovery
- The installed `ui-ux-pro-max` skill remains the design guidance source.
- Local search-assisted execution is now restored through `scripts/run-ui-ux-pro-max.ps1` and the `npm run design:search -- ...` package script.
- The skill entrypoints now register their script directory before importing sibling modules so execution does not depend on a specific interpreter's default `sys.path` behavior.
- Do not let tooling failure push design logic into giant page files or ad hoc styling sprawl.

### EH8: Billing Governance & Distribution Controls
- EH8 now introduces `BillingCycle`, `BillPrintBatch`, and `BillingCycleEvent` as first-class billing-governance records in the core Prisma schema.
- `Bill` now carries draft-versus-finalized lifecycle state plus physical print/distribution fields so monthly closeout and home delivery remain auditable from the same transactional record set.
- The billing workspace at `/admin/billing` is now the operational control point for checklist updates, cycle close/finalize/reopen actions, audited regeneration, print-batch creation, batch print access, and distribution updates.
- Capability enforcement now distinguishes standard bill generation from finalization, reopen, regeneration, print-batch, and distribution authority.

### EH9: Operational Exceptions & Field Service Workflow
- EH9 has now started with a protected `/admin/exceptions` route that derives alert state directly from existing customer, meter, reading, bill, and payment records instead of introducing new persistence immediately.
- Initial exception modeling lives under `src/features/exceptions/` and currently covers missing reading gaps, abnormal consumption changes, possible leak spikes, duplicate-payment patterns, disconnection-risk receivables, and service-status mismatches.
- This implemented exception-monitoring slice has now been user-validated and should be treated as the current EH9 baseline.
- Complaint tickets, technician assignments, work orders, repair history, leak-report records, and optional field-proof uploads should layer onto this workspace later only if explicitly approved, without collapsing the current domain-driven module structure.

### EH10: Consumer Communication & Notice Management
- EH10 now introduces `NotificationChannel.PRINT` so printable customer notices live inside the same auditable communication log as email and SMS activity.
- The first implemented EH10 slice renders printable records from `/admin/notices/[notificationId]` instead of relying on external document templates.
- Billing and follow-up workflows now generate printable notice records directly from authoritative bill, receivable, and service-status data.
- This implemented EH10 slice has now been user-validated and should be treated as the current communication-management baseline.
- Broader service-interruption workflow support remains a later EH10 refinement and should not be conflated with EH11.

### EH11: Tariff Governance, Backup Recovery, and Admin Security
- Tariffs now move toward immutable, versioned records with effectivity windows, fee settings, and audit events instead of relying only on a mutable active flag.
- Bill generation now resolves the currently effective tariff by date and stores the selected tariff on each new bill.
- Login audit and session-security controls now live inside the existing Auth.js + Prisma model through `AdminLoginAttempt` plus lockout fields on `User`.
- Backup visibility and restore-readiness guidance now live in the admin-only `/admin/system-readiness` workspace, with snapshot logging kept in the main relational schema.
- This EH11 slice is now user-validated and should be treated as the current production-hardening baseline.
- Optional `SUPER_ADMIN` 2FA and automated export/download tooling remain pending only as later EH11 refinements if explicitly approved.

### EH12: Route Operations & Management Analytics
- EH12 now introduces `ServiceZone`, `ServiceRoute`, and `StaffRouteAssignment` as first-class operational records linked to meters, print batches, and staff.
- The first route-aware workspace now lives at `/admin/routes`, where staff can define zones, define routes, assign route ownership for reading and bill distribution, and map existing meters into route coverage.
- Reading entry now consumes route ownership for `METER_READER` access narrowing, and route performance visibility now derives from live bill, payment, and meter data.
- Billing batch preparation now also consumes route and zone ownership context so grouping can auto-scope bill selection, derive default labels, and default route distributors from active route assignments.
- This implemented EH12 slice has now been user-validated and should be treated as the current route-operations baseline.
- Future EH12 slices should extend this domain with broader management trends rather than bypassing it with ad hoc reporting logic.

### EH13: Workflow Usability & Operator Efficiency
- EH13 should focus on making the existing product easier and faster to operate before adding major new workflow domains.
- The first EH13 slice should target dashboard simplification, reusable searchable/filterable record lists, and clearer next-step guidance on high-frequency forms.
- EH13 must stay modular: shared UI patterns should live in reusable components or feature-local primitives, not in page-specific copy-heavy rewrites.
- Any EH13 work should improve scanability and actionability for trained staff without weakening server-side rules, auditability, or role boundaries.
- Candidate first-pass targets are `/admin/dashboard`, customer registry, readings queue, billing queue, and payments history because they are the most likely daily-use operator surfaces.
- The current implemented EH13 baseline now includes `src/features/admin/components/record-list-section.tsx`, `src/features/admin/components/status-pill.tsx`, and `src/features/admin/lib/list-filters.ts` as the shared primitives for searchable/filterable record surfaces.
- The first EH13 rollout now applies those primitives to the customer registry, pending-reading approvals, approved-reading billing queue, payment history, and the meters registry, while dashboard and sidebar copy have been shortened for faster scanning.
- High-frequency forms now also expose more explicit next-step cues, but broader narrow-screen fallback work remains pending for later EH13 slices.
- `/admin/meters` now also uses server-side search and registry filters to separate active, unassigned, unrouted, defective, and replaced units without changing any server-authoritative workflow rules.
- The next EH13 rollout should prioritize route operations and the other record-heavy modules that still lag behind the new shared interaction pattern.
- The `EH13.3a` audit now confirms that the main remaining responsive gaps are shell navigation density, dashboard/page-shell height on narrow screens, horizontal-scroll-only tables, wrapped follow-up action groups, and route-scoreboard density.
- Later EH13 slices should keep using shared primitives instead of introducing per-page filtering, status, or responsive behavior that drifts from the new baseline.
- The final EH13 sweep now also standardizes shared list-control wording around explicit filter actions and removes roadmap-phase language from live operator copy so the production UI reads as an operations tool rather than an implementation checklist.
- Meters were treated as the first implementation target because they are a frequent operational surface and a clean bridge between customer, route, and reading workflows.

### EH14: Visual Composition & Anti-Template Refinement
- EH14 should refine the visual structure of the already-implemented surfaces without reopening core workflow rules or feature boundaries.
- The primary target is repeated card sprawl across the dashboard, page shells, module-launch areas, marketing sections, and other summary-heavy surfaces.
- Shared primitives should distinguish between page-level frames, actionable/stateful cards, lightweight grouped lists or rows, and plain supporting copy blocks.
- Dashboard and marketing work should prefer stronger section rhythm and fewer equal-weight tiles so the product feels more intentional and less like a stacked component library demo.
- EH14 should preserve the current DWDS light-mode enterprise direction while reducing excess radius, shadow repetition, and nested panel density where those treatments do not communicate state.
- The first implemented EH14 slice now adds lighter-weight `dwds-section` and `dwds-subtle-block` treatments, reduces nested card usage in the protected shell and shared admin page hero, and shifts the dashboard plus top marketing entry pages toward row-based directories and editorial split layouts.
- EH14.1 now refactors the active dashboard into a more mature operations console through reusable dashboard primitives: a higher-clarity sidebar item, stricter metric card, denser action row, clearer section header, and calmer panel framing while preserving the existing DWDS dashboard concept.
- EH14.2 now refactors the homepage around a single operational promise, an early trust/readiness strip, and three screenshot-led workflow proof sections so the marketing surface emphasizes deployment readiness and operator fit ahead of broad feature enumeration.

## Database Schema: Current Repository Snapshot
The live schema now moves faster than a safe hand-maintained excerpt in this file. Treat [prisma/schema.prisma](C:/Users/eddeg/OneDrive/Documents/GitHub/DESWATERS/v1/prisma/schema.prisma) as the authoritative schema source.

Current long-lived schema domains include:
- Core utility records: `Customer`, `Meter`, `MeterHolderTransfer`, `Reading`, `Tariff`, `TariffTier`, `Bill`, and `Payment`
- Authentication and admin security: `User`, `AdminLoginAttempt`, password-rotation fields, lockout fields, and role enums
- Billing governance: `BillingCycle`, `BillPrintBatch`, `BillingCycleEvent`, bill lifecycle fields, and print/distribution tracking fields
- Notifications and notices: `NotificationLog` with `EMAIL`, `SMS`, and `PRINT` channels plus template enums used by billing and follow-up workflows
- Route operations: `ServiceZone`, `ServiceRoute`, and `StaffRouteAssignment`
- Recovery readiness: `BackupSnapshot`

When updating architecture notes after a schema change, prefer summarizing the affected domains here and keep the canonical field-level detail in `prisma/schema.prisma`.

## Update Rules
- Update this document after any major schema, module-structure, runtime, or workflow change.
- If future work belongs to an enhancement phase, reflect the architectural implications here at the same time.
