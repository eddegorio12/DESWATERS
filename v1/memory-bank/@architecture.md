# Architecture Document

## Core Architectural Principles

1. **Modularity Preferred over Monoliths**
   - **Highly Modular Structure:** Break down features into separate files and directories (e.g., `features/customers`, `features/billing`, `features/meters`). 
   - **Discourage Monoliths:** Avoid giant, single-file implementations. Each file should have a single responsibility.
   - **Shared Components:** UI components should be isolated in `components/ui` (shadcn/ui), while feature-specific components stay within their feature directory.

2. **Tech Stack**
   - **Framework:** Next.js (App Router) + TypeScript
   - **Database:** PostgreSQL via Prisma ORM
   - **Auth:** Clerk (role-based access management locally in DB)
   - **Styling:** Tailwind CSS + shadcn/ui (guided by `ui-ux-pro-max` skill)
   - **Forms:** React Hook Form + Zod
   - **Storage:** Supabase Storage (pdfs, receipts, photos)
   - **Payments:** Xendit (online) + Manual Cashier encoding

## Physical Architecture Insights (Phase 1.1 Setup)
- **`src/app/`**: Contains the Next.js App Router. We will keep this lean. Any major business logic should be deferred to `src/features/`.
- **`src/components/ui/`**: Reserved exclusively for `shadcn/ui` primitive components (like `button`, `input`, `card`). Do not pollute this with feature-specific components.
- **`prisma/`**: Contains the Prisma schema. It is the single source of truth for our database definitions.

## Physical Architecture Insights (Phase 1.3 Auth Integration)
- **`src/proxy.ts`**: Route protection for Clerk on Next.js 16 lives here. All `/admin/*` routes are guarded through `clerkMiddleware()` and `createRouteMatcher()`.
- **`src/app/(auth)/`**: Contains the custom authentication routes (`/sign-in`, `/sign-up`) rendered with Clerk UI components.
- **`src/app/(dashboard)/admin/dashboard/page.tsx`**: Now serves as the final operations hub for the MVP. It still hosts the first-login sync trigger, but also aggregates current operational counts and links to all live admin modules.
- **`src/features/auth/`**: Holds authentication-specific modules. Shared auth UI wrappers live under `components/`, Clerk styling is isolated in `lib/`, and first-login provisioning lives in `actions/`.
- **`src/features/auth/actions/sync-current-user.ts`**: The first-login sync now reconciles local staff records by `clerkId` first and by unique `email` second. This prevents duplicate-user failures when a local staff row already exists before Clerk is linked.
- **`src/lib/prisma.ts`**: Central Prisma singleton for App Router server components and server actions. Reuse this instead of instantiating `PrismaClient` ad hoc in features. In the current local SQLite mode, it is configured with Prisma v7's `@prisma/adapter-better-sqlite3` driver adapter.

## Physical Architecture Insights (Final MVP Shell)
- **`src/app/(marketing)/page.tsx`**: Public entry page for the finished MVP. It now presents the DESWATERS admin system as a complete operations product rather than a setup validation screen.
- **Dashboard Aggregation Pattern:** The admin dashboard now performs lightweight server-side aggregation for counts and today’s collections summary. This is acceptable for the MVP shell, but heavier analytics should move into dedicated reporting modules if reporting scope expands later.

## Physical Architecture Insights (Public Marketing Surface)
- **`src/app/(marketing)/`**: Public route group for the DESWATERS marketing site. It now owns the root landing page plus supporting public pages like `/platform`, `/workflows`, and `/rollout` without affecting the protected admin route URLs.
- **`src/features/marketing/components/`**: Shared marketing shell, header, footer, and section primitives. Public site composition stays out of `src/components/ui/` so shared primitive components remain focused on app-wide building blocks.
- **`src/features/marketing/lib/site-content.ts`**: Centralized marketing copy and navigation data used across public routes. This keeps page files slimmer and makes future copy updates less error-prone.
- **Admin UI Language Update:** The protected operations pages now use production-facing section labels instead of step-based milestone copy, separating internal build history from live product language.

