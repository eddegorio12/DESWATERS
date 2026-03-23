# Implementation Plan: Version 1 (MVP)

This document provides step-by-step instructions for AI developers building the MVP of the DESWATERS admin application. 
- **Focus:** The base game (MVP) – Admin Web App for managing customers, meters, and basic reading/billing.
- **Rule:** Steps must be small, concrete, and verified before moving to the next. No monolithic code drops.
- **Prerequisite:** Developers must read `memory-bank/@architecture.md` and `memory-bank/@product-requirements-document.md`.

---

## Phase 1: Foundation & Setup

### Step 1.1: Project Initialization
1. Initialize a new Next.js project with App Router, TypeScript, and Tailwind CSS.
2. Install `shadcn/ui` and initialize its base setup.
3. Install Prisma and initialize the schema.
**Test:** Run `npm run dev`. The default Next.js page should load without errors at `localhost:3000`.

### Step 1.2: Database Schema Implementation
1. Copy the draft schema from `memory-bank/@architecture.md` into `prisma/schema.prisma`.
2. Generate the Prisma client.
3. Push the schema to the configured PostgreSQL database (e.g., local Docker db or remote string).
**Test:** Run Prisma Studio (`npx prisma studio`). Verify all entities (`User`, `Customer`, `Meter`, `Reading`, `Bill`, `Payment`) exist and relationships are correct.

### Step 1.3: Authentication Setup (Clerk)
1. Install and configure Clerk provider in the root layout.
2. Create custom sign-in and sign-up pages using Clerk components.
3. Protect the `/admin` route group so unauthenticated users are redirected to `/sign-in`.
4. Implement an on-first-login Server Action to upsert the Clerk user into the local `User` database table using `clerkId`. Do not implement webhooks at this stage.
**Test:** Attempt to navigate to `/admin/dashboard`. Verify you are redirected to the sign-in page. Sign in and verify you land on the protected dashboard, and that the local database has a new `User` record with the corresponding `clerkId`.

---

## Phase 2: Core Records Management

### Step 2.1: Customer Entity Module
1. Create `features/customers/actions.ts` containing a Server Action to create a new `Customer`.
2. Create `features/customers/components/customer-form.tsx` using `react-hook-form` and `zod` to input name, address, and contact number.
3. Create an API route or server component to list all customers.
**Test:** Fill out the creation form in the UI. Submit it. Verify the new customer appears in the list view immediately.

### Step 2.2: Meter Entity Module
1. Create `features/meters/actions.ts` with a Server Action to register a `Meter`.
2. Create a form component to input `meterNumber` and `installDate`.
3. Create a Server Action to assign an unassigned meter to an existing `Customer`.
**Test:** Create a meter. Assign it to the customer created in Step 2.1. Verify the customer record now shows the linked meter.

### Step 2.3: Tariff Configuration (Admin)
1. Create `features/tariffs/actions.ts` to manage active tariff rules and tiers.
2. Build an Admin dashboard to configure the Progressive Tiered Billing rules so they are not hardcoded.
3. The UI must support defining a `minimumCharge` (e.g. 25), `minimumUsage` (e.g. 1 cu.m), an `installationFee` (e.g. 3000), and a dynamic list of Tiers (minVolume, maxVolume, ratePerCuM).
**Test:** Create a tariff matching the PRD rules (25 min, tiers: 2-7 @ 50, 8-11 @ 65, etc.) and save it. Verify it is marked as the active computing tariff in the database.

---

## Phase 3: Operations Workflow

### Step 3.1: Meter Reading Encoding
1. Create `features/readings/actions.ts` to log a new reading for a specific meter.
2. The Server Action must automatically securely resolve the currently logged-in Clerk session, lookup the local `User` ID, and set it as `readerId`. Never accept `readerId` from the client.
3. Create a specialized form allowing a meter reader to select a meter, view its `previousReading`, and input a `currentReading`.
4. Implement logic in the Server Action to auto-calculate `consumption` (current - previous) and save with a default status of `PENDING_REVIEW`.
**Test:** Submit a new reading where current > previous. Verify the database saves the reading with the correct calculated `consumption` value, the correct `readerId`, and a status of `PENDING_REVIEW`.

### Step 3.2: Reading Approval Workflow
1. Create a dashboard for Billing Staff to view all `PENDING_REVIEW` readings.
2. Implement Server Actions to support bulk approval and manual individual approval of readings (updating status from `PENDING_REVIEW` to `APPROVED`).
**Test:** Approve the reading created in Step 3.1. Verify its status in the database updates to `APPROVED`.

### Step 3.3: Bill Generation Workflow (Progressive Tier Computing)
1. Create `features/billing/actions.ts` with a function that takes an `APPROVED` `Reading` and generates a `Bill`.
2. Fetch the active `Tariff` from the database.
3. **Crucial Math Implementation:** Calculate the `totalCharges` using progressive tiers:
    - If consumption is 0 or 1, charge the `minimumCharge` (e.g., 25).
    - If consumption > 1, charge the `minimumCharge` + calculate the remaining volume sequentially through configured `TariffTiers`. (e.g., for 8 cu.m: Base 25 + (6 * 50 for tier 1) + (1 * 65 for tier 2) = 390).
4. Create a dashboard view that lists all unpaid bills.
**Test:** Generate a bill manually from an approved reading where consumption is 0. Verify the bill is exactly 25. Generate another bill where consumption is 8. Verify the bill totals exactly 390.

### Step 3.4: Manual Payment Recording
1. Create `features/payments/actions.ts` to record a manual cash payment against a specific `Bill`. (No Xendit integration for V1).
2. Create a cashier form where a bill ID is selected, an amount is entered, and the method is set to `CASH` (or other manual methods).
3. Implement logic to update the `Bill` status to `PAID` if the payment covers the total charges.
**Test:** Record a payment exactly matching a bill's total charges. Verify the bill status updates from `UNPAID` to `PAID`.

---

## Phase 4: Basic Reporting 

### Step 4.1: Collections Dashboard
1. Create a server component fetching all `Payment` records for the current day.
2. Calculate and display the total sum of payments.
**Test:** Record two test payments. Verify the dashboard accurately displays the sum of those two payments for today.
