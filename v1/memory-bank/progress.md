# Project Progress

## Phase 1: Foundation & Setup
### Step 1.1: Project Initialization - **[COMPLETED]**
- **Next.js App Router** initialized with TypeScript and Tailwind CSS.
- **shadcn/ui** installed and configured (base registry set up, `utils.ts` and `button.tsx` created).
- **Prisma** installed and initialized (`prisma/schema.prisma` created).
- **Verification:** User validated that `localhost:3000` loads properly without errors via `npm run dev`.

#### 📝 Notes for Future Developers (Phase 1.1)
- **Next.js Init Issue:** The root directory originally had conflicting files (`.agent/`, `memory-bank/`). To bypass Next.js initialization errors, the app was created in a temporary `tmp-next` folder and then moved to the root. If you ever need to re-initialize Next.js, use a similar sub-folder approach.
- **UI Structure:** `shadcn/ui` was configured to use the `src/` directory. All shared primitive components (buttons, dialogs, forms) MUST go into `src/components/ui`, NOT a generic `components` folder in the root.
- **Prisma Setup:** Prisma was installed as a dev dependency (`--save-dev`) and initialized. The schema file `prisma/schema.prisma` is ready to receive the custom schema defined in `@architecture.md`. Do not start adding custom models until Step 1.2 is explicitly triggered.

### Step 1.2: Database Schema - **[COMPLETED]**
- Prisma schema copied explicitly from `@architecture.md` into `prisma/schema.prisma` containing all required models (`Tariff`, `TariffTier`, `User`, `Customer`, `Meter`, `Reading`, `Bill`, `Payment`).
- Prisma Client generated successfully via `npm install @prisma/client` and `npx prisma generate`.
- **Verification:** User must supply a valid `DATABASE_URL` in `.env` and execute `npx prisma db push` to initialize the database tables, then verify with `npx prisma studio`.

#### 📝 Notes for Future Developers (Phase 1.2)
- **Supabase IPv4 Blocker:** The direct connection to Supabase free-tier over port 5432 failed because IPv4 is no longer natively supported on that port. To completely unblock V1 MVP UI development locally, the database provider in `schema.prisma` was temporarily switched from `postgresql` to `sqlite`, and successfully pushed to a local `dev.db` file. Before deploying to production, this should be switched back to PostgreSQL.
- **Prisma v7 Syntax Requirement:** During generation, we faced an error because Prisma v7 **no longer supports the `url` property** directly inside `schema.prisma` under `datasource`. The URL is now strictly handled by the generated `prisma.config.ts` file automatically binding to `process.env["DATABASE_URL"]`. If you need to change DB settings, edit `prisma.config.ts`, not `schema.prisma`.

### Step 1.3: Authentication Setup (Clerk) - **[IMPLEMENTED - USER VALIDATED]**
- `@clerk/nextjs` installed and wired into the root layout with `ClerkProvider`.
- Added custom Clerk-powered sign-in and sign-up routes at `/sign-in` and `/sign-up`.
- Added `src/proxy.ts` using `clerkMiddleware()` to protect all `/admin/*` routes and redirect unauthenticated users to sign-in.
- Added a protected `/admin/dashboard` page as the Step 1.3 validation target.
- Implemented `src/features/auth/actions/sync-current-user.ts` as a first-login Server Action that upserts the Clerk user into the local Prisma `User` table by `clerkId`.
- Added `src/features/auth/components/first-login-sync.tsx` to trigger the user sync automatically after the authenticated dashboard loads.
- Added `.env.example` documenting the Clerk environment variables needed to run the flow locally.
- **User Verification:** User confirmed Step 1.3 was validated and work could proceed to Step 2.1.

#### Notes for Future Developers (Step 1.3)
- **Next.js 16 Middleware Filename:** This project uses Next.js `16.2.1`, so Clerk protection is implemented in `src/proxy.ts`, not `middleware.ts`. This follows Clerk’s current guidance for Next.js 16+.
- **First-Login Sync Pattern:** The local `User` record is not created via webhook in V1. Instead, the dashboard triggers a Server Action that upserts the user after authentication. Do not replace this with webhook logic until a later explicit step.
- **Current Default Role:** Newly provisioned local users default to `CUSTOMER_SERVICE`. Role-specific authorization is not implemented yet and should be added in a later step once the role management flow is defined.
- **Prisma v7 SQLite Requirement:** When using the temporary local SQLite setup, the runtime now depends on `@prisma/adapter-better-sqlite3` plus a freshly generated Prisma Client. If the schema provider changes again later, regenerate the client before assuming runtime compatibility.

