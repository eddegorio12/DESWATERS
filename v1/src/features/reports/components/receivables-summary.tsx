import { formatCurrency } from "@/features/billing/lib/billing-calculations";

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
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-[1.9rem] border border-[#dbe9e5] bg-white/92 p-6 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.55)]">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Outstanding receivables
          </p>
          <p className="mt-4 text-4xl font-semibold tracking-tight text-foreground">
            {formatCurrency(totalOutstanding)}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Open bill balances still waiting for full settlement.
          </p>
        </article>

        <article className="rounded-[1.9rem] border border-[#f0d9d6] bg-[#fff7f6] p-6 shadow-[0_22px_72px_-48px_rgba(120,54,47,0.35)]">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8a2f28]">
            Overdue balance
          </p>
          <p className="mt-4 text-4xl font-semibold tracking-tight text-[#61211c]">
            {formatCurrency(overdueBalance)}
          </p>
          <p className="mt-2 text-sm text-[#8b5c56]">
            Past-due balances that already require receivables follow-up.
          </p>
        </article>
      </div>

      <article className="rounded-[1.9rem] border border-[#dbe9e5] bg-white/92 p-6 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.55)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Follow-up mix
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[1.35rem] bg-secondary/45 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Unpaid
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
              {unpaidCount}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">Bills with no posted payment yet.</p>
          </div>
          <div className="rounded-[1.35rem] bg-[#eef5ff] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1d4f84]">
              Partially paid
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-[#163d67]">
              {partiallyPaidCount}
            </p>
            <p className="mt-2 text-sm text-[#456789]">
              Bills with some settlement still short of full payment.
            </p>
          </div>
          <div className="rounded-[1.35rem] bg-[#fff0ee] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a2f28]">
              Overdue
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-[#61211c]">
              {overdueCount}
            </p>
            <p className="mt-2 text-sm text-[#8b5c56]">
              Bills past due as of the current Manila operating day.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-[1.35rem] border border-[#dbe9e5] bg-[#f8fcfb] px-4 py-3 text-sm text-muted-foreground">
          {overdueCustomerCount} customer
          {overdueCustomerCount === 1 ? "" : "s"} currently have overdue receivables.
        </div>
      </article>
    </section>
  );
}
