import Link from "next/link";
import type { BillStatus, PaymentMethod, PaymentStatus } from "@prisma/client";

import { buttonVariants } from "@/components/ui/button-variants";
import { RecordListSection } from "@/features/admin/components/record-list-section";
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

function getBillStatusTone(status: BillStatus) {
  if (status === "PAID") {
    return "success" as const;
  }

  if (status === "PARTIALLY_PAID") {
    return "accent" as const;
  }

  if (status === "OVERDUE") {
    return "danger" as const;
  }

  return "neutral" as const;
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
      <div className="overflow-hidden rounded-[1.5rem] border border-[#dbe9e5] shadow-[0_18px_40px_-38px_rgba(16,63,67,0.45)]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-left">
            <thead className="bg-secondary/55">
              <tr className="text-sm text-muted-foreground">
                <th className="px-4 py-3 font-medium">Receipt</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Bill</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">Settlement</th>
                <th className="px-4 py-3 font-medium">Bill status</th>
                <th className="px-4 py-3 text-right font-medium">Print</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background">
              {payments.length ? (
                payments.map((payment) => (
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
                      <div className="font-medium text-foreground">
                        {payment.bill.customer.name}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {payment.bill.customer.accountNumber}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-foreground">
                        {payment.bill.billingPeriod}
                      </div>
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
                      <div className="font-medium text-foreground">
                        {formatCurrency(payment.amount)}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Before: {formatCurrency(payment.balanceBefore)}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        After: {formatCurrency(payment.balanceAfter)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <StatusPill tone={getBillStatusTone(payment.bill.status)}>
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
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    {hasActiveFilters
                      ? "No payments match the current search or bill-status filter."
                      : "No payments have been recorded yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </RecordListSection>
  );
}
