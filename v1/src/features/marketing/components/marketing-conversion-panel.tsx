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
    <section className="dwds-panel-dark relative overflow-hidden">
      <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="border-b border-white/12 px-5 py-6 sm:px-7 lg:border-b-0 lg:border-r lg:px-8">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-primary-foreground/72">
            Rollout Path
          </p>
          <h2 className="mt-3 max-w-3xl font-heading text-[1.9rem] leading-tight tracking-[-0.05em] sm:text-[2.35rem]">
            {title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-primary-foreground/78">
            {description}
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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
        <div className="grid gap-0 divide-y divide-white/12">
          {conversionTrustSignals.map((item) => (
            <div
              key={item}
              className="px-5 py-4 text-sm leading-6 text-primary-foreground/78 sm:px-7 lg:px-8"
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
