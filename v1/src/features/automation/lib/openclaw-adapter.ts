import { type Prisma } from "@prisma/client";
import { z } from "zod";

import {
  createOpenClawStructuredCompletion,
  isOpenClawGatewayConfigured,
} from "@/features/automation/lib/openclaw-gateway";

export type FollowUpTriageCandidate = {
  billId: string;
  customerId: string;
  customerName: string;
  accountNumber: string;
  billingPeriod: string;
  queueFocus:
    | "NEEDS_REMINDER"
    | "NEEDS_FINAL_NOTICE"
    | "READY_FOR_DISCONNECTION"
    | "DISCONNECTED_HOLD"
    | "MONITORING";
  followUpStatus: string;
  customerStatus: string;
  daysPastDue: number;
  outstandingBalance: number;
};

export type OpenClawFollowUpProposal = {
  billId: string;
  rank: number;
  summary: string;
  recommendedReviewStep: string;
  rationale: string;
  confidenceLabel: "high" | "medium" | "caution";
  sourceMetadata: Prisma.JsonObject;
};

export type ExceptionSummaryCandidate = {
  alertId: string;
  severity: "critical" | "high" | "medium";
  category:
    | "missing_reading"
    | "possible_leak"
    | "abnormal_consumption"
    | "duplicate_payment"
    | "nearing_disconnection"
    | "service_status_mismatch";
  title: string;
  summary: string;
  accountNumber?: string;
  customerName?: string;
  meterNumber?: string;
  href: string;
  metric: string;
};

export type OpenClawExceptionSummaryProposal = {
  alertId: string;
  rank: number;
  summary: string;
  recommendedReviewStep: string;
  rationale: string;
  confidenceLabel: "high" | "medium" | "caution";
  sourceMetadata: Prisma.JsonObject;
};

type OpenClawAttemptState = {
  lastFailureReason: string | null;
};

type TelegramCashierCandidateBill = {
  billId: string;
  customerName: string;
  accountNumber: string;
  billingPeriod: string;
  outstandingBalance: number;
};

const followUpProposalSchema = z.object({
  proposals: z
    .array(
      z
        .object({
        billId: z.string().min(1),
          summary: z.string().min(1).optional(),
          recommendedReviewStep: z.string().min(1).optional(),
          rationale: z.string().min(1).optional(),
          confidenceLabel: z.enum(["high", "medium", "caution"]).optional(),
        })
        .passthrough()
    )
    .max(8),
});

const exceptionProposalSchema = z.object({
  proposals: z
    .array(
      z
        .object({
        alertId: z.string().min(1),
          summary: z.string().min(1).optional(),
          recommendedReviewStep: z.string().min(1).optional(),
          rationale: z.string().min(1).optional(),
          confidenceLabel: z.enum(["high", "medium", "caution"]).optional(),
        })
        .passthrough()
    )
    .max(8),
});

const telegramPaymentDetailsSchema = z.object({
  unsupportedMethod: z.boolean(),
  amount: z.number().positive().nullable(),
  accountNumber: z.string().min(1).nullable(),
  payerQuery: z.string().min(1).nullable(),
});

const telegramBillSelectionSchema = z.object({
  selection: z.number().int().positive().nullable(),
});

const telegramConfirmationSchema = z.object({
  confirmed: z.boolean(),
});

const openClawAttemptState: OpenClawAttemptState = {
  lastFailureReason: null,
};

function shouldUseOpenClaw() {
  return isOpenClawGatewayConfigured();
}

function setLastFailureReason(reason: string | null) {
  openClawAttemptState.lastFailureReason = reason;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown OpenClaw failure.";
}

export function getLastOpenClawFailureReason() {
  return openClawAttemptState.lastFailureReason;
}

function toJson<T>(value: T) {
  return JSON.stringify(value, null, 2);
}

function getFallbackFollowUpSummary(candidate: FollowUpTriageCandidate) {
  switch (candidate.followUpStatus) {
    case "DISCONNECTION_REVIEW":
      return `${candidate.customerName} remains a high-priority review item because the account is already in disconnection review with an unpaid balance.`;
    case "FINAL_NOTICE_SENT":
      return `${candidate.customerName} needs escalation review because a final notice is already on file and the balance is still open.`;
    case "REMINDER_SENT":
      return `${candidate.customerName} should be reviewed for the next receivables step because reminder handling is already on record and the bill remains unpaid.`;
    case "CURRENT":
      return candidate.queueFocus === "DISCONNECTED_HOLD"
        ? `${candidate.customerName} needs hold-state review because service is disconnected while the bill still carries an unpaid balance.`
        : `${candidate.customerName} should be reviewed for reminder handling because the bill is overdue and still at the current follow-up stage.`;
    default:
      return `${candidate.customerName} remains in monitoring based on the visible follow-up and balance signals.`;
  }
}

