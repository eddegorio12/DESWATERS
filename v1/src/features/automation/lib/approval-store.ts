import {
  AutomationApprovalStatus,
  AutomationApprovalTransport,
  AutomationExecutionStatus,
  AutomationFailureCategory,
  type AutomationActionType,
  Prisma,
  TelegramCashierSessionStage,
  TelegramConversationStatus,
} from "@prisma/client";

import { advanceReceivableFollowUp } from "@/features/follow-up/lib/follow-up-operations";
import { recordPaymentForActor } from "@/features/payments/lib/payment-recording";
import { prisma } from "@/lib/prisma";

import { createApprovalToken, verifyApprovalToken } from "./approval-tokens";
import {
  AUTOMATION_APPROVAL_MAX_RETRY_COUNT,
  getAutomationApprovalExpiry,
  hasDateExpired,
} from "./automation-policy";
import { sendTelegramApprovalMessage, sendTelegramTextMessage } from "./telegram-transport";

type FollowUpApprovalIntent = {
  actionType:
    | "FOLLOW_UP_SEND_REMINDER"
    | "FOLLOW_UP_SEND_FINAL_NOTICE"
    | "FOLLOW_UP_ESCALATE_DISCONNECTION_REVIEW";
  nextStatus:
    | "REMINDER_SENT"
    | "FINAL_NOTICE_SENT"
    | "DISCONNECTION_REVIEW";
  actionLabel: string;
};

function getApprovalExpiry() {
  return getAutomationApprovalExpiry();
}

async function finalizeTelegramCashierSession(input: {
  approvalRequestId: string;
  status: TelegramConversationStatus;
  reply: string;
  completedPaymentId?: string | null;
}) {
  const session = await prisma.telegramCashierSession.findUnique({
    where: {
      approvalRequestId: input.approvalRequestId,
    },
    include: {
      staffIdentity: true,
    },
  });

  if (!session) {
    return;
  }

  await prisma.telegramCashierSession.update({
    where: {
      id: session.id,
    },
    data: {
      status: input.status,
      stage:
        input.status === TelegramConversationStatus.CANCELLED
          ? TelegramCashierSessionStage.CANCELLED
          : input.status === TelegramConversationStatus.EXPIRED
            ? TelegramCashierSessionStage.EXPIRED
            : TelegramCashierSessionStage.COMPLETED,
      lastBotReply: input.reply,
      completedAt:
        input.status === TelegramConversationStatus.COMPLETED ? new Date() : undefined,
      completedPaymentId: input.completedPaymentId ?? undefined,
      cancelledAt:
        input.status === TelegramConversationStatus.CANCELLED ? new Date() : undefined,
    },
  });

  if (session.staffIdentity.telegramChatId) {
    await sendTelegramTextMessage({
      chatId: session.staffIdentity.telegramChatId,
      text: input.reply,
    });
  }
}

function getFollowUpApprovalIntent(sourceMetadata: unknown): FollowUpApprovalIntent | null {
  if (!sourceMetadata || typeof sourceMetadata !== "object" || Array.isArray(sourceMetadata)) {
    return null;
  }

  const queueFocus = "queueFocus" in sourceMetadata ? sourceMetadata.queueFocus : null;
  const followUpStatus = "followUpStatus" in sourceMetadata ? sourceMetadata.followUpStatus : null;

  if (queueFocus === "NEEDS_REMINDER" && followUpStatus === "CURRENT") {
    return {
      actionType: "FOLLOW_UP_SEND_REMINDER",
      nextStatus: "REMINDER_SENT",
      actionLabel: "Log first reminder",
    };
  }

  if (queueFocus === "NEEDS_FINAL_NOTICE" && followUpStatus === "REMINDER_SENT") {
    return {
      actionType: "FOLLOW_UP_SEND_FINAL_NOTICE",
      nextStatus: "FINAL_NOTICE_SENT",
      actionLabel: "Log final notice",
    };
  }

  if (queueFocus === "READY_FOR_DISCONNECTION" && followUpStatus === "FINAL_NOTICE_SENT") {
    return {
      actionType: "FOLLOW_UP_ESCALATE_DISCONNECTION_REVIEW",
      nextStatus: "DISCONNECTION_REVIEW",
      actionLabel: "Escalate to disconnection review",
    };
  }

  return null;
}

