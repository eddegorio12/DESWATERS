import { BillStatus, PaymentStatus } from "@prisma/client";

import { AdminPageActions } from "@/features/admin/components/admin-page-actions";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import {
  getSearchParamText,
  matchesSearch,
  type SearchParamValue,
} from "@/features/admin/lib/list-filters";
import { ModuleAccessStateView } from "@/features/admin/components/module-access-state";
import { getModuleAccess } from "@/features/auth/lib/authorization";
import { FollowUpBoard } from "@/features/follow-up/components/follow-up-board";
import {
  getDaysPastDue,
  getOutstandingBalance,
  syncReceivableStatuses,
} from "@/features/follow-up/lib/workflow";
import { NotificationLogList } from "@/features/notifications/components/notification-log-list";
import { prisma } from "@/lib/prisma";

type AdminFollowUpPageProps = {
  searchParams: Promise<Record<string, SearchParamValue>>;
};

export default async function AdminFollowUpPage({
  searchParams,
}: AdminFollowUpPageProps) {
  const access = await getModuleAccess("followUp");

  if (access.status !== "authorized") {
    return <ModuleAccessStateView module="followUp" access={access} />;
  }

  await syncReceivableStatuses();
  const searchParamValues = await searchParams;
  const query = getSearchParamText(searchParamValues.query);
  const focus = getSearchParamText(searchParamValues.focus) as
    | "ALL"
    | "NEEDS_REMINDER"
    | "NEEDS_FINAL_NOTICE"
    | "READY_FOR_DISCONNECTION"
    | "DISCONNECTED_HOLD"
    | "MONITORING";

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

  const serviceActions = customers
    .map((customer) => ({
      id: customer.id,
      accountNumber: customer.accountNumber,
      name: customer.name,
      status: customer.status,
      totalOutstanding: customer.totalOutstanding,
      overdueBalance: customer.overdueBalance,
      canDisconnect: customer.canDisconnect,
      canReinstate: customer.canReinstate,
      statusNote: customer.statusNote,
      highestDaysPastDue: customer.bills.reduce(
        (max, bill) => Math.max(max, bill.daysPastDue),
        0
      ),
      escalatedBillCount: customer.bills.filter(
        (bill) =>
          bill.status === BillStatus.OVERDUE &&
          (bill.followUpStatus === "FINAL_NOTICE_SENT" ||
            bill.followUpStatus === "DISCONNECTION_REVIEW")
      ).length,
    }))
    .filter((customer) => customer.canDisconnect || customer.canReinstate)
    .sort((left, right) => {
      if (left.canDisconnect !== right.canDisconnect) {
        return left.canDisconnect ? -1 : 1;
      }

      return right.overdueBalance - left.overdueBalance;
    });

  const queue = customers
    .flatMap((customer) =>
      customer.bills.map((bill) => {
        const queueFocus: Exclude<
          Parameters<typeof FollowUpBoard>[0]["focus"],
          "ALL"
        > =
          customer.status === "DISCONNECTED"
            ? "DISCONNECTED_HOLD"
            : bill.status === BillStatus.OVERDUE &&
                bill.followUpStatus === "CURRENT"
              ? "NEEDS_REMINDER"
              : bill.status === BillStatus.OVERDUE &&
                  bill.followUpStatus === "REMINDER_SENT"
                ? "NEEDS_FINAL_NOTICE"
                : bill.status === BillStatus.OVERDUE &&
                    (bill.followUpStatus === "FINAL_NOTICE_SENT" ||
                      bill.followUpStatus === "DISCONNECTION_REVIEW")
                  ? "READY_FOR_DISCONNECTION"
                  : "MONITORING";
        const priority =
          queueFocus === "READY_FOR_DISCONNECTION"
            ? 0
            : queueFocus === "NEEDS_FINAL_NOTICE"
              ? 1
              : queueFocus === "NEEDS_REMINDER"
                ? 2
                : queueFocus === "DISCONNECTED_HOLD"
                  ? 3
                  : 4;

        return {
          ...bill,
          customerId: customer.id,
          customerName: customer.name,
          accountNumber: customer.accountNumber,
          customerStatus: customer.status,
          customerStatusNote: customer.statusNote,
          queueFocus,
          priority,
        };
      })
    )
    .sort((left, right) => {
      if (left.priority !== right.priority) {
        return left.priority - right.priority;
      }

      if (left.daysPastDue !== right.daysPastDue) {
        return right.daysPastDue - left.daysPastDue;
      }

      return right.outstandingBalance - left.outstandingBalance;
    });

  const filteredQueue = queue.filter((bill) => {
    const matchesFocus = !focus || focus === "ALL" ? true : bill.queueFocus === focus;

    return (
      matchesFocus &&
      matchesSearch(
        [
          bill.id,
          bill.billingPeriod,
          bill.meterNumber,
          bill.customerName,
          bill.accountNumber,
          bill.followUpStatus.replaceAll("_", " "),
          bill.queueFocus.replaceAll("_", " "),
        ],
        query
      )
    );
  });

  const disconnectedCount = customers.filter((customer) => customer.status === "DISCONNECTED").length;
  const overdueCustomerCount = customers.filter((customer) => customer.overdueBalance > 0).length;
  const totalOutstanding = customers.reduce((sum, customer) => sum + customer.totalOutstanding, 0);

  return (
    <AdminPageShell
      eyebrow="Receivables Follow-up"
      title="Move overdue balances through reminder, escalation, disconnection, and reinstatement states."
      description="Turn overdue balances into a staffed workflow with explicit escalation actions, customer service-status control, and server-enforced reinstatement rules."
      actions={
        <AdminPageActions
          links={[
            { href: "/admin/collections", label: "Reporting workspace" },
            { href: "/admin/billing", label: "Billing module" },
          ]}
        />
      }
      stats={[
        {
          label: "Action-ready",
          value: serviceActions.filter((customer) => customer.canDisconnect).length.toString(),
          detail: "Customers already at final notice or disconnection review",
          accent: "rose",
        },
        {
          label: "Disconnected",
          value: disconnectedCount.toString(),
          detail: "Customer accounts currently under service hold or reinstatement review",
          accent: "amber",
        },
        {
          label: "Outstanding",
          value: new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
            maximumFractionDigits: 0,
          }).format(totalOutstanding),
          detail: `${overdueCustomerCount} overdue customer${overdueCustomerCount === 1 ? "" : "s"} still in scope`,
          accent: "sky",
        },
      ]}
    >
      <FollowUpBoard
        queue={filteredQueue}
        totalCount={queue.length}
        query={query}
        focus={focus || "ALL"}
        serviceActions={serviceActions}
      />
      <NotificationLogList notifications={notifications} />
    </AdminPageShell>
  );
}
