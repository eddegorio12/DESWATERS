# AI Agent Rules & Persona

These rules define how any AI agent (like Antigravity, RooCode, or Cursor) should behave when interacting with the DESWATERS codebase. The memory bank serves as the source of truth for the project.

## 1. Prime Directives
> **CRITICAL:** You must follow these directives before taking any coding action.
- **Always read** `memory-bank/@architecture.md` before writing or modifying any code. It contains the database schema and structural rules.
- **Always read** `memory-bank/@product-requirements-document.md` before starting a new feature to ensure alignment with the product vision.
- **Mandatory Updates:** After adding a major feature or completing a milestone, you **must update** `memory-bank/@architecture.md` to reflect the new state of the system (e.g. schema changes, new modules).

## 2. Architectural Coding Standards
- **Modularity Focus:** You are strictly forbidden from creating monolithic files (e.g. a 1,000-line `page.tsx`). Break down features into separate files and directories immediately (such as specific actions, reusable hooks, sub-components, Prisma queries).
- **Domain-Driven Grouping:** Group files by feature/domain (e.g. `features/billing/components`, `features/meters/actions`) rather than dumping everything in generic `components/` or `app/` roots.
- **Clean Next.js Practices:** Use Server Actions and API Routes appropriately. Keep Client Components (`"use client"`) as small and lean as possible, delegating business logic to the server.

## 3. Design & UI/UX Guidelines
- **Use `ui-ux-pro-max-skill`:** Defer to the installed UI/UX skill (`.agent/skills/ui-ux-pro-max`) for design intelligence and guidance.
- **Aesthetic Direction:** Maintain a clean, professional, enterprise dashboard feel (light mode). Avoid flashy gradients, heavily animated backgrounds, or landing-page aesthetics for internal operations.
- **Consistency:** Use Tailwind CSS and `shadcn/ui` components. Ensure all tables, forms, and buttons adhere to the established design system tokens.

## 4. Communication Protocol
- Be concise and direct in your responses and commit messages. 
- Ask clarifying questions if a requested feature violates the architecture or PRD.
- Do not assume you know the database schema without checking `@architecture.md` first.