## Physical Architecture Insights (Phase 2.1 Customer Module)
- **`src/app/(dashboard)/admin/customers/page.tsx`**: Protected customer management route for Step 2.1. It stays server-rendered and fetches the current customer list directly from Prisma.
- **`src/features/customers/actions.ts`**: Contains the `createCustomer` Server Action. Authentication is verified inside the action before any mutation, and the customers page is revalidated after a successful create.
- **`src/features/customers/components/`**: Holds the client-side `CustomerForm` and the presentational `CustomerList`, keeping the route file focused on composition and data loading.
- **`src/features/customers/lib/customer-schema.ts`**: Shared Zod schema for both client-side form validation and server-side input validation to keep the Customer create flow consistent.
- **Direct Dependencies Added:** `react-hook-form`, `@hookform/resolvers`, and `zod` are now first-class dependencies for form handling and validation in feature modules.

## Physical Architecture Insights (Phase 2.2 Meter Module)
- **`src/app/(dashboard)/admin/meters/page.tsx`**: Protected meter management route for Step 2.2. It server-renders the meter registry, current customers, and the unassigned meter pool needed by the assignment form.
- **`src/features/meters/actions.ts`**: Contains `registerMeter` and `assignMeterToCustomer`. Both Server Actions verify authentication internally, validate input via Zod, and revalidate `/admin/meters`, `/admin/customers`, and `/admin/dashboard` after mutation.
- **`src/features/meters/components/`**: Holds the client-side registration and assignment forms plus the presentational meter registry table. This keeps the route file focused on loading and composition.
- **`src/features/meters/lib/meter-schema.ts`**: Shared Zod schemas for meter registration and meter assignment so client and server validation stay aligned.
- **Customer Registry Extension:** `src/features/customers/components/customer-list.tsx` now displays linked meter numbers pulled from Prisma, making Step 2.2 assignments visible from the customer module immediately after revalidation.

## Physical Architecture Insights (Phase 2.3 Tariff Module)
- **`src/app/(dashboard)/admin/tariffs/page.tsx`**: Protected tariff configuration route for Step 2.3. It server-renders the tariff registry and the current active tariff creation form.
- **`src/features/tariffs/actions.ts`**: Contains `createTariff`. The Server Action verifies authentication internally, validates the tariff payload via Zod, deactivates any existing active tariff, creates the new tariff plus nested tiers inside a transaction, and revalidates `/admin/tariffs` plus `/admin/dashboard`.
- **`src/features/tariffs/components/`**: Holds the client-side tariff form with dynamic tier inputs and the presentational tariff registry. The page file remains focused on loading and composition.
- **`src/features/tariffs/lib/tariff-schema.ts`**: Shared Zod schema for tariff metadata and tier validation. It enforces sequential progressive tiers, prevents non-terminal open-ended ranges, and keeps client/server validation aligned for later billing math.
- **Dashboard Navigation Extension:** `src/app/(dashboard)/admin/dashboard/page.tsx` now links directly to `/admin/tariffs`, making Step 2.3 the current validated slice.

## Physical Architecture Insights (Phase 3.1 Reading Module)
- **`src/app/(dashboard)/admin/readings/page.tsx`**: Protected meter reading route for Step 3.1. It server-renders the assigned active meter pool together with the recent reading queue needed for validation.
- **`src/features/readings/actions.ts`**: Contains `createReading`. The Server Action verifies the Clerk session, resolves the matching local Prisma `User` by `clerkId`, reloads the selected meter's latest reading to derive `previousReading`, calculates `consumption`, persists a new `Reading` with `PENDING_REVIEW`, and revalidates `/admin/readings` plus `/admin/dashboard`.
- **`src/features/readings/components/`**: Holds the client-side meter reading form and the presentational reading registry, keeping the route file focused on loading and composition.
- **`src/features/readings/lib/reading-schema.ts`**: Shared Zod schema for meter reading input so client and server validation remain aligned on meter identity and reading values.
- **Dashboard Navigation Extension:** `src/app/(dashboard)/admin/dashboard/page.tsx` now links directly to `/admin/readings`, making Step 3.1 the current validation surface after tariff setup.

