import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { DashboardChrome } from "@/features/admin/components/dashboard-chrome";
import {
  DashboardNav,
  type DashboardNavItem,
} from "@/features/admin/components/dashboard-nav";
import { AdminSessionButton } from "@/features/auth/components/admin-session-button";
import {
  getAccessibleAdminModules,
  getCurrentStaffUser,
  roleDisplayName,
} from "@/features/auth/lib/authorization";
import { BrandLockup } from "@/features/marketing/components/brand-lockup";
import { cn } from "@/lib/utils";

const dashboardNavMeta = {
  dashboard: {
    href: "/admin/dashboard",
    label: "Dashboard",
    description: "Daily control room and module access.",
    icon: "dashboard",
  },
  staffAccess: {
    href: "/admin/staff-access",
    label: "Staff Access",
    description: "Role controls and internal account management.",
    icon: "staffAccess",
  },
  systemReadiness: {
    href: "/admin/system-readiness",
    label: "System",
    description: "Backup readiness, restore guidance, and security visibility.",
    icon: "systemReadiness",
  },
  routeOperations: {
    href: "/admin/routes",
    label: "Routes",
    description: "Zones, route ownership, and field planning analytics.",
    icon: "routeOperations",
  },
  customers: {
    href: "/admin/customers",
    label: "Customers",
    description: "Service accounts, contacts, and statuses.",
    icon: "customers",
  },
  exceptions: {
    href: "/admin/exceptions",
    label: "Exceptions",
    description: "Operational alerts for readings, receivables, and data mismatches.",
    icon: "exceptions",
  },
  meters: {
    href: "/admin/meters",
    label: "Meters",
    description: "Meter registry and active assignments.",
    icon: "meters",
  },
  tariffs: {
    href: "/admin/tariffs",
    label: "Tariffs",
    description: "Progressive billing rules and charge setup.",
    icon: "tariffs",
  },
  readings: {
    href: "/admin/readings",
    label: "Readings",
    description: "Field input review and approval workflow.",
    icon: "readings",
  },
  billing: {
    href: "/admin/billing",
    label: "Billing",
    description: "Receivables generation and bill review.",
    icon: "billing",
  },
  payments: {
    href: "/admin/payments",
    label: "Payments",
    description: "Cashier posting and receipt operations.",
    icon: "payments",
  },
  collections: {
    href: "/admin/collections",
    label: "Collections",
    description: "Current-day totals and payment history.",
    icon: "collections",
  },
  followUp: {
    href: "/admin/follow-up",
    label: "Follow-Up",
    description: "Overdue workflow and service action stages.",
    icon: "followUp",
  },
} as const;

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const current = await getCurrentStaffUser();
  const isAuthenticated = current.isAuthenticated && current.user;
  const navItems: DashboardNavItem[] = isAuthenticated
    ? (getAccessibleAdminModules(current.user.role)
        .flatMap((module) => {
          if (module === "billPrint") {
            return [];
          }

          return [dashboardNavMeta[module]];
        }) as DashboardNavItem[])
    : [];

  return (
    <div className="dwds-shell min-h-dvh">
      <DashboardChrome
        sidebar={
          <aside className="dwds-panel-dark flex flex-col gap-6 p-5 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:overflow-auto">
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-3">
              <BrandLockup inverse size="sm" className="w-fit" />
              <div className="dwds-kicker border-white/12 bg-white/8 text-white/78">
                Internal
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/12 bg-white/8 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/56">
                Workspace
              </p>
              <h1 className="mt-3 font-heading text-[1.8rem] tracking-[-0.03em] text-white">
                DWDS operations console
              </h1>
              <p className="mt-3 text-sm leading-6 text-white/68">
                Navigate accounts, readings, billing, cashiering, and follow-up from one
                protected application surface.
              </p>
            </div>

            {isAuthenticated ? (
              <div className="rounded-[1.5rem] border border-white/12 bg-white/8 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/56">
                  Signed in
                </p>
                <p className="mt-3 text-lg font-semibold text-white">{current.user.name}</p>
                <p className="mt-1 text-sm text-white/68">{roleDisplayName[current.user.role]}</p>
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-white/12 bg-white/8 p-4 text-sm leading-6 text-white/68">
                Sign in to open the protected DWDS modules.
              </div>
            )}
          </div>

          {navItems.length ? <DashboardNav items={navItems} /> : null}

          <div className="mt-auto space-y-3">
            <Link
              href="/"
              className={cn(
                buttonVariants({
                  variant: "outline",
                  className:
                    "h-10 w-full rounded-full border-white/14 bg-white/6 text-white hover:bg-white/10 hover:text-white",
                })
              )}
            >
              <ArrowLeftRight className="size-4" />
              Public site
            </Link>
            {isAuthenticated ? <AdminSessionButton /> : null}
          </div>
          </aside>
        }
      >
        {children}
      </DashboardChrome>
    </div>
  );
}
