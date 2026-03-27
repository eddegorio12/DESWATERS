import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, CheckCircle2 } from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { PageHero } from "@/features/marketing/components/page-hero";
import { SectionHeading } from "@/features/marketing/components/section-heading";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "DEGORIO WATER DISTRIBUTION SERVICES | Water Utility Operations Platform",
  description:
    "DEGORIO WATER DISTRIBUTION SERVICES gives utility operators one staff-facing control surface for reading approval, billing governance, collections, and overdue follow-up.",
};

const heroHighlights = [
  "Staff-facing utility workspace with protected internal access",
  "Printable billing, receipt, and notice outputs tied to live records",
  "Role-aware workflow controls across readings, billing, cashiering, and follow-up",
] as const;

const readinessSignals = [
  {
    title: "Internal auth posture",
    description: "Auth.js credentials, role checks, and forced temporary-password rotation for staff accounts.",
  },
  {
    title: "Billing governance",
    description: "Approved-reading billing, finalized cycle controls, print tracking, and auditable regeneration reasons.",
  },
  {
    title: "Managed Postgres path",
    description: "PostgreSQL-first Prisma runtime with Supabase-targeted deployment and migration guidance already in repo.",
  },
  {
    title: "Operator-ready outputs",
    description: "Printable consumer bills, official receipts, and follow-up notices live in the same operational system.",
  },
] as const;

const workflowProofSections = [
  {
    eyebrow: "Workflow Proof 01",
    title: "Move from approved usage to printable bills with one governed chain.",
    description:
      "DWDS keeps the meter-to-bill path staff-facing and traceable. Customer records, meter assignments, reading approval, tariff-backed billing, and print-ready statements stay connected instead of living in separate tools.",
    imageSrc: "/marketing/billing-preview.svg",
    imageAlt:
      "DWDS billing workspace preview showing bill summary cards and line-item sections for statement review.",
    bullets: [
      "Meter assignments and active account holders stay tied to the billing record path.",
      "Only approved readings advance into billing, so review happens before charges are issued.",
      "Printable statements stay linked to the exact reading and tariff context behind the bill.",
    ],
  },
  {
    eyebrow: "Workflow Proof 02",
    title: "Keep daily billing, cashiering, and collections review on the same control surface.",
    description:
      "The homepage now leads with product evidence because the operational value is in the connected day-to-day view: queue pressure, module access, collections visibility, and audit context in one internal workspace.",
    imageSrc: "/marketing/dashboard-preview.svg",
    imageAlt:
      "DWDS operations dashboard preview showing left navigation, KPI counters, workflow panels, and collections visibility.",
    bullets: [
      "Managers and staff open one dashboard instead of piecing status together from separate reports.",
      "Cash movement, open work, and module routing stay visible without overstating consumer-facing capabilities.",
      "The product remains an internal operations platform, not a public self-service portal.",
    ],
  },
  {
    eyebrow: "Workflow Proof 03",
    title: "Work overdue pressure, notices, and route-aware operations from dedicated queues.",
    description:
      "DWDS does not stop at bill creation. Receivables follow-up, printable notices, route ownership, and service-status actions remain part of the operating model so teams can manage collection pressure with clear next steps.",
    imageSrc: "/marketing/follow-up-preview.svg",
    imageAlt:
      "DWDS follow-up workspace preview showing overdue stages, account detail, and notification activity.",
    bullets: [
      "Reminder, final-notice, disconnection-review, and reinstatement actions stay visible as explicit workflow states.",
      "Notice generation is tied to live records, which reduces template drift and manual rework.",
      "Route-aware billing and distribution controls support rollout planning beyond the cashier window.",
    ],
  },
] as const;

