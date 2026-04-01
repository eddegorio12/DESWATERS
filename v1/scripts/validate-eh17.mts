import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");

function loadEnvFile() {
  const envPath = path.join(repoRoot, ".env");
  const contents = fs.readFileSync(envPath, "utf8");

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

const [{ prisma }, approvalStore, tokenHelpers] = await Promise.all([
  import("@/lib/prisma"),
  import("@/features/automation/lib/approval-store"),
  import("@/features/automation/lib/approval-tokens"),
]);

const {
  requestTelegramApprovalForFollowUpProposal,
  processApprovalDecision,
} = approvalStore;
const { createApprovalToken } = tokenHelpers;

const adminUser = await prisma.user.findFirst({
  where: {
    role: {
      in: ["SUPER_ADMIN", "ADMIN", "BILLING"],
    },
    isActive: true,
  },
  orderBy: [{ createdAt: "asc" }],
  select: {
    id: true,
    name: true,
    role: true,
  },
});

if (!adminUser) {
  throw new Error("No active staff user is available for EH17 validation.");
}

const eligibleBills = await prisma.bill.findMany({
  where: {
    id: {
      in: [],
    },
  },
});
void eligibleBills;

const latestEligibleProposal = await prisma.automationProposal.findFirst({
  where: {
    run: {
      workerType: "FOLLOW_UP_TRIAGE",
    },
    dismissedAt: null,
    actionIntents: {
      none: {
        approvalRequests: {
          some: {
            status: {
              in: ["PENDING", "APPROVED", "EXECUTED"],
            },
          },
        },
      },
    },
    OR: [
      {
        AND: [
          {
            sourceMetadata: {
              path: ["queueFocus"],
              equals: "NEEDS_REMINDER",
            },
          },
          {
            sourceMetadata: {
              path: ["followUpStatus"],
              equals: "CURRENT",
            },
          },
        ],
      },
      {
        AND: [
          {
            sourceMetadata: {
              path: ["queueFocus"],
              equals: "NEEDS_FINAL_NOTICE",
            },
          },
          {
            sourceMetadata: {
              path: ["followUpStatus"],
              equals: "REMINDER_SENT",
            },
          },
        ],
      },
      {
        AND: [
          {
            sourceMetadata: {
              path: ["queueFocus"],
              equals: "READY_FOR_DISCONNECTION",
            },
          },
          {
            sourceMetadata: {
              path: ["followUpStatus"],
              equals: "FINAL_NOTICE_SENT",
            },
          },
        ],
      },
    ],
  },
  orderBy: [{ createdAt: "desc" }],
  select: {
    id: true,
    targetId: true,
    summary: true,
    rationale: true,
    sourceMetadata: true,
  },
});

if (!latestEligibleProposal) {
  throw new Error("No eligible follow-up triage proposal is available for EH17 validation.");
}

const transportRequest = await requestTelegramApprovalForFollowUpProposal({
  proposalId: latestEligibleProposal.id,
  requestedById: adminUser.id,
  requestedByName: adminUser.name,
});

const executionBill = await prisma.bill.findFirst({
  where: {
    status: "OVERDUE",
    followUpStatus: {
      in: ["CURRENT", "REMINDER_SENT", "FINAL_NOTICE_SENT"],
    },
  },
  orderBy: [{ dueDate: "asc" }],
  select: {
    id: true,
    billingPeriod: true,
    followUpStatus: true,
    customer: {
      select: {
        name: true,
        accountNumber: true,
      },
    },
  },
});

if (!executionBill) {
  throw new Error("No exact EH17-executable overdue bill is available for approval execution validation.");
}

const executionAction =
  executionBill.followUpStatus === "CURRENT"
    ? {
        actionType: "FOLLOW_UP_SEND_REMINDER" as const,
        nextStatus: "REMINDER_SENT" as const,
      }
    : executionBill.followUpStatus === "REMINDER_SENT"
      ? {
          actionType: "FOLLOW_UP_SEND_FINAL_NOTICE" as const,
          nextStatus: "FINAL_NOTICE_SENT" as const,
        }
      : {
          actionType: "FOLLOW_UP_ESCALATE_DISCONNECTION_REVIEW" as const,
          nextStatus: "DISCONNECTION_REVIEW" as const,
        };

const executionIntent = await prisma.automationActionIntent.create({
  data: {
    workerType: "FOLLOW_UP_TRIAGE",
    actionType: executionAction.actionType,
    targetType: "BILL",
    targetId: executionBill.id,
    summary: `Validation reminder request for ${executionBill.customer.accountNumber}.`,
    rationale: "Local EH17 execution test.",
    payload: {
      billId: executionBill.id,
      nextStatus: executionAction.nextStatus,
    },
    createdById: adminUser.id,
  },
});

const { token } = createApprovalToken();
const manualToken = createApprovalToken();

const manualRequest = await prisma.automationApprovalRequest.create({
  data: {
    intentId: executionIntent.id,
    transport: "TELEGRAM",
    status: "PENDING",
    callbackTokenHash: manualToken.tokenHash,
    requestedById: adminUser.id,
    expiresAt: new Date(Date.now() + 1000 * 60 * 30),
  },
});

void token;

const approveResult = await processApprovalDecision({
  requestId: manualRequest.id,
  token: manualToken.token,
  decision: "approve",
  decidedByLabel: "local-eh17-script",
});

const replayResult = await processApprovalDecision({
  requestId: manualRequest.id,
  token: manualToken.token,
  decision: "approve",
  decidedByLabel: "local-eh17-script",
});

const updatedExecutionBill = await prisma.bill.findUnique({
  where: {
    id: executionBill.id,
  },
  select: {
    id: true,
    followUpStatus: true,
    followUpNote: true,
  },
});

const rejectedBill = await prisma.bill.findFirst({
  where: {
    followUpStatus: "REMINDER_SENT",
    status: "OVERDUE",
  },
  orderBy: [{ dueDate: "asc" }],
  select: {
    id: true,
  },
});

let rejectResult = null;

if (rejectedBill) {
  const rejectIntent = await prisma.automationActionIntent.create({
    data: {
      workerType: "FOLLOW_UP_TRIAGE",
      actionType: "FOLLOW_UP_SEND_FINAL_NOTICE",
      targetType: "BILL",
      targetId: rejectedBill.id,
      summary: "Validation rejection request.",
      rationale: "Local EH17 rejection test.",
      payload: {
        billId: rejectedBill.id,
        nextStatus: "FINAL_NOTICE_SENT",
      },
      createdById: adminUser.id,
    },
  });

  const rejectToken = createApprovalToken();

  const rejectRequest = await prisma.automationApprovalRequest.create({
    data: {
      intentId: rejectIntent.id,
      transport: "TELEGRAM",
      status: "PENDING",
      callbackTokenHash: rejectToken.tokenHash,
      requestedById: adminUser.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 30),
    },
  });

  rejectResult = await processApprovalDecision({
    requestId: rejectRequest.id,
    token: rejectToken.token,
    decision: "reject",
    decidedByLabel: "local-eh17-script",
  });
}

const executionLogs = await prisma.automationExecutionLog.findMany({
  orderBy: [{ createdAt: "desc" }],
  take: 6,
  select: {
    actionType: true,
    status: true,
    resultSummary: true,
    createdAt: true,
  },
});

console.log(
  JSON.stringify(
    {
      transportRequest: {
        requestId: transportRequest.request.id,
        deliveryOk: transportRequest.delivery.ok,
        requestStatus: transportRequest.request.status,
      },
      approveResult,
      replayResult,
      updatedExecutionBill,
      rejectResult,
      executionLogs: executionLogs.map((log) => ({
        ...log,
        createdAt: log.createdAt.toISOString(),
      })),
    },
    null,
    2,
  ),
);

await prisma.$disconnect();
