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
- The deferred EH9 field-service follow-on has now been tested and validated through complaint-driven field work orders on `/admin/exceptions`.
- EH9 now also persists dedicated leak reports and repair-history records on top of that validated field-work-order flow.
- EH9 now also persists tested and validated first-class meter replacement history from completed meter-linked work orders, with visible replacement review on `/admin/exceptions` and `/admin/meters`.
- EH9 now also persists tested and validated protected field-proof image uploads tied to completed work orders, with proof review on `/admin/exceptions`.
- EH10 is now complete through the printable consumer-notice workflow.
- EH11 is now complete through tariff governance, admin security hardening, and the backup-readiness workspace.
- EH11 now also includes protected recovery-bundle exports from `/admin/system-readiness/export`.
- EH12 is now validated for the implemented route-operations and route-aware billing slice.
- EH12 management analytics on `/admin/routes` have now been user-validated through billed-versus-collected cycle summaries, overdue-aging visibility, and disconnection-versus-reinstatement activity tied to the active route view.
- EH12 now also includes first-class route-linked complaint intake and complaint hotspot visibility on `/admin/routes`.
- EH13 is now fully validated and closed.
- EH14 visual composition refinement is now in progress through the first shell/dashboard/marketing slice, and the latest approved follow-on has now also extended EH12 with complaint-area visibility.
- EH14.3 now implements the website-fundamentals pass through shared metadata, generated share previews, crawler coverage, and the `/contact` rollout path.
- EH14.4 now extends the newer admin composition language to the summary-heavy staff access, system readiness, and tariff registry boards.
- EH14.5 is now validated through skip-link support, focus-visible treatment, active-route semantics, semantic list cleanup, decorative-icon hiding, and reduced-motion-safe marketing reveal behavior.
- Dedicated admin-management audit logging is now implemented through `AuthAdminManagementEvent` and the `/admin/staff-access` audit trail.
- EH16 is now in progress after the validated EH15.5 baseline, with EH16.1 proposal-only follow-up triage and EH16.2 proposal-only exception summarization as the current advisory worker baseline.
- EH17 through EH21 now define the next AI roadmap: validated approval foundation, Telegram-first cashiering, OpenClaw integration, specialized worker lanes, and production hardening.
- EH14.1 is now implemented as the dashboard-only enterprise-console refinement pass. Preserve that current DWDS dashboard concept and shared console primitives when extending adjacent admin surfaces; do not redesign the dashboard from scratch unless the user explicitly changes scope.
- EH14.2 is now validated as the landing-page proof pass. Preserve that sharper homepage narrative when refining adjacent marketing routes: one operational promise, screenshot-led workflow proof, early readiness/trust signals, tighter CTA vocabulary, and explicit staff-facing positioning over broad feature-grid enumeration.
- The next public-site contribution inside EH14 should now be explicit accessibility verification on top of that stronger website baseline, not a repeat metadata/crawler pass.
- The next protected-surface contribution inside EH14 should be any remaining secondary admin boards that still visibly lag behind the newer panel rhythm, not another dashboard redesign.
- The concrete EH13 order is: meters first, then routes, then collections/exceptions, then follow-up, then responsive hardening, then shared status-priority treatment, then the final consistency sweep.

## 3. Enhancement Backlog Handling
- Treat the enhancement roadmap in [implementation-plan.md](C:\Users\eddeg\OneDrive\Documents\GitHub\DESWATERS\v1\memory-bank\implementation-plan.md) as the canonical backlog instead of inventing new unnamed phases.
- When a request maps to an enhancement track, update:
  - [implementation-plan.md](C:\Users\eddeg\OneDrive\Documents\GitHub\DESWATERS\v1\memory-bank\implementation-plan.md) for status and scope
  - [@architecture.md](C:\Users\eddeg\OneDrive\Documents\GitHub\DESWATERS\v1\memory-bank\@architecture.md) for structural or schema changes
  - [progress.md](C:\Users\eddeg\OneDrive\Documents\GitHub\DESWATERS\v1\memory-bank\progress.md) for completed work and constraints
- If new future work is discovered, add it as a clearly named enhancement phase with dependencies and rationale instead of a loose bullet.
- If the request concerns AI workers or automation, map advisory worker work to EH16 and map approved execution, Telegram workflows, OpenClaw integration, or future specialized lanes to EH17 through EH21.

