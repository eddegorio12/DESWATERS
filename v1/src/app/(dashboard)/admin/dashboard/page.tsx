import type { ComponentType } from "react";
import Link from "next/link";
import {
  Activity,
  BanknoteArrowDown,
  ClipboardCheck,
  FileSpreadsheet,
  Gauge,
  MapPinned,
  ShieldAlert,
  ReceiptText,
  Server,
  TriangleAlert,
  Users,
  WalletCards,
} from "lucide-react";

import { BillStatus, PaymentStatus, ReadingStatus, type Role } from "@prisma/client";

import { buttonVariants } from "@/components/ui/button-variants";
import { ModuleAccessStateView } from "@/features/admin/components/module-access-state";
import {
  ActionRow,
  DashboardMetricCard,
  DashboardPanel,
  SectionHeader,
} from "@/features/admin/components/dashboard-console";
import { AdminSessionButton } from "@/features/auth/components/admin-session-button";
import { ChangePasswordPanel } from "@/features/auth/components/change-password-panel";
import {
  canPerformCapability,
  getAccessibleAdminModules,
  getModuleAccess,
  roleDisplayName,
  roleSummaries,
  type AdminModule,
} from "@/features/auth/lib/authorization";
import { formatCurrency } from "@/features/billing/lib/billing-calculations";
import { syncReceivableStatuses } from "@/features/follow-up/lib/workflow";
import { BrandLockup } from "@/features/marketing/components/brand-lockup";
import { getTodayCollectionRange } from "@/features/reports/lib/collections";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

const moduleCards: {
  module: AdminModule;
  href: string;
  title: string;
  description: string;
  action: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  {
    module: "routeOperations",
    href: "/admin/routes",
    title: "Route operations",
    description: "Plan coverage by zone, assign staff ownership, and review route health.",
    action: "Open routes",
    icon: MapPinned,
  },
  {
    module: "staffAccess",
    href: "/admin/staff-access",
    title: "Admin management",
    description: "Create admins, update roles, and reactivate or deactivate internal accounts.",
    action: "Manage admins",
    icon: ShieldAlert,
  },
  {
    module: "systemReadiness",
    href: "/admin/system-readiness",
    title: "System readiness",
    description: "Review backup logging, restore guidance, and recent security signal visibility.",
    action: "Open system tools",
    icon: Server,
  },
  {
    module: "customers",
    href: "/admin/customers",
    title: "Customer registry",
    description: "Maintain service accounts, addresses, contacts, and account status.",
    action: "Open customers",
    icon: Users,
  },
  {
    module: "meters",
    href: "/admin/meters",
    title: "Meter operations",
    description: "Register meters, assign them to customers, and verify service linkage.",
    action: "Open meters",
    icon: Gauge,
  },
  {
    module: "exceptions",
    href: "/admin/exceptions",
    title: "Exceptions workspace",
    description: "Catch missing readings, abnormal usage, payment duplicates, and status mismatches early.",
    action: "Open exceptions",
    icon: TriangleAlert,
  },
  {
    module: "tariffs",
    href: "/admin/tariffs",
    title: "Tariff rules",
    description: "Manage minimum charges, progressive tiers, and the active billing tariff.",
    action: "Open tariffs",
    icon: FileSpreadsheet,
  },
  {
    module: "readings",
    href: "/admin/readings",
    title: "Reading review",
    description: "Encode field readings, approve submissions, and keep an audit trail visible.",
    action: "Open readings",
    icon: ClipboardCheck,
  },
  {
    module: "billing",
    href: "/admin/billing",
    title: "Billing queue",
    description: "Generate bills from approved readings and review open receivables.",
    action: "Open billing",
    icon: ReceiptText,
  },
  {
    module: "payments",
    href: "/admin/payments",
    title: "Cashier posting",
    description: "Record completed payments and track remaining balances by account.",
    action: "Open payments",
    icon: WalletCards,
  },
  {
    module: "collections",
    href: "/admin/collections",
    title: "Reporting workspace",
    description: "Review filtered payment history and live receivables from one module.",
    action: "Open reporting",
    icon: BanknoteArrowDown,
  },
  {
    module: "followUp",
    href: "/admin/follow-up",
    title: "Receivables follow-up",
    description: "Advance overdue balances into reminder, disconnection, and reinstatement states.",
    action: "Open follow-up",
    icon: ShieldAlert,
  },
];

function getRoleCapabilities(role: Role) {
  return [
    canPerformCapability(role, "admins:manage") ? "Admin management" : null,
    canPerformCapability(role, "routes:manage") ? "Route operations" : null,
    canPerformCapability(role, "customers:create") ? "Customer and meter setup" : null,
    canPerformCapability(role, "readings:create") ? "Reading entry" : null,
    canPerformCapability(role, "readings:approve") ? "Reading approval" : null,
    canPerformCapability(role, "billing:generate") ? "Bill generation" : null,
    canPerformCapability(role, "payments:record") ? "Cashier posting" : null,
    canPerformCapability(role, "followup:update") ? "Receivables follow-up" : null,
    canPerformCapability(role, "tariffs:create") ? "Tariff changes" : null,
    canPerformCapability(role, "system:backup:log") ? "Backup logging" : null,
  ].filter(Boolean) as string[];
}

