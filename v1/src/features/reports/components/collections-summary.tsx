import { formatCurrency } from "@/features/billing/lib/billing-calculations";

type CollectionsSummaryProps = {
  totalCollections: number;
  paymentCount: number;
  collectionRangeLabel: string;
  dayCount: number;
};

export function CollectionsSummary({
  totalCollections,
  paymentCount,
  collectionRangeLabel,
  dayCount,
}: CollectionsSummaryProps) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      <article className="rounded-[1.9rem] border border-[#dbe9e5] bg-white/92 p-6 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.55)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Collection Date
        </p>
        <p className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
          {collectionRangeLabel}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {dayCount} operating day{dayCount === 1 ? "" : "s"} aligned to Manila
          reporting time.
        </p>
      </article>

      <article className="rounded-[1.9rem] border border-[#dbe9e5] bg-white/92 p-6 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.55)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Total Collections
        </p>
        <p className="mt-4 text-4xl font-semibold tracking-tight text-foreground">
          {formatCurrency(totalCollections)}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Sum of all completed payments recorded inside the selected range.
        </p>
      </article>

      <article className="rounded-[1.9rem] border border-[#dbe9e5] bg-white/92 p-6 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.55)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Payments Recorded
        </p>
        <p className="mt-4 text-4xl font-semibold tracking-tight text-foreground">
          {paymentCount}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Completed payment entries included in this reporting window.
        </p>
      </article>
    </section>
  );
}
