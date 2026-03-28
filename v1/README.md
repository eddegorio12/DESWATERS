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
- Optional `SUPER_ADMIN` TOTP two-factor sign-in with recovery codes
- Tailwind CSS 4

## Product Scope

Implemented now:
- internal admin-only email/password sign-in
- optional authenticator-backed `SUPER_ADMIN` two-factor sign-in with one-time recovery codes
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

```bash
docker compose -f docker-compose.postgres.yml up -d
```

This starts the local `dwds-postgres` container on `127.0.0.1:55432` with the `dwds` database.

3. Confirm both `DATABASE_URL` and `DIRECT_URL` point to the local PostgreSQL instance.
4. Install dependencies.

```bash
npm install
```

5. Generate the Prisma client.

```bash
npm run prisma:generate
```

6. Apply the committed migrations to your local database.

```bash
npm run prisma:migrate:deploy
```

7. Start the app.

```bash
npm run dev
```

## Environment Variables

Required:

```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:55432/dwds?schema=public
DIRECT_URL=postgresql://postgres:postgres@127.0.0.1:55432/dwds?schema=public
AUTH_SECRET=
DWDS_2FA_ENCRYPTION_KEY=
NEXT_PUBLIC_SITE_URL=
DWDS_PUBLIC_CONTACT_EMAIL=
DWDS_FIELD_PROOF_STORAGE_DIR=./storage/field-work-proofs
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

Optional SUPER_ADMIN two-factor secret hardening:

- `DWDS_2FA_ENCRYPTION_KEY` lets DWDS encrypt stored TOTP secrets with a dedicated key instead of falling back to `AUTH_SECRET`.
- If you leave it unset, DWDS derives the encryption key from `AUTH_SECRET`.

Optional local protected upload storage:

- `DWDS_FIELD_PROOF_STORAGE_DIR` controls where EH9 field-proof images are stored on disk.
- If unset, DWDS defaults to `./storage/field-work-proofs`.
- Files in that directory are served only through the protected `/admin/exceptions/proofs/[proofId]` route and should stay out of source control.

## Production Deployment

Use a managed PostgreSQL database and set `DATABASE_URL` before deploying.
When using a managed provider, keep `DATABASE_URL` on the runtime connection path and use `DIRECT_URL` for direct migration or restore workflows when available.

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
- The public website now includes canonical/social metadata, crawler routes, generated share previews, and a dedicated rollout-contact path at `/contact`.
- Internal local tooling artifacts, logs, and local databases should not be committed.
- If you deploy the app publicly, describe it as a staff operations system with a public marketing site, not as a consumer portal.
