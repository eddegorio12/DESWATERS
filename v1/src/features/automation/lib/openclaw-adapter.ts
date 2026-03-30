import { type Prisma } from "@prisma/client";

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

// EH16 V1 keeps OpenClaw behind a server-side boundary.
// This adapter intentionally returns null until a real integration is approved.
export async function runOpenClawFollowUpTriage(
  _candidates: FollowUpTriageCandidate[]
): Promise<OpenClawFollowUpProposal[] | null> {
  return null;
}
