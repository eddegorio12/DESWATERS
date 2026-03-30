import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  CheckCircle2,
  Droplets,
  FileText,
  Gauge,
  Users,
  Wallet,
  Activity,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { ScrollAnimate } from "@/features/marketing/components/scroll-animate";
import { SectionHeading } from "@/features/marketing/components/section-heading";
import { createMarketingMetadata } from "@/features/marketing/lib/metadata";
import { cn } from "@/lib/utils";

export const metadata: Metadata = createMarketingMetadata({
  title: "Water Utility Operations Platform",
  description:
    "DWDS gives utility operators one staff-facing control surface for reading approval, billing governance, collections, and overdue follow-up.",
  pathname: "/",
});

const heroHighlights = [
  "Staff-facing utility workspace with protected internal access",
  "Printable billing, receipt, and notice outputs tied to live records",
  "Role-aware workflow controls across readings, billing, cashiering, and follow-up",
] as const;

const trustStats = [
  { value: "6", label: "Core modules", sublabel: "End-to-end operations" },
  { value: "5", label: "Staff roles", sublabel: "Role-based access" },
  { value: "100%", label: "Auditable", sublabel: "Every action tracked" },
  { value: "1", label: "Control surface", sublabel: "Unified workspace" },
] as const;

const readinessSignals = [
  {
    title: "Internal auth posture",
    description:
      "Auth.js credentials, role checks, and forced temporary-password rotation for staff accounts.",
  },
  {
    title: "Billing governance",
    description:
      "Approved-reading billing, finalized cycle controls, print tracking, and auditable regeneration reasons.",
  },
  {
    title: "Managed Postgres path",
    description:
      "PostgreSQL-first Prisma runtime with Supabase-targeted deployment and migration guidance already in repo.",
  },
  {
    title: "Operator-ready outputs",
    description:
      "Printable consumer bills, official receipts, and follow-up notices live in the same operational system.",
  },
] as const;

const workflowProofSections = [
  {
    eyebrow: "Workflow Proof 01",
    title: "From approved readings to printable bills in one governed chain.",
    description:
      "DWDS keeps the meter-to-bill path staff-facing and traceable. Customer records, meter assignments, reading approval, tariff-backed billing, and print-ready statements stay connected.",
    imageSrc: "/marketing/billing-preview.svg",
    imageAlt:
      "DWDS billing workspace preview showing bill summary cards and line-item sections.",
    bullets: [
      "Meter assignments and active account holders stay tied to the billing record path.",
      "Only approved readings advance into billing before charges are issued.",
      "Printable statements remain linked to the reading and tariff context behind the bill.",
    ],
  },
  {
    eyebrow: "Workflow Proof 02",
    title: "Billing, cashiering, and collections on one surface.",
    description:
      "Queue pressure, module access, collections visibility, and audit context stay visible in one internal workspace instead of being reconstructed from separate reports.",
    imageSrc: "/marketing/dashboard-preview.svg",
    imageAlt:
      "DWDS operations dashboard preview showing KPI counters and workflow panels.",
    bullets: [
      "Managers and staff read one workspace instead of separate status views.",
      "Cash movement, open work, and module routing stay visible at a glance.",
      "The product stays positioned as an internal operations platform, not a public portal.",
    ],
  },
  {
    eyebrow: "Workflow Proof 03",
    title: "Overdue pressure, notices, and route-aware operations.",
    description:
      "Receivables follow-up, printable notices, route ownership, and service-status actions remain part of the operating model so teams manage collection pressure with clear next steps.",
    imageSrc: "/marketing/follow-up-preview.svg",
    imageAlt:
      "DWDS follow-up workspace preview showing overdue stages and notification activity.",
    bullets: [
      "Reminder, final-notice, disconnection-review, and reinstatement stay explicit workflow states.",
      "Notice generation tied to live records reduces template drift and manual rework.",
      "Route-aware billing and distribution controls support rollout planning beyond the cashier window.",
    ],
  },
] as const;

const coreModules = [
  {
    icon: Users,
    title: "Customer Registry",
    description: "Service accounts, addresses, and linked meter assignments.",
  },
  {
    icon: Gauge,
    title: "Meter Operations",
    description: "Register, assign, and monitor service device state.",
  },
  {
    icon: Droplets,
    title: "Reading Review",
    description: "Capture usage and approve readings before billing.",
  },
  {
    icon: FileText,
    title: "Billing Engine",
    description: "Progressive tariffs, minimum charges, and print-ready bills.",
  },
  {
    icon: Wallet,
    title: "Cashiering",
    description: "Post payments and keep receivables aligned.",
  },
  {
    icon: Activity,
    title: "Collections & Follow-Up",
    description: "Overdue visibility, route operations, and audit trails.",
  },
] as const;

