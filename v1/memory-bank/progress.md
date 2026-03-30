# Project Progress

## Summary
- The DWDS MVP is implemented and the memory-bank now treats that MVP as the baseline rather than an active checklist.
- There are **no open MVP blockers** recorded in the memory-bank.
- Future work is now tracked as named enhancement phases `EH1` through `EH12`.
- Clerk has now been removed from the live repo and replaced with internal Auth.js credentials authentication.
- Internal admin password management is now available through a signed-in change-password form and a SUPER_ADMIN set-temporary-password flow.
- Temporary-password accounts are now blocked from `/dashboard` and `/admin/*` until they complete a required password change.
- EH3 and EH4 have now been validated.
- EH5 has now been validated, including the email-first follow-up notification path.
- EH6 has now been validated after public-surface testing.
- EH7 has now restored the searchable local design-tooling workflow.
- The public GitHub repository surface has now been cleaned up with a stronger root README, CI workflow, license, and real redacted product screenshots.
- DWDS now includes a custom PNG logo system with transparent brand asset handling, shared marketing/auth/dashboard lockups, and branded browser/app icons.
- DWDS deployment planning now uses Supabase Postgres as the practical managed database target, with pooled runtime connections and direct migration connections validated from the repo.
- EH8 billing governance has now been tested and validated.
- Monthly billing now uses explicit billing-cycle controls, month-end checklist state, audited regeneration reasons, print-batch tracking, batch print views, and per-bill physical distribution statuses.
- EH9 has now started with a protected operational exceptions workspace for server-side anomaly detection across readings, receivables, payments, and service-status mismatches.
- EH9 has now been tested and validated.
- EH10 has now started with printable customer notice generation tied to billing, follow-up, and service-status records.
- EH10 has now been tested and validated.
- EH11 has now been tested and validated.
- EH11 follow-on recovery exports are now implemented, tested, and validated through a protected CSV/JSON recovery-bundle download path on `/admin/system-readiness/export`.
- EH12 has now been tested and validated for the implemented route-operations and route-aware billing slice.
- Broader EH12 management analytics on `/admin/routes` have now been user-validated, including billed-versus-collected cycle rows, overdue-aging balance mix, and disconnection-versus-reinstatement activity tied to the current route view.
- EH12 now also includes first-class route-linked complaint intake plus complaint hotspot visibility on `/admin/routes`, so high-complaint areas are no longer inferred from loss-risk proxies alone.
- EH13 has now completed the workflow-usability pass across the current admin surface.
- The clearest next contribution path is now a visual-composition pass that reduces card sprawl, then broader EH12 analytics, before later field-service or security refinements are reopened.
- EH13.2a is now validated on the meters module, EH13.2b is now validated on route operations, EH13.2c is now validated on collections plus exceptions, and EH13.2d is now validated on follow-up with an urgency-first queue, escalation filters, and separated service-action panels.
- EH13.3a is now complete as a code-level narrow-screen audit covering the dashboard shell, sidebar navigation, follow-up, routes, and the current table-heavy list surfaces.
- EH13.3b has now been validated.
- EH13.4 is now implemented as the shared visual status-priority pass for pending, overdue, read-only, ready, success, and attention-required states across the active EH13 admin surfaces plus adjacent admin workflow boards.
- EH13.5 is now implemented as the final usability consistency sweep for shared filter language, operator-facing copy cleanup, and stronger next-step empty states across the remaining admin boards.
- EH13 has now been fully validated and closed.
- A new follow-on UI refinement lane is now recommended because the current admin and marketing surfaces still show too many similarly styled cards and nested panels, which makes the product feel more template-driven than intended.
- EH14 has now started with the first visual-composition slice implemented across the protected shell, shared admin page hero, admin dashboard, and top marketing entry surfaces.
- EH14 now also has a dashboard-focused planning slice defined for a FortiGate-inspired enterprise-console refinement pass that preserves the current DWDS structure and identity.
- EH14.1 has now been implemented as a dashboard-console refinement pass with reusable enterprise-style sidebar, metric, panel, section-header, and action-row primitives across the protected shell and admin dashboard.
- EH14.2 has now been validated as a proof-led homepage refinement pass with one sharper operational promise, an early deployment-readiness strip, screenshot-led workflow sections, repeated platform-versus-rollout CTA language, and clearer staff-facing positioning.
- EH14.3 has now been implemented as the website-fundamentals pass with shared canonical and social metadata, generated Open Graph and Twitter previews, `robots` plus `sitemap` coverage, a dedicated public rollout-contact route, and stronger trust-plus-conversion framing on the secondary marketing pages.
- EH14.4 has now extended the newer composition language to the remaining summary-heavy admin boards, specifically staff access, system readiness, and tariff registry surfaces that previously still used the older bordered-card stack.
- EH14.5 has now been validated as the public accessibility verification sweep, covering skip-link access, keyboard-visible focus treatment, navigation `aria-current` state, semantic list cleanup, decorative-icon hiding, and reduced-motion-safe marketing reveal behavior.
- The EH14 protected-surface follow-on now also reaches `/admin/billing` and `/admin/follow-up`, where cycle-governance support panels, unpaid-bill visibility, communication-log review, and service-action strips now use the shared admin-surface framing instead of the older heavy standalone card stack.
- The billing open-bill review and follow-up communication log now also use the shared responsive table treatment with stacked mobile-card fallbacks, and that EH14 follow-on has now been tested and validated.
- The same EH14 protected-surface follow-on now also reaches the dashboard account-security area, where self-service password changes and SUPER_ADMIN two-factor controls now use the shared admin-surface framing instead of older standalone panels.
- The dashboard account-security follow-on has now been tested and validated.
- The final EH14 composition sweep is now implemented across the protected printable bill, notice, and receipt routes through a shared print-surface shell that removes repeated one-off hero and paper framing.
- EH14 has now been fully validated and closed.
- EH15 is now planned as a protected staff AI assistant and knowledge-retrieval lane, centered on documentation-first RAG, role-aware answers, mandatory citations, per-user chat history, and a read-only V1 scope.
- EH15 has now started with a protected `/admin/assistant` workspace, role-aware documentation retrieval over the `memory-bank`, curated module-guidance search, visible citations, and starter prompts for staff workflow questions.
- EH15 now also persists retrieval storage for `memory-bank` and workflow-guide chunks plus first-class ingestion metadata and per-user assistant conversation history inside the PostgreSQL core.
- EH15 now also exposes the assistant as a non-technical shell-level popup chat for signed-in staff, so workflow help no longer depends on opening a separate dedicated page.
- EH15 now also includes OpenRouter-backed answer synthesis on top of retrieved sources, defaulting to `openrouter/free` with configured free-model fallbacks when the API key is available.
- The current EH15 popup-assistant baseline is now tested and validated for the implemented shell-level chat surface, saved-history behavior, multilingual prompt handling, tariff-estimate helper path, and model-backed answer synthesis with fallback behavior.
- The EH15 lane has now reached its documented enterprise-grade baseline through validated retrieval hardening, governance, evaluation, knowledge operations, and narrow live-record explainers.
- The next EH15 roadmap is now explicitly split into retrieval hardening, safety/governance, evaluation-plus-observability, knowledge operations, and only then narrow live-record explanations.
- EH15.1 retrieval hardening is now implemented in the repo through tighter chunking, incremental corpus sync, embedding freshness tracking, hybrid lexical-plus-semantic retrieval, and deterministic source-priority reranking.
- The EH15.1 embedding path now uses JSONB as the guaranteed local baseline and can also populate an optional `embeddingVector` column when the database exposes `pgvector`, so retrieval hardening no longer depends on extension availability in local Postgres.
- EH15.1 local validation has now completed through Prisma generation, targeted assistant-file linting, successful migration deployment, and a successful full production build.
- EH15.1 has now been user-tested and validated.
- EH15.2 trust/safety/governance is now implemented in the repo through server-side request policy decisions, prompt-injection plus secret-exfiltration defenses, governed assistant source states, and citation-backed low-confidence fallback behavior.
- EH15.2 local validation has now completed through Prisma generation, targeted assistant-file linting, successful migration deployment, and a successful full production build.
- EH15.2 has now been user-tested and validated.
- EH15.3 evaluation and observability is now implemented in the repo through assistant response telemetry, fixed regression cases, persisted evaluation runs/results, and an admin-visible quality panel on `/admin/assistant`.
- EH15.3 local validation has now completed through targeted assistant linting and a successful full `tsc --noEmit` pass.
- EH15.3 has now been tested and validated.
- EH15.4 knowledge operations are now implemented in the repo through admin-facing source review and sync controls, source-level pin or disable actions, revision-backed rollback, and richer curated workflow-guide coverage on `/admin/assistant`.
- EH15.4 local validation has now completed through Prisma client generation, targeted assistant linting, and a successful full `tsc --noEmit` pass.
- EH15.4 has now been tested and validated.
- EH15.5 narrow live-record explainers are now implemented for specific bill IDs, receipt numbers, route codes, and targeted exception or follow-up records, with server-side role checks, minimal live-data citations, and broad record-discovery requests still blocked.
- EH15.5 local validation has now completed through targeted assistant linting and a successful full `tsc --noEmit` pass.
- EH15.5 has now been tested and validated.
- EH15 should now be treated as complete at the parent-lane level because its documented maturity slices through EH15.5 are implemented and validated.
- EH16 has now started as the next AI lane: supervised staff automation built on the validated EH15 baseline, with follow-up triage implemented as the first worker, proposal-only review, and no direct action execution.
- `/admin/routes` now also includes a clearly labeled loss-risk watchlist that ranks routes by recent billed-versus-collected gap plus current overdue exposure, plus a route-linked complaint hotspot view based on first-class complaint records.
- Dedicated admin-management audit logging is now implemented, tested, and validated through a first-class Prisma event table plus a visible audit trail on `/admin/staff-access` for account creation, role changes, activation changes, lockout clearing, temporary-password resets, and self-service password changes.
- The deferred EH9 field-service expansion has now been implemented, tested, and validated with complaint-driven field work orders on `/admin/exceptions`, including technician assignment, dispatch notes, scheduled visits, in-progress tracking, completion logging, and complaint auto-resolution on completed work.
- EH9 now also includes tested and validated first-class leak-report records plus durable repair-history logging tied to complaint intake and completed field work on `/admin/exceptions`.
- EH9 now also includes tested and validated first-class meter replacement history tied to completed field work, including replaced-to-installed meter linkage, final-reading capture, and registry visibility on `/admin/exceptions` and `/admin/meters`.
- EH9 now also includes tested and validated protected field-proof image uploads for completed work orders, with first-class proof metadata, protected file serving, and proof review from active work orders plus completed repair history on `/admin/exceptions`.

