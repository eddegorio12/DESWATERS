import type { Metadata } from "next";
import Image from "next/image";
import {
  CheckCircle2,
  ClipboardCheck,
  FileClock,
  Fingerprint,
  Wallet,
} from "lucide-react";

import { PageHero } from "@/features/marketing/components/page-hero";
import { SectionHeading } from "@/features/marketing/components/section-heading";
import { operatorViews, workflowSteps } from "@/features/marketing/lib/site-content";

export const metadata: Metadata = {
  title: "Workflows | DEGORIO WATER DISTRIBUTION SERVICES",
  description:
    "See how DEGORIO WATER DISTRIBUTION SERVICES handles utility workflows from customer setup through reading approval, billing, payment entry, and daily review.",
};

const stepIcons = [Fingerprint, ClipboardCheck, CheckCircle2, FileClock, Wallet];

export default function WorkflowsPage() {
  return (
    <div className="space-y-20 pb-24 pt-10">
      <PageHero
        eyebrow="Workflows"
        title="DWDS follows the same sequence your operations team already uses."
        description="The product reduces handoff friction by keeping data connected across readings, bills, cashiering, follow-up, and collections review."
      >
        <article className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/92 p-4 shadow-[0_24px_80px_-50px_rgba(12,60,64,0.45)]">
          <Image
            src="/marketing/billing-preview.svg"
            alt="DWDS workflow billing preview"
            width={1200}
            height={840}
            className="h-auto w-full rounded-[1.5rem] border border-border/70"
            priority
          />
        </article>
      </PageHero>

      <section className="space-y-8">
        <SectionHeading
          eyebrow="Operational Chain"
          title="A structured flow from service account to collections summary."
          description="Each stage is explicit so staff can see what is pending, what is approved, and what is still open."
        />
        <div className="grid gap-5 lg:grid-cols-5">
          {workflowSteps.map((step, index) => {
            const Icon = stepIcons[index];

            return (
              <article
                key={step.title}
                className="rounded-[2rem] border border-border/70 bg-white/88 p-6 shadow-[0_20px_70px_-45px_rgba(14,60,63,0.55)]"
              >
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-primary/70">
                  Step {index + 1}
                </p>
                <h2 className="mt-3 font-heading text-2xl text-foreground">{step.title}</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {step.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-[2rem] border border-primary/10 bg-[#0f3f43] p-8 text-primary-foreground shadow-[0_28px_90px_-60px_rgba(15,63,67,1)]">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-foreground/70">
            Control Points
          </p>
          <div className="mt-8 space-y-4">
            {[
              "Reading approval separates field input from bill generation.",
              "Bills stay linked to a single approved reading for traceability.",
              "Payment posting updates the receivables state using completed payments only.",
              "Collections reporting reflects the current business day instead of broad, noisy totals.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[1.5rem] border border-white/12 bg-white/6 px-4 py-4 text-sm leading-6 text-primary-foreground/80"
              >
                {item}
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[2rem] border border-border/70 bg-white/90 p-8 shadow-[0_20px_70px_-45px_rgba(14,60,63,0.55)]">
          <SectionHeading
            eyebrow="Who Uses It"
            title="The workflow works across multiple DWDS roles."
            description="The same shared system supports different responsibilities without forcing everyone into the same context at once."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {operatorViews.map((item) => (
              <div
                key={item.title}
                className="rounded-[1.5rem] border border-border/70 bg-secondary/35 p-5"
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
    </div>
  );
}
