import Link from "next/link";

import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { BillStatus, ReadingStatus } from "@prisma/client";

import { buttonVariants } from "@/components/ui/button-variants";
import { ApprovedReadingBillQueue } from "@/features/billing/components/approved-reading-bill-queue";
import { UnpaidBillList } from "@/features/billing/components/unpaid-bill-list";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export default async function AdminBillingPage() {
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

  return (
    <main className="min-h-screen bg-muted/30 px-6 py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-border bg-background px-6 py-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Step 3.3
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Bill Generation Workflow
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Generate unpaid bills from approved readings using the active progressive
              tariff, then review open bill records before payment encoding begins.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/readings"
              className={cn(
                buttonVariants({
                  variant: "outline",
                  className: "h-10 rounded-xl px-4",
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
                  className: "h-10 rounded-xl px-4",
                })
              )}
            >
              Back to dashboard
            </Link>
            <UserButton />
          </div>
        </header>

        <ApprovedReadingBillQueue activeTariff={activeTariff} readings={approvedReadings} />
        <UnpaidBillList bills={unpaidBills} />
      </div>
    </main>
  );
}