function getApprovalActionLabel(actionType: AutomationActionType) {
  switch (actionType) {
    case "FOLLOW_UP_SEND_REMINDER":
      return "Log first reminder";
    case "FOLLOW_UP_SEND_FINAL_NOTICE":
      return "Log final notice";
    case "FOLLOW_UP_ESCALATE_DISCONNECTION_REVIEW":
      return "Escalate to disconnection review";
    case "PAYMENT_POST":
      return "Post cash payment";
    default:
      return String(actionType).replaceAll("_", " ");
  }
}

async function getApprovalTargetLabel(intent: {
  actionType: AutomationActionType;
  targetId: string;
}) {
  if (
    intent.actionType === "FOLLOW_UP_SEND_REMINDER" ||
    intent.actionType === "FOLLOW_UP_SEND_FINAL_NOTICE" ||
    intent.actionType === "FOLLOW_UP_ESCALATE_DISCONNECTION_REVIEW" ||
    intent.actionType === "PAYMENT_POST"
  ) {
    const bill = await prisma.bill.findUnique({
      where: {
        id: intent.targetId,
      },
      select: {
        billingPeriod: true,
        customer: {
          select: {
            name: true,
            accountNumber: true,
          },
        },
      },
    });

    if (bill) {
      return `${bill.customer.name} (${bill.customer.accountNumber}) | ${bill.billingPeriod}`;
    }
  }

  return `${intent.actionType.replaceAll("_", " ")} target ${intent.targetId}`;
}

async function deliverApprovalRequest(input: {
  approvalRequestId: string;
  token: string;
  summary: string;
  actionType: AutomationActionType;
  targetId: string;
  expiresAt: Date;
  requestedByName: string;
}) {
  return sendTelegramApprovalMessage({
    requestId: input.approvalRequestId,
    token: input.token,
    summary: input.summary,
    expiresAt: input.expiresAt,
    requestedByName: input.requestedByName,
    actionLabel: getApprovalActionLabel(input.actionType),
    targetLabel: await getApprovalTargetLabel({
      actionType: input.actionType,
      targetId: input.targetId,
    }),
  });
}

async function recordExecutionLog(input: {
  intentId: string;
  approvalRequestId: string;
  actionType: AutomationActionType;
  status: AutomationExecutionStatus;
  resultSummary: string;
  errorMessage?: string | null;
  failureCategory?: AutomationFailureCategory | null;
  latencyMs?: number | null;
  resultMetadata?: Prisma.JsonObject | null;
}) {
  return prisma.automationExecutionLog.create({
    data: {
      intentId: input.intentId,
      approvalRequestId: input.approvalRequestId,
      actionType: input.actionType,
      status: input.status,
      resultSummary: input.resultSummary,
      errorMessage: input.errorMessage ?? null,
      failureCategory: input.failureCategory ?? null,
      latencyMs: input.latencyMs ?? null,
      resultMetadata: input.resultMetadata ?? Prisma.JsonNull,
    },
  });
}

async function invalidateApprovalRequest(input: {
  approvalRequestId: string;
  intentId: string;
  actionType: AutomationActionType;
  decidedByLabel: string;
  reason: string;
}) {
  const now = new Date();

  await prisma.automationApprovalRequest.update({
    where: {
      id: input.approvalRequestId,
    },
    data: {
      status: AutomationApprovalStatus.INVALIDATED,
      decidedAt: now,
      decidedByLabel: input.decidedByLabel,
      invalidatedAt: now,
      invalidatedReason: input.reason,
    },
  });

  await recordExecutionLog({
    intentId: input.intentId,
    approvalRequestId: input.approvalRequestId,
    actionType: input.actionType,
    status: AutomationExecutionStatus.INVALIDATED,
    resultSummary: input.reason,
    failureCategory: AutomationFailureCategory.TARGET_STATE,
  });
}

