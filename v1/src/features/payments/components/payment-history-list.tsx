import type { BillStatus, PaymentMethod, PaymentStatus } from "@prisma/client";

import { formatCurrency } from "@/features/billing/lib/billing-calculations";

type PaymentHistoryListProps = {
  payments: {
    id: string;
    amount: number;
    paymentDate: Date;
    method: PaymentMethod;
    referenceId: string | null;
    status: PaymentStatus;
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
};

function formatMethod(method: PaymentMethod) {
  return method.replace("_", " ");
}

function getBillStatusClasses(status: BillStatus) {
  if (status === "PAID") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "PARTIALLY_PAID") {
    return "bg-primary/10 text-primary";
  }

  if (status === "OVERDUE") {
    return "bg-destructive/10 text-destructive";
  }

  return "bg-secondary text-secondary-foreground";
}

export function PaymentHistoryList({ payments }: PaymentHistoryListProps) {
  return (
    <section className="rounded-3xl border border-border bg-background p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Payment History
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Recently recorded payments
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {payments.length} payment{payments.length === 1 ? "" : "s"} recorded
        </p>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-left">
            <thead className="bg-muted/50">
              <tr className="text-sm text-muted-foreground">
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Bill</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Bill status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background">
              {payments.length ? (
                payments.map((payment) => (
                  <tr key={payment.id} className="align-top text-sm">
                    <td className="px-4 py-4">
                      <div className="font-medium text-foreground">
                        {payment.paymentDate.toLocaleString()}
                      </div>
                      <div className="mt-1 font-mono text-xs text-muted-foreground">
                        {payment.id}
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
                        {formatCurrency(payment.bill.totalCharges)}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      <div>{formatMethod(payment.method)}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {payment.referenceId || payment.status}
                      </div>
                    </td>
                    <td className="px-4 py-4 font-medium text-foreground">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getBillStatusClasses(
                          payment.bill.status
                        )}`}
                      >
                        {payment.bill.status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    No payments have been recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
