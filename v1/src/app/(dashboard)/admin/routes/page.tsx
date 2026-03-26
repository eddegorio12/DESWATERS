import { BillStatus, PaymentStatus, RouteResponsibility } from "@prisma/client";

import { AdminPageActions } from "@/features/admin/components/admin-page-actions";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { ModuleAccessStateView } from "@/features/admin/components/module-access-state";
import {
  canPerformCapability,
  getModuleAccess,
} from "@/features/auth/lib/authorization";
import { formatCurrency } from "@/features/billing/lib/billing-calculations";
import { syncReceivableStatuses } from "@/features/follow-up/lib/workflow";
import { RouteOperationsManager } from "@/features/routes/components/route-operations-manager";
import { average, percentage, roundMetric } from "@/features/routes/lib/route-analytics";
import { prisma } from "@/lib/prisma";

export default async function AdminRoutesPage() {
  const access = await getModuleAccess("routeOperations");

  if (access.status !== "authorized") {
    return <ModuleAccessStateView module="routeOperations" access={access} />;
  }

  await syncReceivableStatuses();

  const [zones, routes, openBills, staffOptions, meters] = await Promise.all([
    prisma.serviceZone.findMany({
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        _count: {
          select: {
            routes: true,
            meters: true,
          },
        },
      },
    }),
    prisma.serviceRoute.findMany({
      orderBy: [{ zone: { name: "asc" } }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        zone: {
          select: {
            name: true,
          },
        },
        assignments: {
          where: {
            releasedAt: null,
          },
          select: {
            responsibility: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        meters: {
          select: {
            readings: {
              orderBy: [{ readingDate: "desc" }],
              take: 1,
              select: {
                consumption: true,
              },
            },
          },
        },
        printBatches: {
          select: {
            id: true,
          },
        },
      },
    }),
    prisma.bill.findMany({
      where: {
        status: {
          in: [BillStatus.UNPAID, BillStatus.PARTIALLY_PAID, BillStatus.OVERDUE],
        },
      },
      orderBy: [{ dueDate: "asc" }],
      select: {
        id: true,
        billingPeriod: true,
        totalCharges: true,
        status: true,
        customer: {
          select: {
            accountNumber: true,
            name: true,
          },
        },
        reading: {
          select: {
            meter: {
              select: {
                meterNumber: true,
                serviceZone: {
                  select: {
                    name: true,
                  },
                },
                serviceRoute: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                  },
                },
              },
            },
          },
        },
        payments: {
          where: {
            status: PaymentStatus.COMPLETED,
          },
          select: {
            amount: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      where: {
        isActive: true,
        role: {
          in: ["SUPER_ADMIN", "ADMIN", "BILLING", "METER_READER", "CASHIER"],
        },
      },
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        role: true,
      },
    }),
    prisma.meter.findMany({
      orderBy: [{ meterNumber: "asc" }],
      select: {
        id: true,
        meterNumber: true,
        customer: {
          select: {
            name: true,
          },
        },
        serviceRoute: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  const canManageRoutes = canPerformCapability(access.user.role, "routes:manage");
  const routeMetrics = routes.map((route) => {
    const routeBills = openBills.filter((bill) => bill.reading.meter.serviceRoute?.id === route.id);
    const overdueBills = routeBills.filter((bill) => bill.status === BillStatus.OVERDUE);
    const outstandingBalance = roundMetric(
      routeBills.reduce((sum, bill) => {
        const paid = bill.payments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0);
        return sum + Math.max(0, bill.totalCharges - paid);
      }, 0)
    );
    const totalBilled = roundMetric(routeBills.reduce((sum, bill) => sum + bill.totalCharges, 0));
    const totalCollected = roundMetric(
      routeBills.reduce(
        (sum, bill) =>
          sum + bill.payments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0),
        0
      )
    );

    return {
      id: route.id,
      name: route.name,
      code: route.code,
      zoneName: route.zone.name,
      meterCount: route.meters.length,
      averageConsumption: average(
        route.meters
          .map((meter) => meter.readings[0]?.consumption ?? null)
          .filter((value): value is number => value !== null)
      ),
      overdueCount: overdueBills.length,
      outstandingBalance,
      collectionEfficiency: percentage(totalCollected, totalBilled),
      readerNames: route.assignments
        .filter((assignment) => assignment.responsibility === RouteResponsibility.METER_READING)
        .map((assignment) => assignment.user.name),
      distributorNames: route.assignments
        .filter(
          (assignment) => assignment.responsibility === RouteResponsibility.BILL_DISTRIBUTION
        )
        .map((assignment) => assignment.user.name),
      printBatchCount: route.printBatches.length,
    };
  });

  const zoneMetrics = zones.map((zone) => {
    const zoneRoutes = routeMetrics.filter((route) => route.zoneName === zone.name);
    const zoneRouteIds = new Set(zoneRoutes.map((route) => route.id));
    const zoneBills = openBills.filter((bill) =>
      bill.reading.meter.serviceRoute?.id ? zoneRouteIds.has(bill.reading.meter.serviceRoute.id) : false
    );
    const outstandingBalance = roundMetric(
      zoneBills.reduce((sum, bill) => {
        const paid = bill.payments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0);
        return sum + Math.max(0, bill.totalCharges - paid);
      }, 0)
    );
    const totalBilled = roundMetric(zoneBills.reduce((sum, bill) => sum + bill.totalCharges, 0));
    const totalCollected = roundMetric(
      zoneBills.reduce(
        (sum, bill) =>
          sum + bill.payments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0),
        0
      )
    );

    return {
      id: zone.id,
      name: zone.name,
      routeCount: zone._count.routes,
      meterCount: zone._count.meters,
      overdueCount: zoneBills.filter((bill) => bill.status === BillStatus.OVERDUE).length,
      outstandingBalance,
      averageConsumption: average(
        zoneRoutes
          .map((route) => route.averageConsumption)
          .filter((value) => value > 0)
      ),
      collectionEfficiency: percentage(totalCollected, totalBilled),
    };
  });

  const topDelinquentZones = [...zoneMetrics]
    .sort((left, right) => right.outstandingBalance - left.outstandingBalance)
    .slice(0, 3);

  return (
    <AdminPageShell
      eyebrow="Route Operations"
      title="Plan field coverage by zone, route owner, and route-level financial pressure."
      description="EH12 starts with route-aware operations: define the field map, assign reading and distribution ownership, and review which routes are carrying the highest overdue and collection pressure."
      actions={
        <AdminPageActions
          links={[
            { href: "/admin/readings", label: "Reading module" },
            { href: "/admin/billing", label: "Billing module" },
          ]}
        />
      }
      stats={[
        {
          label: "Zones",
          value: zones.length.toString(),
          detail: "Top-level field coverage groups now tracked in-app",
          accent: "teal",
        },
        {
          label: "Routes",
          value: routes.length.toString(),
          detail: `${routeMetrics.filter((route) => route.readerNames.length === 0).length} routes still need a reading owner`,
          accent: "sky",
        },
        {
          label: "Routed meters",
          value: meters.filter((meter) => meter.serviceRoute).length.toString(),
          detail: "Meters already attached to a named service route",
          accent: "amber",
        },
        {
          label: "Top delinquent zone",
          value: topDelinquentZones[0]?.name ?? "No zone yet",
          detail: topDelinquentZones[0]
            ? `${formatCurrency(topDelinquentZones[0].outstandingBalance)} outstanding`
            : "Create route coverage to start ranking zone pressure",
          accent: "rose",
        },
      ]}
    >
      <RouteOperationsManager
        key={[
          zones.length,
          routes.length,
          staffOptions.length,
          meters.length,
        ].join(":")}
        canManageRoutes={canManageRoutes}
        zones={zones.map((zone) => ({
          id: zone.id,
          name: zone.name,
        }))}
        routes={routes.map((route) => ({
          id: route.id,
          name: route.name,
          code: route.code,
          zoneName: route.zone.name,
        }))}
        staffOptions={staffOptions}
        meterOptions={meters.map((meter) => ({
          id: meter.id,
          meterNumber: meter.meterNumber,
          customerName: meter.customer?.name ?? null,
          currentRouteName: meter.serviceRoute?.name ?? null,
        }))}
      />

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[1.9rem] border border-[#dbe9e5] bg-white/92 p-6 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.55)]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Route Scoreboard
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Coverage and collection performance by route
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {routeMetrics.length} route{routeMetrics.length === 1 ? "" : "s"} tracked
            </p>
          </div>

          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-[#dbe9e5] shadow-[0_18px_40px_-38px_rgba(16,63,67,0.45)]">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-left">
                <thead className="bg-secondary/55">
                  <tr className="text-sm text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Route</th>
                    <th className="px-4 py-3 font-medium">Owners</th>
                    <th className="px-4 py-3 font-medium">Meters</th>
                    <th className="px-4 py-3 font-medium">Overdue</th>
                    <th className="px-4 py-3 font-medium">Outstanding</th>
                    <th className="px-4 py-3 font-medium">Collection efficiency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-background">
                  {routeMetrics.length ? (
                    routeMetrics.map((route) => (
                      <tr key={route.id} className="align-top text-sm">
                        <td className="px-4 py-4">
                          <div className="font-medium text-foreground">{route.name}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {route.code} • {route.zoneName}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-xs text-muted-foreground">
                          <div>
                            Reader: {route.readerNames.length ? route.readerNames.join(", ") : "Unassigned"}
                          </div>
                          <div className="mt-1">
                            Distributor:{" "}
                            {route.distributorNames.length
                              ? route.distributorNames.join(", ")
                              : "Unassigned"}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">
                          <div>{route.meterCount} mapped</div>
                          <div className="mt-1 text-xs">
                            Avg. use {route.averageConsumption.toFixed(2)} cu.m
                          </div>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">{route.overdueCount}</td>
                        <td className="px-4 py-4 font-medium text-foreground">
                          {formatCurrency(route.outstandingBalance)}
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex rounded-full bg-[#e4f3ef] px-3 py-1 text-xs font-medium text-[#17525a]">
                            {route.collectionEfficiency.toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                        No service routes yet. Create the first zone and route above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </article>

        <div className="space-y-6">
          <article className="rounded-[1.9rem] border border-[#dbe9e5] bg-white/92 p-6 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.55)]">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Zone Pressure
            </p>
            <div className="mt-4 space-y-3">
              {zoneMetrics.length ? (
                zoneMetrics.map((zone) => (
                  <div key={zone.id} className="rounded-[1.25rem] border border-[#dbe9e5] bg-[#fbfdfc] px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-[#16373b]">{zone.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {zone.routeCount} routes • {zone.meterCount} meters
                        </p>
                      </div>
                      <span className="rounded-full bg-[#eef3ff] px-3 py-1 text-xs font-semibold text-[#294b8f]">
                        {zone.collectionEfficiency.toFixed(2)}%
                      </span>
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
                  Zone standings will appear after route coverage is created.
                </p>
              )}
            </div>
          </article>

          <article className="rounded-[1.9rem] border border-[#dbe9e5] bg-white/92 p-6 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.55)]">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Route Overdue List
            </p>
            <div className="mt-4 space-y-3">
              {openBills.filter((bill) => bill.status === BillStatus.OVERDUE).length ? (
                openBills
                  .filter((bill) => bill.status === BillStatus.OVERDUE)
                  .slice(0, 8)
                  .map((bill) => {
                    const paid = bill.payments.reduce((sum, payment) => sum + payment.amount, 0);
                    const outstanding = Math.max(0, bill.totalCharges - paid);

                    return (
                      <div key={bill.id} className="rounded-[1.2rem] border border-[#dbe9e5] bg-[#fbfdfc] px-4 py-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-medium text-[#16373b]">{bill.customer.name}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {bill.customer.accountNumber} • {bill.reading.meter.meterNumber}
                            </p>
                          </div>
                          <span className="rounded-full bg-[#fae4e2] px-3 py-1 text-xs font-semibold text-[#8a2f28]">
                            {bill.reading.meter.serviceRoute?.code ?? "Unrouted"}
                          </span>
                        </div>
                        <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                          <p>
                            Route: {bill.reading.meter.serviceRoute?.name ?? "No route"} • Zone:{" "}
                            {bill.reading.meter.serviceZone?.name ?? "No zone"}
                          </p>
                          <p>Billing period: {bill.billingPeriod}</p>
                          <p>Outstanding: {formatCurrency(outstanding)}</p>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <p className="text-sm text-muted-foreground">
                  No overdue routed accounts are visible right now.
                </p>
              )}
            </div>
          </article>
        </div>
      </section>
    </AdminPageShell>
  );
}
