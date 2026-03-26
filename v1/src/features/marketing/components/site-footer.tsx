import Link from "next/link";

import { BrandLockup } from "@/features/marketing/components/brand-lockup";
import { footerLinks } from "@/features/marketing/lib/site-content";

export function SiteFooter() {
  return (
    <footer className="mx-auto mt-10 w-full max-w-7xl px-5 pb-8 sm:px-8">
      <div className="dwds-panel overflow-hidden px-6 py-8 sm:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <div className="dwds-kicker border-primary/10 bg-primary/6 text-primary/76">
              Water Utility Operations Platform
            </div>
            <div className="mt-5">
              <BrandLockup size="sm" />
            </div>
            <p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground">
              DWDS centralizes customer records, meter operations, billing, cashiering,
              and collections review in one controlled operating system for utility teams.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-muted-foreground lg:justify-end">
            {footerLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-1 py-1 transition-colors duration-200 hover:text-foreground"
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
