import Link from "next/link";

import type { BillStatus } from "@prisma/client";

import { buttonVariants } from "@/components/ui/button-variants";
import { formatCurrency } from "@/features/billing/lib/billing-calculations";
import { cn } from "@/lib/utils";

type UnpaidBillListProps = {
  bills: {
    id: string;
    billingPeriod: string;
    dueDate: Date;
    usageAmount: number;
    totalCharges: number;
    status: BillStatus;
    customer: {
      accountNumber: string;
      name: string;
    };
    reading: {
      meter: {
        meterNumber: string;
      };
    };
  }[];
};

function getStatusClasses(status: BillStatus) {
  if (status === "OVERDUE") {
    return "bg-destructive/10 text-destructive";
  }

  if (status === "PARTIALLY_PAID") {
    return "bg-primary/10 text-primary";
  }

  return "bg-secondary text-secondary-foreground";
}

export function UnpaidBillList({ bills }: UnpaidBillListProps) {
  return (
    <section className="rounded-3xl border border-border bg-background p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Open Bills
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Unpaid billing records
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {bills.length} bill{bills.length === 1 ? "" : "s"} awaiting payment
        </p>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-left">
            <thead className="bg-muted/50">
              <tr className="text-sm text-muted-foreground">
                <th className="px-4 py-3 font-medium">Bill</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Meter</th>
                <th className="px-4 py-3 font-medium">Usage</th>
                <th className="px-4 py-3 font-medium">Total charges</th>
                <th className="px-4 py-3 font-medium">Due date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Template</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background">
              {bills.length ? (
                bills.map((bill) => (
                  <tr key={bill.id} className="text-sm">
                    <td className="px-4 py-4">
                      <div className="font-medium text-foreground">{bill.billingPeriod}</div>
                      <div className="mt-1 font-mono text-xs text-muted-foreground">
                        {bill.id}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-foreground">{bill.customer.name}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {bill.customer.accountNumber}
                      </div>
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-muted-foreground">
                      {bill.reading.meter.meterNumber}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{bill.usageAmount} cu.m</td>
                    <td className="px-4 py-4 font-medium text-foreground">
                      {formatCurrency(bill.totalCharges)}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {bill.dueDate.toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                          bill.status
                        )}`}
                      >
                        {bill.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/admin/billing/${bill.id}`}
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
                    colSpan={8}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    No unpaid bills have been generated yet.
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
