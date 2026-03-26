import Link from "next/link";

import { BillStatus, PaymentStatus } from "@prisma/client";

import { buttonVariants } from "@/components/ui/button-variants";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { ModuleAccessStateView } from "@/features/admin/components/module-access-state";
import { AdminSessionButton } from "@/features/auth/components/admin-session-button";
import { getModuleAccess } from "@/features/auth/lib/authorization";
import { syncReceivableStatuses } from "@/features/follow-up/lib/workflow";
import { CollectionsFilterForm } from "@/features/reports/components/collections-filter-form";
import { CollectionsPaymentList } from "@/features/reports/components/collections-payment-list";
import { CollectionsSummary } from "@/features/reports/components/collections-summary";
import { ReceivablesList } from "@/features/reports/components/receivables-list";
import { ReceivablesSummary } from "@/features/reports/components/receivables-summary";
import { getCollectionRangeFromSearchParams } from "@/features/reports/lib/collections";
import { summarizeReceivables } from "@/features/reports/lib/receivables";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

type AdminCollectionsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminCollectionsPage({
  searchParams,
}: AdminCollectionsPageProps) {
  const access = await getModuleAccess("collections");

  if (access.status !== "authorized") {
    return <ModuleAccessStateView module="collections" access={access} />;
  }

  await syncReceivableStatuses();

  const filters = getCollectionRangeFromSearchParams(await searchParams);

  const [payments, openBills] = await Promise.all([
    prisma.payment.findMany({
      where: {
        status: PaymentStatus.COMPLETED,
        paymentDate: {
          gte: filters.start,
          lt: filters.end,
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
    }),
    prisma.bill.findMany({
      where: {
        status: {
          in: [BillStatus.UNPAID, BillStatus.PARTIALLY_PAID, BillStatus.OVERDUE],
        },
      },
      orderBy: [{ dueDate: "asc" }],
      select: {
        id: true,
        billingPeriod: true,
        dueDate: true,
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
        payments: {
          where: {
            status: PaymentStatus.COMPLETED,
          },
          select: {
            amount: true,
          },
        },
      },
    }),
  ]);

  const totalCollections = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const receivables = summarizeReceivables(openBills);

  return (
    <AdminPageShell
      eyebrow="Reporting Workspace"
      title="Review collection history and live receivables from one finance control surface."
      description="Filter completed payment activity by date range, verify posted collections, and keep unpaid, partially paid, and overdue balances visible for follow-up without leaving the reporting module."
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
          label: "Date range",
          value: filters.rangeLabel,
          detail: `${filters.dayCount} Manila operating day${filters.dayCount === 1 ? "" : "s"} in scope`,
          accent: "teal",
        },
        {
          label: "Collections",
          value: new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
            maximumFractionDigits: 0,
          }).format(totalCollections),
          detail: "Completed payments posted inside the selected range",
          accent: "sky",
        },
        {
          label: "Open receivables",
          value: receivables.accounts.length.toString(),
          detail: "Bills that still require full settlement follow-up",
          accent: "rose",
        },
      ]}
    >
      <CollectionsFilterForm
        startDateInput={filters.startDateInput}
        endDateInput={filters.endDateInput}
      />
      <CollectionsSummary
        collectionRangeLabel={filters.rangeLabel}
        dayCount={filters.dayCount}
        paymentCount={payments.length}
        totalCollections={totalCollections}
      />
      <ReceivablesSummary
        totalOutstanding={receivables.totalOutstanding}
        overdueBalance={receivables.overdueBalance}
        overdueCustomerCount={receivables.overdueCustomerCount}
        unpaidCount={receivables.unpaidCount}
        partiallyPaidCount={receivables.partiallyPaidCount}
        overdueCount={receivables.overdueCount}
      />
      <CollectionsPaymentList payments={payments} rangeLabel={filters.rangeLabel} />
      <ReceivablesList accounts={receivables.accounts} />
    </AdminPageShell>
  );
}
