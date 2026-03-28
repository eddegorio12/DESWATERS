import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import {
  AdminSurfaceHeader,
  AdminSurfacePanel,
} from "@/features/admin/components/admin-surface-panel";
import { RecordListSection } from "@/features/admin/components/record-list-section";
import { StatusPill } from "@/features/admin/components/status-pill";
import { FieldServiceBoard } from "@/features/exceptions/components/field-service-board";
import type {
  ExceptionAlert,
  ExceptionRuleCard,
  ExceptionSeverity,
} from "@/features/exceptions/lib/monitoring";
import { cn } from "@/lib/utils";

const severityMeta: Record<
  ExceptionSeverity,
  {
    label: string;
    countPriority: "overdue" | "attention" | "pending";
  }
> = {
  critical: {
    label: "Critical",
    countPriority: "overdue",
  },
  high: {
    label: "High",
    countPriority: "attention",
  },
  medium: {
    label: "Medium",
    countPriority: "pending",
  },
};

const categoryLabels: Record<ExceptionAlert["category"], string> = {
  missing_reading: "Missing reading",
  possible_leak: "Possible leak",
  abnormal_consumption: "Consumption anomaly",
  duplicate_payment: "Duplicate payment",
  nearing_disconnection: "Nearing disconnection",
  service_status_mismatch: "Status mismatch",
};

