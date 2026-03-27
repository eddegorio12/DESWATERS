import type { ReactNode } from "react";

import { SiteFooter } from "@/features/marketing/components/site-footer";
import { SiteHeader } from "@/features/marketing/components/site-header";

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="dwds-shell relative overflow-hidden">
      {/* Primary radial gradient background */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[42rem] bg-[radial-gradient(circle_at_top_left,_rgba(20,82,122,0.2),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(16,147,141,0.18),_transparent_28%),linear-gradient(180deg,_rgba(249,251,255,0.92),_rgba(238,244,250,0.82))]" />

      {/* Animated gradient orbs for depth */}
      <div className="animate-pulse-glow pointer-events-none absolute -left-48 top-24 -z-10 h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,_rgba(20,82,122,0.08),_transparent_70%)] blur-3xl" />
      <div className="animate-pulse-glow pointer-events-none absolute -right-32 top-64 -z-10 h-[350px] w-[350px] rounded-full bg-[radial-gradient(circle,_rgba(16,147,141,0.07),_transparent_70%)] blur-3xl [animation-delay:2s]" />

      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl px-5 pb-8 pt-6 sm:px-8">{children}</main>
      <SiteFooter />
    </div>
  );
}
