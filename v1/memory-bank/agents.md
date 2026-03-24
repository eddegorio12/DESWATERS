# AI Agent Rules & Persona

These rules define how any AI agent should behave when working in the DWDS codebase. The memory-bank is the project source of truth and must stay aligned with the live repository.

## Brand Naming Convention
- **Formal name:** `DEGORIO WATER DISTRIBUTION SERVICES`
- **Short name:** `DWDS`
- Use `DWDS` for product, UI, repo, and internal documentation references.
- Reserve the full formal name for legal, billing statement, auth, metadata, or other explicitly formal contexts.

## 1. Prime Directives
- **Always read** [@architecture.md](C:\Users\eddeg\OneDrive\Documents\GitHub\DESWATERS\v1\memory-bank\@architecture.md) before writing or modifying code.
- **Always read** [@product-requirements-document.md](C:\Users\eddeg\OneDrive\Documents\GitHub\DESWATERS\v1\memory-bank\@product-requirements-document.md) before starting a new feature.
- **Always check** [implementation-plan.md](C:\Users\eddeg\OneDrive\Documents\GitHub\DESWATERS\v1\memory-bank\implementation-plan.md) to confirm whether the work belongs to the completed MVP, an active enhancement phase, or a future backlog item.
- **Mandatory updates:** After any major feature, schema change, workflow change, or roadmap shift, update the relevant memory-bank files in the same task.

## 2. Current Product State
- The MVP is implemented.
- The live admin surface covers authentication, customers, meters, tariffs, readings, billing, payments, printable bills, collections reporting, and the marketing site.
- The current intended database runtime is **PostgreSQL via Prisma v7**.
- EH1 and EH2 are complete. The next planned enhancement phase is EH3 unless product priorities change.

## 3. Enhancement Backlog Handling
- Treat the enhancement roadmap in [implementation-plan.md](C:\Users\eddeg\OneDrive\Documents\GitHub\DESWATERS\v1\memory-bank\implementation-plan.md) as the canonical backlog instead of inventing new unnamed phases.
- When a request maps to an enhancement track, update:
  - [implementation-plan.md](C:\Users\eddeg\OneDrive\Documents\GitHub\DESWATERS\v1\memory-bank\implementation-plan.md) for status and scope
  - [@architecture.md](C:\Users\eddeg\OneDrive\Documents\GitHub\DESWATERS\v1\memory-bank\@architecture.md) for structural or schema changes
  - [progress.md](C:\Users\eddeg\OneDrive\Documents\GitHub\DESWATERS\v1\memory-bank\progress.md) for completed work and constraints
- If new future work is discovered, add it as a clearly named enhancement phase with dependencies and rationale instead of a loose bullet.

## 4. Architectural Coding Standards
- **Modularity over monoliths:** Break features into focused files and domain directories immediately.
- **Domain-driven grouping:** Prefer `src/features/<domain>/...` over dumping logic into generic roots.
- **Lean route files:** Keep route segments compositional. Push business logic into server actions, feature libs, and data-access helpers.
- **Server-first business logic:** Keep client components small. Sensitive logic belongs on the server.
- **Auth and authorization are separate concerns:** Clerk protects identity/session flow, while role-based authorization must be enforced in app logic when that enhancement track is implemented.

## 5. Design & UI/UX Guidelines
- Use the installed `ui-ux-pro-max` skill when the task is design-heavy.
- Preserve the existing DWDS direction: clean enterprise operations UI, light mode, high readability, restrained motion, and clear workflow hierarchy.
- Continue using Tailwind CSS and `shadcn/ui` primitives. Feature-specific UI belongs in feature directories, not in `src/components/ui`.

## 6. Communication Protocol
- Be direct and concise.
- Do not assume the schema, runtime, or backlog state without checking the memory-bank and repo first.
- If requested work conflicts with architecture, product scope, or the enhancement roadmap, call that out explicitly and propose the cleanest path forward.
