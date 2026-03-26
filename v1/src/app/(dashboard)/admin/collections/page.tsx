import { BillStatus, PaymentStatus } from "@prisma/client";

import { AdminPageActions } from "@/features/admin/components/admin-page-actions";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import {
  getSearchParamText,
  matchesSearch,
  type SearchParamValue,
} from "@/features/admin/lib/list-filters";
import { ModuleAccessStateView } from "@/features/admin/components/module-access-state";
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

type AdminCollectionsPageProps = {
  searchParams: Promise<Record<string, SearchParamValue>>;
};

export default async function AdminCollectionsPage({
  searchParams,
}: AdminCollectionsPageProps) {
  const access = await getModuleAccess("collections");

  if (access.status !== "authorized") {
    return <ModuleAccessStateView module="collections" access={access} />;
  }

  await syncReceivableStatuses();

  const searchParamValues = await searchParams;
  const filters = getCollectionRangeFromSearchParams(searchParamValues);

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
  const paymentQuery = getSearchParamText(searchParamValues.paymentQuery);
  const paymentMethod = getSearchParamText(searchParamValues.paymentMethod) as
    | "ALL"
    | "CASH"
    | "BANK_TRANSFER"
    | "GCASH"
    | "MAYA"
    | "CARD";
  const receivableQuery = getSearchParamText(searchParamValues.receivableQuery);
  const receivableStatus = getSearchParamText(searchParamValues.receivableStatus) as
    | "ALL"
    | "UNPAID"
    | "PARTIALLY_PAID"
    | "OVERDUE";
  const filteredPayments = payments.filter((payment) => {
    const matchesMethod =
      !paymentMethod || paymentMethod === "ALL" ? true : payment.method === paymentMethod;

    return (
      matchesMethod &&
      matchesSearch(
        [
          payment.id,
          payment.bill.customer.name,
          payment.bill.customer.accountNumber,
          payment.bill.billingPeriod,
          payment.referenceId,
          payment.method.replaceAll("_", " "),
        ],
        paymentQuery
      )
    );
  });
  const filteredReceivables = receivables.accounts.filter((account) => {
    const matchesStatus =
      !receivableStatus || receivableStatus === "ALL"
        ? true
        : account.status === receivableStatus;

    return (
      matchesStatus &&
      matchesSearch(
        [
          account.id,
          account.customer.name,
          account.customer.accountNumber,
          account.billingPeriod,
          account.reading.meter.meterNumber,
        ],
        receivableQuery
      )
    );
  });
  const hiddenDateFields = [
    { name: "startDate", value: filters.startDateInput },
    { name: "endDate", value: filters.endDateInput },
  ];

  return (
    <AdminPageShell
      eyebrow="Reporting Workspace"
      title="Review collection history and live receivables from one finance control surface."
      description="Filter completed payment activity by date range, verify posted collections, and keep unpaid, partially paid, and overdue balances visible for follow-up without leaving the reporting module."
      actions={
        <AdminPageActions
          links={[
            { href: "/admin/payments", label: "Payments module" },
            { href: "/admin/follow-up", label: "Follow-up workflow" },
          ]}
        />
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
      <CollectionsPaymentList
        payments={filteredPayments}
        totalCount={payments.length}
        rangeLabel={filters.rangeLabel}
        query={paymentQuery}
        method={paymentMethod || "ALL"}
        hiddenFields={hiddenDateFields}
      />
      <ReceivablesList
        accounts={filteredReceivables}
        totalCount={receivables.accounts.length}
        query={receivableQuery}
        status={receivableStatus || "ALL"}
        hiddenFields={hiddenDateFields}
      />
    </AdminPageShell>
  );
}
