import Link from "next/link";

import { BillStatus, ReadingStatus, Role } from "@prisma/client";

import { buttonVariants } from "@/components/ui/button-variants";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { ModuleAccessStateView } from "@/features/admin/components/module-access-state";
import { AdminSessionButton } from "@/features/auth/components/admin-session-button";
import {
  canPerformCapability,
  getModuleAccess,
} from "@/features/auth/lib/authorization";
import { ApprovedReadingBillQueue } from "@/features/billing/components/approved-reading-bill-queue";
import { BillingGovernancePanel } from "@/features/billing/components/billing-governance-panel";
import { UnpaidBillList } from "@/features/billing/components/unpaid-bill-list";
import { syncReceivableStatuses } from "@/features/follow-up/lib/workflow";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export default async function AdminBillingPage() {
  const access = await getModuleAccess("billing");

  if (access.status !== "authorized") {
    return <ModuleAccessStateView module="billing" access={access} />;
  }

  await syncReceivableStatuses();

  const [activeTariff, approvedReadings, unpaidBills, billingCycles, selectedCycle, staffOptions] =
    await Promise.all([
    prisma.tariff.findFirst({
      where: {
        isActive: true,
      },
      select: {
        name: true,
        minimumCharge: true,
        minimumUsage: true,
      },
    }),
    prisma.reading.findMany({
      where: {
        status: ReadingStatus.APPROVED,
        bill: null,
      },
      orderBy: [{ readingDate: "asc" }],
      select: {
        id: true,
        readingDate: true,
        previousReading: true,
        currentReading: true,
        consumption: true,
        meter: {
          select: {
            meterNumber: true,
            customer: {
              select: {
                accountNumber: true,
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.bill.findMany({
      where: {
        status: {
          in: [BillStatus.UNPAID, BillStatus.PARTIALLY_PAID, BillStatus.OVERDUE],
        },
      },
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        billingPeriod: true,
        dueDate: true,
        usageAmount: true,
        totalCharges: true,
            status: true,
            lifecycleStatus: true,
            distributionStatus: true,
            customer: {
          select: {
            accountNumber: true,
            name: true,
          },
        },
        reading: {
          select: {
            meter: {
              select: {
                meterNumber: true,
              },
            },
          },
        },
      },
    }),
    prisma.billingCycle.findMany({
      orderBy: [{ periodKey: "desc" }],
      take: 6,
      select: {
        id: true,
        billingPeriodLabel: true,
        status: true,
        _count: {
          select: {
            bills: true,
            printBatches: true,
          },
        },
      },
    }),
    prisma.billingCycle.findFirst({
      orderBy: [{ periodKey: "desc" }],
      select: {
        id: true,
        billingPeriodLabel: true,
        status: true,
        checklistReviewCompleted: true,
        checklistReceivablesVerified: true,
        checklistPrintReady: true,
        checklistDistributionReady: true,
        checklistMonthEndLocked: true,
        closedAt: true,
        reopenedAt: true,
        finalizedAt: true,
        bills: {
          orderBy: [{ createdAt: "asc" }],
          select: {
            id: true,
            billingPeriod: true,
            totalCharges: true,
            lifecycleStatus: true,
            distributionStatus: true,
            reprintCount: true,
            customer: {
              select: {
                accountNumber: true,
                name: true,
              },
            },
            reading: {
              select: {
                meter: {
                  select: {
                    meterNumber: true,
                  },
                },
              },
            },
          },
        },
        printBatches: {
          orderBy: [{ createdAt: "desc" }],
          select: {
            id: true,
            label: true,
            grouping: true,
            groupingValue: true,
            status: true,
            notes: true,
            createdAt: true,
            printedAt: true,
            distributedAt: true,
            returnedAt: true,
            failedDeliveryAt: true,
            assignedTo: {
              select: {
                id: true,
                name: true,
              },
            },
            bills: {
              select: {
                id: true,
              },
            },
          },
        },
        events: {
          orderBy: [{ occurredAt: "desc" }],
          take: 10,
          select: {
            id: true,
            type: true,
            note: true,
            occurredAt: true,
            actor: {
              select: {
                name: true,
                role: true,
              },
            },
          },
        },
      },
    }),
    prisma.user.findMany({
      where: {
        isActive: true,
        role: {
          in: [Role.SUPER_ADMIN, Role.ADMIN, Role.BILLING, Role.CASHIER],
        },
      },
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        role: true,
      },
    }),
  ]);
  const canGenerateBills = canPerformCapability(access.user.role, "billing:generate");
  const canFinalizeCycle = canPerformCapability(access.user.role, "billing:finalize");
  const canReopenCycle = canPerformCapability(access.user.role, "billing:reopen");
  const canRegenerateCycle = canPerformCapability(access.user.role, "billing:regenerate");
  const canManagePrintBatches = canPerformCapability(access.user.role, "billing:print");
  const canTrackDistribution = canPerformCapability(access.user.role, "billing:distribute");

  return (
    <AdminPageShell
      eyebrow="Billing Control"
      title="Turn approved usage into receivables with the active tariff and a printable bill trail."
      description="Generate bills from approved readings, keep open receivables visible, and move directly into statement printing and cashier follow-up without leaving the billing workspace."
      actions={
        <>
            <Link
              href="/admin/payments"
              className={cn(
                buttonVariants({
                  variant: "outline",
                  className:
                    "h-10 rounded-full border-white/18 bg-white/8 px-5 text-white hover:bg-white/12 hover:text-white",
                })
              )}
            >
              Payments module
            </Link>
            <Link
              href="/admin/follow-up"
              className={cn(
                buttonVariants({
                  variant: "outline",
                  className:
                    "h-10 rounded-full border-white/18 bg-white/8 px-5 text-white hover:bg-white/12 hover:text-white",
                })
              )}
            >
              Follow-up workflow
            </Link>
            <Link
              href="/admin/readings"
              className={cn(
                buttonVariants({
                  variant: "outline",
                  className:
                    "h-10 rounded-full border-white/18 bg-white/8 px-5 text-white hover:bg-white/12 hover:text-white",
                })
              )}
            >
              Reading module
            </Link>
            <Link
              href="/admin/dashboard"
              className={cn(
                buttonVariants({
                  variant: "outline",
                  className:
                    "h-10 rounded-full border-white/18 bg-white/8 px-5 text-white hover:bg-white/12 hover:text-white",
                })
              )}
            >
              Back to dashboard
            </Link>
            <AdminSessionButton />
        </>
      }
      stats={[
        {
          label: "Active tariff",
          value: activeTariff ? activeTariff.name : "Not set",
          detail: activeTariff
            ? "Current tariff driving bill calculations"
            : "Create or activate a tariff before billing",
          accent: "violet",
        },
        {
          label: "Ready to bill",
          value: approvedReadings.length.toString(),
          detail: "Approved readings still waiting for bill generation",
          accent: "amber",
        },
        {
          label: "Open receivables",
          value: unpaidBills.length.toString(),
          detail: "Bills that still require full settlement",
          accent: "rose",
        },
      ]}
    >

        <ApprovedReadingBillQueue
          activeTariff={activeTariff}
          readings={approvedReadings}
          canGenerateBills={canGenerateBills}
        />
        <BillingGovernancePanel
          key={
            selectedCycle
              ? [
                  selectedCycle.id,
                  selectedCycle.status,
                  selectedCycle.checklistReviewCompleted,
                  selectedCycle.checklistReceivablesVerified,
                  selectedCycle.checklistPrintReady,
                  selectedCycle.checklistDistributionReady,
                  selectedCycle.checklistMonthEndLocked,
                  selectedCycle.bills.length,
                  selectedCycle.printBatches.length,
                  selectedCycle.events.length,
                ].join(":")
              : "no-billing-cycle"
          }
          cycles={billingCycles.map((cycle) => ({
            id: cycle.id,
            billingPeriodLabel: cycle.billingPeriodLabel,
            status: cycle.status,
            billCount: cycle._count.bills,
            printBatchCount: cycle._count.printBatches,
          }))}
          selectedCycle={selectedCycle}
          staffOptions={staffOptions}
          capabilities={{
            canFinalizeCycle,
            canReopenCycle,
            canRegenerateCycle,
            canManagePrintBatches,
            canTrackDistribution,
          }}
        />
        <UnpaidBillList bills={unpaidBills} />
    </AdminPageShell>
  );
}
