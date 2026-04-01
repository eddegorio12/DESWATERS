import {
  AutomationApprovalStatus,
  AutomationExecutionStatus,
  AutomationExecutionLog,
  AutomationApprovalRequest,
  BillStatus,
  PaymentMethod,
  Prisma,
  TelegramCashierSession,
  TelegramCashierSessionStage,
  TelegramConversationStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { requestTelegramApprovalForPaymentSession } from "./approval-store";

const SESSION_TTL_MS = 1000 * 60 * 20;
const MAX_CANDIDATES = 5;
const PAYMENT_METHOD: PaymentMethod = "CASH";

type TelegramMessageUpdate = {
  update_id?: number;
  message?: {
    message_id?: number;
    text?: string;
    chat?: { id?: number | string };
    from?: {
      id?: number | string;
      username?: string;
      first_name?: string;
      last_name?: string;
    };
  };
};

type CandidateBill = {
  billId: string;
  customerName: string;
  accountNumber: string;
  billingPeriod: string;
  outstandingBalance: number;
};

type PaymentIntentDraft = {
  amount: number | null;
  payerQuery: string | null;
  accountNumber: string | null;
  billId: string | null;
  candidateBills: CandidateBill[];
  partialConfirmed: boolean;
  cashReceivedConfirmed: boolean;
  paymentMethod: PaymentMethod;
};

function getSessionExpiry() {
  return new Date(Date.now() + SESSION_TTL_MS);
}

function createEmptyDraft(): PaymentIntentDraft {
  return {
    amount: null,
    payerQuery: null,
    accountNumber: null,
    billId: null,
    candidateBills: [],
    partialConfirmed: false,
    cashReceivedConfirmed: false,
    paymentMethod: PAYMENT_METHOD,
  };
}

function readDraft(value: Prisma.JsonValue | null): PaymentIntentDraft {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return createEmptyDraft();
  }

  const raw = value as Record<string, Prisma.JsonValue>;
  const candidateBills = Array.isArray(raw.candidateBills)
    ? raw.candidateBills.flatMap((entry) => {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
          return [];
        }

        const candidate = entry as Record<string, Prisma.JsonValue>;
        return typeof candidate.billId === "string" &&
          typeof candidate.customerName === "string" &&
          typeof candidate.accountNumber === "string" &&
          typeof candidate.billingPeriod === "string" &&
          typeof candidate.outstandingBalance === "number"
          ? [
              {
                billId: candidate.billId,
                customerName: candidate.customerName,
                accountNumber: candidate.accountNumber,
                billingPeriod: candidate.billingPeriod,
                outstandingBalance: candidate.outstandingBalance,
              },
            ]
          : [];
      })
    : [];

  return {
    amount: typeof raw.amount === "number" ? raw.amount : null,
    payerQuery: typeof raw.payerQuery === "string" ? raw.payerQuery : null,
    accountNumber: typeof raw.accountNumber === "string" ? raw.accountNumber : null,
    billId: typeof raw.billId === "string" ? raw.billId : null,
    candidateBills,
    partialConfirmed: raw.partialConfirmed === true,
    cashReceivedConfirmed: raw.cashReceivedConfirmed === true,
    paymentMethod: raw.paymentMethod === "CASH" ? "CASH" : PAYMENT_METHOD,
  };
}

function serializeDraft(draft: PaymentIntentDraft): Prisma.JsonObject {
  return {
    amount: draft.amount,
    payerQuery: draft.payerQuery,
    accountNumber: draft.accountNumber,
    billId: draft.billId,
    candidateBills: draft.candidateBills.map((candidate) => ({
      billId: candidate.billId,
      customerName: candidate.customerName,
      accountNumber: candidate.accountNumber,
      billingPeriod: candidate.billingPeriod,
      outstandingBalance: candidate.outstandingBalance,
    })),
    partialConfirmed: draft.partialConfirmed,
    cashReceivedConfirmed: draft.cashReceivedConfirmed,
    paymentMethod: draft.paymentMethod,
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value);
}

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function parseAmount(text: string) {
  const currencyMatch = text.match(/(?:php|p|₱)\s*([\d,]+(?:\.\d{1,2})?)/i);

  if (currencyMatch) {
    return Number(currencyMatch[1].replaceAll(",", ""));
  }

  const fallbackMatches = [...text.matchAll(/\b\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?\b/g)].map(
    (match) => Number(match[0].replaceAll(",", ""))
  );
  const validMatches = fallbackMatches.filter((value) => Number.isFinite(value) && value > 0);

  return validMatches.length > 0 ? validMatches.sort((left, right) => right - left)[0] : null;
}

