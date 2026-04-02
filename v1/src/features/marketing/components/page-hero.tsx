import type { ReactNode } from "react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import { ScrollAnimate } from "@/features/marketing/components/scroll-animate";
import { cn } from "@/lib/utils";

type Action = {
  href: string;
  label: string;
};

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryAction?: Action;
  secondaryAction?: Action;
  children?: ReactNode;
};

export function PageHero({
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  children,
}: PageHeroProps) {
  return (
    <section className="dwds-region overflow-hidden">
      <div className="grid gap-0 xl:grid-cols-[0.42fr_1.58fr]">
        <ScrollAnimate delay={0}>
          <div className="border-b border-border/70 px-5 py-6 sm:px-7 xl:border-b-0 xl:border-r xl:px-8">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-primary/72">
              {eyebrow}
            </p>
            <div className="mt-5 space-y-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-primary/72">
                Staff-facing utility platform
              </p>
              <div className="space-y-2 text-sm leading-6 text-muted-foreground">
                <p>Protected DWDS surface</p>
                <p>Real workspace samples</p>
                <p>Deployment-first scope</p>
              </div>
            </div>
          </div>
        </ScrollAnimate>
        <div className="grid gap-0 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="border-b border-border/70 px-5 py-6 sm:px-7 lg:border-b-0 lg:border-r lg:px-8">
            <div className="max-w-3xl">
              <ScrollAnimate delay={80}>
                <h1 className="max-w-4xl font-heading text-[2rem] leading-[1] tracking-[-0.05em] text-foreground sm:text-[2.45rem] xl:text-[2.95rem]">
                  {title}
                </h1>
              </ScrollAnimate>
              <ScrollAnimate delay={160}>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                  {description}
                </p>
              </ScrollAnimate>
              {(primaryAction || secondaryAction) && (
                <ScrollAnimate delay={240}>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    {primaryAction ? (
                      <Link
                        href={primaryAction.href}
                        className={cn(
                          buttonVariants({
                            className:
                              "h-11 rounded-full bg-primary px-6 text-white shadow-[0_14px_28px_-20px_rgba(20,89,129,0.38)] hover:bg-primary/92",
                          })
                        )}
                      >
                        {primaryAction.label}
                      </Link>
                    ) : null}
                    {secondaryAction ? (
                      <Link
                        href={secondaryAction.href}
                        className={cn(
                          buttonVariants({
                            variant: "outline",
                            className:
                              "h-11 rounded-full border-[rgba(177,135,64,0.24)] bg-white/60 px-6 hover:bg-white",
                          })
                        )}
                      >
                        {secondaryAction.label}
                      </Link>
                    ) : null}
                  </div>
                </ScrollAnimate>
              )}
            </div>
          </div>
          <ScrollAnimate delay={200} direction="scale">
            <div className="relative bg-secondary/38 p-3 sm:p-4">
              {children}
            </div>
          </ScrollAnimate>
        </div>
      </div>
    </section>
  );
}
