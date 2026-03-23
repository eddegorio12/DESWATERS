type TariffListProps = {
  tariffs: {
    id: string;
    name: string;
    isActive: boolean;
    minimumCharge: number;
    minimumUsage: number;
    installationFee: number;
    createdAt: Date;
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

export function TariffList({ tariffs }: TariffListProps) {
  return (
    <section className="rounded-3xl border border-border bg-background p-6 shadow-sm">
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
            <article key={tariff.id} className="rounded-2xl border border-border p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold text-foreground">{tariff.name}</h3>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                        tariff.isActive
                          ? "bg-primary/10 text-primary"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {tariff.isActive ? "Active computing tariff" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Saved {tariff.createdAt.toLocaleDateString()}
                  </p>
                </div>

                <dl className="grid gap-3 text-sm sm:grid-cols-3">
                  <div className="rounded-2xl bg-muted/40 px-4 py-3">
                    <dt className="text-muted-foreground">Minimum charge</dt>
                    <dd className="mt-1 font-semibold text-foreground">
                      {formatCurrency(tariff.minimumCharge)}
                    </dd>
                  </div>
                  <div className="rounded-2xl bg-muted/40 px-4 py-3">
                    <dt className="text-muted-foreground">Minimum usage</dt>
                    <dd className="mt-1 font-semibold text-foreground">
                      {tariff.minimumUsage} cu.m
                    </dd>
                  </div>
                  <div className="rounded-2xl bg-muted/40 px-4 py-3">
                    <dt className="text-muted-foreground">Installation fee</dt>
                    <dd className="mt-1 font-semibold text-foreground">
                      {formatCurrency(tariff.installationFee)}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="mt-5 overflow-hidden rounded-2xl border border-border">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border text-left">
                    <thead className="bg-muted/50">
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
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
            No tariffs yet. Create the first tariff on this page to configure billing.
          </div>
        )}
      </div>
    </section>
  );
}
