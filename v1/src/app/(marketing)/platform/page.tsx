import type { Metadata } from "next";
import Image from "next/image";
import {
  BarChart3,
  FileSpreadsheet,
  FolderKanban,
  HandCoins,
  Layers3,
  ShieldCheck,
} from "lucide-react";

import { PageHero } from "@/features/marketing/components/page-hero";
import { SectionHeading } from "@/features/marketing/components/section-heading";
import {
  moduleHighlights,
  platformPillars,
  reportingHighlights,
} from "@/features/marketing/lib/site-content";

export const metadata: Metadata = {
  title: "Platform | DEGORIO WATER DISTRIBUTION SERVICES",
  description:
    "A closer look at the DEGORIO WATER DISTRIBUTION SERVICES platform architecture, modular workflow design, and utility operations coverage.",
};

const pillarIcons = [Layers3, ShieldCheck, FolderKanban];
const sectionIcons = [FileSpreadsheet, HandCoins, BarChart3];

export default function PlatformPage() {
  return (
    <div className="space-y-20 pb-24 pt-4">
      <PageHero
        eyebrow="Platform"
        title="A modular utility platform with a clear operating model."
        description="DWDS is structured around the work staff actually perform, with separate modules for records, billing, cashiering, follow-up, and reports instead of one overcrowded screen."
      >
        <article className="dwds-section overflow-hidden p-4">
          <Image
            src="/marketing/dashboard-preview.svg"
            alt="DWDS platform dashboard preview"
            width={1200}
            height={840}
            className="h-auto w-full rounded-[1.5rem] border border-border/70"
            priority
          />
        </article>
      </PageHero>

      <section className="divide-y divide-border/75 overflow-hidden rounded-[1.65rem] border border-border/75 bg-white/72">
        {platformPillars.map((pillar, index) => {
          const Icon = pillarIcons[index];

          return (
            <article key={pillar.title} className="px-5 py-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-heading text-2xl text-foreground">
                      {pillar.title}
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {pillar.description}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-medium text-primary">Platform principle</p>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <article className="dwds-section p-8">
          <SectionHeading
            eyebrow="Module Map"
            title="Each business function has a dedicated surface."
            description="That separation keeps DWDS easier to extend, easier to maintain, and safer for role-based work."
          />
          <div className="mt-8 divide-y divide-border/70 overflow-hidden rounded-[1.5rem] border border-border/70 bg-white/72">
            {moduleHighlights.map((item) => (
              <div
                key={item.title}
                className="px-5 py-4"
              >
                <p className="text-base font-semibold text-foreground">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="dwds-panel-dark p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-foreground/70">
            Product Principles
          </p>
          <div className="mt-8 space-y-4">
            {[
              "Keep the public site, admin workspace, and future portal inside one maintainable codebase.",
              "Use server-rendered routes for business-critical surfaces and keep the app structure lean.",
              "Protect operational actions through authentication and role-aware data boundaries.",
              "Make reports traceable back to the underlying reading, bill, and payment records.",
            ].map((item) => (
              <div
                key={item}
                className="flex gap-3 rounded-[1.4rem] border border-white/12 bg-white/6 px-4 py-4 text-sm leading-6 text-primary-foreground/80"
              >
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#8ce1d5]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="space-y-8">
        <SectionHeading
          eyebrow="Visibility"
          title="Reporting is treated as a first-class operational layer."
          description="The platform is designed so teams can understand present-day cash movement and unfinished utility work without leaving the system."
        />
        <div className="divide-y divide-border/75 overflow-hidden rounded-[1.65rem] border border-border/75 bg-white/72">
          {reportingHighlights.map((item, index) => {
            const Icon = sectionIcons[index];

            return (
              <article key={item.title} className="px-5 py-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <Icon className="mt-1 size-5 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <h3 className="font-heading text-2xl text-foreground">{item.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-primary">Operational visibility</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