function getFallbackFollowUpReviewStep(candidate: FollowUpTriageCandidate) {
  switch (candidate.followUpStatus) {
    case "DISCONNECTION_REVIEW":
      return "Review whether the account should stay at disconnection readiness or needs a human check first.";
    case "FINAL_NOTICE_SENT":
      return "Review whether the final notice has aged enough for disconnection readiness or still needs a human follow-up check.";
    case "REMINDER_SENT":
      return "Review whether the balance now justifies a final notice step.";
    case "CURRENT":
      return candidate.queueFocus === "DISCONNECTED_HOLD"
        ? "Review whether the disconnected account should remain on hold pending balance clearance or separate staff handling."
        : "Review whether a first reminder should be logged next.";
    default:
      return "Keep the account in monitoring unless another visible signal changes priority.";
  }
}

function getFallbackFollowUpRationale(candidate: FollowUpTriageCandidate) {
  const basis = [
    `${candidate.daysPastDue} day${candidate.daysPastDue === 1 ? "" : "s"} past due`,
    `balance ${candidate.outstandingBalance.toFixed(2)}`,
    `follow-up ${candidate.followUpStatus.replaceAll("_", " ").toLowerCase()}`,
  ];

  if (candidate.customerStatus === "DISCONNECTED") {
    basis.push("customer already disconnected");
  }

  if (candidate.queueFocus !== "MONITORING") {
    basis.push(`queue focus ${candidate.queueFocus.replaceAll("_", " ").toLowerCase()}`);
  }

  return `Billing period ${candidate.billingPeriod} for account ${candidate.accountNumber}. Ranking basis: ${basis.join(", ")}.`;
}

function getFallbackFollowUpConfidence(candidate: FollowUpTriageCandidate) {
  if (
    candidate.followUpStatus === "DISCONNECTION_REVIEW" ||
    candidate.customerStatus === "DISCONNECTED" ||
    candidate.daysPastDue >= 60
  ) {
    return "high" as const;
  }

  if (
    candidate.followUpStatus === "FINAL_NOTICE_SENT" ||
    candidate.queueFocus === "NEEDS_FINAL_NOTICE" ||
    candidate.daysPastDue >= 30
  ) {
    return "medium" as const;
  }

  return "caution" as const;
}

function getFallbackExceptionSummary(candidate: ExceptionSummaryCandidate) {
  if (candidate.customerName) {
    return `${candidate.customerName} should stay near the top of exception review because ${candidate.summary.charAt(0).toLowerCase()}${candidate.summary.slice(1)}`;
  }

  return `${candidate.title} should stay visible because ${candidate.summary.charAt(0).toLowerCase()}${candidate.summary.slice(1)}`;
}

function getFallbackExceptionReviewStep(candidate: ExceptionSummaryCandidate) {
  switch (candidate.category) {
    case "possible_leak":
      return "Review the latest reading history first, then decide whether the account needs field validation or a complaint follow-up.";
    case "service_status_mismatch":
      return "Review the latest field and office records together before any staff change is made in follow-up, meter, or work-order workflows.";
    case "nearing_disconnection":
      return "Review whether the receivables case should move through the existing follow-up controls before the next service-action window is missed.";
    case "duplicate_payment":
      return "Review the payment history and receipt trail before the posting is treated as final.";
    case "missing_reading":
      return "Review the reading queue and route coverage before the next billing cycle slips.";
    case "abnormal_consumption":
      return "Review the latest reading pattern and prior baseline before deciding whether the anomaly needs correction or field follow-up.";
    default:
      return "Review the linked module before acting on the alert.";
  }
}

function getFallbackExceptionRationale(candidate: ExceptionSummaryCandidate) {
  const basis = [
    `severity ${candidate.severity}`,
    `category ${candidate.category.replaceAll("_", " ")}`,
    `metric ${candidate.metric}`,
  ];

  if (candidate.accountNumber) {
    basis.push(`account ${candidate.accountNumber}`);
  }

  if (candidate.meterNumber) {
    basis.push(`meter ${candidate.meterNumber}`);
  }

  return `Linked module ${candidate.href}. Ranking basis: ${basis.join(", ")}.`;
}

function getFallbackExceptionConfidence(candidate: ExceptionSummaryCandidate) {
  if (candidate.severity === "critical") {
    return "high" as const;
  }

  if (candidate.severity === "high") {
    return "medium" as const;
  }

  return "caution" as const;
}

