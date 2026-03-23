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
- **Clerk** for identity and session management
- Local staff role data stored in Prisma `User.role`
- Fine-grained authorization is **not fully implemented yet**

### Database Runtime in Repo Today
- **Prisma v7**
- **SQLite** for the current local development runtime
- **`@prisma/adapter-better-sqlite3`** in the server runtime

This is a temporary development compromise, not the long-term data-platform target.

## Target Production Stack

### Core Platform
- **Next.js + TypeScript**
- **Prisma**
- **PostgreSQL**
- **Clerk**
- **Tailwind CSS + shadcn/ui**

### Planned Supporting Stack
- **Railway** or another managed platform for app hosting and PostgreSQL
- **Supabase Storage** for uploaded files if receipt, proof, or document storage is formally added
- **Resend** or a similar email provider if notices become a scoped feature
- **Xendit** only when online consumer payments are explicitly added in a later phase

## Current Recommendations by Enhancement Phase

### EH1: Data Platform Hardening
- Standardize on **PostgreSQL** for non-local environments
- Use **Prisma Migrate** as the canonical migration workflow
- Keep `prisma.config.ts` as the datasource binding layer for Prisma v7

### EH2: Authorization & Staff Controls
- Keep **Clerk** for auth
- Build authorization in app logic using the existing Prisma `Role` enum or a future permission layer if the role model becomes too coarse

### EH3: Reporting & Receivables Intelligence
- The current repo does **not** yet include reporting-specific chart or table libraries beyond the base UI stack
- Add reporting libraries only when a concrete enhancement requires them
- Avoid speculative dependencies until reporting requirements are stable

### EH4: Cashiering & Settlement Expansion
- Existing payment flow is sufficient for manual encoding
- Add PDF or receipt-generation tooling only when official receipts are formally implemented

### EH5: Overdue & Disconnection Workflow
- This should remain within the main app and database, not a separate service
- Prefer scheduled jobs or explicit server-side evaluation over client-driven status logic

### EH6: Product Surface Expansion
- Keep marketing, future consumer routes, and admin routes in the same codebase
- Add online-payment or notification vendors only when those channels are actively scoped

### EH7: Tooling & Design Workflow Recovery
- The installed `ui-ux-pro-max` skill remains the design guidance layer
- The skill’s local searchable Python workflow is currently blocked by the environment and should be restored before future heavy UI redesign work

## Decisions to Keep
- One codebase
- No microservices
- No separate frontend/backend repos
- No native mobile app in the current phase
- No custom auth build while Clerk is sufficient

## Practical Summary
- **Implemented now:** Next.js, TypeScript, Prisma v7, Clerk, Tailwind CSS, shadcn/ui, React Hook Form, Zod, SQLite local runtime
- **Target next for platform hardening:** PostgreSQL migration and environment parity
- **Deferred until explicitly scoped:** Xendit, storage-backed uploads, notifications, advanced reporting libraries, receipt-generation tooling
