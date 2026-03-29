import Link from "next/link";
import type { Metadata } from "next";
import { NotificationChannel, PaymentStatus } from "@prisma/client";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button-variants";
import { ModuleAccessStateView } from "@/features/admin/components/module-access-state";
import {
  PrintableRecordPaper,
  PrintableRecordShell,
} from "@/features/admin/components/printable-record-shell";
import { AdminSessionButton } from "@/features/auth/components/admin-session-button";
import { getModuleAccess } from "@/features/auth/lib/authorization";
import { getOutstandingBalance } from "@/features/follow-up/lib/workflow";
import { buildNotificationTemplate } from "@/features/notifications/lib/templates";
import { PrintNoticeButton } from "@/features/notices/components/print-notice-button";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

type AdminPrintableNoticePageProps = {
  params: Promise<{
    notificationId: string;
  }>;
};

export const metadata: Metadata = {
  title: "DWDS Printable Notice",
};

function formatDate(value: Date) {
  return value.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function AdminPrintableNoticePage({
  params,
}: AdminPrintableNoticePageProps) {
  const access = await getModuleAccess("billPrint");

  if (access.status !== "authorized") {
    return <ModuleAccessStateView module="billPrint" access={access} />;
  }

  const { notificationId } = await params;

  const notification = await prisma.notificationLog.findUnique({
    where: {
      id: notificationId,
    },
    select: {
      id: true,
      channel: true,
      template: true,
      subject: true,
      message: true,
      destination: true,
      createdAt: true,
      customer: {
        select: {
          name: true,
          accountNumber: true,
          address: true,
          contactNumber: true,
        },
      },
      bill: {
        select: {
          id: true,
          billingPeriod: true,
          dueDate: true,
          totalCharges: true,
          payments: {
            where: {
              status: PaymentStatus.COMPLETED,
            },
            select: {
              amount: true,
            },
          },
        },
      },
      triggeredBy: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!notification || notification.channel !== NotificationChannel.PRINT) {
    notFound();
  }

  const outstandingBalance =
    notification.bill !== null
      ? getOutstandingBalance(notification.bill.totalCharges, notification.bill.payments)
      : undefined;

  const printable = buildNotificationTemplate(notification.template, {
    customerName: notification.customer.name,
    accountNumber: notification.customer.accountNumber,
    billingPeriod: notification.bill?.billingPeriod,
    dueDateLabel: notification.bill?.dueDate
      ? formatDate(notification.bill.dueDate)
      : undefined,
    outstandingBalanceLabel:
      outstandingBalance !== undefined
        ? new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
          }).format(outstandingBalance)
        : undefined,
    noticeDateLabel: formatDate(notification.createdAt),
  }).printable;

  const returnHref = notification.bill ? `/admin/billing/${notification.bill.id}` : "/admin/follow-up";

  return (
    <PrintableRecordShell
      eyebrow="Printable Notice"
      title="Standardized customer communication"
      description="EH10 keeps printable notices tied to live billing and service records while preserving the exact communication event in the DWDS log."
      actions={
        <>
          <PrintNoticeButton />
          <Link
            href={returnHref}
            className={cn(
              buttonVariants({
                variant: "outline",
                className:
                  "h-10 rounded-full border-white/18 bg-white/8 px-5 text-white hover:bg-white/12 hover:text-white",
              })
            )}
          >
            Back to record
          </Link>
          <Link
            href="/admin/follow-up"
            className={cn(
              buttonVariants({
                variant: "outline",
                className:
                  "h-10 rounded-full border-white/18 bg-white/8 px-5 text-white hover:bg-white/12 hover:text-white",
              })
            )}
          >
            Follow-up log
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
                      <span>{printable.eyebrow}</span>
                      <span className="hidden h-1 w-1 rounded-full bg-[#9db7b2] sm:inline-block" />
                      <span>Printable Consumer Copy</span>
                    </div>
                    <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-[#0f2f33] print:mt-1 print:text-[20px]">
                      {printable.title}
                    </h2>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-[#516764] print:hidden">
                      {printable.summary}
                    </p>
                  </div>

                  <div className="hidden min-w-[11rem] rounded-[1.3rem] border border-[#d3e4df] bg-white px-4 py-3 text-right shadow-[0_14px_34px_-28px_rgba(15,63,67,0.35)] sm:block print:block print:min-w-[8.2rem] print:border-[#d7e5e1] print:px-3 print:py-2 print:shadow-none">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b8481] print:text-[9px]">
                      Notice Ref.
                    </p>
                    <p className="mt-2 font-mono text-[11px] text-[#20484b] print:mt-1 print:text-[9px]">
                      {notification.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="mt-1 text-[10px] text-[#78908c] print:hidden">
                      Logged printable notice
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 print:gap-2">
                  <div className="rounded-[1.25rem] border border-[#dbe9e5] bg-white px-4 py-3 print:px-3 print:py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b8481]">
                      Account
                    </p>
                    <p className="mt-2 text-base font-semibold text-[#14383c] print:mt-1 print:text-sm">
                      {notification.customer.accountNumber}
                    </p>
                  </div>
                  <div className="rounded-[1.25rem] border border-[#dbe9e5] bg-white px-4 py-3 print:px-3 print:py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b8481]">
                      Notice Date
                    </p>
                    <p className="mt-2 text-base font-semibold text-[#14383c] print:mt-1 print:text-sm">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                  <div className="rounded-[1.25rem] border border-[#dbe9e5] bg-white px-4 py-3 print:px-3 print:py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b8481]">
                      Billing Period
                    </p>
                    <p className="mt-2 text-base font-semibold text-[#14383c] print:mt-1 print:text-sm">
                      {notification.bill?.billingPeriod || "Customer-level notice"}
                    </p>
                  </div>
                  <div className="rounded-[1.25rem] border border-[#dbe9e5] bg-white px-4 py-3 print:px-3 print:py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b8481]">
                      Prepared By
                    </p>
                    <p className="mt-2 text-base font-semibold text-[#14383c] print:mt-1 print:text-sm">
                      {notification.triggeredBy?.name || "DWDS staff"}
                    </p>
                  </div>
                </div>
              </div>

              <aside className="rounded-[1.75rem] border border-[#cde1db] bg-[linear-gradient(180deg,#173f43_0%,#0f3134_100%)] px-5 py-5 text-white shadow-[0_24px_54px_-36px_rgba(10,35,38,0.7)] print:px-3 print:py-3 print:shadow-none">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/64">
                  Delivery Mode
                </p>
                <p className="mt-3 text-[2rem] font-semibold tracking-[-0.06em] text-white print:mt-2 print:text-[1.3rem]">
                  Printed
                </p>

                <div className="mt-5 space-y-3 border-t border-white/12 pt-4 text-sm print:mt-3 print:space-y-1.5 print:pt-2 print:text-[11px]">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-white/66">Destination</span>
                    <span className="text-right font-medium text-white">
                      {notification.destination}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-white/66">Template</span>
                    <span className="text-right font-medium text-white">
                      {notification.template.replaceAll("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-white/66">Related due date</span>
                    <span className="text-right font-medium text-white">
                      {notification.bill?.dueDate ? formatDate(notification.bill.dueDate) : "N/A"}
                    </span>
                  </div>
                </div>
              </aside>
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-[minmax(0,1.25fr)_19rem] print:grid-cols-1">
            <div className="px-6 py-5 print:px-3 print:py-3">
              <section className="rounded-[1.4rem] border border-[#dbe9e5] bg-[#fbfdfc] px-4 py-4 print:px-3 print:py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6b8481]">
                  Consumer Details
                </p>
                <div className="mt-3 space-y-3">
                  <div>
                    <p className="text-lg font-semibold tracking-[-0.03em] text-[#16373b] print:text-base">
                      {notification.customer.name}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[#5a726f] print:text-[11px] print:leading-4">
                      {notification.customer.address}
                    </p>
                  </div>
                  <div className="grid grid-cols-[5.2rem_minmax(0,1fr)] gap-3 text-sm print:text-[11px]">
                    <span className="text-[#708784]">Contact</span>
                    <span className="font-medium text-[#17373b]">
                      {notification.customer.contactNumber || "No contact number on file"}
                    </span>
                  </div>
                </div>
              </section>

              <section className="mt-4 rounded-[1.5rem] border border-[#dbe9e5] bg-white px-4 py-4 print:mt-2 print:px-3 print:py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6b8481]">
                  Notice Body
                </p>
                <div className="mt-4 space-y-3 text-sm leading-7 text-[#334b48] print:mt-2 print:space-y-2 print:text-[11px] print:leading-5">
                  {printable.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>

              <section className="mt-4 rounded-[1.5rem] border border-[#dbe9e5] bg-[linear-gradient(180deg,#fbfdfc_0%,#f5faf8_100%)] px-4 py-4 print:mt-2 print:px-3 print:py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6b8481]">
                  Action Items
                </p>
                <ul className="mt-3 space-y-1.5 text-sm leading-6 text-[#556c69] print:mt-2 print:space-y-1 print:text-[11px] print:leading-4">
                  {printable.callouts.map((callout) => (
                    <li key={callout}>{callout}</li>
                  ))}
                </ul>
              </section>
            </div>

            <aside className="border-t border-[#dbe9e5] bg-[#f7faf9] px-6 py-5 lg:border-l lg:border-t-0 print:hidden print:px-5 print:py-4">
              <div className="rounded-[1.45rem] border border-[#dbe9e5] bg-white px-4 py-4 shadow-[0_18px_38px_-34px_rgba(15,63,67,0.28)] print:shadow-none">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6b8481]">
                  Logged Message
                </p>
                <p className="mt-4 text-sm leading-6 text-[#5b716e]">
                  {notification.message}
                </p>

                <div className="mt-4 border-t border-dashed border-[#d7e6e2] pt-4 text-sm">
                  <p className="text-[#708784]">Subject</p>
                  <p className="mt-1 font-medium text-[#16373b]">
                    {notification.subject || "DWDS Printable Notice"}
                  </p>
                </div>
              </div>
            </aside>
          </div>
      </PrintableRecordPaper>
    </PrintableRecordShell>
  );
}
