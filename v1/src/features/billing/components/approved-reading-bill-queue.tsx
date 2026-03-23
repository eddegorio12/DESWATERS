import { GenerateBillButton } from "@/features/billing/components/generate-bill-button";
import { formatCurrency } from "@/features/billing/lib/billing-calculations";

type ApprovedReadingBillQueueProps = {
  activeTariff: {
    name: string;
    minimumCharge: number;
    minimumUsage: number;
  } | null;
  readings: {
    id: string;
    readingDate: Date;
    consumption: number;
    previousReading: number;
    currentReading: number;
    meter: {
      meterNumber: string;
      customer: {
        accountNumber: string;
        name: string;
      } | null;
    };
  }[];
};

export function ApprovedReadingBillQueue({
  activeTariff,
  readings,
}: ApprovedReadingBillQueueProps) {
  return (
    <section className="rounded-3xl border border-border bg-background p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Step 3.3
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Approved readings ready for billing
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Generate bills manually from approved readings. Bills use the active tariff and
            create unpaid accounts receivable records.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm">
          {activeTariff ? (
            <div className="space-y-1">
              <p className="font-medium text-foreground">{activeTariff.name}</p>
              <p className="text-muted-foreground">
                Base {formatCurrency(activeTariff.minimumCharge)} for up to{" "}
                {activeTariff.minimumUsage} cu.m
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">No active tariff found.</p>
          )}
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-left">
            <thead className="bg-muted/50">
              <tr className="text-sm text-muted-foreground">
                <th className="px-4 py-3 font-medium">Meter</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Previous</th>
                <th className="px-4 py-3 font-medium">Current</th>
                <th className="px-4 py-3 font-medium">Consumption</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background">
              {readings.length ? (
                readings.map((reading) => (
                  <tr key={reading.id} className="align-top text-sm">
                    <td className="px-4 py-4">
                      <div className="font-mono text-xs text-muted-foreground">
                        {reading.meter.meterNumber}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {reading.readingDate.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {reading.meter.customer ? (
                        <div>
                          <div className="font-medium text-foreground">
                            {reading.meter.customer.name}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {reading.meter.customer.accountNumber}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No customer linked</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {reading.previousReading}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{reading.currentReading}</td>
                    <td className="px-4 py-4 font-medium text-foreground">
                      {reading.consumption}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <GenerateBillButton readingId={reading.id} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    No approved readings are waiting for bill generation.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