export default function HomePage() {
  return (
    <div className="space-y-24 pb-24 pt-4">
      <PageHero
        eyebrow="Water Utility Operations"
        title="Run the utility operating day from reading approval to collections closeout."
        description="DWDS is a staff-facing control surface for customer records, meter operations, billing governance, cashier posting, receivables follow-up, and deployment-ready reporting. It is built for internal utility teams, not positioned as a consumer self-service portal."
        primaryAction={{ href: "/platform", label: "View platform" }}
        secondaryAction={{ href: "/rollout", label: "Plan rollout" }}
      >
        <article className="dwds-section overflow-hidden p-4">
          <div className="rounded-[1.7rem] border border-border/70 bg-[linear-gradient(180deg,rgba(224,239,249,0.94),rgba(247,250,253,0.76))] p-3">
            <Image
              src="/marketing/dashboard-preview.svg"
              alt="DWDS dashboard preview"
              width={1200}
              height={840}
              className="h-auto w-full rounded-[1.3rem] border border-border/70"
              priority
            />
          </div>
          <div className="mt-4 rounded-[1.45rem] border border-border/70 bg-white/78 p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/70">
              What this homepage now proves early
            </p>
            <div className="mt-4 space-y-3">
              {heroHighlights.map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
                  <BadgeCheck className="mt-1 size-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </article>
      </PageHero>

      <section className="grid gap-4 border-y border-border/75 py-5 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
        <div>
          <p className="dwds-kicker border-primary/10 bg-primary/6 text-primary/76">
            Readiness Signal
          </p>
          <h2 className="mt-4 font-heading text-3xl leading-tight tracking-[-0.03em] text-foreground sm:text-[2.6rem]">
            Deployment fit, governance, and operator trust appear before the feature tour.
          </h2>
        </div>
        <div className="divide-y divide-border/70 overflow-hidden rounded-[1.7rem] border border-border/75 bg-white/72">
          {readinessSignals.map((item) => (
            <div key={item.title} className="grid gap-2 px-5 py-4 md:grid-cols-[0.34fr_1fr] md:gap-5">
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-8">
        <SectionHeading
          eyebrow="Operational Proof"
          title="The homepage now leads with real workflow evidence instead of a balanced feature catalog."
          description="Each section maps to an implemented DWDS surface and shows how the product handles the operating chain utility teams actually manage: meter-to-bill control, cash and collections visibility, and overdue pressure with route-aware follow-through."
        />
        <div className="space-y-5">
          {workflowProofSections.map((section, index) => (
            <article key={section.title} className="dwds-section overflow-hidden">
              <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
                <div
                  className={cn(
                    "border-b border-border/70 bg-[linear-gradient(180deg,rgba(224,239,249,0.92),rgba(243,248,252,0.84))] p-4 lg:border-b-0",
                    index % 2 === 1 ? "lg:order-2 lg:border-l" : "lg:border-r"
                  )}
                >
                  <Image
                    src={section.imageSrc}
                    alt={section.imageAlt}
                    width={1200}
                    height={840}
                    className="h-auto w-full rounded-[1.4rem] border border-border/60"
                  />
                </div>
                <div className="flex flex-col justify-between p-6 lg:p-8">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/72">
                      {section.eyebrow}
                    </p>
                    <h3 className="mt-4 font-heading text-3xl text-foreground">{section.title}</h3>
                    <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
                      {section.description}
                    </p>
                  </div>
                  <div className="mt-6 space-y-3 border-t border-border/70 pt-4">
                    {section.bullets.map((item) => (
                      <div key={item} className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
                        <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="dwds-panel-dark rounded-[2.25rem] px-8 py-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-foreground/70">
              Staff-Facing By Design
            </p>
            <h2 className="mt-4 font-heading text-4xl leading-tight">
              Evaluate DWDS as the operating layer for internal utility work, then plan the rollout around that core.
            </h2>
            <p className="mt-4 text-sm leading-7 text-primary-foreground/78">
              The homepage now closes on the same message it opens with: DWDS is a deployment-ready internal utility platform for operators and administrators, with future consumer channels kept explicitly separate from the current product promise.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/platform"
              className={cn(
                buttonVariants({
                  className:
                    "h-11 rounded-full bg-white px-6 text-primary hover:bg-white/90",
                })
              )}
            >
              View platform
            </Link>
            <Link
              href="/rollout"
              className={cn(
                buttonVariants({
                  variant: "outline",
                  className:
                    "h-11 rounded-full border-white/20 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white",
                })
              )}
            >
              Plan rollout
            </Link>
          </div>
        </div>
        <div className="mt-8 border-t border-white/12 pt-5 text-sm leading-6 text-primary-foreground/72">
          Internal sign-in remains available for staffed environments, but the public homepage now prioritizes product proof and rollout readiness over access prompts.
        </div>
      </section>
    </div>
  );
}