### Step 2.1: Customer Entity Module - **[IMPLEMENTED - USER VALIDATED]**
- Added `src/features/customers/actions.ts` with an authenticated Server Action that creates a `Customer` and generates a unique `accountNumber`.
- Added `src/features/customers/lib/customer-schema.ts` to centralize shared Zod validation for customer creation inputs.
- Added `src/features/customers/components/customer-form.tsx` using `react-hook-form` and `zod` for `name`, `address`, and `contactNumber`.
- Added `src/features/customers/components/customer-list.tsx` and the protected route `src/app/(dashboard)/admin/customers/page.tsx` to display all customers from Prisma in the admin UI.
- Updated `src/app/(dashboard)/admin/dashboard/page.tsx` with a direct entry point to the new customer module.
- Installed `react-hook-form`, `@hookform/resolvers`, and `zod` as direct dependencies for the form workflow.
- **User Verification:** User confirmed Step 2.1 was validated and work could proceed to Step 2.2.

#### Notes for Future Developers (Step 2.1)
- **Auth Inside Server Actions:** Even though `/admin/*` routes are protected by Clerk proxy, the `createCustomer` Server Action still verifies authentication before mutating data. Follow this pattern for future modules.
- **Generated Account Numbers:** Customer account numbers are generated server-side during creation using a `CUST-YYYY-XXXXXXXX` format. Do not move account number generation to the client.
- **Step Boundary (Historical):** Step 2.1 originally stopped before meter assignment. That boundary has now been respected and closed by Step 2.2.

### Step 2.2: Meter Entity Module - **[IMPLEMENTED - USER VALIDATED]**
- Added `src/features/meters/actions.ts` with authenticated Server Actions to register a `Meter` and assign an unassigned meter to an existing `Customer`.
- Added `src/features/meters/lib/meter-schema.ts` to centralize Zod validation for meter registration and assignment inputs.
- Added `src/features/meters/components/meter-form.tsx` and `src/features/meters/components/meter-assignment-form.tsx` for meter registration and customer assignment workflows.
- Added `src/features/meters/components/meter-list.tsx` and the protected route `src/app/(dashboard)/admin/meters/page.tsx` to manage and review meters in the admin UI.
- Updated `src/app/(dashboard)/admin/dashboard/page.tsx` to link directly to the new meter module.
- Updated the customer registry to surface linked meter numbers so Step 2.2 assignment results are visible from `/admin/customers`.
- **User Verification:** User confirmed Step 2.2 was validated and work could proceed to Step 2.3.

#### Notes for Future Developers (Step 2.2)
- **Assignment Guardrail:** The assignment flow only lists unassigned meters and also re-checks on the server that a selected meter still has no `customerId` before mutating data.
- **Cross-Module Visibility:** Meter assignment revalidates both `/admin/meters` and `/admin/customers` so the linked meter appears immediately in the customer registry without manual cache work.
- **Step Boundary (Historical):** Step 2.2 is now closed. Continue with Step 2.3 tariff configuration, but do not start Step 2.4 until the user validates the tariff flow.

### Step 2.3: Tariff Configuration (Admin) - **[IMPLEMENTED - USER VALIDATED]**
- Added `src/features/tariffs/actions.ts` with an authenticated Server Action that validates tariff inputs, deactivates any previously active tariff, and creates a new active tariff with nested tiers in a single database transaction.
- Added `src/features/tariffs/lib/tariff-schema.ts` to centralize Zod validation for tariff metadata and progressive tier rules, including guardrails for sequential ranges and open-ended final tiers.
- Added `src/features/tariffs/components/tariff-form.tsx` for configuring `minimumCharge`, `minimumUsage`, `installationFee`, and a dynamic list of tariff tiers from the admin UI.
- Added `src/features/tariffs/components/tariff-list.tsx` and the protected route `src/app/(dashboard)/admin/tariffs/page.tsx` to review configured tariffs and identify the active computing tariff.
- Updated `src/app/(dashboard)/admin/dashboard/page.tsx` to link directly to the new tariff module.
- **User Verification:** User confirmed Step 2.3 was validated and work could proceed to Step 3.1.

#### Notes for Future Developers (Step 2.3)
- **Single Active Tariff Rule:** Creating a new tariff automatically deactivates any currently active tariff before persisting the new one. Billing logic in later steps should resolve the active tariff from the database, not hardcode rates.
- **Tier Validation:** Tariff tiers are validated in shared Zod logic to prevent overlaps, gaps, and non-terminal open-ended tiers. Keep any future billing assumptions aligned with this structure.
- **Step Boundary:** Do not start Step 2.4 or later billing work until the user validates the Step 2.3 tariff test.

### Step 3.1: Meter Reading Encoding - **[IMPLEMENTED - USER VALIDATED]**
- Added `src/features/readings/actions.ts` with an authenticated Server Action that resolves the current Clerk session, looks up the matching local Prisma `User`, derives the selected meter's previous reading from the latest saved reading, calculates `consumption`, and saves the new reading with `PENDING_REVIEW` status.
- Added `src/features/readings/lib/reading-schema.ts` to centralize Zod validation for meter selection and current reading input.
- Added `src/features/readings/components/reading-form.tsx` as the specialized meter reading entry form showing the selected meter's customer, previous reading, and minimum valid next value before submission.
- Added `src/features/readings/components/reading-list.tsx` and the protected route `src/app/(dashboard)/admin/readings/page.tsx` to review the latest encoded readings and confirm they are queued for approval.
- Added a guarded delete action for mistaken encodings so staff can remove unbilled `PENDING_REVIEW` readings directly from the Step 3.1 queue before approval.
- Updated `src/app/(dashboard)/admin/dashboard/page.tsx` to link directly to the new reading module.
- **User Verification:** User confirmed Step 3.1 was validated and work could proceed to Step 3.2.

