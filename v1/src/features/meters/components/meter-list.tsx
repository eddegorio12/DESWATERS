import type { MeterStatus } from "@prisma/client";

import { RecordListSection } from "@/features/admin/components/record-list-section";
import { ResponsiveDataTable } from "@/features/admin/components/responsive-data-table";
import { StatusPill } from "@/features/admin/components/status-pill";

type MeterListProps = {
  meters: {
    id: string;
    meterNumber: string;
    installDate: Date;
    status: MeterStatus;
    serviceZone: {
      name: string;
    } | null;
    serviceRoute: {
      code: string;
      name: string;
    } | null;
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
    replacedMeterHistory: {
      id: string;
      replacementDate: Date;
      finalReading: number | null;
      reason: string | null;
      replacementMeter: {
        meterNumber: string;
      };
    }[];
  }[];
  totalCount: number;
  query: string;
  registry: "ALL" | MeterStatus | "UNASSIGNED" | "UNROUTED";
};

function getMeterStatusTone(status: MeterStatus) {
  if (status === "ACTIVE") {
    return "success" as const;
  }

  if (status === "DEFECTIVE") {
    return "attention" as const;
  }

  return "readonly" as const;
}

export function MeterList({ meters, totalCount, query, registry }: MeterListProps) {
  const hasActiveFilters = Boolean(query || registry !== "ALL");
  const resultsText = hasActiveFilters
    ? `Showing ${meters.length} of ${totalCount} meter${totalCount === 1 ? "" : "s"}`
    : `${meters.length} meter${meters.length === 1 ? "" : "s"} recorded`;

  return (
    <RecordListSection
      eyebrow="Meter Registry"
      title="Registered service meters"
      description="Search by meter, customer, route, zone, or recent holder history to find the next unit that needs assignment, routing, or service review."
      resultsText={resultsText}
      searchName="query"
      searchValue={query}
      searchPlaceholder="Search meter, customer, route, zone, or holder"
      filterName="registry"
      filterValue={registry}
      filterLabel="Registry filter"
      filterOptions={[
        { label: "All meters", value: "ALL" },
        { label: "Active only", value: "ACTIVE" },
        { label: "Unassigned", value: "UNASSIGNED" },
        { label: "Unrouted", value: "UNROUTED" },
        { label: "Defective", value: "DEFECTIVE" },
        { label: "Replaced", value: "REPLACED" },
      ]}
      helperText="Use this registry to separate deployment gaps from hardware-status issues before the next reading cycle."
      nextStep="Next: assign idle meters here, then open Routes to map any unit that is still unrouted."
      resetHref="/admin/meters"
      hasActiveFilters={hasActiveFilters}
    >
      <ResponsiveDataTable
        columns={["Meter", "Install date", "Customer", "Route coverage", "Status", "History"]}
        colSpan={6}
        hasRows={meters.length > 0}
        emptyMessage={
          hasActiveFilters
            ? "No meters match the current search or registry filter."
            : "No meters yet. Register the first service meter with the form on this page."
        }
        mobileCards={meters.map((meter) => (
          <article key={meter.id} className="rounded-[1.35rem] border border-[#dbe9e5] bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-muted-foreground">{meter.meterNumber}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Installed {meter.installDate.toLocaleDateString()}
                </p>
              </div>
              <StatusPill priority={getMeterStatusTone(meter.status)}>
                {meter.status.replace("_", " ")}
              </StatusPill>
            </div>

            <dl className="mt-4 grid gap-3 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Customer
                </dt>
                <dd className="mt-1">
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
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Route coverage
                </dt>
                <dd className="mt-1">
                  {meter.serviceRoute ? (
                    <div>
                      <div className="font-medium text-foreground">{meter.serviceRoute.name}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {meter.serviceRoute.code}
                        {meter.serviceZone ? ` - ${meter.serviceZone.name}` : ""}
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Not routed</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Holder history
                </dt>
                <dd className="mt-2 text-xs text-muted-foreground">
                  {meter.holderTransfers.length || meter.replacedMeterHistory.length ? (
                    <div className="space-y-3">
                      {meter.holderTransfers.map((transfer) => (
                        <div
                          key={transfer.id}
                          className="rounded-2xl border border-border/70 bg-secondary/20 px-3 py-2"
                        >
                          <div className="font-medium text-foreground">
                            {transfer.fromCustomer
                              ? `${transfer.fromCustomer.name} to ${transfer.toCustomer.name}`
                              : `Initial assignment to ${transfer.toCustomer.name}`}
                          </div>
                          <div className="mt-1">
                            {transfer.effectiveDate.toLocaleDateString()}
                            {transfer.transferReading !== null
                              ? ` - Reading ${transfer.transferReading}`
                              : ""}
                          </div>
                          <div className="mt-1">
                            {transfer.fromCustomer
                              ? `${transfer.fromCustomer.accountNumber} to ${transfer.toCustomer.accountNumber}`
                              : transfer.toCustomer.accountNumber}
                          </div>
                          {transfer.reason ? (
                            <div className="mt-1 text-muted-foreground">{transfer.reason}</div>
                          ) : null}
                        </div>
                      ))}
                      {meter.replacedMeterHistory.map((entry) => (
                        <div
                          key={entry.id}
                          className="rounded-2xl border border-border/70 bg-amber-50 px-3 py-2"
                        >
                          <div className="font-medium text-foreground">
                            Replaced by meter {entry.replacementMeter.meterNumber}
                          </div>
                          <div className="mt-1">
                            {entry.replacementDate.toLocaleDateString()}
                            {entry.finalReading !== null
                              ? ` - Final reading ${entry.finalReading}`
                              : ""}
                          </div>
                          {entry.reason ? (
                            <div className="mt-1 text-muted-foreground">{entry.reason}</div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">No holder or replacement history yet</span>
                  )}
                </dd>
              </div>
            </dl>
          </article>
        ))}
        rows={meters.map((meter) => (
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
              {meter.serviceRoute ? (
                <div>
                  <div className="font-medium text-foreground">{meter.serviceRoute.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {meter.serviceRoute.code}
                    {meter.serviceZone ? ` - ${meter.serviceZone.name}` : ""}
                  </div>
                </div>
              ) : (
                <span className="text-muted-foreground">Not routed</span>
              )}
            </td>
            <td className="px-4 py-4">
              <StatusPill priority={getMeterStatusTone(meter.status)}>
                {meter.status.replace("_", " ")}
              </StatusPill>
            </td>
            <td className="px-4 py-4 text-xs text-muted-foreground">
              {meter.holderTransfers.length || meter.replacedMeterHistory.length ? (
                <div className="space-y-3">
                  {meter.holderTransfers.map((transfer) => (
                    <div
                      key={transfer.id}
                      className="rounded-2xl border border-border/70 bg-secondary/20 px-3 py-2"
                    >
                      <div className="font-medium text-foreground">
                        {transfer.fromCustomer
                          ? `${transfer.fromCustomer.name} to ${transfer.toCustomer.name}`
                          : `Initial assignment to ${transfer.toCustomer.name}`}
                      </div>
                      <div className="mt-1">
                        {transfer.effectiveDate.toLocaleDateString()}
                        {transfer.transferReading !== null
                          ? ` - Reading ${transfer.transferReading}`
                          : ""}
                      </div>
                      <div className="mt-1">
                        {transfer.fromCustomer
                          ? `${transfer.fromCustomer.accountNumber} to ${transfer.toCustomer.accountNumber}`
                          : transfer.toCustomer.accountNumber}
                      </div>
                      {transfer.reason ? (
                        <div className="mt-1 text-muted-foreground">{transfer.reason}</div>
                      ) : null}
                    </div>
                  ))}
                  {meter.replacedMeterHistory.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-2xl border border-border/70 bg-amber-50 px-3 py-2"
                    >
                      <div className="font-medium text-foreground">
                        Replaced by meter {entry.replacementMeter.meterNumber}
                      </div>
                      <div className="mt-1">
                        {entry.replacementDate.toLocaleDateString()}
                        {entry.finalReading !== null
                          ? ` - Final reading ${entry.finalReading}`
                          : ""}
                      </div>
                      {entry.reason ? (
                        <div className="mt-1 text-muted-foreground">{entry.reason}</div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground">No holder or replacement history yet</span>
              )}
            </td>
          </tr>
        ))}
      />
    </RecordListSection>
  );
}
