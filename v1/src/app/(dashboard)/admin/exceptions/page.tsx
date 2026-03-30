import {
  AutomationWorkerType,
  BillStatus,
  ComplaintCategory,
  ComplaintStatus,
  CustomerStatus,
  LeakReportStatus,
  PaymentStatus,
} from "@prisma/client";

import { AdminPageActions } from "@/features/admin/components/admin-page-actions";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { ModuleAccessStateView } from "@/features/admin/components/module-access-state";
import {
  getSearchParamText,
  matchesSearch,
  type SearchParamValue,
} from "@/features/admin/lib/list-filters";
import {
  canPerformCapability,
  getModuleAccess,
} from "@/features/auth/lib/authorization";
import { ExceptionSummaryPanel } from "@/features/exceptions/components/exception-summary-panel";
import { ExceptionsBoard } from "@/features/exceptions/components/exceptions-board";
import {
  buildOperationalExceptionAlerts,
  exceptionRuleCatalog,
} from "@/features/exceptions/lib/monitoring";
import { syncReceivableStatuses } from "@/features/follow-up/lib/workflow";
import { prisma } from "@/lib/prisma";

function getDaysAgo(days: number, now = new Date()) {
  return new Date(now.getTime() - days * 86_400_000);
}

function formatComplaintCategory(category: ComplaintCategory) {
  switch (category) {
    case ComplaintCategory.LEAK:
      return "Leak";
    case ComplaintCategory.NO_WATER:
      return "No water";
    case ComplaintCategory.LOW_PRESSURE:
      return "Low pressure";
    case ComplaintCategory.BILLING_DISPUTE:
      return "Billing dispute";
    case ComplaintCategory.METER_DAMAGE:
      return "Meter damage";
    default:
      return "Other";
  }
}

function formatLeakReportStatus(status: LeakReportStatus) {
  switch (status) {
    case LeakReportStatus.INVESTIGATING:
      return "Investigating";
    case LeakReportStatus.RESOLVED:
      return "Resolved";
    case LeakReportStatus.CLOSED_NO_LEAK:
      return "Closed, no leak";
    default:
      return "Open";
  }
}

type AdminExceptionsPageProps = {
  searchParams: Promise<Record<string, SearchParamValue>>;
};

