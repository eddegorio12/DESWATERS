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
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="dwds-panel-dark overflow-hidden">
          <div className="grid gap-6 px-5 py-5 sm:px-6 sm:py-6 lg:grid-cols-[1.18fr_0.82fr] lg:gap-8 lg:px-8 lg:py-8">
            <div className="space-y-5">
              <span className="dwds-kicker border-white/14 bg-white/8 text-white/78">
                {eyebrow}
              </span>

              <div className="space-y-3">
                <h1 className="max-w-4xl font-heading text-3xl leading-tight tracking-[-0.03em] sm:text-4xl lg:text-5xl">
                  {title}
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-white/76 sm:text-base sm:leading-7">
                  {description}
                </p>
              </div>

              {actions ? (
                <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:flex-wrap">
                  {actions}
                </div>
              ) : null}
            </div>

            <div className="self-start lg:justify-self-end">
              {stats.length ? (
                <div className="grid gap-0 overflow-hidden rounded-[1.5rem] border border-white/12 bg-white/7 sm:grid-cols-2">
                  {stats.map((stat) => (
                    <article
                      key={`${stat.label}-${stat.value}`}
                      className="border-b border-white/10 p-4 last:border-b-0 sm:border-b-0 sm:p-5 [&:nth-child(odd)]:sm:border-r [&:nth-child(odd)]:sm:border-white/10"
                    >
                      <span
                        className={cn(
                          "inline-flex rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]",
                          accentClasses[stat.accent ?? "teal"]
                        )}
                      >
                        {stat.label}
                      </span>
                      <p className="mt-4 break-words text-2xl font-semibold tracking-tight text-white sm:text-[2rem]">
                        {stat.value}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-white/70">{stat.detail}</p>
                    </article>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {children}
      </div>
    </section>
  );
}