## Physical Architecture Insights (Phase 3.2 Reading Approval Workflow)
- **`src/app/(dashboard)/admin/readings/page.tsx`**: Now composes three reading sub-surfaces on one protected route: encoding, pending approval review, and recent reading history.
- **`src/features/readings/actions.ts`**: Now also contains `approveReading` and `approveReadings`. Both Server Actions verify authentication internally, confirm every targeted reading still has `PENDING_REVIEW` status, update the status to `APPROVED`, and revalidate `/admin/readings` plus `/admin/dashboard`.
- **`src/features/readings/components/pending-reading-approvals.tsx`**: Owns the Step 3.2 billing review table, including client-side selection state for bulk approval and row-level approval/delete controls.
- **`src/features/readings/components/approve-reading-button.tsx`**: Isolated client control for individual approval, keeping mutation wiring separate from the approval table layout.
- **Approval Queue Boundary:** Step 3.2 only changes reading status from `PENDING_REVIEW` to `APPROVED`. No bill generation logic is attached yet; Step 3.3 remains a separate workflow after user validation.

## Physical Architecture Insights (Phase 3.3 Billing Module)
- **`src/app/(dashboard)/admin/billing/page.tsx`**: Protected billing route for Step 3.3. It server-renders the active tariff summary, the queue of approved unbilled readings, and the current open bills list.
- **`src/features/billing/actions.ts`**: Contains `generateBill`. The Server Action verifies the Clerk session and local staff profile, ensures the selected reading is `APPROVED` and still unbilled, fetches the active tariff, computes `totalCharges`, creates a new `Bill` with `UNPAID` status, and revalidates `/admin/billing`, `/admin/readings`, and `/admin/dashboard`.
- **`src/features/billing/lib/billing-calculations.ts`**: Centralizes progressive tariff math, billing period formatting, due-date derivation, and currency formatting so billing behavior stays aligned across actions and UI.
- **`src/features/billing/components/approved-reading-bill-queue.tsx`**: Presents the approved-reading work queue for manual bill generation and surfaces the currently active tariff being used for computation.
- **`src/features/billing/components/generate-bill-button.tsx`**: Isolated client control that invokes bill generation from the approved reading queue.
- **`src/features/billing/components/unpaid-bill-list.tsx`**: Presents generated bills whose statuses are still open (`UNPAID`, `PARTIALLY_PAID`, or `OVERDUE`) so Step 3.3 has a visible accounts-receivable surface before payments are built.
- **`src/app/(dashboard)/admin/billing/[billId]/page.tsx`**: Adds a printable consumer bill statement view for individual bill distribution. It renders customer identity, service address, meter reading summary, billing schedule, grace period, and the disconnection penalty notice.
- **Billing Schedule Rule:** The current billing schedule assumes the bill is issued on the `5th day of the month following the reading month`, the due date is `10` days after that issue date, and the grace period ends `5` days after the due date.

## Physical Architecture Insights (Phase 3.4 Payments Module)
- **`src/app/(dashboard)/admin/payments/page.tsx`**: Protected payments route for Step 3.4. It server-renders the open-bill cashier queue together with recent payment history for manual encoding review.
- **`src/features/payments/actions.ts`**: Contains `recordPayment`. The Server Action verifies the Clerk session and local staff profile, validates the payment payload via Zod, ensures the selected bill is still open, creates a `COMPLETED` `Payment`, recalculates bill settlement using cumulative completed payments, and revalidates `/admin/payments`, `/admin/billing`, and `/admin/dashboard`.
- **`src/features/payments/lib/payment-schema.ts`**: Shared Zod schema for manual payment entry so client and server validation stay aligned on bill identity, amount, method, and optional reference ID.
- **`src/features/payments/components/payment-form.tsx`**: Owns the cashier entry workflow and surfaces the currently selected bill's customer, meter, and remaining balance before submission.
- **`src/features/payments/components/payment-history-list.tsx`**: Presents recent payment records with their linked bill statuses so Step 3.4 has an immediate audit surface after manual encoding.
- **Receivables Settlement Rule:** Bill status is now driven by cumulative `Payment.status === COMPLETED` amounts: open bills remain `UNPAID` until the first completed payment, become `PARTIALLY_PAID` while a balance remains, and flip to `PAID` once the running total reaches the bill total. Overpayments are currently rejected because V1 has no credit ledger yet.

