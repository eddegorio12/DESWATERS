"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { buttonVariants } from "@/components/ui/button-variants";
import {
  AdminSurfaceHeader,
  AdminSurfacePanel,
} from "@/features/admin/components/admin-surface-panel";
import { StatusPill } from "@/features/admin/components/status-pill";
import {
  dismissExceptionSummaryProposal,
  runExceptionSummarization,
} from "@/features/exceptions/actions";
import { cn } from "@/lib/utils";

type ExceptionSummaryPanelProps = {
  run:
    | {
        id: string;
        status: "PENDING" | "COMPLETED" | "FAILED";
        startedAtLabel: string;
        completedAtLabel: string | null;
        provider: string | null;
        model: string | null;
        proposalCount: number;
        failureReason: string | null;
        triggeredByName: string;
        triggeredByRole: string;
      }
    | null;
  proposals: {
    id: string;
    rank: number;
    summary: string;
    recommendedReviewStep: string;
    rationale: string;
    confidenceLabel: string;
    targetId: string;
    alertTitle: string;
    category: string;
    severity: string;
    customerName: string | null;
    accountNumber: string | null;
    meterNumber: string | null;
    metric: string;
    href: string;
    openClawFailureReason: string | null;
    dismissedAtLabel: string | null;
    dismissedByName: string | null;
  }[];
};

function getConfidencePriority(label: string) {
  if (label === "high") {
    return "ready" as const;
  }

  if (label === "medium") {
    return "pending" as const;
  }

  return "attention" as const;
}

function getSeverityPriority(label: string) {
  if (label === "critical") {
    return "overdue" as const;
  }

  if (label === "high") {
    return "attention" as const;
  }

  return "pending" as const;
}

function formatRunSource(provider: string | null, model: string | null) {
  if (provider === "OPENCLAW_GATEWAY") {
    return {
      label: "OpenClaw",
      detail: model ?? "Gateway planner",
      priority: "ready" as const,
    };
  }

  return {
    label: "Deterministic fallback",
    detail: model ?? "DWDS internal heuristic",
    priority: "readonly" as const,
  };
}

