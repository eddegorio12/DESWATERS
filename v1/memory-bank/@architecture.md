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
  - Protected staff operations area for dashboard, customers, meters, tariffs, readings, billing, payments, and collections

### Cross-Cutting Modules
- `src/proxy.ts`
  - Clerk route protection for `/admin/*` in Next.js 16
- `src/lib/prisma.ts`
  - Central Prisma singleton used by server components and server actions with environment-driven PostgreSQL connections
- `src/features/auth/lib/authorization.ts`
  - Central role matrix for protected module access and sensitive server-side capability checks
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
  - Manual payment validation, cashier entry UI, and payment history UI
- `src/features/reports/`
  - Current-day collections date-range logic and reporting components
- `src/features/marketing/`
  - Shared public-site layout, navigation, footer, and centralized site content

## Implemented Workflow Boundaries

### Authentication
- Clerk proves identity.
- Local staff records are synchronized on first login.
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
- Exact-balance discipline is enforced because customer credit handling does not yet exist.

### Reporting Workflow
- Current reporting is limited to completed payments within the current Manila operating day.
- Historical reporting and broader receivables analytics are not implemented yet.

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

### EH4: Cashiering & Settlement Expansion
- Extend `src/features/payments/` for receipts, installment policies, or customer credit handling.
- Add receipt generation as a dedicated submodule instead of mixing it directly into the current payment form component.
- Keep settlement rules centralized so bill status logic remains consistent.

### EH5: Overdue & Disconnection Workflow
- Introduce dedicated receivables-follow-up or account-status modules rather than overloading billing page logic.
- Treat overdue evaluation, disconnection tracking, and reinstatement as explicit workflow states if they are built.
- Avoid making printed bill language the source of truth for enforcement logic.

### EH6: Product Surface Expansion
- Keep future consumer-portal routes separate from admin routes by route group, not by repository split.
- Public marketing content should stay under `src/features/marketing/` unless a future consumer domain becomes large enough to justify its own feature tree.
- Online payment or notification integrations should be attached to explicit feature modules when those channels are approved.

### EH7: Tooling & Design Workflow Recovery
- The installed `ui-ux-pro-max` skill remains the design guidance source.
- If local Python execution is restored, use the searchable workflow before major new design passes.
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
  status        CustomerStatus @default(ACTIVE)
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

model Payment {
  id          String        @id @default(uuid())
  amount      Float
  paymentDate DateTime      @default(now())
  method      PaymentMethod
  referenceId String?
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
