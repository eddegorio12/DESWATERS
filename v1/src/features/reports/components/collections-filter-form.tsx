import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import {
  AdminSurfaceHeader,
  AdminSurfacePanel,
} from "@/features/admin/components/admin-surface-panel";
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
    <AdminSurfacePanel>
      <AdminSurfaceHeader
        eyebrow="Report Filters"
        title="Review a custom collections window"
        description="Date filters use the Manila operating calendar so historical collections stay aligned with the operating day."
      />

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
    </AdminSurfacePanel>
  );
}
