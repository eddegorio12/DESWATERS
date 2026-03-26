import { RecordListSection } from "@/features/admin/components/record-list-section";
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

      <div className="overflow-hidden rounded-[1.5rem] border border-[#dbe9e5] shadow-[0_18px_40px_-38px_rgba(16,63,67,0.45)]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-left">
            <thead className="bg-secondary/55">
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
                      {canGenerateBills ? (
                        <GenerateBillButton readingId={reading.id} />
                      ) : (
                        <span className="text-xs text-muted-foreground">Read-only</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    {hasActiveFilters
                      ? "No approved readings match the current search."
                      : "No approved readings are waiting for bill generation."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </RecordListSection>
  );
}
