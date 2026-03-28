import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Mail, ShieldCheck } from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { MarketingConversionPanel } from "@/features/marketing/components/marketing-conversion-panel";
import { PageHero } from "@/features/marketing/components/page-hero";
import { SectionHeading } from "@/features/marketing/components/section-heading";
import { createMarketingMetadata } from "@/features/marketing/lib/metadata";
import { buildMailtoLink, getContactEmail } from "@/features/marketing/lib/site-config";
import { cn } from "@/lib/utils";

export const metadata: Metadata = createMarketingMetadata({
  title: "Plan Rollout",
  description:
    "Request a DWDS rollout review for staff-facing utility operations, implementation fit, and deployment readiness.",
  pathname: "/contact",
});

const rolloutChecklist = [
  "Service-area size, number of active consumer accounts, and current meter-reading process.",
  "Whether rollout should start with billing, cashiering, follow-up, or route operations first.",
  "Preferred hosting owner, database target, and staff roles that need access on day one.",
] as const;

const trustNotes = [
  "DWDS is positioned as a staff-facing operating platform, not a public consumer portal.",
  "The current release already covers customer records, metering, readings, billing, payments, collections, and overdue follow-up.",
  "Deployment readiness assumes production Auth.js variables, a managed PostgreSQL target, and first-admin bootstrap in the target environment.",
] as const;

export default function ContactPage() {
  const contactEmail = getContactEmail();
  const mailtoHref = buildMailtoLink({
    subject: "DWDS rollout review",
    body: [
      "Utility name:",
      "Service area:",
      "Approximate active accounts:",
      "Primary rollout goal:",
      "Preferred target date:",
    ].join("\n"),
  });

  return (
    <div className="space-y-20 pb-24 pt-4">
      <PageHero
        eyebrow="Plan Rollout"
        title="Use one clear public path for rollout and implementation discussions."
        description="DWDS is already structured for staff-facing utility operations. Use this page to request a rollout review and align deployment, role setup, and day-one workflow priorities."
        primaryAction={{ href: mailtoHref, label: "Email rollout request" }}
        secondaryAction={{ href: "/rollout", label: "Review rollout path" }}
      >
        <article className="dwds-section flex h-full flex-col justify-between gap-5 p-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/70">
              Contact channel
            </p>
            <h2 className="mt-4 font-heading text-3xl text-foreground">
              {contactEmail}
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              This route keeps public conversion simple: one implementation-oriented email path
              for rollout, hosting, and staff-access planning.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={mailtoHref}
              className={cn(
                buttonVariants({
                  className:
                    "h-11 rounded-full bg-[linear-gradient(135deg,#163154,#15527a_56%,#10938d)] px-6 text-white hover:brightness-105",
                })
              )}
            >
              <Mail aria-hidden="true" className="mr-2 size-4" />
              Email rollout request
            </Link>
            <Link
              href="/platform"
              className={cn(
                buttonVariants({
                  variant: "outline",
                  className: "h-11 rounded-full px-6",
                })
              )}
            >
              View platform
            </Link>
          </div>
        </article>
      </PageHero>

      <section className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
        <article className="dwds-section p-8">
          <SectionHeading
            eyebrow="Before You Email"
            title="Include the rollout details that affect implementation shape."
            description="Keeping the request structured makes it easier to scope staffing, deployment, and the first operational module set."
          />
          <div className="mt-8 space-y-4">
            {rolloutChecklist.map((item) => (
              <div
                key={item}
                className="flex gap-3 rounded-[1.35rem] border border-border/70 bg-white/72 px-4 py-4 text-sm leading-6 text-muted-foreground"
              >
                <ArrowUpRight
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-primary"
                />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="dwds-panel-dark p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-foreground/70">
            Trust and Readiness
          </p>
          <div className="mt-8 space-y-4">
            {trustNotes.map((item) => (
              <div
                key={item}
                className="flex gap-3 rounded-[1.35rem] border border-white/12 bg-white/7 px-4 py-4 text-sm leading-6 text-primary-foreground/78"
              >
                <ShieldCheck
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-[#8ce1d5]"
                />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <MarketingConversionPanel
        title="Need internal access instead of a rollout conversation?"
        description="Public visitors should use the rollout request path. Existing staffed environments can still move directly to protected sign-in."
        primaryLabel="Open staff sign in"
        primaryHref="/sign-in"
        secondaryLabel="Review rollout path"
        secondaryHref="/rollout"
      />
    </div>
  );
}
