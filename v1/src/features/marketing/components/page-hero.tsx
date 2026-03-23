import type { ReactNode } from "react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
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
    <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
      <div className="max-w-3xl space-y-6 py-4">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary/75">
          {eyebrow}
        </p>
        <h1 className="max-w-4xl font-heading text-5xl leading-[0.96] tracking-tight text-foreground sm:text-6xl">
          {title}
        </h1>
        <p className="max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
          {description}
        </p>
        {(primaryAction || secondaryAction) && (
          <div className="flex flex-col gap-3 sm:flex-row">
            {primaryAction ? (
              <Link
                href={primaryAction.href}
                className={cn(
                  buttonVariants({
                    className: "h-11 rounded-full px-6 shadow-sm",
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
                    className: "h-11 rounded-full px-6",
                  })
                )}
              >
                {secondaryAction.label}
              </Link>
            ) : null}
          </div>
        )}
      </div>
      <div>{children}</div>
    </section>
  );
}
