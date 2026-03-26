import { BillStatus } from "@prisma/client";

import { RecordListSection } from "@/features/admin/components/record-list-section";
import { ResponsiveDataTable } from "@/features/admin/components/responsive-data-table";
import { StatusPill } from "@/features/admin/components/status-pill";
import { formatCurrency } from "@/features/billing/lib/billing-calculations";

type RouteFocus =
  | "ALL"
  | "NEEDS_READER"
  | "NEEDS_DISTRIBUTOR"
  | "UNMAPPED"
  | "OVERDUE"
  | "READY";

type RouteScoreboardProps = {
  routeMetrics: {
    id: string;
    name: string;
    code: string;
    zoneName: string;
    meterCount: number;
    averageConsumption: number;
    overdueCount: number;
    outstandingBalance: number;
    collectionEfficiency: number;
    readerNames: string[];
    distributorNames: string[];
    printBatchCount: number;
  }[];
  totalCount: number;
  query: string;
  focus: RouteFocus;
  unroutedMeterCount: number;
  zoneMetrics: {
    id: string;
    name: string;
    routeCount: number;
    meterCount: number;
    overdueCount: number;
    outstandingBalance: number;
    averageConsumption: number;
    collectionEfficiency: number;
  }[];
  overdueAccounts: {
    id: string;
    customerName: string;
    accountNumber: string;
    meterNumber: string;
    routeCode: string | null;
    routeName: string | null;
    zoneName: string | null;
    billingPeriod: string;
    outstanding: number;
    status: BillStatus;
  }[];
};

function getRoutePills(route: RouteScoreboardProps["routeMetrics"][number]) {
  const pills: Array<{ label: string; priority: NonNullable<Parameters<typeof StatusPill>[0]["priority"]> }> = [];

  if (route.readerNames.length === 0) {
    pills.push({ label: "Needs reader", priority: "attention" });
  }

  if (route.distributorNames.length === 0) {
    pills.push({ label: "Needs distributor", priority: "attention" });
  }

  if (route.meterCount === 0) {
    pills.push({ label: "No mapped meters", priority: "attention" });
  }

  if (route.overdueCount > 0) {
    pills.push({ label: "Overdue pressure", priority: "overdue" });
  }

  if (pills.length === 0) {
    pills.push({ label: "Ready coverage", priority: "ready" });
  }

  return pills;
}

