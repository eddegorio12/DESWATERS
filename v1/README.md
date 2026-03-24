# DWDS

DWDS is a water utility operations platform for `DEGORIO WATER DISTRIBUTION SERVICES`.

The current release is focused on the staff-facing operating system:
- customer records
- meter management
- tariff configuration
- reading intake and approval
- bill generation
- cashier payment posting
- printable bill and receipt output
- collections and receivables reporting
- public marketing pages

The consumer portal is planned, but it is not part of the current deployed scope.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Prisma 7
- PostgreSQL
- Clerk authentication
- Tailwind CSS 4

## Product Scope

Implemented now:
- staff sign-in and approval-gated admin access
- customer, meter, tariff, reading, billing, payment, and collections workflows
- overdue follow-up tracking with notification logging
- public-facing marketing site

Not implemented yet:
- consumer self-service portal
- online customer payments
- public customer notifications beyond the current admin-driven workflow

## Local Setup

1. Copy `.env.example` to `.env`.
2. Start PostgreSQL locally. A ready-to-run Docker setup is included in [`docker-compose.postgres.yml`](./docker-compose.postgres.yml).
3. Confirm `DATABASE_URL` points to the local PostgreSQL instance.
4. Install dependencies.

```bash
npm install
```

5. Generate the Prisma client.

```bash
npm run prisma:generate
```

6. Apply local migrations.

```bash
npm run prisma:migrate:dev -- --name init
```

7. Start the app.

```bash
npm run dev
```

## Environment Variables

Required:

```env
DATABASE_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/admin/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/admin/dashboard
```

Optional notifications:

```env
RESEND_API_KEY=
RESEND_FROM_EMAIL=
SEMAPHORE_API_KEY=
SEMAPHORE_SENDER_NAME=DWDS
DWDS_NOTIFICATION_SMS_TEMPLATES=OFF
```

## Production Deployment

Use a managed PostgreSQL database and set `DATABASE_URL` before deploying.

Apply migrations in production:

```bash
npm run prisma:migrate:deploy
```

Build verification:

```bash
npm run lint
npm run build
```

### First Admin Bootstrap

New Clerk sign-ups do not become active staff automatically. Unknown accounts are created as pending staff requests and must be approved by an existing admin or manager.

Before production launch, make sure the production database already contains one approved `ADMIN` or `MANAGER` user. Without that, nobody can approve staff access from the UI.

## Repository Notes

- This repository is intended to represent the current staff/admin product surface.
- Internal local tooling artifacts, logs, and local databases should not be committed.
- If you deploy the app publicly, describe it as a staff operations system with a public marketing site, not as a consumer portal.
