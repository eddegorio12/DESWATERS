import { TariffAuditEventType } from "@prisma/client";

import { StatusPill } from "@/features/admin/components/status-pill";

type TariffListProps = {
  tariffs: {
    id: string;
    name: string;
    isActive: boolean;
    version: number;
    effectiveFrom: Date;
    effectiveTo: Date | null;
    changeReason: string | null;
    minimumCharge: number;
    minimumUsage: number;
    installationFee: number;
    penaltyRate: number;
    reconnectionFee: number;
    createdAt: Date;
    createdBy: {
      name: string;
    } | null;
    auditEvents: {
      id: string;
      type: TariffAuditEventType;
      note: string | null;
      createdAt: Date;
      actor: {
        name: string;
      } | null;
    }[];
    tiers: {
      id: string;
      minVolume: number;
      maxVolume: number | null;
      ratePerCuM: number;
    }[];
  }[];
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
  }).format(value);
}

export function TariffList({ tariffs }: TariffListProps) {
  const now = new Date();

  return (
    <section className="rounded-[1.9rem] border border-[#dbe9e5] bg-white/92 p-6 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.55)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Tariff Registry
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Saved billing configurations
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {tariffs.length} tariff{tariffs.length === 1 ? "" : "s"} configured
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {tariffs.length ? (
          tariffs.map((tariff) => (
            <article
              key={tariff.id}
              className="rounded-[1.5rem] border border-[#dbe9e5] bg-[linear-gradient(180deg,#fbfdfc,#f4f8f7)] p-5 shadow-[0_18px_40px_-38px_rgba(16,63,67,0.4)]"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold text-foreground">{tariff.name}</h3>
                    <StatusPill
                      priority={
                        tariff.effectiveFrom <= now &&
                        (!tariff.effectiveTo || tariff.effectiveTo >= now)
                          ? "ready"
                          : tariff.effectiveFrom > now
                            ? "pending"
                            : "readonly"
                      }
                    >
                      {tariff.effectiveFrom <= now &&
                      (!tariff.effectiveTo || tariff.effectiveTo >= now)
                        ? "Currently effective"
                        : tariff.effectiveFrom > now
                          ? "Scheduled"
                          : "Retired"}
                    </StatusPill>
                    <StatusPill priority="readonly">
                      Version {tariff.version}
                    </StatusPill>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Effective {formatDate(tariff.effectiveFrom)}
                    {tariff.effectiveTo ? ` to ${formatDate(tariff.effectiveTo)}` : " onward"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Saved {tariff.createdAt.toLocaleDateString()} by {tariff.createdBy?.name ?? "Unknown staff"}
                  </p>
                </div>

                <dl className="grid gap-3 text-sm sm:grid-cols-5">
                  <div className="rounded-[1.2rem] bg-white px-4 py-3">
                    <dt className="text-muted-foreground">Minimum charge</dt>
                    <dd className="mt-1 font-semibold text-foreground">
                      {formatCurrency(tariff.minimumCharge)}
                    </dd>
                  </div>
                  <div className="rounded-[1.2rem] bg-white px-4 py-3">
                    <dt className="text-muted-foreground">Minimum usage</dt>
                    <dd className="mt-1 font-semibold text-foreground">
                      {tariff.minimumUsage} cu.m
                    </dd>
                  </div>
                  <div className="rounded-[1.2rem] bg-white px-4 py-3">
                    <dt className="text-muted-foreground">Installation fee</dt>
                    <dd className="mt-1 font-semibold text-foreground">
                      {formatCurrency(tariff.installationFee)}
                    </dd>
                  </div>
                  <div className="rounded-[1.2rem] bg-white px-4 py-3">
                    <dt className="text-muted-foreground">Penalty rate</dt>
                    <dd className="mt-1 font-semibold text-foreground">
                      {(tariff.penaltyRate * 100).toFixed(2)}%
                    </dd>
                  </div>
                  <div className="rounded-[1.2rem] bg-white px-4 py-3">
                    <dt className="text-muted-foreground">Reconnection fee</dt>
                    <dd className="mt-1 font-semibold text-foreground">
                      {formatCurrency(tariff.reconnectionFee)}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="mt-4 rounded-[1.2rem] border border-[#dbe9e5] bg-white px-4 py-3 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Change reason:</span>{" "}
                {tariff.changeReason ?? "No change note recorded."}
              </div>

              <div className="mt-5 overflow-hidden rounded-[1.4rem] border border-[#dbe9e5]">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border text-left">
                    <thead className="bg-secondary/55">
                      <tr className="text-sm text-muted-foreground">
                        <th className="px-4 py-3 font-medium">Tier</th>
                        <th className="px-4 py-3 font-medium">Usage band</th>
                        <th className="px-4 py-3 font-medium">Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-background">
                      {tariff.tiers.map((tier, index) => (
                        <tr key={tier.id} className="text-sm">
                          <td className="px-4 py-4 font-medium text-foreground">
                            Tier {index + 1}
                          </td>
                          <td className="px-4 py-4 text-muted-foreground">
                            {tier.minVolume} - {tier.maxVolume ?? "Above"} cu.m
                          </td>
                          <td className="px-4 py-4 text-muted-foreground">
                            {formatCurrency(tier.ratePerCuM)} / cu.m
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-5 rounded-[1.4rem] border border-[#dbe9e5] bg-white p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Audit trail
                </p>
                <div className="mt-4 grid gap-3">
                  {tariff.auditEvents.length ? (
                    tariff.auditEvents.map((event) => (
                      <article
                        key={event.id}
                        className="rounded-[1rem] border border-border/80 bg-secondary/20 px-4 py-3 text-sm"
                      >
                        <p className="font-medium text-foreground">
                          {event.type === TariffAuditEventType.CREATED
                            ? "Version recorded"
                            : "Previous version retired"}
                        </p>
                        <p className="mt-1 text-muted-foreground">
                          {event.note ?? "No audit note recorded."}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDate(event.createdAt)} by {event.actor?.name ?? "Unknown staff"}
                        </p>
                      </article>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Tariff audit events will appear here after the next version change.
                    </p>
                  )}
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
            No tariffs are saved yet. Create the first tariff on this page to enable billing and future version tracking.
          </div>
        )}
      </div>
    </section>
  );
}
