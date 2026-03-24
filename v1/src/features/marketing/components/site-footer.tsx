import Link from "next/link";

import { BrandLockup } from "@/features/marketing/components/brand-lockup";
import { footerLinks } from "@/features/marketing/lib/site-content";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-white/70">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-10 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-lg">
          <BrandLockup size="sm" />
          <p className="mt-2.5 max-w-md text-sm leading-7 text-muted-foreground">
            Water utility operations software for customer management, metering,
            billing, payments, and collections review.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-muted-foreground lg:justify-end">
          {footerLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors duration-200 hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
