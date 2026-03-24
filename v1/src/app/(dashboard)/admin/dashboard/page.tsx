import type { ComponentType } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BanknoteArrowDown,
  ClipboardCheck,
  FileSpreadsheet,
  Gauge,
  ReceiptText,
  Users,
  WalletCards,
} from "lucide-react";

import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { BillStatus, PaymentStatus, ReadingStatus, type Role } from "@prisma/client";

import { buttonVariants } from "@/components/ui/button-variants";
import { ModuleAccessStateView } from "@/features/admin/components/module-access-state";
import { syncCurrentUser } from "@/features/auth/actions/sync-current-user";
import {
  canPerformCapability,
  getAccessibleAdminModules,
  getModuleAccess,
  roleDisplayName,
  roleSummaries,
  type AdminModule,
} from "@/features/auth/lib/authorization";
import { FirstLoginSync } from "@/features/auth/components/first-login-sync";
import { formatCurrency } from "@/features/billing/lib/billing-calculations";
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
    title: "Collections report",
    description: "Audit current-day payment records and confirm total collections fast.",
    action: "Open collections",
    icon: BanknoteArrowDown,
  },
];

function getRoleCapabilities(role: Role) {
  return [
    canPerformCapability(role, "customers:create") ? "Customer and meter setup" : null,
    canPerformCapability(role, "readings:create") ? "Reading entry" : null,
    canPerformCapability(role, "readings:approve") ? "Reading approval" : null,
    canPerformCapability(role, "billing:generate") ? "Bill generation" : null,
    canPerformCapability(role, "payments:record") ? "Cashier posting" : null,
    canPerformCapability(role, "tariffs:create") ? "Tariff changes" : null,
  ].filter(Boolean) as string[];
}

