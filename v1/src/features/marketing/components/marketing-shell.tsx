import type { ReactNode } from "react";

import { SiteFooter } from "@/features/marketing/components/site-footer";
import { SiteHeader } from "@/features/marketing/components/site-header";

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="dwds-shell relative overflow-hidden">
      <a
        href="#main-content"
        className="absolute left-5 top-4 z-50 -translate-y-20 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg transition-transform focus:translate-y-0"
      >
        Skip to main content
      </a>

      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[36rem] bg-[var(--dwds-river)]" />
      <div className="pointer-events-none absolute inset-x-0 top-[7.6rem] -z-10 hidden h-px bg-[linear-gradient(90deg,transparent,rgba(20,89,129,0.16),transparent)] lg:block" />

      <SiteHeader />
      <main
        id="main-content"
        tabIndex={-1}
        className="w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8"
      >
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
