"use server";

import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

import {
  meterAssignmentSchema,
  meterFormSchema,
  type MeterAssignmentInput,
  type MeterFormInput,
} from "@/features/meters/lib/meter-schema";

async function requireAuthenticatedUser() {
  const { userId, isAuthenticated } = await auth();

  if (!isAuthenticated || !userId) {
    throw new Error("You must be signed in to manage meters.");
  }
}

function normalizeInstallDate(installDate: string) {
  return new Date(`${installDate}T00:00:00`);
}

export async function registerMeter(values: MeterFormInput) {
  await requireAuthenticatedUser();

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
  await requireAuthenticatedUser();

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

  const assignedMeter = await prisma.meter.update({
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

  revalidatePath("/admin/meters");
  revalidatePath("/admin/customers");
  revalidatePath("/admin/dashboard");

  return assignedMeter;
}