export default async function AdminDashboardPage() {
  const access = await getModuleAccess("dashboard");

  if (access.status === "signed_out" || access.status === "inactive") {
    return <ModuleAccessStateView module="dashboard" access={access} />;
  }

  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  if (access.status === "missing_profile") {
    return (
      <main className="min-h-screen bg-transparent px-5 py-6 sm:px-6 sm:py-8">
        <FirstLoginSync needsSync syncUser={syncCurrentUser} />
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <section className="overflow-hidden rounded-[2rem] border border-[#d4e7e3] bg-[linear-gradient(135deg,#0f3f43,#19545a_52%,#2f7b82)] text-white shadow-[0_32px_90px_-48px_rgba(16,63,67,0.9)]">
            <div className="flex flex-col gap-6 px-6 py-6 lg:flex-row lg:items-start lg:justify-between lg:px-8 lg:py-8">
              <div className="max-w-3xl space-y-4">
                <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-white/78">
                  Staff Provisioning
                </span>
                <h1 className="font-heading text-4xl leading-tight tracking-tight sm:text-5xl">
                  Finish the first-login sync before opening DWDS modules.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-white/76 sm:text-base">
                  Your Clerk session is active, but the local staff record still needs to be
                  created. Stay on this page until the dashboard refresh completes.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className={cn(
                    buttonVariants({
                      variant: "outline",
                      className:
                        "h-10 rounded-full border-white/18 bg-white/8 px-5 text-white hover:bg-white/12 hover:text-white",
                    })
                  )}
                >
                  Public site
                </Link>
                <UserButton />
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const localUser = access.user;
  const { start, end } = getTodayCollectionRange();

  const [
    customerCount,
    activeMeterCount,
    pendingReadingCount,
    approvedReadingCount,
    openBillCount,
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
      accent: "bg-[#e4f3ef] text-[#19545a]",
    },
    {
      label: "Active meters",
      value: activeMeterCount.toString(),
      detail: "Meters currently in service",
      accent: "bg-[#e7f1fb] text-[#1d4f84]",
    },
    {
      label: "Pending readings",
      value: pendingReadingCount.toString(),
      detail: "Waiting for billing review",
      accent: "bg-[#fbedd9] text-[#7a4f11]",
    },
    {
      label: "Approved to bill",
      value: approvedReadingCount.toString(),
      detail: "Ready for bill generation",
      accent: "bg-[#ede7fb] text-[#5a3ca3]",
    },
    {
      label: "Open bills",
      value: openBillCount.toString(),
      detail: "Still awaiting settlement",
      accent: "bg-[#fae4e2] text-[#8a2f28]",
    },
  ] as const;
  const workflowBoard = [
    {
      module: "customers" as const,
      title: "Accounts and meters",
      summary: "Customer setup and active service linkage.",
      count: `${customerCount} accounts`,
      href: "/admin/customers",
    },
    {
      module: "readings" as const,
      title: "Reading review queue",
      summary: "Pending field submissions requiring validation.",
      count: `${pendingReadingCount} pending`,
      href: "/admin/readings",
    },
    {
      module: "billing" as const,
      title: "Ready to bill",
      summary: "Approved usage records that can move into receivables.",
      count: `${approvedReadingCount} approved`,
      href: "/admin/billing",
    },
    {
      module: "collections" as const,
      title: "Collections in motion",
      summary: "Open receivables and today's posted payments.",
      count: `${openBillCount} open bills`,
      href: "/admin/collections",
    },
  ].filter((item) => accessibleModules.has(item.module));
  const roleCapabilities = getRoleCapabilities(localUser.role);

  return (
    <main className="min-h-screen bg-transparent px-5 py-6 sm:px-6 sm:py-8">
      <FirstLoginSync needsSync={false} syncUser={syncCurrentUser} />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="overflow-hidden rounded-[2rem] border border-[#d4e7e3] bg-[linear-gradient(135deg,#0f3f43,#19545a_52%,#2f7b82)] text-white shadow-[0_32px_90px_-48px_rgba(16,63,67,0.9)]">
          <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-8">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-white/78">
                  Operations Workspace
                </span>
                <span className="rounded-full border border-[#8ce1d5]/25 bg-[#8ce1d5]/12 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#d9fff6]">
                  DWDS
                </span>
              </div>

              <div className="space-y-3">
                <h1 className="max-w-3xl font-heading text-4xl leading-tight tracking-tight sm:text-5xl">
                  Utility operations, receivables, and collections in one daily control
                  room.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-white/76 sm:text-base">
                  Monitor the full DWDS workflow from account setup to cashier settlement,
                  with billing review, printable statements, and same-day collections
                  visibility in one protected surface.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                {accessibleModules.has("readings") ? (
                  <Link
                    href="/admin/readings"
                    className={cn(
                      buttonVariants({
                        className:
                          "h-11 rounded-full bg-white px-6 text-primary hover:bg-white/90",
                      })
                    )}
                  >
                    Review reading queue
                  </Link>
                ) : null}
                {accessibleModules.has("collections") ? (
                  <Link
                    href="/admin/collections"
                    className={cn(
                      buttonVariants({
                        variant: "outline",
                        className:
                          "h-11 rounded-full border-white/18 bg-white/8 px-6 text-white hover:bg-white/12 hover:text-white",
                      })
                    )}
                  >
                    Open collections
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 self-start sm:grid-cols-2 lg:grid-cols-1">
              <article className="rounded-[1.75rem] border border-white/12 bg-white/8 p-5 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                  Signed-in staff
                </p>
                <p className="mt-3 text-xl font-semibold tracking-tight">{localUser.name}</p>
                <p className="mt-2 text-sm text-white/72">
                  {roleDisplayName[localUser.role]} with active Clerk session
                </p>
              </article>

              <article className="rounded-[1.75rem] border border-white/12 bg-[linear-gradient(145deg,rgba(255,255,255,0.16),rgba(255,255,255,0.06))] p-5 backdrop-blur">
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

              <div className="flex items-center justify-between rounded-[1.75rem] border border-white/12 bg-white/8 px-5 py-4 sm:col-span-2 lg:col-span-1">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                    Role coverage
                  </p>
                  <p className="mt-2 max-w-[16rem] text-sm font-medium text-white">
                    {roleSummaries[localUser.role]}
                  </p>
                  <p className="mt-2 max-w-[16rem] text-xs text-white/72">
                    {roleCapabilities.length
                      ? roleCapabilities.join(" | ")
                      : "No operational capabilities are currently assigned."}
                  </p>
                </div>
                <UserButton />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {operationsSnapshot.map((item) => (
            <article
              key={item.label}
              className="rounded-[1.75rem] border border-border/80 bg-white/88 p-5 shadow-[0_18px_60px_-45px_rgba(16,63,67,0.55)] backdrop-blur"
            >
              <div
                className={cn(
                  "inline-flex rounded-full px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em]",
                  item.accent
                )}
              >
                {item.label}
              </div>
              <p className="mt-4 text-4xl font-semibold tracking-tight text-foreground">
                {item.value}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.detail}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-[2rem] border border-border/80 bg-white/90 p-6 shadow-[0_20px_70px_-45px_rgba(16,63,67,0.55)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/72">
                  Operational Pulse
                </p>
                <h2 className="mt-3 font-heading text-3xl text-foreground">
                  What needs attention next
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                  The workflow is staged so staff can see where activity is sitting right
                  now, from account setup through receivable follow-up.
                </p>
              </div>
              <div className="hidden rounded-2xl bg-primary/8 p-3 text-primary sm:flex">
                <Activity className="size-5" />
              </div>
            </div>

            <div className="mt-8 grid gap-4">
              {workflowBoard.length ? (
                workflowBoard.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="cursor-pointer rounded-[1.5rem] border border-border/80 bg-secondary/35 px-5 py-4 transition-colors duration-200 hover:bg-secondary/60"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-base font-semibold text-foreground">{item.title}</p>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {item.summary}
                        </p>
                      </div>
                      <ArrowRight className="mt-1 size-4 shrink-0 text-primary" />
                    </div>
                    <p className="mt-4 text-sm font-medium text-primary">{item.count}</p>
                  </Link>
                ))
              ) : (
                <div className="rounded-[1.5rem] border border-border/80 bg-secondary/35 px-5 py-5 text-sm leading-6 text-muted-foreground">
                  No downstream workflow modules are assigned to this role yet.
                </div>
              )}
            </div>
          </article>

          <article className="rounded-[2rem] border border-border/80 bg-white/90 p-6 shadow-[0_20px_70px_-45px_rgba(16,63,67,0.55)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/72">
                  Modules
                </p>
                <h2 className="mt-3 font-heading text-3xl text-foreground">
                  Jump into the exact operation you need
                </h2>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {visibleModuleCards.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="cursor-pointer rounded-[1.6rem] border border-border/80 bg-white px-5 py-5 shadow-[0_18px_50px_-45px_rgba(16,63,67,0.55)] transition-colors duration-200 hover:bg-secondary/35"
                  >
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </p>
                    <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary">
                      {item.action}
                      <ArrowRight className="size-4" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