## Implemented Milestones

### Foundation & Auth
- Next.js App Router, TypeScript, Tailwind CSS, and `shadcn/ui` were initialized successfully.
- Prisma was integrated and the current repo runtime was unblocked through a local SQLite setup.
- Internal Auth.js credentials authentication now protects `/dashboard` and `/admin/*`.
- Admin accounts now authenticate directly against the Prisma `User` table with bcrypt password hashes.
- SUPER_ADMIN now manages admin access internally instead of relying on external identity provisioning.
- A local seeded `SUPER_ADMIN` account has now been verified to sign in successfully after the migration.
- Signed-in admins can now change their own password from the dashboard.
- SUPER_ADMIN can now set a replacement temporary password for any admin account from the admin-management page.
- Newly created admins and password-reset admins are now forced through `/change-password` before they can access protected modules.

### Core Records
- Customer creation and listing were implemented.
- Meter registration and assignment were implemented.
- Meter holder replacement with transfer history, effective date, and turnover reading capture was implemented.
- Tariff configuration with active-tier validation was implemented.

### Operations
- Meter reading intake and pending-review workflow were implemented.
- Reading approval, bill generation, and manual payment recording were implemented.
- Printable consumer bill output with issue date, due date, grace period, and disconnection notice was implemented.

### Reporting & Product Surface
- Daily collections reporting was implemented for completed payments in the Manila operating day.
- The marketing site and production-facing admin UI copy were implemented.
- The admin dashboard was redesigned into a stronger operations hub.
- The public marketing site now includes reusable DWDS brand assets, screenshot-style product previews, and clearer deployment-ready rollout messaging.
- The marketing header and footer plus auth and dashboard entry surfaces now use the shared DWDS logo lockup with refined size handling for each placement.
- The repository root now presents the product more clearly for public review, including real redacted screenshots of the dashboard, billing, and follow-up surfaces.
- A dedicated printable notice route now exists for standardized customer communications linked to live billing and follow-up records.
- A dedicated system-readiness route now exists for backup snapshot logging, restore guidance, environment-readiness checks, and recent sign-in security visibility.
- A dedicated route-operations route now exists for service-zone setup, service-route setup, meter coverage mapping, route-owner assignment, and route-level overdue plus collection-efficiency visibility.
- A memory-bank-backed usability assessment now identifies dashboard density, table-heavy list screens, and weak next-step guidance as the main current UX friction points.
- A reusable record-list interaction pattern now exists for search, filtering, empty states, and next-step guidance, and its active rollout now covers customers, pending readings, billing queue, payment history, and meters.
- The dashboard and sidebar wording have now been tightened to reduce scan time on the core daily-use workspace.
- The shared list/filter pattern now reaches route operations, collections, exceptions, and follow-up.
- The audited EH13 list surfaces now also expose a shared narrow-screen fallback that swaps dense desktop tables for stacked summary cards below the chosen breakpoint.
- A dedicated EH13.3a audit note now records the main narrow-screen pressure points: sidebar-first mobile stacking, horizontal-scroll-only table handling, tall hero shells before task controls, wrapped follow-up action rows, and route-scoreboard density.
- The final EH13 consistency sweep now standardizes list-control wording around explicit filter actions, removes roadmap-step labels from live operator copy, and upgrades older empty states with clearer next-step guidance.
- EH14 now adds lighter-weight shared composition primitives plus an editorial row/split-layout treatment on the dashboard and key marketing entry pages so summary and navigation content no longer default to equal-weight cards.
- EH14.1 now refines the admin dashboard console through stronger sidebar item hierarchy, denser KPI-counter treatment, clearer section framing, and reusable action rows without changing the overall dashboard concept.
- EH14.2 now also stands validated as a homepage refinement around a single operational promise, earlier readiness proof, and larger workflow screenshots so the page reads more like a deployment-ready utility product than a feature catalog.
- EH14.3 now adds canonical and social metadata coverage, generated share previews, crawler-facing `robots` and `sitemap` routes, a dedicated `/contact` rollout path, and repeated trust/conversion panels across the public marketing routes.
- EH14.4 now also brings the newer divider-led panel rhythm and denser summary treatment onto staff access, system readiness, and tariff registry so those protected admin entry surfaces no longer lag behind the dashboard-console pass.
- EH14.5 now also adds the first public accessibility hardening slice through skip-link support, shared keyboard-focus visibility, improved navigation semantics, semantic list cleanup, decorative-icon hiding, and reduced-motion-safe hero/section reveal behavior.
- The next planned EH14 implementation target is now review of any remaining secondary admin surfaces that still use older equal-weight panel treatment.
- That follow-on protected-surface review has now started with `/admin/collections` and `/admin/exceptions`, where the summary-card stacks have been reduced in favor of shared admin-surface panels and denser divider-led composition.
- The same follow-on review now also reaches `/admin/readings` and `/admin/payments`, where entry and history support panels have been moved onto the shared EH14 protected-surface language without changing the underlying workflow rules.
- The same protected-surface review now also reaches `/admin/customers`, `/admin/meters`, and `/admin/routes`, where creation, assignment, transfer, and route-side support panels now use the shared EH14 admin-surface framing instead of the older heavy equal-weight card stack.
- The same protected-surface review now also reaches `/admin/billing` and `/admin/follow-up`, where billing-governance support sections, open-bill review, communication logging, and service-action summaries now follow the same lighter-weight EH14 panel rhythm while preserving the existing server-authoritative workflow logic.
- The same protected-surface review now also reaches the dashboard account-security area, where self-service password management and SUPER_ADMIN two-factor setup now follow the same lighter-weight EH14 panel rhythm while preserving the existing auth workflows.
- The dashboard account-security follow-on is now validated on top of that broader EH14 protected-surface review.

