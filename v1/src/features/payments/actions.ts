"use server";

import { BillStatus, PaymentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { paymentFormSchema, type PaymentFormInput } from "@/features/payments/lib/payment-schema";
import { requireStaffCapability } from "@/features/auth/lib/authorization";
import { prisma } from "@/lib/prisma";

export async function recordPayment(values: PaymentFormInput) {
  await requireStaffCapability("payments:record");

  const parsedValues = paymentFormSchema.safeParse(values);

  if (!parsedValues.success) {
    throw new Error(parsedValues.error.issues[0]?.message || "Invalid payment data.");
  }

  const payment = await prisma.$transaction(async (tx) => {
    const bill = await tx.bill.findUnique({
      where: {
        id: parsedValues.data.billId,
      },
      select: {
        id: true,
        totalCharges: true,
        status: true,
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
    const outstandingBalance = Math.max(0, bill.totalCharges - completedPaymentsTotal);

    if (parsedValues.data.amount - outstandingBalance > 0.000001) {
      throw new Error(
        `Payment amount cannot exceed the remaining balance of ${outstandingBalance.toFixed(2)}.`
      );
    }

    const updatedPaidTotal = completedPaymentsTotal + parsedValues.data.amount;
    const nextBillStatus =
      updatedPaidTotal + 0.000001 >= bill.totalCharges
        ? BillStatus.PAID
        : BillStatus.PARTIALLY_PAID;

    const createdPayment = await tx.payment.create({
      data: {
        amount: parsedValues.data.amount,
        method: parsedValues.data.method,
        referenceId: parsedValues.data.referenceId || null,
        billId: bill.id,
        status: PaymentStatus.COMPLETED,
      },
      select: {
        id: true,
        amount: true,
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
      },
    });

    return createdPayment;
  });

  revalidatePath("/admin/payments");
  revalidatePath("/admin/billing");
  revalidatePath("/admin/dashboard");

  return payment;
}
