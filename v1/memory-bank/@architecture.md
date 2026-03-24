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
- **Auth:** Clerk for authentication and session handling
- **ORM:** Prisma v7
- **Current intended DB runtime:** PostgreSQL

### Important Runtime Clarification
- The repository has been moved back to a **PostgreSQL-first runtime path**.
- The prior SQLite adapter path has been removed from the intended runtime.
- EH1 has been validated and closed, so PostgreSQL is now the confirmed primary runtime path in the repo.

## Physical Architecture: Implemented Surfaces

### Routing
- `src/app/(marketing)/`
  - Public marketing surface for `/`, `/platform`, `/workflows`, and `/rollout`
- `src/app/(auth)/`
  - Clerk-powered sign-in and sign-up routes
- `src/app/(dashboard)/admin/`
  - Protected staff operations area for dashboard, staff access approvals, customers, meters, tariffs, readings, billing, payments, and collections

### Cross-Cutting Modules
- `src/proxy.ts`
  - Clerk route protection for `/admin/*` in Next.js 16
- `src/lib/prisma.ts`
  - Central Prisma singleton used by server components and server actions with environment-driven PostgreSQL connections
- `src/features/auth/lib/authorization.ts`
  - Central role matrix for protected module access, staff approval state checks, and sensitive server-side capability checks
- `src/features/auth/actions/review-staff-access.ts`
  - Admin and manager approval actions for pending Clerk-linked staff accounts
- `src/components/ui/`
  - Shared `shadcn/ui` primitives only

### Feature Modules
- `src/features/auth/`
  - Auth-shell components, Clerk styling helpers, and first-login sync action
- `src/features/customers/`
  - Customer creation validation, action logic, and listing UI
- `src/features/meters/`
  - Meter registration, assignment, validation, and list UI
- `src/features/tariffs/`
  - Tariff creation, tier validation, and tariff registry UI
- `src/features/readings/`
  - Reading intake, deletion guardrails, approval actions, and approval/history UI
- `src/features/billing/`
  - Billing math, bill generation, unpaid-bill surfaces, and printable bill actions/UI
- `src/features/payments/`
  - Manual payment validation, cashier entry UI, payment history UI, and printable receipt workflow
- `src/features/reports/`
  - Historical collections filtering, receivables analytics, and reporting components
- `src/features/follow-up/`
  - Overdue workflow actions, service-status enforcement, and the dedicated follow-up workspace
- `src/features/notifications/`
  - Notification templates, provider integrations, phone normalization, and delivery logging for customer notices
- `src/features/marketing/`
  - Shared public-site layout, navigation, footer, brand lockup, screenshot showcase components, and centralized site content
- `public/brand/`
  - DWDS PNG logo assets used by the shared brand lockup and related public/admin brand surfaces
- `src/app/icon.png` and `src/app/apple-icon.png`
  - App Router icon files generated from the DWDS shield mark for browser and device icon usage

## Implemented Workflow Boundaries

### Authentication
- Clerk proves identity.
- Local staff records are synchronized on first login.
- Unknown Clerk identities now create pending local staff requests instead of automatically receiving active dashboard access.
- Local role data is enforced through centralized route and capability checks before protected data loads or mutations execute.

### Meter Reading Workflow
- Readings are encoded as `PENDING_REVIEW`.
- Approval transitions readings to `APPROVED`.
- Billing only occurs from approved, still-unbilled readings.

### Billing Workflow
- Bills are generated from approved readings using the active tariff.
- Printable bill views expose issue date, due date, grace period, and display-only disconnection notice.

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
  - `ADMIN` and `MANAGER`: full admin-surface access
  - `CUSTOMER_SERVICE`: customers and meters
  - `METER_READER`: readings entry/history, with deletion restricted to their own pending readings
  - `BILLING_STAFF`: tariffs read-only, readings approval, billing, and collections
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

## Database Schema: Current Repository Snapshot

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
  clerkId   String   @unique
  email     String   @unique
  name      String
  role      Role     @default(CUSTOMER_SERVICE)
  active    Boolean  @default(true)
  readings  Reading[]
  recordedPayments Payment[] @relation("RecordedPayments")
  receivableFollowUpUpdates Bill[] @relation("ReceivableFollowUpUpdatedBy")
  customerStatusUpdates Customer[] @relation("CustomerStatusUpdatedBy")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  ADMIN
  BILLING_STAFF
  CASHIER
  METER_READER
  CUSTOMER_SERVICE
  MANAGER
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
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

enum MeterStatus {
  ACTIVE
  DEFECTIVE
  REPLACED
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
