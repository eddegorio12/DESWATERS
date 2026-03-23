# DWDS

DWDS is the staff-facing water utility operations system for `DEGORIO WATER DISTRIBUTION SERVICES`. The current app covers customer records, meter management, tariffs, readings, billing, payments, collections reporting, and the public marketing site.

## Environment

- Framework: Next.js 16 App Router
- ORM: Prisma v7
- Primary database path: PostgreSQL
- Auth: Clerk

## Local PostgreSQL Setup

1. Copy `.env.example` into `.env` if needed.
2. Start PostgreSQL locally. A ready-to-run Docker setup is included in [`docker-compose.postgres.yml`](C:\Users\eddeg\OneDrive\Documents\GitHub\DESWATERS\v1\docker-compose.postgres.yml).
3. Confirm `DATABASE_URL` points to `127.0.0.1:55432` for the local Docker database.
4. Generate the Prisma client:

```bash
npm run prisma:generate
```

5. Apply the baseline migration:

```bash
npm run prisma:migrate:dev -- --name init
```

6. Start the app:

```bash
npm run dev
```

## Staging And Production

- Use a managed PostgreSQL instance.
- Set `DATABASE_URL` in the target environment before deployment.
- Apply migrations with:

```bash
npm run prisma:migrate:deploy
```

- Generate the client during build or release with:

```bash
npm run prisma:generate
```

## Current EH1 Notes

- The repo no longer depends on `@prisma/adapter-better-sqlite3` for the intended runtime path.
- The PostgreSQL baseline migration lives in [`prisma/migrations/20260323_eh1_postgresql_baseline/migration.sql`](C:\Users\eddeg\OneDrive\Documents\GitHub\DESWATERS\v1\prisma\migrations\20260323_eh1_postgresql_baseline\migration.sql).
- Local Docker PostgreSQL intentionally uses host port `55432` to avoid collisions with other PostgreSQL services already bound to `5432`.
- Full MVP workflow revalidation against PostgreSQL should be completed before moving to `EH2`.
