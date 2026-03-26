import Link from "next/link";
import type { BillStatus, PaymentMethod, PaymentStatus } from "@prisma/client";

import { buttonVariants } from "@/components/ui/button-variants";
import { RecordListSection } from "@/features/admin/components/record-list-section";
import { ResponsiveDataTable } from "@/features/admin/components/responsive-data-table";
import { StatusPill } from "@/features/admin/components/status-pill";
import { formatCurrency } from "@/features/billing/lib/billing-calculations";
import { cn } from "@/lib/utils";

type PaymentHistoryListProps = {
  payments: {
    id: string;
    receiptNumber: string;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    paymentDate: Date;
    method: PaymentMethod;
    referenceId: string | null;
    status: PaymentStatus;
    recordedBy: {
      name: string;
    };
    bill: {
      id: string;
      billingPeriod: string;
      totalCharges: number;
      status: BillStatus;
      customer: {
        accountNumber: string;
        name: string;
      };
    };
  }[];
  totalCount: number;
  query: string;
  billStatus: "ALL" | BillStatus;
};

function formatMethod(method: PaymentMethod) {
  return method.replace("_", " ");
}

function getBillStatusPriority(status: BillStatus) {
  if (status === "PAID") {
    return "success" as const;
  }

  if (status === "PARTIALLY_PAID") {
    return "pending" as const;
  }

  if (status === "OVERDUE") {
    return "overdue" as const;
  }

  return "readonly" as const;
}

export function PaymentHistoryList({
  payments,
  totalCount,
  query,
  billStatus,
}: PaymentHistoryListProps) {
  const hasActiveFilters = Boolean(query || billStatus !== "ALL");
  const resultsText = hasActiveFilters
    ? `Showing ${payments.length} of ${totalCount} payment${totalCount === 1 ? "" : "s"}`
    : `${payments.length} payment${payments.length === 1 ? "" : "s"} recorded`;

  return (
    <RecordListSection
      eyebrow="Payment History"
      title="Recently recorded settlements"
      description="Search receipts, customers, cashiers, bill periods, and references to verify the latest cashier activity quickly."
      resultsText={resultsText}
      searchName="historyQuery"
      searchValue={query}
      searchPlaceholder="Search receipt, customer, cashier, bill period, or reference"
      filterName="historyBillStatus"
      filterValue={billStatus}
      filterLabel="Bill status"
      filterOptions={[
        { label: "All bill states", value: "ALL" },
        { label: "Unpaid", value: "UNPAID" },
        { label: "Partially paid", value: "PARTIALLY_PAID" },
        { label: "Paid", value: "PAID" },
        { label: "Overdue", value: "OVERDUE" },
      ]}
      helperText="Use payment history to confirm what was posted, who posted it, and which bill status changed."
      nextStep="Need a new settlement? Use the cashier form on this page."
      resetHref="/admin/payments"
      hasActiveFilters={hasActiveFilters}
    >
      <ResponsiveDataTable
        columns={["Receipt", "Customer", "Bill", "Method", "Settlement", "Bill status", "Print"]}
        colSpan={7}
        hasRows={payments.length > 0}
        emptyMessage={
          hasActiveFilters
            ? "No payments match the current search or bill-status filter."
            : "No payments have been recorded yet."
        }
        mobileCards={payments.map((payment) => (
          <article key={payment.id} className="rounded-[1.35rem] border border-[#dbe9e5] bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-foreground">{payment.receiptNumber}</p>
                <p className="mt-1 text-xs text-muted-foreground">{payment.paymentDate.toLocaleString()}</p>
                <p className="mt-1 text-xs text-muted-foreground">Cashier: {payment.recordedBy.name}</p>
              </div>
              <StatusPill priority={getBillStatusPriority(payment.bill.status)}>
                {payment.bill.status.replace("_", " ")}
              </StatusPill>
            </div>
            <dl className="mt-4 grid gap-3 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Customer</dt>
                <dd className="mt-1">
                  <div className="font-medium text-foreground">{payment.bill.customer.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{payment.bill.customer.accountNumber}</div>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Bill</dt>
                <dd className="mt-1 text-muted-foreground">
                  <div>{payment.bill.billingPeriod}</div>
                  <div className="mt-1 text-xs">Bill total: {formatCurrency(payment.bill.totalCharges)}</div>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Settlement</dt>
                <dd className="mt-1 text-muted-foreground">
                  <div className="font-medium text-foreground">{formatCurrency(payment.amount)}</div>
                  <div className="mt-1 text-xs">Before: {formatCurrency(payment.balanceBefore)}</div>
                  <div className="mt-1 text-xs">After: {formatCurrency(payment.balanceAfter)}</div>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Method</dt>
                <dd className="mt-1 text-muted-foreground">
                  <div>{formatMethod(payment.method)}</div>
                  <div className="mt-1 text-xs">{payment.referenceId || payment.status}</div>
                </dd>
              </div>
            </dl>
            <Link
              href={`/admin/payments/${payment.id}/receipt`}
              className={cn(
                buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className: "mt-4 w-full justify-center rounded-xl px-3",
                })
              )}
            >
              View / print
            </Link>
          </article>
        ))}
        rows={payments.map((payment) => (
          <tr key={payment.id} className="align-top text-sm">
            <td className="px-4 py-4">
              <div className="font-medium text-foreground">{payment.receiptNumber}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {payment.paymentDate.toLocaleString()}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Cashier: {payment.recordedBy.name}
              </div>
            </td>
            <td className="px-4 py-4">
              <div className="font-medium text-foreground">{payment.bill.customer.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {payment.bill.customer.accountNumber}
              </div>
            </td>
            <td className="px-4 py-4">
              <div className="font-medium text-foreground">{payment.bill.billingPeriod}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Bill total: {formatCurrency(payment.bill.totalCharges)}
              </div>
            </td>
            <td className="px-4 py-4 text-muted-foreground">
              <div>{formatMethod(payment.method)}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {payment.referenceId || payment.status}
              </div>
            </td>
            <td className="px-4 py-4">
              <div className="font-medium text-foreground">{formatCurrency(payment.amount)}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Before: {formatCurrency(payment.balanceBefore)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                After: {formatCurrency(payment.balanceAfter)}
              </div>
            </td>
            <td className="px-4 py-4">
              <StatusPill priority={getBillStatusPriority(payment.bill.status)}>
                {payment.bill.status.replace("_", " ")}
              </StatusPill>
            </td>
            <td className="px-4 py-4 text-right">
              <Link
                href={`/admin/payments/${payment.id}/receipt`}
                className={cn(
                  buttonVariants({
                    variant: "outline",
                    size: "sm",
                    className: "rounded-xl px-3",
                  })
                )}
              >
                View / print
              </Link>
            </td>
          </tr>
        ))}
      />
    </RecordListSection>
  );
}
