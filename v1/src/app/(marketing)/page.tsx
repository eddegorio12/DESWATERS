import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Droplets,
  FileSpreadsheet,
  Gauge,
  ReceiptText,
  ShieldCheck,
  Users,
  WalletCards,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { PageHero } from "@/features/marketing/components/page-hero";
import { SectionHeading } from "@/features/marketing/components/section-heading";
import {
  moduleHighlights,
  reportingHighlights,
  siteStats,
  workflowSteps,
} from "@/features/marketing/lib/site-content";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "DEGORIO WATER DISTRIBUTION SERVICES | Water Utility Operations Platform",
  description:
    "DEGORIO WATER DISTRIBUTION SERVICES centralizes customer records, metering, billing, cashiering, and daily collections for utility operations teams.",
};

const statIcons = [Droplets, Users, ReceiptText, ShieldCheck];
const moduleIcons = [Users, Gauge, FileSpreadsheet, ReceiptText, WalletCards, BarChart3];

export default function HomePage() {
  return (
    <div className="space-y-24 pb-24 pt-10">
      <PageHero
        eyebrow="Water Utility Operations"
        title="Run DWDS from meter reading to daily collections in one controlled workspace."
        description="DWDS gives utility teams a single operating system for customer accounts, meter tracking, progressive billing, cashier workflows, and auditable reporting."
        primaryAction={{ href: "/sign-in", label: "Open admin access" }}
        secondaryAction={{ href: "/platform", label: "Explore the platform" }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {siteStats.map((stat, index) => {
            const Icon = statIcons[index];

            return (
              <article
                key={stat.label}
                className="rounded-[2rem] border border-white/70 bg-white/88 p-5 shadow-[0_20px_80px_-40px_rgba(12,60,64,0.45)] backdrop-blur"
              >
                <Icon className="size-5 text-primary" />
                <p className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
              </article>
            );
          })}
        </div>
      </PageHero>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <SectionHeading
            eyebrow="Why DEGORIO"
            title="Built for utility operations, not generic invoicing."
            description="The product mirrors the real DWDS workflow: account maintenance, meter assignment, reading validation, bill generation, payment posting, and same-day reporting."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              "Clerk-protected staff access for role-based operations",
              "Progressive tier tariff support with minimum usage logic",
              "Printable bill statements linked to approved readings",
              "Daily collections summaries based on completed payments",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[1.75rem] border border-border/70 bg-white/80 p-4 text-sm leading-6 text-muted-foreground shadow-[0_18px_60px_-40px_rgba(12,60,64,0.5)]"
              >
                <BadgeCheck className="mb-3 size-4 text-primary" />
                {item}
              </div>
            ))}
          </div>
        </div>
        <article className="overflow-hidden rounded-[2rem] border border-primary/15 bg-[#0f3f43] p-8 text-primary-foreground shadow-[0_30px_100px_-60px_rgba(15,63,67,0.9)]">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-foreground/70">
            Operating View
          </p>
          <div className="mt-8 grid gap-4">
            {workflowSteps.map((step, index) => (
              <div
                key={step.title}
                className="grid gap-3 rounded-[1.6rem] border border-white/12 bg-white/6 p-4 md:grid-cols-[auto_1fr]"
              >
                <div className="flex size-10 items-center justify-center rounded-full bg-white/10 text-sm font-semibold">
                  0{index + 1}
                </div>
                <div>
                  <h3 className="font-heading text-xl leading-none">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-primary-foreground/76">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="space-y-8">
        <SectionHeading
          eyebrow="Core Modules"
          title="Every major DWDS workflow has a dedicated screen and responsibility."
          description="The platform is intentionally modular so staff can manage utility operations without fighting a monolithic interface."
        />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {moduleHighlights.map((item, index) => {
            const Icon = moduleIcons[index];

            return (
              <article
                key={item.title}
                className="rounded-[2rem] border border-border/70 bg-white/88 p-6 shadow-[0_20px_70px_-45px_rgba(14,60,63,0.55)] transition-transform duration-200 hover:-translate-y-1"
              >
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-5 font-heading text-2xl text-foreground">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {item.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <article className="rounded-[2rem] border border-border/70 bg-white/90 p-8 shadow-[0_20px_70px_-45px_rgba(14,60,63,0.55)]">
          <SectionHeading
            eyebrow="Reporting Layer"
            title="Collections stay auditable from cashier posting to dashboard totals."
            description="DWDS keeps reporting close to the transaction flow, so operators can verify what was paid today and what still needs action."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {reportingHighlights.map((item) => (
              <div
                key={item.title}
                className="rounded-[1.5rem] border border-border/70 bg-secondary/35 p-4"
              >
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </article>
        <article className="rounded-[2rem] border border-[#89c6c7]/40 bg-[linear-gradient(145deg,#daf2ee,#ffffff)] p-8 shadow-[0_24px_80px_-55px_rgba(12,60,64,0.6)]">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/70">
            Ready For Expansion
          </p>
          <h3 className="mt-4 font-heading text-3xl text-foreground">
            Built as the operations core for the public portal that comes next.
          </h3>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            The current release focuses on staff operations. The structure is already
            aligned for future customer self-service, online payments, notifications, and
            utility support workflows.
          </p>
          <div className="mt-8 space-y-3 text-sm text-foreground">
            {[
              "Customer portal inside the same Next.js codebase",
              "Online settlement flows for Philippine payment channels",
              "Receipts, supporting uploads, and communication history",
              "Operational intelligence layered on top of the same source records",
            ].map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-[1.25rem] border border-primary/10 bg-white/70 px-4 py-3"
              >
                <ArrowRight className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-[2.25rem] border border-primary/10 bg-[#0f3f43] px-8 py-10 text-primary-foreground shadow-[0_30px_100px_-60px_rgba(15,63,67,1)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-foreground/70">
              Start With The Core
            </p>
            <h2 className="mt-4 font-heading text-4xl leading-tight">
              Put your utility operations on one source of truth before scaling outward.
            </h2>
            <p className="mt-4 text-sm leading-7 text-primary-foreground/78">
              DWDS already covers the operational chain your team uses every day. The
              public site now reflects that product maturity.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/sign-in"
              className={cn(
                buttonVariants({
                  className:
                    "h-11 rounded-full bg-white px-6 text-primary hover:bg-white/90",
                })
              )}
            >
              Sign in to admin
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
              View rollout path
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
