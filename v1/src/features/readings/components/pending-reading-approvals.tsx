"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ApproveReadingButton } from "@/features/readings/components/approve-reading-button";
import { DeleteReadingButton } from "@/features/readings/components/delete-reading-button";
import { approveReadings } from "@/features/readings/actions";

const checkboxClassName =
  "size-4 rounded border border-input text-primary shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30";

type PendingReadingApprovalsProps = {
  readings: {
    id: string;
    readingDate: Date;
    previousReading: number;
    currentReading: number;
    consumption: number;
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

export function PendingReadingApprovals({ readings }: PendingReadingApprovalsProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const allSelected = useMemo(
    () => readings.length > 0 && selectedIds.length === readings.length,
    [readings.length, selectedIds.length]
  );

  function handleToggleAll(checked: boolean) {
    setSelectedIds(checked ? readings.map((reading) => reading.id) : []);
  }

  function handleToggleOne(readingId: string, checked: boolean) {
    setSelectedIds((current) =>
      checked ? [...current, readingId] : current.filter((id) => id !== readingId)
    );
  }

  function handleBulkApprove() {
    setServerError(null);

    startTransition(async () => {
      try {
        await approveReadings(selectedIds);
        setSelectedIds([]);
        router.refresh();
      } catch (error) {
        console.error(error);
        setServerError(
          error instanceof Error ? error.message : "Selected readings could not be approved."
        );
      }
    });
  }

  return (
    <section className="rounded-3xl border border-border bg-background p-6 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Step 3.2
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Pending reading approvals
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Billing staff can approve individual readings or approve multiple
            pending-review submissions in one action.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-10 rounded-xl px-4"
            disabled={isPending || selectedIds.length === 0}
            onClick={handleBulkApprove}
          >
            {isPending ? "Approving selected..." : `Approve selected (${selectedIds.length})`}
          </Button>
        </div>
      </div>

      {serverError ? (
        <p className="mt-5 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {serverError}
        </p>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-2xl border border-border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-left">
            <thead className="bg-muted/50">
              <tr className="text-sm text-muted-foreground">
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label="Select all pending readings"
                    className={checkboxClassName}
                    checked={allSelected}
                    onChange={(event) => handleToggleAll(event.target.checked)}
                  />
                </th>
                <th className="px-4 py-3 font-medium">Meter</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Previous</th>
                <th className="px-4 py-3 font-medium">Current</th>
                <th className="px-4 py-3 font-medium">Consumption</th>
                <th className="px-4 py-3 font-medium">Reader</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background">
              {readings.length ? (
                readings.map((reading) => {
                  const isSelected = selectedIds.includes(reading.id);

                  return (
                    <tr key={reading.id} className="align-top text-sm">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          aria-label={`Select reading for meter ${reading.meter.meterNumber}`}
                          className={checkboxClassName}
                          checked={isSelected}
                          onChange={(event) =>
                            handleToggleOne(reading.id, event.target.checked)
                          }
                        />
                      </td>
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
                      <td className="px-4 py-4 text-muted-foreground">
                        {reading.currentReading}
                      </td>
                      <td className="px-4 py-4 font-medium text-foreground">
                        {reading.consumption}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">{reading.reader.name}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col items-end gap-2 sm:flex-row sm:justify-end">
                          <ApproveReadingButton readingId={reading.id} />
                          <DeleteReadingButton readingId={reading.id} />
                        </div>
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
                    No readings are waiting for review right now.
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
