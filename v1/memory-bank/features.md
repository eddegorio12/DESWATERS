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

Exit target:
- Retrieval and answer quality can be measured, compared, and gated before broader rollout.

#### EH15.4: Knowledge Operations
- Add admin-facing ingestion and curation controls instead of leaving knowledge updates as a code-only workflow.
- Support source review, sync status, ingestion diffs, rollback, and document-level disable/pin controls.
- Expand curated workflow-guide coverage so each protected module has an operator-safe guidance layer that is clearer than raw roadmap text.

Exit target:
- The assistant knowledge base becomes governable product content rather than a passive dump of ingested docs.

#### EH15.5: Narrow Live-Record Explanations
- Add read-only record explainers only after retrieval quality, safety, and evaluation baselines are stable.
- Keep record helpers scoped to specific entities and current module permissions.
- Minimize returned data to status explanation, next-step reasoning, and directly relevant fields only.
- Start with high-value explanatory paths such as billing status, payment settlement state, receivables follow-up state, route pressure, and exceptions severity.

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
3. Add `EH15.3` evaluation plus observability.
4. Add `EH15.4` admin knowledge operations.
5. Add `EH15.5` narrow live-record explanations.
