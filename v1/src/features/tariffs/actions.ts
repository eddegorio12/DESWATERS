"use server";

import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

import {
  tariffFormSchema,
  type TariffFormValues,
} from "@/features/tariffs/lib/tariff-schema";

async function requireAuthenticatedUser() {
  const { userId, isAuthenticated } = await auth();

  if (!isAuthenticated || !userId) {
    throw new Error("You must be signed in to manage tariffs.");
  }
}

export async function createTariff(values: TariffFormValues) {
  await requireAuthenticatedUser();

  const parsedValues = tariffFormSchema.safeParse(values);

  if (!parsedValues.success) {
    throw new Error(parsedValues.error.issues[0]?.message || "Invalid tariff data.");
  }

  try {
    const tariff = await prisma.$transaction(async (tx) => {
      await tx.tariff.updateMany({
        where: {
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });

      return tx.tariff.create({
        data: {
          name: parsedValues.data.name,
          isActive: true,
          minimumCharge: parsedValues.data.minimumCharge,
          minimumUsage: parsedValues.data.minimumUsage,
          installationFee: parsedValues.data.installationFee,
          tiers: {
            create: parsedValues.data.tiers.map((tier) => ({
              minVolume: tier.minVolume,
              maxVolume: tier.maxVolume,
              ratePerCuM: tier.ratePerCuM,
            })),
          },
        },
        select: {
          id: true,
          name: true,
          isActive: true,
        },
      });
    });

    revalidatePath("/admin/tariffs");
    revalidatePath("/admin/dashboard");

    return tariff;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("A tariff with that name already exists.");
    }

    throw error;
  }
}