## Important Historical Constraints

### Data Platform Constraint
- The repo has now been switched back to a **PostgreSQL-first Prisma runtime**.
- Prisma v7 configuration remains centralized in `prisma.config.ts`.
- A baseline PostgreSQL migration and repeatable environment setup guidance now exist in the repo.
- MVP workflow validation against a live PostgreSQL environment has been completed, so EH1 is now closed.
- Supabase pooler-based `DATABASE_URL` testing plus separate direct-connection validation now reaches the managed Postgres target from the repo, and Prisma can enumerate the committed migrations against that environment.

### Authorization Constraint
- Role-based authorization is now enforced in protected admin routes and server actions.
- Staff access now follows an implemented route and mutation matrix for super admin, admin, technician, meter reader, billing, cashier, and viewer roles.
- There is no public registration path for DWDS admin access. Admin accounts are created internally by SUPER_ADMIN users.
- The `/admin/staff-access` surface is now the internal admin-management page for account creation, role updates, and activation state changes.
- EH11 now also adds failed-login lockout tracking, login-attempt history with IP/device capture, SUPER_ADMIN lockout clearing, and a shorter Auth.js admin session lifetime.
- Admin-management mutations now also write to a dedicated `AuthAdminManagementEvent` audit trail, and the staff-access workspace surfaces the latest account-management events alongside recent sign-in activity.

