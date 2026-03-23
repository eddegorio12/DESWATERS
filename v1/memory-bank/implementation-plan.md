# Implementation Plan: Version 1 (MVP)

This document now reflects the **implemented MVP state** of the DESWATERS admin application.
- **Focus:** Finalized admin web app for customer records, meter operations, billing, payments, collections, and printable consumer bills.
- **Rule:** Future work should be added as explicit enhancement phases rather than reopening completed MVP steps.
- **Prerequisite:** Developers must still read `memory-bank/@architecture.md` and `memory-bank/@product-requirements-document.md` before making architecture or product changes.

---

## Completed MVP Scope

### Phase 1: Foundation & Setup
1. Next.js App Router project initialized with TypeScript and Tailwind CSS.
2. `shadcn/ui` base setup installed and configured under `src/components/ui`.
3. Prisma initialized and connected to the current local SQLite-backed development setup.
4. Clerk authentication added with protected `/admin/*` routing and first-login local user sync.

**Delivered outcome:** Staff can sign in, reach protected admin routes, and be provisioned into the local `User` table automatically.

### Phase 2: Core Records Management
1. Customer module implemented for creating and listing customer accounts.
2. Meter module implemented for registering meters and assigning them to customers.
3. Tariff module implemented for managing the active progressive billing tariff and tariff tiers.

**Delivered outcome:** Operations staff can maintain the core records needed for utility billing without hardcoded customer, meter, or tariff data.

### Phase 3: Operations Workflow
1. Meter reading encoding implemented with authenticated reader identity resolution and server-side consumption calculation.
2. Reading approval workflow implemented with individual and bulk approval support.
3. Bill generation workflow implemented using active tariff rules and progressive tier computation.
4. Manual payment recording implemented with cumulative settlement logic for `UNPAID`, `PARTIALLY_PAID`, and `PAID` bills.
5. Printable consumer bill template implemented with the current billing schedule:
   - bill issue date: `5th day of the month following the reading month`
   - due date: `10 days after bill issue date`
   - grace period end: `5 days after due date`
   - penalty notice: `disconnection`

**Delivered outcome:** Staff can move accounts end-to-end from reading entry through approval, billing, payment encoding, and printed bill distribution.

### Phase 4: Basic Reporting
1. Collections dashboard implemented as a server-rendered reporting route.
2. Daily collections total implemented from `COMPLETED` payments for the current operating day.
3. Collections detail table implemented so the daily total is auditable from the same screen.

**Delivered outcome:** Cashier and billing staff can review the current day’s completed payments and total collections from a dedicated reporting surface.

---

## Current MVP Validation Targets

1. Sign in and confirm `/admin/dashboard` loads with live operations counts.
2. Create or review a customer, assigned meter, active tariff, approved reading, generated bill, and recorded payment.
3. Open `/admin/billing/[billId]` through the billing table and confirm the printable consumer bill shows the correct issue date, due date, grace period, and disconnection penalty notice.
4. Open `/admin/collections` and confirm the displayed total matches the sum of completed payments recorded for the current operating day.

---

## Future Enhancement Backlog

1. Replace the temporary SQLite local development setup with the intended production PostgreSQL workflow.
2. Add historical reporting filters, charts, and unpaid-account analytics beyond the current daily collections view.
3. Introduce automated overdue handling and any future disconnection workflow logic, if the business wants system-enforced penalties rather than display-only notices.
4. Add role-based authorization beyond authentication and local role storage.
5. Add official receipt generation, installment handling, or customer credit logic if the cashier workflow expands beyond exact-balance settlement.
