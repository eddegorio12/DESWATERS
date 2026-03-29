"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { isStandaloneAdminRoute } from "@/features/admin/lib/dashboard-navigation";

export function DashboardChrome({
  sidebar,
  children,
  overlay,
}: {
  sidebar: ReactNode;
  children: ReactNode;
  overlay?: ReactNode;
}) {
  const pathname = usePathname();

  if (isStandaloneAdminRoute(pathname)) {
    return <div className="min-h-dvh">{children}</div>;
  }

  return (
    <div className="mx-auto grid min-h-dvh w-full max-w-[1600px] gap-4 px-3 py-3 sm:px-4 sm:py-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-6 lg:px-6">
      {sidebar}
      <div className="min-w-0 py-1 lg:px-1 lg:py-2">{children}</div>
      {overlay}
    </div>
  );
}
