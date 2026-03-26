import Link from "next/link";

import type { BillDistributionStatus, BillLifecycleStatus, BillStatus } from "@prisma/client";

import { buttonVariants } from "@/components/ui/button-variants";
import { StatusPill } from "@/features/admin/components/status-pill";
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
    lifecycleStatus: BillLifecycleStatus;
    distributionStatus: BillDistributionStatus;
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

function getBillStatusPriority(status: BillStatus) {
  if (status === "OVERDUE") {
    return "overdue" as const;
  }

  if (status === "PARTIALLY_PAID") {
    return "pending" as const;
  }

  return "readonly" as const;
}

function getDistributionPriority(status: BillDistributionStatus) {
  if (status === "DISTRIBUTED") {
    return "success" as const;
  }

  if (status === "RETURNED" || status === "FAILED_DELIVERY") {
    return "attention" as const;
  }

  if (status === "PRINTED") {
    return "ready" as const;
  }

  return "pending" as const;
}

export function UnpaidBillList({ bills }: UnpaidBillListProps) {
  return (
    <section className="rounded-[1.9rem] border border-[#dbe9e5] bg-white/92 p-6 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.55)]">
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

      <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-[#dbe9e5] shadow-[0_18px_40px_-38px_rgba(16,63,67,0.45)]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-left">
            <thead className="bg-secondary/55">
              <tr className="text-sm text-muted-foreground">
                <th className="px-4 py-3 font-medium">Bill</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Meter</th>
                <th className="px-4 py-3 font-medium">Usage</th>
                <th className="px-4 py-3 font-medium">Total charges</th>
                <th className="px-4 py-3 font-medium">Due date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Cycle state</th>
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
                      <StatusPill priority={getBillStatusPriority(bill.status)}>
                        {bill.status.replace("_", " ")}
                      </StatusPill>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-2">
                        <StatusPill
                          priority={
                            bill.lifecycleStatus === "FINALIZED" ? "readonly" : "pending"
                          }
                        >
                          {bill.lifecycleStatus === "FINALIZED" ? "Locked" : "Draft"}
                        </StatusPill>
                        <StatusPill priority={getDistributionPriority(bill.distributionStatus)}>
                          {bill.distributionStatus.replaceAll("_", " ")}
                        </StatusPill>
                      </div>
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
                    colSpan={9}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    No unpaid bills are in the queue yet. Generate bills above to open payment and print work.
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
