import Link from "next/link";

import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { BillStatus } from "@prisma/client";

import { buttonVariants } from "@/components/ui/button-variants";
import { PaymentForm } from "@/features/payments/components/payment-form";
import { PaymentHistoryList } from "@/features/payments/components/payment-history-list";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export default async function AdminPaymentsPage() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const [openBills, payments] = await Promise.all([
    prisma.bill.findMany({
      where: {
        status: {
          in: [BillStatus.UNPAID, BillStatus.PARTIALLY_PAID, BillStatus.OVERDUE],
        },
      },
      orderBy: [{ createdAt: "asc" }],
      select: {
        id: true,
        billingPeriod: true,
        totalCharges: true,
        status: true,
        customer: {
          select: {
            accountNumber: true,
            name: true,
          },
        },
        reading: {
          select: {
            meter: {
              select: {
                meterNumber: true,
              },
            },
          },
        },
        payments: {
          where: {
            status: "COMPLETED",
          },
          select: {
            amount: true,
          },
        },
      },
    }),
    prisma.payment.findMany({
      orderBy: [{ paymentDate: "desc" }],
      take: 20,
      select: {
        id: true,
        amount: true,
        paymentDate: true,
        method: true,
        referenceId: true,
        status: true,
        bill: {
          select: {
            id: true,
            billingPeriod: true,
            totalCharges: true,
            status: true,
            customer: {
              select: {
                accountNumber: true,
                name: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const billOptions = openBills
    .map((bill) => {
      const paidAmount = bill.payments.reduce((sum, payment) => sum + payment.amount, 0);
      const outstandingBalance = Math.max(0, bill.totalCharges - paidAmount);

      return {
        id: bill.id,
        billingPeriod: bill.billingPeriod,
        totalCharges: bill.totalCharges,
        outstandingBalance,
        customer: bill.customer,
        reading: bill.reading,
      };
    })
    .filter((bill) => bill.outstandingBalance > 0);

  return (
    <main className="min-h-screen bg-muted/30 px-6 py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-border bg-background px-6 py-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Step 3.4
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Manual Payment Recording
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Encode cashier payments against open bills and automatically update each
              bill&apos;s receivable status once the recorded payments cover the total
              charges.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/billing"
              className={cn(
                buttonVariants({
                  variant: "outline",
                  className: "h-10 rounded-xl px-4",
                })
              )}
            >
              Billing module
            </Link>
            <Link
              href="/admin/dashboard"
              className={cn(
                buttonVariants({
                  variant: "outline",
                  className: "h-10 rounded-xl px-4",
                })
              )}
            >
              Back to dashboard
            </Link>
            <UserButton />
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
          <PaymentForm bills={billOptions} />
          <PaymentHistoryList payments={payments} />
        </section>
      </div>
    </main>
  );
}