function parseAccountNumber(text: string) {
  const match = text.match(/\b[A-Za-z0-9]+(?:-[A-Za-z0-9]+)+\b/);
  return match ? match[0].toUpperCase() : null;
}

function parsePayerQuery(text: string, accountNumber: string | null) {
  const withoutAmount = text
    .replace(/(?:php|p|₱)\s*[\d,]+(?:\.\d{1,2})?/gi, " ")
    .replace(/\b\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?\b/g, " ");
  const withoutAccount = accountNumber
    ? withoutAmount.replace(new RegExp(accountNumber.replaceAll("-", "\\-"), "ig"), " ")
    : withoutAmount;
  const cleaned = withoutAccount
    .replace(/\b(pay|payment|received|cash|from|for|bill|account|acct|acc|customer)\b/gi, " ")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ");
  const normalized = normalizeText(cleaned);

  return normalized.length >= 2 ? normalized : null;
}

function isAffirmative(text: string) {
  return /^(yes|y|confirm|confirmed|ok|okay|go)$/i.test(text.trim());
}

function isReceivedConfirmation(text: string) {
  return /^(received|cash received|confirm received|yes received)$/i.test(text.trim());
}

function isUnsupportedMethod(text: string) {
  return /\b(gcash|maya|bank|transfer|card|wallet)\b/i.test(text);
}

function buildCandidateLabel(candidate: CandidateBill, index: number) {
  return `${index + 1}. ${candidate.customerName} | ${candidate.accountNumber} | ${candidate.billingPeriod} | ${formatCurrency(candidate.outstandingBalance)} due`;
}

async function findPaymentCandidates(input: {
  payerQuery: string | null;
  accountNumber: string | null;
  amount: number;
}) {
  const orConditions: Prisma.BillWhereInput[] = [];

  if (input.accountNumber) {
    orConditions.push({
      customer: {
        accountNumber: {
          contains: input.accountNumber,
          mode: "insensitive",
        },
      },
    });
  }

  if (input.payerQuery) {
    orConditions.push({
      customer: {
        name: {
          contains: input.payerQuery,
          mode: "insensitive",
        },
      },
    });
    orConditions.push({
      billingPeriod: {
        contains: input.payerQuery,
        mode: "insensitive",
      },
    });
  }

  const where: Prisma.BillWhereInput = {
    status: {
      in: [BillStatus.UNPAID, BillStatus.PARTIALLY_PAID, BillStatus.OVERDUE],
    },
    ...(orConditions.length ? { OR: orConditions } : {}),
  };

  const bills = await prisma.bill.findMany({
    where,
    orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
    take: 12,
    select: {
      id: true,
      billingPeriod: true,
      totalCharges: true,
      customer: {
        select: {
          name: true,
          accountNumber: true,
        },
      },
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

  const ranked = bills
    .map((bill) => {
      const paidAmount = bill.payments.reduce((sum, payment) => sum + payment.amount, 0);
      const outstandingBalance = Math.max(0, bill.totalCharges - paidAmount);
      const exactAccountMatch = input.accountNumber
        ? bill.customer.accountNumber.toUpperCase() === input.accountNumber
        : false;
      const queryMatch = input.payerQuery
        ? `${bill.customer.name} ${bill.billingPeriod}`.toLowerCase().includes(input.payerQuery.toLowerCase())
        : false;

      return {
        billId: bill.id,
        customerName: bill.customer.name,
        accountNumber: bill.customer.accountNumber,
        billingPeriod: bill.billingPeriod,
        outstandingBalance,
        sortKey: [exactAccountMatch ? 0 : 1, queryMatch ? 0 : 1, outstandingBalance < input.amount ? 1 : 0],
      };
    })
    .filter((candidate) => candidate.outstandingBalance > 0)
    .sort((left, right) => {
      const leftKey = left.sortKey.join("-");
      const rightKey = right.sortKey.join("-");
      if (leftKey !== rightKey) {
        return leftKey.localeCompare(rightKey);
      }

      return left.customerName.localeCompare(right.customerName);
    })
    .map((candidate) => ({
      billId: candidate.billId,
      customerName: candidate.customerName,
      accountNumber: candidate.accountNumber,
      billingPeriod: candidate.billingPeriod,
      outstandingBalance: candidate.outstandingBalance,
    }));

  return ranked.slice(0, MAX_CANDIDATES);
}

async function saveSessionReply(
  sessionId: string,
  input: {
    stage?: TelegramCashierSessionStage;
    status?: TelegramConversationStatus;
    draft?: PaymentIntentDraft;
    reply: string;
    approvalRequestId?: string | null;
    completedPaymentId?: string | null;
    completedAt?: Date | null;
    cancelledAt?: Date | null;
  }
) {
  return prisma.telegramCashierSession.update({
    where: {
      id: sessionId,
    },
    data: {
      stage: input.stage,
      status: input.status,
      parsedIntent: input.draft ? serializeDraft(input.draft) : undefined,
      lastBotReply: input.reply,
      approvalRequestId: input.approvalRequestId ?? undefined,
      completedPaymentId: input.completedPaymentId ?? undefined,
      completedAt: input.completedAt ?? undefined,
      cancelledAt: input.cancelledAt ?? undefined,
      expiresAt: input.status === "ACTIVE" ? getSessionExpiry() : undefined,
    },
  });
}

async function getLinkedIdentity(message: TelegramMessageUpdate["message"]) {
  const telegramUserId = message?.from?.id ? String(message.from.id) : "";

  if (!telegramUserId) {
    return null;
  }

  const identity = await prisma.telegramStaffIdentity.findUnique({
    where: {
      telegramUserId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          isActive: true,
        },
      },
    },
  });

  if (!identity || !identity.isActive || !identity.user.isActive) {
    return null;
  }

  return prisma.telegramStaffIdentity.update({
    where: {
      id: identity.id,
    },
    data: {
      telegramChatId: message?.chat?.id ? String(message.chat.id) : identity.telegramChatId,
      telegramUsername: message?.from?.username ?? identity.telegramUsername,
      telegramFirstName: message?.from?.first_name ?? identity.telegramFirstName,
      telegramLastName: message?.from?.last_name ?? identity.telegramLastName,
      lastSeenAt: new Date(),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          isActive: true,
        },
      },
      sessions: {
        where: {
          status: TelegramConversationStatus.ACTIVE,
        },
        orderBy: [{ createdAt: "desc" }],
        take: 1,
      },
    },
  });
}

