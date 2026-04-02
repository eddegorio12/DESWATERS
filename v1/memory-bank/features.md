# Feature Specs

## EH15: Staff AI Assistant & Knowledge Retrieval

### Goal
Add a protected, staff-facing AI assistant that helps DWDS operators understand workflows, locate the correct module, clarify policy, and answer role-appropriate operational questions without taking actions on their behalf.

### Product Position
- This is an internal staff assistant, not a public chatbot.
- The assistant should reduce operator confusion, shorten onboarding time, and improve consistency of workflow decisions.
- The assistant should behave as a read-only guide in its first production slice.

### Recommended V1 Scope
- Dedicated protected route: `/admin/assistant`
- Available to all signed-in staff accounts
- Role-aware answers only
- Documentation-first RAG
- Narrow live-record lookup only when the user explicitly asks about a specific record and their role already permits access
- Mandatory answer citations
- Per-user saved chat history
- No mutations, approvals, posting, or workflow transitions

### Current Implemented Baseline
- `/admin/assistant` is live as a protected internal workspace.
- Retrieval now persists `memory-bank` and workflow-guide content into assistant knowledge-document and chunk tables with source metadata, role scope, hashes, and ingestion-run tracking.
- Assistant searches now run against that stored corpus rather than rebuilding the retrieval set only in memory for each request.
- Each submitted assistant question now creates or extends a user-owned conversation thread with saved user and assistant messages plus citation metadata.
- The UI now exposes recent saved threads and stored-corpus sync state in the protected assistant workspace.
- The assistant can now also explain one visible live record at a time for supported domains such as bill status, receipt settlement state, receivables follow-up stage, route pressure, and targeted exception severity.

### Supported Question Types
- “How do I do this in DWDS?”
- “Which module should I use for this task?”
- “Why is this record showing this status?”
- “What does this follow-up state mean?”
- “What is the policy for this billing, route, or field workflow?”
- “What should I check next?”

### Disallowed V1 Behavior
- No silent actions
- No server mutations
- No bill generation, payment posting, follow-up updates, or admin-account changes through chat
- No disclosure of secrets, passwords, recovery codes, `.env` values, or hidden security internals
- No answers outside the signed-in user’s role scope
- No pretending to know when retrieval is weak or ambiguous

### Answer Contract
Each answer should:
1. answer the question directly
2. explain the basis briefly
3. cite the supporting sources used
4. acknowledge uncertainty when sources are incomplete or conflicting
5. point the user to the correct DWDS module or next step when appropriate

### Recommended RAG Sources For V1
- `memory-bank/` planning and workflow documents
- in-app workflow and policy copy from feature modules
- curated server-authoritative workflow summaries added in-app where needed

### Deferred Sources
- Broad open-ended querying across all transactional records
- Unbounded access to customer, billing, payment, route, complaint, and security datasets
- Uploaded manual files outside the repository

### Narrow Live-Data Policy For V1
Live-data lookup is allowed only when all of the following are true:
- the user asks about a specific record or clearly scoped operational context
- the record belongs to a module the user may already access
- the answer stays explanatory and read-only
- the returned context is minimized to what is needed for the explanation

### Retrieval Architecture Recommendation
- Hybrid retrieval
- PostgreSQL + `pgvector`
- Section-aware chunking with metadata
- Retrieval filtering by role, domain, route/module, and source type
- Reranking before final prompt assembly

### Suggested Chunk Metadata
- `source_path`
- `source_type`
- `section_title`
- `feature_domain`
- `route_scope`
- `role_scope`
- `updated_at`

### Model Recommendation
- Default primary model: `openrouter/free` through OpenRouter
- Default fallback path: `stepfun/step-3.5-flash:free`, then `nvidia/nemotron-3-super-120b-a12b:free`
- Keep the model chain configurable so the feature does not hard-fail when one free model is unavailable

### UI Recommendation
- One dedicated assistant page in the protected admin area
- Prompt input
- Answer area
- Visible citations
- Related module/action links
- Suggested starter prompts for common staff questions
- Conversation history for the signed-in user only

### Trust & Safety Rules
- Never expose secrets or `.env` values
- Never reveal raw security-sensitive material such as TOTP secrets or recovery codes
- Never answer outside the current user’s authorized module scope
- Never treat planning documents as permission to reveal hidden production data
- Refuse or narrow the answer when the request exceeds role access

