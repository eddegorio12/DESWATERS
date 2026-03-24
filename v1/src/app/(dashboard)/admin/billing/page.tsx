import Link from "next/link";

import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { BillStatus, ReadingStatus } from "@prisma/client";

import { buttonVariants } from "@/components/ui/button-variants";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { ModuleAccessStateView } from "@/features/admin/components/module-access-state";
import {
  canPerformCapability,
  getModuleAccess,
} from "@/features/auth/lib/authorization";
import { ApprovedReadingBillQueue } from "@/features/billing/components/approved-reading-bill-queue";
import { UnpaidBillList } from "@/features/billing/components/unpaid-bill-list";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export default async function AdminBillingPage() {
  const access = await getModuleAccess("billing");

  if (access.status !== "authorized") {
    return <ModuleAccessStateView module="billing" access={access} />;
  }

  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const [activeTariff, approvedReadings, unpaidBills] = await Promise.all([
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
  ]);
  const canGenerateBills = canPerformCapability(access.user.role, "billing:generate");

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
            <UserButton />
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
        <UnpaidBillList bills={unpaidBills} />
    </AdminPageShell>
  );
}