export async function runOpenClawFollowUpTriage(
  candidates: FollowUpTriageCandidate[]
): Promise<OpenClawFollowUpProposal[] | null> {
  if (!shouldUseOpenClaw() || !candidates.length) {
    setLastFailureReason(null);
    return null;
  }

  const candidateMap = new Map(candidates.map((candidate) => [candidate.billId, candidate]));

  try {
    setLastFailureReason(null);
    const result = await createOpenClawStructuredCompletion({
      schema: followUpProposalSchema,
      systemPrompt:
        "You are the bounded DWDS follow-up planner. Rank only the provided overdue follow-up candidates. Return strict JSON with a top-level 'proposals' array and no markdown. Never invent bill IDs or actions outside review guidance.",
      userPrompt: [
        "Rank the highest-priority follow-up review items.",
        "Favor disconnection readiness first, disconnected hold review second, final notice candidates third, reminder candidates fourth, and monitoring last.",
        "Use only the provided fields.",
        "",
        toJson(candidates),
      ].join("\n"),
      maxTokens: 1_200,
      temperature: 0.1,
      user: "dwds-follow-up-triage",
    });

    const proposals = result.data.proposals
      .filter((proposal, index, list) => {
        return (
          candidateMap.has(proposal.billId) &&
          list.findIndex((entry) => entry.billId === proposal.billId) === index
        );
      })
      .slice(0, 8)
      .map((proposal, index) => {
        const candidate = candidateMap.get(proposal.billId)!;

        return {
          billId: proposal.billId,
          rank: index + 1,
          summary: proposal.summary ?? getFallbackFollowUpSummary(candidate),
          recommendedReviewStep:
            proposal.recommendedReviewStep ?? getFallbackFollowUpReviewStep(candidate),
          rationale: proposal.rationale ?? getFallbackFollowUpRationale(candidate),
          confidenceLabel:
            proposal.confidenceLabel ?? getFallbackFollowUpConfidence(candidate),
          sourceMetadata: {
            source: "openclaw-follow-up-planner-v1",
            provider: "OPENCLAW_GATEWAY",
            model: result.model,
            normalizedFromRankingOnly:
              !proposal.summary ||
              !proposal.recommendedReviewStep ||
              !proposal.rationale ||
              !proposal.confidenceLabel,
            queueFocus: candidate.queueFocus,
            followUpStatus: candidate.followUpStatus,
            customerStatus: candidate.customerStatus,
            billingPeriod: candidate.billingPeriod,
            daysPastDue: candidate.daysPastDue,
            outstandingBalance: candidate.outstandingBalance,
          },
        };
      });

    return proposals.length ? proposals : null;
  } catch (error) {
    setLastFailureReason(getErrorMessage(error));
    return null;
  }
}

export async function runOpenClawExceptionSummarization(
  candidates: ExceptionSummaryCandidate[]
): Promise<OpenClawExceptionSummaryProposal[] | null> {
  if (!shouldUseOpenClaw() || !candidates.length) {
    setLastFailureReason(null);
    return null;
  }

  const candidateMap = new Map(candidates.map((candidate) => [candidate.alertId, candidate]));

  try {
    setLastFailureReason(null);
    const result = await createOpenClawStructuredCompletion({
      schema: exceptionProposalSchema,
      systemPrompt:
        "You are the bounded DWDS exceptions planner. Rank only the provided operational alerts. Return strict JSON with a top-level 'proposals' array and no markdown. Never invent alert IDs or field actions.",
      userPrompt: [
        "Rank the highest-priority exception review items.",
        "Favor critical and high-severity utility risks first, and keep the rationale tied to visible metrics and linked modules.",
        "",
        toJson(candidates),
      ].join("\n"),
      maxTokens: 1_200,
      temperature: 0.1,
      user: "dwds-exception-summarization",
    });

    const proposals = result.data.proposals
      .filter((proposal, index, list) => {
        return (
          candidateMap.has(proposal.alertId) &&
          list.findIndex((entry) => entry.alertId === proposal.alertId) === index
        );
      })
      .slice(0, 8)
      .map((proposal, index) => {
        const candidate = candidateMap.get(proposal.alertId)!;

        return {
          alertId: proposal.alertId,
          rank: index + 1,
          summary: proposal.summary ?? getFallbackExceptionSummary(candidate),
          recommendedReviewStep:
            proposal.recommendedReviewStep ?? getFallbackExceptionReviewStep(candidate),
          rationale: proposal.rationale ?? getFallbackExceptionRationale(candidate),
          confidenceLabel:
            proposal.confidenceLabel ?? getFallbackExceptionConfidence(candidate),
          sourceMetadata: {
            source: "openclaw-exception-planner-v1",
            provider: "OPENCLAW_GATEWAY",
            model: result.model,
            normalizedFromRankingOnly:
              !proposal.summary ||
              !proposal.recommendedReviewStep ||
              !proposal.rationale ||
              !proposal.confidenceLabel,
            severity: candidate.severity,
            category: candidate.category,
            href: candidate.href,
            metric: candidate.metric,
            accountNumber: candidate.accountNumber ?? null,
            meterNumber: candidate.meterNumber ?? null,
          },
        };
      });

    return proposals.length ? proposals : null;
  } catch (error) {
    setLastFailureReason(getErrorMessage(error));
    return null;
  }
}

