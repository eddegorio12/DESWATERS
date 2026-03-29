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
- **pgvector** in PostgreSQL is the recommended first vector store for the planned staff assistant

### Authentication and Security
- **Auth.js Credentials** for internal staff sign-in
- **bcrypt** for password hashing
- Built-in Node crypto helpers for optional `SUPER_ADMIN` TOTP secret encryption, code verification, and recovery-code hashing
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
- Do not default to card grids as the main composition system; reserve cards for stateful/actionable objects and use lighter-weight grouping for navigation, summaries, and support content
- Treat public-site SEO, social metadata, and accessibility as part of the implementation baseline for the marketing surface, not as post-launch cleanup

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
- No separate hosted vector database for the first assistant slice unless PostgreSQL proves insufficient

## Feature Guidance

### Billing, Printing, and Distribution
- Keep billing, bill finalization, print tracking, and distribution workflow inside the main Next.js app and PostgreSQL database
- Use database state and audit tables instead of external workflow tools
- Generate printable views from server-rendered routes before adding PDF-specific tooling

### Exceptions, Complaints, and Work Orders
- Store alerts, tickets, work orders, and repair history in PostgreSQL
- Keep meter replacement history in the same PostgreSQL core and exceptions workflow rather than separate asset logs or spreadsheets
- Keep technician assignment and field-proof uploads in the same app
- Start with protected local storage for field-proof images and move to object storage only when production rollout requires it

### Notices and Notifications
- Start with printable templates generated in-app
- Add **Resend** only if email delivery is actively used
- Add **Semaphore** only if SMS delivery is actively used
- Do not add notification infrastructure before templates, logs, and approval rules are stable

### Tariffs, Audits, and Security
- Keep tariff versioning, billing-cycle state, and admin audit trails in the core relational schema
- Add session timeout, lockout, login history, and optional `SUPER_ADMIN` 2FA within the existing auth model
- Keep admin-account management audit trails in the same Prisma/PostgreSQL core through dedicated event tables rather than console-only logging
- Do not split security logs into a separate system unless compliance requirements demand it

### Backups and Recovery
- Treat managed PostgreSQL backups as the primary recovery layer
- Add app-visible backup status, monthly snapshot exports, and documented restore steps
- Prefer protected app-native CSV/JSON recovery exports for operational handoff before building deeper restore automation
- Prefer database exports and tested restore procedures over custom backup engines

### Reporting and Analytics
- Build management dashboards from PostgreSQL queries and server-rendered UI first
- Add a charting library only when specific dashboards need it
- Avoid a warehouse, BI stack, or separate analytics service in the current phase

### Staff AI Assistant
- Keep the first assistant slice inside the current Next.js + PostgreSQL + Prisma architecture
- Use OpenRouter as the LLM gateway for the planned assistant feature
- Default to `openrouter/free` for the first slice, with configured fallbacks such as `stepfun/step-3.5-flash:free` and `nvidia/nemotron-3-super-120b-a12b:free`
- Prefer hybrid retrieval with metadata filtering and reranking over a pure embedding-only approach
- Keep assistant answers read-only and role-aware in the first release
- Persist assistant knowledge chunks, ingestion runs, and per-user conversation history in PostgreSQL before adding broader model-backed behavior

### Workflow Usability
- Prefer reusable search/filter/status-chip controls implemented inside the current React/Tailwind/shadcn stack
- Avoid introducing heavy grid frameworks or admin-template dependencies just to compensate for weak page-level UX
- Fix dense operational pages by improving structure and interaction patterns first, not by adding more tooling
- Finish the shared usability pattern rollout on remaining admin modules before adding dashboard-specific libraries or isolated analytics widgets
- Treat meters as the first remaining rollout target because it is a high-frequency operational module and a good baseline for the remaining EH13 passes
- When refining visual quality, prefer composition changes over decorative escalation: fewer nested panels, fewer equal-weight tiles, and stronger hierarchy from layout and typography rather than more shadows, gradients, and rounded containers
- For enterprise dashboard refinement, prefer reusable console primitives inside the current Tailwind/shadcn stack over page-specific styling drift: consistent metric cards, sidebar items, section headers, action rows, and status badges should carry the visual system
- EH14.1 now establishes those console primitives in the repo for the protected shell and dashboard, so future admin-surface refinement should extend them instead of introducing parallel dashboard styling systems
- EH14.2 is now validated on the homepage in the repo: the same Next.js/Tailwind/shadcn stack now drives a sharper hero promise, an early proof strip, screenshot-led editorial sections, and tighter repeated CTA language instead of large equal-weight feature grids

### Public Website Delivery
- Use Next.js metadata APIs for page titles, descriptions, Open Graph, Twitter cards, canonical URLs, and crawler-facing route metadata
- Keep share-preview assets, screenshot assets, and brand assets inside the current app/repo structure rather than introducing a separate marketing stack
- Prefer simple app-native contact/demo request wiring before adding third-party marketing automation
- Run accessibility and reduced-motion verification inside the existing React/Tailwind stack before adding more visual complexity

## Current Repo Alignment
- The repo already aligns with this direction: Next.js, TypeScript, Prisma, PostgreSQL-first runtime, Auth.js credentials auth, Tailwind, shadcn/ui, React Hook Form, and Zod
- EH8 now keeps billing-cycle state, bill finalization locks, print batches, distribution statuses, and audit history inside the same Prisma/PostgreSQL core instead of pushing that workflow into external tools
- Current notification hooks remain optional integrations, not required core infrastructure
- Current printable outputs should continue to use app-native rendering unless archival/download requirements become stronger
- The current EH11 recovery path now also includes a protected app-native export route for snapshot logs, login outcomes, readiness flags, and restore guidance
- The current EH9 field-service path now also keeps complaint-driven work orders inside the same app and PostgreSQL core instead of splitting dispatch into external tools
- The current EH9 field-service path now also keeps leak-report tracking and repair-history persistence inside the same app and PostgreSQL core instead of pushing that operational history into external logs or spreadsheets
- The current EH9 field-service path now also keeps meter replacement history inside the same app and PostgreSQL core, linked directly to completed meter-linked work orders and the meter registry
- The current EH9 field-service path now also keeps field-proof image metadata in the Prisma/PostgreSQL core while storing protected image files on local disk behind an authenticated route
- The current planned improvement lane is a website-fundamentals pass on top of validated EH14.2, then broader EH14 composition refinement, then broader management analytics and audit/security refinements, not a tooling or platform rewrite
- The newly planned EH15 assistant lane should follow that same bias: stay in the current app and PostgreSQL stack, prefer `pgvector` over a separate vector service, and treat retrieval quality and role-aware refusal behavior as product requirements rather than optional polish

## Practical Summary
- **Keep:** Next.js, TypeScript, PostgreSQL, Prisma, Auth.js Credentials, bcrypt, built-in Node crypto for optional `SUPER_ADMIN` 2FA, Tailwind CSS, shadcn/ui, React Hook Form, Zod
- **Use later only if needed:** Supabase Storage, Resend, Semaphore, charting library, PDF tooling
- **Do not add yet:** microservices, separate API service, second database, queue platform, public auth providers, online payment provider