### Observability
- Log prompt metadata, retrieved sources, cited sources, model used, latency, and failure state
- Do not log secrets or hidden chain-of-thought

### Validation Baseline
Before the assistant is treated as validated, test:
- workflow clarification questions
- role-boundary refusal questions
- ambiguous or low-context questions
- narrow live-record explanation questions

### Enterprise-Grade Maturity Path

#### EH15.1: Retrieval Quality Hardening
- Add hybrid retrieval so lexical matching no longer carries the full ranking burden.
- Add `pgvector`-backed embeddings inside PostgreSQL for semantic retrieval.
- Add reranking before prompt assembly so workflow-guide and operator-facing sources can outrank roadmap/progress material when the question is operational.
- Improve chunking with stronger section boundaries, chunk-size discipline, and metadata-aware filtering by role, module, source type, and route scope.
- Establish source-priority rules so approved workflow guidance wins over broad planning text for day-to-day staff questions.

Current implementation notes:
- The repo now applies tighter section-aware chunking with overlap so large markdown sections no longer become one retrieval unit.
- The assistant now merges lexical candidates with embedding-backed semantic candidates when embeddings are available, then reranks them with deterministic source-priority rules.
- Embeddings now persist in JSONB so the retrieval baseline works on local Postgres without `pgvector`, while the same EH15.1 path can also populate an optional `embeddingVector` column when the database exposes the extension.
- EH15.1 has now been validated, so EH15.2 is the next allowed step.

Exit target:
- Retrieval returns more relevant operator guidance with fewer roadmap-first results.
- Multilingual or informal workflow questions still retrieve the correct module/domain context.

#### EH15.2: Trust, Safety, and Governance
- Add a policy layer that classifies requests into allowed, narrowed, refused, and escalation-required categories.
- Add prompt-injection and secret-exfiltration guardrails before retrieved content reaches final answer assembly.
- Add source-governance states such as `approved`, `draft`, and `deprecated`.
- Enforce server-side citation requirements and low-confidence fallback rules.
- Keep the assistant read-only while governance rules are still being validated.
- The repo now implements this slice through a server-side request-policy layer, suspicious-source filtering, governed assistant source states, and citation-backed low-confidence fallback behavior.
- EH15.2 has now been user-tested and validated.

Exit target:
- The assistant can safely refuse or narrow unsafe requests and can distinguish trusted operational guidance from planning-only material.

#### EH15.3: Evaluation and Observability
- Build a fixed internal evaluation set covering workflow routing, policy explanation, role-boundary refusals, ambiguity handling, multilingual prompts, and later record-specific explanations.
- Log response metadata such as latency, model used, retrieval hits, cited hits, fallback path, refusal reason, and failure state.
- Add an admin-visible quality view for low-hit, low-confidence, and failed-answer patterns.
- Treat regression checks as part of the assistant release path instead of ad hoc manual spot checks.
- The repo now implements this slice through assistant response-log storage, a fixed evaluation suite, evaluation-run persistence, and an admin-visible quality panel on `/admin/assistant`.
- EH15.3 is now implemented in the repo and has been user-tested and validated.

Exit target:
- Retrieval and answer quality can be measured, compared, and gated before broader rollout.

#### EH15.4: Knowledge Operations
- Add admin-facing ingestion and curation controls instead of leaving knowledge updates as a code-only workflow.
- Support source review, sync status, ingestion diffs, rollback, and document-level disable/pin controls.
- Expand curated workflow-guide coverage so each protected module has an operator-safe guidance layer that is clearer than raw roadmap text.
- The repo now implements this slice through admin-only knowledge-operations controls on `/admin/assistant`, persisted source pin/disable plus review state, revision-backed rollback, and expanded module workflow-guide summaries.
- EH15.4 has now been user-tested and validated.

Exit target:
- The assistant knowledge base becomes governable product content rather than a passive dump of ingested docs.

#### EH15.5: Narrow Live-Record Explanations
- Add read-only record explainers only after retrieval quality, safety, and evaluation baselines are stable.
- Keep record helpers scoped to specific entities and current module permissions.
- Minimize returned data to status explanation, next-step reasoning, and directly relevant fields only.
- Start with high-value explanatory paths such as billing status, payment settlement state, receivables follow-up state, route pressure, and exceptions severity.
- Current implementation notes:
- The repo now supports protected live-record explainers for specific bill IDs, receipt numbers, route codes, and targeted exception or follow-up records shown in DWDS.
- Server-side authorization now gates each live explainer by the existing module boundary before any record lookup runs.
- Broad list-all or show-me live-record requests still escalate instead of turning the assistant into a general transaction search tool.
- The assistant now cites minimal live-record summaries for these explainers and keeps related-module next-step links visible in the protected chat UI.
- EH15.5 has now been user-tested and validated.

