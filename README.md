<div align="center">
  <h1>💧 DESWATERS</h1>
  <p><strong>Degorio Water Distribution Services</strong></p>
  <p>A modern, enterprise-grade utility operations platform for water distribution management.</p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-14-black" alt="Next.js" />
    <img src="https://img.shields.io/badge/TypeScript-5.0-blue" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Prisma-ORM-2D3748" alt="Prisma" />
    <img src="https://img.shields.io/badge/Database-PostgreSQL-336791" alt="PostgreSQL" />
  </p>
</div>

<br />

Welcome to **DESWATERS**, the core software infrastructure for **Degorio Water Distribution Services (DWDS)**. Designed as a robust, staff-facing operational node, it governs the end-to-end lifecycle of utility operations—from meter reading to billing, payments, and overdue follow-ups.

---

## 🌟 Key Features

The current release provides a comprehensive **staff-facing utility operations system** alongside a **public marketing surface**.

### 🔐 Secure Identity & Access
- **Role-Gated Authorization:** Granular access permissions enforced through Auth.js credentials.
- **Admin Safeguards:** Supervisor-level approvals with session lockouts and rigorous authentication standards.

### 🏢 Core Operations
- **Customer & Meter Registry:** Lifecycle management, assignments, and property tracking.
- **Tariff Governance:** Transparent, versioned tariff controls tailored for scale.
- **Billing & Settlement:** Intake, approval workflows, meter reading conversion, and automated bill generation.
- **Cashiering:** Manual posting support with printable statements and official receipt outputs (A5-ready).

### 📈 Analytics & Workflows
- **Receivables & Follow-Up:** Comprehensive overdue tracking, service enforcement states, and printable disruption notices.
- **Operational Exceptions:** Proactive anomaly detection for skipped readings and unusual consumptions.
- **Route Distribution:** Route-grouped reporting to streamline physical bill delivery and tracking.

> **Note:** The future product roadmap involves expansions toward a dedicated *Consumer Web Portal* to allow self-serve billing checks, online payments, and direct account administration.

---

## 📸 Platform Previews

Real product captures, with sensitive constituent fields explicitly redacted for privacy and security.

### Operations Dashboard
> *A high-level command center highlighting active routing, billing queues, and system performance.*
<img src="./v1/public/github/dashboard.png" alt="Operations Dashboard" width="800" />

### Billing Review
> *Streamlined assessment interfaces for pending bills, approvals, and settlements.*
<img src="./v1/public/github/billing.png" alt="Billing Review" width="800" />

### Receivables Follow-Up
> *Comprehensive ledger of outstanding statements, aging statuses, and disruption checkpoints.*
<img src="./v1/public/github/follow-up.png" alt="Receivables Follow-Up" width="800" />

---

## 🛠️ Technology Stack

Our tech stack is strictly typed and designed for enterprise velocity.

- **Frontend/Framework:** [Next.js (App Router)](https://nextjs.org) + [Tailwind CSS](https://tailwindcss.com) & [shadcn/ui](https://ui.shadcn.com) for clean, accessible primitives.
- **Database:** [PostgreSQL](https://postgresql.org) managed via [Prisma ORM](https://prisma.io).
- **Authentication:** In-house credentials module powered by [Auth.js](https://authjs.dev) + `bcrypt` passwords.
- **Deployment:** Vercel.

---

## 📂 Project Structure

The active platform architecture is housed entirely within the `v1/` directory.

| Component / File | Description |
| :--- | :--- |
| **[`v1/`](./v1)** | Global root for the active web application. |
| **[`v1/README.md`](./v1/README.md)** | Developer onboarding, environment variables, and deployment instructions. |
| **[`v1/src/`](./v1/src)** | Application codebase (app routes, UI components, backend operations). |
| **[`v1/prisma/schema.prisma`](./v1/prisma/schema.prisma)** | Source of truth for database schema and PostgreSQL driver configuration. |
| **[`v1/docs/`](./v1/docs)** | Internal engineering documentation (e.g., screenshot redaction workflows). |
| **[`v1/.github/workflows/`](./v1/.github/workflows/)** | Automated CI/CD execution logic. |

---

## 📜 License

This repository and its codebase are strictly **Proprietary**. See the [LICENSE](./LICENSE) file for usage and restriction details.
