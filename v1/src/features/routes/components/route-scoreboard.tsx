import { BillStatus, ComplaintCategory, ComplaintStatus } from "@prisma/client";

import {
  AdminSurfaceHeader,
  AdminSurfacePanel,
} from "@/features/admin/components/admin-surface-panel";
import { RecordListSection } from "@/features/admin/components/record-list-section";
import { ResponsiveDataTable } from "@/features/admin/components/responsive-data-table";
import { StatusPill } from "@/features/admin/components/status-pill";
import { formatCurrency } from "@/features/billing/lib/billing-calculations";

type RouteFocus =
  | "ALL"
  | "NEEDS_READER"
  | "NEEDS_DISTRIBUTOR"
  | "UNMAPPED"
  | "COMPLAINTS"
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
    openComplaintCount: number;
    complaintCount: number;
    topComplaintCategory: ComplaintCategory | null;
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
    openComplaintCount: number;
    complaintCount: number;
    topComplaintCategory: ComplaintCategory | null;
    overdueCount: number;
    outstandingBalance: number;
    averageConsumption: number;
    collectionEfficiency: number;
  }[];
  lossWatchlist: {
    id: string;
    routeName: string;
    routeCode: string;
    zoneName: string;
    recentBilledAmount: number;
    recentCollectedAmount: number;
    recentGapAmount: number;
    recentCollectionEfficiency: number;
    openOutstandingBalance: number;
    overdueCount: number;
    routeRiskScore: number;
  }[];
  complaintWatchlist: {
    id: string;
    routeName: string;
    routeCode: string;
    zoneName: string;
    openComplaintCount: number;
    complaintCount: number;
    topComplaintCategory: ComplaintCategory | null;
    latestReportedAt: Date | null;
    complaintRiskScore: number;
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
  recentComplaints: {
    id: string;
    summary: string;
    category: ComplaintCategory;
    status: ComplaintStatus;
    reportedAt: Date;
    routeName: string;
    routeCode: string;
    zoneName: string;
    meterNumber: string | null;
    customerName: string | null;
    accountNumber: string | null;
  }[];
  billingTrend: {
    periodLabel: string;
    billedAmount: number;
    collectedAmount: number;
    outstandingBalance: number;
    collectionEfficiency: number;
    overdueCount: number;
  }[];
  overdueAging: {
    label: string;
    customerCount: number;
    billCount: number;
    balance: number;
    priority: NonNullable<Parameters<typeof StatusPill>[0]["priority"]>;
  }[];
  serviceActionTrend: {
    periodLabel: string;
    disconnections: number;
    reinstatements: number;
  }[];
};

function formatComplaintCategory(category: ComplaintCategory | null) {
  if (!category) {
    return "No complaint mix";
  }

  switch (category) {
    case ComplaintCategory.LEAK:
      return "Leak";
    case ComplaintCategory.NO_WATER:
      return "No water";
    case ComplaintCategory.LOW_PRESSURE:
      return "Low pressure";
    case ComplaintCategory.BILLING_DISPUTE:
      return "Billing dispute";
    case ComplaintCategory.METER_DAMAGE:
      return "Meter damage";
    default:
      return "Other";
  }
}

function formatComplaintStatus(status: ComplaintStatus) {
  return status === ComplaintStatus.RESOLVED ? "Resolved" : "Open";
}

