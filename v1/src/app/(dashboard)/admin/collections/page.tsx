import Link from "next/link";

import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { PaymentStatus } from "@prisma/client";

import { buttonVariants } from "@/components/ui/button-variants";
import { CollectionsSummary } from "@/features/reports/components/collections-summary";
import { DailyCollectionsList } from "@/features/reports/components/daily-collections-list";
import {
  formatCollectionDayLabel,
  getTodayCollectionRange,
} from "@/features/reports/lib/collections";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export default async function AdminCollectionsPage() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const { start, end } = getTodayCollectionRange();

  const payments = await prisma.payment.findMany({
    where: {
      status: PaymentStatus.COMPLETED,
      paymentDate: {
        gte: start,
        lt: end,
      },
    },
    orderBy: [{ paymentDate: "desc" }],
    select: {
      id: true,
      amount: true,
      paymentDate: true,
      method: true,
      referenceId: true,
      bill: {
        select: {
          billingPeriod: true,
          customer: {
            select: {
              accountNumber: true,
              name: true,
            },
          },
        },
      },
    },
  });

  const totalCollections = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const collectionDateLabel = formatCollectionDayLabel(start);

  return (
    <main className="min-h-screen bg-muted/30 px-6 py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-border bg-background px-6 py-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Collections Dashboard
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Review all completed payments recorded today and confirm the running total
              for daily collections.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/payments"
              className={cn(
                buttonVariants({
                  variant: "outline",
                  className: "h-10 rounded-xl px-4",
                })
              )}
            >
              Payments module
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

        <CollectionsSummary
          collectionDateLabel={collectionDateLabel}
          paymentCount={payments.length}
          totalCollections={totalCollections}
        />
        <DailyCollectionsList payments={payments} />
      </div>
    </main>
  );
}
