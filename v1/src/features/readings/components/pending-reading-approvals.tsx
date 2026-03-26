"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { RecordListSection } from "@/features/admin/components/record-list-section";
import { ResponsiveDataTable } from "@/features/admin/components/responsive-data-table";
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
      id: string;
      name: string;
    };
  }[];
  canApprove: boolean;
  canDeleteAny: boolean;
  canDeleteOwn: boolean;
  currentUserId: string;
  totalCount: number;
  query: string;
};

export function PendingReadingApprovals({
  readings,
  canApprove,
  canDeleteAny,
  canDeleteOwn,
  currentUserId,
  totalCount,
  query,
}: PendingReadingApprovalsProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasActiveFilters = Boolean(query);
  const resultsText = hasActiveFilters
    ? `Showing ${readings.length} of ${totalCount} pending reading${totalCount === 1 ? "" : "s"}`
    : `${readings.length} reading${readings.length === 1 ? "" : "s"} waiting for review`;

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
    <RecordListSection
      eyebrow="Review Queue"
      title="Pending reading approvals"
      description={
        canApprove
          ? "Review field submissions by meter, customer, or reader before they move into billing."
          : "This queue stays visible for follow-up, but approval remains limited to billing staff, managers, and admins."
      }
      resultsText={resultsText}
      searchName="pendingQuery"
      searchValue={query}
      searchPlaceholder="Search meter, customer, account, or reader"
      helperText="Bulk approval is fastest when the queue has already been narrowed to the route, reader, or customer you need."
      nextStep={canApprove ? "Next: approve clean readings to make them bill-ready." : undefined}
      resetHref="/admin/readings"
      hasActiveFilters={hasActiveFilters}
    >
      {canApprove ? (
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
      ) : null}

      {serverError ? (
        <p className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {serverError}
        </p>
      ) : null}

      <ResponsiveDataTable
        columns={["", "Meter", "Customer", "Previous", "Current", "Consumption", "Reader", "Actions"]}
        colSpan={8}
        hasRows={readings.length > 0}
        emptyMessage={
          hasActiveFilters
            ? "No pending readings match the current search."
            : "No readings are waiting for review right now."
        }
        mobileCards={readings.map((reading) => {
          const isSelected = selectedIds.includes(reading.id);
          const canDeleteReading =
            canDeleteAny || (canDeleteOwn && reading.reader.id === currentUserId);

          return (
            <article key={reading.id} className="rounded-[1.35rem] border border-[#dbe9e5] bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">
                    {reading.meter.meterNumber}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {reading.readingDate.toLocaleString()}
                  </p>
                </div>
                {canApprove ? (
                  <input
                    type="checkbox"
                    aria-label={`Select reading for meter ${reading.meter.meterNumber}`}
                    className={checkboxClassName}
                    checked={isSelected}
                    onChange={(event) => handleToggleOne(reading.id, event.target.checked)}
                  />
                ) : null}
              </div>

              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Customer
                  </dt>
                  <dd className="mt-1">
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
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Reader
                  </dt>
                  <dd className="mt-1 text-muted-foreground">{reading.reader.name}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Previous / Current
                  </dt>
                  <dd className="mt-1 text-muted-foreground">
                    {reading.previousReading} / {reading.currentReading}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Consumption
                  </dt>
                  <dd className="mt-1 font-medium text-foreground">{reading.consumption}</dd>
                </div>
              </dl>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {canApprove ? (
                  <ApproveReadingButton readingId={reading.id} className="w-full justify-center" />
                ) : null}
                {canDeleteReading ? (
                  <DeleteReadingButton readingId={reading.id} className="w-full justify-center" />
                ) : (
                  <span className="flex items-center text-xs text-muted-foreground">
                    No edit access
                  </span>
                )}
              </div>
            </article>
          );
        })}
        rows={readings.map((reading) => {
          const isSelected = selectedIds.includes(reading.id);
          const canDeleteReading =
            canDeleteAny || (canDeleteOwn && reading.reader.id === currentUserId);

          return (
            <tr key={reading.id} className="align-top text-sm">
              <td className="px-4 py-4">
                {canApprove ? (
                  <input
                    type="checkbox"
                    aria-label={`Select reading for meter ${reading.meter.meterNumber}`}
                    className={checkboxClassName}
                    checked={isSelected}
                    onChange={(event) => handleToggleOne(reading.id, event.target.checked)}
                  />
                ) : null}
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
              <td className="px-4 py-4 text-muted-foreground">{reading.previousReading}</td>
              <td className="px-4 py-4 text-muted-foreground">{reading.currentReading}</td>
              <td className="px-4 py-4 font-medium text-foreground">{reading.consumption}</td>
              <td className="px-4 py-4 text-muted-foreground">{reading.reader.name}</td>
              <td className="px-4 py-4">
                <div className="flex flex-col items-end gap-2 sm:flex-row sm:justify-end">
                  {canApprove ? <ApproveReadingButton readingId={reading.id} /> : null}
                  {canDeleteReading ? (
                    <DeleteReadingButton readingId={reading.id} />
                  ) : (
                    <span className="text-xs text-muted-foreground">No edit access</span>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      />
    </RecordListSection>
  );
}
