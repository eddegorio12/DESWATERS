"use server";

import {
  BillStatus,
  CustomerStatus,
  NotificationTemplate,
  PaymentStatus,
  ReceivableFollowUpStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requireStaffCapability } from "@/features/auth/lib/authorization";
import {
  getOperationalBillStatus,
  getOutstandingBalance,
  syncReceivableStatuses,
} from "@/features/follow-up/lib/workflow";
import { dispatchFollowUpNotifications } from "@/features/notifications/lib/dispatch";
import { createPrintedNoticeLog } from "@/features/notices/lib/logging";
import { prisma } from "@/lib/prisma";

const followUpProgression: Record<
  Exclude<ReceivableFollowUpStatus, "DISCONNECTED" | "RESOLVED">,
  number
> = {
  CURRENT: 0,
  REMINDER_SENT: 1,
  FINAL_NOTICE_SENT: 2,
  DISCONNECTION_REVIEW: 3,
};

function revalidateOperationalSurfaces() {
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/billing");
  revalidatePath("/admin/payments");
  revalidatePath("/admin/collections");
  revalidatePath("/admin/follow-up");
}

function getDefaultFollowUpNote(status: ReceivableFollowUpStatus) {
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

export async function updateReceivableFollowUp(
  billId: string,
  nextStatus: Exclude<ReceivableFollowUpStatus, "DISCONNECTED" | "RESOLVED">
) {
  const staffUser = await requireStaffCapability("followup:update");
  await syncReceivableStatuses();

  const bill = await prisma.bill.findUnique({
    where: {
      id: billId,
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

  if (operationalStatus !== BillStatus.OVERDUE && nextStatus !== ReceivableFollowUpStatus.CURRENT) {
    throw new Error("Only overdue bills can move into reminder or escalation stages.");
  }

  if (
    bill.followUpStatus === ReceivableFollowUpStatus.DISCONNECTED ||
    bill.followUpStatus === ReceivableFollowUpStatus.RESOLVED
  ) {
    throw new Error("This bill can no longer be changed from the current follow-up stage.");
  }

  if (nextStatus !== ReceivableFollowUpStatus.CURRENT) {
    const currentStage =
      followUpProgression[
        bill.followUpStatus as Exclude<ReceivableFollowUpStatus, "DISCONNECTED" | "RESOLVED">
      ];
    const nextStage = followUpProgression[nextStatus];

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
      followUpStatus: nextStatus,
      followUpStatusUpdatedAt: new Date(),
      followUpUpdatedById: staffUser.id,
      followUpNote: getDefaultFollowUpNote(nextStatus),
    },
  });

  if (nextStatus === ReceivableFollowUpStatus.REMINDER_SENT) {
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
      triggeredById: staffUser.id,
    }).catch(() => undefined);
  }

  if (nextStatus === ReceivableFollowUpStatus.FINAL_NOTICE_SENT) {
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
      triggeredById: staffUser.id,
    }).catch(() => undefined);
  }

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
