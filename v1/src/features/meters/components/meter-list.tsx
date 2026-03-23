import type { MeterStatus } from "@prisma/client";

type MeterListProps = {
  meters: {
    id: string;
    meterNumber: string;
    installDate: Date;
    status: MeterStatus;
    customer: {
      accountNumber: string;
      name: string;
    } | null;
  }[];
};

export function MeterList({ meters }: MeterListProps) {
  return (
    <section className="rounded-3xl border border-border bg-background p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Meter Registry
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Registered service meters
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {meters.length} meter{meters.length === 1 ? "" : "s"} recorded
        </p>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-left">
            <thead className="bg-muted/50">
              <tr className="text-sm text-muted-foreground">
                <th className="px-4 py-3 font-medium">Meter</th>
                <th className="px-4 py-3 font-medium">Install date</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background">
              {meters.length ? (
                meters.map((meter) => (
                  <tr key={meter.id} className="align-top text-sm">
                    <td className="px-4 py-4 font-mono text-xs text-muted-foreground">
                      {meter.meterNumber}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {meter.installDate.toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      {meter.customer ? (
                        <div>
                          <div className="font-medium text-foreground">{meter.customer.name}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {meter.customer.accountNumber}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                        {meter.status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    No meters yet. Register the first service meter with the form on this page.
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
