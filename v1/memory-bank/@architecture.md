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
- Prisma v7 connection configuration now lives in `prisma.config.ts`, where pooled `DATABASE_URL` runtime access and direct `DIRECT_URL` migration access can be defined separately for managed Postgres providers.

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
  - Central Prisma v7 datasource binding for `DATABASE_URL` runtime access and optional `DIRECT_URL` migration access
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

## Database Schema: Current Repository Snapshot
The excerpt below captures the long-lived core entities. EH8 billing-governance additions now also exist in the live schema through `BillingCycle`, `BillPrintBatch`, `BillingCycleEvent`, and the related lifecycle/distribution fields attached to `Bill`.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

model Tariff {
  id              String      @id @default(uuid())
  name            String      @unique
  isActive        Boolean     @default(false)
  minimumCharge   Float
  minimumUsage    Float
  installationFee Float
  tiers           TariffTier[]
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}

model TariffTier {
  id         String   @id @default(uuid())
  tariffId   String
  tariff     Tariff   @relation(fields: [tariffId], references: [id])
  minVolume  Float
  maxVolume  Float?
  ratePerCuM Float
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  passwordHash String
  role      Role     @default(VIEWER)
  isActive  Boolean  @default(true)
  readings  Reading[]
  recordedPayments Payment[] @relation("RecordedPayments")
  receivableFollowUpUpdates Bill[] @relation("ReceivableFollowUpUpdatedBy")
  customerStatusUpdates Customer[] @relation("CustomerStatusUpdatedBy")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  SUPER_ADMIN
  ADMIN
  CASHIER
  BILLING
  METER_READER
  TECHNICIAN
  VIEWER
}

model Customer {
  id            String         @id @default(uuid())
  accountNumber String         @unique
  name          String
  address       String
  contactNumber String?
  email         String?
  status        CustomerStatus @default(ACTIVE)
  statusNote    String?
  statusUpdatedAt DateTime?
  statusUpdatedById String?
  statusUpdatedBy User? @relation("CustomerStatusUpdatedBy", fields: [statusUpdatedById], references: [id])
  meters        Meter[]
  receivedMeterTransfers MeterHolderTransfer[] @relation("MeterHolderTransferToCustomer")
  releasedMeterTransfers MeterHolderTransfer[] @relation("MeterHolderTransferFromCustomer")
  bills         Bill[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

enum CustomerStatus {
  ACTIVE
  INACTIVE
  DISCONNECTED
}

model Meter {
  id          String      @id @default(uuid())
  meterNumber String      @unique
  installDate DateTime
  status      MeterStatus @default(ACTIVE)
  customerId  String?
  customer    Customer?   @relation(fields: [customerId], references: [id])
  readings    Reading[]
  holderTransfers MeterHolderTransfer[]
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

enum MeterStatus {
  ACTIVE
  DEFECTIVE
  REPLACED
}

model MeterHolderTransfer {
  id              String    @id @default(uuid())
  meterId         String
  meter           Meter     @relation(fields: [meterId], references: [id])
  fromCustomerId  String?
  fromCustomer    Customer? @relation("MeterHolderTransferFromCustomer", fields: [fromCustomerId], references: [id])
  toCustomerId    String
  toCustomer      Customer  @relation("MeterHolderTransferToCustomer", fields: [toCustomerId], references: [id])
  effectiveDate   DateTime
  transferReading Float?
  reason          String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model Reading {
  id              String        @id @default(uuid())
  meterId         String
  meter           Meter         @relation(fields: [meterId], references: [id])
  readerId        String
  reader          User          @relation(fields: [readerId], references: [id])
  readingDate     DateTime      @default(now())
  previousReading Float
  currentReading  Float
  consumption     Float
  status          ReadingStatus @default(PENDING_REVIEW)
  bill            Bill?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}

enum ReadingStatus {
  PENDING_REVIEW
  APPROVED
  FLAGGED
}

model Bill {
  id            String     @id @default(uuid())
  billingPeriod String
  dueDate       DateTime
  customerId    String
  customer      Customer   @relation(fields: [customerId], references: [id])
  readingId     String     @unique
  reading       Reading    @relation(fields: [readingId], references: [id])
  usageAmount   Float
  totalCharges  Float
  status        BillStatus @default(UNPAID)
  followUpStatus ReceivableFollowUpStatus @default(CURRENT)
  followUpStatusUpdatedAt DateTime?
  followUpNote  String?
  followUpUpdatedById String?
  followUpUpdatedBy User? @relation("ReceivableFollowUpUpdatedBy", fields: [followUpUpdatedById], references: [id])
  payments      Payment[]
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
}

enum BillStatus {
  UNPAID
  PARTIALLY_PAID
  PAID
  OVERDUE
}

enum ReceivableFollowUpStatus {
  CURRENT
  REMINDER_SENT
  FINAL_NOTICE_SENT
  DISCONNECTION_REVIEW
  DISCONNECTED
  RESOLVED
}

model NotificationLog {
  id            String             @id @default(uuid())
  customerId    String
  customer      Customer           @relation(fields: [customerId], references: [id])
  billId        String?
  bill          Bill?              @relation(fields: [billId], references: [id])
  channel       NotificationChannel
  template      NotificationTemplate
  status        NotificationStatus @default(PENDING)
  provider      String
  destination   String
  subject       String?
  message       String
  providerMessageId String?
  errorMessage  String?
  triggeredById String?
  triggeredBy   User?              @relation("TriggeredNotifications", fields: [triggeredById], references: [id])
  sentAt        DateTime?
  createdAt     DateTime           @default(now())
  updatedAt     DateTime           @updatedAt
}

enum NotificationChannel {
  EMAIL
  SMS
}

enum NotificationTemplate {
  FOLLOW_UP_REMINDER
  FINAL_NOTICE
  DISCONNECTION
  REINSTATEMENT
}

enum NotificationStatus {
  PENDING
  SENT
  FAILED
  SKIPPED
}

model Payment {
  id          String        @id @default(uuid())
  receiptNumber String      @unique
  amount      Float
  paymentDate DateTime      @default(now())
  method      PaymentMethod
  referenceId String?
  balanceBefore Float
  balanceAfter Float
  recordedById String
  recordedBy  User          @relation("RecordedPayments", fields: [recordedById], references: [id])
  billId      String
  bill        Bill          @relation(fields: [billId], references: [id])
  status      PaymentStatus @default(COMPLETED)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}

enum PaymentMethod {
  CASH
  BANK_TRANSFER
  GCASH
  MAYA
  CARD
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}
```

## Update Rules
- Update this document after any major schema, module-structure, runtime, or workflow change.
- If future work belongs to an enhancement phase, reflect the architectural implications here at the same time.