async function validateIntentStillRunnable(input: {
  actionType: AutomationActionType;
  payload: unknown;
}) {
  if (
    input.actionType === "FOLLOW_UP_SEND_REMINDER" ||
    input.actionType === "FOLLOW_UP_SEND_FINAL_NOTICE" ||
    input.actionType === "FOLLOW_UP_ESCALATE_DISCONNECTION_REVIEW"
  ) {
    if (!input.payload || typeof input.payload !== "object" || Array.isArray(input.payload)) {
      return "The follow-up approval intent payload is invalid.";
    }

    const billId = "billId" in input.payload ? input.payload.billId : null;

    if (typeof billId !== "string") {
      return "The follow-up approval intent payload is incomplete.";
    }

    const bill = await prisma.bill.findUnique({
      where: {
        id: billId,
      },
      select: {
        followUpStatus: true,
        totalCharges: true,
        payments: {
          where: {
            status: "COMPLETED",
          },
          select: {
            amount: true,
          },
        },
      },
    });

    if (!bill) {
      return "The approved follow-up target no longer exists.";
    }

    const outstandingBalance = Math.max(
      0,
      bill.totalCharges - bill.payments.reduce((sum, payment) => sum + payment.amount, 0)
    );

    if (outstandingBalance <= 0) {
      return "The approved follow-up target is already settled, so the queued action was invalidated.";
    }

    const expectedStatus =
      input.actionType === "FOLLOW_UP_SEND_REMINDER"
        ? "CURRENT"
        : input.actionType === "FOLLOW_UP_SEND_FINAL_NOTICE"
          ? "REMINDER_SENT"
          : "FINAL_NOTICE_SENT";

    if (bill.followUpStatus !== expectedStatus) {
      return `The follow-up queue state moved to ${bill.followUpStatus.replaceAll("_", " ").toLowerCase()}, so the queued action was invalidated.`;
    }

    return null;
  }

  if (input.actionType === "PAYMENT_POST") {
    if (!input.payload || typeof input.payload !== "object" || Array.isArray(input.payload)) {
      return "The PAYMENT_POST intent payload is invalid.";
    }

    const billId = "billId" in input.payload ? input.payload.billId : null;
    const amount = "amount" in input.payload ? input.payload.amount : null;

    if (typeof billId !== "string" || typeof amount !== "number") {
      return "The PAYMENT_POST intent payload is incomplete.";
    }

    const bill = await prisma.bill.findUnique({
      where: {
        id: billId,
      },
      select: {
        totalCharges: true,
        payments: {
          where: {
            status: "COMPLETED",
          },
          select: {
            amount: true,
          },
        },
      },
    });

    if (!bill) {
      return "The approved payment target no longer exists.";
    }

    const outstandingBalance = Math.max(
      0,
      bill.totalCharges - bill.payments.reduce((sum, payment) => sum + payment.amount, 0)
    );

    if (outstandingBalance <= 0) {
      return "The bill is already settled, so the queued PAYMENT_POST intent was invalidated.";
    }

    if (amount - outstandingBalance > 0.000001) {
      return `The queued PAYMENT_POST amount now exceeds the remaining balance of ${outstandingBalance.toFixed(2)}.`;
    }

    return null;
  }

  return "That automation action type is not executable in the current automation lane.";
}

export async function requestTelegramApprovalForFollowUpProposal(input: {
  proposalId: string;
  requestedById: string;
  requestedByName: string;
}) {
  const proposal = await prisma.automationProposal.findUnique({
    where: {
      id: input.proposalId,
    },
    select: {
      id: true,
      summary: true,
      rationale: true,
      targetId: true,
      sourceMetadata: true,
      dismissedAt: true,
      run: {
        select: {
          workerType: true,
        },
      },
      actionIntents: {
        orderBy: [{ createdAt: "desc" }],
        take: 1,
        select: {
          approvalRequests: {
            orderBy: [{ createdAt: "desc" }],
            take: 1,
            select: {
              status: true,
            },
          },
        },
      },
    },
  });

  if (!proposal || proposal.run.workerType !== "FOLLOW_UP_TRIAGE") {
    throw new Error("That follow-up proposal no longer exists.");
  }

  if (proposal.dismissedAt) {
    throw new Error("Dismissed proposals cannot be sent for approval.");
  }

  const intentConfig = getFollowUpApprovalIntent(proposal.sourceMetadata);

  if (!intentConfig) {
    throw new Error("This proposal does not map to an exact EH17-approved action intent yet.");
  }

  const latestRequest = proposal.actionIntents[0]?.approvalRequests[0];

  if (
    latestRequest &&
    (latestRequest.status === AutomationApprovalStatus.PENDING ||
      latestRequest.status === AutomationApprovalStatus.APPROVED ||
      latestRequest.status === AutomationApprovalStatus.EXECUTED)
  ) {
    throw new Error("An approval request already exists for this proposal.");
  }

  const expiresAt = getApprovalExpiry();
  const { token, tokenHash } = createApprovalToken();

  const approvalRequest = await prisma.$transaction(async (tx) => {
    const intent = await tx.automationActionIntent.create({
      data: {
        proposalId: proposal.id,
        workerType: "FOLLOW_UP_TRIAGE",
        actionType: intentConfig.actionType,
        targetType: "BILL",
        targetId: proposal.targetId,
        summary: proposal.summary,
        rationale: proposal.rationale,
        payload: {
          billId: proposal.targetId,
          nextStatus: intentConfig.nextStatus,
        },
        createdById: input.requestedById,
      },
    });

    return tx.automationApprovalRequest.create({
      data: {
        intentId: intent.id,
        transport: AutomationApprovalTransport.TELEGRAM,
        callbackTokenHash: tokenHash,
        requestedById: input.requestedById,
        expiresAt,
      },
      include: {
        intent: true,
      },
    });
  });

  const targetLabel = await getApprovalTargetLabel({
    actionType: approvalRequest.intent.actionType,
    targetId: approvalRequest.intent.targetId,
  });
  const delivery = await sendTelegramApprovalMessage({
    requestId: approvalRequest.id,
    token,
    summary: proposal.summary,
    expiresAt,
    requestedByName: input.requestedByName,
    actionLabel: intentConfig.actionLabel,
    targetLabel,
  });

  const updatedRequest = await prisma.automationApprovalRequest.update({
    where: {
      id: approvalRequest.id,
    },
    data: delivery.ok
      ? {
          transportMessageId: delivery.messageId,
          lastDeliveredAt: delivery.deliveredAt,
          deliveryError: null,
        }
      : {
          deliveryError: delivery.errorMessage,
        },
    include: {
      intent: true,
    },
  });

  return {
    request: updatedRequest,
    delivery,
  };
}

