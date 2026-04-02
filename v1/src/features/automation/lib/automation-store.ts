import { AutomationRunStatus, AutomationWorkerLaneKey, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  createAutomationWorkerLaneSnapshotJson,
  getAutomationWorkerLaneConfig,
} from "@/features/automation/lib/worker-lanes";
import { getAutomationRunLeaseExpiry } from "@/features/automation/lib/automation-policy";

type AutomationProposalInput = {
  rank: number;
  targetType: string;
  targetId: string;
  summary: string;
  recommendedReviewStep: string;
  rationale: string;
  confidenceLabel: string;
  sourceMetadata: Prisma.JsonObject;
};

export async function createPendingAutomationRun(input: {
  laneKey: AutomationWorkerLaneKey;
  scopeKey?: string | null;
  triggeredById: string;
  provider?: string | null;
  model?: string | null;
  retryCount?: number;
}) {
  const lane = getAutomationWorkerLaneConfig(input.laneKey);

  return prisma.automationRun.create({
    data: {
      workerType: lane.workerType,
      laneKey: lane.key,
      laneSnapshot: createAutomationWorkerLaneSnapshotJson(lane.key),
      scopeType: lane.scopeType,
      scopeKey: input.scopeKey ?? null,
      triggeredById: input.triggeredById,
      provider: input.provider ?? null,
      model: input.model ?? null,
      status: AutomationRunStatus.PENDING,
      leaseOwner: `web:${input.triggeredById}`,
      leaseExpiresAt: getAutomationRunLeaseExpiry(),
      retryCount: input.retryCount ?? 0,
    },
  });
}

export async function completeAutomationRunWithProposals(input: {
  runId: string;
  latencyMs: number;
  proposals: AutomationProposalInput[];
  provider?: string | null;
  model?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    await tx.automationProposal.deleteMany({
      where: {
        runId: input.runId,
      },
    });

    if (input.proposals.length) {
      await tx.automationProposal.createMany({
        data: input.proposals.map((proposal) => ({
          runId: input.runId,
          rank: proposal.rank,
          targetType: proposal.targetType,
          targetId: proposal.targetId,
          summary: proposal.summary,
          recommendedReviewStep: proposal.recommendedReviewStep,
          rationale: proposal.rationale,
          confidenceLabel: proposal.confidenceLabel,
          sourceMetadata: proposal.sourceMetadata,
        })),
      });
    }

    return tx.automationRun.update({
      where: {
        id: input.runId,
      },
      data: {
        status: AutomationRunStatus.COMPLETED,
        provider: input.provider ?? undefined,
        model: input.model ?? undefined,
        latencyMs: input.latencyMs,
        proposalCount: input.proposals.length,
        leaseOwner: null,
        leaseExpiresAt: null,
        completedAt: new Date(),
      },
    });
  });
}

export async function failAutomationRun(input: {
  runId: string;
  latencyMs: number;
  failureReason: string;
}) {
  return prisma.automationRun.update({
    where: {
      id: input.runId,
    },
    data: {
      status: AutomationRunStatus.FAILED,
      latencyMs: input.latencyMs,
      failureReason: input.failureReason,
      leaseOwner: null,
      leaseExpiresAt: null,
      completedAt: new Date(),
    },
  });
}