### Tariff Governance Constraint
- Tariffs are now versioned, effectivity-dated records instead of a purely mutable active-rule toggle.
- New bills now store the tariff version used during generation through `Bill.tariffId`.
- Older bills created before EH11 may not have a linked tariff version and should be treated as legacy billing records until explicitly backfilled.

### Backup Recovery Constraint
- Backup visibility now starts from an app-native manual log under `/admin/system-readiness`.
- Managed PostgreSQL backups remain the primary recovery layer; DWDS now records monthly snapshot references and restore-test notes rather than running its own backup engine.
- Restore procedure guidance is now visible in-app, and `/admin/system-readiness/export` now provides protected CSV/JSON recovery-bundle downloads for the current snapshot log, recent login outcomes, environment readiness, and restore checklist.

### Meter Account Transfer Constraint
- Meter ownership changes are now modeled as account-holder transfers, not meter replacement.
- The active holder still lives on `Meter.customerId` for compatibility with existing reading and billing flows.
- Transfer events are now recorded in `MeterHolderTransfer` with previous holder, new holder, effective date, optional turnover reading, and optional reason.
- Historical reading pages still resolve holder display from the meter's current `customerId`, so holder-as-of-reading-date display remains a future refinement.

### Reporting Constraint
- Reporting now includes **historical collections filters plus receivables visibility** in the admin reporting workspace.
- Overdue and follow-up reporting is now visible, but automated enforcement workflows are still not implemented.
- EH3 has been user-validated and is now closed.

