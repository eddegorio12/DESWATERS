import { AssistantSourceGovernanceState } from "@prisma/client";

import {
  AdminSurfaceHeader,
  AdminSurfacePanel,
} from "@/features/admin/components/admin-surface-panel";
import { StatusPill } from "@/features/admin/components/status-pill";
import {
  rollbackAssistantKnowledgeDocumentAction,
  syncAssistantKnowledgeAction,
  updateAssistantKnowledgeControlsAction,
} from "@/features/assistant/actions";

type KnowledgeOperationsState = {
  latestRun: {
    id: string;
    status: "RUNNING" | "SUCCEEDED" | "FAILED";
    sourceCount: number;
    chunkCount: number;
    errorMessage: string | null;
    startedAt: Date;
    completedAt: Date | null;
  } | null;
  totals: {
    sourceCount: number;
    pendingCount: number;
    pinnedCount: number;
    disabledCount: number;
  };
  sources: Array<{
    documentId: string | null;
    sourceKey: string;
    title: string;
    sourcePath: string;
    sourceType: "memory-bank" | "workflow-guide";
    governanceState: AssistantSourceGovernanceState;
    isPinned: boolean;
    isDisabled: boolean;
    disabledReason: string | null;
    status: "current" | "changed" | "new" | "removed";
    hasPendingChanges: boolean;
    changeSummary: {
      addedChunks: number;
      removedChunks: number;
      changedChunks: number;
    };
    chunkCount: number;
    currentChunkCount: number;
    lastIngestedAt: Date | null;
    lastReviewedAt: Date | null;
    lastReviewedByName: string | null;
    latestRevisionAt: Date | null;
    revisionCount: number;
    canRollback: boolean;
    latestStoredSummary: string | null;
    currentSourceSummary: string | null;
  }>;
};

