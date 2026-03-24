"use server";

import { BillStatus, Prisma, ReadingStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireStaffCapability } from "@/features/auth/lib/authorization";
import {
  calculateBillIssueDate,
  calculateBillDueDate,
  calculateProgressiveCharge,
  formatBillingPeriod,
} from "@/features/billing/lib/billing-calculations";

export async function generateBill(readingId: string) {
  await requireStaffCapability("billing:generate");

  const reading = await prisma.reading.findUnique({
    where: {
      id: readingId,
    },
    select: {
      id: true,
      status: true,
      consumption: true,
      readingDate: true,
      bill: {
        select: {
          id: true,
        },
      },
      meter: {
        select: {
          meterNumber: true,
          customer: {
            select: {
              id: true,
              accountNumber: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!reading) {
    throw new Error("That reading no longer exists.");
  }

  if (reading.status !== ReadingStatus.APPROVED) {
    throw new Error("Only approved readings can generate bills.");
  }

  if (reading.bill) {
    throw new Error("A bill has already been generated for that reading.");
  }

  if (!reading.meter.customer) {
    throw new Error("The selected meter must be assigned to a customer before billing.");
  }

  const activeTariff = await prisma.tariff.findFirst({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      minimumCharge: true,
      minimumUsage: true,
      tiers: {
        orderBy: {
          minVolume: "asc",
        },
        select: {
          minVolume: true,
          maxVolume: true,
          ratePerCuM: true,
        },
      },
    },
  });

  if (!activeTariff) {
    throw new Error("Create and activate a tariff before generating bills.");
  }

  const totalCharges = calculateProgressiveCharge(reading.consumption, activeTariff);
  const billingPeriod = formatBillingPeriod(reading.readingDate);
  const billIssueDate = calculateBillIssueDate(reading.readingDate);
  const dueDate = calculateBillDueDate(billIssueDate);

  let bill;

  try {
    bill = await prisma.bill.create({
      data: {
        billingPeriod,
        dueDate,
        customerId: reading.meter.customer.id,
        readingId: reading.id,
        usageAmount: reading.consumption,
        totalCharges,
        status: BillStatus.UNPAID,
      },
      select: {
        id: true,
        totalCharges: true,
        status: true,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("A bill has already been generated for that reading.");
    }

    throw error;
  }

  revalidatePath("/admin/billing");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/readings");

  return bill;
}