export async function runOpenClawTelegramPaymentDetailsParsing(input: {
  messageText: string;
}) {
  if (!shouldUseOpenClaw()) {
    setLastFailureReason(null);
    return null;
  }

  try {
    setLastFailureReason(null);
    const result = await createOpenClawStructuredCompletion({
      schema: telegramPaymentDetailsSchema,
      systemPrompt:
        "You are the bounded DWDS Telegram cashier planner. Extract only structured payment-intake details from one cashier message. Return strict JSON and do not invent missing values.",
      userPrompt: [
        "Interpret this cashier message.",
        "Mark unsupportedMethod true when the message requests GCash, Maya, bank transfer, wallet, or card settlement.",
        "Return amount as a number when present. Keep accountNumber null unless one is explicit. Keep payerQuery short and useful for customer or billing matching.",
        "",
        input.messageText,
      ].join("\n"),
      maxTokens: 220,
      temperature: 0,
      user: "dwds-telegram-cashier-payment-details",
    });

    return result.data;
  } catch (error) {
    setLastFailureReason(getErrorMessage(error));
    return null;
  }
}

export async function runOpenClawTelegramBillSelection(input: {
  messageText: string;
  candidates: TelegramCashierCandidateBill[];
}) {
  if (!shouldUseOpenClaw() || !input.candidates.length) {
    setLastFailureReason(null);
    return null;
  }

  try {
    setLastFailureReason(null);
    const result = await createOpenClawStructuredCompletion({
      schema: telegramBillSelectionSchema,
      systemPrompt:
        "You are the bounded DWDS Telegram cashier planner. Interpret which numbered bill choice the cashier selected. Return strict JSON and never invent a selection when the message is unclear.",
      userPrompt: [
        "Select one numbered bill option if the message clearly points to it.",
        "Return the 1-based selection number or null if the choice is unclear.",
        "",
        `Cashier message: ${input.messageText}`,
        `Available options: ${toJson(input.candidates.map((candidate, index) => ({ selection: index + 1, ...candidate })))}`,
      ].join("\n"),
      maxTokens: 180,
      temperature: 0,
      user: "dwds-telegram-cashier-bill-selection",
    });

    return result.data;
  } catch (error) {
    setLastFailureReason(getErrorMessage(error));
    return null;
  }
}

export async function runOpenClawTelegramPartialConfirmation(input: {
  messageText: string;
}) {
  if (!shouldUseOpenClaw()) {
    setLastFailureReason(null);
    return null;
  }

  try {
    setLastFailureReason(null);
    const result = await createOpenClawStructuredCompletion({
      schema: telegramConfirmationSchema,
      systemPrompt:
        "You are the bounded DWDS Telegram cashier planner. Decide whether the cashier clearly confirmed a partial-payment prompt. Return strict JSON only.",
      userPrompt: `Cashier message: ${input.messageText}`,
      maxTokens: 120,
      temperature: 0,
      user: "dwds-telegram-cashier-partial-confirmation",
    });

    return result.data;
  } catch (error) {
    setLastFailureReason(getErrorMessage(error));
    return null;
  }
}

export async function runOpenClawTelegramCashReceiptConfirmation(input: {
  messageText: string;
}) {
  if (!shouldUseOpenClaw()) {
    setLastFailureReason(null);
    return null;
  }

  try {
    setLastFailureReason(null);
    const result = await createOpenClawStructuredCompletion({
      schema: telegramConfirmationSchema,
      systemPrompt:
        "You are the bounded DWDS Telegram cashier planner. Decide whether the cashier explicitly confirmed physical cash is already in hand. Return strict JSON only.",
      userPrompt: `Cashier message: ${input.messageText}`,
      maxTokens: 120,
      temperature: 0,
      user: "dwds-telegram-cashier-cash-confirmation",
    });

    return result.data;
  } catch (error) {
    setLastFailureReason(getErrorMessage(error));
    return null;
  }
}
