import type { DashboardNavItem } from "@/features/admin/components/dashboard-nav";
import type { AdminModule } from "@/features/auth/lib/authorization";

type DashboardSidebarModule = Exclude<AdminModule, "billPrint" | "assistant">;

const dashboardNavMeta = {
  dashboard: {
    href: "/admin/dashboard",
    label: "Dashboard",
    description: "Daily priorities and module access.",
    icon: "dashboard",
  },
  staffAccess: {
    href: "/admin/staff-access",
    label: "Staff Access",
    description: "Admins, roles, and account status.",
    icon: "staffAccess",
  },
  systemReadiness: {
    href: "/admin/system-readiness",
    label: "System",
    description: "Backups, restore steps, and security checks.",
    icon: "systemReadiness",
  },
  routeOperations: {
    href: "/admin/routes",
    label: "Routes",
    description: "Zones, route ownership, and field planning.",
    icon: "routeOperations",
  },
  customers: {
    href: "/admin/customers",
    label: "Customers",
    description: "Accounts, contacts, and service state.",
    icon: "customers",
  },
  exceptions: {
    href: "/admin/exceptions",
    label: "Exceptions",
    description: "Alerts for readings, receivables, and mismatches.",
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
    description: "Billing rules and rate setup.",
    icon: "tariffs",
  },
  readings: {
    href: "/admin/readings",
    label: "Readings",
    description: "Reading entry, review, and approval.",
    icon: "readings",
  },
  billing: {
    href: "/admin/billing",
    label: "Billing",
    description: "Bill generation and receivable review.",
    icon: "billing",
  },
  payments: {
    href: "/admin/payments",
    label: "Payments",
    description: "Cashier posting and receipts.",
    icon: "payments",
  },
  collections: {
    href: "/admin/collections",
    label: "Collections",
    description: "Collections totals and payment history.",
    icon: "collections",
  },
  followUp: {
    href: "/admin/follow-up",
    label: "Follow-Up",
    description: "Overdue workflow and service actions.",
    icon: "followUp",
  },
} as const satisfies Record<DashboardSidebarModule, DashboardNavItem>;

export function getDashboardNavItems(modules: readonly AdminModule[]) {
  return modules.flatMap((module) => {
    if (module === "billPrint" || module === "assistant") {
      return [];
    }

    const item = dashboardNavMeta[module];
    return item ? [item] : [];
  });
}

export function isStandaloneAdminRoute(pathname: string) {
  return (
    pathname.includes("/receipt") ||
    pathname.includes("/admin/notices/") ||
    /^\/admin\/billing\/[^/]+$/.test(pathname)
  );
}
