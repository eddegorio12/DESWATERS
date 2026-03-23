import type { ReadingStatus } from "@prisma/client";

import { DeleteReadingButton } from "@/features/readings/components/delete-reading-button";

type ReadingListProps = {
  readings: {
    id: string;
    readingDate: Date;
    previousReading: number;
    currentReading: number;
    consumption: number;
    status: ReadingStatus;
    meter: {
      meterNumber: string;
      customer: {
        accountNumber: string;
        name: string;
      } | null;
    };
    reader: {
      name: string;
    };
  }[];
};

export function ReadingList({ readings }: ReadingListProps) {
  return (
    <section className="rounded-3xl border border-border bg-background p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Reading History
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Recent encoding activity
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {readings.length} reading{readings.length === 1 ? "" : "s"} recorded
        </p>
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
                <th className="px-4 py-3 font-medium">Reader</th>
                <th className="px-4 py-3 font-medium">Status</th>
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
                    <td className="px-4 py-4 text-muted-foreground">{reading.reader.name}</td>
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                        {reading.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      {reading.status === "PENDING_REVIEW" ? (
                        <DeleteReadingButton readingId={reading.id} />
                      ) : (
                        <span className="text-xs text-muted-foreground">Locked</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    No readings have been recorded yet.
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
