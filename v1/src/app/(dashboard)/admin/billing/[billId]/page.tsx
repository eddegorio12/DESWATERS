import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

import { buttonVariants } from "@/components/ui/button-variants";
import { ModuleAccessStateView } from "@/features/admin/components/module-access-state";
import { getModuleAccess } from "@/features/auth/lib/authorization";
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

export const metadata: Metadata = {
  title: "DWDS Water Billing Statement",
};

function formatDate(value: Date) {
  return value.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value: Date) {
  return value.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function AdminBillTemplatePage({
  params,
}: AdminBillTemplatePageProps) {
  const access = await getModuleAccess("billPrint");

  if (access.status !== "authorized") {
    return <ModuleAccessStateView module="billPrint" access={access} />;
  }

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
  const statusLabel = bill.status.replaceAll("_", " ");

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eef6f4_0%,#f7faf9_35%,#ffffff_100%)] px-4 py-6 print:min-h-0 print:bg-white print:px-0 print:py-0 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 print:max-w-none print:gap-0">
        <header className="overflow-hidden rounded-[2rem] border border-[#d4e7e3] bg-[linear-gradient(135deg,#0f3f43,#1f5a60_55%,#2e7a7d)] px-6 py-6 text-white shadow-[0_32px_90px_-48px_rgba(16,63,67,0.88)] print:hidden lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">
                Printable Consumer Bill
              </p>
              <h1 className="font-heading text-4xl tracking-tight text-white">
                One-page field-ready statement
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-white/78">
                Redesigned for clean print distribution, faster amount recognition, and
                clearer consumer reference details on a single page.
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

        <section className="mx-auto w-full max-w-[210mm] overflow-hidden rounded-[2rem] border border-[#d9e7e4] bg-white shadow-[0_28px_80px_-54px_rgba(15,63,67,0.5)] print:max-w-none print:rounded-none print:border-0 print:shadow-none">
          <div className="border-b border-[#d9e7e4] bg-[linear-gradient(180deg,#f8fbfb_0%,#f0f7f5_100%)] px-6 py-5 print:px-3 print:py-3">
            <div className="grid gap-5 print:gap-3 lg:grid-cols-[minmax(0,1.35fr)_18rem] print:lg:grid-cols-[minmax(0,1fr)_9.5rem]">
              <div className="space-y-4 print:space-y-2">
                <div className="flex items-start justify-between gap-4 border-b border-dashed border-[#c5d9d4] pb-4 print:pb-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#4d6a67]">
                      Degorio Water Distribution Services
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[#6c8481] print:mt-1 print:text-[9px]">
                      <span>Official Consumer Copy</span>
                      <span className="hidden h-1 w-1 rounded-full bg-[#9db7b2] sm:inline-block" />
                      <span>Water Utility Billing Statement</span>
                    </div>
                    <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-[#0f2f33] print:mt-1 print:text-[20px]">
                      Water Billing Statement
                    </h2>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-[#516764] print:hidden">
                      Official consumer copy for monthly water charges, due-date follow-up,
                      and cashier settlement reference.
                    </p>
                  </div>

                  <div className="hidden min-w-[11rem] rounded-[1.3rem] border border-[#d3e4df] bg-white px-4 py-3 text-right shadow-[0_14px_34px_-28px_rgba(15,63,67,0.35)] sm:block print:block print:min-w-[8.2rem] print:border-[#d7e5e1] print:px-3 print:py-2 print:shadow-none">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b8481] print:text-[9px]">
                      Statement Ref.
                    </p>
                    <p className="mt-2 font-mono text-[11px] text-[#20484b] print:mt-1 print:text-[9px]">
                      {bill.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="mt-1 text-[10px] text-[#78908c] print:hidden">
                      Internal billing record
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 print:gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[1.25rem] border border-[#dbe9e5] bg-white px-4 py-3 print:px-3 print:py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b8481]">
                      Account
                    </p>
                    <p className="mt-2 text-base font-semibold text-[#14383c] print:mt-1 print:text-sm">
                      {bill.customer.accountNumber}
                    </p>
                    <p className="mt-1 text-xs text-[#68807c] print:hidden">Consumer reference number</p>
                  </div>

                  <div className="rounded-[1.25rem] border border-[#dbe9e5] bg-white px-4 py-3 print:px-3 print:py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b8481]">
                      Billing Period
                    </p>
                    <p className="mt-2 text-base font-semibold text-[#14383c] print:mt-1 print:text-sm">
                      {bill.billingPeriod}
                    </p>
                    <p className="mt-1 text-xs text-[#68807c] print:hidden">Monthly billing cycle</p>
                  </div>

                  <div className="rounded-[1.25rem] border border-[#dbe9e5] bg-white px-4 py-3 print:px-3 print:py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b8481]">
                      Meter No.
                    </p>
                    <p className="mt-2 font-mono text-base font-semibold text-[#14383c] print:mt-1 print:text-sm">
                      {bill.reading.meter.meterNumber}
                    </p>
                    <p className="mt-1 text-xs text-[#68807c] print:hidden">Registered service meter</p>
                  </div>

                  <div className="rounded-[1.25rem] border border-[#dbe9e5] bg-white px-4 py-3 print:px-3 print:py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b8481]">
                      Status
                    </p>
                    <p className="mt-2 text-base font-semibold text-[#14383c] print:mt-1 print:text-sm">{statusLabel}</p>
                    <p className="mt-1 text-xs text-[#68807c] print:hidden">Current settlement standing</p>
                  </div>
                </div>
              </div>

              <aside className="rounded-[1.75rem] border border-[#cde1db] bg-[linear-gradient(180deg,#173f43_0%,#0f3134_100%)] px-5 py-5 text-white shadow-[0_24px_54px_-36px_rgba(10,35,38,0.7)] print:break-inside-avoid print:px-3 print:py-3 print:shadow-none">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/64">
                  Amount Due
                </p>
                <p className="mt-3 text-[2.2rem] font-semibold tracking-[-0.06em] text-white print:mt-2 print:text-[1.4rem]">
                  {formatCurrency(bill.totalCharges)}
                </p>

                <div className="mt-5 space-y-3 border-t border-white/12 pt-4 text-sm print:mt-3 print:space-y-1.5 print:pt-2 print:text-[11px]">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-white/66">Issue date</span>
                    <span className="font-medium text-white">{formatDate(billIssueDate)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-white/66">Due date</span>
                    <span className="font-medium text-white">{formatDate(bill.dueDate)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-white/66">Grace ends</span>
                    <span className="font-medium text-white">{formatDate(gracePeriodEnd)}</span>
                  </div>
                </div>

                <div className="mt-5 rounded-[1.1rem] border border-white/10 bg-white/8 px-4 py-3 print:mt-3 print:px-3 print:py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/58">
                    Penalty Notice
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/82 print:mt-1 print:text-[11px] print:leading-4">
                    {penaltyNotice}
                  </p>
                </div>
              </aside>
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-[minmax(0,1.25fr)_19rem] print:grid-cols-1">
            <div className="px-6 py-5 print:px-3 print:py-3">
              <div className="grid gap-4 md:grid-cols-2 print:grid-cols-[1.15fr_0.85fr] print:gap-2">
                <section className="rounded-[1.4rem] border border-[#dbe9e5] bg-[#fbfdfc] px-4 py-4 print:break-inside-avoid print:px-3 print:py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6b8481]">
                    Consumer Details
                  </p>
                  <div className="mt-3 space-y-3">
                    <div>
                      <p className="text-lg font-semibold tracking-[-0.03em] text-[#16373b] print:text-base">
                        {bill.customer.name}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[#5a726f] print:text-[11px] print:leading-4">
                        {bill.customer.address}
                      </p>
                    </div>
                    <div className="grid grid-cols-[5.2rem_minmax(0,1fr)] gap-3 text-sm print:text-[11px]">
                      <span className="text-[#708784]">Contact</span>
                      <span className="font-medium text-[#17373b]">
                        {bill.customer.contactNumber || "No contact number on file"}
                      </span>
                    </div>
                  </div>
                </section>

                <section className="rounded-[1.4rem] border border-[#dbe9e5] bg-[#fbfdfc] px-4 py-4 print:break-inside-avoid print:px-3 print:py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6b8481]">
                    Billing Timeline
                  </p>
                  <dl className="mt-3 space-y-3 text-sm print:mt-2 print:space-y-1.5 print:text-[11px]">
                    <div className="flex items-center justify-between gap-4 border-b border-dashed border-[#d7e6e2] pb-2">
                      <dt className="text-[#6e8581]">Reading date</dt>
                      <dd className="font-medium text-[#17373b]">
                        {formatDate(bill.reading.readingDate)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-b border-dashed border-[#d7e6e2] pb-2">
                      <dt className="text-[#6e8581]">Bill generated</dt>
                      <dd className="font-medium text-[#17373b]">
                        {formatDateTime(bill.createdAt)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 print:hidden">
                      <dt className="text-[#6e8581]">Settlement status</dt>
                      <dd className="font-medium uppercase tracking-[0.12em] text-[#17373b]">
                        {statusLabel}
                      </dd>
                    </div>
                  </dl>
                </section>
              </div>

              <section className="mt-4 overflow-hidden rounded-[1.5rem] border border-[#dbe9e5] print:mt-2 print:break-inside-avoid">
                <div className="grid grid-cols-[1.15fr_0.95fr_0.95fr_0.95fr_1.1fr] bg-[#eef5f3] text-[11px] font-semibold uppercase tracking-[0.18em] text-[#607874] print:text-[10px]">
                  <div className="px-4 py-3">Reading Snapshot</div>
                  <div className="px-4 py-3 text-right">Previous</div>
                  <div className="px-4 py-3 text-right">Current</div>
                  <div className="px-4 py-3 text-right">Usage</div>
                  <div className="px-4 py-3 text-right">Charges</div>
                </div>

                <div className="grid grid-cols-[1.15fr_0.95fr_0.95fr_0.95fr_1.1fr] items-stretch bg-white text-sm print:text-[11px]">
                  <div className="flex flex-col justify-between border-t border-[#dbe9e5] px-4 py-4 print:px-3 print:py-2">
                    <p className="font-medium text-[#17373b]">{formatDate(bill.reading.readingDate)}</p>
                    <p className="mt-2 text-xs leading-5 text-[#6a817d] print:hidden">
                      Metered consumption for {bill.billingPeriod}
                    </p>
                  </div>
                  <div className="border-t border-[#dbe9e5] px-4 py-4 text-right text-[#17373b] print:px-3 print:py-2">
                    {bill.reading.previousReading}
                  </div>
                  <div className="border-t border-[#dbe9e5] px-4 py-4 text-right text-[#17373b] print:px-3 print:py-2">
                    {bill.reading.currentReading}
                  </div>
                  <div className="border-t border-[#dbe9e5] px-4 py-4 text-right font-medium text-[#17373b] print:px-3 print:py-2">
                    {bill.usageAmount} cu.m
                  </div>
                  <div className="border-t border-[#dbe9e5] px-4 py-4 text-right text-lg font-semibold tracking-[-0.03em] text-[#0f3134] print:px-3 print:py-2 print:text-base">
                    {formatCurrency(bill.totalCharges)}
                  </div>
                </div>
              </section>

              <section className="mt-4 rounded-[1.5rem] border border-[#dbe9e5] bg-[linear-gradient(180deg,#fbfdfc_0%,#f5faf8_100%)] px-4 py-4 print:mt-2 print:break-inside-avoid print:px-3 print:py-2">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="max-w-xl">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6b8481]">
                      Important Notice
                    </p>
                    <ul className="mt-3 space-y-1.5 text-sm leading-6 text-[#556c69] print:mt-2 print:space-y-1 print:text-[11px] print:leading-4">
                      <li>Payment is due within ten days from the issue date shown above.</li>
                      <li>A five-day grace period is allowed after the due date.</li>
                      <li>Unpaid balances after the grace period are subject to disconnection.</li>
                      <li className="print:hidden">Present this statement when paying to avoid account posting delays.</li>
                    </ul>
                  </div>

                  <div className="w-full rounded-[1.2rem] border border-dashed border-[#c9ddd7] bg-white px-4 py-3 print:hidden md:max-w-[15rem]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b8481]">
                      Service Office Copy
                    </p>
                    <div className="mt-3 space-y-2 text-sm text-[#5c7470]">
                      <div className="flex items-center justify-between gap-4">
                        <span>Account</span>
                        <span className="font-medium text-[#17373b]">
                          {bill.customer.accountNumber}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span>Due</span>
                        <span className="font-medium text-[#17373b]">
                          {formatDate(bill.dueDate)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span>Amount</span>
                        <span className="font-semibold text-[#17373b]">
                          {formatCurrency(bill.totalCharges)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <aside className="border-t border-[#dbe9e5] bg-[#f7faf9] px-6 py-5 lg:border-l lg:border-t-0 print:hidden print:break-inside-avoid print:px-5 print:py-4">
              <div className="rounded-[1.45rem] border border-[#dbe9e5] bg-white px-4 py-4 shadow-[0_18px_38px_-34px_rgba(15,63,67,0.28)] print:shadow-none">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6b8481]">
                  Payment Counter Guide
                </p>
                <div className="mt-4 space-y-4 text-sm">
                  <div className="border-b border-dashed border-[#d7e6e2] pb-3">
                    <p className="text-[#708784]">Consumer</p>
                    <p className="mt-1 font-semibold text-[#16373b]">{bill.customer.name}</p>
                  </div>
                  <div className="border-b border-dashed border-[#d7e6e2] pb-3">
                    <p className="text-[#708784]">Account reference</p>
                    <p className="mt-1 font-mono text-xs text-[#16373b]">
                      {bill.customer.accountNumber}
                    </p>
                  </div>
                  <div className="border-b border-dashed border-[#d7e6e2] pb-3">
                    <p className="text-[#708784]">Statement amount</p>
                    <p className="mt-1 text-xl font-semibold tracking-[-0.04em] text-[#0f3134]">
                      {formatCurrency(bill.totalCharges)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#708784]">Reminder</p>
                    <p className="mt-1 leading-6 text-[#5b716e]">
                      This bill remains payable until the grace-period deadline of{" "}
                      <span className="font-medium text-[#16373b]">
                        {formatDate(gracePeriodEnd)}
                      </span>
                      .
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
