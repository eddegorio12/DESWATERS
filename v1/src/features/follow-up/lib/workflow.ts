import { BillStatus, PaymentStatus, ReceivableFollowUpStatus } from "@prisma/client";

import { getTodayCollectionRange } from "@/features/reports/lib/collections";
import { prisma } from "@/lib/prisma";

type BillStatusSnapshot = {
  id: string;
  dueDate: Date;
  totalCharges: number;
  status: BillStatus;
  followUpStatus: ReceivableFollowUpStatus;
  payments: {
    amount: number;
  }[];
};

export function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export function getOutstandingBalance(
  totalCharges: number,
  payments: { amount: number }[]
) {
  return roundCurrency(
    Math.max(0, totalCharges - payments.reduce((sum, payment) => sum + payment.amount, 0))
  );
}

export function getOperationalBillStatus(
  bill: Pick<BillStatusSnapshot, "dueDate" | "totalCharges" | "payments">,
  now = new Date()
) {
  const outstandingBalance = getOutstandingBalance(bill.totalCharges, bill.payments);

  if (outstandingBalance <= 0) {
    return BillStatus.PAID;
  }

  const { start: todayStart } = getTodayCollectionRange(now);
  const isOverdue = bill.dueDate.getTime() < todayStart.getTime();
  const hasPartialSettlement = outstandingBalance + 0.000001 < bill.totalCharges;

  if (isOverdue) {
    return BillStatus.OVERDUE;
  }

  return hasPartialSettlement ? BillStatus.PARTIALLY_PAID : BillStatus.UNPAID;
}

export async function syncReceivableStatuses(now = new Date()) {
  const openBills = await prisma.bill.findMany({
    where: {
      status: {
        in: [BillStatus.UNPAID, BillStatus.PARTIALLY_PAID, BillStatus.OVERDUE],
      },
    },
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
  });

  const updates = openBills
    .map((bill) => ({
      id: bill.id,
      nextStatus: getOperationalBillStatus(bill, now),
      followUpStatus: bill.followUpStatus,
      currentStatus: bill.status,
    }))
    .filter((bill) => bill.nextStatus !== bill.currentStatus);

  if (!updates.length) {
    return;
  }

  await prisma.$transaction(
    updates.map((bill) =>
      prisma.bill.update({
        where: {
          id: bill.id,
        },
        data: {
          status: bill.nextStatus,
        },
      })
    )
  );
}

export function getDaysPastDue(dueDate: Date, now = new Date()) {
  const { start: todayStart } = getTodayCollectionRange(now);

  if (dueDate.getTime() >= todayStart.getTime()) {
    return 0;
  }

  return Math.floor((todayStart.getTime() - dueDate.getTime()) / 86_400_000);
}
