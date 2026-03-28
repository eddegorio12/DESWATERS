import { formatCurrency } from "@/features/billing/lib/billing-calculations";
import {
  AdminSurfaceHeader,
  AdminSurfacePanel,
} from "@/features/admin/components/admin-surface-panel";

type ReceivablesSummaryProps = {
  totalOutstanding: number;
  overdueBalance: number;
  overdueCustomerCount: number;
  unpaidCount: number;
  partiallyPaidCount: number;
  overdueCount: number;
};

export function ReceivablesSummary({
  totalOutstanding,
  overdueBalance,
  overdueCustomerCount,
  unpaidCount,
  partiallyPaidCount,
  overdueCount,
}: ReceivablesSummaryProps) {
  return (
    <AdminSurfacePanel>
      <AdminSurfaceHeader
        eyebrow="Receivables Snapshot"
        title="Separate total exposure from the accounts already in active follow-up."
      />

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="grid gap-4">
          <article className="rounded-[1.2rem] border border-border/65 bg-background/85 px-4 py-4">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/72">
              Outstanding receivables
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
              {formatCurrency(totalOutstanding)}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Open bill balances still waiting for full settlement.
            </p>
          </article>

          <article className="rounded-[1.2rem] border border-rose-200 bg-rose-50/85 px-4 py-4">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-rose-700">
              Overdue balance
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-rose-950">
              {formatCurrency(overdueBalance)}
            </p>
            <p className="mt-2 text-sm text-rose-800/80">
              Past-due balances that already require receivables follow-up.
            </p>
          </article>

          <div className="rounded-[1.2rem] border border-border/65 bg-secondary/18 px-4 py-3 text-sm text-muted-foreground">
            {overdueCustomerCount} customer
            {overdueCustomerCount === 1 ? "" : "s"} currently have overdue receivables.
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.35rem] border border-border/70 bg-white/78">
          <div className="border-b border-border/70 px-4 py-4">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/72">
              Follow-up mix
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Keep the bill mix visible before moving into the detailed receivables queue.
            </p>
          </div>
          <div className="divide-y divide-border/70">
            <div className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div>
                <p className="text-sm font-semibold text-foreground">Unpaid</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Bills with no posted payment yet.
                </p>
              </div>
              <p className="text-3xl font-semibold tracking-tight text-foreground">{unpaidCount}</p>
            </div>
            <div className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div>
                <p className="text-sm font-semibold text-sky-900">Partially paid</p>
                <p className="mt-1 text-sm text-sky-900/70">
                  Bills with some settlement still short of full payment.
                </p>
              </div>
              <p className="text-3xl font-semibold tracking-tight text-sky-900">
                {partiallyPaidCount}
              </p>
            </div>
            <div className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div>
                <p className="text-sm font-semibold text-rose-900">Overdue</p>
                <p className="mt-1 text-sm text-rose-900/70">
                  Bills past due as of the current Manila operating day.
                </p>
              </div>
              <p className="text-3xl font-semibold tracking-tight text-rose-950">{overdueCount}</p>
            </div>
          </div>
        </div>
      </div>
    </AdminSurfacePanel>
  );
}
