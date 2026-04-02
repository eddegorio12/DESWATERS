"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { buttonVariants } from "@/components/ui/button-variants";
import {
  AdminSurfaceHeader,
  AdminSurfacePanel,
} from "@/features/admin/components/admin-surface-panel";
import { StatusPill } from "@/features/admin/components/status-pill";
import {
  dismissFollowUpTriageProposal,
  requestFollowUpProposalApproval,
  runFollowUpTriage,
} from "@/features/follow-up/actions";
import { cn } from "@/lib/utils";

type FollowUpTriagePanelProps = {
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
    customerName: string;
    accountNumber: string;
    billingPeriod: string;
    followUpStatus: string;
    queueFocus: string;
    daysPastDue: number;
    outstandingBalanceLabel: string;
    openClawFailureReason: string | null;
    approvalEligible: boolean;
    dismissedAtLabel: string | null;
    dismissedByName: string | null;
    approval:
      | {
          requestId: string;
          actionType: string;
          status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "EXECUTED";
          transport: string;
          deliveryError: string | null;
          requestedAtLabel: string;
          expiresAtLabel: string;
          decidedAtLabel: string | null;
          decidedByLabel: string | null;
          executedAtLabel: string | null;
        }
      | null;
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

function getApprovalPriority(status: string) {
  if (status === "EXECUTED") {
    return "ready" as const;
  }

  if (status === "REJECTED" || status === "EXPIRED") {
    return "attention" as const;
  }

  return "pending" as const;
}

function getApprovalActionLabel(actionType: string) {
  switch (actionType) {
    case "FOLLOW_UP_SEND_REMINDER":
      return "First reminder";
    case "FOLLOW_UP_SEND_FINAL_NOTICE":
      return "Final notice";
    case "FOLLOW_UP_ESCALATE_DISCONNECTION_REVIEW":
      return "Disconnection review";
    default:
      return actionType.replaceAll("_", " ");
  }
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

export function FollowUpTriagePanel({ run, proposals }: FollowUpTriagePanelProps) {
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
        setError(actionError instanceof Error ? actionError.message : "The triage request failed.");
      } finally {
        setPendingKey(null);
      }
    });
  };

  return (
    <AdminSurfacePanel>
      <AdminSurfaceHeader
        eyebrow="AI Triage"
        title="Rank the current follow-up queue before staff act on the existing workflow controls."
        description="This worker is advisory only. It scores visible follow-up items, proposes review order, and records dismissals without changing bill stage, notices, or service status."
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
              <StatusPill priority="readonly">No triage run yet</StatusPill>
            )}
            <button
              type="button"
              className={cn(buttonVariants({ className: "rounded-xl px-4" }))}
              disabled={isPending}
              onClick={() => runAction("run-triage", () => runFollowUpTriage())}
            >
              {pendingKey === "run-triage" ? "Running triage..." : "Run AI Triage"}
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
              Protected follow-up queue only. No bill-stage updates, notice generation, or service actions can run from this panel.
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
                      <StatusPill priority="pending">
                        {proposal.queueFocus.replaceAll("_", " ")}
                      </StatusPill>
                      <StatusPill priority="readonly">
                        {proposal.followUpStatus.replaceAll("_", " ")}
                      </StatusPill>
                      {isDismissed ? <StatusPill priority="attention">dismissed</StatusPill> : null}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{proposal.customerName}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {proposal.accountNumber} | {proposal.billingPeriod}
                      </p>
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
                      <span>
                        {proposal.daysPastDue} day{proposal.daysPastDue === 1 ? "" : "s"} past due
                      </span>
                      <span>Balance {proposal.outstandingBalanceLabel}</span>
                      <span>Bill {proposal.targetId}</span>
                    </div>
                    {proposal.dismissedAtLabel ? (
                      <p className="text-sm text-muted-foreground">
                        Dismissed {proposal.dismissedAtLabel}
                        {proposal.dismissedByName ? ` by ${proposal.dismissedByName}` : ""}.
                      </p>
                    ) : null}
                    {proposal.approval ? (
                      <div className="rounded-2xl border border-border/65 bg-background/70 px-4 py-3 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusPill priority={getApprovalPriority(proposal.approval.status)}>
                            {proposal.approval.status.toLowerCase()}
                          </StatusPill>
                          <StatusPill priority="readonly">
                            {getApprovalActionLabel(proposal.approval.actionType)}
                          </StatusPill>
                          <StatusPill priority="readonly">
                            {proposal.approval.transport.toLowerCase()}
                          </StatusPill>
                        </div>
                        <p className="mt-2 text-muted-foreground">
                          Requested {proposal.approval.requestedAtLabel}. Expires {proposal.approval.expiresAtLabel}.
                        </p>
                        {proposal.approval.decidedAtLabel ? (
                          <p className="mt-1 text-muted-foreground">
                            Decision recorded {proposal.approval.decidedAtLabel}
                            {proposal.approval.decidedByLabel
                              ? ` by ${proposal.approval.decidedByLabel}`
                              : ""}.
                          </p>
                        ) : null}
                        {proposal.approval.executedAtLabel ? (
                          <p className="mt-1 text-muted-foreground">
                            Executed {proposal.approval.executedAtLabel}.
                          </p>
                        ) : null}
                        {proposal.approval.deliveryError ? (
                          <p className="mt-2 text-destructive">
                            Telegram delivery: {proposal.approval.deliveryError}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  <div className="w-full lg:max-w-xs">
                    <div className="space-y-2">
                      <button
                        type="button"
                        className={cn(
                          buttonVariants({
                            variant: "outline",
                            size: "sm",
                            className: "w-full rounded-xl px-3 justify-center",
                          })
                        )}
                        disabled={
                          isPending ||
                          isDismissed ||
                          !proposal.approvalEligible ||
                          proposal.approval?.status === "PENDING" ||
                          proposal.approval?.status === "APPROVED" ||
                          proposal.approval?.status === "EXECUTED"
                        }
                        onClick={() =>
                          runAction(`request-${proposal.id}`, () =>
                            requestFollowUpProposalApproval(proposal.id)
                          )
                        }
                      >
                        {pendingKey === `request-${proposal.id}`
                          ? "Requesting..."
                          : proposal.approval?.status === "PENDING"
                            ? "Approval requested"
                            : proposal.approval?.status === "EXECUTED"
                              ? "Approved and executed"
                              : proposal.approvalEligible
                                ? "Request Telegram approval"
                                : "No exact action yet"}
                      </button>
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
                            dismissFollowUpTriageProposal(proposal.id)
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
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-[1.35rem] border border-border/65 bg-background px-4 py-10 text-center text-sm text-muted-foreground">
            Run the bounded triage worker to rank visible follow-up items. The output stays advisory and does not change any receivables stage.
          </div>
        )}
      </div>
    </AdminSurfacePanel>
  );
}
