import { BillStatus } from "@prisma/client";

import { AdminPageActions } from "@/features/admin/components/admin-page-actions";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import {
  getSearchParamText,
  matchesSearch,
  type SearchParamValue,
} from "@/features/admin/lib/list-filters";
import { ModuleAccessStateView } from "@/features/admin/components/module-access-state";
import { getModuleAccess } from "@/features/auth/lib/authorization";
import { syncReceivableStatuses } from "@/features/follow-up/lib/workflow";
import { PaymentForm } from "@/features/payments/components/payment-form";
import { PaymentHistoryList } from "@/features/payments/components/payment-history-list";
import { TelegramCashierPanel } from "@/features/payments/components/telegram-cashier-panel";
import { prisma } from "@/lib/prisma";

type PaymentsPageProps = {
  searchParams: Promise<Record<string, SearchParamValue>>;
};

export default async function AdminPaymentsPage({ searchParams }: PaymentsPageProps) {
  const access = await getModuleAccess("payments");

  if (access.status !== "authorized") {
    return <ModuleAccessStateView module="payments" access={access} />;
  }

  await syncReceivableStatuses();

  const [openBills, payments, telegramLink, telegramSessions] = await Promise.all([
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
    prisma.telegramStaffIdentity.findUnique({
      where: {
        userId: access.user.id,
      },
      select: {
        telegramUserId: true,
        telegramChatId: true,
        telegramUsername: true,
        isActive: true,
        lastSeenAt: true,
      },
    }),
    prisma.telegramCashierSession.findMany({
      orderBy: [{ createdAt: "desc" }],
      take: 6,
      select: {
        id: true,
        status: true,
        stage: true,
        lastInboundText: true,
        lastBotReply: true,
        createdAt: true,
        completedAt: true,
        staffIdentity: {
          select: {
            telegramUserId: true,
            telegramUsername: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        completedPayment: {
          select: {
            id: true,
            receiptNumber: true,
            amount: true,
          },
        },
        approvalRequestId: true,
      },
    }),
  ]);

  const telegramApprovalRequests = telegramSessions.some((session) => session.approvalRequestId)
    ? await prisma.automationApprovalRequest.findMany({
        where: {
          id: {
            in: telegramSessions
              .map((session) => session.approvalRequestId)
              .filter((value): value is string => Boolean(value)),
          },
        },
        select: {
          id: true,
          status: true,
        },
      })
    : [];
  const approvalStatusById = new Map(
    telegramApprovalRequests.map((request) => [request.id, request.status])
  );

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
  const filters = await searchParams;
  const historyQuery = getSearchParamText(filters.historyQuery);
  const historyBillStatus = getSearchParamText(filters.historyBillStatus) as
    | "ALL"
    | BillStatus;
  const filteredPayments = payments.filter((payment) => {
    const matchesBillStatus =
      !historyBillStatus || historyBillStatus === "ALL"
        ? true
        : payment.bill.status === historyBillStatus;

    return (
      matchesBillStatus &&
      matchesSearch(
        [
          payment.receiptNumber,
          payment.bill.customer.name,
          payment.bill.customer.accountNumber,
          payment.bill.billingPeriod,
          payment.referenceId,
          payment.recordedBy.name,
        ],
        historyQuery
      )
    );
  });

  return (
    <AdminPageShell
      eyebrow="Cashier Posting"
      title="Post utility payments against live receivables and keep recent settlement activity within reach."
      description="Select an open bill, accept full or partial settlement, issue an official receipt, and review the latest cashier transactions together with the bill status they affected."
      actions={
        <AdminPageActions
          links={[
            { href: "/admin/collections", label: "Reporting workspace" },
            { href: "/admin/follow-up", label: "Follow-up workflow" },
            { href: "/admin/billing", label: "Billing module" },
          ]}
        />
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
        <PaymentHistoryList
          payments={filteredPayments}
          totalCount={payments.length}
          query={historyQuery}
          billStatus={historyBillStatus || "ALL"}
        />
      </section>
      <TelegramCashierPanel
        currentLink={
          telegramLink
            ? {
                telegramUserId: telegramLink.telegramUserId,
                telegramChatId: telegramLink.telegramChatId,
                telegramUsername: telegramLink.telegramUsername,
                isActive: telegramLink.isActive,
                lastSeenAt: telegramLink.lastSeenAt?.toLocaleString() ?? null,
              }
            : null
        }
        recentSessions={telegramSessions.map((session) => ({
          id: session.id,
          status: session.status,
          stage: session.stage,
          lastInboundText: session.lastInboundText,
          lastBotReply: session.lastBotReply,
          createdAt: session.createdAt.toLocaleString(),
          completedAt: session.completedAt?.toLocaleString() ?? null,
          approvalStatus: session.approvalRequestId
            ? approvalStatusById.get(session.approvalRequestId) ?? null
            : null,
          cashierName: session.staffIdentity.user.name,
          telegramUserId: session.staffIdentity.telegramUserId,
          telegramUsername: session.staffIdentity.telegramUsername,
          payment: session.completedPayment,
        }))}
      />
    </AdminPageShell>
  );
}