When the requested work is UI/UX-oriented:
- Treat the current priority as workflow usability, not a visual redesign for its own sake.
- Prefer improvements that reduce scan time, simplify decisions, clarify next actions, and strengthen consistency across existing modules.
- Keep UX changes modular and reusable; do not collapse feature boundaries with page-specific one-off patterns unless there is a strong reason.
- Prefer composition refinements that reduce card sprawl, nested panel density, and equal-weight tile grids before proposing new top-level dashboards or workflow domains.
- Reserve cards for actionable or stateful content; lighter-weight groupings should usually be lists, rows, dividers, or section structures instead of more bordered tiles.
- When the work touches the marketing site, also treat metadata, share previews, canonical handling, CTA clarity, and accessibility as required product work rather than optional polish.

- When the requested work is roadmap or planning oriented:
- Recommend the active EH14 composition rollout plus the now-implemented EH12 complaint-area visibility baseline before later deferred EH9/EH11 refinements unless the user explicitly reprioritizes.
- If the user explicitly asks to continue the former deferred-next-step lane, treat EH9 field-work-order validation plus leak/repair persistence, meter-replacement history, field-proof upload, and the now-implemented optional `SUPER_ADMIN` 2FA as complete before proposing later EH11 security refinements.
- Use the recorded EH13 task IDs (`EH13.2a` through `EH13.5`) when breaking down or sequencing the current usability lane.
- For AI planning, treat EH15 as the validated assistant baseline and EH16 as the current advisory worker lane. EH16.1 follow-up triage and EH16.2 exception summarization are now implemented, EH17 approval foundation is now validated on the bounded follow-up slice, EH18 is locally validated, EH19 is now validated as the bounded OpenClaw integration, EH20 is validated as the specialized-lane baseline, and EH21 is now the active hardening lane. None of those lanes are permission for unrestricted autonomous agents, direct database writes, or broad transactional search.
- EH19 is now validated in the repo as a bounded planner integration. Keep OpenClaw behind the gateway client plus adapter boundary, preserve deterministic fallback when the gateway is unavailable, and do not treat a configured OpenClaw gateway as permission to bypass DWDS approval, payment, or follow-up execution rules. Do not start EH20 until the user explicitly authorizes it.

## 7. GitHub and MCP Guidance
- A special skill is not required just to inspect or edit the local repository.
- Use installed skills only when the task itself matches the skill domain, such as `ui-ux-pro-max` for design-heavy review or refinement.
- GitHub MCP/app access is optional but preferred for remote GitHub work such as reviewing issues, pull requests, comments, labels, branches, or repo metadata.
- If MCP is unavailable, continue with local-repo work and document any GitHub-hosted actions that could not be completed from local context alone.

## 4. Architectural Coding Standards
- **Modularity over monoliths:** Break features into focused files and domain directories immediately.
- **Domain-driven grouping:** Prefer `src/features/<domain>/...` over dumping logic into generic roots.
- **Lean route files:** Keep route segments compositional. Push business logic into server actions, feature libs, and data-access helpers.
- **Server-first business logic:** Keep client components small. Sensitive logic belongs on the server.
- **Auth and authorization are separate concerns:** Auth.js protects identity/session flow, while role-based authorization must be enforced in app logic.
- **Automation is not an authorization bypass:** Any worker-generated proposal must still execute through normal DWDS server actions and audit trails.

## 5. Design & UI/UX Guidelines
- Use the installed `ui-ux-pro-max` skill when the task is design-heavy.
- Preserve the existing DWDS direction: clean enterprise operations UI, light mode, high readability, restrained motion, and clear workflow hierarchy.
- Continue using Tailwind CSS and `shadcn/ui` primitives. Feature-specific UI belongs in feature directories, not in `src/components/ui`.
- Favor operational clarity over descriptive density. Shorter labels, clearer hierarchy, stronger status cues, and obvious next actions are preferable to long explanatory copy on primary operator screens.

## 6. Communication Protocol
- Be direct and concise.
- Do not assume the schema, runtime, or backlog state without checking the memory-bank and repo first.
- If requested work conflicts with architecture, product scope, or the enhancement roadmap, call that out explicitly and propose the cleanest path forward.
