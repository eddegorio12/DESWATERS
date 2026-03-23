# Product Requirements Document

## Product Name
**DESWATERS Water Utility Management System**

## Goal
To build a modular, robust, and clean web-based water utility management system starting with an **Admin Web App** targeting billing accuracy, operations management, and payment tracking. 

## Architectural & Structural Philosophy
- **Modularity is King:** The codebase must be highly modular. Break out logic into manageable, single-purpose files.
- **No Monoliths:** Do not bunch unrelated concerns into giant files. Separate routing, UI components, data access (Prisma), actions (Server Actions), and utils.
- **Role-Based Isolation:** Logic for different user roles (Admin, Billing Staff, Cashier, Meter Reader) should be separated cleanly to prevent data leakage and keep UI components focused.

## Scope & MVP (Version 1)
- **Primary Interface:** Admin web application for staff (No consumer portal in V1).
- **Core Modules:**
  1. **Authentication & Roles:** Secure login with Clerk, role-based access.
  2. **Customer Management:** Maintain records (address, status, contact).
  3. **Meter Management:** Tracking meters, assignment, and status.
  4. **Meter Reading Workflow:** Encoding readings, validating data, auto-calculating consumption.
  5. **Billing Engine:** Generating bills based on configurable **progressive tiered tariffs**. Enforces a minimum charge (e.g., 25 for 0-1 cu.m), and calculates incremental usage conditionally by tier.
  6. **Payments Module:** Recording manual cash payments (No Xendit for V1). Enforcing installation fee records (e.g., 3,000 one-time fee).
  7. **Reports:** Dashboards for daily collections, unpaid accounts, and operational summaries.

## Design System & UI/UX
- **Guidance:** Leverages `ui-ux-pro-max-skill`.
- **Theme:** Clean enterprise dashboard, light mode, highly readable.
- **Focus:** Optimized for utility business operations (tables, forms, reports, data validation) rather than flashy marketing aesthetics.

## Future Phases (Planned Modularity)
Because we enforce a modular architecture, the system is designed to seamlessly integrate:
- A mobile-friendly consumer portal (view bills, payment history).
- AI Chatbot for customer inquiries.
- SMS/Email notifications (via Resend/Twilio).
- Automated disconnection tracking workflow.

## Rule of Thumb for Developers
> **IMPORTANT:** Always read `memory-bank/@architecture.md` before making database schema changes or architecture decisions. Every new feature must be scoped into its own module directory rather than expanding existing monolith files.
