import Link from "next/link";

import { BillStatus, PaymentStatus } from "@prisma/client";

import { buttonVariants } from "@/components/ui/button-variants";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { ModuleAccessStateView } from "@/features/admin/components/module-access-state";
import { AdminSessionButton } from "@/features/auth/components/admin-session-button";
import { getModuleAccess } from "@/features/auth/lib/authorization";
import { FollowUpBoard } from "@/features/follow-up/components/follow-up-board";
import {
  getDaysPastDue,
  getOutstandingBalance,
  syncReceivableStatuses,
} from "@/features/follow-up/lib/workflow";
import { NotificationLogList } from "@/features/notifications/components/notification-log-list";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export default async function AdminFollowUpPage() {
  const access = await getModuleAccess("followUp");

  if (access.status !== "authorized") {
    return <ModuleAccessStateView module="followUp" access={access} />;
  }

  await syncReceivableStatuses();

  const [bills, notifications] = await Promise.all([
    prisma.bill.findMany({
      where: {
        status: {
          in: [BillStatus.UNPAID, BillStatus.PARTIALLY_PAID, BillStatus.OVERDUE],
        },
      },
      orderBy: [{ dueDate: "asc" }],
      select: {
        id: true,
        billingPeriod: true,
        dueDate: true,
        totalCharges: true,
        status: true,
        followUpStatus: true,
        followUpNote: true,
        customer: {
          select: {
            id: true,
            accountNumber: true,
            name: true,
            status: true,
            statusNote: true,
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
            status: PaymentStatus.COMPLETED,
          },
          select: {
            amount: true,
          },
        },
      },
    }),
    prisma.notificationLog.findMany({
      orderBy: [{ createdAt: "desc" }],
      take: 20,
      select: {
        id: true,
        channel: true,
        template: true,
        status: true,
        provider: true,
        destination: true,
        errorMessage: true,
        createdAt: true,
        customer: {
          select: {
            accountNumber: true,
            name: true,
          },
        },
        bill: {
          select: {
            billingPeriod: true,
          },
        },
      },
    }),
  ]);

  const customerMap = new Map<
    string,
    {
      id: string;
      accountNumber: string;
      name: string;
      status: (typeof bills)[number]["customer"]["status"];
      statusNote: string | null;
      totalOutstanding: number;
      overdueBalance: number;
      canDisconnect: boolean;
      canReinstate: boolean;
      hasOpenOverdue: boolean;
      bills: {
        id: string;
        billingPeriod: string;
        meterNumber: string;
        dueDate: string;
        paidAmount: number;
        outstandingBalance: number;
        status: (typeof bills)[number]["status"];
        followUpStatus: (typeof bills)[number]["followUpStatus"];
        followUpNote: string | null;
        daysPastDue: number;
      }[];
    }
  >();

  for (const bill of bills) {
    const outstandingBalance = getOutstandingBalance(bill.totalCharges, bill.payments);

    if (outstandingBalance <= 0) {
      continue;
    }

    const paidAmount = Math.max(0, bill.totalCharges - outstandingBalance);
    const customerEntry = customerMap.get(bill.customer.id) ?? {
      id: bill.customer.id,
      accountNumber: bill.customer.accountNumber,
      name: bill.customer.name,
      status: bill.customer.status,
      statusNote: bill.customer.statusNote,
      totalOutstanding: 0,
      overdueBalance: 0,
      canDisconnect: false,
      canReinstate: false,
      hasOpenOverdue: false,
      bills: [],
    };

    customerEntry.totalOutstanding += outstandingBalance;

    if (bill.status === BillStatus.OVERDUE) {
      customerEntry.overdueBalance += outstandingBalance;
      customerEntry.hasOpenOverdue = true;
    }

    if (
      bill.status === BillStatus.OVERDUE &&
      (bill.followUpStatus === "FINAL_NOTICE_SENT" ||
        bill.followUpStatus === "DISCONNECTION_REVIEW")
    ) {
      customerEntry.canDisconnect = true;
    }

    customerEntry.bills.push({
      id: bill.id,
      billingPeriod: bill.billingPeriod,
      meterNumber: bill.reading.meter.meterNumber,
      dueDate: bill.dueDate.toLocaleDateString("en-PH"),
      paidAmount,
      outstandingBalance,
      status: bill.status,
      followUpStatus: bill.followUpStatus,
      followUpNote: bill.followUpNote,
      daysPastDue: getDaysPastDue(bill.dueDate),
    });

    customerMap.set(bill.customer.id, customerEntry);
  }

  const customers = Array.from(customerMap.values())
    .map((customer) => ({
      ...customer,
      totalOutstanding: Math.round(customer.totalOutstanding * 100) / 100,
      overdueBalance: Math.round(customer.overdueBalance * 100) / 100,
      canDisconnect: customer.canDisconnect && customer.status !== "DISCONNECTED",
      canReinstate: customer.status === "DISCONNECTED" && !customer.hasOpenOverdue,
      bills: customer.bills.sort((left, right) => right.daysPastDue - left.daysPastDue),
    }))
    .sort((left, right) => right.overdueBalance - left.overdueBalance);

  const disconnectedCount = customers.filter((customer) => customer.status === "DISCONNECTED").length;
  const overdueCustomerCount = customers.filter((customer) => customer.overdueBalance > 0).length;
  const totalOutstanding = customers.reduce((sum, customer) => sum + customer.totalOutstanding, 0);

  return (
    <AdminPageShell
      eyebrow="Receivables Follow-up"
      title="Move overdue balances through reminder, escalation, disconnection, and reinstatement states."
      description="EH5 turns printed overdue language into an operational workflow with explicit staff actions, customer service-status control, and server-enforced reinstatement rules."
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
          <AdminSessionButton />
        </>
      }
      stats={[
        {
          label: "Overdue customers",
          value: overdueCustomerCount.toString(),
          detail: "Accounts with balances already past due",
          accent: "rose",
        },
        {
          label: "Disconnected",
          value: disconnectedCount.toString(),
          detail: "Customer accounts currently under service hold",
          accent: "amber",
        },
        {
          label: "Outstanding",
          value: new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
            maximumFractionDigits: 0,
          }).format(totalOutstanding),
          detail: "Open receivables visible inside the EH5 workflow",
          accent: "sky",
        },
      ]}
    >
      <FollowUpBoard customers={customers} />
      <NotificationLogList notifications={notifications} />
    </AdminPageShell>
  );
}
