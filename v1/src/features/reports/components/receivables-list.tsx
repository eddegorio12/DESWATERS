import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import { formatCurrency } from "@/features/billing/lib/billing-calculations";
import type { ReceivableAccount } from "@/features/reports/lib/receivables";
import { cn } from "@/lib/utils";

type ReceivablesListProps = {
  accounts: ReceivableAccount[];
};

function getStatusClasses(status: ReceivableAccount["status"]) {
  if (status === "OVERDUE") {
    return "bg-destructive/10 text-destructive";
  }

  if (status === "PARTIALLY_PAID") {
    return "bg-primary/10 text-primary";
  }

  return "bg-secondary text-secondary-foreground";
}

function getFollowUpLabel(account: ReceivableAccount) {
  if (account.status === "OVERDUE") {
    return `${account.daysPastDue} day${account.daysPastDue === 1 ? "" : "s"} overdue`;
  }

  if (account.daysUntilDue === 0) {
    return "Due today";
  }

  return `Due in ${account.daysUntilDue} day${account.daysUntilDue === 1 ? "" : "s"}`;
}

export function ReceivablesList({ accounts }: ReceivablesListProps) {
  return (
    <section className="rounded-[1.9rem] border border-[#dbe9e5] bg-white/92 p-6 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.55)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Receivables Follow-up
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Open customer balances
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {accounts.length} bill{accounts.length === 1 ? "" : "s"} currently open
        </p>
      </div>

      <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-[#dbe9e5] shadow-[0_18px_40px_-38px_rgba(16,63,67,0.45)]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-left">
            <thead className="bg-secondary/55">
              <tr className="text-sm text-muted-foreground">
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Bill</th>
                <th className="px-4 py-3 font-medium">Meter</th>
                <th className="px-4 py-3 font-medium">Due date</th>
                <th className="px-4 py-3 font-medium">Paid</th>
                <th className="px-4 py-3 font-medium">Balance</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Statement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background">
              {accounts.length ? (
                accounts.map((account) => (
                  <tr key={account.id} className="align-top text-sm">
                    <td className="px-4 py-4">
                      <div className="font-medium text-foreground">{account.customer.name}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {account.customer.accountNumber}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-foreground">{account.billingPeriod}</div>
                      <div className="mt-1 font-mono text-xs text-muted-foreground">
                        {account.id}
                      </div>
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-muted-foreground">
                      {account.reading.meter.meterNumber}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-foreground">
                        {account.dueDate.toLocaleDateString("en-PH")}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {getFollowUpLabel(account)}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {formatCurrency(account.paidAmount)}
                    </td>
                    <td className="px-4 py-4 font-medium text-foreground">
                      {formatCurrency(account.outstandingBalance)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                          account.status
                        )}`}
                      >
                        {account.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/admin/billing/${account.id}`}
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
                    No open receivables need follow-up right now.
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
