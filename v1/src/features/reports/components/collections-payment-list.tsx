import type { PaymentMethod } from "@prisma/client";

import { RecordListSection } from "@/features/admin/components/record-list-section";
import { ResponsiveDataTable } from "@/features/admin/components/responsive-data-table";
import { formatCurrency } from "@/features/billing/lib/billing-calculations";

type CollectionsPaymentListProps = {
  payments: {
    id: string;
    paymentDate: Date;
    amount: number;
    method: PaymentMethod;
    referenceId: string | null;
    bill: {
      billingPeriod: string;
      customer: {
        accountNumber: string;
        name: string;
      };
    };
  }[];
  totalCount: number;
  rangeLabel: string;
  query: string;
  method: "ALL" | PaymentMethod;
  hiddenFields?: {
    name: string;
    value: string;
  }[];
};

function formatMethod(method: PaymentMethod) {
  return method.replace("_", " ");
}

export function CollectionsPaymentList({
  payments,
  totalCount,
  rangeLabel,
  query,
  method,
  hiddenFields = [],
}: CollectionsPaymentListProps) {
  const hasActiveFilters = Boolean(query || method !== "ALL");
  const resultsText = hasActiveFilters
    ? `Showing ${payments.length} of ${totalCount} payment${totalCount === 1 ? "" : "s"}`
    : `${payments.length} payment${payments.length === 1 ? "" : "s"} in the selected range`;

  return (
    <RecordListSection
      eyebrow="Collections Ledger"
      title={`Completed payment records for ${rangeLabel}`}
      description="Search by customer, account, bill period, reference, or payment ID to review cashier activity without losing the selected reporting window."
      resultsText={resultsText}
      searchName="paymentQuery"
      searchValue={query}
      searchPlaceholder="Search customer, account, bill, reference, or payment ID"
      filterName="paymentMethod"
      filterValue={method}
      filterLabel="Payment method"
      filterOptions={[
        { label: "All methods", value: "ALL" },
        { label: "Cash", value: "CASH" },
        { label: "Bank transfer", value: "BANK_TRANSFER" },
        { label: "GCash", value: "GCASH" },
        { label: "Maya", value: "MAYA" },
        { label: "Card", value: "CARD" },
      ]}
      helperText="Keep the date window fixed, then narrow the ledger here when validating cashier posting patterns or matching references."
      nextStep="Next: open Payments for corrections or Follow-up if the ledger shows weak settlement against open balances."
      resetHref={hiddenFields.length ? `/admin/collections?${new URLSearchParams(hiddenFields.map((field) => [field.name, field.value])).toString()}` : "/admin/collections"}
      hasActiveFilters={hasActiveFilters}
      hiddenFields={hiddenFields}
    >
      <ResponsiveDataTable
        columns={["Recorded", "Customer", "Bill", "Method", "Amount"]}
        colSpan={5}
        hasRows={payments.length > 0}
        emptyMessage={
          hasActiveFilters
            ? "No completed payments match the current ledger search or payment-method filter."
            : "No completed payments were recorded in the selected date range."
        }
        mobileCards={payments.map((payment) => (
          <article key={payment.id} className="rounded-[1.35rem] border border-[#dbe9e5] bg-white p-4">
            <p className="font-medium text-foreground">{payment.paymentDate.toLocaleString("en-PH")}</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{payment.id}</p>
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
                  <div className="mt-1 text-xs">{payment.referenceId || "No reference"}</div>
                </dd>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Method</dt>
                  <dd className="mt-1 text-muted-foreground">{formatMethod(payment.method)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Amount</dt>
                  <dd className="mt-1 font-medium text-foreground">{formatCurrency(payment.amount)}</dd>
                </div>
              </div>
            </dl>
          </article>
        ))}
        rows={payments.map((payment) => (
          <tr key={payment.id} className="align-top text-sm">
            <td className="px-4 py-4">
              <div className="font-medium text-foreground">
                {payment.paymentDate.toLocaleString("en-PH")}
              </div>
              <div className="mt-1 font-mono text-xs text-muted-foreground">{payment.id}</div>
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
                {payment.referenceId || "No reference"}
              </div>
            </td>
            <td className="px-4 py-4 text-muted-foreground">{formatMethod(payment.method)}</td>
            <td className="px-4 py-4 font-medium text-foreground">
              {formatCurrency(payment.amount)}
            </td>
          </tr>
        ))}
      />
    </RecordListSection>
  );
}
