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
    <main className={cn("min-h-screen bg-transparent px-5 py-6 sm:px-6 sm:py-8", className)}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="overflow-hidden rounded-[2rem] border border-[#d4e7e3] bg-[linear-gradient(135deg,#0f3f43,#19545a_52%,#2f7b82)] text-white shadow-[0_32px_90px_-48px_rgba(16,63,67,0.9)]">
          <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.12fr_0.88fr] lg:px-8 lg:py-8">
            <div className="space-y-5">
              <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-white/78">
                {eyebrow}
              </span>

              <div className="space-y-3">
                <h1 className="max-w-4xl font-heading text-4xl leading-tight tracking-tight sm:text-5xl">
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
                      className="rounded-[1.6rem] border border-white/12 bg-[linear-gradient(145deg,rgba(255,255,255,0.16),rgba(255,255,255,0.06))] p-5 backdrop-blur"
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
    </main>
  );
}
