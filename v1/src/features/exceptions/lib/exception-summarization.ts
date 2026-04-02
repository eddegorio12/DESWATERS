import {
  getLastOpenClawFailureReason,
  type ExceptionSummaryCandidate,
  runOpenClawExceptionSummarization,
} from "@/features/automation/lib/openclaw-adapter";
import type { ExceptionAlert } from "@/features/exceptions/lib/monitoring";

const severityPriority: Record<ExceptionSummaryCandidate["severity"], number> = {
  critical: 0,
  high: 1,
  medium: 2,
};

const categoryPriority: Record<ExceptionSummaryCandidate["category"], number> = {
  possible_leak: 0,
  service_status_mismatch: 1,
  nearing_disconnection: 2,
  duplicate_payment: 3,
  missing_reading: 4,
  abnormal_consumption: 5,
};

function getCandidatePriorityScore(candidate: ExceptionSummaryCandidate) {
  const severityWeight = (3 - severityPriority[candidate.severity]) * 10_000;
  const categoryWeight = (6 - categoryPriority[candidate.category]) * 1_000;

  return severityWeight + categoryWeight;
}

function getRecommendedReviewStep(candidate: ExceptionSummaryCandidate) {
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

function getConfidenceLabel(candidate: ExceptionSummaryCandidate) {
  if (candidate.severity === "critical") {
    return "high" as const;
  }

  if (candidate.severity === "high") {
    return "medium" as const;
  }

  return "caution" as const;
}

function getSummary(candidate: ExceptionSummaryCandidate) {
  if (candidate.customerName) {
    return `${candidate.customerName} should stay near the top of exception review because ${candidate.summary.charAt(0).toLowerCase()}${candidate.summary.slice(1)}`;
  }

  return `${candidate.title} should stay visible because ${candidate.summary.charAt(0).toLowerCase()}${candidate.summary.slice(1)}`;
}

function getRationale(candidate: ExceptionSummaryCandidate) {
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

function fallbackSummarization(
  candidates: ExceptionSummaryCandidate[],
  openClawFailureReason?: string | null
) {
  return [...candidates]
    .sort((left, right) => getCandidatePriorityScore(right) - getCandidatePriorityScore(left))
    .slice(0, 8)
    .map((candidate, index) => ({
      alertId: candidate.alertId,
      rank: index + 1,
      summary: getSummary(candidate),
      recommendedReviewStep: getRecommendedReviewStep(candidate),
      rationale: getRationale(candidate),
      confidenceLabel: getConfidenceLabel(candidate),
      sourceMetadata: {
        source: "dwds-exception-summary-heuristic-v1",
        provider: "DWDS_INTERNAL",
        model: "exception-summary-heuristic-v1",
        openClawFailureReason: openClawFailureReason ?? null,
        severity: candidate.severity,
        category: candidate.category,
        href: candidate.href,
        metric: candidate.metric,
        accountNumber: candidate.accountNumber ?? null,
        meterNumber: candidate.meterNumber ?? null,
      },
    }));
}

export function buildExceptionSummaryCandidates(alerts: ExceptionAlert[]): ExceptionSummaryCandidate[] {
  return alerts.map((alert) => ({
    alertId: alert.id,
    severity: alert.severity,
    category: alert.category,
    title: alert.title,
    summary: alert.summary,
    accountNumber: alert.accountNumber,
    customerName: alert.customerName,
    meterNumber: alert.meterNumber,
    href: alert.href,
    metric: alert.metric,
  }));
}

export async function generateExceptionSummaryProposals(candidates: ExceptionSummaryCandidate[]) {
  const openClawResult = await runOpenClawExceptionSummarization(candidates);

  if (openClawResult?.length) {
    return openClawResult;
  }

  return fallbackSummarization(candidates, getLastOpenClawFailureReason());
}
