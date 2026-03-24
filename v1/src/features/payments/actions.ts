"use server";

import { BillStatus, PaymentStatus, Prisma, ReceivableFollowUpStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requireStaffCapability } from "@/features/auth/lib/authorization";
import {
  getOperationalBillStatus,
  getOutstandingBalance,
  syncReceivableStatuses,
} from "@/features/follow-up/lib/workflow";
import { createReceiptNumber } from "@/features/payments/lib/receipt-number";
import {
  paymentFormSchema,
  type PaymentFormInput,
} from "@/features/payments/lib/payment-schema";
import { prisma } from "@/lib/prisma";

export async function recordPayment(values: PaymentFormInput) {
  const staffUser = await requireStaffCapability("payments:record");
  await syncReceivableStatuses();

  const parsedValues = paymentFormSchema.safeParse(values);

  if (!parsedValues.success) {
    throw new Error(parsedValues.error.issues[0]?.message || "Invalid payment data.");
  }

  const payment = await prisma.$transaction(async (tx) => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const bill = await tx.bill.findUnique({
          where: {
            id: parsedValues.data.billId,
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

        if (parsedValues.data.amount - outstandingBalance > 0.000001) {
          throw new Error(
            `Payment amount cannot exceed the remaining balance of ${outstandingBalance.toFixed(2)}.`
          );
        }

        const updatedPaidTotal = completedPaymentsTotal + parsedValues.data.amount;
        const nextBillStatus =
          updatedPaidTotal + 0.000001 >= bill.totalCharges
            ? BillStatus.PAID
            : getOperationalBillStatus({
                dueDate: bill.dueDate,
                totalCharges: bill.totalCharges,
                payments: [...bill.payments, { amount: parsedValues.data.amount }],
              });
        const balanceAfter = Math.max(0, outstandingBalance - parsedValues.data.amount);

        const createdPayment = await tx.payment.create({
          data: {
            receiptNumber: createReceiptNumber(),
            amount: parsedValues.data.amount,
            method: parsedValues.data.method,
            referenceId: parsedValues.data.referenceId || null,
            balanceBefore: outstandingBalance,
            balanceAfter,
            recordedById: staffUser.id,
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
            followUpUpdatedById: nextBillStatus === BillStatus.PAID ? staffUser.id : undefined,
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

  revalidatePath("/admin/payments");
  revalidatePath("/admin/billing");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/collections");
  revalidatePath("/admin/follow-up");
  revalidatePath(`/admin/payments/${payment.id}/receipt`);

  return payment;
}
