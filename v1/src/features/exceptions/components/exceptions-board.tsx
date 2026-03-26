import Link from "next/link";

import type {
  ExceptionAlert,
  ExceptionRuleCard,
  ExceptionSeverity,
} from "@/features/exceptions/lib/monitoring";

const severityMeta: Record<
  ExceptionSeverity,
  {
    label: string;
    containerClassName: string;
    badgeClassName: string;
  }
> = {
  critical: {
    label: "Critical",
    containerClassName: "border-[#f0b7b0] bg-[#fff4f2]",
    badgeClassName: "bg-[#f8d4cf] text-[#8a2f28]",
  },
  high: {
    label: "High",
    containerClassName: "border-[#f4dcc0] bg-[#fff9f0]",
    badgeClassName: "bg-[#f8e6c8] text-[#7a4f11]",
  },
  medium: {
    label: "Medium",
    containerClassName: "border-[#dbe9e5] bg-white/92",
    badgeClassName: "bg-[#dff4ef] text-[#17525a]",
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

function groupAlertsBySeverity(alerts: ExceptionAlert[]) {
  return {
    critical: alerts.filter((alert) => alert.severity === "critical"),
    high: alerts.filter((alert) => alert.severity === "high"),
    medium: alerts.filter((alert) => alert.severity === "medium"),
  } satisfies Record<ExceptionSeverity, ExceptionAlert[]>;
}

export function ExceptionsBoard({
  alerts,
  rules,
}: {
  alerts: ExceptionAlert[];
  rules: ExceptionRuleCard[];
}) {
  const groupedAlerts = groupAlertsBySeverity(alerts);

  return (
    <>
      <section className="dwds-panel p-6">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/72">
            Detection Policy
          </p>
          <h2 className="mt-3 font-heading text-3xl text-foreground">
            EH9 now starts with server-defined exception rules and severity.
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            This first EH9 slice is intentionally schema-light. It uses live billing,
            payment, customer, meter, and reading records to surface anomalies before we
            add complaint tickets and technician work orders.
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

      <section className="grid gap-6">
        {(["critical", "high", "medium"] as const).map((severity) => {
          const alertsForSeverity = groupedAlerts[severity];
          const meta = severityMeta[severity];

          return (
            <article
              key={severity}
              className={`rounded-[1.9rem] border p-6 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.3)] ${meta.containerClassName}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/72">
                    {meta.label} severity
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                    {alertsForSeverity.length
                      ? `${alertsForSeverity.length} ${meta.label.toLowerCase()} alert${alertsForSeverity.length === 1 ? "" : "s"}`
                      : `No ${meta.label.toLowerCase()} alerts`}
                  </h2>
                </div>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] ${meta.badgeClassName}`}
                >
                  {meta.label}
                </span>
              </div>

              {alertsForSeverity.length ? (
                <div className="mt-6 grid gap-4">
                  {alertsForSeverity.map((alert) => (
                    <article
                      key={alert.id}
                      className="rounded-[1.5rem] border border-black/6 bg-white/85 p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-primary/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-primary">
                            {categoryLabels[alert.category]}
                          </span>
                          <span className="text-sm font-medium text-muted-foreground">
                            {alert.metric}
                          </span>
                        </div>
                        <Link
                          href={alert.href}
                          className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
                        >
                          Open module
                        </Link>
                      </div>

                      <h3 className="mt-4 text-lg font-semibold text-foreground">
                        {alert.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {alert.summary}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
                        {alert.customerName ? <span>{alert.customerName}</span> : null}
                        {alert.accountNumber ? <span>{alert.accountNumber}</span> : null}
                        {alert.meterNumber ? <span>Meter {alert.meterNumber}</span> : null}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mt-6 text-sm leading-6 text-muted-foreground">
                  The current dataset does not produce any alerts in this severity band.
                </p>
              )}
            </article>
          );
        })}
      </section>
    </>
  );
}
