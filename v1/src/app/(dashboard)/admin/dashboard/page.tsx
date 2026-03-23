import Link from "next/link";

import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { BillStatus, PaymentStatus, ReadingStatus } from "@prisma/client";

import { buttonVariants } from "@/components/ui/button-variants";
import { FirstLoginSync } from "@/features/auth/components/first-login-sync";
import { syncCurrentUser } from "@/features/auth/actions/sync-current-user";
import { formatCurrency } from "@/features/billing/lib/billing-calculations";
import { getTodayCollectionRange } from "@/features/reports/lib/collections";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const localUser = await prisma.user.findUnique({
    where: { clerkId: userId },
  });
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

  return (
    <main className="min-h-screen bg-muted/30 px-6 py-8">
      <FirstLoginSync needsSync={!localUser} syncUser={syncCurrentUser} />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-border bg-background px-6 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Operations Workspace
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Admin Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Central control for customer accounts, billing operations, cashier entries,
              collections reporting, and printable consumer bills.
            </p>
          </div>
          <UserButton />
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-border bg-background p-5 shadow-sm">
            <p className="text-sm font-medium text-foreground">Signed-in staff</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {localUser
                ? `${localUser.name} (${localUser.role})`
                : "Sync in progress. Refresh once the automatic upsert completes."}
            </p>
          </article>
          <article className="rounded-2xl border border-border bg-background p-5 shadow-sm">
            <p className="text-sm font-medium text-foreground">Today&apos;s collections</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              {formatCurrency(todayCollections)}
            </p>
            <p className="mt-2 break-all font-mono text-sm text-muted-foreground">
              {todayPayments.length} completed payment{todayPayments.length === 1 ? "" : "s"}
            </p>
          </article>
          <article className="rounded-2xl border border-border bg-background p-5 shadow-sm">
            <p className="text-sm font-medium text-foreground">Current session</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Authenticated through Clerk and protected by the admin proxy.
            </p>
            <p className="mt-2 break-all font-mono text-sm text-muted-foreground">
              {userId}
            </p>
          </article>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <article className="rounded-2xl border border-border bg-background p-5 shadow-sm">
            <p className="text-sm font-medium text-foreground">Customers</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
              {customerCount}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">Registered consumer accounts</p>
          </article>
          <article className="rounded-2xl border border-border bg-background p-5 shadow-sm">
            <p className="text-sm font-medium text-foreground">Active meters</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
              {activeMeterCount}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">Meters currently in service</p>
          </article>
          <article className="rounded-2xl border border-border bg-background p-5 shadow-sm">
            <p className="text-sm font-medium text-foreground">Pending readings</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
              {pendingReadingCount}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">Awaiting billing review</p>
          </article>
          <article className="rounded-2xl border border-border bg-background p-5 shadow-sm">
            <p className="text-sm font-medium text-foreground">Approved to bill</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
              {approvedReadingCount}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">Ready for bill generation</p>
          </article>
          <article className="rounded-2xl border border-border bg-background p-5 shadow-sm">
            <p className="text-sm font-medium text-foreground">Open bills</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
              {openBillCount}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">Still awaiting settlement</p>
          </article>
        </section>

        <section className="rounded-3xl border border-border bg-background px-6 py-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Operations modules</p>
              <p className="text-sm leading-6 text-muted-foreground">
                Jump directly into the core DESWATERS workflows from one dashboard.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/customers"
                className={cn(
                  buttonVariants({
                    variant: "outline",
                    className: "h-10 rounded-xl px-4",
                  })
                )}
              >
                Customer module
              </Link>
              <Link
                href="/admin/meters"
                className={cn(buttonVariants({ className: "h-10 rounded-xl px-4" }))}
              >
                Meter module
              </Link>
              <Link
                href="/admin/tariffs"
                className={cn(buttonVariants({ className: "h-10 rounded-xl px-4" }))}
              >
                Tariff module
              </Link>
              <Link
                href="/admin/readings"
                className={cn(buttonVariants({ className: "h-10 rounded-xl px-4" }))}
              >
                Reading module
              </Link>
              <Link
                href="/admin/billing"
                className={cn(buttonVariants({ className: "h-10 rounded-xl px-4" }))}
              >
                Billing module
              </Link>
              <Link
                href="/admin/payments"
                className={cn(buttonVariants({ className: "h-10 rounded-xl px-4" }))}
              >
                Payments module
              </Link>
              <Link
                href="/admin/collections"
                className={cn(buttonVariants({ className: "h-10 rounded-xl px-4" }))}
              >
                Collections dashboard
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
