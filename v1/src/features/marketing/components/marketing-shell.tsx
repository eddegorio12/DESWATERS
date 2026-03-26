import type { ReactNode } from "react";

import { SiteFooter } from "@/features/marketing/components/site-footer";
import { SiteHeader } from "@/features/marketing/components/site-header";

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="dwds-shell relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[42rem] bg-[radial-gradient(circle_at_top_left,_rgba(20,82,122,0.2),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(16,147,141,0.18),_transparent_28%),linear-gradient(180deg,_rgba(249,251,255,0.92),_rgba(238,244,250,0.82))]" />
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl px-5 pb-8 pt-6 sm:px-8">{children}</main>
      <SiteFooter />
    </div>
  );
}
