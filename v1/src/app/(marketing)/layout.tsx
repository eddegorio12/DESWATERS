import type { ReactNode } from "react";

import { MarketingShell } from "@/features/marketing/components/marketing-shell";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return <MarketingShell>{children}</MarketingShell>;
}
