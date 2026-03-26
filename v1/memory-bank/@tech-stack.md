# DWDS Tech Stack

## Goal
Define the simplest stack that is still robust enough for an internal, money-handling water utility system.

## Default Stack

### Application
- **Next.js 16 App Router**
- **TypeScript**
- Single codebase for public pages and protected admin workflows

### Data and Server
- **PostgreSQL** as the only production database
- **Prisma v7** for schema, migrations, and data access
- Next.js server actions and route handlers for business logic

### Authentication and Security
- **Auth.js Credentials** for internal staff sign-in
- **bcrypt** for password hashing
- Role-based authorization enforced in server-side app logic

### UI and Validation
- **Tailwind CSS**
- **shadcn/ui**
- **React Hook Form**
- **Zod**

### UX Implementation Direction
- Reuse shared list, form, and status patterns instead of building page-specific interaction models repeatedly
- Keep operator-facing screens optimized for fast scanning and clear next actions
- Treat tablet and narrow laptop layouts as real internal-use targets, not edge cases

## Production Recommendation

### Keep This Simple
- One app
- One PostgreSQL database
- One Prisma schema
- One internal auth system
- One deployment target for the web app

### Preferred Hosting Shape
- Host the app on **Vercel** or a similarly simple Node/Next.js platform
- Host the database on **Supabase Postgres**

This is the simplest robust default because it avoids self-hosted database work, keeps Prisma/Postgres first-class, and does not introduce extra backend services.

## What To Avoid
- No microservices
- No separate frontend/backend repos
- No second database
- No native mobile app in the current phase
- No public signup or OAuth for the internal admin system
- No event bus, queue system, or background worker service unless scale or reliability requirements prove they are necessary
- No speculative vendor integrations before the workflow exists in the core app

## Feature Guidance

### Billing, Printing, and Distribution
- Keep billing, bill finalization, print tracking, and distribution workflow inside the main Next.js app and PostgreSQL database
- Use database state and audit tables instead of external workflow tools
- Generate printable views from server-rendered routes before adding PDF-specific tooling

### Exceptions, Complaints, and Work Orders
- Store alerts, tickets, work orders, and repair history in PostgreSQL
- Keep technician assignment and field-proof uploads in the same app
- Add object storage only when photo uploads become active in production

### Notices and Notifications
- Start with printable templates generated in-app
- Add **Resend** only if email delivery is actively used
- Add **Semaphore** only if SMS delivery is actively used
- Do not add notification infrastructure before templates, logs, and approval rules are stable

### Tariffs, Audits, and Security
- Keep tariff versioning, billing-cycle state, and admin audit trails in the core relational schema
- Add session timeout, lockout, login history, and optional `SUPER_ADMIN` 2FA within the existing auth model
- Do not split security logs into a separate system unless compliance requirements demand it

### Backups and Recovery
- Treat managed PostgreSQL backups as the primary recovery layer
- Add app-visible backup status, monthly snapshot exports, and documented restore steps
- Prefer database exports and tested restore procedures over custom backup engines

### Reporting and Analytics
- Build management dashboards from PostgreSQL queries and server-rendered UI first
- Add a charting library only when specific dashboards need it
- Avoid a warehouse, BI stack, or separate analytics service in the current phase

### Workflow Usability
- Prefer reusable search/filter/status-chip controls implemented inside the current React/Tailwind/shadcn stack
- Avoid introducing heavy grid frameworks or admin-template dependencies just to compensate for weak page-level UX
- Fix dense operational pages by improving structure and interaction patterns first, not by adding more tooling

## Current Repo Alignment
- The repo already aligns with this direction: Next.js, TypeScript, Prisma, PostgreSQL-first runtime, Auth.js credentials auth, Tailwind, shadcn/ui, React Hook Form, and Zod
- EH8 now keeps billing-cycle state, bill finalization locks, print batches, distribution statuses, and audit history inside the same Prisma/PostgreSQL core instead of pushing that workflow into external tools
- Current notification hooks remain optional integrations, not required core infrastructure
- Current printable outputs should continue to use app-native rendering unless archival/download requirements become stronger
- The next planned improvement lane is EH13 usability refinement on top of the existing stack, not a tooling or platform rewrite

## Practical Summary
- **Keep:** Next.js, TypeScript, PostgreSQL, Prisma, Auth.js Credentials, bcrypt, Tailwind CSS, shadcn/ui, React Hook Form, Zod
- **Use later only if needed:** Supabase Storage, Resend, Semaphore, charting library, PDF tooling
- **Do not add yet:** microservices, separate API service, second database, queue platform, public auth providers, online payment provider