### Route Operations Constraint
- EH12 now introduces first-class `ServiceZone`, `ServiceRoute`, and `StaffRouteAssignment` records instead of relying on free-text route grouping alone.
- Meter routing is currently assigned through `/admin/routes`, and existing billing print-batch grouping can now persist linked route or zone IDs when the selected bills belong to a single mapped route or zone.
- Meter-reader route ownership now narrows the live reading-entry meter list for `METER_READER` accounts to their assigned routes only.
- Billing print and distribution tracking now auto-scopes bill selection by grouping, defaults batch labels from the active route or zone scope, and can auto-fill the assigned distributor from route ownership.
- Broader EH12 management analytics have now been user-validated through route-view billed-versus-collected trends, overdue aging, service-action activity, a loss-risk watchlist based on recent collection gaps plus overdue exposure, and route-linked complaint hotspot visibility.

### Usability Constraint
- The current DWDS product is structurally coherent but still dense on several day-to-day operator screens.
- Dashboard, list, and queue surfaces should now be optimized for scan speed, prioritization, and next-step clarity before broader new-domain expansion.
- Future UX work should stay inside the current modular feature structure and should prefer shared patterns over one-off page rewrites.
- EH13.5 now implements the final consistency cleanup, and the full EH13 usability lane is now validated and closed.

### Visual Composition Constraint
- The current UI still overuses similarly styled rounded panels on dashboard, page-shell, and marketing summary surfaces.
- Too many equal-weight cards flatten hierarchy and create a generic "vibecoded" feel even when the underlying workflow design is solid.
- The next UI pass should reserve cards for actionable or stateful content and use lighter-weight composition for navigation, summaries, and supporting information.
- EH14.1 now also establishes reusable dashboard-console primitives so future admin summary surfaces can inherit the same denser enterprise hierarchy instead of adding more one-off card layouts.
- EH14.2 now gives the homepage a stronger proof-led structure, and EH14.3 now extends that website baseline through metadata completeness, share-ready previews, one public rollout-contact path, and trust/conversion follow-through on the remaining marketing routes.
- EH14.4 now extends that same anti-card-sprawl direction into the remaining summary-heavy protected admin boards through shared admin-surface panel primitives and divider-led list composition.
- EH14.5 now adds a validated accessibility hardening layer on top of the public-site baseline so keyboard navigation, semantic list structure, decorative-icon handling, and reduced-motion behavior no longer depend on browser-default behavior alone.

### Staff AI Assistant Constraint
- The planned staff assistant should launch as a protected internal tool, not a public chatbot.
- The initial implementation should remain read-only and should not trigger operational mutations.
- Documentation-first RAG is the recommended first slice; broad open-ended querying across transactional data should remain deferred.
- Enterprise-grade maturity now specifically requires stronger retrieval ranking, measurable evaluation, server-enforced safety behavior, and governed knowledge-source quality before broader live-data scope is approved.
- Any live-record explanation path must stay inside the signed-in user’s current role scope and should only answer narrowly scoped record questions.
- Answers should cite their sources and explicitly acknowledge uncertainty when retrieval is incomplete.

### Cashiering Constraint
- Cashier posting now supports auditable partial settlements plus printable official receipts.
- Customer credit and overpayment handling are still not implemented.
- EH4 has been user-validated and is now closed.

### Overdue Workflow Constraint
- Receivables now include an explicit overdue follow-up workspace with reminder, final-notice, disconnection-review, disconnection, and reinstatement workflow states.
- Bill overdue status is now evaluated operationally on the server instead of remaining display-only language on printed statements.
- EH5 now includes a low-cost notification foundation: customer email capture, notification logging, Resend-ready email delivery, and Semaphore-ready SMS delivery.
- By default, email is attempted for all EH5 customer notices, while SMS is limited to higher-priority templates unless `DWDS_NOTIFICATION_SMS_TEMPLATES` is expanded.
- EH5 has been user-validated and is now closed.

### Tooling Constraint
- The installed `ui-ux-pro-max` skill had to run in written-rule fallback mode because the local Python path could not execute the searchable script workflow.
- The Windows Store `python.exe` alias remains broken on this machine, but DWDS now bypasses it through a repo-local launcher that resolves a usable interpreter and restores searchable skill execution.

