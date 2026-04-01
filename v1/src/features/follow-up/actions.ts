"use server";

import {
  AutomationProposalDecision,
  AutomationWorkerType,
  BillStatus,
  CustomerStatus,
  NotificationTemplate,
  PaymentStatus,
  ReceivableFollowUpStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";

import {
  completeAutomationRunWithProposals,
  createPendingAutomationRun,
  failAutomationRun,
} from "@/features/automation/lib/automation-store";
import { requestTelegramApprovalForFollowUpProposal } from "@/features/automation/lib/approval-store";
import { type FollowUpTriageCandidate } from "@/features/automation/lib/openclaw-adapter";
import { requireStaffCapability } from "@/features/auth/lib/authorization";
import {
  getOperationalBillStatus,
  getOutstandingBalance,
  syncReceivableStatuses,
} from "@/features/follow-up/lib/workflow";
import { getDaysPastDue } from "@/features/follow-up/lib/workflow";
import { advanceReceivableFollowUp, getDefaultFollowUpNote } from "@/features/follow-up/lib/follow-up-operations";
import { generateFollowUpTriageProposals } from "@/features/follow-up/lib/follow-up-triage";
import { dispatchFollowUpNotifications } from "@/features/notifications/lib/dispatch";
import { createPrintedNoticeLog } from "@/features/notices/lib/logging";
import { prisma } from "@/lib/prisma";

function revalidateOperationalSurfaces() {
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/billing");
  revalidatePath("/admin/payments");
  revalidatePath("/admin/collections");
  revalidatePath("/admin/follow-up");
}

export async function runFollowUpTriage() {
  const staffUser = await requireStaffCapability("followup:update");
  await syncReceivableStatuses();

  const startedAt = Date.now();
  const run = await createPendingAutomationRun({
    workerType: AutomationWorkerType.FOLLOW_UP_TRIAGE,
    scopeType: "FOLLOW_UP_VISIBLE_QUEUE",
    triggeredById: staffUser.id,
    provider: "DWDS_INTERNAL",
    model: "follow-up-heuristic-v1",
  });

  try {
    const bills = await prisma.bill.findMany({
      where: {
        status: {
          in: [BillStatus.UNPAID, BillStatus.PARTIALLY_PAID, BillStatus.OVERDUE],
        },
      },
      orderBy: [{ dueDate: "asc" }],
      select: {
        id: true,
        billingPeriod: true,
        dueDate: true,
        totalCharges: true,
        status: true,
        followUpStatus: true,
        customer: {
          select: {
            id: true,
            accountNumber: true,
            name: true,
            status: true,
          },
        },
        payments: {
          where: {
            status: PaymentStatus.COMPLETED,
          },
          select: {
            amount: true,
          },
        },
      },
    });

    const candidates = bills
      .map((bill) => {
        const outstandingBalance = getOutstandingBalance(bill.totalCharges, bill.payments);

        if (outstandingBalance <= 0) {
          return null;
        }

        const queueFocus: FollowUpTriageCandidate["queueFocus"] =
          bill.customer.status === CustomerStatus.DISCONNECTED
            ? "DISCONNECTED_HOLD"
            : bill.status === BillStatus.OVERDUE && bill.followUpStatus === ReceivableFollowUpStatus.CURRENT
              ? "NEEDS_REMINDER"
              : bill.status === BillStatus.OVERDUE &&
                  bill.followUpStatus === ReceivableFollowUpStatus.REMINDER_SENT
                ? "NEEDS_FINAL_NOTICE"
                : bill.status === BillStatus.OVERDUE &&
                    (bill.followUpStatus === ReceivableFollowUpStatus.FINAL_NOTICE_SENT ||
                      bill.followUpStatus === ReceivableFollowUpStatus.DISCONNECTION_REVIEW)
                  ? "READY_FOR_DISCONNECTION"
                  : "MONITORING";

        return {
          billId: bill.id,
          customerId: bill.customer.id,
          customerName: bill.customer.name,
          accountNumber: bill.customer.accountNumber,
          billingPeriod: bill.billingPeriod,
          queueFocus,
          followUpStatus: bill.followUpStatus,
          customerStatus: bill.customer.status,
          daysPastDue: getDaysPastDue(bill.dueDate),
          outstandingBalance,
        };
      })
      .filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null);

    const proposals = await generateFollowUpTriageProposals(candidates);

    await completeAutomationRunWithProposals({
      runId: run.id,
      latencyMs: Date.now() - startedAt,
      proposals: proposals.map((proposal) => ({
        rank: proposal.rank,
        targetType: "BILL",
        targetId: proposal.billId,
        summary: proposal.summary,
        recommendedReviewStep: proposal.recommendedReviewStep,
        rationale: proposal.rationale,
        confidenceLabel: proposal.confidenceLabel,
        sourceMetadata: proposal.sourceMetadata,
      })),
    });
  } catch (error) {
    await failAutomationRun({
      runId: run.id,
      latencyMs: Date.now() - startedAt,
      failureReason: error instanceof Error ? error.message : "The follow-up triage worker failed.",
    });

    throw error;
  }

  revalidateOperationalSurfaces();
}

