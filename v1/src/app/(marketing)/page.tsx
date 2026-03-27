import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  BadgeCheck,
  CheckCircle2,
  Droplets,
  Gauge,
  FileText,
  Wallet,
  Users,
  Activity,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { PageHero } from "@/features/marketing/components/page-hero";
import { ScrollAnimate } from "@/features/marketing/components/scroll-animate";
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

const trustStats = [
  { value: "6", label: "Core Modules", sublabel: "End-to-end operations" },
  { value: "5", label: "Staff Roles", sublabel: "Role-based access" },
  { value: "100%", label: "Auditable", sublabel: "Every action tracked" },
  { value: "1", label: "Control Surface", sublabel: "Unified workspace" },
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
      "Only approved readings advance into billing — review happens before charges are issued.",
      "Printable statements stay linked to the exact reading and tariff context behind the bill.",
    ],
  },
  {
    eyebrow: "Workflow Proof 02",
    title: "Billing, cashiering, and collections on one surface.",
    description:
      "Queue pressure, module access, collections visibility, and audit context in one internal workspace — no more piecing status together from separate reports.",
    imageSrc: "/marketing/dashboard-preview.svg",
    imageAlt:
      "DWDS operations dashboard preview showing KPI counters and workflow panels.",
    bullets: [
      "Managers and staff see one dashboard instead of separate reports.",
      "Cash movement, open work, and module routing stay visible at a glance.",
      "The product remains an internal operations platform, not a public portal.",
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
      "Reminder, final-notice, disconnection-review, and reinstatement as explicit workflow states.",
      "Notice generation tied to live records reduces template drift and manual rework.",
      "Route-aware billing and distribution controls support rollout planning beyond the window.",
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
    <div className="space-y-28 pb-24 pt-4">
      {/* ─── Hero ──────────────────────────────────────────────── */}
      <PageHero
        eyebrow="Water Utility Operations"
        title="Run the utility operating day from reading approval to collections closeout."
        description="DWDS is a staff-facing control surface for customer records, meter operations, billing governance, cashier posting, receivables follow-up, and deployment-ready reporting."
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
              className="animate-float h-auto w-full rounded-[1.3rem] border border-border/70"
              priority
            />
          </div>
          <div className="mt-4 rounded-[1.45rem] border border-border/70 bg-white/78 p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/70">
              What this platform delivers
            </p>
            <div className="mt-4 space-y-3">
              {heroHighlights.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 text-sm leading-6 text-muted-foreground"
                >
                  <BadgeCheck className="mt-1 size-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </article>
      </PageHero>

      {/* ─── Trust Stats Strip ─────────────────────────────────── */}
      <section>
        <ScrollAnimate>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {trustStats.map((stat, i) => (
              <ScrollAnimate key={stat.label} delay={i * 100}>
                <div className="group relative overflow-hidden rounded-2xl border border-border/70 bg-white/72 p-6 text-center backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-[0_20px_60px_-30px_rgba(15,35,62,0.25)]">
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(20,82,122,0.03),rgba(16,147,141,0.03))] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <p className="font-heading text-4xl tracking-tight text-primary sm:text-5xl">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {stat.sublabel}
                  </p>
                </div>
              </ScrollAnimate>
            ))}
          </div>
        </ScrollAnimate>
      </section>

      {/* ─── Readiness Signals ─────────────────────────────────── */}
      <section className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
        <ScrollAnimate direction="left">
          <div>
            <p className="dwds-kicker border-primary/10 bg-primary/6 text-primary/76">
              Readiness Signal
            </p>
            <h2 className="mt-4 font-heading text-3xl leading-tight tracking-[-0.03em] text-foreground sm:text-[2.6rem]">
              Deployment fit, governance, and operator trust appear before the
              feature tour.
            </h2>
          </div>
        </ScrollAnimate>
        <ScrollAnimate direction="right">
          <div className="divide-y divide-border/70 overflow-hidden rounded-[1.7rem] border border-border/75 bg-white/72">
            {readinessSignals.map((item, i) => (
              <ScrollAnimate key={item.title} delay={i * 80}>
                <div className="grid gap-2 px-5 py-4 transition-colors duration-200 hover:bg-primary/3 md:grid-cols-[0.34fr_1fr] md:gap-5">
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
        </ScrollAnimate>
      </section>

      {/* ─── Workflow Proof ────────────────────────────────────── */}
      <section className="space-y-8">
        <SectionHeading
          eyebrow="Operational Proof"
          title="Real workflow evidence, not a feature catalog."
          description="Each section maps to an implemented DWDS surface and shows how the product handles the operating chain utility teams actually manage."
        />
        <div className="space-y-5">
          {workflowProofSections.map((section, index) => (
            <ScrollAnimate key={section.title} delay={80} direction="up">
              <article className="dwds-section overflow-hidden">
                <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
                  <ScrollAnimate
                    direction={index % 2 === 0 ? "left" : "right"}
                    delay={120}
                  >
                    <div
                      className={cn(
                        "border-b border-border/70 bg-[linear-gradient(180deg,rgba(224,239,249,0.92),rgba(243,248,252,0.84))] p-4 lg:border-b-0",
                        index % 2 === 1
                          ? "lg:order-2 lg:border-l"
                          : "lg:border-r"
                      )}
                    >
                      <Image
                        src={section.imageSrc}
                        alt={section.imageAlt}
                        width={1200}
                        height={840}
                        className="h-auto w-full rounded-[1.4rem] border border-border/60 transition-transform duration-500 hover:scale-[1.02]"
                      />
                    </div>
                  </ScrollAnimate>
                  <div className="flex flex-col justify-between p-6 lg:p-8">
                    <div>
                      <ScrollAnimate delay={160}>
                        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/72">
                          {section.eyebrow}
                        </p>
                      </ScrollAnimate>
                      <ScrollAnimate delay={200}>
                        <h3 className="mt-4 font-heading text-3xl text-foreground">
                          {section.title}
                        </h3>
                      </ScrollAnimate>
                      <ScrollAnimate delay={240}>
                        <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
                          {section.description}
                        </p>
                      </ScrollAnimate>
                    </div>
                    <div className="mt-6 space-y-3 border-t border-border/70 pt-4">
                      {section.bullets.map((item, bulletIndex) => (
                        <ScrollAnimate
                          key={item}
                          delay={280 + bulletIndex * 60}
                        >
                          <div className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
                            <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" />
                            <span>{item}</span>
                          </div>
                        </ScrollAnimate>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            </ScrollAnimate>
          ))}
        </div>
      </section>

      {/* ─── Core Module Grid ──────────────────────────────────── */}
      <section className="space-y-8">
        <SectionHeading
          eyebrow="Core Modules"
          title="Six connected modules, one operating platform."
          description="Every module shares the same data backbone — customer records, meter state, reading history, and billing lifecycle flow between surfaces without re-entry."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {coreModules.map((mod, i) => (
            <ScrollAnimate key={mod.title} delay={i * 80} direction="up">
              <div className="group relative cursor-pointer overflow-hidden rounded-[1.4rem] border border-border/70 bg-white/65 p-6 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:bg-white/90 hover:shadow-[0_20px_60px_-30px_rgba(15,35,62,0.25)]">
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(20,82,122,0.04),rgba(16,147,141,0.04))] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="mb-4 inline-flex items-center justify-center rounded-xl border border-primary/10 bg-primary/6 p-3 transition-colors duration-300 group-hover:border-primary/20 group-hover:bg-primary/10">
                  <mod.icon className="size-5 text-primary" />
                </div>
                <h3 className="font-heading text-lg text-foreground">
                  {mod.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {mod.description}
                </p>
              </div>
            </ScrollAnimate>
          ))}
        </div>
      </section>

      {/* ─── Final CTA ─────────────────────────────────────────── */}
      <ScrollAnimate direction="up">
        <section className="dwds-panel-dark relative overflow-hidden rounded-[2.25rem] px-8 py-10">
          {/* Shimmer overlay */}
          <div className="animate-shimmer pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.04),transparent)]" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <ScrollAnimate delay={80}>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-foreground/70">
                  Staff-Facing By Design
                </p>
              </ScrollAnimate>
              <ScrollAnimate delay={160}>
                <h2 className="mt-4 font-heading text-4xl leading-tight">
                  Evaluate DWDS as the operating layer for internal utility
                  work, then plan the rollout around that core.
                </h2>
              </ScrollAnimate>
              <ScrollAnimate delay={220}>
                <p className="mt-4 text-sm leading-7 text-primary-foreground/78">
                  DWDS is a deployment-ready internal utility platform for
                  operators and administrators, with future consumer channels
                  kept separate from the current product promise.
                </p>
              </ScrollAnimate>
            </div>
            <ScrollAnimate delay={280}>
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
            </ScrollAnimate>
          </div>
          <ScrollAnimate delay={320}>
            <div className="mt-8 border-t border-white/12 pt-5 text-sm leading-6 text-primary-foreground/72">
              Internal sign-in remains available for staffed environments. The
              public homepage prioritizes product proof and rollout readiness.
            </div>
          </ScrollAnimate>
        </section>
      </ScrollAnimate>
    </div>
  );
}