function formatComplaintDate(value: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

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

  if (route.openComplaintCount > 0) {
    pills.push({
      label: `${route.openComplaintCount} open complaint${route.openComplaintCount === 1 ? "" : "s"}`,
      priority: "attention",
    });
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
  lossWatchlist,
  complaintWatchlist,
  overdueAccounts,
  recentComplaints,
  billingTrend,
  overdueAging,
  serviceActionTrend,
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
          { label: "Complaint pressure", value: "COMPLAINTS" },
          { label: "Overdue pressure", value: "OVERDUE" },
          { label: "Ready coverage", value: "READY" },
        ]}
        helperText="Use one filter vocabulary here to separate ownership gaps, complaint hotspots, unmapped coverage, and delinquency pressure before the next reading or print run."
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
                        {route.openComplaintCount} open complaint
                        {route.openComplaintCount === 1 ? "" : "s"}
                        {route.topComplaintCategory
                          ? ` • ${formatComplaintCategory(route.topComplaintCategory)} lead`
                          : ""}
                      </div>
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
                  {route.openComplaintCount} open complaint
                  {route.openComplaintCount === 1 ? "" : "s"}
                  {route.topComplaintCategory
                    ? ` • ${formatComplaintCategory(route.topComplaintCategory)} lead`
                    : ""}
                </div>
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
        <AdminSurfacePanel>
          <AdminSurfaceHeader
            eyebrow="Loss-Risk Watchlist"
            title="Routes with the largest recent billed-versus-collected gap"
            description="This remains a revenue-loss proxy based on the last three billing months plus current overdue exposure. Complaint-area pressure is now tracked separately below from real complaint records."
            aside={`${lossWatchlist.length} route${lossWatchlist.length === 1 ? "" : "s"}`}
          />
          <div className="mt-4 space-y-3">
            {lossWatchlist.length ? (
              lossWatchlist.map((route) => (
                <div
                  key={route.id}
                  className="border-t border-border/60 px-1 pt-4 first:border-t-0 first:pt-0"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-[#16373b]">
                        {route.routeName} ({route.routeCode})
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{route.zoneName}</p>
                    </div>
                    <StatusPill
                      priority={
                        route.routeRiskScore >= 55
                          ? "overdue"
                          : route.routeRiskScore >= 30
                            ? "attention"
                            : "pending"
                      }
                    >
                      {route.routeRiskScore.toFixed(0)} risk score
                    </StatusPill>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                    <p>
                      3-month gap: {formatCurrency(route.recentGapAmount)} from{" "}
                      {formatCurrency(route.recentBilledAmount)} billed
                    </p>
                    <p>
                      Recent collection efficiency: {route.recentCollectionEfficiency.toFixed(2)}%
                    </p>
                    <p>
                      Current open exposure: {formatCurrency(route.openOutstandingBalance)} across{" "}
                      {route.overdueCount} overdue bill{route.overdueCount === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No billed-versus-collected gap is available for the current route view yet.
              </p>
            )}
          </div>
        </AdminSurfacePanel>

        <AdminSurfacePanel>
          <AdminSurfaceHeader
            eyebrow="Complaint Hotspots"
            title="Routes carrying the most complaint pressure"
            description="Complaint pressure now ranks route areas from route-linked complaint records rather than inferred loss data."
            aside={`${complaintWatchlist.length} route${complaintWatchlist.length === 1 ? "" : "s"}`}
          />
          <div className="mt-4 space-y-3">
            {complaintWatchlist.length ? (
              complaintWatchlist.map((route) => (
                <div
                  key={route.id}
                  className="border-t border-border/60 px-1 pt-4 first:border-t-0 first:pt-0"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-[#16373b]">
                        {route.routeName} ({route.routeCode})
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{route.zoneName}</p>
                    </div>
                    <StatusPill
                      priority={
                        route.complaintRiskScore >= 60
                          ? "overdue"
                          : route.complaintRiskScore >= 30
                            ? "attention"
                            : "pending"
                      }
                    >
                      {route.complaintRiskScore.toFixed(0)} pressure score
                    </StatusPill>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                    <p>
                      {route.openComplaintCount} open complaint
                      {route.openComplaintCount === 1 ? "" : "s"} from {route.complaintCount} total
                      route-linked record{route.complaintCount === 1 ? "" : "s"}
                    </p>
                    <p>Leading complaint type: {formatComplaintCategory(route.topComplaintCategory)}</p>
                    <p>
                      Latest report:{" "}
                      {route.latestReportedAt ? formatComplaintDate(route.latestReportedAt) : "No recent complaint"}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No route-linked complaint records match the current route view yet.
              </p>
            )}
          </div>
        </AdminSurfacePanel>

        <AdminSurfacePanel>
          <AdminSurfaceHeader
            eyebrow="Zone Pressure"
            title="Zones in the current route view"
            aside={`${zoneMetrics.length} zone${zoneMetrics.length === 1 ? "" : "s"}`}
          />
          <div className="mt-4 space-y-3">
            {zoneMetrics.length ? (
              zoneMetrics.map((zone) => (
                <div key={zone.id} className="border-t border-border/60 px-1 pt-4 first:border-t-0 first:pt-0">
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
                    <p>
                      Open complaints: {zone.openComplaintCount} of {zone.complaintCount} total
                    </p>
                    <p>Top complaint type: {formatComplaintCategory(zone.topComplaintCategory)}</p>
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
        </AdminSurfacePanel>

        <AdminSurfacePanel>
          <AdminSurfaceHeader
            eyebrow="Recent Complaints"
            title="Latest route-linked complaint records"
            aside={`${recentComplaints.length} complaint${recentComplaints.length === 1 ? "" : "s"}`}
          />
          <div className="mt-4 space-y-3">
            {recentComplaints.length ? (
              recentComplaints.map((complaint) => (
                <div
                  key={complaint.id}
                  className="border-t border-border/60 px-1 pt-4 first:border-t-0 first:pt-0"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-[#16373b]">{complaint.summary}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {complaint.routeCode} - {complaint.routeName} ({complaint.zoneName})
                      </p>
                    </div>
                    <StatusPill
                      priority={
                        complaint.status === ComplaintStatus.RESOLVED ? "success" : "attention"
                      }
                    >
                      {formatComplaintStatus(complaint.status)}
                    </StatusPill>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                    <p>
                      Category: {formatComplaintCategory(complaint.category)} • Reported{" "}
                      {formatComplaintDate(complaint.reportedAt)}
                    </p>
                    <p>
                      Customer: {complaint.customerName ?? "No customer linked"}
                      {complaint.accountNumber ? ` (${complaint.accountNumber})` : ""}
                    </p>
                    <p>Meter: {complaint.meterNumber ?? "No meter linked"}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No route-linked complaints match the current route view.
              </p>
            )}
          </div>
        </AdminSurfacePanel>

        <AdminSurfacePanel>
          <AdminSurfaceHeader
            eyebrow="Billing Trend"
            title="Recent billed versus collected cycles"
            aside={`${billingTrend.length} cycle${billingTrend.length === 1 ? "" : "s"}`}
          />
          <div className="mt-4 space-y-3">
            {billingTrend.length ? (
              billingTrend.map((period) => (
                <div
                  key={period.periodLabel}
                  className="border-t border-border/60 px-1 pt-4 first:border-t-0 first:pt-0"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-[#16373b]">{period.periodLabel}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Billed {formatCurrency(period.billedAmount)} and collected{" "}
                        {formatCurrency(period.collectedAmount)}
                      </p>
                    </div>
                    <StatusPill
                      priority={period.collectionEfficiency >= 90 ? "success" : "pending"}
                    >
                      {period.collectionEfficiency.toFixed(2)}% collected
                    </StatusPill>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                    <p>Open balance: {formatCurrency(period.outstandingBalance)}</p>
                    <p>Overdue bills still open: {period.overdueCount}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No billing cycles are available for the current route view yet.
              </p>
            )}
          </div>
        </AdminSurfacePanel>

        <AdminSurfacePanel>
          <AdminSurfaceHeader
            eyebrow="Overdue Aging"
            title="Outstanding balance mix"
            aside={`${overdueAging.reduce((sum, bucket) => sum + bucket.billCount, 0)} open bill${overdueAging.reduce((sum, bucket) => sum + bucket.billCount, 0) === 1 ? "" : "s"}`}
          />
          <div className="mt-4 space-y-3">
            {overdueAging.length ? (
              overdueAging.map((bucket) => (
                <div
                  key={bucket.label}
                  className="border-t border-border/60 px-1 pt-4 first:border-t-0 first:pt-0"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-[#16373b]">{bucket.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {bucket.customerCount} customer{bucket.customerCount === 1 ? "" : "s"} across{" "}
                        {bucket.billCount} bill{bucket.billCount === 1 ? "" : "s"}
                      </p>
                    </div>
                    <StatusPill priority={bucket.priority}>
                      {formatCurrency(bucket.balance)}
                    </StatusPill>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No open billed balances are available for aging review in the current route view.
              </p>
            )}
          </div>
        </AdminSurfacePanel>

        <AdminSurfacePanel>
          <AdminSurfaceHeader
            eyebrow="Service Trend"
            title="Disconnection versus reinstatement activity"
            aside={`${serviceActionTrend.length} month${serviceActionTrend.length === 1 ? "" : "s"}`}
          />
          <div className="mt-4 space-y-3">
            {serviceActionTrend.length ? (
              serviceActionTrend.map((period) => (
                <div
                  key={period.periodLabel}
                  className="border-t border-border/60 px-1 pt-4 first:border-t-0 first:pt-0"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-[#16373b]">{period.periodLabel}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {period.disconnections} disconnection
                        {period.disconnections === 1 ? "" : "s"} recorded
                      </p>
                    </div>
                    <StatusPill
                      priority={
                        period.disconnections > period.reinstatements ? "overdue" : "success"
                      }
                    >
                      {period.reinstatements} reinstatement
                      {period.reinstatements === 1 ? "" : "s"}
                    </StatusPill>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No disconnection or reinstatement records match the current route view yet.
              </p>
            )}
          </div>
        </AdminSurfacePanel>

        <AdminSurfacePanel>
          <AdminSurfaceHeader
            eyebrow="Route Overdue List"
            title="Accounts in the current route view"
            aside={`${overdueAccounts.length} overdue account${overdueAccounts.length === 1 ? "" : "s"}`}
          />
          <div className="mt-4 space-y-3">
            {overdueAccounts.length ? (
              overdueAccounts.map((bill) => (
                <div key={bill.id} className="border-t border-border/60 px-1 pt-4 first:border-t-0 first:pt-0">
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
        </AdminSurfacePanel>
      </div>
    </section>
  );
}
