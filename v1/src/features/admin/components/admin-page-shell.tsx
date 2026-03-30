import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AdminHeroStat = {
  label: string;
  value: string;
  detail: string;
  accent?: "teal" | "sky" | "amber" | "violet" | "rose";
};

type AdminPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  stats?: AdminHeroStat[];
  children: ReactNode;
  className?: string;
};

const accentClasses: Record<NonNullable<AdminHeroStat["accent"]>, string> = {
  teal: "bg-[#dff4ef] text-[#17525a]",
  sky: "bg-[#e5f1fb] text-[#1d4f84]",
  amber: "bg-[#fbedd9] text-[#7a4f11]",
  violet: "bg-[#eee8fb] text-[#5a3ca3]",
  rose: "bg-[#fae4e2] text-[#8a2f28]",
};

export function AdminPageShell({
  eyebrow,
  title,
  description,
  actions,
  stats = [],
  children,
  className,
}: AdminPageShellProps) {
  return (
    <section className={cn("bg-transparent", className)}>
      <div className="flex w-full flex-col">
        <header className="border-b border-border/70 px-5 py-5 sm:px-7 lg:px-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-primary/72">
                {eyebrow}
              </p>
              <h1 className="mt-3 font-heading text-[1.9rem] leading-tight tracking-[-0.05em] text-foreground sm:text-[2.35rem]">
                {title}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                {description}
              </p>
            </div>

            {actions ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">{actions}</div>
            ) : null}
          </div>
        </header>

        {stats.length ? (
          <section className="border-b border-border/70">
            <div className="grid gap-0 md:grid-cols-2 xl:grid-cols-3">
              {stats.map((stat) => (
                <article
                  key={`${stat.label}-${stat.value}`}
                  className="border-b border-border/70 px-5 py-5 md:border-r xl:border-b-0 [&:nth-child(2n)]:md:border-r-0 [&:nth-child(3n)]:xl:border-r-0"
                >
                  <span
                    className={cn(
                      "inline-flex rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]",
                      accentClasses[stat.accent ?? "teal"]
                    )}
                  >
                    {stat.label}
                  </span>
                  <p className="mt-4 break-words font-heading text-[1.7rem] tracking-[-0.05em] text-foreground sm:text-[2rem]">
                    {stat.value}
                  </p>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                    {stat.detail}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <div className="flex flex-col gap-6 px-5 py-6 sm:px-7 lg:px-8">{children}</div>
      </div>
    </section>
  );
}
