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

### Step 1.3: Authentication Setup (Clerk) - **[IMPLEMENTED - PENDING USER VALIDATION]**
- `@clerk/nextjs` installed and wired into the root layout with `ClerkProvider`.
- Added custom Clerk-powered sign-in and sign-up routes at `/sign-in` and `/sign-up`.
- Added `src/proxy.ts` using `clerkMiddleware()` to protect all `/admin/*` routes and redirect unauthenticated users to sign-in.
- Added a protected `/admin/dashboard` page as the Step 1.3 validation target.
- Implemented `src/features/auth/actions/sync-current-user.ts` as a first-login Server Action that upserts the Clerk user into the local Prisma `User` table by `clerkId`.
- Added `src/features/auth/components/first-login-sync.tsx` to trigger the user sync automatically after the authenticated dashboard loads.
- Added `.env.example` documenting the Clerk environment variables needed to run the flow locally.
- **Pending User Verification:** Set valid Clerk keys in `.env`, visit `/admin/dashboard` while signed out, confirm redirect to `/sign-in`, sign in, then confirm the dashboard loads and a matching `User` row is present in the local database.

#### Notes for Future Developers (Step 1.3)
- **Next.js 16 Middleware Filename:** This project uses Next.js `16.2.1`, so Clerk protection is implemented in `src/proxy.ts`, not `middleware.ts`. This follows Clerk’s current guidance for Next.js 16+.
- **First-Login Sync Pattern:** The local `User` record is not created via webhook in V1. Instead, the dashboard triggers a Server Action that upserts the user after authentication. Do not replace this with webhook logic until a later explicit step.
- **Current Default Role:** Newly provisioned local users default to `CUSTOMER_SERVICE`. Role-specific authorization is not implemented yet and should be added in a later step once the role management flow is defined.
- **Prisma v7 SQLite Requirement:** When using the temporary local SQLite setup, the runtime now depends on `@prisma/adapter-better-sqlite3` plus a freshly generated Prisma Client. If the schema provider changes again later, regenerate the client before assuming runtime compatibility.

### Blockers / Next Steps
- Waiting for user to validate Step 1.3 end-to-end with real Clerk credentials and confirm the local `User` upsert.
- Do not start **Step 2.1: Customer Entity Module** until the user validates the Step 1.3 test.