export default async function AdminDashboardPage() {
  const access = await getModuleAccess("dashboard");

  if (access.status !== "authorized") {
    return <ModuleAccessStateView module="dashboard" access={access} />;
  }

  const localUser = access.user;
  const { start, end } = getTodayCollectionRange();
  await syncReceivableStatuses();

  const [
    customerCount,
    activeMeterCount,
    pendingReadingCount,
    approvedReadingCount,
    openBillCount,
    routedMeterCount,
    activeRouteCount,
    todayPayments,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.meter.count({
      where: {
        status: "ACTIVE",
      },
    }),
    prisma.reading.count({
      where: {
        status: ReadingStatus.PENDING_REVIEW,
      },
    }),
    prisma.reading.count({
      where: {
        status: ReadingStatus.APPROVED,
        bill: null,
      },
    }),
    prisma.bill.count({
      where: {
        status: {
          in: [BillStatus.UNPAID, BillStatus.PARTIALLY_PAID, BillStatus.OVERDUE],
        },
      },
    }),
    prisma.meter.count({
      where: {
        serviceRouteId: {
          not: null,
        },
      },
    }),
    prisma.serviceRoute.count(),
    prisma.payment.findMany({
      where: {
        status: PaymentStatus.COMPLETED,
        paymentDate: {
          gte: start,
          lt: end,
        },
      },
      select: {
        amount: true,
      },
    }),
  ]);

  const todayCollections = todayPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const accessibleModules = new Set(getAccessibleAdminModules(localUser.role));
  const visibleModuleCards = moduleCards.filter((card) => accessibleModules.has(card.module));
  const operationsSnapshot = [
    {
      label: "Customers",
      value: customerCount.toString(),
      detail: "Registered consumer accounts",
      accent: "teal",
    },
    {
      label: "Active meters",
      value: activeMeterCount.toString(),
      detail: "Meters currently in service",
      accent: "sky",
    },
    {
      label: "Pending readings",
      value: pendingReadingCount.toString(),
      detail: "Waiting for billing review",
      accent: "amber",
    },
    {
      label: "Approved to bill",
      value: approvedReadingCount.toString(),
      detail: "Ready for bill generation",
      accent: "violet",
    },
    {
      label: "Active routes",
      value: activeRouteCount.toString(),
      detail: `${routedMeterCount} meters already mapped into route coverage`,
      accent: "emerald",
    },
    {
      label: "Open bills",
      value: openBillCount.toString(),
      detail: "Still awaiting settlement",
      accent: "rose",
    },
  ] as const;
  const workflowBoard = [
    {
      module: "routeOperations" as const,
      title: "Route coverage",
      summary: "Track zone ownership, route staffing, and overdue pressure by field area.",
      count: `${activeRouteCount} routes`,
      href: "/admin/routes",
      action: "Open routes",
      icon: MapPinned,
    },
    {
      module: "customers" as const,
      title: "Accounts and meters",
      summary: "Customer setup and active service linkage.",
      count: `${customerCount} accounts`,
      href: "/admin/customers",
      action: "Open customers",
      icon: Users,
    },
    {
      module: "readings" as const,
      title: "Reading review queue",
      summary: "Pending field submissions requiring validation.",
      count: `${pendingReadingCount} pending`,
      href: "/admin/readings",
      action: "Open readings",
      icon: ClipboardCheck,
    },
    {
      module: "billing" as const,
      title: "Ready to bill",
      summary: "Approved usage records that can move into receivables.",
      count: `${approvedReadingCount} approved`,
      href: "/admin/billing",
      action: "Open billing",
      icon: ReceiptText,
    },
    {
      module: "exceptions" as const,
      title: "Operational exceptions",
      summary: "Monitor anomalies that need office review before they become billing or service issues.",
      count: "Alerts workspace",
      href: "/admin/exceptions",
      action: "Open exceptions",
      icon: TriangleAlert,
    },
    {
      module: "followUp" as const,
      title: "Overdue workflow",
      summary: "Escalate past-due balances into reminder and service actions.",
      count: `${openBillCount} open bills`,
      href: "/admin/follow-up",
      action: "Open follow-up",
      icon: ShieldAlert,
    },
  ].filter((item) => accessibleModules.has(item.module));
  const roleCapabilities = getRoleCapabilities(localUser.role);

  return (
    <section className="bg-transparent">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="dwds-panel-dark overflow-hidden">
          <div className="grid gap-6 px-5 py-5 sm:px-6 sm:py-6 lg:grid-cols-[1.22fr_0.78fr] lg:gap-8 lg:px-8 lg:py-8">
            <div className="space-y-5">
              <BrandLockup inverse size="lg" className="w-fit max-sm:max-w-[10rem]" />
              <div className="flex flex-wrap items-center gap-3">
                <span className="dwds-kicker border-white/14 bg-white/8 text-white/78">
                  Operations Workspace
                </span>
                <span className="dwds-kicker border-[#8ce1d5]/25 bg-[#8ce1d5]/12 text-[#d9fff6]">
                  DWDS
                </span>
              </div>

              <div className="space-y-3">
                <h1 className="max-w-3xl font-heading text-3xl leading-tight tracking-[-0.03em] sm:text-4xl xl:text-5xl">
                  Run daily DWDS work from one control room.
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-white/76 sm:text-base sm:leading-7">
                  See what needs action now, then jump straight into the queue, module, or
                  report that moves the workflow forward.
                </p>
              </div>

              <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:flex-wrap">
                {accessibleModules.has("readings") ? (
                  <Link
                    href="/admin/readings"
                    className={cn(
                      buttonVariants({
                        className:
                          "h-11 w-full rounded-full bg-white px-6 text-primary hover:bg-white/90",
                      })
                    )}
                  >
                    Open reading queue
                  </Link>
                ) : null}
                {accessibleModules.has("collections") ? (
                  <Link
                    href="/admin/collections"
                    className={cn(
                      buttonVariants({
                        variant: "outline",
                        className:
                          "h-11 w-full rounded-full border-white/18 bg-white/8 px-6 text-white hover:bg-white/12 hover:text-white",
                      })
                    )}
                  >
                    Open collections
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="self-start overflow-hidden rounded-[1.65rem] border border-white/12 bg-white/7">
              <div className="grid gap-0 sm:grid-cols-2 lg:grid-cols-1">
                <article className="border-b border-white/10 p-5 sm:border-r sm:border-white/10 lg:border-r-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                    Signed-in staff
                  </p>
                  <p className="mt-3 text-xl font-semibold tracking-tight">{localUser.name}</p>
                  <p className="mt-2 text-sm text-white/72">
                    {roleDisplayName[localUser.role]} with active internal admin access
                  </p>
                </article>

                <article className="border-b border-white/10 p-5 lg:border-b lg:border-white/10">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                    Today&apos;s collections
                  </p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight">
                    {formatCurrency(todayCollections)}
                  </p>
                  <p className="mt-2 text-sm text-white/72">
                    {todayPayments.length} completed payment
                    {todayPayments.length === 1 ? "" : "s"} posted in the current operating
                    day
                  </p>
                </article>

                <div className="flex flex-col gap-4 p-5 sm:col-span-2 lg:col-span-1">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                      Role coverage
                    </p>
                    <p className="mt-2 max-w-[18rem] text-sm font-medium text-white">
                      {roleSummaries[localUser.role]}
                    </p>
                    <p className="mt-2 text-xs leading-6 text-white/72">
                      {roleCapabilities.length
                        ? roleCapabilities.join(" | ")
                        : "No operational capabilities are currently assigned."}
                    </p>
                  </div>
                  <div className="border-t border-white/10 pt-4">
                    <AdminSessionButton />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="dwds-section overflow-hidden">
          <div className="grid gap-0 md:grid-cols-2 xl:grid-cols-6">
            {operationsSnapshot.map((item) => (
              <DashboardMetricCard
                key={item.label}
                label={item.label}
                value={item.value}
                detail={item.detail}
                accent={item.accent}
              />
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <DashboardPanel className="p-0">
            <div className="border-b border-border/75 px-5 py-5 sm:px-6">
              <SectionHeader
                eyebrow="Operational Pulse"
                title="What needs attention next"
                description="The workflow stays staged by urgency so staff can move from live queue pressure into the next operational action without re-scanning the full system."
                icon={Activity}
              />
            </div>

            <div className="divide-y divide-border/75 overflow-hidden">
              {workflowBoard.length ? (
                workflowBoard.map((item) => (
                  <ActionRow
                    key={item.title}
                    href={item.href}
                    title={item.title}
                    summary={item.summary}
                    meta={item.count}
                    actionLabel={item.action}
                    icon={item.icon}
                  />
                ))
              ) : (
                <div className="px-5 py-5 text-sm leading-6 text-muted-foreground sm:px-6">
                  No downstream workflow modules are assigned to this role yet.
                </div>
              )}
            </div>
          </DashboardPanel>

          <DashboardPanel className="p-0">
            <div className="border-b border-border/75 px-5 py-5 sm:px-6">
              <SectionHeader
                eyebrow="Modules"
                title="Open the module you need"
                description="The directory stays compact on purpose. Use it to move straight into the responsibility area you need instead of scanning a second dashboard grid."
              />
            </div>

            <div className="divide-y divide-border/75 overflow-hidden">
              {visibleModuleCards.map((item) => (
                <ActionRow
                  key={item.href}
                  href={item.href}
                  title={item.title}
                  summary={item.description}
                  actionLabel={item.action}
                  icon={item.icon}
                />
              ))}
            </div>
          </DashboardPanel>
        </section>

        <ChangePasswordPanel />
      </div>
    </section>
  );
}
