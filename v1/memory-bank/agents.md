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
- The live admin surface now also includes receivables follow-up, disconnection tracking, and reinstatement workflow support.
- EH5 follow-up actions now also support provider-backed customer notifications with auditable delivery logging.
- Admin access is now internal-only: SUPER_ADMIN creates accounts, and inactive accounts are blocked at sign-in.
- The Auth.js migration is complete, and the seeded `SUPER_ADMIN` login has been verified locally.
- Internal password management now exists in the live repo through self-service password change and SUPER_ADMIN temporary-password reset.
- Temporary-password accounts must now complete a forced password change before entering the protected DWDS workspace.
- EH6 public-surface expansion is validated and closed.
- EH7 tooling recovery is complete, and the repo now includes a stable launcher for searchable `ui-ux-pro-max` execution.
- The public repository surface is now presentation-ready enough for sharing, with real redacted screenshots and cleaner root-level documentation.
- The current intended database runtime is **PostgreSQL via Prisma v7**.
- EH1 through EH9 are complete.
- EH10 is now complete through the printable consumer-notice workflow.
- EH11 is now complete through tariff governance, admin security hardening, and the backup-readiness workspace.
- EH12 is now validated for the implemented route-operations and route-aware billing slice.
- EH13 is now fully validated and closed.
- EH14 visual composition refinement is now in progress through the first shell/dashboard/marketing slice, and the next contribution after that should remain broader EH12 analytics, then dedicated admin-management audit logging.
- EH14.1 is now implemented as the dashboard-only enterprise-console refinement pass. Preserve that current DWDS dashboard concept and shared console primitives when extending adjacent admin surfaces; do not redesign the dashboard from scratch unless the user explicitly changes scope.
- The concrete EH13 order is: meters first, then routes, then collections/exceptions, then follow-up, then responsive hardening, then shared status-priority treatment, then the final consistency sweep.

## 3. Enhancement Backlog Handling
- Treat the enhancement roadmap in [implementation-plan.md](C:\Users\eddeg\OneDrive\Documents\GitHub\DESWATERS\v1\memory-bank\implementation-plan.md) as the canonical backlog instead of inventing new unnamed phases.
- When a request maps to an enhancement track, update:
  - [implementation-plan.md](C:\Users\eddeg\OneDrive\Documents\GitHub\DESWATERS\v1\memory-bank\implementation-plan.md) for status and scope
  - [@architecture.md](C:\Users\eddeg\OneDrive\Documents\GitHub\DESWATERS\v1\memory-bank\@architecture.md) for structural or schema changes
  - [progress.md](C:\Users\eddeg\OneDrive\Documents\GitHub\DESWATERS\v1\memory-bank\progress.md) for completed work and constraints
- If new future work is discovered, add it as a clearly named enhancement phase with dependencies and rationale instead of a loose bullet.

When the requested work is UI/UX-oriented:
- Treat the current priority as workflow usability, not a visual redesign for its own sake.
- Prefer improvements that reduce scan time, simplify decisions, clarify next actions, and strengthen consistency across existing modules.
- Keep UX changes modular and reusable; do not collapse feature boundaries with page-specific one-off patterns unless there is a strong reason.
- Prefer composition refinements that reduce card sprawl, nested panel density, and equal-weight tile grids before proposing new top-level dashboards or workflow domains.
- Reserve cards for actionable or stateful content; lighter-weight groupings should usually be lists, rows, dividers, or section structures instead of more bordered tiles.

When the requested work is roadmap or planning oriented:
- Recommend EH13 completion before deeper EH12 analytics expansion, dedicated admin audit logging, or later deferred EH9/EH11 refinements unless the user explicitly reprioritizes.
- Use the recorded EH13 task IDs (`EH13.2a` through `EH13.5`) when breaking down or sequencing the current usability lane.

## 4. Architectural Coding Standards
- **Modularity over monoliths:** Break features into focused files and domain directories immediately.
- **Domain-driven grouping:** Prefer `src/features/<domain>/...` over dumping logic into generic roots.
- **Lean route files:** Keep route segments compositional. Push business logic into server actions, feature libs, and data-access helpers.
- **Server-first business logic:** Keep client components small. Sensitive logic belongs on the server.
- **Auth and authorization are separate concerns:** Auth.js protects identity/session flow, while role-based authorization must be enforced in app logic.

## 5. Design & UI/UX Guidelines
- Use the installed `ui-ux-pro-max` skill when the task is design-heavy.
- Preserve the existing DWDS direction: clean enterprise operations UI, light mode, high readability, restrained motion, and clear workflow hierarchy.
- Continue using Tailwind CSS and `shadcn/ui` primitives. Feature-specific UI belongs in feature directories, not in `src/components/ui`.
- Favor operational clarity over descriptive density. Shorter labels, clearer hierarchy, stronger status cues, and obvious next actions are preferable to long explanatory copy on primary operator screens.

## 6. Communication Protocol
- Be direct and concise.
- Do not assume the schema, runtime, or backlog state without checking the memory-bank and repo first.
- If requested work conflicts with architecture, product scope, or the enhancement roadmap, call that out explicitly and propose the cleanest path forward.