export default async function AdminExceptionsPage({
  searchParams,
}: AdminExceptionsPageProps) {
  const access = await getModuleAccess("exceptions");

  if (access.status !== "authorized") {
    return <ModuleAccessStateView module="exceptions" access={access} />;
  }

  const now = new Date();
  await syncReceivableStatuses(now);

  const [
    meters,
    disconnectionRiskBills,
    recentPayments,
    statusMismatchReadings,
    technicians,
    openComplaints,
    fieldWorkOrders,
    replacementMeters,
    leakReports,
    repairHistory,
    meterReplacementHistory,
  ] =
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
      prisma.user.findMany({
        where: {
          isActive: true,
          role: "TECHNICIAN",
        },
        orderBy: [{ name: "asc" }],
        select: {
          id: true,
          name: true,
        },
      }),
      prisma.complaint.findMany({
        where: {
          status: ComplaintStatus.OPEN,
        },
        orderBy: [{ reportedAt: "desc" }],
        select: {
          id: true,
          summary: true,
          category: true,
          reportedAt: true,
          customer: {
            select: {
              name: true,
            },
          },
          meter: {
            select: {
              meterNumber: true,
            },
          },
          serviceRoute: {
            select: {
              code: true,
              name: true,
            },
          },
          serviceZone: {
            select: {
              name: true,
            },
          },
          workOrders: {
            where: {
              status: {
                in: ["OPEN", "ASSIGNED", "IN_PROGRESS"],
              },
            },
            select: {
              id: true,
            },
          },
        },
      }),
      prisma.fieldWorkOrder.findMany({
        orderBy: [
          { status: "asc" },
          { priority: "desc" },
          { createdAt: "desc" },
        ],
        take: 12,
        select: {
          id: true,
          title: true,
          detail: true,
          priority: true,
          status: true,
          scheduledFor: true,
          acknowledgedAt: true,
          completedAt: true,
          resolutionNotes: true,
          complaint: {
            select: {
              id: true,
              summary: true,
              customerId: true,
              meterId: true,
              serviceZoneId: true,
              serviceRouteId: true,
              customer: {
                select: {
                  name: true,
                },
              },
              meter: {
                select: {
                  meterNumber: true,
                },
              },
              serviceRoute: {
                select: {
                  code: true,
                  name: true,
                },
              },
              serviceZone: {
                select: {
                  name: true,
                },
              },
            },
          },
          createdBy: {
            select: {
              name: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
            },
          },
          meterReplacementHistory: {
            select: {
              replacementDate: true,
              finalReading: true,
              replacementMeter: {
                select: {
                  meterNumber: true,
                },
              },
            },
          },
          fieldProofs: {
            orderBy: [{ createdAt: "desc" }],
            select: {
              id: true,
              originalFilename: true,
              contentType: true,
              fileSizeBytes: true,
              createdAt: true,
              uploadedBy: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.meter.findMany({
        where: {
          status: "ACTIVE",
        },
        orderBy: [{ meterNumber: "asc" }],
        select: {
          id: true,
          meterNumber: true,
          customerId: true,
          serviceZoneId: true,
          serviceRouteId: true,
        },
      }),
      prisma.leakReport.findMany({
        orderBy: [{ createdAt: "desc" }],
        take: 8,
        select: {
          id: true,
          summary: true,
          detail: true,
          status: true,
          resolvedAt: true,
          resolutionNotes: true,
          customer: {
            select: {
              name: true,
            },
          },
          meter: {
            select: {
              meterNumber: true,
            },
          },
          serviceRoute: {
            select: {
              code: true,
              name: true,
            },
          },
          serviceZone: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.repairHistory.findMany({
        orderBy: [{ completedAt: "desc" }],
        take: 8,
        select: {
          id: true,
          repairSummary: true,
          repairDetail: true,
          completedAt: true,
          customer: {
            select: {
              name: true,
            },
          },
          meter: {
            select: {
              meterNumber: true,
            },
          },
          serviceRoute: {
            select: {
              code: true,
              name: true,
            },
          },
          serviceZone: {
            select: {
              name: true,
            },
          },
          recordedBy: {
            select: {
              name: true,
            },
          },
          workOrder: {
            select: {
              fieldProofs: {
                orderBy: [{ createdAt: "desc" }],
                select: {
                  id: true,
                  originalFilename: true,
                  contentType: true,
                  fileSizeBytes: true,
                  createdAt: true,
                  uploadedBy: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.meterReplacementHistory.findMany({
        orderBy: [{ replacementDate: "desc" }],
        take: 8,
        select: {
          id: true,
          replacementDate: true,
          finalReading: true,
          reason: true,
          customer: {
            select: {
              name: true,
            },
          },
          replacedMeter: {
            select: {
              meterNumber: true,
            },
          },
          replacementMeter: {
            select: {
              meterNumber: true,
            },
          },
          serviceRoute: {
            select: {
              code: true,
              name: true,
            },
          },
          serviceZone: {
            select: {
              name: true,
            },
          },
          recordedBy: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

  const latestSummaryRun = await prisma.automationRun.findFirst({
    where: {
      workerType: "EXCEPTION_SUMMARIZATION" as AutomationWorkerType,
    },
    orderBy: [{ startedAt: "desc" }],
    select: {
      id: true,
      status: true,
      startedAt: true,
      completedAt: true,
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
          dismissedAt: true,
          dismissedBy: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  const alerts = buildOperationalExceptionAlerts({
    meters,
    disconnectionRiskBills,
    recentPayments,
    statusMismatchReadings,
    now,
  });
  const filters = await searchParams;
  const query = getSearchParamText(filters.query);
  const severity = getSearchParamText(filters.severity) as
    | "ALL"
    | "CRITICAL"
    | "HIGH"
    | "MEDIUM";
  const filteredAlerts = alerts.filter((alert) => {
    const matchesSeverity =
      !severity || severity === "ALL"
        ? true
        : alert.severity.toUpperCase() === severity;

    return (
      matchesSeverity &&
      matchesSearch(
        [
          alert.title,
          alert.summary,
          alert.metric,
          alert.accountNumber,
          alert.customerName,
          alert.meterNumber,
          alert.category.replaceAll("_", " "),
          alert.severity,
        ],
        query
      )
    );
  });

  const criticalCount = alerts.filter((alert) => alert.severity === "critical").length;
  const highCount = alerts.filter((alert) => alert.severity === "high").length;
  const meterScopedCount = new Set(
    alerts
      .map((alert) => alert.meterNumber)
      .filter((meterNumber): meterNumber is string => Boolean(meterNumber))
  ).size;
  const canDispatch = canPerformCapability(access.user.role, "exceptions:dispatch");
  const canUpdateWorkOrders = canPerformCapability(access.user.role, "workorders:update");
  const alertById = new Map(alerts.map((alert) => [alert.id, alert]));
  const summaryRun = latestSummaryRun
    ? {
        id: latestSummaryRun.id,
        status: latestSummaryRun.status,
        startedAtLabel: latestSummaryRun.startedAt.toLocaleString("en-PH"),
        completedAtLabel: latestSummaryRun.completedAt
          ? latestSummaryRun.completedAt.toLocaleString("en-PH")
          : null,
        proposalCount: latestSummaryRun.proposalCount,
        failureReason: latestSummaryRun.failureReason,
        triggeredByName: latestSummaryRun.triggeredBy.name,
        triggeredByRole: latestSummaryRun.triggeredBy.role.replaceAll("_", " "),
      }
    : null;
  const summaryProposals = latestSummaryRun
    ? latestSummaryRun.proposals.map((proposal) => {
        const alert = alertById.get(proposal.targetId);

        return {
          id: proposal.id,
          rank: proposal.rank,
          summary: proposal.summary,
          recommendedReviewStep: proposal.recommendedReviewStep,
          rationale: proposal.rationale,
          confidenceLabel: proposal.confidenceLabel,
          targetId: proposal.targetId,
          alertTitle: alert?.title ?? "Unavailable alert",
          category: alert?.category ?? "service_status_mismatch",
          severity: alert?.severity ?? "medium",
          customerName: alert?.customerName ?? null,
          accountNumber: alert?.accountNumber ?? null,
          meterNumber: alert?.meterNumber ?? null,
          metric: alert?.metric ?? "Unknown metric",
          href: alert?.href ?? "/admin/exceptions",
          dismissedAtLabel: proposal.dismissedAt
            ? proposal.dismissedAt.toLocaleString("en-PH")
            : null,
          dismissedByName: proposal.dismissedBy?.name ?? null,
        };
      })
    : [];

  return (
    <AdminPageShell
      eyebrow="Operational Exceptions"
      title="Catch reading, receivable, payment, and service anomalies before they become field disputes."
      description="Scan live DWDS records for missing readings, suspicious consumption changes, duplicate cashier posting patterns, disconnection risks, and office-versus-field status mismatches."
      actions={
        <AdminPageActions
          links={[
            { href: "/admin/readings", label: "Reading module" },
            { href: "/admin/follow-up", label: "Follow-up workflow" },
          ]}
        />
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
      <ExceptionSummaryPanel run={summaryRun} proposals={summaryProposals} />
      <ExceptionsBoard
        alerts={filteredAlerts}
        totalCount={alerts.length}
        query={query}
        severity={severity || "ALL"}
        rules={exceptionRuleCatalog}
        currentUserId={access.user.id}
        canDispatch={canDispatch}
        canUpdateWorkOrders={canUpdateWorkOrders}
        technicians={technicians}
        replacementMeters={replacementMeters}
        openComplaints={openComplaints
          .filter((complaint) => complaint.workOrders.length === 0)
          .map((complaint) => ({
            id: complaint.id,
            summary: complaint.summary,
            categoryLabel: formatComplaintCategory(complaint.category),
            routeLabel: `${complaint.serviceRoute.code} - ${complaint.serviceRoute.name} (${complaint.serviceZone.name})`,
            reportedAt: complaint.reportedAt,
            customerName: complaint.customer?.name ?? null,
            meterNumber: complaint.meter?.meterNumber ?? null,
          }))}
        workOrders={fieldWorkOrders.map((workOrder) => ({
          id: workOrder.id,
          title: workOrder.title,
          detail: workOrder.detail,
          priority: workOrder.priority,
          status: workOrder.status,
          scheduledFor: workOrder.scheduledFor,
          acknowledgedAt: workOrder.acknowledgedAt,
          completedAt: workOrder.completedAt,
          resolutionNotes: workOrder.resolutionNotes,
          complaint: {
            id: workOrder.complaint.id,
            summary: workOrder.complaint.summary,
            customerId: workOrder.complaint.customerId,
            meterId: workOrder.complaint.meterId,
            serviceZoneId: workOrder.complaint.serviceZoneId,
            serviceRouteId: workOrder.complaint.serviceRouteId,
            routeLabel: `${workOrder.complaint.serviceRoute.code} - ${workOrder.complaint.serviceRoute.name} (${workOrder.complaint.serviceZone.name})`,
            customerName: workOrder.complaint.customer?.name ?? null,
            meterNumber: workOrder.complaint.meter?.meterNumber ?? null,
          },
          createdBy: workOrder.createdBy,
          assignedTo: workOrder.assignedTo,
          meterReplacementHistory: workOrder.meterReplacementHistory
            ? {
                replacementDate: workOrder.meterReplacementHistory.replacementDate,
                finalReading: workOrder.meterReplacementHistory.finalReading,
                replacementMeterNumber:
                  workOrder.meterReplacementHistory.replacementMeter.meterNumber,
              }
            : null,
          fieldProofs: workOrder.fieldProofs.map((proof) => ({
            id: proof.id,
            originalFilename: proof.originalFilename,
            contentType: proof.contentType,
            fileSizeBytes: proof.fileSizeBytes,
            createdAt: proof.createdAt,
            uploadedByName: proof.uploadedBy.name,
          })),
        }))}
        leakReports={leakReports.map((report) => ({
          id: report.id,
          summary: report.summary,
          detail: report.detail,
          status: report.status,
          statusLabel: formatLeakReportStatus(report.status),
          routeLabel: `${report.serviceRoute.code} - ${report.serviceRoute.name} (${report.serviceZone.name})`,
          customerName: report.customer?.name ?? null,
          meterNumber: report.meter?.meterNumber ?? null,
          resolvedAt: report.resolvedAt,
          resolutionNotes: report.resolutionNotes,
        }))}
        repairHistory={repairHistory.map((entry) => ({
          id: entry.id,
          repairSummary: entry.repairSummary,
          repairDetail: entry.repairDetail,
          completedAt: entry.completedAt,
          routeLabel: `${entry.serviceRoute.code} - ${entry.serviceRoute.name} (${entry.serviceZone.name})`,
          customerName: entry.customer?.name ?? null,
          meterNumber: entry.meter?.meterNumber ?? null,
          recordedByName: entry.recordedBy.name,
          fieldProofs: entry.workOrder.fieldProofs.map((proof) => ({
            id: proof.id,
            originalFilename: proof.originalFilename,
            contentType: proof.contentType,
            fileSizeBytes: proof.fileSizeBytes,
            createdAt: proof.createdAt,
            uploadedByName: proof.uploadedBy.name,
          })),
        }))}
        meterReplacementHistory={meterReplacementHistory.map((entry) => ({
          id: entry.id,
          replacementDate: entry.replacementDate,
          finalReading: entry.finalReading,
          reason: entry.reason,
          customerName: entry.customer?.name ?? null,
          replacedMeterNumber: entry.replacedMeter.meterNumber,
          replacementMeterNumber: entry.replacementMeter.meterNumber,
          routeLabel: `${entry.serviceRoute.code} - ${entry.serviceRoute.name} (${entry.serviceZone.name})`,
          recordedByName: entry.recordedBy.name,
        }))}
      />
    </AdminPageShell>
  );
}
