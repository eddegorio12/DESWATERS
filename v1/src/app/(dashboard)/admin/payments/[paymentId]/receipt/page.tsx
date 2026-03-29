import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button-variants";
import { ModuleAccessStateView } from "@/features/admin/components/module-access-state";
import {
  PrintableRecordPaper,
  PrintableRecordShell,
} from "@/features/admin/components/printable-record-shell";
import { AdminSessionButton } from "@/features/auth/components/admin-session-button";
import { getModuleAccess } from "@/features/auth/lib/authorization";
import { formatCurrency } from "@/features/billing/lib/billing-calculations";
import { PrintReceiptButton } from "@/features/payments/components/print-receipt-button";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

type AdminPaymentReceiptPageProps = {
  params: Promise<{
    paymentId: string;
  }>;
};

export const metadata: Metadata = {
  title: "DWDS Official Receipt",
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

function formatMethod(method: string) {
  return method.replaceAll("_", " ");
}

export default async function AdminPaymentReceiptPage({
  params,
}: AdminPaymentReceiptPageProps) {
  const access = await getModuleAccess("payments");

  if (access.status !== "authorized") {
    return <ModuleAccessStateView module="payments" access={access} />;
  }

  const { paymentId } = await params;

  const payment = await prisma.payment.findUnique({
    where: {
      id: paymentId,
    },
    select: {
      id: true,
      receiptNumber: true,
      amount: true,
      balanceBefore: true,
      balanceAfter: true,
      paymentDate: true,
      method: true,
      referenceId: true,
      createdAt: true,
      recordedBy: {
        select: {
          name: true,
          role: true,
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
              address: true,
              contactNumber: true,
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
        },
      },
    },
  });

  if (!payment) {
    notFound();
  }

  return (
    <PrintableRecordShell
      eyebrow="Printable Official Receipt"
      title="Cashier-ready settlement record"
      description="Every payment posting now carries an auditable receipt number, cashier attribution, and before-and-after balance snapshot."
      actions={
        <>
          <PrintReceiptButton />
          <Link
            href="/admin/payments"
            className={cn(
              buttonVariants({
                variant: "outline",
                className:
                  "h-10 rounded-full border-white/18 bg-white/8 px-5 text-white hover:bg-white/12 hover:text-white",
              })
            )}
          >
            Back to payments
          </Link>
          <Link
            href={`/admin/billing/${payment.bill.id}`}
            className={cn(
              buttonVariants({
                variant: "outline",
                className:
                  "h-10 rounded-full border-white/18 bg-white/8 px-5 text-white hover:bg-white/12 hover:text-white",
              })
            )}
          >
            Related bill
          </Link>
          <AdminSessionButton />
        </>
      }
    >
      <PrintableRecordPaper>
          <div className="border-b border-[#d9e7e4] bg-[linear-gradient(180deg,#f8fbfb_0%,#f0f7f5_100%)] px-6 py-5 print:px-3 print:py-3">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_18rem] print:gap-3 print:lg:grid-cols-[minmax(0,1fr)_9.5rem]">
              <div className="space-y-4 print:space-y-2">
                <div className="flex items-start justify-between gap-4 border-b border-dashed border-[#c5d9d4] pb-4 print:pb-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#4d6a67]">
                      Degorio Water Distribution Services
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[#6c8481] print:mt-1 print:text-[9px]">
                      <span>Official Cashier Copy</span>
                      <span className="hidden h-1 w-1 rounded-full bg-[#9db7b2] sm:inline-block" />
                      <span>Utility Payment Receipt</span>
                    </div>
                    <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-[#0f2f33] print:mt-1 print:text-[20px]">
                      Official Receipt
                    </h2>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-[#516764] print:hidden">
                      Consumer-facing proof of settlement for posted utility payments,
                      including bill reference and remaining receivable position.
                    </p>
                  </div>

                  <div className="hidden min-w-[11rem] rounded-[1.3rem] border border-[#d3e4df] bg-white px-4 py-3 text-right shadow-[0_14px_34px_-28px_rgba(15,63,67,0.35)] sm:block print:block print:min-w-[8.2rem] print:border-[#d7e5e1] print:px-3 print:py-2 print:shadow-none">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b8481] print:text-[9px]">
                      Receipt No.
                    </p>
                    <p className="mt-2 font-mono text-[11px] text-[#20484b] print:mt-1 print:text-[9px]">
                      {payment.receiptNumber}
                    </p>
                    <p className="mt-1 text-[10px] text-[#78908c] print:hidden">
                      System-generated settlement reference
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 print:gap-2">
                  <div className="rounded-[1.25rem] border border-[#dbe9e5] bg-white px-4 py-3 print:px-3 print:py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b8481]">
                      Account
                    </p>
                    <p className="mt-2 text-base font-semibold text-[#14383c] print:mt-1 print:text-sm">
                      {payment.bill.customer.accountNumber}
                    </p>
                  </div>

                  <div className="rounded-[1.25rem] border border-[#dbe9e5] bg-white px-4 py-3 print:px-3 print:py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b8481]">
                      Billing Period
                    </p>
                    <p className="mt-2 text-base font-semibold text-[#14383c] print:mt-1 print:text-sm">
                      {payment.bill.billingPeriod}
                    </p>
                  </div>

                  <div className="rounded-[1.25rem] border border-[#dbe9e5] bg-white px-4 py-3 print:px-3 print:py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b8481]">
                      Meter No.
                    </p>
                    <p className="mt-2 font-mono text-base font-semibold text-[#14383c] print:mt-1 print:text-sm">
                      {payment.bill.reading.meter.meterNumber}
                    </p>
                  </div>

                  <div className="rounded-[1.25rem] border border-[#dbe9e5] bg-white px-4 py-3 print:px-3 print:py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b8481]">
                      Bill status
                    </p>
                    <p className="mt-2 text-base font-semibold text-[#14383c] print:mt-1 print:text-sm">
                      {payment.bill.status.replaceAll("_", " ")}
                    </p>
                  </div>
                </div>
              </div>

              <aside className="rounded-[1.75rem] border border-[#cde1db] bg-[linear-gradient(180deg,#173f43_0%,#0f3134_100%)] px-5 py-5 text-white shadow-[0_24px_54px_-36px_rgba(10,35,38,0.7)] print:px-3 print:py-3 print:shadow-none">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/64">
                  Amount Received
                </p>
                <p className="mt-3 text-[2.2rem] font-semibold tracking-[-0.06em] text-white print:mt-2 print:text-[1.4rem]">
                  {formatCurrency(payment.amount)}
                </p>

                <div className="mt-5 space-y-3 border-t border-white/12 pt-4 text-sm print:mt-3 print:space-y-1.5 print:pt-2 print:text-[11px]">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-white/66">Payment date</span>
                    <span className="font-medium text-white">
                      {formatDate(payment.paymentDate)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-white/66">Method</span>
                    <span className="font-medium text-white">
                      {formatMethod(payment.method)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-white/66">Remaining balance</span>
                    <span className="font-medium text-white">
                      {formatCurrency(payment.balanceAfter)}
                    </span>
                  </div>
                </div>
              </aside>
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-[minmax(0,1.25fr)_19rem] print:grid-cols-1">
            <div className="px-6 py-5 print:px-3 print:py-3">
              <div className="grid gap-4 md:grid-cols-2 print:grid-cols-[1.15fr_0.85fr] print:gap-2">
                <section className="rounded-[1.4rem] border border-[#dbe9e5] bg-[#fbfdfc] px-4 py-4 print:px-3 print:py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6b8481]">
                    Consumer Details
                  </p>
                  <div className="mt-3 space-y-3">
                    <div>
                      <p className="text-lg font-semibold tracking-[-0.03em] text-[#16373b] print:text-base">
                        {payment.bill.customer.name}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[#5a726f] print:text-[11px] print:leading-4">
                        {payment.bill.customer.address}
                      </p>
                    </div>
                    <div className="grid grid-cols-[5.2rem_minmax(0,1fr)] gap-3 text-sm print:text-[11px]">
                      <span className="text-[#708784]">Contact</span>
                      <span className="font-medium text-[#17373b]">
                        {payment.bill.customer.contactNumber || "No contact number on file"}
                      </span>
                    </div>
                  </div>
                </section>

                <section className="rounded-[1.4rem] border border-[#dbe9e5] bg-[#fbfdfc] px-4 py-4 print:px-3 print:py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6b8481]">
                    Posting Timeline
                  </p>
                  <dl className="mt-3 space-y-3 text-sm print:mt-2 print:space-y-1.5 print:text-[11px]">
                    <div className="flex items-center justify-between gap-4 border-b border-dashed border-[#d7e6e2] pb-2">
                      <dt className="text-[#6e8581]">Posted at</dt>
                      <dd className="font-medium text-[#17373b]">
                        {formatDateTime(payment.paymentDate)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-b border-dashed border-[#d7e6e2] pb-2">
                      <dt className="text-[#6e8581]">Receipt generated</dt>
                      <dd className="font-medium text-[#17373b]">
                        {formatDateTime(payment.createdAt)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-[#6e8581]">Cashier</dt>
                      <dd className="font-medium text-[#17373b]">
                        {payment.recordedBy.name}
                      </dd>
                    </div>
                  </dl>
                </section>
              </div>

              <section className="mt-4 overflow-hidden rounded-[1.5rem] border border-[#dbe9e5] print:mt-2">
                <div className="grid grid-cols-[1.15fr_0.95fr_0.95fr_0.95fr_1.1fr] bg-[#eef5f3] text-[11px] font-semibold uppercase tracking-[0.18em] text-[#607874] print:text-[10px]">
                  <div className="px-4 py-3">Settlement Snapshot</div>
                  <div className="px-4 py-3 text-right">Bill total</div>
                  <div className="px-4 py-3 text-right">Before</div>
                  <div className="px-4 py-3 text-right">Payment</div>
                  <div className="px-4 py-3 text-right">After</div>
                </div>

                <div className="grid grid-cols-[1.15fr_0.95fr_0.95fr_0.95fr_1.1fr] items-stretch bg-white text-sm print:text-[11px]">
                  <div className="flex flex-col justify-between border-t border-[#dbe9e5] px-4 py-4 print:px-3 print:py-2">
                    <p className="font-medium text-[#17373b]">{payment.bill.billingPeriod}</p>
                    <p className="mt-2 text-xs leading-5 text-[#6a817d] print:hidden">
                      {payment.bill.customer.accountNumber} • {payment.receiptNumber}
                    </p>
                  </div>
                  <div className="border-t border-[#dbe9e5] px-4 py-4 text-right text-[#17373b] print:px-3 print:py-2">
                    {formatCurrency(payment.bill.totalCharges)}
                  </div>
                  <div className="border-t border-[#dbe9e5] px-4 py-4 text-right text-[#17373b] print:px-3 print:py-2">
                    {formatCurrency(payment.balanceBefore)}
                  </div>
                  <div className="border-t border-[#dbe9e5] px-4 py-4 text-right font-medium text-[#17373b] print:px-3 print:py-2">
                    {formatCurrency(payment.amount)}
                  </div>
                  <div className="border-t border-[#dbe9e5] px-4 py-4 text-right text-lg font-semibold tracking-[-0.03em] text-[#0f3134] print:px-3 print:py-2 print:text-base">
                    {formatCurrency(payment.balanceAfter)}
                  </div>
                </div>
              </section>

              <section className="mt-4 rounded-[1.5rem] border border-[#dbe9e5] bg-[linear-gradient(180deg,#fbfdfc_0%,#f5faf8_100%)] px-4 py-4 print:mt-2 print:px-3 print:py-2">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="max-w-xl">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6b8481]">
                      Receipt Notes
                    </p>
                    <ul className="mt-3 space-y-1.5 text-sm leading-6 text-[#556c69] print:mt-2 print:space-y-1 print:text-[11px] print:leading-4">
                      <li>This receipt confirms only the amount posted on the date shown above.</li>
                      <li>Remaining balances continue to stay collectible until fully settled.</li>
                      <li>Overpayment and customer-credit handling remain outside the current workflow.</li>
                      <li className="print:hidden">Present this receipt when reconciling cashier totals or customer follow-up.</li>
                    </ul>
                  </div>

                  <div className="w-full rounded-[1.2rem] border border-dashed border-[#c9ddd7] bg-white px-4 py-3 print:hidden md:max-w-[15rem]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b8481]">
                      Transaction Reference
                    </p>
                    <div className="mt-3 space-y-2 text-sm text-[#5c7470]">
                      <div className="flex items-center justify-between gap-4">
                        <span>Method</span>
                        <span className="font-medium text-[#17373b]">
                          {formatMethod(payment.method)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span>Reference</span>
                        <span className="font-medium text-[#17373b]">
                          {payment.referenceId || "Cash counter"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span>Cashier role</span>
                        <span className="font-medium text-[#17373b]">
                          {payment.recordedBy.role.replaceAll("_", " ")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <aside className="border-t border-[#dbe9e5] bg-[#f7faf9] px-6 py-5 lg:border-l lg:border-t-0 print:hidden print:px-5 print:py-4">
              <div className="rounded-[1.45rem] border border-[#dbe9e5] bg-white px-4 py-4 shadow-[0_18px_38px_-34px_rgba(15,63,67,0.28)] print:shadow-none">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6b8481]">
                  Audit Summary
                </p>
                <div className="mt-4 space-y-4 text-sm">
                  <div className="border-b border-dashed border-[#d7e6e2] pb-3">
                    <p className="text-[#708784]">Receipt number</p>
                    <p className="mt-1 font-mono text-xs text-[#16373b]">
                      {payment.receiptNumber}
                    </p>
                  </div>
                  <div className="border-b border-dashed border-[#d7e6e2] pb-3">
                    <p className="text-[#708784]">Related bill</p>
                    <p className="mt-1 font-medium text-[#16373b]">
                      {payment.bill.billingPeriod}
                    </p>
                  </div>
                  <div className="border-b border-dashed border-[#d7e6e2] pb-3">
                    <p className="text-[#708784]">Consumer</p>
                    <p className="mt-1 font-semibold text-[#16373b]">
                      {payment.bill.customer.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#708784]">Outcome</p>
                    <p className="mt-1 leading-6 text-[#5b716e]">
                      This posting moved the account from{" "}
                      <span className="font-medium text-[#16373b]">
                        {formatCurrency(payment.balanceBefore)}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium text-[#16373b]">
                        {formatCurrency(payment.balanceAfter)}
                      </span>
                      .
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
      </PrintableRecordPaper>
    </PrintableRecordShell>
  );
}
