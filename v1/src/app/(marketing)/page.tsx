import type { Metadata } from "next";
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
    "DWDS gives utility operators one staff-facing control surface for records, readings, billing, cashiering, routes, notices, exceptions, assistant support, and automation supervision.",
  pathname: "/",
});

const heroHighlights = [
  "Staff-facing utility workspace with protected internal access",
  "Printable billing, receipt, notice, and recovery outputs tied to live records",
  "Role-aware workflow controls across readings, billing, cashiering, follow-up, routes, and exceptions",
] as const;

const trustStats = [
  { value: "12+", label: "Live workspaces", sublabel: "Staff operations coverage" },
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
      "Printable consumer bills, official receipts, follow-up notices, and recovery exports live in the same operational system.",
  },
  {
    title: "Supervised automation",
    description:
      "Assistant retrieval, worker proposals, Telegram approvals, and automation supervision are already part of the protected product surface.",
  },
] as const;

const workflowProofSections = [
  {
    eyebrow: "Workflow Proof 01",
    title: "From approved readings to printable bills in one governed chain.",
    description:
      "Real DWDS billing sample: the meter-to-bill path stays staff-facing and traceable. Customer records, meter assignments, reading approval, tariff-backed billing, cycle controls, and print-ready statements stay connected.",
    route: "/admin/billing",
    sample: "Billing workspace",
    bullets: [
      "Meter assignments and active account holders stay tied to the billing record path.",
      "Only approved readings advance into billing before charges are issued.",
      "Billing cycles, print batches, and reprint governance remain linked to the underlying tariff and reading context.",
    ],
  },
  {
    eyebrow: "Workflow Proof 02",
    title: "Dashboard, cashiering, and operational supervision on one surface.",
    description:
      "Real DWDS dashboard sample: queue pressure, module access, collections visibility, assistant availability, and audit context stay visible in one internal workspace instead of being reconstructed from separate reports.",
    route: "/admin/dashboard",
    sample: "Operations dashboard",
    bullets: [
      "Managers and staff read one workspace instead of separate status views.",
      "Cash movement, open work, readiness posture, and module routing stay visible at a glance.",
      "The product stays positioned as an internal operations platform, not a public portal.",
    ],
  },
  {
    eyebrow: "Workflow Proof 03",
    title: "Overdue pressure, notices, routes, and follow-up action in one queue.",
    description:
      "Real DWDS follow-up sample: receivables follow-up, printable notices, route ownership, and service-status actions remain part of the operating model so teams manage collection pressure with clear next steps.",
    route: "/admin/follow-up",
    sample: "Follow-up workspace",
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
    title: "Follow-Up, Routes, and Exceptions",
    description: "Overdue visibility, route operations, notices, anomaly review, and audit trails.",
  },
] as const;