### Deployment Readiness Constraint
- The current product is ready to be positioned as a staff/admin utility operations system plus public marketing site.
- The consumer portal remains deferred and should not be implied in deployment or repo copy.
- The next operational step is production deployment setup, with Vercel currently treated as the preferred hosting target.
- Production readiness still depends on real PostgreSQL, secure Auth.js environment configuration, and first-admin bootstrap in the target environment.
- Until production auth variables and the first seeded admin are in place, the Vercel deployment should be treated as a staging surface rather than the final public production release.
- Supabase is now the practical managed Postgres target for the next deployment pass, but the database password should be rotated because it was exposed during connection troubleshooting.
- Website readiness also still depends on canonical/social metadata, crawler-facing route basics, and a clearer public conversion flow before the marketing surface should be treated as finished.

## Enhancement Phase Status

### EH1: Data Platform Hardening
- Status: `complete`
- Notes: PostgreSQL-first runtime, migration baseline, setup guidance, live-environment validation, and Supabase pooled/direct connection validation are complete.

### EH2: Authorization & Staff Controls
- Status: `complete`
- Notes: Protected route access, mutation enforcement, and role-specific read-only fallbacks are now in place.

### EH3: Reporting & Receivables Intelligence
- Status: `complete`
- Notes: Historical collections filtering, unpaid and partially paid receivables analytics, and overdue visibility are implemented and validated.

### EH4: Cashiering & Settlement Expansion
- Status: `complete`
- Notes: Official receipt generation and explicit partial-settlement cashiering are implemented and validated. Customer credit handling remains deferred.

### EH5: Overdue & Disconnection Workflow
- Status: `complete`
- Notes: Dedicated receivables follow-up workflow, server-side overdue status syncing, disconnection tracking, reinstatement guardrails, and low-cost SMS/email notification plumbing are implemented and validated.

### EH6: Product Surface Expansion
- Status: `complete`
- Notes: Marketing expansion is implemented and user-validated through brand assets, product previews, stronger deployment-ready copy, shared DWDS logo integration, and branded app icons. Consumer portal routes remain unstarted.

### EH7: Tooling & Design Workflow Recovery
- Status: `complete`
- Notes: Search-assisted `ui-ux-pro-max` execution now works through `scripts/run-ui-ux-pro-max.ps1` and `npm run design:search -- ...`, with sibling Python imports hardened inside the skill entrypoints.

### EH8: Billing Governance & Distribution Controls
- Status: `complete`
- Notes: Billing cycles, bill finalization locks, SUPER_ADMIN-only reopen control, audited batch regeneration, print-batch workflow tracking, batch print rendering, physical distribution states, and single-bill reprint logging are implemented and validated.

### EH9: Operational Exceptions & Field Service Workflow
- Status: `complete`
- Notes: `/admin/exceptions` is now implemented and user-validated for the initial EH9 slice, with server-side severity modeling for missing readings, abnormal consumption, possible leaks, duplicate-payment patterns, disconnection-risk accounts, and service-status mismatches. A later EH9 follow-on is now also implemented, tested, and validated through complaint-driven field work orders on `/admin/exceptions`, including technician assignment, dispatch notes, scheduled visits, progress updates, completion logging, and complaint auto-resolution. That EH9 follow-on now also includes user-validated dedicated leak-report records from route complaint intake plus durable repair-history records from completed field work. The next EH9 follow-on now also adds tested and validated first-class meter replacement history from completed meter-linked work orders, including replaced-to-installed meter linkage, optional final-reading capture, automatic old-meter `REPLACED` state handling, and visible replacement review on both `/admin/exceptions` and `/admin/meters`. The deferred field-proof upload path is now tested and validated through protected image uploads tied to completed work orders, first-class proof metadata, and protected proof review on the exceptions workspace.

### EH10: Consumer Communication & Notice Management
- Status: `complete`
- Notes: Printable billing reminders, overdue/final/disconnection notices, and reinstatement confirmations now log as first-class `PRINT` communication records and render through `/admin/notices/[notificationId]`. EH10 has now been user-validated and closed.

### EH11: Tariff Governance, Backup Recovery, and Admin Security
- Status: `complete`
- Notes: Tariff versioning, effectivity dates, fee-change audit notes, bill-to-tariff traceability, login-attempt history, failed-login lockout, shorter admin sessions, and the backup-readiness workspace are implemented and user-validated. The deferred export/download refinement is now also implemented, tested, and validated through protected `/admin/system-readiness/export` CSV/JSON recovery exports. Optional `SUPER_ADMIN` 2FA is now implemented and validated through TOTP authenticator setup, encrypted secret storage, one-time recovery codes, sign-in enforcement, and visible 2FA state on the dashboard plus staff-access audit trail.

