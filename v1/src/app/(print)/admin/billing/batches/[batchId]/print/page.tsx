import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button-variants";
import { ModuleAccessStateView } from "@/features/admin/components/module-access-state";
import { AdminSessionButton } from "@/features/auth/components/admin-session-button";
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

type AdminBatchPrintPageProps = {
  params: Promise<{
    batchId: string;
  }>;
};

export const metadata: Metadata = {
  title: "DWDS Batch Bill Print",
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

export default async function AdminBatchPrintPage({ params }: AdminBatchPrintPageProps) {
  const access = await getModuleAccess("billPrint");

  if (access.status !== "authorized") {
    return <ModuleAccessStateView module="billPrint" access={access} />;
  }

  const { batchId } = await params;

  const batch = await prisma.billPrintBatch.findUnique({
    where: {
      id: batchId,
    },
    select: {
      id: true,
      label: true,
      bills: {
        orderBy: [
          {
            customer: {
              accountNumber: "asc",
            },
          },
        ],
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
      },
    },
  });

  if (!batch) {
    notFound();
  }

  const penaltyNotice = formatPenaltyNotice();

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eef6f4_0%,#f7faf9_35%,#ffffff_100%)] px-4 py-6 print:min-h-0 print:bg-white print:px-0 print:py-0 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 print:max-w-none print:gap-0">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-[#d4e7e3] bg-white px-5 py-4 shadow-[0_20px_60px_-44px_rgba(16,63,67,0.55)] print:hidden">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#6b8481]">
              Batch Print View
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#14383c]">
              {batch.label}
            </h1>
            <p className="mt-1 text-sm text-[#5b716e]">
              Consumer-bill layout only. One statement per printed A5 page.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <PrintBillButton label="Print batch" />
            <Link
              href="/admin/billing"
              className={cn(
                buttonVariants({
                  variant: "outline",
                  className: "h-10 rounded-xl px-4",
                })
              )}
            >
              Back to billing
            </Link>
            <AdminSessionButton />
          </div>
        </header>

        <div className="space-y-6 print:space-y-0">
          {batch.bills.map((bill) => {
            const billIssueDate = calculateBillIssueDate(bill.reading.readingDate);
            const gracePeriodEnd = calculateGracePeriodEnd(bill.dueDate);
            const statusLabel = bill.status.replaceAll("_", " ");

            return (
              <section
                key={bill.id}
                className="mx-auto w-full max-w-[148mm] overflow-hidden rounded-[2rem] border border-[#d9e7e4] bg-white shadow-[0_28px_80px_-54px_rgba(15,63,67,0.5)] print:min-h-[210mm] print:max-w-none print:break-after-page print:rounded-none print:border-0 print:shadow-none"
              >
                <div className="border-b border-[#d9e7e4] bg-[linear-gradient(180deg,#f8fbfb_0%,#f0f7f5_100%)] px-5 py-4 print:px-3 print:py-3">
                  <div className="grid gap-4 grid-cols-[minmax(0,1fr)_8.2rem] print:gap-3">
                    <div className="space-y-3 print:space-y-2">
                      <div className="flex items-start justify-between gap-4 border-b border-dashed border-[#c5d9d4] pb-3 print:pb-2">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#4d6a67]">
                            Degorio Water Distribution Services
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] font-medium uppercase tracking-[0.18em] text-[#6c8481]">
                            <span>Official Consumer Copy</span>
                            <span className="hidden h-1 w-1 rounded-full bg-[#9db7b2] sm:inline-block" />
                            <span>Water Utility Billing Statement</span>
                          </div>
                          <h2 className="mt-2 text-[22px] font-semibold tracking-[-0.04em] text-[#0f2f33] print:text-[20px]">
                            Water Billing Statement
                          </h2>
                        </div>

                        <div className="min-w-[7.4rem] rounded-[1.1rem] border border-[#d3e4df] bg-white px-3 py-2 text-right shadow-[0_14px_34px_-28px_rgba(15,63,67,0.35)] print:border-[#d7e5e1] print:px-2.5 print:py-2 print:shadow-none">
                          <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#6b8481]">
                            Statement Ref.
                          </p>
                          <p className="mt-1.5 font-mono text-[9px] text-[#20484b]">
                            {bill.id.slice(0, 8).toUpperCase()}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-2 grid-cols-2">
                        <div className="rounded-[1rem] border border-[#dbe9e5] bg-white px-3 py-2.5">
                          <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#6b8481]">
                            Account
                          </p>
                          <p className="mt-1.5 text-sm font-semibold text-[#14383c]">
                            {bill.customer.accountNumber}
                          </p>
                        </div>
                        <div className="rounded-[1rem] border border-[#dbe9e5] bg-white px-3 py-2.5">
                          <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#6b8481]">
                            Billing Period
                          </p>
                          <p className="mt-1.5 text-sm font-semibold text-[#14383c]">
                            {bill.billingPeriod}
                          </p>
                        </div>
                        <div className="rounded-[1rem] border border-[#dbe9e5] bg-white px-3 py-2.5">
                          <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#6b8481]">
                            Meter No.
                          </p>
                          <p className="mt-1.5 font-mono text-sm font-semibold text-[#14383c]">
                            {bill.reading.meter.meterNumber}
                          </p>
                        </div>
                        <div className="rounded-[1rem] border border-[#dbe9e5] bg-white px-3 py-2.5">
                          <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#6b8481]">
                            Status
                          </p>
                          <p className="mt-1.5 text-sm font-semibold text-[#14383c]">
                            {statusLabel}
                          </p>
                        </div>
                      </div>
                    </div>

                    <aside className="rounded-[1.4rem] border border-[#cde1db] bg-[linear-gradient(180deg,#173f43_0%,#0f3134_100%)] px-4 py-4 text-white shadow-[0_24px_54px_-36px_rgba(10,35,38,0.7)] print:px-3 print:py-3 print:shadow-none">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-white/64">
                        Amount Due
                      </p>
                      <p className="mt-2 text-[1.8rem] font-semibold tracking-[-0.06em] text-white print:text-[1.4rem]">
                        {formatCurrency(bill.totalCharges)}
                      </p>

                      <div className="mt-4 space-y-2 border-t border-white/12 pt-3 text-[11px]">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-white/66">Issue date</span>
                          <span className="font-medium text-white">{formatDate(billIssueDate)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-white/66">Due date</span>
                          <span className="font-medium text-white">{formatDate(bill.dueDate)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-white/66">Grace ends</span>
                          <span className="font-medium text-white">{formatDate(gracePeriodEnd)}</span>
                        </div>
                      </div>
                    </aside>
                  </div>
                </div>

                <div className="px-5 py-4 print:px-3 print:py-3">
                  <div className="grid gap-3 grid-cols-[1.15fr_0.85fr] print:gap-2">
                    <section className="rounded-[1.15rem] border border-[#dbe9e5] bg-[#fbfdfc] px-3.5 py-3 print:px-3 print:py-2">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[#6b8481]">
                        Consumer Details
                      </p>
                      <div className="mt-2.5 space-y-2.5">
                        <div>
                          <p className="text-base font-semibold tracking-[-0.03em] text-[#16373b] print:text-sm">
                            {bill.customer.name}
                          </p>
                          <p className="mt-1 text-[11px] leading-5 text-[#5a726f] print:leading-4">
                            {bill.customer.address}
                          </p>
                        </div>
                        <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2 text-[11px]">
                          <span className="text-[#708784]">Contact</span>
                          <span className="font-medium text-[#17373b]">
                            {bill.customer.contactNumber || "No contact number on file"}
                          </span>
                        </div>
                      </div>
                    </section>

                    <section className="rounded-[1.15rem] border border-[#dbe9e5] bg-[#fbfdfc] px-3.5 py-3 print:px-3 print:py-2">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[#6b8481]">
                        Billing Timeline
                      </p>
                      <dl className="mt-2.5 space-y-2 text-[11px]">
                        <div className="flex items-center justify-between gap-3 border-b border-dashed border-[#d7e6e2] pb-1.5">
                          <dt className="text-[#6e8581]">Reading date</dt>
                          <dd className="font-medium text-[#17373b]">
                            {formatDate(bill.reading.readingDate)}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between gap-3 border-b border-dashed border-[#d7e6e2] pb-1.5">
                          <dt className="text-[#6e8581]">Bill generated</dt>
                          <dd className="font-medium text-[#17373b]">
                            {formatDateTime(bill.createdAt)}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <dt className="text-[#6e8581]">Settlement</dt>
                          <dd className="font-medium uppercase tracking-[0.12em] text-[#17373b]">
                            {statusLabel}
                          </dd>
                        </div>
                      </dl>
                    </section>
                  </div>

                  <section className="mt-3 overflow-hidden rounded-[1.2rem] border border-[#dbe9e5]">
                    <div className="grid grid-cols-[1.15fr_0.95fr_0.95fr_0.95fr_1.1fr] bg-[#eef5f3] text-[9px] font-semibold uppercase tracking-[0.18em] text-[#607874]">
                      <div className="px-3 py-2.5">Reading Snapshot</div>
                      <div className="px-3 py-2.5 text-right">Previous</div>
                      <div className="px-3 py-2.5 text-right">Current</div>
                      <div className="px-3 py-2.5 text-right">Usage</div>
                      <div className="px-3 py-2.5 text-right">Charges</div>
                    </div>

                    <div className="grid grid-cols-[1.15fr_0.95fr_0.95fr_0.95fr_1.1fr] items-stretch bg-white text-[11px]">
                      <div className="flex flex-col justify-between border-t border-[#dbe9e5] px-3 py-3">
                        <p className="font-medium text-[#17373b]">{formatDate(bill.reading.readingDate)}</p>
                        <p className="mt-1.5 text-[10px] leading-4 text-[#6a817d] print:hidden">
                          Metered consumption for {bill.billingPeriod}
                        </p>
                      </div>
                      <div className="border-t border-[#dbe9e5] px-3 py-3 text-right text-[#17373b]">
                        {bill.reading.previousReading}
                      </div>
                      <div className="border-t border-[#dbe9e5] px-3 py-3 text-right text-[#17373b]">
                        {bill.reading.currentReading}
                      </div>
                      <div className="border-t border-[#dbe9e5] px-3 py-3 text-right font-medium text-[#17373b]">
                        {bill.usageAmount} cu.m
                      </div>
                      <div className="border-t border-[#dbe9e5] px-3 py-3 text-right text-sm font-semibold tracking-[-0.03em] text-[#0f3134]">
                        {formatCurrency(bill.totalCharges)}
                      </div>
                    </div>
                  </section>

                  <section className="mt-3 rounded-[1.2rem] border border-[#dbe9e5] bg-[linear-gradient(180deg,#fbfdfc_0%,#f5faf8_100%)] px-3.5 py-3 print:px-3 print:py-2">
                    <div className="flex flex-col gap-3">
                      <div className="max-w-xl">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[#6b8481]">
                          Important Notice
                        </p>
                        <ul className="mt-2.5 space-y-1 text-[11px] leading-5 text-[#556c69]">
                          <li>Payment is due within ten days from the issue date shown above.</li>
                          <li>A five-day grace period is allowed after the due date.</li>
                          <li>
                            Unpaid balances after the grace period are subject to{" "}
                            {penaltyNotice.toLowerCase()}.
                          </li>
                        </ul>
                      </div>
                    </div>
                  </section>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
