import {
  getLastOpenClawFailureReason,
  type FollowUpTriageCandidate,
  runOpenClawFollowUpTriage,
} from "@/features/automation/lib/openclaw-adapter";

const focusPriority: Record<FollowUpTriageCandidate["queueFocus"], number> = {
  READY_FOR_DISCONNECTION: 0,
  DISCONNECTED_HOLD: 1,
  NEEDS_FINAL_NOTICE: 2,
  NEEDS_REMINDER: 3,
  MONITORING: 4,
};

function getPriorityScore(candidate: FollowUpTriageCandidate) {
  const focusWeight = (4 - focusPriority[candidate.queueFocus]) * 10_000;
  const daysWeight = Math.min(candidate.daysPastDue, 180) * 100;
  const balanceWeight = Math.round(candidate.outstandingBalance);
  const disconnectedBonus = candidate.customerStatus === "DISCONNECTED" ? 5_000 : 0;

  return focusWeight + disconnectedBonus + daysWeight + balanceWeight;
}

function getRecommendedReviewStep(candidate: FollowUpTriageCandidate) {
  switch (candidate.followUpStatus) {
    case "DISCONNECTION_REVIEW":
      return "Review whether the account should stay at disconnection readiness or needs a human check first.";
    case "FINAL_NOTICE_SENT":
      return "Review whether the final notice has aged enough for disconnection readiness or still needs a human follow-up check.";
    case "REMINDER_SENT":
      return "Review whether the balance now justifies a final notice step.";
    case "CURRENT":
      if (candidate.queueFocus === "NEEDS_REMINDER") {
        return "Review whether a first reminder should be logged next.";
      }

      if (candidate.queueFocus === "DISCONNECTED_HOLD") {
        return "Review whether the disconnected account should remain on hold pending balance clearance or separate staff handling.";
      }

      return "Review whether a first reminder should be logged next.";
    default:
      return "Keep the account in monitoring unless another visible signal changes priority.";
  }
}

function getConfidenceLabel(candidate: FollowUpTriageCandidate) {
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

function getSummary(candidate: FollowUpTriageCandidate) {
  switch (candidate.followUpStatus) {
    case "DISCONNECTION_REVIEW":
      return `${candidate.customerName} should stay near the top of staff review because the account is already in disconnection review and the overdue balance is still open.`;
    case "FINAL_NOTICE_SENT":
      return `${candidate.customerName} is nearing the end of the receivables ladder because a final notice is already on record and the bill still needs staff judgment.`;
    case "REMINDER_SENT":
      return `${candidate.customerName} is ready for another escalation check because reminder handling is already on record and the overdue balance remains open.`;
    case "CURRENT":
      if (candidate.queueFocus === "DISCONNECTED_HOLD") {
        return `${candidate.customerName} needs hold-state review because service is already disconnected while the unpaid bill still needs staff monitoring.`;
      }

      return `${candidate.customerName} should be checked for first reminder handling because the account is overdue and still at the current follow-up stage.`;
    default:
      return `${candidate.customerName} can stay in monitoring because the visible account state does not show a stronger escalation trigger yet.`;
  }
}

function getRationale(candidate: FollowUpTriageCandidate) {
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

  return [
    `Billing period ${candidate.billingPeriod} for account ${candidate.accountNumber}.`,
    `Ranking basis: ${basis.join(", ")}.`,
  ].join(" ");
}

function fallbackTriage(candidates: FollowUpTriageCandidate[], openClawFailureReason?: string | null) {
  return [...candidates]
    .sort((left, right) => {
      return getPriorityScore(right) - getPriorityScore(left);
    })
    .slice(0, 8)
    .map((candidate, index) => ({
      billId: candidate.billId,
      rank: index + 1,
      summary: getSummary(candidate),
      recommendedReviewStep: getRecommendedReviewStep(candidate),
      rationale: getRationale(candidate),
      confidenceLabel: getConfidenceLabel(candidate),
      sourceMetadata: {
        source: "dwds-follow-up-heuristic-v1",
        provider: "DWDS_INTERNAL",
        model: "follow-up-heuristic-v1",
        openClawFailureReason: openClawFailureReason ?? null,
        queueFocus: candidate.queueFocus,
        followUpStatus: candidate.followUpStatus,
        customerStatus: candidate.customerStatus,
        billingPeriod: candidate.billingPeriod,
        daysPastDue: candidate.daysPastDue,
        outstandingBalance: candidate.outstandingBalance,
      },
    }));
}

export async function generateFollowUpTriageProposals(candidates: FollowUpTriageCandidate[]) {
  const openClawResult = await runOpenClawFollowUpTriage(candidates);

  if (openClawResult?.length) {
    return openClawResult;
  }

  return fallbackTriage(candidates, getLastOpenClawFailureReason());
}