### EH12: Route Operations & Management Analytics
- Status: `complete`
- Notes: The first EH12 slice now adds `ServiceZone`, `ServiceRoute`, and `StaffRouteAssignment` data structures, a protected `/admin/routes` workspace, meter-route mapping, meter-reader and bill-distribution ownership assignment, route-aware reading entry, route-aware print-batch metadata, grouping-driven print/distribution bill selection, smart batch labeling, and initial route/zone overdue plus collection-efficiency visibility. This implemented slice has now been tested and validated. The follow-on analytics slice on `/admin/routes` is now also user-validated for billed-versus-collected cycle rows, overdue-aging balance buckets, disconnection-versus-reinstatement activity pulled from billing and printed-notice records, a clearly labeled loss-risk watchlist derived from recent collection gaps plus current overdue exposure, and route-linked complaint hotspot visibility backed by a first-class complaint data model.

### EH13: Workflow Usability & Operator Efficiency
- Status: `complete`
- Notes: The first EH13 slice is now implemented for dashboard wording simplification, reusable searchable/filterable list surfaces, clearer empty states, shared status-pill treatment on the new list pattern, and stronger next-step guidance on customer, reading, and payment workflows. EH13.2a now extends that shared pattern to `/admin/meters` with server-side search and registry filters for active, unassigned, unrouted, defective, and replaced units plus stronger holder-history scanability. EH13.2b now extends the same usability pass to `/admin/routes` with server-side search, route-focus filters for ownership and coverage gaps, clearer route attention pills, and filtered zone plus overdue side panels, and that route pass has now been user-validated. EH13.2c now extends the shared interaction model to `/admin/collections` and `/admin/exceptions` with server-side search/filter handling, result counts, reset actions, and stronger urgency-first list treatment while preserving the existing reporting and anomaly logic, and that pass has now been user-validated. EH13.2d now applies the same EH13 baseline to `/admin/follow-up` with server-side search and escalation-focus filters, bill-level urgency ordering, and dedicated disconnection or reinstatement action panels while preserving the existing EH5 workflow rules, and that follow-up pass is now validated. EH13.3a now records the narrow-screen audit baseline in `memory-bank/eh13.3a-narrow-screen-audit.md`, including the current shell, hero, table, queue-action, and route-density findings that drive EH13.3b. EH13.3b has now been user-validated across the protected shell, dashboard/page-shell hero density, follow-up action groups, and the audited dense-table surfaces through shared stacked-card fallbacks. EH13.4 is now validated across the active admin workflow surfaces, and EH13.5 completes the final consistency sweep through explicit filter-action wording, roadmap-copy cleanup on live admin pages, and stronger next-step empty states on the remaining secondary boards. The full EH13 usability lane is now validated and closed.
- Planned task order: `EH13.2a` meters, `EH13.2b` routes, `EH13.2c` collections and exceptions, `EH13.2d` follow-up, `EH13.3a` narrow-screen audit, `EH13.3b` responsive fallbacks, `EH13.4` shared status-priority system, and `EH13.5` final consistency sweep. All planned EH13 implementation slices are now in the repo.

### EH14: Visual Composition & Anti-Template Refinement
- Status: `complete`
- Notes: The first implemented EH14 slice now introduces lighter-weight shared composition primitives, reduces nested panel density in the protected shell and shared admin page hero, refactors the admin dashboard into a stronger workflow-plus-directory split, and replaces the top marketing home/platform tile grids with denser editorial rows and split layouts. EH14.1 is now implemented as the dashboard-only refinement pass focused on typography, sidebar clarity, KPI consistency, action-row usability, and shared enterprise-console dashboard primitives. EH14.2 is now validated on the homepage through a sharper single operational promise, an early deployment-readiness trust strip, screenshot-led workflow proof for meter-to-bill, daily control, and overdue operations, tighter repeated CTA vocabulary, and explicit staff-facing positioning. EH14.3 is now implemented as the website-fundamentals pass covering metadata, crawler readiness, share previews, clearer CTA conversion, and stronger trust framing on the remaining marketing pages. EH14.4 now extends the newer composition language to the remaining summary-heavy admin boards for staff access, system readiness, and tariff registry. EH14.5 is now validated as the public accessibility verification sweep with skip-link support, shared keyboard-focus visibility, stronger navigation semantics, semantic list cleanup, decorative-icon hiding, and reduced-motion-safe marketing reveal behavior. The follow-on protected-surface review now reaches `/admin/collections`, `/admin/exceptions`, `/admin/readings`, `/admin/payments`, `/admin/customers`, `/admin/meters`, `/admin/routes`, `/admin/billing`, and `/admin/follow-up`, and the dashboard account-security area, bringing their summary and support panels onto the same lighter-weight admin-surface composition language. That dashboard account-security slice is now also validated. The same EH14 pass now also moves the billing open-bill review and follow-up communication log onto the shared responsive table treatment for better narrow-screen scanability inside those refined panels. A final shared print-surface shell is now also implemented across the protected printable bill, notice, and receipt routes so those document-facing pages no longer duplicate their own top-level hero and paper framing. EH14 has now been fully validated and closed.