export async function requestTelegramApprovalForPaymentSession(input: {
  sessionId: string;
  requestedById: string;
  requestedByName: string;
  paymentDraft?: {
    amount: number | null;
    billId: string | null;
    partialConfirmed: boolean;
    cashReceivedConfirmed: boolean;
  };
}) {
  const session = await prisma.telegramCashierSession.findUnique({
    where: {
      id: input.sessionId,
    },
    include: {
      staffIdentity: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              isActive: true,
            },
          },
        },
      },
    },
  });

  if (!session || session.actionType !== "PAYMENT_POST") {
    throw new Error("That Telegram cashier session no longer exists.");
  }

  if (session.status !== TelegramConversationStatus.ACTIVE) {
    throw new Error("That Telegram cashier session is already closed.");
  }

  const latestRequest = session.approvalRequestId
    ? await prisma.automationApprovalRequest.findUnique({
        where: {
          id: session.approvalRequestId,
        },
        select: {
          status: true,
        },
      })
    : null;

  if (
    latestRequest &&
    (latestRequest.status === AutomationApprovalStatus.PENDING ||
      latestRequest.status === AutomationApprovalStatus.APPROVED ||
      latestRequest.status === AutomationApprovalStatus.EXECUTED)
  ) {
    throw new Error("A Telegram approval request already exists for this cashier session.");
  }

  const rawDraft =
    input.paymentDraft && typeof input.paymentDraft === "object"
      ? input.paymentDraft
      : session.parsedIntent &&
          typeof session.parsedIntent === "object" &&
          !Array.isArray(session.parsedIntent)
        ? (session.parsedIntent as Record<string, unknown>)
        : null;
  const amount = rawDraft && typeof rawDraft.amount === "number" ? rawDraft.amount : null;
  const billId = rawDraft && typeof rawDraft.billId === "string" ? rawDraft.billId : null;
  const partialConfirmed = rawDraft?.partialConfirmed === true;
  const cashReceivedConfirmed = rawDraft?.cashReceivedConfirmed === true;

  if (!amount || !billId) {
    throw new Error("The Telegram cashier session is missing the exact payment details.");
  }

  if (!cashReceivedConfirmed) {
    throw new Error("DWDS requires explicit cash-received confirmation before approval is sent.");
  }

  const bill = await prisma.bill.findUnique({
    where: {
      id: billId,
    },
    select: {
      id: true,
      billingPeriod: true,
      totalCharges: true,
      payments: {
        where: {
          status: "COMPLETED",
        },
        select: {
          amount: true,
        },
      },
      customer: {
        select: {
          name: true,
          accountNumber: true,
        },
      },
    },
  });

  if (!bill) {
    throw new Error("The selected bill no longer exists.");
  }

  const outstandingBalance = Math.max(
    0,
    bill.totalCharges - bill.payments.reduce((sum, payment) => sum + payment.amount, 0)
  );

  if (amount - outstandingBalance > 0.000001) {
    throw new Error(
      `Payment amount cannot exceed the remaining balance of ${outstandingBalance.toFixed(2)}.`
    );
  }

  if (amount + 0.000001 < outstandingBalance && !partialConfirmed) {
    throw new Error("Partial payments must be explicitly confirmed before approval is sent.");
  }

  const expiresAt = getApprovalExpiry();
  const { token, tokenHash } = createApprovalToken();
  const summary = `Post ${amount.toFixed(2)} cash payment for ${bill.customer.name} (${bill.customer.accountNumber}) on ${bill.billingPeriod}.`;

  const approvalRequest = await prisma.$transaction(async (tx) => {
    const intent = await tx.automationActionIntent.create({
      data: {
        workerType: null,
        actionType: "PAYMENT_POST",
        targetType: "BILL",
        targetId: bill.id,
        summary,
        rationale:
          "Telegram-originated cashier assistant intent with explicit cash receipt confirmation.",
        payload: {
          billId: bill.id,
          amount,
          method: "CASH",
          referenceId: null,
          sessionId: session.id,
        },
        createdById: input.requestedById,
      },
    });

    return tx.automationApprovalRequest.create({
      data: {
        intentId: intent.id,
        transport: AutomationApprovalTransport.TELEGRAM,
        callbackTokenHash: tokenHash,
        requestedById: input.requestedById,
        expiresAt,
      },
      include: {
        intent: true,
      },
    });
  });

  const delivery = await sendTelegramApprovalMessage({
    requestId: approvalRequest.id,
    token,
    summary,
    expiresAt,
    requestedByName: input.requestedByName,
    actionLabel: partialConfirmed ? "Post partial cash payment" : "Post cash payment",
    targetLabel: `${bill.customer.name} (${bill.customer.accountNumber}) | ${bill.billingPeriod}`,
  });

  const updatedRequest = await prisma.automationApprovalRequest.update({
    where: {
      id: approvalRequest.id,
    },
    data: delivery.ok
      ? {
          transportMessageId: delivery.messageId,
          lastDeliveredAt: delivery.deliveredAt,
          deliveryError: null,
        }
      : {
          deliveryError: delivery.errorMessage,
        },
    include: {
      intent: true,
    },
  });

  await prisma.telegramCashierSession.update({
    where: {
      id: session.id,
    },
    data: {
      approvalRequestId: updatedRequest.id,
    },
  });

  return {
    request: updatedRequest,
    delivery,
  };
}

