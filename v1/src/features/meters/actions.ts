"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireStaffCapability } from "@/features/auth/lib/authorization";

import {
  meterAssignmentSchema,
  meterFormSchema,
  meterHolderTransferSchema,
  type MeterAssignmentInput,
  type MeterFormInput,
  type MeterHolderTransferInput,
} from "@/features/meters/lib/meter-schema";

function normalizeInstallDate(installDate: string) {
  return new Date(`${installDate}T00:00:00`);
}

export async function registerMeter(values: MeterFormInput) {
  await requireStaffCapability("meters:register");

  const parsedValues = meterFormSchema.safeParse(values);

  if (!parsedValues.success) {
    throw new Error(parsedValues.error.issues[0]?.message || "Invalid meter data.");
  }

  try {
    const meter = await prisma.meter.create({
      data: {
        meterNumber: parsedValues.data.meterNumber,
        installDate: normalizeInstallDate(parsedValues.data.installDate),
      },
      select: {
        id: true,
        meterNumber: true,
      },
    });

    revalidatePath("/admin/meters");
    revalidatePath("/admin/customers");
    revalidatePath("/admin/dashboard");

    return meter;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("That meter number is already registered.");
    }

    throw error;
  }
}

export async function assignMeterToCustomer(values: MeterAssignmentInput) {
  await requireStaffCapability("meters:assign");

  const parsedValues = meterAssignmentSchema.safeParse(values);

  if (!parsedValues.success) {
    throw new Error(parsedValues.error.issues[0]?.message || "Invalid assignment data.");
  }

  const [meter, customer] = await Promise.all([
    prisma.meter.findUnique({
      where: { id: parsedValues.data.meterId },
      select: {
        id: true,
        meterNumber: true,
        customerId: true,
      },
    }),
    prisma.customer.findUnique({
      where: { id: parsedValues.data.customerId },
      select: {
        id: true,
        accountNumber: true,
        name: true,
      },
    }),
  ]);

  if (!meter) {
    throw new Error("The selected meter no longer exists.");
  }

  if (!customer) {
    throw new Error("The selected customer no longer exists.");
  }

  if (meter.customerId) {
    throw new Error("That meter has already been assigned.");
  }

  const assignedMeter = await prisma.$transaction(async (tx) => {
    const nextMeter = await tx.meter.update({
      where: { id: meter.id },
      data: {
        customerId: customer.id,
      },
      select: {
        id: true,
        meterNumber: true,
        customer: {
          select: {
            id: true,
            accountNumber: true,
            name: true,
          },
        },
      },
    });

    await tx.meterHolderTransfer.create({
      data: {
        meterId: meter.id,
        toCustomerId: customer.id,
        effectiveDate: new Date(),
      },
    });

    return nextMeter;
  });

  revalidatePath("/admin/meters");
  revalidatePath("/admin/customers");
  revalidatePath("/admin/dashboard");

  return assignedMeter;
}

export async function transferMeterHolder(values: MeterHolderTransferInput) {
  await requireStaffCapability("meters:transfer");

  const parsedValues = meterHolderTransferSchema.safeParse(values);

  if (!parsedValues.success) {
    throw new Error(parsedValues.error.issues[0]?.message || "Invalid transfer data.");
  }

  const effectiveDate = normalizeInstallDate(parsedValues.data.effectiveDate);

  const [meter, customer] = await Promise.all([
    prisma.meter.findUnique({
      where: { id: parsedValues.data.meterId },
      select: {
        id: true,
        meterNumber: true,
        customerId: true,
        customer: {
          select: {
            id: true,
            accountNumber: true,
            name: true,
          },
        },
      },
    }),
    prisma.customer.findUnique({
      where: { id: parsedValues.data.customerId },
      select: {
        id: true,
        accountNumber: true,
        name: true,
      },
    }),
  ]);

  if (!meter) {
    throw new Error("The selected meter no longer exists.");
  }

  if (!meter.customerId || !meter.customer) {
    throw new Error("Assign this meter first before replacing the current account holder.");
  }

  if (!customer) {
    throw new Error("The selected customer no longer exists.");
  }

  if (meter.customerId === customer.id) {
    throw new Error("Select a different customer to replace the current account holder.");
  }

  const transferredMeter = await prisma.$transaction(async (tx) => {
    const nextMeter = await tx.meter.update({
      where: { id: meter.id },
      data: {
        customerId: customer.id,
      },
      select: {
        id: true,
        meterNumber: true,
        customer: {
          select: {
            id: true,
            accountNumber: true,
            name: true,
          },
        },
      },
    });

    await tx.meterHolderTransfer.create({
      data: {
        meterId: meter.id,
        fromCustomerId: meter.customerId,
        toCustomerId: customer.id,
        effectiveDate,
        transferReading: parsedValues.data.transferReading,
        reason: parsedValues.data.reason,
      },
    });

    return nextMeter;
  });

  revalidatePath("/admin/meters");
  revalidatePath("/admin/customers");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/readings");
  revalidatePath("/admin/billing");

  return transferredMeter;
}