export function ExceptionsBoard({
  alerts,
  totalCount,
  query,
  severity,
  rules,
  openComplaints,
  technicians,
  replacementMeters,
  workOrders,
  leakReports,
  repairHistory,
  meterReplacementHistory,
  canDispatch,
  canUpdateWorkOrders,
  currentUserId,
}: {
  alerts: ExceptionAlert[];
  totalCount: number;
  query: string;
  severity: "ALL" | "CRITICAL" | "HIGH" | "MEDIUM";
  rules: ExceptionRuleCard[];
  openComplaints: {
    id: string;
    summary: string;
    categoryLabel: string;
    routeLabel: string;
    reportedAt: Date;
    customerName: string | null;
    meterNumber: string | null;
  }[];
  technicians: {
    id: string;
    name: string;
  }[];
  replacementMeters: {
    id: string;
    meterNumber: string;
    customerId: string | null;
    serviceZoneId: string | null;
    serviceRouteId: string | null;
  }[];
  workOrders: {
    id: string;
    title: string;
    detail: string | null;
    priority: import("@prisma/client").WorkOrderPriority;
    status: import("@prisma/client").WorkOrderStatus;
    scheduledFor: Date | null;
    acknowledgedAt: Date | null;
    completedAt: Date | null;
    resolutionNotes: string | null;
    complaint: {
      id: string;
      summary: string;
      customerId: string | null;
      meterId: string | null;
      serviceZoneId: string;
      serviceRouteId: string;
      routeLabel: string;
      customerName: string | null;
      meterNumber: string | null;
    };
    createdBy: {
      name: string;
    };
    assignedTo: {
      id: string;
      name: string;
    } | null;
    meterReplacementHistory: {
      replacementDate: Date;
      finalReading: number | null;
      replacementMeterNumber: string;
    } | null;
    fieldProofs: {
      id: string;
      originalFilename: string;
      contentType: string;
      fileSizeBytes: number;
      createdAt: Date;
      uploadedByName: string;
    }[];
  }[];
  leakReports: {
    id: string;
    summary: string;
    detail: string | null;
    status: import("@prisma/client").LeakReportStatus;
    statusLabel: string;
    routeLabel: string;
    customerName: string | null;
    meterNumber: string | null;
    resolvedAt: Date | null;
    resolutionNotes: string | null;
  }[];
  repairHistory: {
    id: string;
    repairSummary: string;
    repairDetail: string | null;
    completedAt: Date;
    routeLabel: string;
    customerName: string | null;
    meterNumber: string | null;
    recordedByName: string;
    fieldProofs: {
      id: string;
      originalFilename: string;
      contentType: string;
      fileSizeBytes: number;
      createdAt: Date;
      uploadedByName: string;
    }[];
  }[];
  meterReplacementHistory: {
    id: string;
    replacementDate: Date;
    finalReading: number | null;
    reason: string | null;
    customerName: string | null;
    replacedMeterNumber: string;
    replacementMeterNumber: string;
    routeLabel: string;
    recordedByName: string;
  }[];
  canDispatch: boolean;
  canUpdateWorkOrders: boolean;
  currentUserId: string;
}) {
  const hasActiveFilters = Boolean(query || severity !== "ALL");
  const resultsText = hasActiveFilters
    ? `Showing ${alerts.length} of ${totalCount} alert${totalCount === 1 ? "" : "s"}`
    : `${alerts.length} alert${alerts.length === 1 ? "" : "s"} currently flagged`;
  const counts = {
    critical: alerts.filter((alert) => alert.severity === "critical").length,
    high: alerts.filter((alert) => alert.severity === "high").length,
    medium: alerts.filter((alert) => alert.severity === "medium").length,
  };

  return (
    <>
      <AdminSurfacePanel>
        <AdminSurfaceHeader
          eyebrow="Detection Policy"
          title="Review server-defined exception rules without losing scan speed."
          description="Alerts still derive directly from live billing, payment, customer, meter, and reading records. Search, severity filters, and linked module actions help staff move from detection to resolution faster."
        />

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="overflow-hidden rounded-[1.4rem] border border-border/70 bg-white/76">
            <div className="divide-y divide-border/70">
              {rules.map((rule) => (
                <article key={rule.id} className="px-5 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-primary">
                        {rule.label}
                      </span>
                      <p className="mt-3 text-sm font-semibold text-foreground">{rule.threshold}</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {rule.rationale}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.4rem] border border-border/70 bg-white/76">
            <div className="border-b border-border/70 px-5 py-4">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/72">
                Severity Mix
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Keep the review order visible before opening the alert queue.
              </p>
            </div>
            <div className="divide-y divide-border/70">
              {(["critical", "high", "medium"] as const).map((band) => (
                <article key={band} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {severityMeta[band].label}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {band === "critical"
                          ? "Immediate review or field coordination likely needed."
                          : band === "high"
                            ? "Should move before the next billing or field cycle slips."
                            : "Keep visible so lower-severity anomalies do not age into larger issues."}
                      </p>
                    </div>
                    <StatusPill priority={severityMeta[band].countPriority}>
                      {counts[band]} alert{counts[band] === 1 ? "" : "s"}
                    </StatusPill>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </AdminSurfacePanel>

      <RecordListSection
        eyebrow="Alert Queue"
        title="Operational exceptions needing review"
        description="Search by alert type, customer, account, meter, or metric, then narrow by severity to separate immediate risks from lower-priority review work."
        resultsText={resultsText}
        searchName="query"
        searchValue={query}
        searchPlaceholder="Search alert, customer, account, meter, or metric"
        filterName="severity"
        filterValue={severity}
        filterLabel="Alert severity"
        filterOptions={[
          { label: "All severities", value: "ALL" },
          { label: "Critical", value: "CRITICAL" },
          { label: "High", value: "HIGH" },
          { label: "Medium", value: "MEDIUM" },
        ]}
        helperText="Filter by severity first, then drill into the affected account, meter, or billing record."
        nextStep="Next: open the linked module from the alert row to resolve the underlying record instead of handling the alert in isolation."
        resetHref="/admin/exceptions"
        hasActiveFilters={hasActiveFilters}
      >
        <div className="grid gap-4">
          {alerts.length ? (
            alerts.map((alert) => {
              const meta = severityMeta[alert.severity];

              return (
                <article
                  key={alert.id}
                  className="rounded-[1.5rem] border border-[#dbe9e5] bg-white/92 p-5 shadow-[0_18px_40px_-38px_rgba(16,63,67,0.3)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill priority={meta.countPriority}>{meta.label}</StatusPill>
                      <StatusPill priority="ready">{categoryLabels[alert.category]}</StatusPill>
                      <span className="text-sm font-medium text-muted-foreground">
                        {alert.metric}
                      </span>
                    </div>
                    <Link
                      href={alert.href}
                      className={cn(
                        buttonVariants({
                          variant: "outline",
                          size: "sm",
                          className: "rounded-xl px-3",
                        })
                      )}
                    >
                      Open module
                    </Link>
                  </div>

                  <h3 className="mt-4 text-lg font-semibold text-foreground">{alert.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{alert.summary}</p>

                  <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
                    {alert.customerName ? <span>{alert.customerName}</span> : null}
                    {alert.accountNumber ? <span>{alert.accountNumber}</span> : null}
                    {alert.meterNumber ? <span>Meter {alert.meterNumber}</span> : null}
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-[1.5rem] border border-[#dbe9e5] bg-background px-4 py-10 text-center text-sm text-muted-foreground">
              {hasActiveFilters
                ? "No exception alerts match the current search or severity filter."
                : "No exception alerts are currently active."}
            </div>
          )}
        </div>
      </RecordListSection>

      <FieldServiceBoard
        openComplaints={openComplaints}
        technicians={technicians}
        replacementMeters={replacementMeters}
        workOrders={workOrders}
        leakReports={leakReports}
        repairHistory={repairHistory}
        meterReplacementHistory={meterReplacementHistory}
        canDispatch={canDispatch}
        canUpdateWorkOrders={canUpdateWorkOrders}
        currentUserId={currentUserId}
      />
    </>
  );
}
