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
