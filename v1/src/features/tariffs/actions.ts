"use server";

import { Prisma, TariffAuditEventType } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireStaffCapability } from "@/features/auth/lib/authorization";

import {
  tariffFormSchema,
  type TariffFormValues,
} from "@/features/tariffs/lib/tariff-schema";

function parseEffectiveDate(value: string) {
  const parsedDate = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error("Choose a valid effectivity date.");
  }

  return parsedDate;
}

export async function createTariff(values: TariffFormValues) {
  const staffUser = await requireStaffCapability("tariffs:create");

  const parsedValues = tariffFormSchema.safeParse(values);

  if (!parsedValues.success) {
    throw new Error(parsedValues.error.issues[0]?.message || "Invalid tariff data.");
  }

  const effectiveFrom = parseEffectiveDate(parsedValues.data.effectiveFrom);

  try {
    const tariff = await prisma.$transaction(async (tx) => {
      const latestTariff = await tx.tariff.findFirst({
        orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          version: true,
          effectiveFrom: true,
          effectiveTo: true,
        },
      });

      if (latestTariff && effectiveFrom <= latestTariff.effectiveFrom) {
        throw new Error(
          "New tariff effectivity must be later than the most recent saved tariff version."
        );
      }

      const now = new Date();
      const isImmediatelyEffective = effectiveFrom <= now;
      const nextVersion = (latestTariff?.version ?? 0) + 1;
      const previousTariffRetirementDate = new Date(effectiveFrom);
      previousTariffRetirementDate.setDate(previousTariffRetirementDate.getDate() - 1);

      if (latestTariff) {
        await tx.tariff.update({
          where: {
            id: latestTariff.id,
          },
          data: {
            isActive: isImmediatelyEffective ? false : undefined,
            effectiveTo:
              !latestTariff.effectiveTo || latestTariff.effectiveTo > previousTariffRetirementDate
                ? previousTariffRetirementDate
                : latestTariff.effectiveTo,
          },
        });

        await tx.tariffAuditEvent.create({
          data: {
            tariffId: latestTariff.id,
            actorId: staffUser.id,
            type: TariffAuditEventType.RETIRED,
            note: `Superseded by tariff version ${nextVersion} effective ${parsedValues.data.effectiveFrom}.`,
          },
        });
      }

      const createdTariff = await tx.tariff.create({
        data: {
          name: parsedValues.data.name,
          isActive: isImmediatelyEffective,
          version: nextVersion,
          effectiveFrom,
          changeReason: parsedValues.data.changeReason,
          minimumCharge: parsedValues.data.minimumCharge,
          minimumUsage: parsedValues.data.minimumUsage,
          installationFee: parsedValues.data.installationFee,
          penaltyRate: parsedValues.data.penaltyRate,
          reconnectionFee: parsedValues.data.reconnectionFee,
          createdById: staffUser.id,
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
          version: true,
        },
      });

      await tx.tariffAuditEvent.create({
        data: {
          tariffId: createdTariff.id,
          actorId: staffUser.id,
          type: TariffAuditEventType.CREATED,
          note: parsedValues.data.changeReason,
        },
      });

      return createdTariff;
    });

    revalidatePath("/admin/tariffs");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/billing");

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