export function ExceptionSummaryPanel({ run, proposals }: ExceptionSummaryPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const runSource = run ? formatRunSource(run.provider, run.model) : null;

  const runAction = (key: string, action: () => Promise<void>) => {
    setError(null);
    setPendingKey(key);

    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch (actionError) {
        setError(
          actionError instanceof Error ? actionError.message : "The exception summary request failed."
        );
      } finally {
        setPendingKey(null);
      }
    });
  };

  return (
    <AdminSurfacePanel>
      <AdminSurfaceHeader
        eyebrow="AI Summary"
        title="Condense the current exceptions queue before staff open the linked modules."
        description="This worker is advisory only. It ranks visible alerts, drafts operator-facing review notes, and records dismissals without dispatching work, changing service status, or mutating billing records."
        aside={
          <div className="flex flex-wrap items-center gap-2">
            {run ? (
              <>
                <StatusPill priority={run.status === "FAILED" ? "attention" : "ready"}>
                  {run.status.toLowerCase()}
                </StatusPill>
                {runSource ? (
                  <StatusPill priority={runSource.priority}>{runSource.label}</StatusPill>
                ) : null}
                <StatusPill priority="readonly">
                  {run.proposalCount} proposal{run.proposalCount === 1 ? "" : "s"}
                </StatusPill>
              </>
            ) : (
              <StatusPill priority="readonly">No summary run yet</StatusPill>
            )}
            <button
              type="button"
              className={cn(buttonVariants({ className: "rounded-xl px-4" }))}
              disabled={isPending}
              onClick={() => runAction("run-summary", () => runExceptionSummarization())}
            >
              {pendingKey === "run-summary" ? "Running summary..." : "Run AI Summary"}
            </button>
          </div>
        }
      />

      {error ? (
        <p className="mt-5 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {run ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <article className="rounded-[1.2rem] border border-border/65 bg-white/76 p-4">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/72">
              Last run
            </p>
            <p className="mt-2 text-sm text-foreground">{run.startedAtLabel}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Triggered by {run.triggeredByName} ({run.triggeredByRole})
            </p>
          </article>
          <article className="rounded-[1.2rem] border border-border/65 bg-white/76 p-4">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/72">
              Output
            </p>
            <p className="mt-2 text-sm text-foreground">
              {run.proposalCount} proposal{run.proposalCount === 1 ? "" : "s"} recorded
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {run.completedAtLabel ? `Completed ${run.completedAtLabel}` : "Still processing"}
            </p>
          </article>
          <article className="rounded-[1.2rem] border border-border/65 bg-white/76 p-4">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/72">
              Source
            </p>
            <p className="mt-2 text-sm text-foreground">{runSource?.label ?? "Unknown"}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {runSource?.detail ?? "No provider recorded"}.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Protected exceptions queue only. No work-order dispatch, billing updates, or service-state changes can run from this panel.
            </p>
          </article>
        </div>
      ) : null}

      {run?.failureReason ? (
        <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Last run failed: {run.failureReason}
        </p>
      ) : null}

      <div className="mt-6 grid gap-4">
        {proposals.length ? (
          proposals.map((proposal) => {
            const isDismissed = Boolean(proposal.dismissedAtLabel);

            return (
              <article
                key={proposal.id}
                className="rounded-[1.35rem] border border-border/65 bg-white/82 p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill priority="readonly">Rank {proposal.rank}</StatusPill>
                      <StatusPill priority={getConfidencePriority(proposal.confidenceLabel)}>
                        {proposal.confidenceLabel}
                      </StatusPill>
                      <StatusPill priority={getSeverityPriority(proposal.severity)}>
                        {proposal.severity}
                      </StatusPill>
                      <StatusPill priority="ready">
                        {proposal.category.replaceAll("_", " ")}
                      </StatusPill>
                      {isDismissed ? <StatusPill priority="attention">dismissed</StatusPill> : null}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{proposal.alertTitle}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{proposal.metric}</p>
                    </div>
                    <p className="text-sm leading-6 text-foreground">{proposal.summary}</p>
                    <p className="text-sm text-muted-foreground">
                      Suggested review step: {proposal.recommendedReviewStep}
                    </p>
                    <p className="text-sm text-muted-foreground">{proposal.rationale}</p>
                    {proposal.openClawFailureReason ? (
                      <p className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                        OpenClaw fallback reason: {proposal.openClawFailureReason}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {proposal.customerName ? <span>{proposal.customerName}</span> : null}
                      {proposal.accountNumber ? <span>{proposal.accountNumber}</span> : null}
                      {proposal.meterNumber ? <span>Meter {proposal.meterNumber}</span> : null}
                      <span>Alert {proposal.targetId}</span>
                    </div>
                    {proposal.dismissedAtLabel ? (
                      <p className="text-sm text-muted-foreground">
                        Dismissed {proposal.dismissedAtLabel}
                        {proposal.dismissedByName ? ` by ${proposal.dismissedByName}` : ""}.
                      </p>
                    ) : null}
                  </div>
                  <div className="w-full space-y-2 lg:max-w-xs">
                    <Link
                      href={proposal.href}
                      className={cn(
                        buttonVariants({
                          variant: "outline",
                          size: "sm",
                          className: "w-full rounded-xl px-3 justify-center",
                        })
                      )}
                    >
                      Open linked module
                    </Link>
                    <button
                      type="button"
                      className={cn(
                        buttonVariants({
                          variant: "outline",
                          size: "sm",
                          className: "w-full rounded-xl px-3 justify-center",
                        })
                      )}
                      disabled={isPending || isDismissed}
                      onClick={() =>
                        runAction(`dismiss-${proposal.id}`, () =>
                          dismissExceptionSummaryProposal(proposal.id)
                        )
                      }
                    >
                      {pendingKey === `dismiss-${proposal.id}`
                        ? "Dismissing..."
                        : isDismissed
                          ? "Dismissed"
                          : "Dismiss proposal"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-[1.35rem] border border-border/65 bg-background px-4 py-10 text-center text-sm text-muted-foreground">
            Run the bounded summary worker to rank visible exception alerts. The output stays advisory and does not change work-order, billing, or service records.
          </div>
        )}
      </div>
    </AdminSurfacePanel>
  );
}