### EH15: Staff AI Assistant & Knowledge Retrieval
- Status: `complete`
- Notes: EH15 is now complete as a protected internal DWDS assistant on `/admin/assistant`, using documentation-first RAG, role-aware read-only answers, mandatory citations, per-user chat history, and OpenRouter-backed model access. The implemented lane now includes persisted assistant knowledge storage, user-scoped conversation history, popup assistant access, retrieval hardening, trust and safety governance, evaluation plus observability, admin-facing knowledge operations, and narrow live-record explainers for specific bill, payment, route, follow-up, and exception questions. Broad open-ended transactional-data querying remains intentionally deferred, and the completed EH15 baseline should continue to be treated as read-only and governance-first.
- EH15.1 status: `validated`
- EH15.1 notes: the repo now includes section-aware chunking, hybrid retrieval, deterministic source-priority reranking, incremental sync, and embedding storage that works on local Postgres without requiring `pgvector`.

### EH16: Staff Automation & AI Workers
- Status: `in progress`
- Notes: EH16 is now in progress as the follow-on AI lane after the validated EH15.5 baseline. The first implemented slice is EH16.1: a proposal-only follow-up triage worker inside `/admin/follow-up`, with persisted automation runs, ranked proposals, dismissal support, and no direct action execution. Worker output remains advisory, and the current OpenClaw adapter stays behind a protected server-side boundary while deterministic local triage logic drives the active baseline. The concrete implementation design lives in `memory-bank/eh16.1-follow-up-triage-design.md`. Broader worker types, approved action paths, queue infrastructure, and direct database-write autonomy remain deferred.
- EH16.1 implementation notes for future developers:
  1. Prisma schema now includes `AutomationRun`, `AutomationProposal`, and `AutomationReview` so proposal-only worker state is persisted in the core PostgreSQL database instead of held in memory.
  2. `src/features/automation/lib/automation-store.ts` owns worker-run persistence primitives only: create pending run, complete a run with proposals, and mark a run failed.
  3. `src/features/automation/lib/openclaw-adapter.ts` is intentionally a protected stub boundary. It currently returns `null` so the app uses deterministic local triage until a real OpenClaw integration is explicitly approved.
  4. `src/features/follow-up/lib/follow-up-triage.ts` contains the active ranking fallback. It sorts bounded candidates by queue focus, days past due, and outstanding balance, then generates ranked proposal summaries, rationale text, confidence labels, and source metadata.
  5. `src/features/follow-up/actions.ts` owns the server-side EH16.1 workflow: authorize the user, sync receivable state, gather visible follow-up candidates, create the automation run, persist proposals, record dismissals as `AutomationReview`, and revalidate affected admin routes.
  6. `src/app/(dashboard)/admin/follow-up/page.tsx` remains the composition point. It loads the latest triage run and proposal history alongside the existing follow-up data so the worker stays embedded inside the protected module instead of becoming a separate control plane.
  7. `src/features/follow-up/components/follow-up-triage-panel.tsx` is the advisory UI surface. It can run the worker and dismiss proposals, but it exposes no path to mutate bill stage, notices, or service state.
- EH16.1 validation notes:
  1. Local testing required a realistic sample-data seed because an empty or freshly reset billing database correctly produces `0 proposals recorded`.
  2. Sample operational data and staff accounts are now available through `prisma/seed.mjs` when `SEED_SAMPLE_DATA=true`, including `billing.lead@dwds.local` and other role-scoped users.
  3. Local validation has now covered Prisma client regeneration, successful migration replay on a reset local database, sign-in using seeded admin and billing accounts, in-app triage runs on `/admin/follow-up`, persisted proposal output, and persisted dismissal behavior after refresh.
  4. Manual validation confirmed the intended safety boundary: EH16.1 does not change receivable follow-up stage, generate notices, or trigger service actions from the AI triage panel.
  5. The heuristic was then refined during validation so ranking now favors pre-disconnection readiness first, disconnected-hold review second, final-notice candidates third, reminder candidates fourth, and monitoring cases last.
  6. Proposal summaries and rationale text were tightened to read as operator review notes, with billing period, account number, follow-up stage, customer disconnect state, and queue focus made more explicit in the visible explanation or stored source metadata.
  7. Initial operator feedback on the refined seeded local cases is now positive: the current ordering and wording feel right enough to keep EH16.1 in active validation without reopening its scope.

## Current Next-Step Recommendation
The current AI and automation baseline is EH16.1 follow-up triage. The next future worker slice is EH16.2 exception summarization.

The next step is now:
1. keep EH16.1 as the current realistic follow-up-triage baseline
2. treat EH16.2 exception summarization as the next worker slice when AI automation work resumes

Standing guardrails:
1. keep EH15 closed as the stable assistant baseline unless there is a regression or an explicitly approved scope change
2. preserve the narrow live-record boundary so the assistant explains one visible record at a time instead of expanding into broad transactional search