export function RouteScoreboard({
  routeMetrics,
  totalCount,
  query,
  focus,
  unroutedMeterCount,
  zoneMetrics,
  overdueAccounts,
}: RouteScoreboardProps) {
  const hasActiveFilters = Boolean(query || focus !== "ALL");
  const resultsText = hasActiveFilters
    ? `Showing ${routeMetrics.length} of ${totalCount} route${totalCount === 1 ? "" : "s"}`
    : `${routeMetrics.length} route${routeMetrics.length === 1 ? "" : "s"} tracked`;

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.85fr)]">
      <RecordListSection
        eyebrow="Route Scoreboard"
        title="Coverage and ownership by route"
        description="Search by route, zone, code, or assigned owner to find the next field area that still needs a reader, distributor, or meter mapping review."
        resultsText={resultsText}
        searchName="query"
        searchValue={query}
        searchPlaceholder="Search route, zone, code, or owner"
        filterName="focus"
        filterValue={focus}
        filterLabel="Route focus"
        filterOptions={[
          { label: "All routes", value: "ALL" },
          { label: "Needs reader", value: "NEEDS_READER" },
          { label: "Needs distributor", value: "NEEDS_DISTRIBUTOR" },
          { label: "No mapped meters", value: "UNMAPPED" },
          { label: "Overdue pressure", value: "OVERDUE" },
          { label: "Ready coverage", value: "READY" },
        ]}
        helperText="Use one filter vocabulary here to separate ownership gaps, unmapped coverage, and delinquency pressure before the next reading or print run."
        nextStep={`Next: finish missing route ownership here, then map the remaining ${unroutedMeterCount} unrouted meter${unroutedMeterCount === 1 ? "" : "s"} from Meters.`}
        resetHref="/admin/routes"
        hasActiveFilters={hasActiveFilters}
      >
        <ResponsiveDataTable
          columns={["Route", "Ownership", "Coverage", "Pressure"]}
          colSpan={4}
          breakpoint="xl"
          hasRows={routeMetrics.length > 0}
          emptyMessage={
            hasActiveFilters
              ? "No routes match the current search or focus filter."
              : "No service routes yet. Create the first zone and route above."
          }
          mobileCards={routeMetrics.map((route) => (
            <article key={route.id} className="rounded-[1.35rem] border border-[#dbe9e5] bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{route.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {route.code} - {route.zoneName}
                  </p>
                </div>
                <StatusPill priority={route.collectionEfficiency >= 90 ? "success" : "pending"}>
                  {route.collectionEfficiency.toFixed(2)}% collected
                </StatusPill>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {getRoutePills(route).map((pill) => (
                  <StatusPill key={`${route.id}-${pill.label}`} priority={pill.priority}>
                    {pill.label}
                  </StatusPill>
                ))}
              </div>
              <dl className="mt-4 grid gap-3 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Ownership</dt>
                  <dd className="mt-1 text-muted-foreground">
                    <div>
                      <span className="font-medium text-foreground">Reader:</span>{" "}
                      {route.readerNames.length ? route.readerNames.join(", ") : "Unassigned"}
                    </div>
                    <div className="mt-1">
                      <span className="font-medium text-foreground">Distributor:</span>{" "}
                      {route.distributorNames.length ? route.distributorNames.join(", ") : "Unassigned"}
                    </div>
                  </dd>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Coverage</dt>
                    <dd className="mt-1 text-muted-foreground">
                      <div className="font-medium text-foreground">
                        {route.meterCount} mapped meter{route.meterCount === 1 ? "" : "s"}
                      </div>
                      <div className="mt-1 text-xs">Avg. use {route.averageConsumption.toFixed(2)} cu.m</div>
                      <div className="mt-1 text-xs">
                        {route.printBatchCount} print batch{route.printBatchCount === 1 ? "" : "es"} linked
                      </div>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Pressure</dt>
                    <dd className="mt-1 text-muted-foreground">
                      <div className="font-medium text-foreground">{formatCurrency(route.outstandingBalance)}</div>
                      <div className="mt-1 text-xs">{route.overdueCount} overdue bill(s)</div>
                    </dd>
                  </div>
                </div>
              </dl>
            </article>
          ))}
          rows={routeMetrics.map((route) => (
            <tr key={route.id} className="align-top text-sm">
              <td className="px-4 py-4">
                <div className="font-medium text-foreground">{route.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {route.code} - {route.zoneName}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {getRoutePills(route).map((pill) => (
                    <StatusPill key={`${route.id}-${pill.label}`} priority={pill.priority}>
                      {pill.label}
                    </StatusPill>
                  ))}
                </div>
              </td>
              <td className="px-4 py-4 text-xs text-muted-foreground">
                <div>
                  <span className="font-medium text-foreground">Reader</span>
                  <div className="mt-1">
                    {route.readerNames.length ? route.readerNames.join(", ") : "Unassigned"}
                  </div>
                </div>
                <div className="mt-3">
                  <span className="font-medium text-foreground">Distributor</span>
                  <div className="mt-1">
                    {route.distributorNames.length ? route.distributorNames.join(", ") : "Unassigned"}
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 text-muted-foreground">
                <div className="font-medium text-foreground">
                  {route.meterCount} mapped meter{route.meterCount === 1 ? "" : "s"}
                </div>
                <div className="mt-1 text-xs">Avg. use {route.averageConsumption.toFixed(2)} cu.m</div>
                <div className="mt-1 text-xs">
                  {route.printBatchCount} print batch{route.printBatchCount === 1 ? "" : "es"} linked
                </div>
              </td>
              <td className="px-4 py-4 text-muted-foreground">
                <div className="font-medium text-foreground">
                  {formatCurrency(route.outstandingBalance)}
                </div>
                <div className="mt-1 text-xs">{route.overdueCount} overdue bill(s)</div>
                <div className="mt-2">
                  <StatusPill priority={route.collectionEfficiency >= 90 ? "success" : "pending"}>
                    {route.collectionEfficiency.toFixed(2)}% collected
                  </StatusPill>
                </div>
              </td>
            </tr>
          ))}
        />
      </RecordListSection>

      <div className="space-y-6">
        <article className="rounded-[1.9rem] border border-[#dbe9e5] bg-white/92 p-6 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.55)]">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Zone Pressure
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
                Zones in the current route view
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {zoneMetrics.length} zone{zoneMetrics.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="mt-4 space-y-3">
            {zoneMetrics.length ? (
              zoneMetrics.map((zone) => (
                <div
                  key={zone.id}
                  className="rounded-[1.25rem] border border-[#dbe9e5] bg-[#fbfdfc] px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-[#16373b]">{zone.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {zone.routeCount} routes - {zone.meterCount} meters
                      </p>
                    </div>
                    <StatusPill priority={zone.overdueCount > 0 ? "attention" : "success"}>
                      {zone.collectionEfficiency.toFixed(2)}% collected
                    </StatusPill>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                    <p>Outstanding: {formatCurrency(zone.outstandingBalance)}</p>
                    <p>Overdue bills: {zone.overdueCount}</p>
                    <p>Average consumption: {zone.averageConsumption.toFixed(2)} cu.m</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No zones match the current route view yet.
              </p>
            )}
          </div>
        </article>

        <article className="rounded-[1.9rem] border border-[#dbe9e5] bg-white/92 p-6 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.55)]">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Route Overdue List
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
                Accounts in the current route view
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {overdueAccounts.length} overdue account{overdueAccounts.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="mt-4 space-y-3">
            {overdueAccounts.length ? (
              overdueAccounts.map((bill) => (
                <div
                  key={bill.id}
                  className="rounded-[1.2rem] border border-[#dbe9e5] bg-[#fbfdfc] px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-[#16373b]">{bill.customerName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {bill.accountNumber} - {bill.meterNumber}
                      </p>
                    </div>
                    <StatusPill priority="overdue">
                      {bill.routeCode ?? "Unrouted"}
                    </StatusPill>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                    <p>
                      Route: {bill.routeName ?? "No route"} - Zone: {bill.zoneName ?? "No zone"}
                    </p>
                    <p>Billing period: {bill.billingPeriod}</p>
                    <p>Outstanding: {formatCurrency(bill.outstanding)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No overdue accounts match the current route view.
              </p>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
