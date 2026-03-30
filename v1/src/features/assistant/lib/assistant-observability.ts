import {
  Prisma,
  type AssistantDisposition as PrismaAssistantDisposition,
  type AssistantFailureState as PrismaAssistantFailureState,
  type AssistantInteractionSource,
  type AssistantEvaluationCategory as PrismaAssistantEvaluationCategory,
  type Role,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import type {
  AssistantPolicyDisposition,
} from "./assistant-policy";

export type AssistantFailureState =
  | "none"
  | "no-hits"
  | "low-confidence"
  | "governance-gated"
  | "policy-refused"
  | "policy-escalation"
  | "internal-error";

export type AssistantEvaluationCategory =
  | "workflow-routing"
  | "policy-explanation"
  | "role-boundary"
  | "ambiguity"
  | "multilingual"
  | "safety";

export type AssistantResponseLogInput = {
  userId?: string | null;
  interactionSource?: AssistantInteractionSource;
  evaluationCaseKey?: string | null;
  conversationId?: string | null;
  query: string;
  disposition: AssistantPolicyDisposition;
  modelUsed?: string | null;
  fallbackPath?: string[];
  refusalReason?: string | null;
  failureState?: AssistantFailureState;
  noHits?: boolean;
  lowConfidence?: boolean;
  retrievalHitCount?: number;
  citedHitCount?: number;
  latencyMs: number;
  topHitScore?: number | null;
  citations?: Array<{
    title?: string | null;
    sourcePath?: string | null;
    href?: string | null;
  }>;
  relatedModuleHrefs?: string[];
};

function mapDisposition(disposition: AssistantPolicyDisposition): PrismaAssistantDisposition {
  switch (disposition) {
    case "allowed":
      return "ALLOWED";
    case "narrowed":
      return "NARROWED";
    case "refused":
      return "REFUSED";
    case "escalation-required":
      return "ESCALATION_REQUIRED";
  }
}

function mapFailureState(
  failureState: AssistantFailureState = "none"
): PrismaAssistantFailureState {
  switch (failureState) {
    case "none":
      return "NONE";
    case "no-hits":
      return "NO_HITS";
    case "low-confidence":
      return "LOW_CONFIDENCE";
    case "governance-gated":
      return "GOVERNANCE_GATED";
    case "policy-refused":
      return "POLICY_REFUSED";
    case "policy-escalation":
      return "POLICY_ESCALATION";
    case "internal-error":
      return "INTERNAL_ERROR";
  }
}

export function mapEvaluationCategory(
  category: AssistantEvaluationCategory
): PrismaAssistantEvaluationCategory {
  switch (category) {
    case "workflow-routing":
      return "WORKFLOW_ROUTING";
    case "policy-explanation":
      return "POLICY_EXPLANATION";
    case "role-boundary":
      return "ROLE_BOUNDARY";
    case "ambiguity":
      return "AMBIGUITY";
    case "multilingual":
      return "MULTILINGUAL";
    case "safety":
      return "SAFETY";
  }
}

function normalizeFailureStateLabel(value: PrismaAssistantFailureState) {
  switch (value) {
    case "NONE":
      return "none";
    case "NO_HITS":
      return "no-hits";
    case "LOW_CONFIDENCE":
      return "low-confidence";
    case "GOVERNANCE_GATED":
      return "governance-gated";
    case "POLICY_REFUSED":
      return "policy-refused";
    case "POLICY_ESCALATION":
      return "policy-escalation";
    case "INTERNAL_ERROR":
      return "internal-error";
  }
}

function normalizeDispositionLabel(value: PrismaAssistantDisposition) {
  switch (value) {
    case "ALLOWED":
      return "allowed";
    case "NARROWED":
      return "narrowed";
    case "REFUSED":
      return "refused";
    case "ESCALATION_REQUIRED":
      return "escalation-required";
  }
}

export async function recordAssistantResponseLog(input: AssistantResponseLogInput) {
  try {
    await prisma.assistantResponseLog.create({
      data: {
        userId: input.userId ?? null,
        interactionSource: input.interactionSource ?? "USER_CHAT",
        evaluationCaseKey: input.evaluationCaseKey ?? null,
        conversationId: input.conversationId ?? null,
        query: input.query,
        disposition: mapDisposition(input.disposition),
        modelUsed: input.modelUsed ?? null,
        fallbackPath: input.fallbackPath ?? [],
        refusalReason: input.refusalReason ?? null,
        failureState: mapFailureState(input.failureState),
        noHits: input.noHits ?? false,
        lowConfidence: input.lowConfidence ?? false,
        retrievalHitCount: input.retrievalHitCount ?? 0,
        citedHitCount: input.citedHitCount ?? 0,
        latencyMs: Math.max(0, Math.round(input.latencyMs)),
        topHitScore:
          typeof input.topHitScore === "number" && Number.isFinite(input.topHitScore)
            ? input.topHitScore
            : null,
        citations: input.citations?.length
          ? (input.citations as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        relatedModuleHrefs: input.relatedModuleHrefs ?? [],
      },
    });
  } catch {
    return null;
  }

  return true;
}

export function canViewAssistantQuality(role: Role) {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export async function getAssistantQualityOverview(role: Role) {
  if (!canViewAssistantQuality(role)) {
    return null;
  }

  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const [
    interactionCount,
    noHitCount,
    lowConfidenceCount,
    failureCount,
    recentFlaggedLogs,
    latestEvaluationRun,
  ] = await Promise.all([
    prisma.assistantResponseLog.count({
      where: {
        interactionSource: "USER_CHAT",
        createdAt: {
          gte: since,
        },
      },
    }),
    prisma.assistantResponseLog.count({
      where: {
        interactionSource: "USER_CHAT",
        noHits: true,
        createdAt: {
          gte: since,
        },
      },
    }),
    prisma.assistantResponseLog.count({
      where: {
        interactionSource: "USER_CHAT",
        lowConfidence: true,
        createdAt: {
          gte: since,
        },
      },
    }),
    prisma.assistantResponseLog.count({
      where: {
        interactionSource: "USER_CHAT",
        failureState: {
          not: "NONE",
        },
        createdAt: {
          gte: since,
        },
      },
    }),
    prisma.assistantResponseLog.findMany({
      where: {
        interactionSource: "USER_CHAT",
        createdAt: {
          gte: since,
        },
        OR: [
          { noHits: true },
          { lowConfidence: true },
          {
            failureState: {
              not: "NONE",
            },
          },
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 8,
      select: {
        id: true,
        query: true,
        disposition: true,
        failureState: true,
        noHits: true,
        lowConfidence: true,
        retrievalHitCount: true,
        citedHitCount: true,
        latencyMs: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            role: true,
          },
        },
      },
    }),
    prisma.assistantEvaluationRun.findFirst({
      where: {
        status: "SUCCEEDED",
      },
      orderBy: {
        startedAt: "desc",
      },
      select: {
        id: true,
        status: true,
        caseCount: true,
        passedCount: true,
        averageScore: true,
        startedAt: true,
        completedAt: true,
        summary: true,
        results: {
          where: {
            passed: false,
          },
          orderBy: [{ score: "asc" }, { createdAt: "desc" }],
          take: 5,
          select: {
            caseKey: true,
            caseLabel: true,
            category: true,
            score: true,
            failureState: true,
            notes: true,
          },
        },
      },
    }),
  ]);

  return {
    recentWindowDays: 14,
    interactionCount,
    noHitCount,
    lowConfidenceCount,
    failureCount,
    recentFlaggedLogs: recentFlaggedLogs.map((log) => ({
      id: log.id,
      query: log.query,
      disposition: normalizeDispositionLabel(log.disposition),
      failureState: normalizeFailureStateLabel(log.failureState),
      noHits: log.noHits,
      lowConfidence: log.lowConfidence,
      retrievalHitCount: log.retrievalHitCount,
      citedHitCount: log.citedHitCount,
      latencyMs: log.latencyMs,
      createdAt: log.createdAt,
      userName: log.user?.name ?? "Unknown",
      userRole: log.user?.role ?? null,
    })),
    latestEvaluationRun: latestEvaluationRun
      ? {
          id: latestEvaluationRun.id,
          caseCount: latestEvaluationRun.caseCount,
          passedCount: latestEvaluationRun.passedCount,
          averageScore: latestEvaluationRun.averageScore,
          startedAt: latestEvaluationRun.startedAt,
          completedAt: latestEvaluationRun.completedAt,
          summary: latestEvaluationRun.summary,
          failedCases: latestEvaluationRun.results.map((result) => ({
            caseKey: result.caseKey,
            caseLabel: result.caseLabel,
            category: result.category,
            score: result.score,
            failureState: normalizeFailureStateLabel(result.failureState),
            notes: result.notes,
          })),
        }
      : null,
  };
}
