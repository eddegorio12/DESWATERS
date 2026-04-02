import type { Metadata } from "next";
import {
  BarChart3,
  FileSpreadsheet,
  FolderKanban,
  HandCoins,
  Layers3,
  ShieldCheck,
} from "lucide-react";

import { PageHero } from "@/features/marketing/components/page-hero";
import { MarketingConversionPanel } from "@/features/marketing/components/marketing-conversion-panel";
import { SectionHeading } from "@/features/marketing/components/section-heading";
import { createMarketingMetadata } from "@/features/marketing/lib/metadata";
import {
  moduleHighlights,
  liveWorkspaceSamples,
  platformPillars,
  reportingHighlights,
} from "@/features/marketing/lib/site-content";

export const metadata: Metadata = createMarketingMetadata({
  title: "Platform",
  description:
    "A closer look at the DWDS platform architecture, modular workflow design, and live operations coverage across records, billing, routes, exceptions, assistant, and automation.",
  pathname: "/platform",
});

const pillarIcons = [Layers3, ShieldCheck, FolderKanban];
const sectionIcons = [FileSpreadsheet, HandCoins, BarChart3];

export default function PlatformPage() {
  return (
    <div className="space-y-6 pb-16 pt-1">
      <PageHero
        eyebrow="Platform"
        title="A modular utility platform with a live, governed operating model."
        description="DWDS is structured around the work staff actually perform, with dedicated surfaces for records, billing, cashiering, routes, follow-up, exceptions, assistant guidance, automation supervision, and readiness."
      >
        <article className="dwds-section flex h-full flex-col justify-between gap-4 rounded-[1rem] bg-white/52 p-5">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-primary/72">
              Protected Surfaces
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {["/admin/dashboard", "/admin/routes", "/admin/exceptions", "/admin/automation"].map((route) => (
                <div key={route} className="rounded-[0.9rem] border border-border/60 bg-white/66 px-4 py-3 text-sm font-medium text-foreground">
                  {route}
                </div>
              ))}
            </div>
          </div>
          <p className="max-w-lg text-sm leading-6 text-muted-foreground">
            The public platform page now points to route-backed DWDS workspaces instead of using preview graphics as the primary proof device.
          </p>
        </article>
      </PageHero>

      <section className="dwds-region overflow-hidden">
        {platformPillars.map((pillar, index) => {
          const Icon = pillarIcons[index];

          return (
            <article key={pillar.title} className="border-b border-border/70 px-5 py-4 last:border-b-0 sm:px-7 lg:px-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-[0.85rem] border border-[rgba(177,135,64,0.22)] bg-[rgba(177,135,64,0.12)] text-primary">
                    <Icon aria-hidden="true" className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-heading text-[1.7rem] text-foreground">
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

      <section className="grid gap-6 xl:grid-cols-[1.06fr_0.94fr]">
        <article className="dwds-region overflow-hidden">
          <div className="border-b border-border/70 px-5 py-5 sm:px-7 lg:px-8">
            <SectionHeading
              eyebrow="Module Map"
              title="Each business function has a dedicated surface."
              description="That separation keeps DWDS easier to extend, easier to maintain, and safer for role-based work as the product grows beyond the original billing-only baseline."
            />
          </div>
          <div className="grid gap-0 divide-y divide-border/70">
            {moduleHighlights.map((item) => (
              <div key={item.title} className="px-5 py-4 sm:px-7 lg:px-8">
                <p className="text-base font-semibold text-foreground">{item.title}</p>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="dwds-panel-dark overflow-hidden">
          <div className="border-b border-white/12 px-5 py-5 sm:px-7 lg:px-8">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-primary-foreground/72">
              Product Principles
            </p>
          </div>
          <div className="grid gap-0 divide-y divide-white/12">
            {[
              "Keep the public site, admin workspace, and future portal inside one maintainable codebase.",
              "Use server-rendered routes for business-critical surfaces and keep the app structure lean.",
              "Protect operational actions through authentication, role-aware data boundaries, and audit logging.",
              "Make reports and decisions traceable back to the underlying reading, bill, payment, route, notice, and exception records.",
            ].map((item) => (
              <div
                key={item}
                className="flex gap-3 px-5 py-4 text-sm leading-6 text-primary-foreground/80 sm:px-7 lg:px-8"
              >
                <ShieldCheck
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-[#d7c08b]"
                />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="dwds-region overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[0.42fr_1.58fr]">
          <div className="border-b border-border/70 px-5 py-5 sm:px-7 lg:border-b-0 lg:border-r lg:px-8">
            <SectionHeading
              eyebrow="Real DWDS Samples"
              title="These are named workspaces already implemented inside your site."
              description="The public platform story now maps directly to actual protected DWDS routes, not hypothetical future modules."
            />
          </div>
          <div className="grid gap-0 divide-y divide-border/70">
            {liveWorkspaceSamples.map((item) => (
              <article key={item.route} className="px-5 py-4 sm:px-7 lg:px-8">
                <div className="grid gap-3 md:grid-cols-[0.28fr_0.18fr_1fr] md:items-start">
                  <h3 className="font-heading text-[1.45rem] text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/72">
                    {item.route}
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {item.summary}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="dwds-region overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[0.52fr_1.48fr]">
          <div className="border-b border-border/70 px-5 py-5 sm:px-7 lg:border-b-0 lg:border-r lg:px-8">
            <SectionHeading
              eyebrow="Visibility"
              title="Reporting is treated as a first-class operational layer."
              description="The platform is designed so teams can understand present-day cash movement, overdue exposure, route pressure, and unfinished utility work without leaving the system."
            />
          </div>
          <div className="grid gap-0 divide-y divide-border/70">
          {reportingHighlights.map((item, index) => {
            const Icon = sectionIcons[index];

            return (
                <article key={item.title} className="px-5 py-4 sm:px-7 lg:px-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <Icon aria-hidden="true" className="mt-1 size-5 shrink-0 text-primary" />
                    <div className="min-w-0">
                        <h3 className="font-heading text-[1.65rem] text-foreground">{item.title}</h3>
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
        </div>
      </section>

      <MarketingConversionPanel
        title="Use the platform overview, then move into one rollout conversation."
        description="The public site should lead to one next step: confirm fit, hosting shape, role setup, and day-one staff workflows through a rollout review."
      />
    </div>
  );
}
