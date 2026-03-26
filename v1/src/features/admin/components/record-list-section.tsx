import type { ReactNode } from "react";
import Link from "next/link";
import { ListFilter, Search, X } from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

type FilterOption = {
  label: string;
  value: string;
};

type HiddenField = {
  name: string;
  value: string;
};

type RecordListSectionProps = {
  eyebrow: string;
  title: string;
  description?: string;
  resultsText: string;
  searchPlaceholder: string;
  searchName: string;
  searchValue: string;
  filterName?: string;
  filterValue?: string;
  filterLabel?: string;
  filterOptions?: FilterOption[];
  helperText?: string;
  nextStep?: string;
  resetHref: string;
  hasActiveFilters: boolean;
  hiddenFields?: HiddenField[];
  children: ReactNode;
};

const controlClassName =
  "h-11 w-full rounded-2xl border border-input bg-white px-4 text-sm text-foreground shadow-xs outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20";

export function RecordListSection({
  eyebrow,
  title,
  description,
  resultsText,
  searchPlaceholder,
  searchName,
  searchValue,
  filterName,
  filterValue,
  filterLabel = "Filter",
  filterOptions = [],
  helperText,
  nextStep,
  resetHref,
  hasActiveFilters,
  hiddenFields = [],
  children,
}: RecordListSectionProps) {
  return (
    <section className="rounded-[1.9rem] border border-[#dbe9e5] bg-white/92 p-6 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.55)]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {eyebrow}
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
            {description ? (
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">{resultsText}</p>
        </div>

        <form className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto]" role="search">
          {hiddenFields.map((field) => (
            <input
              key={`${field.name}-${field.value}`}
              type="hidden"
              name={field.name}
              value={field.value}
            />
          ))}

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_13rem]">
            <label className="relative block">
              <span className="sr-only">Search records</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                name={searchName}
                defaultValue={searchValue}
                placeholder={searchPlaceholder}
                className={cn(controlClassName, "pl-10")}
              />
            </label>

            {filterName ? (
              <label className="relative block">
                <span className="sr-only">{filterLabel}</span>
                <ListFilter className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  name={filterName}
                  defaultValue={filterValue}
                  className={cn(controlClassName, "appearance-none pl-10")}
                >
                  {filterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3 xl:justify-end">
            <button
              type="submit"
              className={cn(buttonVariants({ className: "h-11 rounded-2xl px-5" }))}
            >
              Apply
            </button>
            {hasActiveFilters ? (
              <Link
                href={resetHref}
                className={cn(
                  buttonVariants({
                    variant: "outline",
                    className: "h-11 rounded-2xl px-5",
                  })
                )}
              >
                <X className="size-4" />
                Reset
              </Link>
            ) : null}
          </div>
        </form>

        {helperText || nextStep ? (
          <div className="flex flex-col gap-2 rounded-[1.4rem] border border-[#dbe9e5] bg-secondary/35 px-4 py-3 text-sm md:flex-row md:items-center md:justify-between">
            <p className="text-muted-foreground">{helperText}</p>
            {nextStep ? <p className="font-medium text-foreground">{nextStep}</p> : null}
          </div>
        ) : null}

        {children}
      </div>
    </section>
  );
}
