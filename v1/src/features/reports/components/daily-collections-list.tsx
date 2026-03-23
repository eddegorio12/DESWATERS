import type { PaymentMethod } from "@prisma/client";

import { formatCurrency } from "@/features/billing/lib/billing-calculations";

type DailyCollectionsListProps = {
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
};

function formatMethod(method: PaymentMethod) {
  return method.replace("_", " ");
}

export function DailyCollectionsList({ payments }: DailyCollectionsListProps) {
  return (
    <section className="rounded-3xl border border-border bg-background p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Collections Report
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Today&apos;s payment records
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {payments.length} payment{payments.length === 1 ? "" : "s"} in the report
        </p>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-left">
            <thead className="bg-muted/50">
              <tr className="text-sm text-muted-foreground">
                <th className="px-4 py-3 font-medium">Recorded</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Bill</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background">
              {payments.length ? (
                payments.map((payment) => (
                  <tr key={payment.id} className="align-top text-sm">
                    <td className="px-4 py-4">
                      <div className="font-medium text-foreground">
                        {payment.paymentDate.toLocaleString("en-PH")}
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
                        {payment.referenceId || "No reference"}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {formatMethod(payment.method)}
                    </td>
                    <td className="px-4 py-4 font-medium text-foreground">
                      {formatCurrency(payment.amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    No completed payments have been recorded for today.
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
