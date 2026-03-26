"use server";

import {
  BillDistributionStatus,
  BillLifecycleStatus,
  BillPrintBatchStatus,
  BillPrintGrouping,
  BillStatus,
  BillingCycleEventType,
  BillingCycleStatus,
  PaymentStatus,
  Prisma,
  ReadingStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requireStaffCapability } from "@/features/auth/lib/authorization";
import {
  getBillingCyclePeriodKey,
  isBillingChecklistComplete,
  mapBatchStatusToBillDistributionStatus,
} from "@/features/billing/lib/billing-governance";
import {
  calculateBillDueDate,
  calculateBillIssueDate,
  calculateProgressiveCharge,
  formatBillingPeriod,
} from "@/features/billing/lib/billing-calculations";
import { syncReceivableStatuses } from "@/features/follow-up/lib/workflow";
import { prisma } from "@/lib/prisma";

type ActiveTariffSnapshot = {
  id: string;
  name: string;
  version: number;
  effectiveFrom: Date;
  minimumCharge: number;
  minimumUsage: number;
  penaltyRate: number;
  reconnectionFee: number;
  installationFee: number;
  tiers: {
    minVolume: number;
    maxVolume: number | null;
    ratePerCuM: number;
  }[];
};

type ReadingForBilling = {
  id: string;
  consumption: number;
  readingDate: Date;
  meter: {
    customer: {
      id: string;
    } | null;
  };
};

type BillingChecklistInput = {
  billingCycleId: string;
  checklistReviewCompleted: boolean;
  checklistReceivablesVerified: boolean;
  checklistPrintReady: boolean;
  checklistDistributionReady: boolean;
  checklistMonthEndLocked: boolean;
};

type CreateBillPrintBatchInput = {
  billingCycleId: string;
  billIds: string[];
  label: string;
  grouping: BillPrintGrouping;
  groupingValue?: string;
  assignedToId?: string;
  notes?: string;
};

type UpdateBillPrintBatchStatusInput = {
  billPrintBatchId: string;
  status: BillPrintBatchStatus;
  note?: string;
};

function revalidateBillingPaths() {
  revalidatePath("/admin/billing");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/collections");
  revalidatePath("/admin/follow-up");
  revalidatePath("/admin/readings");
  revalidatePath("/admin/payments");
  revalidatePath("/admin/routes");
}

