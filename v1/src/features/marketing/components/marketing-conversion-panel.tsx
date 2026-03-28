import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import { conversionTrustSignals } from "@/features/marketing/lib/site-content";
import { cn } from "@/lib/utils";

type MarketingConversionPanelProps = {
  title: string;
  description: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
};

export function MarketingConversionPanel({
  title,
  description,
  primaryLabel = "Plan rollout",
  primaryHref = "/contact",
  secondaryLabel = "View platform",
  secondaryHref = "/platform",
}: MarketingConversionPanelProps) {
  return (
    <section className="dwds-panel-dark relative overflow-hidden rounded-[2rem] px-6 py-8 sm:px-8">
      <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-foreground/70">
            Rollout Path
          </p>
          <h2 className="mt-4 font-heading text-3xl leading-tight sm:text-[2.5rem]">
            {title}
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-primary-foreground/78">
            {description}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href={primaryHref}
              className={cn(
                buttonVariants({
                  className:
                    "h-11 rounded-full bg-white px-6 text-primary hover:bg-white/90",
                })
              )}
            >
              {primaryLabel}
            </Link>
            <Link
              href={secondaryHref}
              className={cn(
                buttonVariants({
                  variant: "outline",
                  className:
                    "h-11 rounded-full border-white/20 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white",
                })
              )}
            >
              {secondaryLabel}
            </Link>
          </div>
        </div>

        <div className="space-y-3 border-t border-white/12 pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          {conversionTrustSignals.map((item) => (
            <div
              key={item}
              className="rounded-[1.35rem] border border-white/12 bg-white/7 px-4 py-3 text-sm leading-6 text-primary-foreground/78"
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