function formatDateTime(value: Date | null) {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function getStatusPriority(status: KnowledgeOperationsState["sources"][number]["status"]) {
  switch (status) {
    case "current":
      return "success" as const;
    case "changed":
      return "attention" as const;
    case "new":
      return "ready" as const;
    case "removed":
      return "readonly" as const;
  }
}

function getGovernanceLabel(state: AssistantSourceGovernanceState) {
  return state.toLowerCase().replaceAll("_", " ");
}

const governanceOptions = [
  AssistantSourceGovernanceState.APPROVED,
  AssistantSourceGovernanceState.DRAFT,
  AssistantSourceGovernanceState.DEPRECATED,
] as const;

export function AssistantKnowledgeOperations({
  knowledgeOperations,
}: {
  knowledgeOperations: KnowledgeOperationsState;
}) {
  return (
    <AdminSurfacePanel>
      <AdminSurfaceHeader
        eyebrow="Knowledge Operations"
        title="Review, sync, and curate assistant sources"
        description="EH15.4 turns assistant knowledge into a managed admin surface with source controls, pending-diff visibility, and rollback support."
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <article className="rounded-[1.1rem] border border-border/70 bg-muted/15 p-4">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/72">
            Sources
          </p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
            {knowledgeOperations.totals.sourceCount}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {knowledgeOperations.totals.pinnedCount} pinned and {knowledgeOperations.totals.disabledCount} disabled.
          </p>
        </article>

        <article className="rounded-[1.1rem] border border-border/70 bg-muted/15 p-4">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/72">
            Pending changes
          </p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
            {knowledgeOperations.totals.pendingCount}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Sources whose live corpus content differs from the stored assistant baseline.
          </p>
        </article>

        <article className="rounded-[1.1rem] border border-border/70 bg-muted/15 p-4">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/72">
            Last sync
          </p>
          <p className="mt-3 text-base font-semibold tracking-tight text-foreground">
            {formatDateTime(knowledgeOperations.latestRun?.startedAt ?? null)}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {knowledgeOperations.latestRun
              ? `${knowledgeOperations.latestRun.sourceCount} sources and ${knowledgeOperations.latestRun.chunkCount} chunks.`
              : "No admin-triggered sync has run yet."}
          </p>
        </article>

        <article className="rounded-[1.1rem] border border-border/70 bg-muted/15 p-4">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/72">
            Rollback cover
          </p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
            {knowledgeOperations.sources.filter((source) => source.canRollback).length}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Sources currently have at least one earlier stored revision.
          </p>
        </article>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <form action={syncAssistantKnowledgeAction}>
          <button
            type="submit"
            className="h-11 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground"
          >
            Run knowledge sync
          </button>
        </form>

        {knowledgeOperations.latestRun?.errorMessage ? (
          <p className="max-w-2xl rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
            Latest sync error: {knowledgeOperations.latestRun.errorMessage}
          </p>
        ) : null}
      </div>

      <div className="mt-6 space-y-4">
        {knowledgeOperations.sources.map((source) => (
          <article
            key={source.sourceKey}
            className="rounded-[1.2rem] border border-border/70 bg-white p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-foreground">{source.title}</h3>
                  <StatusPill priority={getStatusPriority(source.status)}>
                    {source.status}
                  </StatusPill>
                  {source.isPinned ? <StatusPill priority="ready">Pinned</StatusPill> : null}
                  {source.isDisabled ? <StatusPill priority="readonly">Disabled</StatusPill> : null}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{source.sourcePath}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Governance: {getGovernanceLabel(source.governanceState)}. Stored {source.chunkCount} chunks, live corpus {source.currentChunkCount} chunks.
                </p>
              </div>

              <div className="text-right text-xs text-muted-foreground">
                <p>Last ingested: {formatDateTime(source.lastIngestedAt)}</p>
                <p className="mt-1">
                  Reviewed: {formatDateTime(source.lastReviewedAt)}
                  {source.lastReviewedByName ? ` by ${source.lastReviewedByName}` : ""}
                </p>
                <p className="mt-1">
                  Revisions: {source.revisionCount}
                  {source.latestRevisionAt ? `, latest ${formatDateTime(source.latestRevisionAt)}` : ""}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <div className="rounded-[1rem] border border-border/60 bg-muted/10 p-4">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/72">
                  Diff visibility
                </p>
                <p className="mt-3 text-sm leading-6 text-foreground">
                  Added {source.changeSummary.addedChunks}, changed {source.changeSummary.changedChunks}, removed {source.changeSummary.removedChunks} chunks.
                </p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Stored preview: {source.latestStoredSummary ?? "No stored summary yet."}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Live source preview: {source.currentSourceSummary ?? "No live source is available for this key right now."}
                </p>
                {source.disabledReason ? (
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Disable reason: {source.disabledReason}
                  </p>
                ) : null}
              </div>

              <div className="rounded-[1rem] border border-border/60 bg-muted/10 p-4">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/72">
                  Source controls
                </p>
                {source.documentId ? (
                  <form action={updateAssistantKnowledgeControlsAction} className="mt-3 space-y-4">
                    <input type="hidden" name="documentId" value={source.documentId} />

                    <div className="grid gap-3 md:grid-cols-3">
                      <label className="grid gap-2 text-sm text-foreground">
                        <span className="font-medium">Governance</span>
                        <select
                          name="governanceState"
                          defaultValue={source.governanceState}
                          className="h-11 rounded-2xl border border-input bg-white px-4 text-sm"
                        >
                          {governanceOptions.map((option) => (
                            <option key={option} value={option}>
                              {getGovernanceLabel(option)}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="grid gap-2 text-sm text-foreground">
                        <span className="font-medium">Pin in ranking</span>
                        <select
                          name="isPinned"
                          defaultValue={source.isPinned ? "true" : "false"}
                          className="h-11 rounded-2xl border border-input bg-white px-4 text-sm"
                        >
                          <option value="false">No</option>
                          <option value="true">Yes</option>
                        </select>
                      </label>

                      <label className="grid gap-2 text-sm text-foreground">
                        <span className="font-medium">Availability</span>
                        <select
                          name="isDisabled"
                          defaultValue={source.isDisabled ? "true" : "false"}
                          className="h-11 rounded-2xl border border-input bg-white px-4 text-sm"
                        >
                          <option value="false">Enabled</option>
                          <option value="true">Disabled</option>
                        </select>
                      </label>
                    </div>

                    <label className="grid gap-2 text-sm text-foreground">
                      <span className="font-medium">Disable reason</span>
                      <input
                        name="disabledReason"
                        defaultValue={source.disabledReason ?? ""}
                        placeholder="Explain why this source should stay out of retrieval."
                        className="h-11 rounded-2xl border border-input bg-white px-4 text-sm"
                      />
                    </label>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="submit"
                        className="h-10 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground"
                      >
                        Save source controls
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    This source has not been ingested yet. Run knowledge sync first so it can be reviewed and curated.
                  </p>
                )}

                {source.documentId && source.canRollback ? (
                  <form action={rollbackAssistantKnowledgeDocumentAction} className="mt-4">
                    <input type="hidden" name="documentId" value={source.documentId} />
                    <button
                      type="submit"
                      className="h-10 rounded-full border border-border bg-white px-4 text-sm font-medium text-foreground"
                    >
                      Roll back to previous revision
                    </button>
                  </form>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </AdminSurfacePanel>
  );
}
