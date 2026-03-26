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
    holderTransfers: {
      id: string;
      effectiveDate: Date;
      transferReading: number | null;
      reason: string | null;
      fromCustomer: {
        accountNumber: string;
        name: string;
      } | null;
      toCustomer: {
        accountNumber: string;
        name: string;
      };
    }[];
  }[];
};

export function MeterList({ meters }: MeterListProps) {
  return (
    <section className="rounded-[1.9rem] border border-[#dbe9e5] bg-white/92 p-6 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.55)]">
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

      <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-[#dbe9e5] shadow-[0_18px_40px_-38px_rgba(16,63,67,0.45)]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-left">
            <thead className="bg-secondary/55">
              <tr className="text-sm text-muted-foreground">
                <th className="px-4 py-3 font-medium">Meter</th>
                <th className="px-4 py-3 font-medium">Install date</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Holder history</th>
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
                    <td className="px-4 py-4 text-xs text-muted-foreground">
                      {meter.holderTransfers.length ? (
                        <div className="space-y-3">
                          {meter.holderTransfers.map((transfer) => (
                            <div
                              key={transfer.id}
                              className="rounded-2xl border border-border/70 bg-secondary/20 px-3 py-2"
                            >
                              <div className="font-medium text-foreground">
                                {transfer.fromCustomer
                                  ? `${transfer.fromCustomer.name} -> ${transfer.toCustomer.name}`
                                  : `Initial assignment -> ${transfer.toCustomer.name}`}
                              </div>
                              <div className="mt-1">
                                {transfer.effectiveDate.toLocaleDateString()}
                                {transfer.transferReading !== null
                                  ? ` • Reading ${transfer.transferReading}`
                                  : ""}
                              </div>
                              <div className="mt-1">
                                {transfer.fromCustomer
                                  ? `${transfer.fromCustomer.accountNumber} -> ${transfer.toCustomer.accountNumber}`
                                  : transfer.toCustomer.accountNumber}
                              </div>
                              {transfer.reason ? (
                                <div className="mt-1 text-muted-foreground">{transfer.reason}</div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No holder history yet</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
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
