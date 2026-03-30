import { AutomationRunStatus, AutomationWorkerType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

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
  workerType: AutomationWorkerType;
  scopeType: string;
  scopeKey?: string | null;
  triggeredById: string;
  provider?: string | null;
  model?: string | null;
}) {
  return prisma.automationRun.create({
    data: {
      workerType: input.workerType,
      scopeType: input.scopeType,
      scopeKey: input.scopeKey ?? null,
      triggeredById: input.triggeredById,
      provider: input.provider ?? null,
      model: input.model ?? null,
      status: AutomationRunStatus.PENDING,
    },
  });
}

export async function completeAutomationRunWithProposals(input: {
  runId: string;
  latencyMs: number;
  proposals: AutomationProposalInput[];
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
        latencyMs: input.latencyMs,
        proposalCount: input.proposals.length,
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
      completedAt: new Date(),
    },
  });
}