## Physical Architecture Insights (Phase 4.1 Collections Dashboard)
- **`src/app/(dashboard)/admin/collections/page.tsx`**: Protected reporting route for Step 4.1. It server-renders the current-day collections summary and the payment records included in that daily total.
- **`src/features/reports/lib/collections.ts`**: Centralizes current operating-day range calculation and label formatting for the collections dashboard, currently aligned to the Manila business timezone.
- **`src/features/reports/components/collections-summary.tsx`**: Presents the reporting date, completed payment count, and summed total collections for the day.
- **`src/features/reports/components/daily-collections-list.tsx`**: Presents the completed payments included in the report so the Step 4.1 total is auditable from the same surface.
- **Daily Reporting Rule:** Step 4.1 only reports `Payment.status === COMPLETED` rows whose `paymentDate` falls within the current operating day window. It does not yet include historical filtering, charts, or unpaid-account analytics.

## Database Schema (Prisma Draft)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Configurable Tariffs
model Tariff {
  id              String      @id @default(uuid())
  name            String      @unique // e.g., "Standard Residential Tariff"
  isActive        Boolean     @default(false)
  
  minimumCharge   Float       // Base fee for 0 usage (e.g., 25)
  minimumUsage    Float       // Usage covered by base fee (e.g., 1 cu.m)
  
  installationFee Float       // One-time fee (e.g., 3000)
  
  tiers           TariffTier[]
  
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}

model TariffTier {
  id          String   @id @default(uuid())
  tariffId    String
  tariff      Tariff   @relation(fields: [tariffId], references: [id])
  
  minVolume   Float    // Lower bound of tier (inclusive)
  maxVolume   Float?   // Upper bound of tier (null = no limit/22+)
  ratePerCuM  Float    // Cost per cubic meter in this tier
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// System Users (Staff)
model User {
  id        String   @id @default(uuid())
  clerkId   String   @unique
  email     String   @unique
  name      String
  role      Role     @default(CUSTOMER_SERVICE)
  active    Boolean  @default(true)
  
  readings  Reading[] // Meter readings performed by this user (if METER_READER)
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

// Customers (Residential)
model Customer {
  id            String   @id @default(uuid())
  accountNumber String   @unique // Generated account number
  name          String
  address       String
  contactNumber String?
  status        CustomerStatus @default(ACTIVE)
  
  meters        Meter[]
  bills         Bill[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum CustomerStatus {
  ACTIVE
  INACTIVE
  DISCONNECTED
}

// Water Meters
model Meter {
  id            String   @id @default(uuid())
  meterNumber   String   @unique
  installDate   DateTime
  status        MeterStatus @default(ACTIVE)
  
  customerId    String?
  customer      Customer? @relation(fields: [customerId], references: [id])
  
  readings      Reading[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum MeterStatus {
  ACTIVE
  DEFECTIVE
  REPLACED
}

// Meter Readings
model Reading {
  id              String   @id @default(uuid())
  meterId         String
  meter           Meter    @relation(fields: [meterId], references: [id])
  
  readerId        String
  reader          User     @relation(fields: [readerId], references: [id])
  
  readingDate     DateTime @default(now())
  previousReading Float
  currentReading  Float
  consumption     Float    // Auto-calculated
  
  status          ReadingStatus @default(PENDING_REVIEW)
  
  bill            Bill?    // The bill generated for this reading
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum ReadingStatus {
  PENDING_REVIEW
  APPROVED
  FLAGGED
}

// Bills generated from Readings
model Bill {
  id            String   @id @default(uuid())
  billingPeriod String   // e.g., "Oct 2026"
  dueDate       DateTime
  
  customerId    String
  customer      Customer @relation(fields: [customerId], references: [id])
  
  readingId     String   @unique
  reading       Reading  @relation(fields: [readingId], references: [id])
  
  usageAmount   Float
  totalCharges  Float
  status        BillStatus @default(UNPAID)
  
  payments      Payment[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum BillStatus {
  UNPAID
  PARTIALLY_PAID
  PAID
  OVERDUE
}

// Payments applied to Bills
model Payment {
  id            String   @id @default(uuid())
  amount        Float
  paymentDate   DateTime @default(now())
  method        PaymentMethod
  referenceId   String?  // Xendit ref, check number, etc.
  
  billId        String
  bill          Bill     @relation(fields: [billId], references: [id])
  
  status        PaymentStatus @default(COMPLETED)
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
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
> **IMPORTANT:** After adding a major feature or completing a milestone, you **must** update this `@architecture.md` file to reflect any schema changes, new modular structures, or new integrations.
