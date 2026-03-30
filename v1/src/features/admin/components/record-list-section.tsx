"use client";

import type { FormEvent, ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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

function getFormHref(pathname: string, formData: FormData) {
  const params = new URLSearchParams();

  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string") {
      continue;
    }

    const normalizedValue = value.trim();

    if (!normalizedValue) {
      continue;
    }

    params.set(key, normalizedValue);
  }

  const query = params.toString();

  return query ? `${pathname}?${query}` : pathname;
}

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
  const pathname = usePathname();
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const href = getFormHref(pathname, new FormData(event.currentTarget));
    router.replace(href, { scroll: false });
  }

  return (
    <section className="border border-border/70 bg-white/44 p-5 backdrop-blur-sm sm:p-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-primary/72">
              {eyebrow}
            </p>
            <h2 className="font-heading text-[1.45rem] tracking-[-0.03em] text-foreground sm:text-[1.7rem]">
              {title}
            </h2>
            {description ? (
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">{resultsText}</p>
        </div>

        <form
          className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto]"
          role="search"
          onSubmit={handleSubmit}
        >
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

          <div className="grid gap-3 sm:grid-cols-2 xl:flex xl:flex-wrap xl:justify-end">
            <button
              type="submit"
              className={cn(buttonVariants({ className: "h-11 w-full rounded-2xl px-5 xl:w-auto" }))}
            >
              Apply filters
            </button>
            {hasActiveFilters ? (
              <Link
                href={resetHref}
                scroll={false}
                className={cn(
                  buttonVariants({
                    variant: "outline",
                    className: "h-11 w-full rounded-2xl px-5 xl:w-auto",
                  })
                )}
              >
                <X className="size-4" />
                Reset filters
              </Link>
            ) : null}
          </div>
        </form>

        {helperText || nextStep ? (
          <div className="flex flex-col gap-2 border border-border/70 bg-white/50 px-4 py-3 text-sm md:flex-row md:items-center md:justify-between">
            <p className="text-muted-foreground">{helperText}</p>
            {nextStep ? <p className="font-medium text-foreground">{nextStep}</p> : null}
          </div>
        ) : null}

        {children}
      </div>
    </section>
  );
}