export async function getApprovalRequestForDecision(input: {
  requestId: string;
  token: string;
}) {
  const approvalRequest = await prisma.automationApprovalRequest.findUnique({
    where: {
      id: input.requestId,
    },
    include: {
      intent: true,
    },
  });

  if (!approvalRequest) {
    return { ok: false as const, reason: "missing" as const };
  }

  if (!verifyApprovalToken(input.token, approvalRequest.callbackTokenHash)) {
    return { ok: false as const, reason: "invalid" as const };
  }

  return { ok: true as const, approvalRequest };
}

async function executeIntent(input: {
  intentId: string;
  approvalRequestId: string;
  actionType: AutomationActionType;
  payload: unknown;
  actorId: string;
}) {
  const startedAt = Date.now();

  if (
    input.actionType === "FOLLOW_UP_SEND_REMINDER" ||
    input.actionType === "FOLLOW_UP_SEND_FINAL_NOTICE" ||
    input.actionType === "FOLLOW_UP_ESCALATE_DISCONNECTION_REVIEW"
  ) {
    if (!input.payload || typeof input.payload !== "object" || Array.isArray(input.payload)) {
      throw new Error("The approval intent payload is invalid.");
    }

    const billId = "billId" in input.payload ? input.payload.billId : null;
    const nextStatus = "nextStatus" in input.payload ? input.payload.nextStatus : null;

    if (typeof billId !== "string" || typeof nextStatus !== "string") {
      throw new Error("The approval intent payload is incomplete.");
    }

    const executionResult = await advanceReceivableFollowUp({
      billId,
      nextStatus: nextStatus as
        | "REMINDER_SENT"
        | "FINAL_NOTICE_SENT"
        | "DISCONNECTION_REVIEW",
      actorId: input.actorId,
    });

    await recordExecutionLog({
      intentId: input.intentId,
      approvalRequestId: input.approvalRequestId,
      actionType: input.actionType,
      status: AutomationExecutionStatus.SUCCEEDED,
      resultSummary: `${executionResult.accountNumber} moved to ${executionResult.nextStatus.replaceAll("_", " ").toLowerCase()}.`,
      latencyMs: Date.now() - startedAt,
      resultMetadata: executionResult,
    });

    return executionResult;
  }

  if (input.actionType === "PAYMENT_POST") {
    if (!input.payload || typeof input.payload !== "object" || Array.isArray(input.payload)) {
      throw new Error("The payment-post intent payload is invalid.");
    }

    const billId = "billId" in input.payload ? input.payload.billId : null;
    const amount = "amount" in input.payload ? input.payload.amount : null;
    const method = "method" in input.payload ? input.payload.method : null;
    const referenceId = "referenceId" in input.payload ? input.payload.referenceId : null;
    const sessionId = "sessionId" in input.payload ? input.payload.sessionId : null;

    if (
      typeof billId !== "string" ||
      typeof amount !== "number" ||
      method !== "CASH" ||
      (referenceId !== null && typeof referenceId !== "string") ||
      (sessionId !== undefined && sessionId !== null && typeof sessionId !== "string")
    ) {
      throw new Error("The payment-post intent payload is incomplete.");
    }

    const payment = await recordPaymentForActor({
      actorId: input.actorId,
      billId,
      amount,
      method: "CASH",
      referenceId: referenceId ?? null,
    });

    if (sessionId) {
      await prisma.telegramCashierSession.update({
        where: {
          id: sessionId,
        },
        data: {
          completedPaymentId: payment.id,
        },
      });
    }

    await recordExecutionLog({
      intentId: input.intentId,
      approvalRequestId: input.approvalRequestId,
      actionType: input.actionType,
      status: AutomationExecutionStatus.SUCCEEDED,
      resultSummary: `Payment posted successfully with receipt ${payment.receiptNumber}.`,
      latencyMs: Date.now() - startedAt,
      resultMetadata: {
        paymentId: payment.id,
        receiptNumber: payment.receiptNumber,
        amount: payment.amount,
        balanceAfter: payment.balanceAfter,
        billId: payment.billId,
      },
    });

    return payment;
  }

  throw new Error("That automation action type is not executable in the current automation lane.");
}

