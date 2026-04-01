import {
  BillStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  ReceivableFollowUpStatus,
} from "@prisma/client";

import {
  getOperationalBillStatus,
  getOutstandingBalance,
} from "@/features/follow-up/lib/workflow";
import { createReceiptNumber } from "@/features/payments/lib/receipt-number";
import { prisma } from "@/lib/prisma";

export async function recordPaymentForActor(input: {
  actorId: string;
  billId: string;
  amount: number;
  method: PaymentMethod;
  referenceId?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const bill = await tx.bill.findUnique({
          where: {
            id: input.billId,
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

        if (!bill) {
          throw new Error("That bill no longer exists.");
        }

        if (bill.status === BillStatus.PAID) {
          throw new Error("That bill is already fully paid.");
        }

        const completedPaymentsTotal = bill.payments.reduce(
          (sum, existingPayment) => sum + existingPayment.amount,
          0
        );
        const outstandingBalance = getOutstandingBalance(bill.totalCharges, bill.payments);

        if (input.amount - outstandingBalance > 0.000001) {
          throw new Error(
            `Payment amount cannot exceed the remaining balance of ${outstandingBalance.toFixed(2)}.`
          );
        }

        const updatedPaidTotal = completedPaymentsTotal + input.amount;
        const nextBillStatus =
          updatedPaidTotal + 0.000001 >= bill.totalCharges
            ? BillStatus.PAID
            : getOperationalBillStatus({
                dueDate: bill.dueDate,
                totalCharges: bill.totalCharges,
                payments: [...bill.payments, { amount: input.amount }],
              });
        const balanceAfter = Math.max(0, outstandingBalance - input.amount);

        const createdPayment = await tx.payment.create({
          data: {
            receiptNumber: createReceiptNumber(),
            amount: input.amount,
            method: input.method,
            referenceId: input.referenceId?.trim() ? input.referenceId.trim() : null,
            balanceBefore: outstandingBalance,
            balanceAfter,
            recordedById: input.actorId,
            billId: bill.id,
            status: PaymentStatus.COMPLETED,
          },
          select: {
            id: true,
            receiptNumber: true,
            amount: true,
            balanceAfter: true,
            method: true,
            billId: true,
          },
        });

        await tx.bill.update({
          where: {
            id: bill.id,
          },
          data: {
            status: nextBillStatus,
            followUpStatus:
              nextBillStatus === BillStatus.PAID
                ? ReceivableFollowUpStatus.RESOLVED
                : bill.followUpStatus,
            followUpStatusUpdatedAt: nextBillStatus === BillStatus.PAID ? new Date() : undefined,
            followUpUpdatedById: nextBillStatus === BillStatus.PAID ? input.actorId : undefined,
            followUpNote:
              nextBillStatus === BillStatus.PAID
                ? "The bill was fully settled and the receivables follow-up case was closed."
                : undefined,
          },
        });

        return createdPayment;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002" &&
          Array.isArray(error.meta?.target) &&
          error.meta.target.includes("receiptNumber")
        ) {
          continue;
        }

        throw error;
      }
    }

    throw new Error("Unable to allocate a unique official receipt number.");
  });
}
