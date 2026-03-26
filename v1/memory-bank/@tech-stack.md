# DWDS Tech Stack

## Goal
Document the stack that is actually implemented today, the target production stack, and the technologies implied by the enhancement backlog.

## Current Implemented Stack

### App Framework
- **Next.js 16 App Router**
- **TypeScript**
- Single-repo application for both public marketing pages and protected admin workflows

### UI Layer
- **Tailwind CSS**
- **shadcn/ui**
- **lucide-react**

### Forms & Validation
- **React Hook Form**
- **Zod**

### Authentication
- **Auth.js Credentials** for internal admin identity and session management
- **bcrypt** for password hashing
- Local staff role data stored in Prisma `User.role`
- Fine-grained authorization is implemented in app logic through the shared authorization helper
- Password updates are handled through app-native server actions instead of email reset infrastructure
- Temporary-password enforcement is implemented through Auth.js JWT/session flags plus route protection

### Database Runtime in Repo Today
- **Prisma v7**
- **PostgreSQL** for the intended runtime path
- Direct Prisma client connections driven by `DATABASE_URL`

This replaces the earlier SQLite adapter workaround, and live PostgreSQL validation is complete.

## Target Production Stack

### Core Platform
- **Next.js + TypeScript**
- **Prisma**
- **PostgreSQL**
- **Auth.js Credentials**
- **Tailwind CSS + shadcn/ui**

### Planned Supporting Stack
- **Supabase Postgres** as the practical managed PostgreSQL target for the next deployment pass
- **Railway** or another managed platform for app hosting and PostgreSQL if deployment preferences change later
- **Supabase Storage** for uploaded files if receipt, proof, or document storage is formally added
- **Resend** or a similar email provider if notices become a scoped feature
- **Xendit** only when online consumer payments are explicitly added in a later phase
- **Semaphore** as the low-cost Philippine SMS path for overdue follow-up notices

## Current Recommendations by Enhancement Phase

### EH1: Data Platform Hardening
- Standardize on **PostgreSQL** for non-local environments
- Use **Prisma Migrate** as the canonical migration workflow
- Keep `prisma.config.ts` as the datasource binding layer for Prisma v7
- Managed providers such as Supabase should use pooled `DATABASE_URL` runtime access plus direct `DIRECT_URL` migration access
- The baseline PostgreSQL migration is now committed in `prisma/migrations/20260323_eh1_postgresql_baseline/`

### EH2: Authorization & Staff Controls
- Keep internal **Auth.js Credentials** auth
- Authorization is now implemented in app logic through the existing Prisma `Role` enum and the shared helper in `src/features/auth/lib/authorization.ts`
- Internal admin authentication now uses Prisma-backed accounts with bcrypt password hashes and role-based route enforcement
- The first local `SUPER_ADMIN` seed and sign-in path have now been validated
- A future permission layer should only be introduced if the current role model becomes too coarse

### EH3: Reporting & Receivables Intelligence
- EH3 is implemented with server-rendered reporting components and local calculation helpers under `src/features/reports/`
- The current repo still does **not** include reporting-specific chart libraries beyond the base UI stack
- Add reporting libraries only when a concrete enhancement requires them
- Avoid speculative dependencies until reporting requirements are stable

### EH4: Cashiering & Settlement Expansion
- Existing payment flow now supports partial settlements and app-native printable official receipts
- Official receipt generation currently uses server-rendered Next.js routes rather than PDF-specific dependencies
- Add PDF or storage-backed receipt tooling only if the business later requires downloadable archives or uploaded proof
- EH4 has been validated and closed.

### EH5: Overdue & Disconnection Workflow
- This should remain within the main app and database, not a separate service
- Prefer scheduled jobs or explicit server-side evaluation over client-driven status logic
- EH5 is currently implemented with app-native server actions, Prisma-backed follow-up state, a protected `/admin/follow-up` workflow route, Resend-ready email delivery, and Semaphore-ready SMS delivery
- The default low-cost policy is email for all follow-up notices plus SMS for higher-priority templates, configurable through `DWDS_NOTIFICATION_SMS_TEMPLATES`
- EH5 has now been validated and closed.

### EH6: Product Surface Expansion
- Keep marketing, future consumer routes, and admin routes in the same codebase
- Add online-payment or notification vendors only when those channels are actively scoped
- DWDS branding currently relies on repo-served PNG assets under `public/brand/` plus App Router icon files under `src/app/`
- EH6 marketing-surface expansion is implemented, validated, and closed.

### EH7: Tooling & Design Workflow Recovery
- The installed `ui-ux-pro-max` skill remains the design guidance layer
- DWDS now restores the skill's searchable Python workflow through `scripts/run-ui-ux-pro-max.ps1`
- `npm run design:search -- ...` is the stable repo entrypoint for future search-assisted design passes
- The broken Windows Store `python.exe` alias remains a machine-level issue, but the repo no longer depends on it

## Decisions to Keep
- One codebase
- No microservices
- No separate frontend/backend repos
- No native mobile app in the current phase
- No public signup or OAuth surface; keep auth limited to internal admin email/password

## Practical Summary
- **Implemented now:** Next.js, TypeScript, Prisma v7, Auth.js Credentials, Tailwind CSS, shadcn/ui, React Hook Form, Zod, PostgreSQL-first runtime path, app-native printable receipts, notification logging, Resend-ready email, Semaphore-ready SMS, repo-local UI design search launcher, repo-served DWDS PNG brand assets, App Router brand icons
- **Currently validating:** no active enhancement phase
- **Deferred until explicitly scoped:** Xendit, storage-backed uploads, notifications, advanced reporting libraries, PDF-specific receipt tooling, customer credit handling
