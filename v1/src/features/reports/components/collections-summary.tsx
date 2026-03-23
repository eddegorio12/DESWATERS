import { formatCurrency } from "@/features/billing/lib/billing-calculations";

type CollectionsSummaryProps = {
  totalCollections: number;
  paymentCount: number;
  collectionDateLabel: string;
};

export function CollectionsSummary({
  totalCollections,
  paymentCount,
  collectionDateLabel,
}: CollectionsSummaryProps) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      <article className="rounded-3xl border border-border bg-background p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Collection Date
        </p>
        <p className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
          {collectionDateLabel}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Daily totals use recorded payment timestamps for the current operating day.
        </p>
      </article>

      <article className="rounded-3xl border border-border bg-background p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Total Collections
        </p>
        <p className="mt-4 text-4xl font-semibold tracking-tight text-foreground">
          {formatCurrency(totalCollections)}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Sum of all payments recorded today.
        </p>
      </article>

      <article className="rounded-3xl border border-border bg-background p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Payments Recorded
        </p>
        <p className="mt-4 text-4xl font-semibold tracking-tight text-foreground">
          {paymentCount}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Completed payment entries included in today&apos;s report.
        </p>
      </article>
    </section>
  );
}
