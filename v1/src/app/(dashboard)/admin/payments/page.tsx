import Link from "next/link";

import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { BillStatus } from "@prisma/client";

import { buttonVariants } from "@/components/ui/button-variants";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { ModuleAccessStateView } from "@/features/admin/components/module-access-state";
import { getModuleAccess } from "@/features/auth/lib/authorization";
import { PaymentForm } from "@/features/payments/components/payment-form";
import { PaymentHistoryList } from "@/features/payments/components/payment-history-list";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export default async function AdminPaymentsPage() {
  const access = await getModuleAccess("payments");

  if (access.status !== "authorized") {
    return <ModuleAccessStateView module="payments" access={access} />;
  }

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
        receiptNumber: true,
        amount: true,
        balanceBefore: true,
        balanceAfter: true,
        paymentDate: true,
        method: true,
        referenceId: true,
        status: true,
        recordedBy: {
          select: {
            name: true,
          },
        },
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

  const outstandingReceivableTotal = billOptions.reduce(
    (sum, bill) => sum + bill.outstandingBalance,
    0
  );

  return (
    <AdminPageShell
      eyebrow="Cashier Posting"
      title="Post utility payments against live receivables and keep recent settlement activity within reach."
      description="Select an open bill, accept full or partial settlement, issue an official receipt, and review the latest cashier transactions together with the bill status they affected."
      actions={
        <>
            <Link
              href="/admin/collections"
              className={cn(
                buttonVariants({
                  variant: "outline",
                  className:
                    "h-10 rounded-full border-white/18 bg-white/8 px-5 text-white hover:bg-white/12 hover:text-white",
                })
              )}
            >
              Reporting workspace
            </Link>
            <Link
              href="/admin/billing"
              className={cn(
                buttonVariants({
                  variant: "outline",
                  className:
                    "h-10 rounded-full border-white/18 bg-white/8 px-5 text-white hover:bg-white/12 hover:text-white",
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
                  className:
                    "h-10 rounded-full border-white/18 bg-white/8 px-5 text-white hover:bg-white/12 hover:text-white",
                })
              )}
            >
              Back to dashboard
            </Link>
            <UserButton />
        </>
      }
      stats={[
        {
          label: "Open bills",
          value: billOptions.length.toString(),
          detail: "Receivables currently available for cashier posting",
          accent: "rose",
        },
        {
          label: "Outstanding",
          value: new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
            maximumFractionDigits: 0,
          }).format(outstandingReceivableTotal),
          detail: "Total unpaid balance across selectable bills",
          accent: "amber",
        },
        {
          label: "Recent postings",
          value: payments.length.toString(),
          detail: "Latest payments shown in the history panel",
          accent: "sky",
        },
      ]}
    >

        <section className="grid gap-6 xl:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
          <PaymentForm bills={billOptions} />
          <PaymentHistoryList payments={payments} />
        </section>
    </AdminPageShell>
  );
}