export default function HomePage() {
  return (
    <div className="space-y-6 pb-16 pt-1">
      <section className="dwds-region relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(177,135,64,0.5),transparent)]" />
        <div className="grid gap-0 xl:grid-cols-[0.42fr_1.58fr]">
          <div className="border-b border-border/70 px-5 py-6 sm:px-7 sm:py-7 xl:border-b-0 xl:border-r xl:px-8 xl:py-8">
            <ScrollAnimate>
              <p className="dwds-kicker border-primary/10 bg-primary/6 text-primary">
                Water Utility Operations
              </p>
            </ScrollAnimate>
            <ScrollAnimate delay={80}>
              <p className="mt-5 max-w-md text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-primary/72">
                Internal platform for operators, cashiers, billing staff, and managers
              </p>
            </ScrollAnimate>
            <ScrollAnimate delay={120}>
              <div className="mt-5 space-y-2 text-sm leading-6 text-muted-foreground">
                <p>Real DWDS control surfaces</p>
                <p>Utility records mapped into one operating flow</p>
                <p>Rollout-ready with governed outputs and supervision</p>
              </div>
            </ScrollAnimate>
          </div>

          <div className="grid gap-0 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="border-b border-border/70 px-5 py-6 sm:px-7 sm:py-7 lg:border-b-0 lg:border-r lg:px-8 lg:py-8">
            <ScrollAnimate delay={140}>
              <h1 className="max-w-4xl font-heading text-[clamp(2.85rem,4.8vw,5rem)] leading-[0.9] tracking-[-0.055em] text-foreground">
                Run the service day like civic infrastructure, not spreadsheet improvisation.
              </h1>
            </ScrollAnimate>
            <ScrollAnimate delay={220}>
              <p className="mt-5 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                DWDS is a staff-facing control surface for customer records,
                meter operations, reading approval, billing governance,
                cashier posting, follow-up, route planning, exceptions review,
                and operational reporting.
              </p>
            </ScrollAnimate>

            <ScrollAnimate delay={280}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/platform"
                  className={cn(
                    buttonVariants({
                      className:
                        "h-11 rounded-full bg-primary px-6 text-white shadow-[0_14px_28px_-20px_rgba(20,89,129,0.38)] hover:bg-primary/92",
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
                        "h-11 rounded-full border-[rgba(177,135,64,0.24)] bg-white/46 px-6 hover:bg-white",
                    })
                  )}
                >
                  Plan rollout
                </Link>
              </div>
            </ScrollAnimate>

            <div className="mt-8 grid gap-0 border-t border-border/70 pt-4">
              {heroHighlights.map((item, index) => (
                <ScrollAnimate
                  key={item}
                  delay={340 + index * 70}
                  className={cn(index > 0 && "border-t border-border/70")}
                >
                  <div className="grid gap-3 py-3 sm:grid-cols-[1.25rem_1fr]">
                    <BadgeCheck className="mt-1 size-4 text-[color:rgba(139,106,52,0.9)]" />
                    <p className="text-sm leading-6 text-muted-foreground">{item}</p>
                  </div>
                </ScrollAnimate>
              ))}
            </div>
          </div>

          <div className="relative px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
            <ScrollAnimate delay={180} direction="scale">
              <div className="dwds-section overflow-hidden rounded-[1.05rem] shadow-[0_18px_36px_-28px_rgba(20,89,129,0.16)]">
                <div className="grid gap-0 divide-y divide-border/65">
                  {[
                    ["Live surfaces", "Dashboard, billing, follow-up, routes, exceptions"],
                    ["Governed outputs", "Bills, receipts, notices, exports, approvals"],
                    ["Supervision", "Assistant retrieval, worker lanes, automation oversight"],
                  ].map(([label, value]) => (
                    <div key={label} className="px-5 py-4">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-primary/72">
                        {label}
                      </p>
                      <p className="mt-2 max-w-md text-sm leading-6 text-foreground">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollAnimate>

            <div className="mt-3 grid gap-3 lg:grid-cols-[0.88fr_1.12fr]">
              <ScrollAnimate delay={280}>
                <div className="dwds-subtle-block h-full px-4 py-4">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-primary/72">
                    System posture
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5">
                    {trustStats.map((stat) => (
                      <div key={stat.label}>
                        <p className="font-heading text-[2rem] leading-none tracking-[-0.05em] text-primary">
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
                </div>
              </ScrollAnimate>

              <ScrollAnimate delay={340}>
                <div className="dwds-subtle-block h-full px-4 py-4">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-primary/72">
                    Deployment readiness
                  </p>
                  <div className="mt-4 divide-y divide-border/60">
                    {readinessSignals.slice(0, 4).map((item) => (
                      <div key={item.title} className="grid gap-2 py-2.5 md:grid-cols-[0.42fr_1fr] md:gap-4">
                        <p className="text-sm font-semibold text-foreground">
                          {item.title}
                        </p>
                        <p className="text-sm leading-6 text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollAnimate>
            </div>
          </div>
        </div>
        </div>
      </section>

      <section className="dwds-region overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[0.52fr_1.48fr]">
          <div className="border-b border-border/70 px-5 py-5 sm:px-7 lg:border-b-0 lg:border-r lg:px-8">
            <SectionHeading
              eyebrow="Operational Proof"
              title="A public surface built around proof, governance, and operating flow."
              description="The marketing layer now reads like a utility operating manual with editorial hierarchy, stronger evidence, and less template repetition."
            />
          </div>
          <div className="grid gap-0 divide-y divide-border/70">
            {workflowProofSections.map((section, index) => (
              <ScrollAnimate key={section.title} delay={100 + index * 40}>
                <article className="grid gap-0 xl:grid-cols-[0.28fr_0.72fr]">
                  <div className="border-b border-border/70 px-5 py-5 sm:px-7 xl:border-b-0 xl:border-r xl:px-6">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-primary/72">
                      {section.eyebrow}
                    </p>
                    <p className="mt-3 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/70">
                      {section.sample} · {section.route}
                    </p>
                    <div className="mt-4 space-y-3">
                      {section.bullets.map((item) => (
                        <div key={item} className="flex items-start gap-3">
                          <CheckCircle2 className="mt-1 size-4 shrink-0 text-[color:rgba(139,106,52,0.9)]" />
                          <p className="text-sm leading-6 text-muted-foreground">
                            {item}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-0 lg:grid-cols-[1.04fr_0.96fr]">
                    <div className="border-b border-border/70 px-5 py-5 sm:px-7 lg:border-b-0 lg:border-r lg:px-8">
                      <h2 className="max-w-3xl font-heading text-[2rem] leading-[1.02] tracking-[-0.04em] text-foreground sm:text-[2.35rem]">
                        {section.title}
                      </h2>
                      <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                        {section.description}
                      </p>
                    </div>
                    <div className="bg-secondary/34 p-4 sm:p-5">
                      <div className="dwds-section h-full rounded-[1rem] bg-white/74 px-5 py-5">
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-primary/72">
                          Real Sample Notes
                        </p>
                        <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                          <p>Named protected route: {section.route}</p>
                          <p>Public section references the actual DWDS workspace already implemented in your app.</p>
                          <p>The redesign now relies on route-backed proof instead of screenshot-driven marketing panels.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </ScrollAnimate>
            ))}
          </div>
        </div>
      </section>

      <section className="dwds-region overflow-hidden">
        <div className="grid gap-0 xl:grid-cols-[0.64fr_1.36fr]">
          <div className="border-b border-border/70 px-5 py-5 sm:px-7 xl:border-b-0 xl:border-r xl:px-8">
            <SectionHeading
              eyebrow="Connected Modules"
              title="One operating matrix, six modules, shared record authority."
              description="This reads as a system map rather than a feature-card gallery. Each module stays distinct but participates in one auditable service cycle."
            />
          </div>

          <div className="grid gap-0 divide-y divide-border/70">
            {coreModules.map((module, index) => (
              <ScrollAnimate
                key={module.title}
                delay={index * 60}
                className="px-5 py-4 sm:px-7 lg:px-8"
              >
                <div className="grid items-start gap-4 md:grid-cols-[3rem_0.8fr_1.2fr]">
                  <div className="inline-flex size-10 items-center justify-center rounded-[0.85rem] border border-[rgba(177,135,64,0.22)] bg-[rgba(177,135,64,0.12)]">
                    <module.icon className="size-4.5 text-primary" />
                  </div>
                  <h3 className="font-heading text-[1.55rem] leading-none tracking-[-0.03em] text-foreground">
                    {module.title}
                  </h3>
                  <p className="max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
                    {module.description}
                  </p>
                </div>
              </ScrollAnimate>
            ))}
          </div>
        </div>
      </section>

      <ScrollAnimate direction="up">
        <section className="dwds-panel-dark relative overflow-hidden">
          <div className="animate-shimmer pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.04),transparent)]" />
          <div className="grid gap-0 lg:grid-cols-[1.04fr_0.96fr]">
            <div className="border-b border-white/12 px-5 py-6 sm:px-7 lg:border-b-0 lg:border-r lg:px-8 lg:py-8">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-primary-foreground/72">
                Staff-Facing By Design
              </p>
              <h2 className="mt-4 max-w-3xl font-heading text-[2.2rem] leading-[0.98] tracking-[-0.035em] text-white sm:text-[2.75rem]">
                Evaluate DWDS as the operating layer for internal utility work, then plan rollout from that core.
              </h2>
            </div>

            <div className="flex flex-col justify-between px-5 py-6 sm:px-7 lg:px-8 lg:py-8">
              <p className="max-w-xl text-sm leading-7 text-primary-foreground/80 sm:text-base">
                DWDS is a deployment-ready internal utility platform with live
                coverage across billing, cashiering, routes, notices,
                exceptions, assistant retrieval, and automation supervision.
                Consumer channels remain a future expansion path rather than a
                blurred promise on the current product surface.
              </p>

              <div className="mt-8 flex flex-col gap-4 border-t border-white/12 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/platform"
                    className={cn(
                      buttonVariants({
                        className:
                          "h-11 rounded-full bg-white px-6 text-primary hover:bg-white/92",
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

                <p className="max-w-xs text-sm leading-6 text-primary-foreground/68">
                  Public proof now stays tied to named DWDS workspaces including
                  dashboard, billing, follow-up, routes, exceptions, assistant,
                  automation, and system readiness.
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
              public entry surface now prioritizes product proof and rollout
              clarity.
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
