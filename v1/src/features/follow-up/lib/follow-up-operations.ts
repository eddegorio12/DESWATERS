import {
  BillStatus,
  CustomerStatus,
  NotificationTemplate,
  PaymentStatus,
  ReceivableFollowUpStatus,
} from "@prisma/client";

import { dispatchFollowUpNotifications } from "@/features/notifications/lib/dispatch";
import { prisma } from "@/lib/prisma";

import {
  getOperationalBillStatus,
  getOutstandingBalance,
  syncReceivableStatuses,
} from "./workflow";

const followUpProgression: Record<
  Exclude<ReceivableFollowUpStatus, "DISCONNECTED" | "RESOLVED">,
  number
> = {
  CURRENT: 0,
  REMINDER_SENT: 1,
  FINAL_NOTICE_SENT: 2,
  DISCONNECTION_REVIEW: 3,
};

export function getDefaultFollowUpNote(status: ReceivableFollowUpStatus) {
  switch (status) {
    case ReceivableFollowUpStatus.CURRENT:
      return "Receivables follow-up was reset to the current monitoring stage.";
    case ReceivableFollowUpStatus.REMINDER_SENT:
      return "A first overdue reminder was recorded from the receivables follow-up workspace.";
    case ReceivableFollowUpStatus.FINAL_NOTICE_SENT:
      return "A final overdue notice was recorded from the receivables follow-up workspace.";
    case ReceivableFollowUpStatus.DISCONNECTION_REVIEW:
      return "The overdue balance was escalated for disconnection review.";
    case ReceivableFollowUpStatus.DISCONNECTED:
      return "Service disconnection was recorded against the overdue account.";
    case ReceivableFollowUpStatus.RESOLVED:
      return "The receivables follow-up case was resolved.";
  }
}

export async function advanceReceivableFollowUp(input: {
  billId: string;
  nextStatus: Exclude<ReceivableFollowUpStatus, "DISCONNECTED" | "RESOLVED">;
  actorId: string;
}) {
  await syncReceivableStatuses();

  const bill = await prisma.bill.findUnique({
    where: {
      id: input.billId,
    },
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
          name: true,
          accountNumber: true,
          status: true,
          email: true,
          contactNumber: true,
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

  if (!bill) {
    throw new Error("That bill no longer exists.");
  }

  const operationalStatus = getOperationalBillStatus(bill);
  const outstandingBalance = getOutstandingBalance(bill.totalCharges, bill.payments);

  if (outstandingBalance <= 0) {
    throw new Error("This bill is already fully settled.");
  }

  if (bill.customer.status === CustomerStatus.DISCONNECTED) {
    throw new Error("Disconnected accounts must be reinstated by a manager or admin.");
  }

  if (operationalStatus !== BillStatus.OVERDUE && input.nextStatus !== ReceivableFollowUpStatus.CURRENT) {
    throw new Error("Only overdue bills can move into reminder or escalation stages.");
  }

  if (
    bill.followUpStatus === ReceivableFollowUpStatus.DISCONNECTED ||
    bill.followUpStatus === ReceivableFollowUpStatus.RESOLVED
  ) {
    throw new Error("This bill can no longer be changed from the current follow-up stage.");
  }

  if (input.nextStatus !== ReceivableFollowUpStatus.CURRENT) {
    const currentStage =
      followUpProgression[
        bill.followUpStatus as Exclude<ReceivableFollowUpStatus, "DISCONNECTED" | "RESOLVED">
      ];
    const nextStage = followUpProgression[input.nextStatus];

    if (nextStage - currentStage > 1) {
      throw new Error("Advance receivables follow-up one stage at a time.");
    }
  }

  await prisma.bill.update({
    where: {
      id: bill.id,
    },
    data: {
      status: operationalStatus,
      followUpStatus: input.nextStatus,
      followUpStatusUpdatedAt: new Date(),
      followUpUpdatedById: input.actorId,
      followUpNote: getDefaultFollowUpNote(input.nextStatus),
    },
  });

  if (input.nextStatus === ReceivableFollowUpStatus.REMINDER_SENT) {
    await dispatchFollowUpNotifications({
      customer: {
        id: bill.customer.id,
        name: bill.customer.name,
        accountNumber: bill.customer.accountNumber,
        email: bill.customer.email,
        contactNumber: bill.customer.contactNumber,
      },
      bill: {
        id: bill.id,
        billingPeriod: bill.billingPeriod,
        dueDate: bill.dueDate,
        outstandingBalance,
      },
      template: NotificationTemplate.FOLLOW_UP_REMINDER,
      triggeredById: input.actorId,
    }).catch(() => undefined);
  }

  if (input.nextStatus === ReceivableFollowUpStatus.FINAL_NOTICE_SENT) {
    await dispatchFollowUpNotifications({
      customer: {
        id: bill.customer.id,
        name: bill.customer.name,
        accountNumber: bill.customer.accountNumber,
        email: bill.customer.email,
        contactNumber: bill.customer.contactNumber,
      },
      bill: {
        id: bill.id,
        billingPeriod: bill.billingPeriod,
        dueDate: bill.dueDate,
        outstandingBalance,
      },
      template: NotificationTemplate.FINAL_NOTICE,
      triggeredById: input.actorId,
    }).catch(() => undefined);
  }

  return {
    billId: bill.id,
    customerName: bill.customer.name,
    accountNumber: bill.customer.accountNumber,
    nextStatus: input.nextStatus,
  };
}