export async function dismissFollowUpTriageProposal(proposalId: string) {
  const staffUser = await requireStaffCapability("followup:update");

  const proposal = await prisma.automationProposal.findUnique({
    where: {
      id: proposalId,
    },
    select: {
      id: true,
      runId: true,
      dismissedAt: true,
      run: {
        select: {
          workerType: true,
        },
      },
    },
  });

  if (!proposal || proposal.run.workerType !== AutomationWorkerType.FOLLOW_UP_TRIAGE) {
    throw new Error("That follow-up triage proposal no longer exists.");
  }

  if (proposal.dismissedAt) {
    return;
  }

  await prisma.$transaction([
    prisma.automationProposal.update({
      where: {
        id: proposal.id,
      },
      data: {
        dismissedAt: new Date(),
        dismissedById: staffUser.id,
      },
    }),
    prisma.automationReview.create({
      data: {
        runId: proposal.runId,
        proposalId: proposal.id,
        reviewedById: staffUser.id,
        decision: AutomationProposalDecision.DISMISSED,
      },
    }),
  ]);

  revalidatePath("/admin/follow-up");
}

export async function requestFollowUpProposalApproval(proposalId: string) {
  const staffUser = await requireStaffCapability("followup:update");

  await requestTelegramApprovalForFollowUpProposal({
    proposalId,
    requestedById: staffUser.id,
    requestedByName: staffUser.name,
  });

  revalidatePath("/admin/follow-up");
}

export async function updateReceivableFollowUp(
  billId: string,
  nextStatus: Exclude<ReceivableFollowUpStatus, "DISCONNECTED" | "RESOLVED">
) {
  const staffUser = await requireStaffCapability("followup:update");
  await advanceReceivableFollowUp({
    billId,
    nextStatus,
    actorId: staffUser.id,
  });

  revalidateOperationalSurfaces();
}

export async function disconnectCustomerService(customerId: string) {
  const staffUser = await requireStaffCapability("service:disconnect");
  await syncReceivableStatuses();

  const customer = await prisma.customer.findUnique({
    where: {
      id: customerId,
    },
    select: {
      id: true,
      accountNumber: true,
      name: true,
      email: true,
      contactNumber: true,
      status: true,
      bills: {
        where: {
          status: {
            in: [BillStatus.UNPAID, BillStatus.PARTIALLY_PAID, BillStatus.OVERDUE],
          },
        },
        select: {
          id: true,
          billingPeriod: true,
          dueDate: true,
          totalCharges: true,
          followUpStatus: true,
          payments: {
            where: {
              status: PaymentStatus.COMPLETED,
            },
            select: {
              amount: true,
            },
          },
        },
      },
    },
  });

  if (!customer) {
    throw new Error("That customer no longer exists.");
  }

  if (customer.status === CustomerStatus.DISCONNECTED) {
    throw new Error("This customer is already marked disconnected.");
  }

  const overdueBills = customer.bills.filter((bill) => {
    const operationalStatus = getOperationalBillStatus(bill);
    const outstandingBalance = getOutstandingBalance(bill.totalCharges, bill.payments);

    return operationalStatus === BillStatus.OVERDUE && outstandingBalance > 0;
  });

  const hasEscalatedBill = overdueBills.some(
    (bill) =>
      bill.followUpStatus === ReceivableFollowUpStatus.FINAL_NOTICE_SENT ||
      bill.followUpStatus === ReceivableFollowUpStatus.DISCONNECTION_REVIEW
  );

  if (!hasEscalatedBill) {
    throw new Error(
      "Only customers with overdue bills already in final notice or disconnection review can be disconnected."
    );
  }

  await prisma.$transaction([
    prisma.customer.update({
      where: {
        id: customer.id,
      },
      data: {
        status: CustomerStatus.DISCONNECTED,
        statusUpdatedAt: new Date(),
        statusUpdatedById: staffUser.id,
        statusNote:
          "Service was disconnected after overdue receivables reached the configured escalation stage.",
      },
    }),
    ...overdueBills.map((bill) =>
      prisma.bill.update({
        where: {
          id: bill.id,
        },
        data: {
          status: BillStatus.OVERDUE,
          followUpStatus: ReceivableFollowUpStatus.DISCONNECTED,
          followUpStatusUpdatedAt: new Date(),
          followUpUpdatedById: staffUser.id,
          followUpNote: getDefaultFollowUpNote(ReceivableFollowUpStatus.DISCONNECTED),
        },
      })
    ),
  ]);

  await dispatchFollowUpNotifications({
    customer: {
      id: customer.id,
      name: customer.name,
      accountNumber: customer.accountNumber,
      email: customer.email,
      contactNumber: customer.contactNumber,
    },
    template: NotificationTemplate.DISCONNECTION,
    triggeredById: staffUser.id,
  }).catch(() => undefined);

  const highestOverdueBalance = overdueBills.reduce((current, bill) => {
    const outstandingBalance = getOutstandingBalance(bill.totalCharges, bill.payments);

    return Math.max(current, outstandingBalance);
  }, 0);

  await createPrintedNoticeLog({
    customer: {
      id: customer.id,
      name: customer.name,
      accountNumber: customer.accountNumber,
    },
    template: NotificationTemplate.DISCONNECTION,
    triggeredById: staffUser.id,
    bill:
      overdueBills[0] !== undefined
        ? {
            id: overdueBills[0].id,
            billingPeriod: overdueBills[0].billingPeriod,
            dueDate: overdueBills[0].dueDate,
            outstandingBalance: highestOverdueBalance,
          }
        : undefined,
  }).catch(() => undefined);

  revalidateOperationalSurfaces();
}

