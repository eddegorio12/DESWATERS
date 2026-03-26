import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import { RecordListSection } from "@/features/admin/components/record-list-section";
import { ResponsiveDataTable } from "@/features/admin/components/responsive-data-table";
import { StatusPill } from "@/features/admin/components/status-pill";
import { formatCurrency } from "@/features/billing/lib/billing-calculations";
import type { ReceivableAccount } from "@/features/reports/lib/receivables";
import { cn } from "@/lib/utils";

type ReceivablesListProps = {
  accounts: ReceivableAccount[];
  totalCount: number;
  query: string;
  status: "ALL" | ReceivableAccount["status"];
  hiddenFields?: {
    name: string;
    value: string;
  }[];
};

function getFollowUpLabel(account: ReceivableAccount) {
  if (account.status === "OVERDUE") {
    return `${account.daysPastDue} day${account.daysPastDue === 1 ? "" : "s"} overdue`;
  }

  if (account.daysUntilDue === 0) {
    return "Due today";
  }

  return `Due in ${account.daysUntilDue} day${account.daysUntilDue === 1 ? "" : "s"}`;
}

export function ReceivablesList({
  accounts,
  totalCount,
  query,
  status,
  hiddenFields = [],
}: ReceivablesListProps) {
  const hasActiveFilters = Boolean(query || status !== "ALL");
  const resultsText = hasActiveFilters
    ? `Showing ${accounts.length} of ${totalCount} receivable${totalCount === 1 ? "" : "s"}`
    : `${accounts.length} open receivable${accounts.length === 1 ? "" : "s"} currently tracked`;

  return (
    <RecordListSection
      eyebrow="Receivables Follow-up"
      title="Open customer balances"
      description="Search by customer, account, bill period, or meter to isolate the balances that need settlement review before you move into the dedicated follow-up workspace."
      resultsText={resultsText}
      searchName="receivableQuery"
      searchValue={query}
      searchPlaceholder="Search customer, account, bill, or meter"
      filterName="receivableStatus"
      filterValue={status}
      filterLabel="Receivable status"
      filterOptions={[
        { label: "All receivables", value: "ALL" },
        { label: "Overdue", value: "OVERDUE" },
        { label: "Partially paid", value: "PARTIALLY_PAID" },
        { label: "Unpaid", value: "UNPAID" },
      ]}
      helperText="Use the overdue-first filter here before handing accounts off to the receivables follow-up workflow."
      nextStep="Next: open the bill statement for verification, then move to Follow-up when the balance needs customer action."
      resetHref={hiddenFields.length ? `/admin/collections?${new URLSearchParams(hiddenFields.map((field) => [field.name, field.value])).toString()}` : "/admin/collections"}
      hasActiveFilters={hasActiveFilters}
      hiddenFields={hiddenFields}
    >
      <ResponsiveDataTable
        columns={["Customer", "Bill", "Meter", "Due date", "Paid", "Balance", "Status", "Statement"]}
        colSpan={8}
        hasRows={accounts.length > 0}
        emptyMessage={
          hasActiveFilters
            ? "No receivables match the current search or status filter."
            : "No open receivables need follow-up right now."
        }
        mobileCards={accounts.map((account) => (
          <article key={account.id} className="rounded-[1.35rem] border border-[#dbe9e5] bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-foreground">{account.customer.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{account.customer.accountNumber}</p>
              </div>
              <StatusPill
                priority={
                  account.status === "OVERDUE"
                    ? "overdue"
                    : account.status === "PARTIALLY_PAID"
                      ? "pending"
                      : "readonly"
                }
              >
                {account.status.replace("_", " ")}
              </StatusPill>
            </div>
            <dl className="mt-4 grid gap-3 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Bill</dt>
                <dd className="mt-1 text-muted-foreground">
                  <div className="font-medium text-foreground">{account.billingPeriod}</div>
                  <div className="mt-1 font-mono text-xs">{account.id}</div>
                </dd>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Meter</dt>
                  <dd className="mt-1 font-mono text-xs text-muted-foreground">{account.reading.meter.meterNumber}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Due date</dt>
                  <dd className="mt-1 text-muted-foreground">
                    <div>{account.dueDate.toLocaleDateString("en-PH")}</div>
                    <div className="mt-1 text-xs">{getFollowUpLabel(account)}</div>
                  </dd>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Paid</dt>
                  <dd className="mt-1 text-muted-foreground">{formatCurrency(account.paidAmount)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Balance</dt>
                  <dd className="mt-1 font-medium text-foreground">{formatCurrency(account.outstandingBalance)}</dd>
                </div>
              </div>
            </dl>
            <Link
              href={`/admin/billing/${account.id}`}
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
        rows={accounts.map((account) => (
          <tr key={account.id} className="align-top text-sm">
            <td className="px-4 py-4">
              <div className="font-medium text-foreground">{account.customer.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {account.customer.accountNumber}
              </div>
            </td>
            <td className="px-4 py-4">
              <div className="font-medium text-foreground">{account.billingPeriod}</div>
              <div className="mt-1 font-mono text-xs text-muted-foreground">{account.id}</div>
            </td>
            <td className="px-4 py-4 font-mono text-xs text-muted-foreground">
              {account.reading.meter.meterNumber}
            </td>
            <td className="px-4 py-4">
              <div className="text-foreground">{account.dueDate.toLocaleDateString("en-PH")}</div>
              <div className="mt-1 text-xs text-muted-foreground">{getFollowUpLabel(account)}</div>
            </td>
            <td className="px-4 py-4 text-muted-foreground">
              {formatCurrency(account.paidAmount)}
            </td>
            <td className="px-4 py-4 font-medium text-foreground">
              {formatCurrency(account.outstandingBalance)}
            </td>
            <td className="px-4 py-4">
              <span className="sr-only">{account.status}</span>
              <StatusPill
                priority={
                  account.status === "OVERDUE"
                    ? "overdue"
                    : account.status === "PARTIALLY_PAID"
                      ? "pending"
                      : "readonly"
                }
              >
                {account.status.replace("_", " ")}
              </StatusPill>
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
        ))}
      />
    </RecordListSection>
  );
}