export async function processApprovalDecision(input: {
  requestId: string;
  token: string;
  decision: "approve" | "reject";
  decidedByLabel: string;
}) {
  const resolved = await getApprovalRequestForDecision({
    requestId: input.requestId,
    token: input.token,
  });

  if (!resolved.ok) {
    return resolved;
  }

  const approvalRequest = resolved.approvalRequest;
  const now = new Date();

  if (approvalRequest.status === AutomationApprovalStatus.EXECUTED) {
    await recordExecutionLog({
      intentId: approvalRequest.intentId,
      approvalRequestId: approvalRequest.id,
      actionType: approvalRequest.intent.actionType,
      status: AutomationExecutionStatus.REPLAY_BLOCKED,
      resultSummary: "A replayed callback was blocked after execution.",
      failureCategory: AutomationFailureCategory.VALIDATION,
    });

    return { ok: false as const, reason: "replay" as const };
  }

  if (
    approvalRequest.status === AutomationApprovalStatus.APPROVED ||
    approvalRequest.status === AutomationApprovalStatus.REJECTED ||
    approvalRequest.status === AutomationApprovalStatus.EXPIRED ||
    approvalRequest.status === AutomationApprovalStatus.INVALIDATED
  ) {
    return { ok: false as const, reason: "closed" as const };
  }

  if (hasDateExpired(approvalRequest.expiresAt, now)) {
    await prisma.automationApprovalRequest.update({
      where: {
        id: approvalRequest.id,
      },
      data: {
        status: AutomationApprovalStatus.EXPIRED,
        decidedAt: now,
        decidedByLabel: input.decidedByLabel,
      },
    });

    await recordExecutionLog({
      intentId: approvalRequest.intentId,
      approvalRequestId: approvalRequest.id,
      actionType: approvalRequest.intent.actionType,
      status: AutomationExecutionStatus.EXPIRED,
      resultSummary: "The approval request expired before execution.",
      failureCategory: AutomationFailureCategory.VALIDATION,
    });

    if (approvalRequest.intent.actionType === "PAYMENT_POST") {
      await finalizeTelegramCashierSession({
        approvalRequestId: approvalRequest.id,
        status: TelegramConversationStatus.EXPIRED,
        reply: "The DWDS PAYMENT_POST approval request expired. No payment was posted.",
      });
    }

    return { ok: false as const, reason: "expired" as const };
  }

  if (input.decision === "approve") {
    const invalidationReason = await validateIntentStillRunnable({
      actionType: approvalRequest.intent.actionType,
      payload: approvalRequest.intent.payload,
    });

    if (invalidationReason) {
      await invalidateApprovalRequest({
        approvalRequestId: approvalRequest.id,
        intentId: approvalRequest.intentId,
        actionType: approvalRequest.intent.actionType,
        decidedByLabel: input.decidedByLabel,
        reason: invalidationReason,
      });

      if (approvalRequest.intent.actionType === "PAYMENT_POST") {
        await finalizeTelegramCashierSession({
          approvalRequestId: approvalRequest.id,
          status: TelegramConversationStatus.EXPIRED,
          reply: invalidationReason,
        });
      }

      return { ok: false as const, reason: "closed" as const };
    }
  }

  if (input.decision === "reject") {
    await prisma.automationApprovalRequest.update({
      where: {
        id: approvalRequest.id,
      },
      data: {
        status: AutomationApprovalStatus.REJECTED,
        decidedAt: now,
        decidedByLabel: input.decidedByLabel,
      },
    });

    await recordExecutionLog({
      intentId: approvalRequest.intentId,
      approvalRequestId: approvalRequest.id,
      actionType: approvalRequest.intent.actionType,
      status: AutomationExecutionStatus.REJECTED,
      resultSummary: "The approval request was rejected.",
      failureCategory: AutomationFailureCategory.VALIDATION,
    });

    if (approvalRequest.intent.actionType === "PAYMENT_POST") {
      await finalizeTelegramCashierSession({
        approvalRequestId: approvalRequest.id,
        status: TelegramConversationStatus.CANCELLED,
        reply: "The DWDS PAYMENT_POST request was rejected. No payment was posted.",
      });
    }

    return { ok: true as const, outcome: "rejected" as const };
  }

  await prisma.automationApprovalRequest.update({
    where: {
      id: approvalRequest.id,
    },
    data: {
      status: AutomationApprovalStatus.APPROVED,
      decidedAt: now,
      decidedByLabel: input.decidedByLabel,
    },
  });

  try {
    const executionResult = await executeIntent({
      intentId: approvalRequest.intentId,
      approvalRequestId: approvalRequest.id,
      actionType: approvalRequest.intent.actionType,
      payload: approvalRequest.intent.payload,
      actorId: approvalRequest.requestedById,
    });

    await prisma.automationApprovalRequest.update({
      where: {
        id: approvalRequest.id,
      },
      data: {
        status: AutomationApprovalStatus.EXECUTED,
        executedAt: new Date(),
      },
    });

    if (
      approvalRequest.intent.actionType === "PAYMENT_POST" &&
      executionResult &&
      typeof executionResult === "object" &&
      "receiptNumber" in executionResult &&
      "id" in executionResult &&
      typeof executionResult.receiptNumber === "string" &&
      typeof executionResult.id === "string"
    ) {
      await finalizeTelegramCashierSession({
        approvalRequestId: approvalRequest.id,
        status: TelegramConversationStatus.COMPLETED,
        completedPaymentId: executionResult.id,
        reply: `DWDS posted the payment successfully. Receipt ${executionResult.receiptNumber} is ready.`,
      });
    }

    return { ok: true as const, outcome: "executed" as const, executionResult };
  } catch (error) {
    await recordExecutionLog({
      intentId: approvalRequest.intentId,
      approvalRequestId: approvalRequest.id,
      actionType: approvalRequest.intent.actionType,
      status: AutomationExecutionStatus.FAILED,
      resultSummary: "The approved action failed during DWDS execution.",
      errorMessage: error instanceof Error ? error.message : "Unknown execution failure.",
      failureCategory: AutomationFailureCategory.INTERNAL,
    });

    if (approvalRequest.intent.actionType === "PAYMENT_POST") {
      await finalizeTelegramCashierSession({
        approvalRequestId: approvalRequest.id,
        status: TelegramConversationStatus.EXPIRED,
        reply:
          error instanceof Error
            ? `DWDS could not post the payment: ${error.message}`
            : "DWDS could not post the approved payment.",
      });
    }

    throw error;
  }
}

