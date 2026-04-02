import { type AutomationApprovalStatus, type AutomationExecutionStatus } from "@prisma/client";

import { buttonVariants } from "@/components/ui/button-variants";
import {
  AdminSurfaceHeader,
  AdminSurfacePanel,
} from "@/features/admin/components/admin-surface-panel";
import { StatusPill } from "@/features/admin/components/status-pill";
import {
  expirePendingAutomationApprovals,
  expireStaleAutomationRuns,
  retryAutomationApprovalDelivery,
} from "@/features/automation/actions";
import { cn } from "@/lib/utils";

function getApprovalPriority(status: AutomationApprovalStatus) {
  if (status === "EXECUTED") {
    return "success" as const;
  }

  if (status === "INVALIDATED" || status === "REJECTED") {
    return "attention" as const;
  }

  if (status === "EXPIRED") {
    return "readonly" as const;
  }

  return "pending" as const;
}

function getExecutionPriority(status: AutomationExecutionStatus) {
  if (status === "SUCCEEDED") {
    return "success" as const;
  }

  if (status === "FAILED" || status === "DEAD_LETTERED") {
    return "attention" as const;
  }

  if (status === "INVALIDATED" || status === "REJECTED" || status === "EXPIRED") {
    return "readonly" as const;
  }

  return "pending" as const;
}

