import Link from "next/link";

import { BrandLockup } from "@/features/marketing/components/brand-lockup";
import { footerLinks } from "@/features/marketing/lib/site-content";
import { getContactEmail } from "@/features/marketing/lib/site-config";

export function SiteFooter() {
  const contactEmail = getContactEmail();

  return (
    <footer className="mt-10 w-full px-4 pb-8 sm:px-6 lg:px-8">
      <div className="dwds-section dwds-atlas-card overflow-hidden px-6 py-8 sm:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <div className="dwds-kicker border-[rgba(20,89,129,0.18)] bg-[rgba(20,89,129,0.08)] text-primary">
              Water Utility Operations Platform
            </div>
            <div className="mt-5">
              <BrandLockup size="sm" />
            </div>
            <p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground">
              DWDS centralizes customer records, meter operations, billing,
              cashiering, routes, notices, and supervision in one operating
              system for utility teams.
            </p>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Public rollout requests:{" "}
              <Link href="/contact" className="font-medium text-primary hover:text-primary/80">
                {contactEmail}
              </Link>
            </p>
          </div>
          <nav
            aria-label="Footer"
            className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-muted-foreground lg:justify-end"
          >
            {footerLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-1 py-1 transition-colors duration-200 hover:text-foreground focus-visible:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
