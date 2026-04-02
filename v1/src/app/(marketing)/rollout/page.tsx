import type { Metadata } from "next";
import {
  ArrowUpRight,
  Building2,
  MessageSquareMore,
  Smartphone,
  Zap,
} from "lucide-react";

import { PageHero } from "@/features/marketing/components/page-hero";
import { MarketingConversionPanel } from "@/features/marketing/components/marketing-conversion-panel";
import { SectionHeading } from "@/features/marketing/components/section-heading";
import { createMarketingMetadata } from "@/features/marketing/lib/metadata";
import { futureExpansion, rolloutPhases } from "@/features/marketing/lib/site-content";

export const metadata: Metadata = createMarketingMetadata({
  title: "Rollout",
  description:
    "Understand the current DWDS release, the phased rollout path, and what the platform is designed to support next across records, routes, exceptions, assistant, and automation.",
  pathname: "/rollout",
});

const futureIcons = [Smartphone, Zap, MessageSquareMore, Building2];

export default function RolloutPage() {
  return (
    <div className="space-y-6 pb-16 pt-1">
      <PageHero
        eyebrow="Rollout Path"
        title="Start with operational accuracy, then expand into customer-facing services."
        description="DWDS is being built in phases so the records, billing, cashiering, routes, notices, exceptions, assistant, and automation core stays stable before additional channels are layered in."
      >
        <article className="dwds-section flex h-full flex-col gap-4 rounded-[1rem] bg-white/52 p-5">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-primary/72">
            Suggested Rollout Order
          </p>
          <div className="grid gap-3">
            {[
              "1. Dashboard and staff access",
              "2. Readings, billing, and payments",
              "3. Follow-up, notices, and route operations",
              "4. Exceptions, assistant, automation, and readiness",
            ].map((item) => (
              <div key={item} className="rounded-[0.9rem] border border-border/60 bg-white/66 px-4 py-3 text-sm leading-6 text-foreground">
                {item}
              </div>
            ))}
          </div>
        </article>
      </PageHero>

      <section className="dwds-region overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[0.42fr_1.58fr]">
          <div className="border-b border-border/70 px-5 py-5 sm:px-7 lg:border-b-0 lg:border-r lg:px-8">
            <SectionHeading
              eyebrow="Phased Delivery"
              title="The current release is focused on staff operations."
              description="That keeps the first release grounded in the data integrity, auditability, and workflow controls that matter most to a utility team."
            />
          </div>
          <div className="grid gap-0 divide-y divide-border/70">
          {rolloutPhases.map((phase) => (
            <article
              key={phase.title}
              className="px-5 py-4 sm:px-7 lg:px-8"
            >
                <div className="grid gap-3 md:grid-cols-[0.16fr_0.32fr_1fr] md:items-start">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-primary/70">
                {phase.label}
              </p>
                  <h2 className="font-heading text-[1.55rem] text-foreground">{phase.title}</h2>
                  <p className="text-sm leading-6 text-muted-foreground">
                {phase.description}
              </p>
                </div>
            </article>
          ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.98fr_1.02fr]">
        <article className="dwds-panel-dark overflow-hidden">
          <div className="border-b border-white/12 px-5 py-5 sm:px-7 lg:px-8">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-primary-foreground/72">
            What Comes Next
          </p>
          </div>
          <div className="grid gap-0 divide-y divide-white/12">
            {futureExpansion.map((item, index) => {
              const Icon = futureIcons[index];

              return (
                <div
                  key={item.title}
                  className="px-5 py-4 sm:px-7 lg:px-8"
                >
                  <Icon aria-hidden="true" className="size-5 text-[#d7c08b]" />
                  <h3 className="mt-3 font-heading text-[1.55rem]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-primary-foreground/78">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </article>

        <article className="dwds-region overflow-hidden">
          <div className="border-b border-border/70 px-5 py-5 sm:px-7 lg:px-8">
            <SectionHeading
              eyebrow="Implementation Notes"
              title="The site now communicates the actual product shape."
              description="This public layer is aligned with the modules already present in the app, so the brand promise and the software surface are saying the same thing."
            />
          </div>
          <div className="grid gap-0 divide-y divide-border/70">
            {[
              "Public messaging now highlights the real MVP: customer records, metering, readings, billing, payments, and collections.",
              "The live product already includes routes, notices, exceptions, assistant support, and automation supervision in the protected operating layer.",
              "The route structure leaves room for future customer-facing pages without mixing them into the protected admin area.",
            ].map((item) => (
              <div
                key={item}
                className="flex gap-3 px-5 py-4 text-sm leading-6 text-muted-foreground sm:px-7 lg:px-8"
              >
                <ArrowUpRight
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-primary"
                />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <MarketingConversionPanel
        title="Ready to turn the rollout path into a real implementation conversation?"
        description="Use the public rollout request path for deployment fit, first-admin bootstrap planning, hosting shape, and the initial module sequence across real DWDS workspaces such as dashboard, billing, routes, exceptions, assistant, and automation."
      />
    </div>
  );
}
