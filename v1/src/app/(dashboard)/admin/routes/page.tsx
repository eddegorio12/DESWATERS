import { BillStatus, PaymentStatus, RouteResponsibility } from "@prisma/client";

import { AdminPageActions } from "@/features/admin/components/admin-page-actions";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { ModuleAccessStateView } from "@/features/admin/components/module-access-state";
import {
  getSearchParamText,
  matchesSearch,
  type SearchParamValue,
} from "@/features/admin/lib/list-filters";
import {
  canPerformCapability,
  getModuleAccess,
} from "@/features/auth/lib/authorization";
import { formatCurrency } from "@/features/billing/lib/billing-calculations";
import { syncReceivableStatuses } from "@/features/follow-up/lib/workflow";
import { RouteOperationsManager } from "@/features/routes/components/route-operations-manager";
import { RouteScoreboard } from "@/features/routes/components/route-scoreboard";
import { average, percentage, roundMetric } from "@/features/routes/lib/route-analytics";
import { prisma } from "@/lib/prisma";

type AdminRoutesPageProps = {
  searchParams: Promise<Record<string, SearchParamValue>>;
};

type RouteFocus =
  | "ALL"
  | "NEEDS_READER"
  | "NEEDS_DISTRIBUTOR"
  | "UNMAPPED"
  | "OVERDUE"
  | "READY";

export default async function AdminRoutesPage({ searchParams }: AdminRoutesPageProps) {
  const access = await getModuleAccess("routeOperations");

  if (access.status !== "authorized") {
    return <ModuleAccessStateView module="routeOperations" access={access} />;
  }

  await syncReceivableStatuses();

  const [zones, routes, openBills, staffOptions, meters, filters] = await Promise.all([
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
    searchParams,
  ]);

  const canManageRoutes = canPerformCapability(access.user.role, "routes:manage");
  const query = getSearchParamText(filters.query);
  const focus = getSearchParamText(filters.focus) as RouteFocus;

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

  const filteredRouteMetrics = routeMetrics.filter((route) => {
    const matchesFocus =
      !focus || focus === "ALL"
        ? true
        : focus === "NEEDS_READER"
          ? route.readerNames.length === 0
          : focus === "NEEDS_DISTRIBUTOR"
            ? route.distributorNames.length === 0
            : focus === "UNMAPPED"
              ? route.meterCount === 0
              : focus === "OVERDUE"
                ? route.overdueCount > 0
                : route.readerNames.length > 0 &&
                  route.distributorNames.length > 0 &&
                  route.meterCount > 0;

    return (
      matchesFocus &&
      matchesSearch(
        [
          route.name,
          route.code,
          route.zoneName,
          ...route.readerNames,
          ...route.distributorNames,
        ],
        query
      )
    );
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

  const visibleRouteIds = new Set(filteredRouteMetrics.map((route) => route.id));
  const filteredZoneMetrics = zoneMetrics
    .filter((zone) => filteredRouteMetrics.some((route) => route.zoneName === zone.name))
    .sort((left, right) => right.outstandingBalance - left.outstandingBalance);
  const overdueAccounts = openBills
    .filter(
      (bill) =>
        bill.status === BillStatus.OVERDUE &&
        (bill.reading.meter.serviceRoute?.id
          ? visibleRouteIds.has(bill.reading.meter.serviceRoute.id)
          : false)
    )
    .slice(0, 8)
    .map((bill) => {
      const paid = bill.payments.reduce((sum, payment) => sum + payment.amount, 0);

      return {
        id: bill.id,
        customerName: bill.customer.name,
        accountNumber: bill.customer.accountNumber,
        meterNumber: bill.reading.meter.meterNumber,
        routeCode: bill.reading.meter.serviceRoute?.code ?? null,
        routeName: bill.reading.meter.serviceRoute?.name ?? null,
        zoneName: bill.reading.meter.serviceZone?.name ?? null,
        billingPeriod: bill.billingPeriod,
        outstanding: Math.max(0, bill.totalCharges - paid),
        status: bill.status,
      };
    });
  const unroutedMeterCount = meters.filter((meter) => !meter.serviceRoute).length;

  const topDelinquentZones = [...zoneMetrics]
    .sort((left, right) => right.outstandingBalance - left.outstandingBalance)
    .slice(0, 3);

  return (
    <AdminPageShell
      eyebrow="Route Operations"
      title="Plan field coverage by zone, route owner, and route-level financial pressure."
      description="Define the field map, assign reading and distribution ownership, and review which routes are carrying the highest overdue and collection pressure."
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
          detail: `${unroutedMeterCount} meters still need route coverage`,
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
        key={[zones.length, routes.length, staffOptions.length, meters.length].join(":")}
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

      <RouteScoreboard
        routeMetrics={filteredRouteMetrics}
        totalCount={routeMetrics.length}
        query={query}
        focus={focus || "ALL"}
        unroutedMeterCount={unroutedMeterCount}
        zoneMetrics={filteredZoneMetrics}
        overdueAccounts={overdueAccounts}
      />
    </AdminPageShell>
  );
}