#### Notes for Future Developers (Step 3.1)
- **Reader Identity Resolution:** The reading form never accepts `readerId` from the client. The server action always derives it from the authenticated Clerk user and the synced local Prisma `User` record.
- **Previous Reading Source of Truth:** The client shows the latest saved reading for guidance, but the server action recalculates `previousReading` from the database again before persisting to prevent stale submissions.
- **Mistake Correction Guardrail:** Deletion is only allowed while a reading is still `PENDING_REVIEW` and has no linked `Bill`, keeping Step 3.1 corrections separate from later approval and billing workflows.
- **Step Boundary (Historical):** Step 3.1 is now closed. Continue with Step 3.2 reading approval, but do not start Step 3.3 until the user validates the approval workflow.

### Step 3.2: Reading Approval Workflow - **[IMPLEMENTED - USER VALIDATED]**
- Extended `src/features/readings/actions.ts` with authenticated approval Server Actions for single-reading approval and bulk approval, both enforcing that only `PENDING_REVIEW` readings can move to `APPROVED`.
- Added `src/features/readings/components/approve-reading-button.tsx` for manual individual approval directly from the pending review queue.
- Added `src/features/readings/components/pending-reading-approvals.tsx` to present all `PENDING_REVIEW` readings with select-all and bulk approval controls for billing review staff.
- Updated `src/app/(dashboard)/admin/readings/page.tsx` to load the pending queue separately, surface the Step 3.2 approval dashboard, and keep recent reading history visible for audit and correction work.
- Updated `src/app/(dashboard)/admin/dashboard/page.tsx` so the dashboard now points to the approval workflow as the current validated slice.
- **User Verification:** User confirmed Step 3.2 was validated and work could proceed to Step 3.3.

#### Notes for Future Developers (Step 3.2)
- **Approval Status Guardrail:** Both approval actions re-check the database and refuse to approve any reading that is no longer `PENDING_REVIEW`, preventing stale bulk selections from mutating already-processed rows.
- **Bulk Review Scope:** The approval dashboard only lists `PENDING_REVIEW` readings, while the recent history table still shows mixed statuses so encoding and approval activity stay auditable on one page.
- **Step Boundary (Historical):** Step 3.2 is now closed. Continue with Step 3.3 bill generation, but do not start Step 3.4 until the user validates the billing workflow.

### Step 3.3: Bill Generation Workflow (Progressive Tier Computing) - **[IMPLEMENTED - PENDING USER VALIDATION]**
- Added `src/features/billing/actions.ts` with an authenticated Server Action that accepts an `APPROVED` reading, rejects duplicate billing attempts, fetches the active tariff, computes the bill total using progressive tiers, and creates an `UNPAID` `Bill`.
- Added `src/features/billing/lib/billing-calculations.ts` to centralize progressive tier billing math, billing period formatting, due-date generation, and currency formatting for billing surfaces.
- Added `src/features/billing/components/generate-bill-button.tsx` for manual bill generation directly from approved readings awaiting billing.
- Added `src/features/billing/components/approved-reading-bill-queue.tsx` to show all approved readings without bills and surface the currently active tariff context during bill generation.
- Added `src/features/billing/components/unpaid-bill-list.tsx` and the protected route `src/app/(dashboard)/admin/billing/page.tsx` to review open bill records after generation.
- Updated `src/app/(dashboard)/admin/dashboard/page.tsx` and `src/app/(dashboard)/admin/readings/page.tsx` to link directly to the new billing module.
- **Pending User Verification:** Open `/admin/billing`, generate a bill from an approved reading where `consumption` is `0` or `1` and verify the saved bill total is exactly the active tariff `minimumCharge` (for example, `25`). Then generate another bill where `consumption` is `8` and verify the saved bill total is exactly `390` when using the configured sample tariff tiers.

#### Notes for Future Developers (Step 3.3)
- **Bill Generation Guardrail:** Billing is allowed only for readings with `APPROVED` status and no existing linked bill. The server action re-checks both conditions before writing.
- **Tariff Coverage Guardrail:** Progressive charge calculation now throws if the active tariff does not fully cover the billable usage range above `minimumUsage`, preventing silent underbilling from malformed tariff tiers.
- **Current Billing Defaults:** Generated bills use the reading month as `billingPeriod`, set `usageAmount` from `Reading.consumption`, default to `UNPAID`, and currently assign a due date `15` days after the reading date.
- **Step Boundary:** Do not start Step 3.4 payment recording until the user validates the Step 3.3 billing test.

### Blockers / Next Steps
- Waiting for user to validate Step 3.3 by generating bills in `/admin/billing` and confirming the saved totals match the active progressive tariff.
- Do not start **Step 3.4** until the user validates the Step 3.3 test.