export default function HomePage() {
  return (
    <div className="space-y-8 pb-24 pt-2">
      <section className="dwds-region relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-24 border-b border-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.28),transparent)]" />
        <div className="grid min-h-[calc(100dvh-8.5rem)] gap-0 lg:grid-cols-[0.94fr_1.06fr]">
          <div className="flex flex-col justify-between border-b border-border/70 px-6 py-8 sm:px-8 sm:py-10 lg:border-b-0 lg:border-r lg:px-10 lg:py-12">
            <div className="max-w-2xl">
              <ScrollAnimate>
                <p className="dwds-kicker border-primary/10 bg-primary/6 text-primary/80">
                  Water Utility Operations
                </p>
              </ScrollAnimate>
              <ScrollAnimate delay={80}>
                <h1 className="mt-6 font-heading text-[clamp(3.2rem,7vw,6.8rem)] leading-[0.9] tracking-[-0.06em] text-foreground">
                  Run the utility operating day from reading approval to collections closeout.
                </h1>
              </ScrollAnimate>
              <ScrollAnimate delay={160}>
                <p className="mt-6 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
                  DWDS is a staff-facing control surface for customer records,
                  meter operations, billing governance, cashier posting,
                  receivables follow-up, and deployment-ready reporting.
                </p>
              </ScrollAnimate>
            </div>

            <div className="mt-10 space-y-8">
              <ScrollAnimate delay={240}>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/platform"
                    className={cn(
                      buttonVariants({
                        className:
                          "h-11 rounded-full bg-[linear-gradient(135deg,#163154,#15527a_56%,#10938d)] px-6 text-white shadow-[0_24px_50px_-30px_rgba(15,35,62,0.8)] hover:brightness-105",
                      })
                    )}
                  >
                    View platform
                  </Link>
                  <Link
                    href="/contact"
                    className={cn(
                      buttonVariants({
                        variant: "outline",
                        className:
                          "h-11 rounded-full border-primary/12 bg-white/50 px-6 hover:bg-white",
                      })
                    )}
                  >
                    Plan rollout
                  </Link>
                </div>
              </ScrollAnimate>

              <div className="dwds-divider grid gap-0 border-border/70 pt-6 sm:grid-cols-3">
                {heroHighlights.map((item, index) => (
                  <ScrollAnimate
                    key={item}
                    delay={300 + index * 80}
                    className={cn(
                      "py-4 sm:py-0",
                      index > 0 && "border-t border-border/70 sm:border-l sm:border-t-0"
                    )}
                  >
                    <div className="flex h-full gap-3 px-0 sm:px-5">
                      <BadgeCheck className="mt-1 size-4 shrink-0 text-primary" />
                      <p className="text-sm leading-6 text-muted-foreground">
                        {item}
                      </p>
                    </div>
                  </ScrollAnimate>
                ))}
              </div>
            </div>
          </div>

          <div className="grid min-h-full grid-rows-[minmax(0,1fr)_auto]">
            <ScrollAnimate
              delay={180}
              direction="scale"
              className="border-b border-border/70 p-4 sm:p-6"
            >
              <div className="flex h-full min-h-[22rem] items-center justify-center rounded-[1.6rem] border border-border/60 bg-[linear-gradient(160deg,rgba(214,230,242,0.92),rgba(247,250,253,0.78))] p-3 sm:p-4">
                <Image
                  src="/marketing/dashboard-preview.svg"
                  alt="DWDS dashboard preview"
                  width={1200}
                  height={840}
                  priority
                  className="h-full w-full rounded-[1.2rem] border border-border/65 object-cover object-top shadow-[0_24px_60px_-42px_rgba(15,35,62,0.45)]"
                />
              </div>
            </ScrollAnimate>

            <div className="grid gap-0 md:grid-cols-[0.92fr_1.08fr]">
              <div className="border-b border-border/70 px-6 py-6 sm:px-8 md:border-b-0 md:border-r">
                <ScrollAnimate delay={260}>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/74">
                    System posture
                  </p>
                  <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-6">
                    {trustStats.map((stat) => (
                      <div key={stat.label}>
                        <p className="font-heading text-4xl tracking-[-0.05em] text-primary">
                          {stat.value}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-foreground">
                          {stat.label}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {stat.sublabel}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollAnimate>
              </div>

              <div className="px-6 py-6 sm:px-8">
                <ScrollAnimate delay={320}>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/74">
                    Deployment readiness
                  </p>
                </ScrollAnimate>
                <div className="mt-4 divide-y divide-border/70">
                  {readinessSignals.map((item, index) => (
                    <ScrollAnimate key={item.title} delay={360 + index * 70}>
                      <div className="grid gap-2 py-4 md:grid-cols-[0.34fr_1fr] md:gap-6">
                        <p className="text-sm font-semibold text-foreground">
                          {item.title}
                        </p>
                        <p className="text-sm leading-6 text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </ScrollAnimate>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-8 pt-6">
        <SectionHeading
          eyebrow="Operational Proof"
          title="Large workflow regions instead of a dense feature catalog."
          description="Each slab below maps to an implemented DWDS surface and uses broad compositional zones, internal rules, and image-to-copy balance instead of stacked cards."
        />

        <div className="space-y-6">
          {workflowProofSections.map((section, index) => (
            <ScrollAnimate key={section.title} delay={80 + index * 40}>
              <article className="dwds-region overflow-hidden">
                <div className="grid min-h-[34rem] gap-0 lg:grid-cols-[1.04fr_0.96fr]">
                  <div
                    className={cn(
                      "flex flex-col justify-between border-b border-border/70 px-6 py-8 sm:px-8 lg:border-b-0 lg:px-10 lg:py-10",
                      index % 2 === 0 ? "lg:border-r" : "lg:order-2 lg:border-l"
                    )}
                  >
                    <div className="max-w-xl">
                      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/72">
                        {section.eyebrow}
                      </p>
                      <h2 className="mt-5 font-heading text-3xl leading-tight tracking-[-0.03em] text-foreground sm:text-[2.7rem]">
                        {section.title}
                      </h2>
                      <p className="mt-5 text-sm leading-7 text-muted-foreground sm:text-base">
                        {section.description}
                      </p>
                    </div>

                    <div className="mt-8 grid gap-0 border-t border-border/70 pt-5">
                      {section.bullets.map((item, bulletIndex) => (
                        <ScrollAnimate
                          key={item}
                          delay={220 + bulletIndex * 60}
                          className={cn(
                            "py-4",
                            bulletIndex > 0 && "border-t border-border/70"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" />
                            <p className="text-sm leading-6 text-muted-foreground">
                              {item}
                            </p>
                          </div>
                        </ScrollAnimate>
                      ))}
                    </div>
                  </div>

                  <div
                    className={cn(
                      "flex items-center bg-[linear-gradient(180deg,rgba(224,239,249,0.88),rgba(245,249,252,0.82))] p-4 sm:p-6",
                      index % 2 === 0 ? "" : "lg:order-1"
                    )}
                  >
                    <Image
                      src={section.imageSrc}
                      alt={section.imageAlt}
                      width={1200}
                      height={840}
                      className="h-auto w-full rounded-[1.35rem] border border-border/60 object-cover shadow-[0_30px_70px_-48px_rgba(15,35,62,0.45)]"
                    />
                  </div>
                </div>
              </article>
            </ScrollAnimate>
          ))}
        </div>
      </section>

      <section className="dwds-region overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[0.72fr_1.28fr]">
          <div className="border-b border-border/70 px-6 py-8 sm:px-8 lg:border-b-0 lg:border-r lg:px-10 lg:py-10">
            <SectionHeading
              eyebrow="Core Modules"
              title="Six connected modules, arranged as one operating matrix."
              description="The platform uses shared data and governed handoffs. This section stays deliberately open and structured so the full viewport reads as a system map, not a wall of cards."
            />
          </div>

          <div className="grid grid-cols-1 divide-y divide-border/70 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            {coreModules.map((module, index) => (
              <ScrollAnimate
                key={module.title}
                delay={index * 70}
                className={cn(
                  "px-6 py-8 sm:px-8",
                  index >= 2 && "sm:border-t sm:border-border/70"
                )}
              >
                <div className="max-w-sm">
                  <div className="inline-flex items-center gap-3">
                    <div className="inline-flex size-11 items-center justify-center rounded-full border border-primary/12 bg-primary/6">
                      <module.icon className="size-5 text-primary" />
                    </div>
                    <h3 className="font-heading text-xl text-foreground">
                      {module.title}
                    </h3>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground">
                    {module.description}
                  </p>
                </div>
              </ScrollAnimate>
            ))}
          </div>
        </div>
      </section>

      <ScrollAnimate direction="up">
        <section className="dwds-panel-dark relative overflow-hidden rounded-[2.2rem]">
          <div className="animate-shimmer pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.04),transparent)]" />
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="border-b border-white/12 px-6 py-8 sm:px-8 lg:border-b-0 lg:border-r lg:px-10 lg:py-10">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-foreground/72">
                Staff-Facing By Design
              </p>
              <h2 className="mt-5 max-w-2xl font-heading text-4xl leading-tight tracking-[-0.03em] text-white sm:text-[3rem]">
                Evaluate DWDS as the operating layer for internal utility work,
                then plan rollout around that core.
              </h2>
            </div>

            <div className="flex flex-col justify-between px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
              <p className="max-w-xl text-sm leading-7 text-primary-foreground/78 sm:text-base">
                DWDS is a deployment-ready internal utility platform for
                operators and administrators. Future consumer channels remain
                separate from the current product promise.
              </p>

              <div className="mt-8 flex flex-col gap-4 border-t border-white/12 pt-6 sm:flex-row sm:items-center sm:justify-between">
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
                    href="/contact"
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

                <p className="max-w-xs text-sm leading-6 text-primary-foreground/70">
                  Public proof stays aligned to the live module set and rollout
                  readiness already implemented in DWDS.
                </p>
              </div>
            </div>
          </div>
        </section>
      </ScrollAnimate>

      <ScrollAnimate delay={80}>
        <section className="px-1">
          <div className="flex flex-col gap-4 border-t border-border/70 pt-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              Internal sign-in remains available for staffed environments. The
              homepage prioritizes product proof and rollout readiness.
            </p>
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 font-medium text-primary hover:text-primary/80"
            >
              Staff sign in
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </section>
      </ScrollAnimate>
    </div>
  );
}
