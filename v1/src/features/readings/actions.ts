"use server";

import { auth } from "@clerk/nextjs/server";
import { ReadingStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

import {
  readingFormSchema,
  type ReadingFormInput,
} from "@/features/readings/lib/reading-schema";

async function requireAuthenticatedReader() {
  const { userId, isAuthenticated } = await auth();

  if (!isAuthenticated || !userId) {
    throw new Error("You must be signed in to log a meter reading.");
  }

  const localUser = await prisma.user.findUnique({
    where: {
      clerkId: userId,
    },
    select: {
      id: true,
      active: true,
      name: true,
    },
  });

  if (!localUser || !localUser.active) {
    throw new Error(
      "Your local staff profile is unavailable. Re-open the dashboard and let account sync complete."
    );
  }

  return localUser;
}

export async function createReading(values: ReadingFormInput) {
  const localUser = await requireAuthenticatedReader();

  const parsedValues = readingFormSchema.safeParse(values);

  if (!parsedValues.success) {
    throw new Error(parsedValues.error.issues[0]?.message || "Invalid reading data.");
  }

  const meter = await prisma.meter.findUnique({
    where: {
      id: parsedValues.data.meterId,
    },
    select: {
      id: true,
      meterNumber: true,
      customerId: true,
      readings: {
        orderBy: {
          readingDate: "desc",
        },
        take: 1,
        select: {
          currentReading: true,
        },
      },
    },
  });

  if (!meter) {
    throw new Error("The selected meter no longer exists.");
  }

  if (!meter.customerId) {
    throw new Error("Assign this meter to a customer before encoding readings.");
  }

  const previousReading = meter.readings[0]?.currentReading ?? 0;

  if (parsedValues.data.currentReading <= previousReading) {
    throw new Error(
      `Current reading must be greater than the previous reading of ${previousReading}.`
    );
  }

  const consumption = parsedValues.data.currentReading - previousReading;

  const reading = await prisma.reading.create({
    data: {
      meterId: meter.id,
      readerId: localUser.id,
      previousReading,
      currentReading: parsedValues.data.currentReading,
      consumption,
      status: ReadingStatus.PENDING_REVIEW,
    },
    select: {
      id: true,
      consumption: true,
      status: true,
    },
  });

  revalidatePath("/admin/readings");
  revalidatePath("/admin/dashboard");

  return reading;
}

export async function deleteReading(readingId: string) {
  await requireAuthenticatedReader();

  const reading = await prisma.reading.findUnique({
    where: {
      id: readingId,
    },
    select: {
      id: true,
      status: true,
      bill: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!reading) {
    throw new Error("That reading no longer exists.");
  }

  if (reading.bill) {
    throw new Error("Readings that already have a bill cannot be deleted.");
  }

  if (reading.status !== ReadingStatus.PENDING_REVIEW) {
    throw new Error("Only pending-review readings can be deleted.");
  }

  await prisma.reading.delete({
    where: {
      id: reading.id,
    },
  });

  revalidatePath("/admin/readings");
  revalidatePath("/admin/dashboard");
}
