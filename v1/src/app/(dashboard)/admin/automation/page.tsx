import { AutomationApprovalStatus, AutomationRunStatus } from "@prisma/client";

import { AdminPageActions } from "@/features/admin/components/admin-page-actions";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { ModuleAccessStateView } from "@/features/admin/components/module-access-state";
import { AutomationSupervisionBoard } from "@/features/automation/components/automation-supervision-board";
import { parseAutomationWorkerLaneSnapshot } from "@/features/automation/lib/worker-lanes";
import { getModuleAccess } from "@/features/auth/lib/authorization";
import { prisma } from "@/lib/prisma";

export default async function AdminAutomationPage() {
  const access = await getModuleAccess("automation");

  if (access.status !== "authorized") {
    return <ModuleAccessStateView module="automation" access={access} />;
  }

  const now = new Date();
  const recentWindow = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const [runs, approvals, executionLogs, staleRunCount, pendingApprovalCount] = await Promise.all([
    prisma.automationRun.findMany({
      orderBy: [{ startedAt: "desc" }],
      take: 40,
      select: {
        id: true,
        laneKey: true,
        laneSnapshot: true,
        status: true,
        latencyMs: true,
        retryCount: true,
        startedAt: true,
        completedAt: true,
        leaseExpiresAt: true,
        failureReason: true,
        deadLetterReason: true,
        triggeredBy: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.automationApprovalRequest.findMany({
      orderBy: [{ requestedAt: "desc" }],
      take: 20,
      select: {
        id: true,
        status: true,
        expiresAt: true,
        requestedAt: true,
        retryCount: true,
        deliveryError: true,
        invalidatedReason: true,
        deadLetterReason: true,
        transport: true,
        intent: {
          select: {
            summary: true,
            actionType: true,
          },
        },
        requestedBy: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.automationExecutionLog.findMany({
      orderBy: [{ createdAt: "desc" }],
      take: 20,
      select: {
        id: true,
        status: true,
        actionType: true,
        resultSummary: true,
        failureCategory: true,
        latencyMs: true,
        createdAt: true,
      },
    }),
    prisma.automationRun.count({
      where: {
        status: AutomationRunStatus.PENDING,
        leaseExpiresAt: {
          lte: now,
        },
      },
    }),
    prisma.automationApprovalRequest.count({
      where: {
        status: AutomationApprovalStatus.PENDING,
      },
    }),
  ]);

  const laneMap = runs.reduce((map, run) => {
      const lane = parseAutomationWorkerLaneSnapshot(run.laneSnapshot, run.laneKey);
      const current = map.get(run.laneKey) ?? {
        laneKey: run.laneKey,
        label: lane.label,
        ownerLabel: lane.ownerLabel,
        executionMode: lane.executionMode,
        lastRunAt: null as string | null,
        totalRuns: 0,
        completedRuns: 0,
        failedRuns: 0,
        latencyValues: [] as number[],
      };

      current.totalRuns += 1;
      current.lastRunAt = current.lastRunAt ?? run.startedAt.toLocaleString("en-PH");

      if (run.status === AutomationRunStatus.COMPLETED) {
        current.completedRuns += 1;
      }

      if (run.status === AutomationRunStatus.FAILED) {
        current.failedRuns += 1;
      }

      if (typeof run.latencyMs === "number") {
        current.latencyValues.push(run.latencyMs);
      }

      map.set(run.laneKey, current);
      return map;
    }, new Map<string, {
      laneKey: string;
      label: string;
      ownerLabel: string;
      executionMode: string;
      lastRunAt: string | null;
      totalRuns: number;
      completedRuns: number;
      failedRuns: number;
      latencyValues: number[];
    }>());
  const lanes = Array.from(laneMap.values()).map((lane) => ({
    laneKey: lane.laneKey,
    label: lane.label,
    ownerLabel: lane.ownerLabel,
    executionMode: lane.executionMode,
    lastRunAt: lane.lastRunAt,
    totalRuns: lane.totalRuns,
    completedRuns: lane.completedRuns,
    failedRuns: lane.failedRuns,
    avgLatencyMs: lane.latencyValues.length
      ? Math.round(
          lane.latencyValues.reduce((sum: number, value: number) => sum + value, 0) /
            lane.latencyValues.length
        )
      : null,
  }));

  const staleRuns = runs
    .filter(
      (run) =>
        run.status === AutomationRunStatus.PENDING &&
        run.leaseExpiresAt &&
        run.leaseExpiresAt <= now
    )
    .map((run) => ({
      id: run.id,
      laneLabel: parseAutomationWorkerLaneSnapshot(run.laneSnapshot, run.laneKey).label,
      startedAt: run.startedAt.toLocaleString("en-PH"),
      leaseExpiresAt: run.leaseExpiresAt?.toLocaleString("en-PH") ?? null,
      triggeredByName: run.triggeredBy.name,
      retryCount: run.retryCount,
      failureReason: run.failureReason,
      deadLetterReason: run.deadLetterReason,
    }));

  const approvalRequests = approvals.map((request) => ({
    id: request.id,
    status: request.status,
    summary: request.intent.summary,
    actionType: request.intent.actionType,
    requestedByName: request.requestedBy.name,
    requestedAt: request.requestedAt.toLocaleString("en-PH"),
    expiresAt: request.expiresAt.toLocaleString("en-PH"),
    retryCount: request.retryCount,
    deliveryError: request.deliveryError,
    invalidatedReason: request.invalidatedReason,
    deadLetterReason: request.deadLetterReason,
    canRetryDelivery:
      request.transport === "TELEGRAM" &&
      request.status === AutomationApprovalStatus.PENDING &&
      Boolean(request.deliveryError) &&
      request.expiresAt > now,
  }));

  const executionRows = executionLogs.map((log) => ({
    id: log.id,
    status: log.status,
    actionType: log.actionType,
    resultSummary: log.resultSummary,
    failureCategory: log.failureCategory,
    latencyMs: log.latencyMs,
    createdAt: log.createdAt.toLocaleString("en-PH"),
  }));

  const recentSuccessCount = executionLogs.filter(
    (log) => log.status === "SUCCEEDED" && log.createdAt >= recentWindow
  ).length;
  const recentFailureCount = executionLogs.filter(
    (log) => log.status !== "SUCCEEDED" && log.createdAt >= recentWindow
  ).length;
  const deliveryIssueCount = approvals.filter(
    (request) => request.status === "PENDING" && request.deliveryError
  ).length;
  const deadLetterCount = approvals.filter((request) => request.deadLetterReason).length;

  return (
    <AdminPageShell
      eyebrow="Automation Supervision"
      title="Supervise worker leases, approval transport, and recent execution outcomes without widening automation authority."
      description="EH21 keeps DWDS automation bounded and reviewable by surfacing stale worker state, approval delivery trouble, invalidated intents, and recent execution signals from one protected control surface."
      actions={
        <AdminPageActions
          links={[
            { href: "/admin/follow-up", label: "Follow-up lane" },
            { href: "/admin/exceptions", label: "Exceptions lane" },
            { href: "/admin/payments", label: "Payments lane" },
          ]}
        />
      }
      stats={[
        {
          label: "Supervisor queue",
          value: (staleRunCount + deliveryIssueCount).toString(),
          detail: "Stale worker leases plus pending Telegram delivery issues",
          accent: "rose",
        },
        {
          label: "Pending approvals",
          value: pendingApprovalCount.toString(),
          detail: "Approval requests still waiting for decision or expiry handling",
          accent: "amber",
        },
        {
          label: "Recent outcomes",
          value: `${recentSuccessCount}/${recentSuccessCount + recentFailureCount || 0}`,
          detail: "Succeeded versus non-success execution logs in the last 7 days",
          accent: "sky",
        },
      ]}
    >
      <AutomationSupervisionBoard
        stats={{
          staleRunCount,
          pendingApprovalCount,
          deliveryIssueCount,
          deadLetterCount,
          recentSuccessCount,
          recentFailureCount,
        }}
        lanes={lanes}
        staleRuns={staleRuns}
        approvalRequests={approvalRequests}
        executionLogs={executionRows}
      />
    </AdminPageShell>
  );
}
