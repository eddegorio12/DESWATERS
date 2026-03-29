import Link from "next/link";

import type { BillDistributionStatus, BillLifecycleStatus, BillStatus } from "@prisma/client";

import { buttonVariants } from "@/components/ui/button-variants";
import {
  AdminSurfaceHeader,
  AdminSurfacePanel,
} from "@/features/admin/components/admin-surface-panel";
import { ResponsiveDataTable } from "@/features/admin/components/responsive-data-table";
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
    <AdminSurfacePanel>
      <AdminSurfaceHeader
        eyebrow="Open Bills"
        title="Keep unsettled billing records visible for cashier, print, and follow-up work."
        aside={`${bills.length} bill${bills.length === 1 ? "" : "s"} awaiting payment`}
      />

      <div className="mt-6">
        <ResponsiveDataTable
          columns={[
            "Bill",
            "Customer",
            "Meter",
            "Usage",
            "Total charges",
            "Due date",
            "Status",
            "Cycle state",
            "Template",
          ]}
          colSpan={9}
          hasRows={bills.length > 0}
          emptyMessage="No unpaid bills are in the queue yet. Generate bills above to open payment and print work."
          mobileCards={bills.map((bill) => (
            <article key={bill.id} className="rounded-[1.35rem] border border-[#dbe9e5] bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{bill.billingPeriod}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{bill.customer.name}</p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {bill.customer.accountNumber}
                  </p>
                </div>
                <StatusPill priority={getBillStatusPriority(bill.status)}>
                  {bill.status.replace("_", " ")}
                </StatusPill>
              </div>

              <dl className="mt-4 grid gap-3 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Meter and usage
                  </dt>
                  <dd className="mt-1 text-muted-foreground">
                    <div className="font-mono text-xs">{bill.reading.meter.meterNumber}</div>
                    <div className="mt-1">{bill.usageAmount} cu.m</div>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Amount and due date
                  </dt>
                  <dd className="mt-1 text-muted-foreground">
                    <div className="font-medium text-foreground">
                      {formatCurrency(bill.totalCharges)}
                    </div>
                    <div className="mt-1 text-xs">
                      Due: {bill.dueDate.toLocaleDateString()}
                    </div>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Cycle state
                  </dt>
                  <dd className="mt-2 flex flex-wrap gap-2">
                    <StatusPill
                      priority={bill.lifecycleStatus === "FINALIZED" ? "readonly" : "pending"}
                    >
                      {bill.lifecycleStatus === "FINALIZED" ? "Locked" : "Draft"}
                    </StatusPill>
                    <StatusPill priority={getDistributionPriority(bill.distributionStatus)}>
                      {bill.distributionStatus.replaceAll("_", " ")}
                    </StatusPill>
                  </dd>
                </div>
              </dl>

              <Link
                href={`/admin/billing/${bill.id}`}
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
          rows={bills.map((bill) => (
            <tr key={bill.id} className="text-sm">
              <td className="px-4 py-4">
                <div className="font-medium text-foreground">{bill.billingPeriod}</div>
                <div className="mt-1 font-mono text-xs text-muted-foreground">{bill.id}</div>
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
                    priority={bill.lifecycleStatus === "FINALIZED" ? "readonly" : "pending"}
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
          ))}
        />
      </div>
    </AdminSurfacePanel>
  );
}
