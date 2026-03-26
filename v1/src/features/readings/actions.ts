"use server";

import { ReadingStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireStaffCapability } from "@/features/auth/lib/authorization";

import {
  readingFormSchema,
  type ReadingFormInput,
} from "@/features/readings/lib/reading-schema";

export async function createReading(values: ReadingFormInput) {
  const localUser = await requireStaffCapability("readings:create");

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
  revalidatePath("/admin/routes");

  return reading;
}

export async function deleteReading(readingId: string) {
  const localUser = await requireStaffCapability("readings:delete:own");

  const reading = await prisma.reading.findUnique({
    where: {
      id: readingId,
    },
    select: {
      id: true,
      status: true,
      readerId: true,
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

  const canDeleteAny = localUser.role === "SUPER_ADMIN" || localUser.role === "ADMIN";

  if (!canDeleteAny && reading.readerId !== localUser.id) {
    throw new Error("You can only delete your own pending readings.");
  }

  await prisma.reading.delete({
    where: {
      id: reading.id,
    },
  });

  revalidatePath("/admin/readings");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/routes");
}

export async function approveReading(readingId: string) {
  await requireStaffCapability("readings:approve");

  const reading = await prisma.reading.findUnique({
    where: {
      id: readingId,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!reading) {
    throw new Error("That reading no longer exists.");
  }

  if (reading.status !== ReadingStatus.PENDING_REVIEW) {
    throw new Error("Only pending-review readings can be approved.");
  }

  const approvedReading = await prisma.reading.update({
    where: {
      id: reading.id,
    },
    data: {
      status: ReadingStatus.APPROVED,
    },
    select: {
      id: true,
      status: true,
    },
  });

  revalidatePath("/admin/readings");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/routes");

  return approvedReading;
}

export async function approveReadings(readingIds: string[]) {
  await requireStaffCapability("readings:approve");

  const uniqueReadingIds = [...new Set(readingIds.filter(Boolean))];

  if (uniqueReadingIds.length === 0) {
    throw new Error("Select at least one pending reading to approve.");
  }

  const readings = await prisma.reading.findMany({
    where: {
      id: {
        in: uniqueReadingIds,
      },
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (readings.length !== uniqueReadingIds.length) {
    throw new Error("One or more selected readings no longer exist.");
  }

  const nonPendingReading = readings.find(
    (reading) => reading.status !== ReadingStatus.PENDING_REVIEW
  );

  if (nonPendingReading) {
    throw new Error("Only pending-review readings can be bulk approved.");
  }

  const result = await prisma.reading.updateMany({
    where: {
      id: {
        in: uniqueReadingIds,
      },
      status: ReadingStatus.PENDING_REVIEW,
    },
    data: {
      status: ReadingStatus.APPROVED,
    },
  });

  revalidatePath("/admin/readings");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/routes");

  return {
    approvedCount: result.count,
  };
}