Exit target:
- Staff can ask why a visible record shows a given status without opening unrestricted live-data querying.

### Recommended Delivery Order
1. Add `EH15` to the roadmap and architecture docs
2. Create the protected `/admin/assistant` route shell
3. Add retrieval tables and `pgvector` support
4. Build documentation ingestion and chunking
5. Implement hybrid retrieval plus reranking
6. Add role-aware response guards
7. Add narrow live-record explanation helpers
8. Run a fixed validation question set

### Recommended Enterprise Sequence
1. Finish `EH15.1` retrieval hardening.
2. Add `EH15.2` policy and governance controls.
3. Add and validate `EH15.3` evaluation plus observability.
4. Add `EH15.4` admin knowledge operations.
5. Add `EH15.5` narrow live-record explanations.

## EH16: Staff Automation & AI Workers

### Goal
Add a supervised staff-automation layer that helps DWDS operators prepare and review operational work faster without giving AI workers silent authority over protected workflows.

### Product Position
- This is an internal staff-automation lane, not a general autonomous-agent system.
- EH16 should build on the validated EH15 assistant baseline rather than replacing it.
- Workers should improve operator speed on repetitive analysis and drafting tasks while preserving current role boundaries and audit expectations.

### Recommended V1 Scope
- Protected in-app worker runs only
- Proposal-first output for staff review
- Follow-up triage and exception summarization as the current proposal-only worker baseline
- `/admin/follow-up` and `/admin/exceptions` as the current worker surfaces
- No direct database mutations by workers
- No direct action execution from worker output in V1
- No autonomous billing, payment, disconnection, tariff, route, or admin-security actions
- Bounded workflow context limited to explicit module-scoped workers in V1
- Persisted worker-run history, proposal state, and review outcome

### Recommended First Worker Types
- Follow-up triage worker: rank overdue or at-risk accounts and suggest the next review step

### Deferred Worker Types
- Route worker: produce a route-pressure or risk briefing from existing route analytics
- Notice worker: draft a printable or reviewable notice body from authoritative DWDS data before staff approval
- Knowledge worker: flag stale workflow guidance, summarize diffs, or prepare assistant-source update proposals

### Approved Follow-On Direction
- EH17 should introduce approval-based execution, not silent execution.
- OpenClaw should act as the bounded planner, conversation coordinator, and approval-escalation engine behind DWDS.
- Telegram should be treated as the approval transport only, not as the execution authority or system of record.
- DWDS must remain responsible for final validation, role enforcement, payment posting, receipts, and audit logging.
- The recommended first approved-action path is cashier-assist `PAYMENT_POST`, where a staff-confirmed onsite payment can move through OpenClaw planning and Telegram approval before DWDS posts the payment.

### Disallowed V1 Behavior
- No silent actions
- No direct record mutation
- No bulk transactional-data discovery outside the approved task context
- No authority to post payments, generate bills, disconnect service, change tariffs, reassign routes, or modify admin-access state
- No bypass of existing role authorization or server-side workflow rules

### Disallowed Even In Later EH16 Slices Unless Explicitly Approved
- No unrestricted OpenClaw database-write authority
- No silent billing mutation
- No silent payment posting
- No broad autonomous disconnection or reinstatement
- No admin-security or staff-access mutation by workers

### Worker Contract
Each worker result should:
1. state the task it completed
2. summarize the proposed outcome directly
3. include the supporting basis or source context
4. show confidence, caution, or escalation signals where relevant
5. remain reviewable, editable, and rejectable by staff before any real action executes

### Execution Model Recommendation
- Keep the orchestration layer behind the protected DWDS app
- Treat OpenClaw or any similar runtime as an adapter, not as the source of truth
- Keep V1 proposal-only with no route from worker output to direct workflow execution
- Persist worker-run, proposal, dismissal, and execution-log records in PostgreSQL
- Add asynchronous job handling only if a narrow use case proves the need

### Validation Baseline
Before EH16 is treated as validated, test:
- proposal quality on one bounded workflow
- refusal behavior on out-of-scope or over-privileged requests
- dismissal and non-action handling
- proof that no worker output can directly execute a workflow mutation
- role-scope enforcement when workers are triggered from protected modules

