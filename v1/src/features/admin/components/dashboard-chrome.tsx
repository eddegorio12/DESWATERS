"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { isStandaloneAdminRoute } from "@/features/admin/lib/dashboard-navigation";

export function DashboardChrome({
  sidebar,
  children,
}: {
  sidebar: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();

  if (isStandaloneAdminRoute(pathname)) {
    return <div className="min-h-dvh">{children}</div>;
  }

  return (
    <div className="mx-auto grid min-h-dvh w-full max-w-[1600px] gap-6 px-4 py-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:px-6">
      {sidebar}
      <div className="min-w-0 px-1 py-1 lg:py-2">{children}</div>
    </div>
  );
}
