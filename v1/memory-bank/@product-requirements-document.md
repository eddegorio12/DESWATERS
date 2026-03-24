# Product Requirements Document

## Product Name
**DEGORIO WATER DISTRIBUTION SERVICES (DWDS) Water Utility Management System**

## Product Goal
Build a modular, robust web-based utility operations system that starts with a staff-facing admin app and can later expand into customer-facing channels without splitting the platform into separate products.

## Current State
- The **MVP admin web app is implemented**.
- The current live surface covers authentication, customer records, meter management, tariff setup, reading intake and approval, billing, payment encoding, printable consumer bills, daily collections reporting, and a public marketing site.
- The repo now runs on a validated **PostgreSQL-first data path**.
- EH3 reporting expansion is validated and closed.
- EH4 cashiering expansion is validated and closed.
- EH5 overdue, disconnection, and email-first follow-up notification support are validated and closed.
- EH5 now also includes customer-notification support for low-cost email and SMS follow-up.
- EH6 public-surface expansion is now validated and closed after testing.
- EH7 tooling recovery is now complete, and the searchable local design-assistant workflow is usable again from the repo.

## Product Principles
- **Modularity is mandatory:** Features must be separated into focused modules.
- **Operational clarity first:** Optimize for billing accuracy, cashier workflows, auditability, and low-friction daily operations.
- **Server-enforced business rules:** Validation, settlement, billing math, and workflow state changes must remain authoritative on the server.
- **Expand without rewrites:** Future customer channels, notifications, and advanced workflows should layer onto the same core data model.

## Implemented MVP Scope
1. **Authentication:** Clerk-based sign-in and protected admin routes.
2. **Core records:** Customer, meter, and tariff management.
3. **Meter operations:** Reading encoding plus approval workflow.
4. **Billing:** Progressive-tier bill generation and printable consumer bill statements.
5. **Cashiering:** Manual payment entry with bill settlement updates.
6. **Reporting:** Daily collections summary with auditable payment detail.
7. **Public product surface:** Marketing pages that present DWDS as a finished MVP.

## Known MVP Limits
- Reporting is limited to the **current operating day collections view**.
- Overdue and disconnection handling are currently **display and status concepts**, not a full automated receivables workflow.
- Payments support **manual cashier encoding only** in the implemented MVP.

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
- First-time Clerk accounts now require explicit admin or manager approval before protected DWDS dashboard access is granted.

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
- The marketing site now includes DWDS brand assets, screenshot-style product previews, and stronger deployment-ready copy for the implemented operational surface.
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

## Rule of Thumb for Developers
Always read [@architecture.md](C:\Users\eddeg\OneDrive\Documents\GitHub\DESWATERS\v1\memory-bank\@architecture.md) before changing schema or architecture. Every major addition must map either to the implemented MVP surface or to a named enhancement phase in [implementation-plan.md](C:\Users\eddeg\OneDrive\Documents\GitHub\DESWATERS\v1\memory-bank\implementation-plan.md).
