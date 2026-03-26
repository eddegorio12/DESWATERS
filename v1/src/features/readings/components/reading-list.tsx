import type { ReadingStatus } from "@prisma/client";

import { StatusPill } from "@/features/admin/components/status-pill";
import { DeleteReadingButton } from "@/features/readings/components/delete-reading-button";

function getReadingStatusPriority(status: ReadingStatus) {
  if (status === "PENDING_REVIEW") {
    return "pending" as const;
  }

  if (status === "APPROVED") {
    return "success" as const;
  }

  return "readonly" as const;
}

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
      id: string;
      name: string;
    };
  }[];
  canDeleteAny: boolean;
  canDeleteOwn: boolean;
  currentUserId: string;
};

export function ReadingList({
  readings,
  canDeleteAny,
  canDeleteOwn,
  currentUserId,
}: ReadingListProps) {
  return (
    <section className="rounded-[1.9rem] border border-[#dbe9e5] bg-white/92 p-6 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.55)]">
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

      <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-[#dbe9e5] shadow-[0_18px_40px_-38px_rgba(16,63,67,0.45)]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-left">
            <thead className="bg-secondary/55">
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
                readings.map((reading) => {
                  const canDeleteReading =
                    reading.status === "PENDING_REVIEW" &&
                    (canDeleteAny || (canDeleteOwn && reading.reader.id === currentUserId));

                  return (
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
                        <StatusPill priority={getReadingStatusPriority(reading.status)}>
                          {reading.status.replace("_", " ")}
                        </StatusPill>
                      </td>
                      <td className="px-4 py-4 text-right">
                        {canDeleteReading ? (
                          <DeleteReadingButton readingId={reading.id} />
                        ) : (
                          <span className="text-xs text-muted-foreground">Locked</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    No readings are recorded yet. Encode the first meter reading above to start approval and billing handoff.
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