export async function reinstateCustomerService(customerId: string) {
  const staffUser = await requireStaffCapability("service:reinstate");
  await syncReceivableStatuses();

  const customer = await prisma.customer.findUnique({
    where: {
      id: customerId,
    },
    select: {
      id: true,
      accountNumber: true,
      name: true,
      email: true,
      contactNumber: true,
      status: true,
      bills: {
        select: {
          id: true,
          dueDate: true,
          totalCharges: true,
          status: true,
          followUpStatus: true,
          payments: {
            where: {
              status: PaymentStatus.COMPLETED,
            },
            select: {
              amount: true,
            },
          },
        },
      },
    },
  });

  if (!customer) {
    throw new Error("That customer no longer exists.");
  }

  if (customer.status !== CustomerStatus.DISCONNECTED) {
    throw new Error("Only disconnected customers can be reinstated.");
  }

  const openOverdueBills = customer.bills.filter((bill) => {
    const outstandingBalance = getOutstandingBalance(bill.totalCharges, bill.payments);

    return getOperationalBillStatus(bill) === BillStatus.OVERDUE && outstandingBalance > 0;
  });

  if (openOverdueBills.length) {
    throw new Error(
      "Reinstatement is blocked until all overdue balances are settled or no longer past due."
    );
  }

  const followUpBillUpdates = customer.bills
    .filter((bill) => bill.followUpStatus === ReceivableFollowUpStatus.DISCONNECTED)
    .map((bill) => {
      const outstandingBalance = getOutstandingBalance(bill.totalCharges, bill.payments);
      const nextStatus =
        outstandingBalance <= 0
          ? ReceivableFollowUpStatus.RESOLVED
          : ReceivableFollowUpStatus.CURRENT;

      return prisma.bill.update({
        where: {
          id: bill.id,
        },
        data: {
          status: getOperationalBillStatus(bill),
          followUpStatus: nextStatus,
          followUpStatusUpdatedAt: new Date(),
          followUpUpdatedById: staffUser.id,
          followUpNote:
            nextStatus === ReceivableFollowUpStatus.RESOLVED
              ? getDefaultFollowUpNote(ReceivableFollowUpStatus.RESOLVED)
              : "Service was reinstated after the overdue disconnection hold was cleared.",
        },
      });
    });

  await prisma.$transaction([
    prisma.customer.update({
      where: {
        id: customer.id,
      },
      data: {
        status: CustomerStatus.ACTIVE,
        statusUpdatedAt: new Date(),
        statusUpdatedById: staffUser.id,
        statusNote: "Service was reinstated after overdue receivables were cleared.",
      },
    }),
    ...followUpBillUpdates,
  ]);

  await dispatchFollowUpNotifications({
    customer: {
      id: customer.id,
      name: customer.name,
      accountNumber: customer.accountNumber,
      email: customer.email,
      contactNumber: customer.contactNumber,
    },
    template: NotificationTemplate.REINSTATEMENT,
    triggeredById: staffUser.id,
  }).catch(() => undefined);

  await createPrintedNoticeLog({
    customer: {
      id: customer.id,
      name: customer.name,
      accountNumber: customer.accountNumber,
    },
    template: NotificationTemplate.REINSTATEMENT,
    triggeredById: staffUser.id,
  }).catch(() => undefined);

  revalidateOperationalSurfaces();
}
