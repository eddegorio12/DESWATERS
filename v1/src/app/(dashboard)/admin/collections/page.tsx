import Link from "next/link";

import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { PaymentStatus } from "@prisma/client";

import { buttonVariants } from "@/components/ui/button-variants";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { ModuleAccessStateView } from "@/features/admin/components/module-access-state";
import { getModuleAccess } from "@/features/auth/lib/authorization";
import { CollectionsSummary } from "@/features/reports/components/collections-summary";
import { DailyCollectionsList } from "@/features/reports/components/daily-collections-list";
import {
  formatCollectionDayLabel,
  getTodayCollectionRange,
} from "@/features/reports/lib/collections";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export default async function AdminCollectionsPage() {
  const access = await getModuleAccess("collections");

  if (access.status !== "authorized") {
    return <ModuleAccessStateView module="collections" access={access} />;
  }

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
    <AdminPageShell
      eyebrow="Collections Reporting"
      title="Track the current operating day’s posted cash flow from one reporting surface."
      description="Review completed payments for the active collection day, verify the summed total, and keep each posted transaction auditable from the same reporting view."
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
          label: "Operating day",
          value: collectionDateLabel,
          detail: "Business-day window aligned to the reporting timezone",
          accent: "teal",
        },
        {
          label: "Collections",
          value: new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
            maximumFractionDigits: 0,
          }).format(totalCollections),
          detail: "Total completed payments posted in the current window",
          accent: "sky",
        },
        {
          label: "Entries",
          value: payments.length.toString(),
          detail: "Completed payment records in today’s report",
          accent: "amber",
        },
      ]}
    >

        <CollectionsSummary
          collectionDateLabel={collectionDateLabel}
          paymentCount={payments.length}
          totalCollections={totalCollections}
        />
        <DailyCollectionsList payments={payments} />
    </AdminPageShell>
  );
}