### Recommended Delivery Order
1. Define `EH16` in the roadmap and architecture docs
2. Add worker-run and proposal-review data contracts
3. Ship the read-only follow-up triage worker on `/admin/follow-up`
4. Add staff review, dismissal, and audit history
5. Add evaluation and observability for worker quality
6. Only then define later worker types or any future approved execution path

### Technical Design Reference
- The first implementation slice is specified in `memory-bank/eh16.1-follow-up-triage-design.md`.

### Current Implemented Baseline
- EH16.1 is now live as a proposal-only follow-up triage worker on `/admin/follow-up`.
- EH16.2 is now live as a proposal-only exception summarization worker on `/admin/exceptions`.
- The current slice stores bounded worker runs, ranked proposals, and dismissal reviews in PostgreSQL.
- The active implementation uses deterministic local triage logic behind the same protected server-side boundary where a later OpenClaw integration can attach.
- The current EH16 baseline does not execute any workflow mutation and should still be treated as advisory only.
- Initial seeded local validation feedback on EH16.1 was positive enough to keep proposal-first worker expansion viable, and EH16.2 now follows the same advisory-only pattern on the exceptions module.
- EH16 should now be treated as the advisory worker baseline rather than the lane that also absorbs approval execution, Telegram-first cashiering, OpenClaw runtime integration, and future multi-lane worker orchestration.

## EH17: Approval-Based Automation Foundation

### Goal
Add the shared approval, intent, and execution framework needed before any worker can move from advisory output to approved action.

### Product Position
- EH17 is the execution foundation lane, not the planner lane.
- DWDS remains the only authority for validation, role checks, mutation, receipts, and audit logs.
- Telegram is the approval transport, not the source of truth.

## EH18: Telegram-First Cashier Assistant

### Goal
Let authorized onsite staff initiate a cashier-assist payment workflow through Telegram while DWDS remains the backend system of record.

### Product Position
- Telegram becomes the field entry surface for the first approved-action workflow.
- The first supported approved action should be single-bill `PAYMENT_POST`.
- Partial payments may be supported, but only through explicit confirmation.

### Current Implemented Baseline
- Linked cashier accounts can now initiate a Telegram cashier session through `/api/automation/telegram`.
- Telegram-originated cashier sessions now persist identity, bounded conversation state, approval linkage, and resulting payment linkage in PostgreSQL.
- The active EH18 baseline uses deterministic payer-plus-amount parsing, open-bill lookup, numbered clarification, explicit partial-payment confirmation, and explicit cash-received confirmation before approval is requested.
- Approved `PAYMENT_POST` intents now execute through the existing DWDS payment workflow and return the resulting receipt outcome back into the Telegram-originated session.
- `/admin/payments` now acts as the web audit and setup surface for Telegram cashier identity linking plus recent Telegram cashier session review.

## EH19: OpenClaw Integration

### Goal
Connect OpenClaw to the existing planner boundary after the approval and execution framework already works with a deterministic or stub planner.

### Product Position
- OpenClaw is the bounded planner and conversation coordinator.
- It should not become the mutation authority or audit authority.
- EH19 is now validated on the protected follow-up worker surface with `Source: OpenClaw`, while deterministic fallback remains required whenever the provider path is unavailable or invalid.

## EH20: Specialized Worker Lanes

### Goal
Support future follow-up queue management, exception investigation, and other domain-specific worker lanes only when they actually need different tools, latency, or approval rules.

### Product Position
- Design for multi-agent readiness.
- Do not assume separate long-running worker lanes are required on day one.

## EH21: Autonomous Operations Hardening

### Goal
Add the observability, queue control, retry behavior, and supervisory safety needed before broader autonomous operations are considered production-ready.

### Current Implemented Baseline
- `/admin/automation` now exists as a protected supervision workspace for admins reviewing worker health, pending approvals, delivery retries, stale runs, and recent execution outcomes.
- Automation persistence now includes lease ownership and expiry, retry counts, invalidation metadata, dead-letter metadata, and failure-category plus latency tracking.
- Approval execution now invalidates stale follow-up or payment intents before DWDS mutates records, so drifted queue state is no longer treated as silently executable.
- Telegram approval delivery failures now stay visible and retryable, and repeated delivery failure now dead-letters the request instead of leaving it in ambiguous transport state.
- EH21 is now validated for the implemented supervision, retry, invalidation, and dead-letter baseline.
