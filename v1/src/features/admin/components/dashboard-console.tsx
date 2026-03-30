import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

type DashboardMetricAccent = "teal" | "sky" | "amber" | "violet" | "emerald" | "rose";

const metricAccentClasses: Record<DashboardMetricAccent, string> = {
  teal: "bg-[#e4f3ef] text-[#19545a]",
  sky: "bg-[#e7f1fb] text-[#1d4f84]",
  amber: "bg-[#fbedd9] text-[#7a4f11]",
  violet: "bg-[#ede7fb] text-[#5a3ca3]",
  emerald: "bg-[#e8f6ef] text-[#175447]",
  rose: "bg-[#fae4e2] text-[#8a2f28]",
};

export function DashboardPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "border border-border/70 bg-white/40 backdrop-blur-sm",
        className
      )}
    >
      {children}
    </article>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-primary/72">
          {eyebrow}
        </p>
        <h2 className="mt-3 font-heading text-[1.55rem] leading-tight tracking-[-0.03em] text-foreground sm:text-[1.8rem]">
          {title}
        </h2>
        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {Icon ? (
        <div className="hidden rounded-[0.95rem] border border-border/70 bg-white/60 p-2.5 text-primary sm:flex">
          <Icon className="size-5" />
        </div>
      ) : null}
    </div>
  );
}

export function DashboardMetricCard({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: string;
  detail: string;
  accent: DashboardMetricAccent;
}) {
  return (
    <article className="border-b border-border/70 px-5 py-5 md:border-r xl:border-b-0 [&:nth-child(2n)]:md:border-r-0 [&:nth-child(6n)]:xl:border-r-0">
      <div
        className={cn(
          "inline-flex rounded-full px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em]",
          metricAccentClasses[accent]
        )}
      >
        {label}
      </div>
      <p className="mt-4 text-[2.1rem] font-semibold tracking-[-0.03em] text-foreground sm:text-[2.35rem]">
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
    </article>
  );
}

export function ActionRow({
  href,
  title,
  summary,
  meta,
  actionLabel,
  icon: Icon,
  className,
}: {
  href: string;
  title: string;
  summary: string;
  meta?: string;
  actionLabel?: string;
  icon?: ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex cursor-pointer flex-col gap-4 px-5 py-4 transition-colors duration-200 hover:bg-secondary/30",
        className
      )}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          {Icon ? (
            <div className="flex size-9 shrink-0 items-center justify-center rounded-[0.85rem] border border-primary/10 bg-primary/8 text-primary transition-colors duration-200 group-hover:bg-primary/10">
              <Icon className="size-4.5" />
            </div>
          ) : null}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <p className="text-[0.98rem] font-semibold tracking-[-0.01em] text-foreground">
                {title}
              </p>
              {meta ? (
                <span className="text-[0.82rem] font-medium uppercase tracking-[0.14em] text-primary/78">
                  {meta}
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{summary}</p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 self-start text-sm font-medium text-primary">
          {actionLabel ? <span>{actionLabel}</span> : null}
          <ArrowRight className="size-4" />
        </div>
      </div>
    </Link>
  );
}
