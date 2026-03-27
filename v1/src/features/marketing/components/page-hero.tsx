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
    <section className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
      <div className="max-w-3xl space-y-6 py-4">
        <ScrollAnimate delay={0}>
          <p className="dwds-kicker w-fit border-primary/10 bg-primary/6 text-primary/80">
            {eyebrow}
          </p>
        </ScrollAnimate>
        <ScrollAnimate delay={80}>
          <h1 className="max-w-4xl font-heading text-5xl leading-[0.92] tracking-[-0.04em] text-foreground sm:text-6xl xl:text-7xl">
            {title}
          </h1>
        </ScrollAnimate>
        <ScrollAnimate delay={160}>
          <p className="max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
            {description}
          </p>
        </ScrollAnimate>
        {(primaryAction || secondaryAction) && (
          <ScrollAnimate delay={240}>
            <div className="flex flex-col gap-3 sm:flex-row">
              {primaryAction ? (
                <Link
                  href={primaryAction.href}
                  className={cn(
                    buttonVariants({
                      className:
                        "h-11 rounded-full bg-[linear-gradient(135deg,#163154,#15527a_56%,#10938d)] px-6 text-white shadow-[0_24px_50px_-30px_rgba(15,35,62,0.8)] hover:brightness-105",
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
                        "h-11 rounded-full border-primary/12 bg-white/60 px-6 hover:bg-white",
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
      <ScrollAnimate delay={200} direction="scale">
        <div className="relative">{children}</div>
      </ScrollAnimate>
    </section>
  );
}
