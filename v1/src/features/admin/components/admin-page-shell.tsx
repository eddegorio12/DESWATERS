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
          <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.12fr_0.88fr] lg:px-8 lg:py-8">
            <div className="space-y-5">
              <span className="dwds-kicker border-white/14 bg-white/8 text-white/78">
                {eyebrow}
              </span>

              <div className="space-y-3">
                <h1 className="max-w-4xl font-heading text-4xl leading-tight tracking-[-0.03em] sm:text-5xl">
                  {title}
                </h1>
                <p className="max-w-3xl text-sm leading-7 text-white/76 sm:text-base">
                  {description}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 self-start">
              {actions ? (
                <div className="flex flex-wrap items-center justify-start gap-3 lg:justify-end">
                  {actions}
                </div>
              ) : null}

              {stats.length ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {stats.map((stat) => (
                    <article
                      key={`${stat.label}-${stat.value}`}
                      className="rounded-[1.6rem] border border-white/12 bg-[linear-gradient(145deg,rgba(255,255,255,0.16),rgba(255,255,255,0.04))] p-5 backdrop-blur"
                    >
                      <span
                        className={cn(
                          "inline-flex rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]",
                          accentClasses[stat.accent ?? "teal"]
                        )}
                      >
                        {stat.label}
                      </span>
                      <p className="mt-4 break-words text-2xl font-semibold tracking-tight text-white sm:text-3xl">
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