async function getActiveTariffOrThrow() {
  const now = new Date();
  const activeTariff = await prisma.tariff.findFirst({
    where: {
      effectiveFrom: {
        lte: now,
      },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
    },
    orderBy: [{ effectiveFrom: "desc" }, { version: "desc" }],
    select: {
      id: true,
      name: true,
      version: true,
      effectiveFrom: true,
      minimumCharge: true,
      minimumUsage: true,
      penaltyRate: true,
      reconnectionFee: true,
      installationFee: true,
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

  return activeTariff satisfies ActiveTariffSnapshot;
}

function buildBillMutationPayload(reading: ReadingForBilling, activeTariff: ActiveTariffSnapshot) {
  if (!reading.meter.customer) {
    throw new Error("The selected meter must be assigned to a customer before billing.");
  }

  const totalCharges = calculateProgressiveCharge(reading.consumption, activeTariff);
  const billingPeriod = formatBillingPeriod(reading.readingDate);
  const billIssueDate = calculateBillIssueDate(reading.readingDate);
  const dueDate = calculateBillDueDate(billIssueDate);

  return {
    billingPeriod,
    tariffId: activeTariff.id,
    dueDate,
    customerId: reading.meter.customer.id,
    readingId: reading.id,
    usageAmount: reading.consumption,
    totalCharges,
    status: BillStatus.UNPAID,
    lifecycleStatus: BillLifecycleStatus.DRAFT,
    distributionStatus: BillDistributionStatus.PENDING_PRINT,
  };
}

async function ensureCycleIsOpen(cycleId: string) {
  const cycle = await prisma.billingCycle.findUnique({
    where: {
      id: cycleId,
    },
    select: {
      id: true,
      status: true,
      billingPeriodLabel: true,
    },
  });

  if (!cycle) {
    throw new Error("That billing cycle no longer exists.");
  }

  if (cycle.status !== BillingCycleStatus.OPEN) {
    throw new Error(
      `The ${cycle.billingPeriodLabel} billing cycle is ${cycle.status.toLowerCase()} and cannot accept this change.`
    );
  }

  return cycle;
}

export async function generateBill(readingId: string) {
  const staffUser = await requireStaffCapability("billing:generate");

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
          customer: {
            select: {
              id: true,
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

  const activeTariff = await getActiveTariffOrThrow();
  const periodKey = getBillingCyclePeriodKey(reading.readingDate);
  const billingPeriod = formatBillingPeriod(reading.readingDate);

  let bill;

  try {
    bill = await prisma.$transaction(async (tx) => {
      let cycle = await tx.billingCycle.findUnique({
        where: {
          periodKey,
        },
        select: {
          id: true,
          status: true,
        },
      });

      if (!cycle) {
        cycle = await tx.billingCycle.create({
          data: {
            periodKey,
            billingPeriodLabel: billingPeriod,
          },
          select: {
            id: true,
            status: true,
          },
        });

        await tx.billingCycleEvent.create({
          data: {
            billingCycleId: cycle.id,
            actorId: staffUser.id,
            type: BillingCycleEventType.CYCLE_CREATED,
            note: `Billing cycle ${billingPeriod} was opened automatically during bill generation.`,
          },
        });
      }

      if (cycle.status !== BillingCycleStatus.OPEN) {
        throw new Error(
          `The ${billingPeriod} billing cycle is ${cycle.status.toLowerCase()} and cannot accept new bills.`
        );
      }

      return tx.bill.create({
        data: {
          ...buildBillMutationPayload(reading, activeTariff),
          billingCycleId: cycle.id,
        },
        select: {
          id: true,
          totalCharges: true,
          status: true,
          lifecycleStatus: true,
        },
      });
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

  revalidateBillingPaths();

  return bill;
}

export async function updateBillingCycleChecklist(values: BillingChecklistInput) {
  const staffUser = await requireStaffCapability("billing:finalize");

  const cycle = await prisma.billingCycle.findUnique({
    where: {
      id: values.billingCycleId,
    },
    select: {
      id: true,
      status: true,
      checklistReviewCompleted: true,
      checklistReceivablesVerified: true,
      checklistPrintReady: true,
      checklistDistributionReady: true,
      checklistMonthEndLocked: true,
    },
  });

  if (!cycle) {
    throw new Error("That billing cycle no longer exists.");
  }

  if (cycle.status === BillingCycleStatus.FINALIZED) {
    throw new Error("Finalized billing cycles can no longer change the month-end checklist.");
  }

  await prisma.$transaction([
    prisma.billingCycle.update({
      where: {
        id: values.billingCycleId,
      },
      data: {
        checklistReviewCompleted: values.checklistReviewCompleted,
        checklistReceivablesVerified: values.checklistReceivablesVerified,
        checklistPrintReady: values.checklistPrintReady,
        checklistDistributionReady: values.checklistDistributionReady,
        checklistMonthEndLocked: values.checklistMonthEndLocked,
      },
    }),
    prisma.billingCycleEvent.create({
      data: {
        billingCycleId: values.billingCycleId,
        actorId: staffUser.id,
        type: BillingCycleEventType.CHECKLIST_UPDATED,
        note: "Month-end checklist status was updated.",
      },
    }),
  ]);

  revalidateBillingPaths();
}

export async function closeBillingCycle(billingCycleId: string) {
  const staffUser = await requireStaffCapability("billing:finalize");
  const cycle = await ensureCycleIsOpen(billingCycleId);

  await prisma.$transaction([
    prisma.billingCycle.update({
      where: {
        id: billingCycleId,
      },
      data: {
        status: BillingCycleStatus.CLOSED,
        closedAt: new Date(),
        closedById: staffUser.id,
      },
    }),
    prisma.billingCycleEvent.create({
      data: {
        billingCycleId,
        actorId: staffUser.id,
        type: BillingCycleEventType.CYCLE_CLOSED,
        note: `Billing cycle ${cycle.billingPeriodLabel} was closed for review.`,
      },
    }),
  ]);

  revalidateBillingPaths();
}

export async function finalizeBillingCycle(billingCycleId: string) {
  const staffUser = await requireStaffCapability("billing:finalize");
  await syncReceivableStatuses();

  const cycle = await prisma.billingCycle.findUnique({
    where: {
      id: billingCycleId,
    },
    select: {
      id: true,
      billingPeriodLabel: true,
      status: true,
      checklistReviewCompleted: true,
      checklistReceivablesVerified: true,
      checklistPrintReady: true,
      checklistDistributionReady: true,
      checklistMonthEndLocked: true,
      bills: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!cycle) {
    throw new Error("That billing cycle no longer exists.");
  }

  if (cycle.status !== BillingCycleStatus.CLOSED) {
    throw new Error("Only closed billing cycles can be finalized.");
  }

  if (!cycle.bills.length) {
    throw new Error("Generate bills for this cycle before finalizing it.");
  }

  if (!isBillingChecklistComplete(cycle)) {
    throw new Error("Complete the month-end billing checklist before finalizing the cycle.");
  }

  const timestamp = new Date();

  await prisma.$transaction([
    prisma.billingCycle.update({
      where: {
        id: billingCycleId,
      },
      data: {
        status: BillingCycleStatus.FINALIZED,
        finalizedAt: timestamp,
        finalizedById: staffUser.id,
      },
    }),
    prisma.bill.updateMany({
      where: {
        billingCycleId,
      },
      data: {
        lifecycleStatus: BillLifecycleStatus.FINALIZED,
        finalizedAt: timestamp,
        finalizedById: staffUser.id,
      },
    }),
    prisma.billingCycleEvent.create({
      data: {
        billingCycleId,
        actorId: staffUser.id,
        type: BillingCycleEventType.CYCLE_FINALIZED,
        note: `Billing cycle ${cycle.billingPeriodLabel} was finalized and bill edits were locked.`,
      },
    }),
  ]);

  revalidateBillingPaths();
}

export async function reopenBillingCycle(billingCycleId: string, reason: string) {
  const staffUser = await requireStaffCapability("billing:reopen");

  const trimmedReason = reason.trim();

  if (!trimmedReason) {
    throw new Error("Provide an audit reason before reopening a billing cycle.");
  }

  const cycle = await prisma.billingCycle.findUnique({
    where: {
      id: billingCycleId,
    },
    select: {
      id: true,
      billingPeriodLabel: true,
      status: true,
      bills: {
        select: {
          id: true,
          payments: {
            where: {
              status: PaymentStatus.COMPLETED,
            },
            select: {
              id: true,
            },
          },
        },
      },
    },
  });

  if (!cycle) {
    throw new Error("That billing cycle no longer exists.");
  }

  if (cycle.status === BillingCycleStatus.OPEN) {
    throw new Error("That billing cycle is already open.");
  }

  if (cycle.bills.some((bill) => bill.payments.length > 0)) {
    throw new Error(
      "Billing cycles with posted payments cannot be reopened. Create corrective follow-up instead of rewriting settled records."
    );
  }

  await prisma.$transaction([
    prisma.billingCycle.update({
      where: {
        id: billingCycleId,
      },
      data: {
        status: BillingCycleStatus.OPEN,
        reopenedAt: new Date(),
        reopenedById: staffUser.id,
      },
    }),
    prisma.bill.updateMany({
      where: {
        billingCycleId,
      },
      data: {
        lifecycleStatus: BillLifecycleStatus.DRAFT,
        finalizedAt: null,
        finalizedById: null,
      },
    }),
    prisma.billingCycleEvent.create({
      data: {
        billingCycleId,
        actorId: staffUser.id,
        type: BillingCycleEventType.CYCLE_REOPENED,
        note: trimmedReason,
      },
    }),
  ]);

  revalidateBillingPaths();
}

export async function regenerateBillingCycleBills(billingCycleId: string, reason: string) {
  const staffUser = await requireStaffCapability("billing:regenerate");
  await syncReceivableStatuses();

  const trimmedReason = reason.trim();

  if (!trimmedReason) {
    throw new Error("Provide an audit reason before regenerating a bill batch.");
  }

  const cycle = await prisma.billingCycle.findUnique({
    where: {
      id: billingCycleId,
    },
    select: {
      id: true,
      status: true,
      billingPeriodLabel: true,
      bills: {
        select: {
          id: true,
          customerId: true,
          reading: {
            select: {
              id: true,
              status: true,
              consumption: true,
              readingDate: true,
              meter: {
                select: {
                  customer: {
                    select: {
                      id: true,
                    },
                  },
                },
              },
            },
          },
          payments: {
            where: {
              status: PaymentStatus.COMPLETED,
            },
            select: {
              id: true,
            },
          },
        },
      },
    },
  });

  if (!cycle) {
    throw new Error("That billing cycle no longer exists.");
  }

  if (cycle.status !== BillingCycleStatus.OPEN) {
    throw new Error("Only open billing cycles can regenerate a bill batch.");
  }

  if (!cycle.bills.length) {
    throw new Error("This billing cycle has no bills to regenerate.");
  }

  if (cycle.bills.some((bill) => bill.payments.length > 0)) {
    throw new Error(
      "Billing cycles with posted payments cannot be regenerated because the settled records are already in use."
    );
  }

  if (cycle.bills.some((bill) => bill.reading.status !== ReadingStatus.APPROVED)) {
    throw new Error(
      "All source readings must remain approved before this bill batch can be regenerated."
    );
  }

  const activeTariff = await getActiveTariffOrThrow();

  await prisma.$transaction(async (tx) => {
    await tx.bill.deleteMany({
      where: {
        billingCycleId,
      },
    });

    for (const existingBill of cycle.bills) {
      await tx.bill.create({
        data: {
          ...buildBillMutationPayload(existingBill.reading, activeTariff),
          billingCycleId,
          customerId: existingBill.customerId,
        },
      });
    }

    await tx.billingCycleEvent.create({
      data: {
        billingCycleId,
        actorId: staffUser.id,
        type: BillingCycleEventType.BILLS_REGENERATED,
        note: trimmedReason,
      },
    });
  });

  revalidateBillingPaths();
}

export async function createBillPrintBatch(values: CreateBillPrintBatchInput) {
  const staffUser = await requireStaffCapability("billing:print");

  const label = values.label.trim();

  if (!label) {
    throw new Error("Provide a print-batch label before saving.");
  }

  const uniqueBillIds = Array.from(new Set(values.billIds));

  if (!uniqueBillIds.length) {
    throw new Error("Select at least one bill before creating a print batch.");
  }

  const cycle = await prisma.billingCycle.findUnique({
    where: {
      id: values.billingCycleId,
    },
    select: {
      id: true,
      status: true,
      bills: {
        where: {
          id: {
            in: uniqueBillIds,
          },
        },
        select: {
          id: true,
          reading: {
            select: {
              meter: {
                select: {
                  serviceZoneId: true,
                  serviceRouteId: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!cycle) {
    throw new Error("That billing cycle no longer exists.");
  }

  if (cycle.status === BillingCycleStatus.OPEN) {
    throw new Error("Close the billing cycle before preparing print batches.");
  }

  if (cycle.bills.length !== uniqueBillIds.length) {
    throw new Error("Some selected bills no longer belong to this billing cycle.");
  }

  const selectedRouteIds = Array.from(
    new Set(
      cycle.bills
        .map((bill) => bill.reading.meter.serviceRouteId)
        .filter((value): value is string => Boolean(value))
    )
  );
  const selectedZoneIds = Array.from(
    new Set(
      cycle.bills
        .map((bill) => bill.reading.meter.serviceZoneId)
        .filter((value): value is string => Boolean(value))
    )
  );

  if (values.grouping === BillPrintGrouping.ROUTE && selectedRouteIds.length !== 1) {
    throw new Error("Route-grouped print batches must contain bills from exactly one mapped route.");
  }

  if (values.grouping === BillPrintGrouping.ZONE && selectedZoneIds.length !== 1) {
    throw new Error("Zone-grouped print batches must contain bills from exactly one mapped zone.");
  }

  const createdBatch = await prisma.$transaction(async (tx) => {
    const batch = await tx.billPrintBatch.create({
      data: {
        billingCycleId: values.billingCycleId,
        label,
        grouping: values.grouping,
        groupingValue: values.groupingValue?.trim() || null,
        serviceZoneId: values.grouping === BillPrintGrouping.ZONE ? selectedZoneIds[0] : null,
        serviceRouteId: values.grouping === BillPrintGrouping.ROUTE ? selectedRouteIds[0] : null,
        assignedToId: values.assignedToId || null,
        notes: values.notes?.trim() || null,
        createdById: staffUser.id,
      },
      select: {
        id: true,
      },
    });

    await tx.bill.updateMany({
      where: {
        id: {
          in: uniqueBillIds,
        },
      },
      data: {
        printBatchId: batch.id,
        distributionStatus: BillDistributionStatus.PENDING_PRINT,
        deliveryNote: null,
      },
    });

    await tx.billingCycleEvent.create({
      data: {
        billingCycleId: values.billingCycleId,
        actorId: staffUser.id,
        type: BillingCycleEventType.PRINT_BATCH_CREATED,
        billPrintBatchId: batch.id,
        note: label,
      },
    });

    return batch;
  });

  revalidateBillingPaths();

  return createdBatch;
}

export async function updateBillPrintBatchStatus(values: UpdateBillPrintBatchStatusInput) {
  const staffUser = await requireStaffCapability("billing:distribute");

  const batch = await prisma.billPrintBatch.findUnique({
    where: {
      id: values.billPrintBatchId,
    },
    select: {
      id: true,
      billingCycleId: true,
      status: true,
      bills: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!batch) {
    throw new Error("That print batch no longer exists.");
  }

  const timestamp = new Date();
  const note = values.note?.trim() || null;
  const nextBillDistributionStatus = mapBatchStatusToBillDistributionStatus(values.status);

  const batchEventTypeMap: Record<BillPrintBatchStatus, BillingCycleEventType> = {
    DRAFT: BillingCycleEventType.PRINT_BATCH_CREATED,
    PRINTED: BillingCycleEventType.PRINT_BATCH_PRINTED,
    DISTRIBUTED: BillingCycleEventType.PRINT_BATCH_DISTRIBUTED,
    RETURNED: BillingCycleEventType.PRINT_BATCH_RETURNED,
    FAILED_DELIVERY: BillingCycleEventType.PRINT_BATCH_FAILED_DELIVERY,
  };

  await prisma.$transaction(async (tx) => {
    await tx.billPrintBatch.update({
      where: {
        id: values.billPrintBatchId,
      },
      data: {
        status: values.status,
        notes: note,
        printedAt: values.status === BillPrintBatchStatus.PRINTED ? timestamp : undefined,
        printedById: values.status === BillPrintBatchStatus.PRINTED ? staffUser.id : undefined,
        distributedAt:
          values.status === BillPrintBatchStatus.DISTRIBUTED ? timestamp : undefined,
        distributedById:
          values.status === BillPrintBatchStatus.DISTRIBUTED ? staffUser.id : undefined,
        returnedAt: values.status === BillPrintBatchStatus.RETURNED ? timestamp : undefined,
        returnedById: values.status === BillPrintBatchStatus.RETURNED ? staffUser.id : undefined,
        failedDeliveryAt:
          values.status === BillPrintBatchStatus.FAILED_DELIVERY ? timestamp : undefined,
        failedDeliveryById:
          values.status === BillPrintBatchStatus.FAILED_DELIVERY ? staffUser.id : undefined,
      },
    });

    await tx.bill.updateMany({
      where: {
        id: {
          in: batch.bills.map((bill) => bill.id),
        },
      },
      data: {
        distributionStatus: nextBillDistributionStatus,
        printedAt:
          values.status === BillPrintBatchStatus.PRINTED ? timestamp : undefined,
        printedById:
          values.status === BillPrintBatchStatus.PRINTED ? staffUser.id : undefined,
        distributedAt:
          values.status === BillPrintBatchStatus.DISTRIBUTED ? timestamp : undefined,
        distributedById:
          values.status === BillPrintBatchStatus.DISTRIBUTED ? staffUser.id : undefined,
        returnedAt:
          values.status === BillPrintBatchStatus.RETURNED ? timestamp : undefined,
        returnedById:
          values.status === BillPrintBatchStatus.RETURNED ? staffUser.id : undefined,
        failedDeliveryAt:
          values.status === BillPrintBatchStatus.FAILED_DELIVERY ? timestamp : undefined,
        failedDeliveryById:
          values.status === BillPrintBatchStatus.FAILED_DELIVERY ? staffUser.id : undefined,
        deliveryNote: note,
      },
    });

    await tx.billingCycleEvent.create({
      data: {
        billingCycleId: batch.billingCycleId,
        actorId: staffUser.id,
        type: batchEventTypeMap[values.status],
        billPrintBatchId: values.billPrintBatchId,
        note,
      },
    });
  });

  revalidateBillingPaths();
}

export async function recordBillReprint(billId: string) {
  const staffUser = await requireStaffCapability("billing:print");

  const bill = await prisma.bill.findUnique({
    where: {
      id: billId,
    },
    select: {
      id: true,
      billingCycleId: true,
    },
  });

  if (!bill) {
    throw new Error("That bill no longer exists.");
  }

  const timestamp = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.bill.update({
      where: {
        id: billId,
      },
      data: {
        reprintCount: {
          increment: 1,
        },
        distributionStatus: BillDistributionStatus.PRINTED,
        printedAt: timestamp,
        printedById: staffUser.id,
      },
    });

    if (bill.billingCycleId) {
      await tx.billingCycleEvent.create({
        data: {
          billingCycleId: bill.billingCycleId,
          actorId: staffUser.id,
          type: BillingCycleEventType.SINGLE_BILL_REPRINTED,
          billId,
          note: "Single-bill reprint logged from the printable bill view.",
        },
      });
    }
  });

  revalidateBillingPaths();
  revalidatePath(`/admin/billing/${billId}`);
}
