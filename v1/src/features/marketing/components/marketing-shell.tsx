import type { ReactNode } from "react";

import { SiteFooter } from "@/features/marketing/components/site-footer";
import { SiteHeader } from "@/features/marketing/components/site-header";

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[38rem] bg-[radial-gradient(circle_at_top_left,_rgba(126,206,196,0.34),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(235,194,139,0.24),_transparent_28%),linear-gradient(180deg,_rgba(248,251,250,1),_rgba(244,249,247,0.96))]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-full bg-[linear-gradient(rgba(15,63,67,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(15,63,67,0.045)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0.16))]" />
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl px-5 sm:px-8">{children}</main>
      <SiteFooter />
    </div>
  );
}
