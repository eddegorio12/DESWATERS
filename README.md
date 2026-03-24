# DESWATERS

DESWATERS is the repository for the `DEGORIO WATER DISTRIBUTION SERVICES` web platform.

The current implemented application lives in [`v1/`](./v1).

This release is the staff-facing utility operations system plus a public marketing site.

## Current Release Scope

Implemented now:
- staff sign-in and approval-gated admin access
- customer, meter, tariff, reading, billing, payment, and collections workflows
- overdue follow-up tracking with notification logging
- public-facing marketing pages

Not implemented yet:
- consumer self-service portal
- online customer payments
- public customer-facing account access

## Features

- Role-gated staff access with Clerk authentication and approval flow
- Customer registry, meter assignment, and tariff configuration
- Reading intake, approval, and bill generation workflow
- Cashier payment posting with printable billing and receipt output
- Receivables reporting plus overdue follow-up and service enforcement states
- Public product pages that present the current DWDS operational surface

## Deployment

- Hosting target: Vercel
- App root directory: `v1`
- Database: PostgreSQL
- Auth: Clerk

For deployment and app-level environment setup, see [`v1/README.md`](./v1/README.md).

## Screenshots

Current repository screenshots are real product captures with sensitive fields redacted for public sharing.

### Operations Dashboard

![DWDS dashboard screenshot](./v1/public/github/dashboard.png)

### Billing Review

![DWDS billing screenshot](./v1/public/github/billing.png)

### Receivables Follow-Up

![DWDS follow-up screenshot](./v1/public/github/follow-up.png)

## Project Location

The active Next.js application is inside [`v1/`](./v1).

Important files:
- app documentation: [`v1/README.md`](./v1/README.md)
- screenshot workflow: [`v1/docs/github-screenshots.md`](./v1/docs/github-screenshots.md)
- app source: [`v1/src/`](./v1/src)
- Prisma schema: [`v1/prisma/schema.prisma`](./v1/prisma/schema.prisma)
- deployment workflow: [`v1/.github/workflows/ci.yml`](./v1/.github/workflows/ci.yml)

## License

This repository is proprietary. See [`LICENSE`](./LICENSE).
