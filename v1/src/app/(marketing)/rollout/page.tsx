import type { Metadata } from "next";
import Image from "next/image";
import {
  ArrowUpRight,
  Building2,
  MessageSquareMore,
  Smartphone,
  Zap,
} from "lucide-react";

import { PageHero } from "@/features/marketing/components/page-hero";
import { SectionHeading } from "@/features/marketing/components/section-heading";
import { futureExpansion, rolloutPhases } from "@/features/marketing/lib/site-content";

export const metadata: Metadata = {
  title: "Rollout | DEGORIO WATER DISTRIBUTION SERVICES",
  description:
    "Understand the current DEGORIO WATER DISTRIBUTION SERVICES release, the phased rollout path, and what the platform is designed to support next.",
};

const futureIcons = [Smartphone, Zap, MessageSquareMore, Building2];

export default function RolloutPage() {
  return (
    <div className="space-y-20 pb-24 pt-4">
      <PageHero
        eyebrow="Rollout Path"
        title="Start with operational accuracy, then expand into customer-facing services."
        description="DWDS is being built in phases so the billing, collections, and follow-up core stays stable before additional channels are layered in."
      >
        <article className="dwds-panel overflow-hidden p-4">
          <Image
            src="/marketing/follow-up-preview.svg"
            alt="DWDS rollout preview showing receivables follow-up operations"
            width={1200}
            height={840}
            className="h-auto w-full rounded-[1.5rem] border border-border/70"
            priority
          />
        </article>
      </PageHero>

      <section className="space-y-8">
        <SectionHeading
          eyebrow="Phased Delivery"
          title="The current release is focused on staff operations."
          description="That keeps the first version grounded in the data integrity and workflow controls that matter most to a utility team."
        />
        <div className="grid gap-5 lg:grid-cols-3">
          {rolloutPhases.map((phase) => (
            <article
              key={phase.title}
              className="dwds-panel p-6"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary/70">
                {phase.label}
              </p>
              <h2 className="mt-4 font-heading text-2xl text-foreground">{phase.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {phase.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="dwds-panel-dark p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-foreground/70">
            What Comes Next
          </p>
          <div className="mt-8 grid gap-4">
            {futureExpansion.map((item, index) => {
              const Icon = futureIcons[index];

              return (
                <div
                  key={item.title}
                  className="rounded-[1.5rem] border border-white/12 bg-white/6 p-5"
                >
                  <Icon className="size-5 text-[#8ce1d5]" />
                  <h3 className="mt-4 font-heading text-2xl">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-primary-foreground/78">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </article>

        <article className="dwds-panel p-8">
          <SectionHeading
            eyebrow="Implementation Notes"
            title="The site now communicates the actual product shape."
            description="This public layer is aligned with the modules already present in the app, so the brand promise and the software surface are saying the same thing."
          />
          <div className="mt-8 space-y-4">
            {[
              "Public messaging now highlights the real MVP: customer records, metering, readings, billing, payments, and collections.",
              "The route structure leaves room for future customer-facing pages without mixing them into the protected admin area.",
              "Metadata and navigation now reflect DWDS as a product platform instead of a temporary setup screen.",
            ].map((item) => (
              <div
                key={item}
                className="flex gap-3 rounded-[1.4rem] border border-border/70 bg-secondary/35 px-4 py-4 text-sm leading-6 text-muted-foreground"
              >
                <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