export function AutomationSupervisionBoard({
  stats,
  lanes,
  staleRuns,
  approvalRequests,
  executionLogs,
}: {
  stats: {
    staleRunCount: number;
    pendingApprovalCount: number;
    deliveryIssueCount: number;
    deadLetterCount: number;
    recentSuccessCount: number;
    recentFailureCount: number;
  };
  lanes: {
    laneKey: string;
    label: string;
    ownerLabel: string;
    executionMode: string;
    lastRunAt: string | null;
    totalRuns: number;
    completedRuns: number;
    failedRuns: number;
    avgLatencyMs: number | null;
  }[];
  staleRuns: {
    id: string;
    laneLabel: string;
    startedAt: string;
    leaseExpiresAt: string | null;
    triggeredByName: string;
    retryCount: number;
    failureReason: string | null;
    deadLetterReason: string | null;
  }[];
  approvalRequests: {
    id: string;
    status: AutomationApprovalStatus;
    summary: string;
    actionType: string;
    requestedByName: string;
    requestedAt: string;
    expiresAt: string;
    retryCount: number;
    deliveryError: string | null;
    invalidatedReason: string | null;
    deadLetterReason: string | null;
    canRetryDelivery: boolean;
  }[];
  executionLogs: {
    id: string;
    status: AutomationExecutionStatus;
    actionType: string;
    resultSummary: string;
    failureCategory: string | null;
    latencyMs: number | null;
    createdAt: string;
  }[];
}) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <AdminSurfacePanel>
          <AdminSurfaceHeader
            eyebrow="Supervisor Controls"
            title="Expire stale automation state and keep approval delivery supervised."
            description="EH21 keeps the current workers bounded, but adds supervision for stale leases, expired approvals, delivery retries, and visible dead-letter outcomes."
          />

          <div className="mt-6 grid gap-3">
            <form action={expireStaleAutomationRuns}>
              <button type="submit" className="h-11 rounded-2xl bg-primary px-5 text-sm font-medium text-primary-foreground">
                Expire stale worker leases
              </button>
            </form>
            <form action={expirePendingAutomationApprovals}>
              <button
                type="submit"
                className="h-11 rounded-2xl border border-border bg-background px-5 text-sm font-medium text-foreground"
              >
                Expire pending approval backlog
              </button>
            </form>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <article className="rounded-[1.15rem] border border-border/70 bg-secondary/26 px-4 py-3">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/72">
                Stale runs
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{stats.staleRunCount}</p>
            </article>
            <article className="rounded-[1.15rem] border border-border/70 bg-secondary/26 px-4 py-3">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/72">
                Pending approvals
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{stats.pendingApprovalCount}</p>
            </article>
            <article className="rounded-[1.15rem] border border-border/70 bg-secondary/26 px-4 py-3">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/72">
                Delivery issues
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{stats.deliveryIssueCount}</p>
            </article>
            <article className="rounded-[1.15rem] border border-border/70 bg-secondary/26 px-4 py-3">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/72">
                Dead-lettered
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{stats.deadLetterCount}</p>
            </article>
          </div>
        </AdminSurfacePanel>

        <AdminSurfacePanel>
          <AdminSurfaceHeader
            eyebrow="Lane Health"
            title="Recent worker-lane reliability"
            aside={`${lanes.length} active lane${lanes.length === 1 ? "" : "s"}`}
          />

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {lanes.map((lane) => (
              <article key={lane.laneKey} className="rounded-[1.2rem] border border-border/65 bg-white/76 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill priority="ready">{lane.label}</StatusPill>
                  <StatusPill priority="readonly">{lane.executionMode.replaceAll("_", " ").toLowerCase()}</StatusPill>
                </div>
                <p className="mt-3 text-sm font-medium text-foreground">{lane.ownerLabel}</p>
                <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                  <p>{lane.totalRuns} total run{lane.totalRuns === 1 ? "" : "s"}</p>
                  <p>{lane.completedRuns} completed</p>
                  <p>{lane.failedRuns} failed</p>
                  <p>
                    Avg latency {lane.avgLatencyMs !== null ? `${lane.avgLatencyMs} ms` : "n/a"}
                  </p>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  Last run: {lane.lastRunAt ?? "No runs recorded"}
                </p>
              </article>
            ))}
          </div>
        </AdminSurfacePanel>
      </div>

      <AdminSurfacePanel>
        <AdminSurfaceHeader
          eyebrow="Stale Leases"
          title="Runs that still look pending after their worker lease expired"
          aside={`${staleRuns.length} item${staleRuns.length === 1 ? "" : "s"}`}
        />

        <div className="mt-6 grid gap-4">
          {staleRuns.length ? (
            staleRuns.map((run) => (
              <article key={run.id} className="rounded-[1.2rem] border border-border/65 bg-white/82 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill priority="attention">{run.laneLabel}</StatusPill>
                  <StatusPill priority="readonly">Retry {run.retryCount}</StatusPill>
                </div>
                <p className="mt-3 text-sm text-foreground">
                  Started {run.startedAt}. Lease expiry {run.leaseExpiresAt ?? "not recorded"}.
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Triggered by {run.triggeredByName}.</p>
                {run.failureReason ? (
                  <p className="mt-2 text-sm text-muted-foreground">Failure note: {run.failureReason}</p>
                ) : null}
                {run.deadLetterReason ? (
                  <p className="mt-2 text-sm text-amber-900">Dead-letter reason: {run.deadLetterReason}</p>
                ) : null}
              </article>
            ))
          ) : (
            <div className="rounded-[1.2rem] border border-dashed border-border/70 bg-background/70 px-4 py-10 text-center text-sm text-muted-foreground">
              No stale worker leases are currently waiting for supervision.
            </div>
          )}
        </div>
      </AdminSurfacePanel>

      <AdminSurfacePanel>
        <AdminSurfaceHeader
          eyebrow="Approval Watchlist"
          title="Recent approval requests, retries, and invalidation outcomes"
          aside={`${approvalRequests.length} request${approvalRequests.length === 1 ? "" : "s"}`}
        />

        <div className="mt-6 grid gap-4">
          {approvalRequests.length ? (
            approvalRequests.map((request) => (
              <article key={request.id} className="rounded-[1.2rem] border border-border/65 bg-white/82 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill priority={getApprovalPriority(request.status)}>
                        {request.status.toLowerCase()}
                      </StatusPill>
                      <StatusPill priority="readonly">{request.actionType.replaceAll("_", " ")}</StatusPill>
                      <StatusPill priority="readonly">Retry {request.retryCount}</StatusPill>
                    </div>
                    <p className="mt-3 text-sm text-foreground">{request.summary}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Requested by {request.requestedByName} on {request.requestedAt}. Expires {request.expiresAt}.
                    </p>
                    {request.deliveryError ? (
                      <p className="mt-2 text-sm text-amber-900">Delivery issue: {request.deliveryError}</p>
                    ) : null}
                    {request.invalidatedReason ? (
                      <p className="mt-2 text-sm text-amber-900">Invalidation: {request.invalidatedReason}</p>
                    ) : null}
                    {request.deadLetterReason ? (
                      <p className="mt-2 text-sm text-amber-900">Dead-letter: {request.deadLetterReason}</p>
                    ) : null}
                  </div>
                  <div className="w-full lg:max-w-xs">
                    {request.canRetryDelivery ? (
                      <form action={retryAutomationApprovalDelivery}>
                        <input type="hidden" name="requestId" value={request.id} />
                        <button
                          type="submit"
                          className={cn(
                            buttonVariants({
                              variant: "outline",
                              size: "sm",
                              className: "w-full justify-center rounded-xl px-3",
                            })
                          )}
                        >
                          Retry Telegram delivery
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-[1.2rem] border border-dashed border-border/70 bg-background/70 px-4 py-10 text-center text-sm text-muted-foreground">
              No approval requests are recorded yet.
            </div>
          )}
        </div>
      </AdminSurfacePanel>

      <AdminSurfacePanel>
        <AdminSurfaceHeader
          eyebrow="Execution Signal"
          title="Recent execution and supervisor outcomes"
          aside={`${stats.recentSuccessCount} succeeded, ${stats.recentFailureCount} non-success`}
        />

        <div className="mt-6 grid gap-4">
          {executionLogs.length ? (
            executionLogs.map((log) => (
              <article key={log.id} className="rounded-[1.2rem] border border-border/65 bg-white/82 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill priority={getExecutionPriority(log.status)}>
                    {log.status.toLowerCase()}
                  </StatusPill>
                  <StatusPill priority="readonly">{log.actionType.replaceAll("_", " ")}</StatusPill>
                  {log.failureCategory ? (
                    <StatusPill priority="readonly">{log.failureCategory.toLowerCase()}</StatusPill>
                  ) : null}
                </div>
                <p className="mt-3 text-sm text-foreground">{log.resultSummary}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {log.createdAt}
                  {log.latencyMs !== null ? ` • ${log.latencyMs} ms` : ""}
                </p>
              </article>
            ))
          ) : (
            <div className="rounded-[1.2rem] border border-dashed border-border/70 bg-background/70 px-4 py-10 text-center text-sm text-muted-foreground">
              No automation execution logs are available yet.
            </div>
          )}
        </div>
      </AdminSurfacePanel>
    </div>
  );
}
