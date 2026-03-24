import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

type CollectionsFilterFormProps = {
  startDateInput: string;
  endDateInput: string;
};

export function CollectionsFilterForm({
  startDateInput,
  endDateInput,
}: CollectionsFilterFormProps) {
  return (
    <section className="rounded-[1.9rem] border border-[#dbe9e5] bg-white/92 p-6 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.55)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Report Filters
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Review a custom collections window
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Date filters use the Manila operating calendar.
        </p>
      </div>

      <form className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto]">
        <label className="grid gap-2 text-sm font-medium text-foreground">
          Start date
          <input
            type="date"
            name="startDate"
            defaultValue={startDateInput}
            className="h-11 rounded-2xl border border-[#cfe0db] bg-white px-4 text-sm text-foreground outline-none transition-colors focus:border-[#2f7b82]"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-foreground">
          End date
          <input
            type="date"
            name="endDate"
            defaultValue={endDateInput}
            className="h-11 rounded-2xl border border-[#cfe0db] bg-white px-4 text-sm text-foreground outline-none transition-colors focus:border-[#2f7b82]"
          />
        </label>

        <button
          type="submit"
          className={cn(
            buttonVariants({
              className: "mt-auto h-11 rounded-full px-6",
            })
          )}
        >
          Apply filters
        </button>

        <Link
          href="/admin/collections"
          className={cn(
            buttonVariants({
              variant: "outline",
              className: "mt-auto h-11 rounded-full px-6",
            })
          )}
        >
          Reset to today
        </Link>
      </form>
    </section>
  );
}
