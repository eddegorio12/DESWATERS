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
import { FollowUpTriagePanel } from "@/features/follow-up/components/follow-up-triage-panel";
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

type FollowUpCustomerEntry = {
  id: string;
  accountNumber: string;
  name: string;
  status: "ACTIVE" | "INACTIVE" | "DISCONNECTED";
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
    status: "UNPAID" | "PARTIALLY_PAID" | "PAID" | "OVERDUE";
    followUpStatus:
      | "CURRENT"
      | "REMINDER_SENT"
      | "FINAL_NOTICE_SENT"
      | "DISCONNECTION_REVIEW"
      | "DISCONNECTED"
      | "RESOLVED";
    followUpNote: string | null;
    daysPastDue: number;
  }[];
};

function getOpenClawFailureReason(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const rawReason = (value as { openClawFailureReason?: unknown }).openClawFailureReason;
  return typeof rawReason === "string" && rawReason.length > 0 ? rawReason : null;
}

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

  const [bills, notifications, latestTriageRun] = await Promise.all([
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
    prisma.automationRun.findFirst({
      where: {
        workerType: "FOLLOW_UP_TRIAGE",
      },
      orderBy: [{ startedAt: "desc" }],
      select: {
        id: true,
        status: true,
        startedAt: true,
        completedAt: true,
        provider: true,
        model: true,
        proposalCount: true,
        failureReason: true,
        triggeredBy: {
          select: {
            name: true,
            role: true,
          },
        },
        proposals: {
          orderBy: [{ rank: "asc" }],
          select: {
            id: true,
            rank: true,
            summary: true,
            recommendedReviewStep: true,
            rationale: true,
            confidenceLabel: true,
            targetId: true,
            sourceMetadata: true,
            dismissedAt: true,
            dismissedBy: {
              select: {
                name: true,
              },
            },
            actionIntents: {
              orderBy: [{ createdAt: "desc" }],
              take: 1,
              select: {
                actionType: true,
                approvalRequests: {
                  orderBy: [{ createdAt: "desc" }],
                  take: 1,
                  select: {
                    id: true,
                    status: true,
                    transport: true,
                    deliveryError: true,
                    requestedAt: true,
                    expiresAt: true,
                    decidedAt: true,
                    decidedByLabel: true,
                    executedAt: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  const customerMap = new Map<string, FollowUpCustomerEntry>();

  for (const bill of bills) {
    const outstandingBalance = getOutstandingBalance(bill.totalCharges, bill.payments);

    if (outstandingBalance <= 0) {
      continue;
    }

    const paidAmount = Math.max(0, bill.totalCharges - outstandingBalance);
    const customerEntry: FollowUpCustomerEntry = customerMap.get(bill.customer.id) ?? {
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

  const queueByBillId = new Map(
    queue.map((bill) => [
      bill.id,
      {
        customerName: bill.customerName,
        accountNumber: bill.accountNumber,
        billingPeriod: bill.billingPeriod,
        followUpStatus: bill.followUpStatus,
        queueFocus: bill.queueFocus,
        daysPastDue: bill.daysPastDue,
        outstandingBalance: bill.outstandingBalance,
      },
    ])
  );

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

  const triageRun = latestTriageRun
    ? {
        id: latestTriageRun.id,
        status: latestTriageRun.status,
        startedAtLabel: latestTriageRun.startedAt.toLocaleString("en-PH"),
        completedAtLabel: latestTriageRun.completedAt
          ? latestTriageRun.completedAt.toLocaleString("en-PH")
          : null,
        provider: latestTriageRun.provider,
        model: latestTriageRun.model,
        proposalCount: latestTriageRun.proposalCount,
        failureReason: latestTriageRun.failureReason,
        triggeredByName: latestTriageRun.triggeredBy.name,
        triggeredByRole: latestTriageRun.triggeredBy.role.replaceAll("_", " "),
      }
    : null;

  const triageProposals = latestTriageRun
    ? latestTriageRun.proposals.map((proposal: (typeof latestTriageRun.proposals)[number]) => {
        const queueEntry = queueByBillId.get(proposal.targetId);
        const approvalEligible =
          (queueEntry?.queueFocus === "NEEDS_REMINDER" &&
            queueEntry.followUpStatus === "CURRENT") ||
          (queueEntry?.queueFocus === "NEEDS_FINAL_NOTICE" &&
            queueEntry.followUpStatus === "REMINDER_SENT") ||
          (queueEntry?.queueFocus === "READY_FOR_DISCONNECTION" &&
            queueEntry.followUpStatus === "FINAL_NOTICE_SENT");

        return {
          id: proposal.id,
          rank: proposal.rank,
          summary: proposal.summary,
          recommendedReviewStep: proposal.recommendedReviewStep,
          rationale: proposal.rationale,
          confidenceLabel: proposal.confidenceLabel,
          targetId: proposal.targetId,
          customerName: queueEntry?.customerName ?? "Unavailable bill",
          accountNumber: queueEntry?.accountNumber ?? "Unavailable account",
          billingPeriod: queueEntry?.billingPeriod ?? "Unknown period",
          followUpStatus: queueEntry?.followUpStatus ?? "CURRENT",
          queueFocus: queueEntry?.queueFocus ?? "MONITORING",
          daysPastDue: queueEntry?.daysPastDue ?? 0,
          outstandingBalanceLabel: new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
          }).format(queueEntry?.outstandingBalance ?? 0),
          openClawFailureReason:
            latestTriageRun.provider === "DWDS_INTERNAL"
              ? getOpenClawFailureReason(proposal.sourceMetadata)
              : null,
          approvalEligible,
          dismissedAtLabel: proposal.dismissedAt
            ? proposal.dismissedAt.toLocaleString("en-PH")
            : null,
          dismissedByName: proposal.dismissedBy?.name ?? null,
          approval:
            proposal.actionIntents[0]?.approvalRequests[0] !== undefined
              ? {
                  requestId: proposal.actionIntents[0].approvalRequests[0].id,
                  actionType: proposal.actionIntents[0].actionType,
                  status: proposal.actionIntents[0].approvalRequests[0].status,
                  transport: proposal.actionIntents[0].approvalRequests[0].transport,
                  deliveryError: proposal.actionIntents[0].approvalRequests[0].deliveryError,
                  requestedAtLabel:
                    proposal.actionIntents[0].approvalRequests[0].requestedAt.toLocaleString("en-PH"),
                  expiresAtLabel:
                    proposal.actionIntents[0].approvalRequests[0].expiresAt.toLocaleString("en-PH"),
                  decidedAtLabel: proposal.actionIntents[0].approvalRequests[0].decidedAt
                    ? proposal.actionIntents[0].approvalRequests[0].decidedAt.toLocaleString("en-PH")
                    : null,
                  decidedByLabel:
                    proposal.actionIntents[0].approvalRequests[0].decidedByLabel ?? null,
                  executedAtLabel: proposal.actionIntents[0].approvalRequests[0].executedAt
                    ? proposal.actionIntents[0].approvalRequests[0].executedAt.toLocaleString("en-PH")
                    : null,
                }
              : null,
        };
      })
    : [];

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
      <FollowUpTriagePanel run={triageRun} proposals={triageProposals} />
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
