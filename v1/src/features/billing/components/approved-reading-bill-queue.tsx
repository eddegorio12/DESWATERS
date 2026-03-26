import { RecordListSection } from "@/features/admin/components/record-list-section";
import { ResponsiveDataTable } from "@/features/admin/components/responsive-data-table";
import { GenerateBillButton } from "@/features/billing/components/generate-bill-button";
import { formatCurrency } from "@/features/billing/lib/billing-calculations";

type ApprovedReadingBillQueueProps = {
  activeTariff: {
    name: string;
    version: number;
    effectiveFrom: Date;
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
  canGenerateBills: boolean;
  totalCount: number;
  query: string;
};

export function ApprovedReadingBillQueue({
  activeTariff,
  readings,
  canGenerateBills,
  totalCount,
  query,
}: ApprovedReadingBillQueueProps) {
  const hasActiveFilters = Boolean(query);
  const resultsText = hasActiveFilters
    ? `Showing ${readings.length} of ${totalCount} approved reading${totalCount === 1 ? "" : "s"}`
    : `${readings.length} approved reading${readings.length === 1 ? "" : "s"} ready for billing`;

  return (
    <RecordListSection
      eyebrow="Billing Queue"
      title="Approved readings ready for billing"
      description={
        canGenerateBills
          ? "Narrow the queue, confirm the meter and customer, then generate bills against the active tariff."
          : "Review the approved reading queue here. Bill generation remains limited to billing staff, managers, and admins."
      }
      resultsText={resultsText}
      searchName="queueQuery"
      searchValue={query}
      searchPlaceholder="Search meter, customer, or account"
      helperText="Use the queue to move only reviewed readings into receivables."
      nextStep={
        canGenerateBills
          ? "Next: generate the bill to move the account into open receivables."
          : undefined
      }
      resetHref="/admin/billing"
      hasActiveFilters={hasActiveFilters}
    >
      <div className="rounded-[1.4rem] border border-[#dbe9e5] bg-[linear-gradient(180deg,#f8fbfa,#eff7f5)] px-4 py-3 text-sm">
        {activeTariff ? (
          <div className="space-y-1">
            <p className="font-medium text-foreground">
              {activeTariff.name} v{activeTariff.version}
            </p>
            <p className="text-muted-foreground">
              Base {formatCurrency(activeTariff.minimumCharge)} for up to{" "}
              {activeTariff.minimumUsage} cu.m
            </p>
            <p className="text-muted-foreground">
              Effective {activeTariff.effectiveFrom.toLocaleDateString()}
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground">No active tariff found.</p>
        )}
      </div>

      <ResponsiveDataTable
        columns={["Meter", "Customer", "Previous", "Current", "Consumption", "Actions"]}
        colSpan={6}
        hasRows={readings.length > 0}
        emptyMessage={
          hasActiveFilters
            ? "No approved readings match the current search."
            : "No approved readings are waiting for bill generation."
        }
        mobileCards={readings.map((reading) => (
          <article key={reading.id} className="rounded-[1.35rem] border border-[#dbe9e5] bg-white p-4">
            <p className="font-mono text-xs text-muted-foreground">{reading.meter.meterNumber}</p>
            <p className="mt-1 text-xs text-muted-foreground">{reading.readingDate.toLocaleString()}</p>
            <div className="mt-4">
              {reading.meter.customer ? (
                <div>
                  <div className="font-medium text-foreground">{reading.meter.customer.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {reading.meter.customer.accountNumber}
                  </div>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">No customer linked</span>
              )}
            </div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Previous</dt>
                <dd className="mt-1 text-muted-foreground">{reading.previousReading}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Current</dt>
                <dd className="mt-1 text-muted-foreground">{reading.currentReading}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Consumption</dt>
                <dd className="mt-1 font-medium text-foreground">{reading.consumption}</dd>
              </div>
            </dl>
            <div className="mt-4">
              {canGenerateBills ? (
                <GenerateBillButton readingId={reading.id} className="w-full justify-center" />
              ) : (
                <span className="text-xs text-muted-foreground">Read-only</span>
              )}
            </div>
          </article>
        ))}
        rows={readings.map((reading) => (
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
            <td className="px-4 py-4 text-muted-foreground">{reading.previousReading}</td>
            <td className="px-4 py-4 text-muted-foreground">{reading.currentReading}</td>
            <td className="px-4 py-4 font-medium text-foreground">{reading.consumption}</td>
            <td className="px-4 py-4 text-right">
              {canGenerateBills ? (
                <GenerateBillButton readingId={reading.id} />
              ) : (
                <span className="text-xs text-muted-foreground">Read-only</span>
              )}
            </td>
          </tr>
        ))}
      />
    </RecordListSection>
  );
}