async function getOrCreateSession(identityId: string, text: string) {
  const existing = await prisma.telegramCashierSession.findFirst({
    where: {
      staffIdentityId: identityId,
      status: TelegramConversationStatus.ACTIVE,
    },
    orderBy: [{ createdAt: "desc" }],
  });

  if (existing) {
    if (existing.expiresAt && existing.expiresAt <= new Date()) {
      await prisma.telegramCashierSession.update({
        where: {
          id: existing.id,
        },
        data: {
          status: TelegramConversationStatus.EXPIRED,
          stage: TelegramCashierSessionStage.EXPIRED,
          lastBotReply: "This cashier-assist session expired. Send a new payment line to start again.",
        },
      });
    } else {
      return prisma.telegramCashierSession.update({
        where: {
          id: existing.id,
        },
        data: {
          lastInboundText: text,
          expiresAt: getSessionExpiry(),
        },
      });
    }
  }

  return prisma.telegramCashierSession.create({
    data: {
      staffIdentityId: identityId,
      actionType: "PAYMENT_POST",
      status: TelegramConversationStatus.ACTIVE,
      stage: TelegramCashierSessionStage.AWAITING_PAYMENT_DETAILS,
      lastInboundText: text,
      expiresAt: getSessionExpiry(),
      parsedIntent: serializeDraft(createEmptyDraft()),
    },
  });
}

