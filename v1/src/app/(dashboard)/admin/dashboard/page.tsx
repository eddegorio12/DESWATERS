import type { ComponentType } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import {
  Activity,
  BanknoteArrowDown,
  Bot,
  ClipboardCheck,
  FileSpreadsheet,
  Gauge,
  MapPinned,
  ReceiptText,
  Server,
  ShieldAlert,
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
import { SuperAdminTwoFactorPanel } from "@/features/auth/components/super-admin-two-factor-panel";
import {
  canPerformCapability,
  getAccessibleAdminModules,
  getModuleAccess,
  roleDisplayName,
  roleSummaries,
  type AdminModule,
} from "@/features/auth/lib/authorization";
import {
  createOtpAuthUri,
  decryptTwoFactorSecret,
  formatTwoFactorSecret,
} from "@/features/auth/lib/two-factor";
import { formatCurrency } from "@/features/billing/lib/billing-calculations";
import { syncReceivableStatuses } from "@/features/follow-up/lib/workflow";
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
    module: "automation",
    href: "/admin/automation",
    title: "Automation supervision",
    description: "Review worker health, approval transport issues, retries, and dead-letter outcomes.",
    action: "Open automation",
    icon: Bot,
  },
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
      detail: `${routedMeterCount} meters mapped into route coverage`,
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
      summary: "Monitor anomalies before they become billing or service issues.",
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
  const pendingTwoFactorSetup = localUser.twoFactorPendingSecretCiphertext
    ? await (async () => {
        const pendingSecret = decryptTwoFactorSecret(
          localUser.twoFactorPendingSecretCiphertext!
        );
        const otpAuthUri = createOtpAuthUri({
          email: localUser.email,
          secret: pendingSecret,
        });

        return {
          secret: formatTwoFactorSecret(pendingSecret),
          otpAuthUri,
          qrDataUrl: await QRCode.toDataURL(otpAuthUri, {
            errorCorrectionLevel: "M",
            margin: 1,
            width: 240,
          }),
        };
      })()
    : null;

  const dateFormatter = new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <section className="min-h-dvh bg-transparent">
      <div className="flex min-h-dvh flex-col">
        <header className="border-b border-border/70 px-5 py-4 sm:px-7 lg:px-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-primary/72">
                Operations Workspace
              </p>
              <h1 className="mt-3 font-heading text-[2rem] leading-tight tracking-[-0.05em] text-foreground sm:text-[2.5rem]">
                Daily utility work, aligned into one composed operating surface.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Review queue pressure, move into the next operational module,
                and keep finance and route context visible without scanning a
                wall of dashboard cards.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {accessibleModules.has("readings") ? (
                <Link
                  href="/admin/readings"
                  className={cn(
                    buttonVariants({
                      className:
                        "h-10 rounded-full bg-[linear-gradient(135deg,#163154,#15527a_56%,#10938d)] px-5 text-white hover:brightness-105",
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
                        "h-10 rounded-full border-border/80 bg-white/70 px-5 text-foreground hover:bg-white",
                    })
                  )}
                >
                  Open collections
                </Link>
              ) : null}
            </div>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 gap-0 xl:grid-cols-[minmax(0,1fr)_320px]">
          <main className="min-w-0">
            <section className="border-b border-border/70">
              <div className="grid gap-0 md:grid-cols-2 2xl:grid-cols-6">
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

            <section className="grid gap-0 border-b border-border/70 2xl:grid-cols-[1.08fr_0.92fr]">
              <DashboardPanel className="border-0 border-r-0 bg-transparent">
                <div className="border-b border-border/70 px-5 py-5 sm:px-7">
                  <SectionHeader
                    eyebrow="Operational Pulse"
                    title="What needs attention next"
                    description="The central workspace stays staged by urgency so staff can move from live queue pressure into the next action without re-scanning the whole system."
                    icon={Activity}
                  />
                </div>

                <div className="divide-y divide-border/70">
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
                        className="px-5 sm:px-7"
                      />
                    ))
                  ) : (
                    <div className="px-5 py-5 text-sm leading-6 text-muted-foreground sm:px-7">
                      No downstream workflow modules are assigned to this role yet.
                    </div>
                  )}
                </div>
              </DashboardPanel>

              <DashboardPanel className="border-0 border-t bg-transparent 2xl:border-l 2xl:border-t-0">
                <div className="border-b border-border/70 px-5 py-5 sm:px-7">
                  <SectionHeader
                    eyebrow="Module Directory"
                    title="Open the responsibility area you need"
                    description="The module list is flatter and denser on purpose. Use it as a direct operational directory instead of a second dashboard full of cards."
                  />
                </div>

                <div className="divide-y divide-border/70">
                  {visibleModuleCards.map((item) => (
                    <ActionRow
                      key={item.href}
                      href={item.href}
                      title={item.title}
                      summary={item.description}
                      actionLabel={item.action}
                      icon={item.icon}
                      className="px-5 sm:px-7"
                    />
                  ))}
                </div>
              </DashboardPanel>
            </section>

            <section className="grid gap-0 border-b border-border/70 xl:grid-cols-2">
              <div className="border-b border-border/70 xl:border-b-0 xl:border-r">
                <ChangePasswordPanel />
              </div>
              {localUser.role === "SUPER_ADMIN" ? (
                <div>
                  <SuperAdminTwoFactorPanel
                    email={localUser.email}
                    isEnabled={localUser.twoFactorEnabled}
                    enabledAt={
                      localUser.twoFactorEnabledAt
                        ? dateFormatter.format(localUser.twoFactorEnabledAt)
                        : null
                    }
                    lastVerifiedAt={
                      localUser.twoFactorLastVerifiedAt
                        ? dateFormatter.format(localUser.twoFactorLastVerifiedAt)
                        : null
                    }
                    recoveryCodeCount={localUser.twoFactorRecoveryCodeHashes.length}
                    pendingSetup={pendingTwoFactorSetup}
                  />
                </div>
              ) : (
                <div className="flex items-center px-5 py-8 text-sm leading-6 text-muted-foreground sm:px-7">
                  Two-factor setup tools are limited to SUPER_ADMIN accounts.
                </div>
              )}
            </section>
          </main>

          <aside className="border-t border-border/70 xl:border-l xl:border-t-0">
            <div className="xl:sticky xl:top-0 xl:max-h-dvh xl:overflow-auto">
              <section className="border-b border-border/70 px-5 py-5">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-primary/72">
                  Support Rail
                </p>
                <h2 className="mt-3 font-heading text-[1.45rem] tracking-[-0.03em] text-foreground">
                  Operator context
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Keep user state, collection status, and role coverage visible
                  while the main workspace stays focused on action.
                </p>
              </section>

              <section className="border-b border-border/70 px-5 py-5">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-primary/72">
                  Signed-in staff
                </p>
                <p className="mt-3 text-lg font-semibold text-foreground">
                  {localUser.name}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {roleDisplayName[localUser.role]}
                </p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {roleSummaries[localUser.role]}
                </p>
              </section>

              <section className="border-b border-border/70 px-5 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-primary/72">
                      Today&apos;s collections
                    </p>
                    <p className="mt-3 font-heading text-[2rem] tracking-[-0.05em] text-foreground">
                      {formatCurrency(todayCollections)}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {todayPayments.length} completed payment
                      {todayPayments.length === 1 ? "" : "s"} in the current
                      operating day.
                    </p>
                  </div>
                  <div className="inline-flex size-10 items-center justify-center rounded-[0.9rem] border border-primary/12 bg-primary/8 text-primary">
                    <BanknoteArrowDown className="size-4" />
                  </div>
                </div>
              </section>

              <section className="border-b border-border/70 px-5 py-5">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-primary/72">
                  Role coverage
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {roleCapabilities.length ? (
                    roleCapabilities.map((capability) => (
                      <span
                        key={capability}
                        className="inline-flex rounded-full border border-border/70 bg-white/56 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-foreground/80"
                      >
                        {capability}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm leading-6 text-muted-foreground">
                      No operational capabilities are currently assigned.
                    </p>
                  )}
                </div>
              </section>

              <section className="border-b border-border/70 px-5 py-5">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-primary/72">
                  Quick links
                </p>
                <div className="mt-4 space-y-2">
                  {accessibleModules.has("payments") ? (
                    <Link
                      href="/admin/payments"
                      className="flex items-center justify-between border border-border/70 bg-white/42 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-white/70"
                    >
                      <span>Cashier posting</span>
                      <WalletCards className="size-4 text-primary" />
                    </Link>
                  ) : null}
                  {accessibleModules.has("billing") ? (
                    <Link
                      href="/admin/billing"
                      className="flex items-center justify-between border border-border/70 bg-white/42 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-white/70"
                    >
                      <span>Billing queue</span>
                      <ReceiptText className="size-4 text-primary" />
                    </Link>
                  ) : null}
                  {accessibleModules.has("systemReadiness") ? (
                    <Link
                      href="/admin/system-readiness"
                      className="flex items-center justify-between border border-border/70 bg-white/42 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-white/70"
                    >
                      <span>System readiness</span>
                      <Server className="size-4 text-primary" />
                    </Link>
                  ) : null}
                </div>
              </section>

              <section className="px-5 py-5">
                <div className="flex flex-col gap-3">
                  <AdminSessionButton className="w-full border-border/80 bg-white/70 text-foreground hover:bg-white hover:text-foreground" />
                  <p className="text-xs leading-5 text-muted-foreground">
                    Internal sign-out remains available without leaving the
                    workspace.
                  </p>
                </div>
              </section>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
