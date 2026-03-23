import Link from "next/link";
import { notFound } from "next/navigation";

import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

import { buttonVariants } from "@/components/ui/button-variants";
import { PrintBillButton } from "@/features/billing/components/print-bill-button";
import {
  calculateBillIssueDate,
  calculateGracePeriodEnd,
  formatCurrency,
  formatPenaltyNotice,
} from "@/features/billing/lib/billing-calculations";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

type AdminBillTemplatePageProps = {
  params: Promise<{
    billId: string;
  }>;
};

export default async function AdminBillTemplatePage({
  params,
}: AdminBillTemplatePageProps) {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const { billId } = await params;

  const bill = await prisma.bill.findUnique({
    where: {
      id: billId,
    },
    select: {
      id: true,
      billingPeriod: true,
      dueDate: true,
      usageAmount: true,
      totalCharges: true,
      status: true,
      createdAt: true,
      customer: {
        select: {
          accountNumber: true,
          name: true,
          address: true,
          contactNumber: true,
        },
      },
      reading: {
        select: {
          previousReading: true,
          currentReading: true,
          readingDate: true,
          meter: {
            select: {
              meterNumber: true,
            },
          },
        },
      },
    },
  });

  if (!bill) {
    notFound();
  }

  const billIssueDate = calculateBillIssueDate(bill.reading.readingDate);
  const gracePeriodEnd = calculateGracePeriodEnd(bill.dueDate);
  const penaltyNotice = formatPenaltyNotice();

  return (
    <main className="min-h-screen bg-transparent px-5 py-6 print:bg-white print:px-0 print:py-0 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 print:max-w-none print:gap-0">
        <header className="overflow-hidden rounded-[2rem] border border-[#d4e7e3] bg-[linear-gradient(135deg,#0f3f43,#19545a_52%,#2f7b82)] px-6 py-6 text-white shadow-[0_32px_90px_-48px_rgba(16,63,67,0.9)] print:hidden lg:px-8 lg:py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/70">
              Consumer Bill Template
            </p>
            <h1 className="font-heading text-4xl tracking-tight text-white">
              Printable bill copy
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-white/76">
              Print and distribute this billing statement to the consumer. Due date is
              ten days after issue, with a five-day grace period before disconnection
              applies.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PrintBillButton />
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
              Back to billing
            </Link>
            <UserButton />
          </div>
          </div>
        </header>

        <section className="rounded-[2rem] border border-[#dbe9e5] bg-white/92 p-8 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.55)] print:rounded-none print:border-0 print:bg-white print:p-0 print:shadow-none">
          <div className="border-b border-border pb-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  DEGORIO WATER DISTRIBUTION SERVICES
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                  Water Billing Statement
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                  Please print and distribute this statement to the consumer. Non-payment
                  after the grace period is subject to {penaltyNotice.toLowerCase()}.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-[#dbe9e5] bg-[linear-gradient(180deg,#f8fbfa,#eff7f5)] px-5 py-4 text-sm shadow-[0_18px_40px_-38px_rgba(16,63,67,0.45)]">
                <p className="font-medium text-foreground">Bill ID</p>
                <p className="mt-2 font-mono text-xs text-muted-foreground">{bill.id}</p>
                <p className="mt-4 font-medium text-foreground">Billing period</p>
                <p className="mt-1 text-muted-foreground">{bill.billingPeriod}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 py-6 md:grid-cols-2">
            <div className="rounded-[1.6rem] border border-[#dbe9e5] bg-[linear-gradient(180deg,#f9fcfb,#f2f8f6)] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Consumer
              </p>
              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <p className="font-medium text-foreground">{bill.customer.name}</p>
                  <p className="mt-1 text-muted-foreground">{bill.customer.accountNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{bill.customer.address}</p>
                  <p className="mt-1 text-muted-foreground">
                    {bill.customer.contactNumber || "No contact number on file"}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Meter</p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {bill.reading.meter.meterNumber}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-[#dbe9e5] bg-[linear-gradient(180deg,#f9fcfb,#f2f8f6)] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Billing Schedule
              </p>
              <dl className="mt-4 grid gap-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Bill issue date</dt>
                  <dd className="font-medium text-foreground">
                    {billIssueDate.toLocaleDateString("en-PH")}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Due date</dt>
                  <dd className="font-medium text-foreground">
                    {bill.dueDate.toLocaleDateString("en-PH")}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Grace period ends</dt>
                  <dd className="font-medium text-foreground">
                    {gracePeriodEnd.toLocaleDateString("en-PH")}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Penalty</dt>
                  <dd className="font-medium text-destructive">{penaltyNotice}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.6rem] border border-[#dbe9e5] shadow-[0_18px_40px_-38px_rgba(16,63,67,0.45)]">
            <table className="min-w-full divide-y divide-border text-left">
              <thead className="bg-secondary/55">
                <tr className="text-sm text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Reading date</th>
                  <th className="px-4 py-3 font-medium">Previous</th>
                  <th className="px-4 py-3 font-medium">Current</th>
                  <th className="px-4 py-3 font-medium">Consumption</th>
                  <th className="px-4 py-3 font-medium">Amount due</th>
                </tr>
              </thead>
              <tbody className="bg-background">
                <tr className="text-sm">
                  <td className="px-4 py-4 text-muted-foreground">
                    {bill.reading.readingDate.toLocaleDateString("en-PH")}
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {bill.reading.previousReading}
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {bill.reading.currentReading}
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">{bill.usageAmount} cu.m</td>
                  <td className="px-4 py-4 text-lg font-semibold text-foreground">
                    {formatCurrency(bill.totalCharges)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="rounded-[1.6rem] border border-[#dbe9e5] bg-[linear-gradient(180deg,#f9fcfb,#f2f8f6)] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Important Notice
              </p>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-muted-foreground">
                <li>Bills are issued every month on the 5th day.</li>
                <li>Payment is due ten days after the bill issue date.</li>
                <li>A five-day grace period is allowed after the due date.</li>
                <li>Unpaid accounts after the grace period are subject to disconnection.</li>
              </ul>
            </div>

            <div className="rounded-[1.6rem] border border-[#dbe9e5] bg-[linear-gradient(180deg,rgba(32,115,123,0.08),rgba(32,115,123,0.02))] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Settlement
              </p>
              <p className="mt-4 text-sm text-muted-foreground">Current bill status</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                {bill.status.replace("_", " ")}
              </p>
              <p className="mt-4 text-sm text-muted-foreground">Generated record</p>
              <p className="mt-2 text-sm font-medium text-foreground">
                {bill.createdAt.toLocaleString("en-PH")}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
