import type { ReadingStatus } from "@prisma/client";

import {
  AdminSurfaceHeader,
  AdminSurfacePanel,
} from "@/features/admin/components/admin-surface-panel";
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
    <AdminSurfacePanel>
      <AdminSurfaceHeader
        eyebrow="Reading History"
        title="Recent encoding activity"
        aside={`${readings.length} reading${readings.length === 1 ? "" : "s"} recorded`}
      />

      <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-border/70">
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
    </AdminSurfacePanel>
  );
}