export async function retryTelegramApprovalRequestDelivery(input: {
  requestId: string;
  supervisorLabel: string;
}) {
  const approvalRequest = await prisma.automationApprovalRequest.findUnique({
    where: {
      id: input.requestId,
    },
    include: {
      intent: true,
      requestedBy: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!approvalRequest) {
    throw new Error("That automation approval request no longer exists.");
  }

  if (approvalRequest.transport !== AutomationApprovalTransport.TELEGRAM) {
    throw new Error("Only Telegram delivery retries are supported in the current automation lane.");
  }

  if (approvalRequest.status !== AutomationApprovalStatus.PENDING) {
    throw new Error("Only pending approval requests can be retried.");
  }

  if (hasDateExpired(approvalRequest.expiresAt)) {
    await prisma.automationApprovalRequest.update({
      where: {
        id: approvalRequest.id,
      },
      data: {
        status: AutomationApprovalStatus.EXPIRED,
        decidedAt: new Date(),
        decidedByLabel: input.supervisorLabel,
      },
    });

    await recordExecutionLog({
      intentId: approvalRequest.intentId,
      approvalRequestId: approvalRequest.id,
      actionType: approvalRequest.intent.actionType,
      status: AutomationExecutionStatus.EXPIRED,
      resultSummary: "The pending approval request expired before delivery retry could run.",
      failureCategory: AutomationFailureCategory.VALIDATION,
    });

    throw new Error("That approval request already expired.");
  }

  const { token, tokenHash } = createApprovalToken();
  const retryCount = approvalRequest.retryCount + 1;
  const startedAt = Date.now();
  const delivery = await deliverApprovalRequest({
    approvalRequestId: approvalRequest.id,
    token,
    summary: approvalRequest.intent.summary,
    actionType: approvalRequest.intent.actionType,
    targetId: approvalRequest.intent.targetId,
    expiresAt: approvalRequest.expiresAt,
    requestedByName: approvalRequest.requestedBy.name,
  });

  if (delivery.ok) {
    await prisma.automationApprovalRequest.update({
      where: {
        id: approvalRequest.id,
      },
      data: {
        callbackTokenHash: tokenHash,
        transportMessageId: delivery.messageId,
        lastDeliveredAt: delivery.deliveredAt,
        deliveryError: null,
        retryCount,
        lastRetriedAt: new Date(),
        deadLetteredAt: null,
        deadLetterReason: null,
      },
    });

    return {
      ok: true as const,
      retryCount,
    };
  }

  const now = new Date();
  const shouldDeadLetter = retryCount >= AUTOMATION_APPROVAL_MAX_RETRY_COUNT;
  const failureMessage =
    delivery.errorMessage ??
    "Telegram approval delivery failed before a response was received.";

  await prisma.automationApprovalRequest.update({
    where: {
      id: approvalRequest.id,
    },
    data: shouldDeadLetter
      ? {
          status: AutomationApprovalStatus.INVALIDATED,
          retryCount,
          lastRetriedAt: now,
          deliveryError: failureMessage,
          deadLetteredAt: now,
          deadLetterReason: `Telegram delivery failed after ${retryCount} attempts.`,
          invalidatedAt: now,
          invalidatedReason: `Telegram delivery failed after ${retryCount} attempts.`,
          decidedAt: now,
          decidedByLabel: input.supervisorLabel,
        }
      : {
          retryCount,
          lastRetriedAt: now,
          deliveryError: failureMessage,
        },
  });

  await recordExecutionLog({
    intentId: approvalRequest.intentId,
    approvalRequestId: approvalRequest.id,
    actionType: approvalRequest.intent.actionType,
    status: shouldDeadLetter
      ? AutomationExecutionStatus.DEAD_LETTERED
      : AutomationExecutionStatus.FAILED,
    resultSummary: shouldDeadLetter
      ? `Telegram delivery failed after ${retryCount} attempts.`
      : "Telegram delivery retry failed.",
    errorMessage: failureMessage,
    failureCategory: AutomationFailureCategory.DELIVERY,
    latencyMs: Date.now() - startedAt,
  });

  if (shouldDeadLetter && approvalRequest.intent.actionType === "PAYMENT_POST") {
    await finalizeTelegramCashierSession({
      approvalRequestId: approvalRequest.id,
      status: TelegramConversationStatus.EXPIRED,
      reply: `DWDS invalidated the PAYMENT_POST request after ${retryCount} failed Telegram delivery attempts.`,
    });
  }

  throw new Error(
    shouldDeadLetter
      ? `Telegram delivery failed ${retryCount} times and the request was dead-lettered.`
      : failureMessage
  );
}