function buildHelpText(input?: { telegramUserId?: string; telegramChatId?: string }) {
  const telegramUserId = input?.telegramUserId;
  const telegramChatId = input?.telegramChatId;
  const setupSuffix = telegramUserId
    ? ` Ask an authorized DWDS cashier to link Telegram user ID ${telegramUserId} on /admin/payments first.`
    : "";

  return [
    "DWDS cashier assistant is available for linked cashier accounts only.",
    setupSuffix.trim(),
    telegramUserId ? `Telegram user ID: ${telegramUserId}` : null,
    telegramChatId ? `Telegram chat ID: ${telegramChatId}` : null,
    "When linked, send a message like: pay DWDS-SMP-1001 350",
    "Current EH18 scope supports cash-only onsite posting, exact bill matching or numbered clarification, explicit partial-payment confirmation, and a final cash-received confirmation before approval.",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildBillSelectionReply(draft: PaymentIntentDraft) {
  return [
    `I found ${draft.candidateBills.length} open bills for ${draft.payerQuery ?? draft.accountNumber ?? "that request"}.`,
    ...draft.candidateBills.map((candidate, index) => buildCandidateLabel(candidate, index)),
    "",
    "Reply with the bill number to continue, or send /cancel to stop.",
  ].join("\n");
}

function buildCashConfirmationReply(candidate: CandidateBill, amount: number) {
  const partial = amount + 0.000001 < candidate.outstandingBalance;

  return [
    "Review the cashier intent:",
    `Customer: ${candidate.customerName} (${candidate.accountNumber})`,
    `Billing period: ${candidate.billingPeriod}`,
    `Outstanding balance: ${formatCurrency(candidate.outstandingBalance)}`,
    `Posting amount: ${formatCurrency(amount)}`,
    `Settlement type: ${partial ? "Partial cash payment" : "Full cash settlement"}`,
    "",
    "Reply RECEIVED only after the physical cash is already in hand.",
  ].join("\n");
}

function buildApprovalQueuedReply() {
  return [
    "Cash-received confirmation recorded.",
    "DWDS has sent the exact PAYMENT_POST intent for Telegram approval.",
    "You will receive a follow-up message here after the approval request is approved, rejected, or expires.",
  ].join("\n");
}

async function moveToCandidateDecision(session: TelegramCashierSession, draft: PaymentIntentDraft) {
  const amount = draft.amount;

  if (!amount || amount <= 0) {
    const reply =
      "Send the payer plus amount in one line, for example: pay DWDS-SMP-1001 350";
    await saveSessionReply(session.id, {
      stage: TelegramCashierSessionStage.AWAITING_PAYMENT_DETAILS,
      status: TelegramConversationStatus.ACTIVE,
      draft,
      reply,
    });

    return reply;
  }

  if (draft.candidateBills.length === 0) {
    const reply =
      "No open bill matched that payer or account. Send the exact account number or customer name together with the payment amount.";
    await saveSessionReply(session.id, {
      stage: TelegramCashierSessionStage.AWAITING_PAYMENT_DETAILS,
      status: TelegramConversationStatus.ACTIVE,
      draft,
      reply,
    });

    return reply;
  }

  if (draft.candidateBills.length > 1) {
    const reply = buildBillSelectionReply(draft);
    await saveSessionReply(session.id, {
      stage: TelegramCashierSessionStage.AWAITING_BILL_SELECTION,
      status: TelegramConversationStatus.ACTIVE,
      draft,
      reply,
    });

    return reply;
  }

  const candidate = draft.candidateBills[0];
  draft.billId = candidate.billId;

  if (amount - candidate.outstandingBalance > 0.000001) {
    const reply = `The claimed amount ${formatCurrency(amount)} is greater than the remaining balance of ${formatCurrency(candidate.outstandingBalance)} for ${candidate.accountNumber}. Send a corrected amount.`;
    await saveSessionReply(session.id, {
      stage: TelegramCashierSessionStage.AWAITING_PAYMENT_DETAILS,
      status: TelegramConversationStatus.ACTIVE,
      draft,
      reply,
    });

    return reply;
  }

  if (amount + 0.000001 < candidate.outstandingBalance) {
    const reply = [
      `This will post a partial cash payment of ${formatCurrency(amount)} against ${candidate.accountNumber}.`,
      `Remaining balance after posting: ${formatCurrency(candidate.outstandingBalance - amount)}.`,
      "Reply YES to keep the partial-payment amount, or send /cancel to stop.",
    ].join("\n");
    await saveSessionReply(session.id, {
      stage: TelegramCashierSessionStage.AWAITING_PARTIAL_CONFIRMATION,
      status: TelegramConversationStatus.ACTIVE,
      draft,
      reply,
    });

    return reply;
  }

  const reply = buildCashConfirmationReply(candidate, amount);
  await saveSessionReply(session.id, {
    stage: TelegramCashierSessionStage.AWAITING_CASH_CONFIRMATION,
    status: TelegramConversationStatus.ACTIVE,
    draft,
    reply,
  });

  return reply;
}

async function handleAwaitingPaymentDetails(session: TelegramCashierSession, text: string) {
  if (isUnsupportedMethod(text)) {
    const reply =
      "EH18 currently supports cash-only onsite posting in Telegram. Use the web cashier form for GCash, Maya, bank transfer, or card settlements.";
    await saveSessionReply(session.id, {
      stage: TelegramCashierSessionStage.AWAITING_PAYMENT_DETAILS,
      status: TelegramConversationStatus.ACTIVE,
      draft: createEmptyDraft(),
      reply,
    });

    return reply;
  }

  const amount = parseAmount(text);
  const accountNumber = parseAccountNumber(text);
  const payerQuery = parsePayerQuery(text, accountNumber);
  const draft = createEmptyDraft();
  draft.amount = amount;
  draft.accountNumber = accountNumber;
  draft.payerQuery = payerQuery;
  draft.candidateBills = amount ? await findPaymentCandidates({ payerQuery, accountNumber, amount }) : [];

  return moveToCandidateDecision(session, draft);
}

async function handleBillSelection(session: TelegramCashierSession, text: string) {
  const draft = readDraft(session.parsedIntent);
  const choice = Number(text.trim());

  if (!Number.isInteger(choice) || choice < 1 || choice > draft.candidateBills.length) {
    const reply = "Reply with one of the numbered bill choices, or send /cancel to stop.";
    await saveSessionReply(session.id, {
      stage: TelegramCashierSessionStage.AWAITING_BILL_SELECTION,
      status: TelegramConversationStatus.ACTIVE,
      draft,
      reply,
    });

    return reply;
  }

  const candidate = draft.candidateBills[choice - 1];
  draft.billId = candidate.billId;

  if (!draft.amount) {
    const reply = "The session lost the payment amount. Send the payer and amount again.";
    await saveSessionReply(session.id, {
      stage: TelegramCashierSessionStage.AWAITING_PAYMENT_DETAILS,
      status: TelegramConversationStatus.ACTIVE,
      draft: createEmptyDraft(),
      reply,
    });

    return reply;
  }

  if (draft.amount - candidate.outstandingBalance > 0.000001) {
    const reply = `The claimed amount ${formatCurrency(draft.amount)} is greater than the remaining balance of ${formatCurrency(candidate.outstandingBalance)}. Send a corrected payment line.`;
    await saveSessionReply(session.id, {
      stage: TelegramCashierSessionStage.AWAITING_PAYMENT_DETAILS,
      status: TelegramConversationStatus.ACTIVE,
      draft,
      reply,
    });

    return reply;
  }

  if (draft.amount + 0.000001 < candidate.outstandingBalance) {
    const reply = [
      `This will post a partial cash payment of ${formatCurrency(draft.amount)} against ${candidate.accountNumber}.`,
      `Remaining balance after posting: ${formatCurrency(candidate.outstandingBalance - draft.amount)}.`,
      "Reply YES to keep the partial-payment amount, or send /cancel to stop.",
    ].join("\n");
    await saveSessionReply(session.id, {
      stage: TelegramCashierSessionStage.AWAITING_PARTIAL_CONFIRMATION,
      status: TelegramConversationStatus.ACTIVE,
      draft,
      reply,
    });

    return reply;
  }

  const reply = buildCashConfirmationReply(candidate, draft.amount);
  await saveSessionReply(session.id, {
    stage: TelegramCashierSessionStage.AWAITING_CASH_CONFIRMATION,
    status: TelegramConversationStatus.ACTIVE,
    draft,
    reply,
  });

  return reply;
}

async function handlePartialConfirmation(session: TelegramCashierSession, text: string) {
  const draft = readDraft(session.parsedIntent);
  const candidate = draft.candidateBills.find((entry) => entry.billId === draft.billId);

  if (!candidate || !draft.amount) {
    const reply = "The selected bill is no longer available. Send the payment line again.";
    await saveSessionReply(session.id, {
      stage: TelegramCashierSessionStage.AWAITING_PAYMENT_DETAILS,
      status: TelegramConversationStatus.ACTIVE,
      draft: createEmptyDraft(),
      reply,
    });

    return reply;
  }

  if (!isAffirmative(text)) {
    const reply = "Partial payment was not confirmed. Send a new payment line with the corrected amount, or /cancel to stop.";
    await saveSessionReply(session.id, {
      stage: TelegramCashierSessionStage.AWAITING_PAYMENT_DETAILS,
      status: TelegramConversationStatus.ACTIVE,
      draft: createEmptyDraft(),
      reply,
    });

    return reply;
  }

  draft.partialConfirmed = true;
  const reply = buildCashConfirmationReply(candidate, draft.amount);
  await saveSessionReply(session.id, {
    stage: TelegramCashierSessionStage.AWAITING_CASH_CONFIRMATION,
    status: TelegramConversationStatus.ACTIVE,
    draft,
    reply,
  });

  return reply;
}

async function handleCashConfirmation(
  session: TelegramCashierSession,
  text: string,
  requestedBy: { id: string; name: string }
) {
  const draft = readDraft(session.parsedIntent);

  if (!isReceivedConfirmation(text)) {
    const reply = "Reply RECEIVED only after the physical cash is already in hand, or send /cancel to stop.";
    await saveSessionReply(session.id, {
      stage: TelegramCashierSessionStage.AWAITING_CASH_CONFIRMATION,
      status: TelegramConversationStatus.ACTIVE,
      draft,
      reply,
    });

    return reply;
  }

  draft.cashReceivedConfirmed = true;

  const approval = await requestTelegramApprovalForPaymentSession({
    sessionId: session.id,
    requestedById: requestedBy.id,
    requestedByName: requestedBy.name,
    paymentDraft: {
      amount: draft.amount,
      billId: draft.billId,
      partialConfirmed: draft.partialConfirmed,
      cashReceivedConfirmed: draft.cashReceivedConfirmed,
    },
  });

  if (!approval.delivery.ok) {
    const reply = `DWDS could not send the Telegram approval request yet: ${approval.delivery.errorMessage}`;
    await saveSessionReply(session.id, {
      stage: TelegramCashierSessionStage.AWAITING_CASH_CONFIRMATION,
      status: TelegramConversationStatus.ACTIVE,
      draft,
      reply,
    });

    return reply;
  }

  const reply = buildApprovalQueuedReply();
  await saveSessionReply(session.id, {
    stage: TelegramCashierSessionStage.AWAITING_APPROVAL,
    status: TelegramConversationStatus.ACTIVE,
    draft,
    reply,
    approvalRequestId: approval.request?.id ?? null,
  });

  return reply;
}

export async function processTelegramCashierUpdate(update: TelegramMessageUpdate) {
  const message = update.message;
  const chatId = message?.chat?.id ? String(message.chat.id) : "";
  const text = normalizeText(message?.text ?? "");

  if (!chatId || !text) {
    return null;
  }

  if (/^\/(start|help)\b/i.test(text)) {
    const identity = await getLinkedIdentity(message);
    return identity
      ? `DWDS cashier assistant is linked to ${identity.user.name}.\nSend a message like: pay DWDS-SMP-1001 350\nUse /cancel to stop the current cashier session.`
      : buildHelpText({
          telegramUserId: message?.from?.id ? String(message.from.id) : undefined,
          telegramChatId: message?.chat?.id ? String(message.chat.id) : undefined,
        });
  }

  const identity = await getLinkedIdentity(message);

  if (!identity) {
    return buildHelpText({
      telegramUserId: message?.from?.id ? String(message.from.id) : undefined,
      telegramChatId: message?.chat?.id ? String(message.chat.id) : undefined,
    });
  }

  const currentSession = await getOrCreateSession(identity.id, text);

  if (/^\/cancel\b/i.test(text)) {
    const reply = "The current Telegram cashier session was cancelled. Send a new payment line when you are ready.";
    await saveSessionReply(currentSession.id, {
      stage: TelegramCashierSessionStage.CANCELLED,
      status: TelegramConversationStatus.CANCELLED,
      draft: readDraft(currentSession.parsedIntent),
      reply,
      cancelledAt: new Date(),
    });

    return reply;
  }

  if (currentSession.stage === TelegramCashierSessionStage.AWAITING_BILL_SELECTION) {
    return handleBillSelection(currentSession, text);
  }

  if (currentSession.stage === TelegramCashierSessionStage.AWAITING_PARTIAL_CONFIRMATION) {
    return handlePartialConfirmation(currentSession, text);
  }

  if (currentSession.stage === TelegramCashierSessionStage.AWAITING_CASH_CONFIRMATION) {
    return handleCashConfirmation(currentSession, text, {
      id: identity.user.id,
      name: identity.user.name,
    });
  }

  if (currentSession.stage === TelegramCashierSessionStage.AWAITING_APPROVAL) {
    const approvalRequest = currentSession.approvalRequestId
      ? await prisma.automationApprovalRequest.findUnique({
          where: {
            id: currentSession.approvalRequestId,
          },
          select: {
            status: true,
          },
        })
      : null;

    const reply =
      approvalRequest?.status === AutomationApprovalStatus.PENDING
        ? "The PAYMENT_POST request is still waiting for Telegram approval."
        : "That cashier session is already closed. Send a new payment line to start again.";

    await saveSessionReply(currentSession.id, {
      stage:
        approvalRequest?.status === AutomationApprovalStatus.PENDING
          ? TelegramCashierSessionStage.AWAITING_APPROVAL
          : TelegramCashierSessionStage.COMPLETED,
      status:
        approvalRequest?.status === AutomationApprovalStatus.PENDING
          ? TelegramConversationStatus.ACTIVE
          : TelegramConversationStatus.COMPLETED,
      draft: readDraft(currentSession.parsedIntent),
      reply,
      completedAt:
        approvalRequest?.status === AutomationApprovalStatus.PENDING ? null : new Date(),
    });

    return reply;
  }

  return handleAwaitingPaymentDetails(currentSession, text);
}

export async function upsertTelegramStaffIdentityForCurrentUser(input: {
  userId: string;
  telegramUserId: string;
  telegramChatId?: string | null;
}) {
  const existingForTelegramUser = await prisma.telegramStaffIdentity.findUnique({
    where: {
      telegramUserId: input.telegramUserId,
    },
    select: {
      id: true,
      userId: true,
    },
  });

  if (existingForTelegramUser && existingForTelegramUser.userId !== input.userId) {
    throw new Error("That Telegram user ID is already linked to another DWDS staff account.");
  }

  return prisma.telegramStaffIdentity.upsert({
    where: {
      userId: input.userId,
    },
    update: {
      telegramUserId: input.telegramUserId,
      telegramChatId: input.telegramChatId?.trim() || null,
      isActive: true,
    },
    create: {
      userId: input.userId,
      telegramUserId: input.telegramUserId,
      telegramChatId: input.telegramChatId?.trim() || null,
      isActive: true,
    },
  });
}

export async function setTelegramStaffIdentityActive(input: {
  userId: string;
  isActive: boolean;
}) {
  return prisma.telegramStaffIdentity.update({
    where: {
      userId: input.userId,
    },
    data: {
      isActive: input.isActive,
    },
  });
}

export async function finalizeTelegramCashierSession(input: {
  sessionId: string;
  approvalStatus:
    | AutomationApprovalStatus
    | AutomationExecutionStatus
    | "FAILED_APPROVAL_DELIVERY";
  reply: string;
  completedPaymentId?: string | null;
}) {
  const nextStatus =
    input.approvalStatus === AutomationApprovalStatus.REJECTED
      ? TelegramConversationStatus.CANCELLED
      : input.approvalStatus === AutomationApprovalStatus.EXPIRED ||
          input.approvalStatus === "FAILED_APPROVAL_DELIVERY"
        ? TelegramConversationStatus.EXPIRED
        : TelegramConversationStatus.COMPLETED;
  const nextStage =
    nextStatus === TelegramConversationStatus.CANCELLED
      ? TelegramCashierSessionStage.CANCELLED
      : nextStatus === TelegramConversationStatus.EXPIRED
        ? TelegramCashierSessionStage.EXPIRED
        : TelegramCashierSessionStage.COMPLETED;

  return prisma.telegramCashierSession.update({
    where: {
      id: input.sessionId,
    },
    data: {
      status: nextStatus,
      stage: nextStage,
      lastBotReply: input.reply,
      completedAt: nextStatus === TelegramConversationStatus.COMPLETED ? new Date() : undefined,
      completedPaymentId: input.completedPaymentId ?? undefined,
      cancelledAt: nextStatus === TelegramConversationStatus.CANCELLED ? new Date() : undefined,
    },
    include: {
      staffIdentity: true,
    },
  });
}

export type TelegramCashierAuditRow = TelegramCashierSession & {
  staffIdentity: {
    telegramUserId: string;
    telegramUsername: string | null;
    user: {
      name: string;
      email: string;
    };
  };
  completedPayment: {
    id: string;
    receiptNumber: string;
    amount: number;
  } | null;
  approvalRequest:
    | (AutomationApprovalRequest & {
        executionLogs: AutomationExecutionLog[];
      })
    | null;
};
