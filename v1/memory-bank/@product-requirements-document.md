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

## Product Principles
- **Modularity is mandatory:** Features must be separated into focused modules.
- **Operational clarity first:** Optimize for billing accuracy, cashier workflows, auditability, and low-friction daily operations.
- **Server-enforced business rules:** Validation, settlement, billing math, and workflow state changes must remain authoritative on the server.
- **Expand without rewrites:** Future customer channels, notifications, and advanced workflows should layer onto the same core data model.

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
- Complaint intake, technician assignment, work-order status tracking, repair history, leak-report tracking, meter replacement history, and field-proof upload remain deferred for later EH9 slices only if explicitly approved.

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

## Rule of Thumb for Developers
Always read [@architecture.md](C:\Users\eddeg\OneDrive\Documents\GitHub\DESWATERS\v1\memory-bank\@architecture.md) before changing schema or architecture. Every major addition must map either to the implemented MVP surface or to a named enhancement phase in [implementation-plan.md](C:\Users\eddeg\OneDrive\Documents\GitHub\DESWATERS\v1\memory-bank\implementation-plan.md).
