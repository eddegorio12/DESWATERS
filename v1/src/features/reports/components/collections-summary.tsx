import { formatCurrency } from "@/features/billing/lib/billing-calculations";
import {
  AdminSurfaceHeader,
  AdminSurfacePanel,
} from "@/features/admin/components/admin-surface-panel";

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
    <AdminSurfacePanel>
      <AdminSurfaceHeader
        eyebrow="Collections Snapshot"
        title="Keep the reporting window, cash total, and posting volume in one summary strip."
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,0.8fr)]">
        <article className="rounded-[1.2rem] border border-border/65 bg-secondary/24 px-4 py-4">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/72">
            Collection window
          </p>
          <p className="mt-3 text-xl font-semibold tracking-tight text-foreground">
            {collectionRangeLabel}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {dayCount} operating day{dayCount === 1 ? "" : "s"} aligned to Manila reporting time.
          </p>
        </article>

        <article className="rounded-[1.2rem] border border-border/65 bg-background/85 px-4 py-4">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/72">
            Total collections
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
            {formatCurrency(totalCollections)}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Sum of completed payments inside the selected range.
          </p>
        </article>

        <article className="rounded-[1.2rem] border border-border/65 bg-background/85 px-4 py-4">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/72">
            Payments posted
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
            {paymentCount}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Completed payment entries included in this reporting window.
          </p>
        </article>
      </div>
    </AdminSurfacePanel>
  );
}
