import type { Metadata } from "next";
import {
  CheckCircle2,
  ClipboardCheck,
  FileClock,
  Fingerprint,
  Wallet,
} from "lucide-react";

import { PageHero } from "@/features/marketing/components/page-hero";
import { MarketingConversionPanel } from "@/features/marketing/components/marketing-conversion-panel";
import { SectionHeading } from "@/features/marketing/components/section-heading";
import { createMarketingMetadata } from "@/features/marketing/lib/metadata";
import { operatorViews, workflowSteps } from "@/features/marketing/lib/site-content";

export const metadata: Metadata = createMarketingMetadata({
  title: "Workflows",
  description:
    "See how DWDS handles utility workflows from customer setup through reading approval, billing governance, cashiering, notices, follow-up, and operational review.",
  pathname: "/workflows",
});

const stepIcons = [Fingerprint, ClipboardCheck, CheckCircle2, FileClock, Wallet];

export default function WorkflowsPage() {
  return (
    <div className="space-y-6 pb-16 pt-1">
      <PageHero
        eyebrow="Workflows"
        title="DWDS follows the same sequence your operations team already uses."
        description="The product reduces handoff friction by keeping data connected across readings, bills, cashiering, notices, follow-up, route work, and collections review."
      >
        <article className="dwds-section flex h-full flex-col gap-4 rounded-[1rem] bg-white/52 p-5">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-primary/72">
            Core Workflow Routes
          </p>
          <div className="grid gap-3">
            {["/admin/readings", "/admin/billing", "/admin/payments", "/admin/follow-up"].map((route) => (
              <div key={route} className="rounded-[0.9rem] border border-border/60 bg-white/66 px-4 py-3 text-sm font-medium text-foreground">
                {route}
              </div>
            ))}
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            Each stage in the workflow section below maps to one of these real DWDS protected modules rather than to a marketing preview.
          </p>
        </article>
      </PageHero>

      <section className="dwds-region overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[0.4fr_1.6fr]">
          <div className="border-b border-border/70 px-5 py-5 sm:px-7 lg:border-b-0 lg:border-r lg:px-8">
            <SectionHeading
              eyebrow="Operational Chain"
              title="A structured flow from service account to collections summary."
              description="Each stage is explicit so staff can see what is pending, what is approved, what has been issued, and what is still open."
            />
          </div>
          <div className="grid gap-0 divide-y divide-border/70">
          {workflowSteps.map((step, index) => {
            const Icon = stepIcons[index];

            return (
              <article
                key={step.title}
                className="px-5 py-4 sm:px-7 lg:px-8"
              >
                  <div className="grid items-start gap-4 md:grid-cols-[3rem_0.9fr_1.1fr]">
                    <div className="flex size-10 items-center justify-center rounded-[0.85rem] border border-[rgba(177,135,64,0.22)] bg-[rgba(177,135,64,0.12)] text-primary">
                      <Icon aria-hidden="true" className="size-4.5" />
                    </div>
                    <div>
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-primary/70">
                        Step {index + 1}
                      </p>
                      <h2 className="mt-2 font-heading text-[1.55rem] text-foreground">{step.title}</h2>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
              </article>
            );
          })}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="dwds-panel-dark overflow-hidden">
          <div className="border-b border-white/12 px-5 py-5 sm:px-7 lg:px-8">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-primary-foreground/72">
            Control Points
          </p>
          </div>
          <div className="grid gap-0 divide-y divide-white/12">
            {[
              "Reading approval separates field input from bill generation.",
              "Bills stay linked to approved readings, tariff versions, and billing-cycle controls for traceability.",
              "Payment posting updates the receivables state using completed or partial payments with official receipt generation.",
              "Collections reporting reflects the current business day instead of broad, noisy totals.",
            ].map((item) => (
              <div
                key={item}
                className="px-5 py-4 text-sm leading-6 text-primary-foreground/80 sm:px-7 lg:px-8"
              >
                {item}
              </div>
            ))}
          </div>
        </article>

        <article className="dwds-region overflow-hidden">
          <div className="border-b border-border/70 px-5 py-5 sm:px-7 lg:px-8">
            <SectionHeading
              eyebrow="Who Uses It"
              title="The workflow works across multiple DWDS roles."
              description="The same shared system supports different responsibilities without forcing everyone into the same context at once."
            />
          </div>
          <div className="grid gap-0 divide-y divide-border/70">
            {operatorViews.map((item) => (
              <div
                key={item.title}
                className="px-5 py-4 sm:px-7 lg:px-8"
              >
                <p className="text-base font-semibold text-foreground">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <MarketingConversionPanel
        title="If the workflow matches your operating day, move directly to rollout planning."
        description="DWDS keeps the product promise concrete: staff-facing utility work, governed outputs, role-aware controls, and real implemented workspaces such as billing, follow-up, routes, exceptions, and assistant support."
      />
    </div>
  );
}
