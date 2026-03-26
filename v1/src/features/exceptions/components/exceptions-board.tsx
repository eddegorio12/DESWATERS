import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import { RecordListSection } from "@/features/admin/components/record-list-section";
import { StatusPill } from "@/features/admin/components/status-pill";
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
}: {
  alerts: ExceptionAlert[];
  totalCount: number;
  query: string;
  severity: "ALL" | "CRITICAL" | "HIGH" | "MEDIUM";
  rules: ExceptionRuleCard[];
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
      <section className="rounded-[1.9rem] border border-[#dbe9e5] bg-white/92 p-6 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.55)]">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/72">
            Detection Policy
          </p>
          <h2 className="mt-3 font-heading text-3xl text-foreground">
            Review server-defined exception rules without losing scan speed.
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Alerts still derive directly from live billing, payment, customer, meter, and
            reading records. Search, severity filters, and linked module actions help staff
            move from detection to resolution faster.
          </p>
        </div>

        <div className="mt-8 grid gap-4 xl:grid-cols-2">
          {rules.map((rule) => (
            <article
              key={rule.id}
              className="rounded-[1.5rem] border border-border/80 bg-secondary/35 p-5"
            >
              <span className="rounded-full bg-primary/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-primary">
                {rule.label}
              </span>
              <p className="mt-4 text-sm font-semibold text-foreground">{rule.threshold}</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{rule.rationale}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {(["critical", "high", "medium"] as const).map((band) => (
          <article
            key={band}
            className="rounded-[1.6rem] border border-[#dbe9e5] bg-white/92 p-5 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.45)]"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {severityMeta[band].label}
              </p>
              <StatusPill priority={severityMeta[band].countPriority}>
                {counts[band]} alert{counts[band] === 1 ? "" : "s"}
              </StatusPill>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {band === "critical"
                ? "Immediate review or field coordination likely needed."
                : band === "high"
                  ? "Should move before the next billing or field cycle slips."
                  : "Keep visible so lower-severity anomalies do not age into larger issues."}
            </p>
          </article>
        ))}
      </div>

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
    </>
  );
}
