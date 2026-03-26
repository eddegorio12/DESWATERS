import Link from "next/link";

import {
  BillStatus,
  CustomerStatus,
  PaymentStatus,
} from "@prisma/client";

import { buttonVariants } from "@/components/ui/button-variants";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { ModuleAccessStateView } from "@/features/admin/components/module-access-state";
import { AdminSessionButton } from "@/features/auth/components/admin-session-button";
import { getModuleAccess } from "@/features/auth/lib/authorization";
import { ExceptionsBoard } from "@/features/exceptions/components/exceptions-board";
import {
  buildOperationalExceptionAlerts,
  exceptionRuleCatalog,
} from "@/features/exceptions/lib/monitoring";
import { syncReceivableStatuses } from "@/features/follow-up/lib/workflow";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

function getDaysAgo(days: number, now = new Date()) {
  return new Date(now.getTime() - days * 86_400_000);
}

export default async function AdminExceptionsPage() {
  const access = await getModuleAccess("exceptions");

  if (access.status !== "authorized") {
    return <ModuleAccessStateView module="exceptions" access={access} />;
  }

  const now = new Date();
  await syncReceivableStatuses(now);

  const [meters, disconnectionRiskBills, recentPayments, statusMismatchReadings] =
    await Promise.all([
      prisma.meter.findMany({
        where: {
          status: "ACTIVE",
        },
        orderBy: [{ meterNumber: "asc" }],
        select: {
          id: true,
          meterNumber: true,
          installDate: true,
          customer: {
            select: {
              accountNumber: true,
              name: true,
              status: true,
            },
          },
          readings: {
            orderBy: [{ readingDate: "desc" }],
            take: 4,
            select: {
              id: true,
              readingDate: true,
              consumption: true,
              status: true,
            },
          },
        },
      }),
      prisma.bill.findMany({
        where: {
          status: {
            in: [BillStatus.UNPAID, BillStatus.PARTIALLY_PAID, BillStatus.OVERDUE],
          },
          followUpStatus: {
            in: ["FINAL_NOTICE_SENT", "DISCONNECTION_REVIEW"],
          },
        },
        orderBy: [{ dueDate: "asc" }],
        select: {
          id: true,
          billingPeriod: true,
          dueDate: true,
          totalCharges: true,
          followUpStatus: true,
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
              status: PaymentStatus.COMPLETED,
            },
            select: {
              amount: true,
            },
          },
        },
      }),
      prisma.payment.findMany({
        where: {
          status: PaymentStatus.COMPLETED,
          paymentDate: {
            gte: getDaysAgo(45, now),
          },
        },
        orderBy: [{ paymentDate: "desc" }],
        select: {
          id: true,
          amount: true,
          paymentDate: true,
          method: true,
          referenceId: true,
          billId: true,
          bill: {
            select: {
              billingPeriod: true,
              customer: {
                select: {
                  id: true,
                  accountNumber: true,
                  name: true,
                  status: true,
                },
              },
            },
          },
        },
      }),
      prisma.reading.findMany({
        where: {
          readingDate: {
            gte: getDaysAgo(45, now),
          },
          meter: {
            customer: {
              status: {
                in: [CustomerStatus.INACTIVE, CustomerStatus.DISCONNECTED],
              },
            },
          },
        },
        orderBy: [{ readingDate: "desc" }],
        select: {
          id: true,
          readingDate: true,
          consumption: true,
          status: true,
          meter: {
            select: {
              meterNumber: true,
              customer: {
                select: {
                  accountNumber: true,
                  name: true,
                  status: true,
                },
              },
            },
          },
        },
      }),
    ]);

  const alerts = buildOperationalExceptionAlerts({
    meters,
    disconnectionRiskBills,
    recentPayments,
    statusMismatchReadings,
    now,
  });

  const criticalCount = alerts.filter((alert) => alert.severity === "critical").length;
  const highCount = alerts.filter((alert) => alert.severity === "high").length;
  const meterScopedCount = new Set(
    alerts
      .map((alert) => alert.meterNumber)
      .filter((meterNumber): meterNumber is string => Boolean(meterNumber))
  ).size;

  return (
    <AdminPageShell
      eyebrow="Operational Exceptions"
      title="Catch reading, receivable, payment, and service anomalies before they become field disputes."
      description="EH9 starts with a dedicated exceptions workspace that scans live DWDS records for missing readings, suspicious consumption changes, duplicate cashier posting patterns, disconnection risks, and office-versus-field status mismatches."
      actions={
        <>
          <Link
            href="/admin/readings"
            className={cn(
              buttonVariants({
                variant: "outline",
                className:
                  "h-10 rounded-full border-white/18 bg-white/8 px-5 text-white hover:bg-white/12 hover:text-white",
              })
            )}
          >
            Reading module
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
            Follow-up workflow
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
          label: "Critical alerts",
          value: criticalCount.toString(),
          detail: "Issues that likely need immediate review or field coordination",
          accent: "rose",
        },
        {
          label: "High alerts",
          value: highCount.toString(),
          detail: "Operational risks that should move before the next billing cycle slips",
          accent: "amber",
        },
        {
          label: "Affected meters",
          value: meterScopedCount.toString(),
          detail: "Distinct meter numbers referenced by the current alert set",
          accent: "sky",
        },
      ]}
    >
      <ExceptionsBoard alerts={alerts} rules={exceptionRuleCatalog} />
    </AdminPageShell>
  );
}
