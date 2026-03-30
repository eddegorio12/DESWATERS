"use client";

import { Fragment, type ReactNode } from "react";
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
    <div className="grid min-h-dvh w-full gap-0 px-0 lg:grid-cols-[288px_minmax(0,1fr)]">
      <Fragment key="sidebar">{sidebar}</Fragment>
      <div className="min-w-0 border-t border-border/70 lg:border-l lg:border-t-0">
        {children}
      </div>
      {overlay ? <Fragment key="overlay">{overlay}</Fragment> : null}
    </div>
  );
}
