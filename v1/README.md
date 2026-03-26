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
- Auth.js credentials authentication
- Tailwind CSS 4

## Product Scope

Implemented now:
- internal admin-only email/password sign-in
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
AUTH_SECRET=
SEED_ADMIN_NAME=
SEED_ADMIN_EMAIL=
SEED_ADMIN_PASSWORD=
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

There is no public signup flow. Seed the first `SUPER_ADMIN` account with environment variables, then create the remaining admin accounts from `/admin/staff-access`.

Seed locally:

```bash
npm run prisma:seed
```

## Repository Notes

- This repository is intended to represent the current staff/admin product surface.
- Internal local tooling artifacts, logs, and local databases should not be committed.
- If you deploy the app publicly, describe it as a staff operations system with a public marketing site, not as a consumer portal.
