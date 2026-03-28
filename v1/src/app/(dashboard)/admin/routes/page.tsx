import {
  BillStatus,
  ComplaintCategory,
  ComplaintStatus,
  NotificationChannel,
  NotificationTemplate,
  PaymentStatus,
  RouteResponsibility,
} from "@prisma/client";

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
import { syncReceivableStatuses } from "@/features/follow-up/lib/workflow";
import { RouteOperationsManager } from "@/features/routes/components/route-operations-manager";
import { RouteComplaintPanel } from "@/features/routes/components/route-complaint-panel";
import { RouteScoreboard } from "@/features/routes/components/route-scoreboard";
import {
  average,
  clamp,
  formatTrendLabel,
  getDaysPastDue,
  getRecentMonthKeys,
  percentage,
  roundMetric,
} from "@/features/routes/lib/route-analytics";
import { prisma } from "@/lib/prisma";

type AdminRoutesPageProps = {
  searchParams: Promise<Record<string, SearchParamValue>>;
};

type RouteFocus =
  | "ALL"
  | "NEEDS_READER"
  | "NEEDS_DISTRIBUTOR"
  | "UNMAPPED"
  | "COMPLAINTS"
  | "OVERDUE"
  | "READY";

function getTopComplaintCategory(categories: ComplaintCategory[]) {
  if (!categories.length) {
    return null;
  }

  const counts = new Map<ComplaintCategory, number>();

  for (const category of categories) {
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }

  return [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;
}

export default async function AdminRoutesPage({ searchParams }: AdminRoutesPageProps) {
  const access = await getModuleAccess("routeOperations");

  if (access.status !== "authorized") {
    return <ModuleAccessStateView module="routeOperations" access={access} />;
  }

  await syncReceivableStatuses();

  const [
    zones,
    routes,
    openBills,
    staffOptions,
    meters,
    allRouteBills,
    routeNotifications,
    routeComplaints,
    filters,
  ] =
    await Promise.all([
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
        dueDate: true,
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
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.bill.findMany({
      where: {
        reading: {
          meter: {
            serviceRouteId: {
              not: null,
            },
          },
        },
      },
      orderBy: [{ billingCycle: { periodKey: "desc" } }, { createdAt: "desc" }],
      select: {
        id: true,
        billingPeriod: true,
        dueDate: true,
        totalCharges: true,
        status: true,
        customer: {
          select: {
            accountNumber: true,
          },
        },
        billingCycle: {
          select: {
            periodKey: true,
            billingPeriodLabel: true,
          },
        },
        reading: {
          select: {
            meter: {
              select: {
                serviceRouteId: true,
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
    prisma.notificationLog.findMany({
      where: {
        channel: NotificationChannel.PRINT,
        template: {
          in: [NotificationTemplate.DISCONNECTION, NotificationTemplate.REINSTATEMENT],
        },
      },
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        template: true,
        createdAt: true,
        bill: {
          select: {
            reading: {
              select: {
                meter: {
                  select: {
                    serviceRouteId: true,
                  },
                },
              },
            },
          },
        },
        customer: {
          select: {
            meters: {
              select: {
                serviceRouteId: true,
              },
            },
          },
        },
      },
    }),
    prisma.complaint.findMany({
      orderBy: [{ reportedAt: "desc" }],
      select: {
        id: true,
        status: true,
        category: true,
        summary: true,
        detail: true,
        reportedAt: true,
        serviceZoneId: true,
        serviceRouteId: true,
        serviceZone: {
          select: {
            name: true,
          },
        },
        serviceRoute: {
          select: {
            name: true,
            code: true,
          },
        },
        meter: {
          select: {
            meterNumber: true,
          },
        },
        customer: {
          select: {
            name: true,
            accountNumber: true,
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
    const complaints = routeComplaints.filter((complaint) => complaint.serviceRouteId === route.id);
    const openComplaints = complaints.filter((complaint) => complaint.status === ComplaintStatus.OPEN);
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
      openComplaintCount: openComplaints.length,
      complaintCount: complaints.length,
      topComplaintCategory: getTopComplaintCategory(complaints.map((complaint) => complaint.category)),
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
              : focus === "COMPLAINTS"
                ? route.openComplaintCount > 0
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
      openComplaintCount: routeComplaints.filter(
        (complaint) =>
          complaint.serviceZoneId === zone.id && complaint.status === ComplaintStatus.OPEN
      ).length,
      complaintCount: routeComplaints.filter((complaint) => complaint.serviceZoneId === zone.id).length,
      topComplaintCategory: getTopComplaintCategory(
        routeComplaints
          .filter((complaint) => complaint.serviceZoneId === zone.id)
          .map((complaint) => complaint.category)
      ),
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
  const recentPeriodKeys = getRecentMonthKeys(6);
  const recentLossWindow = new Set(recentPeriodKeys.slice(-3));
  const billingTrend = recentPeriodKeys
    .map((periodKey) => {
      const periodBills = allRouteBills.filter((bill) => {
        const routeId = bill.reading.meter.serviceRouteId;
        const billPeriodKey =
          bill.billingCycle?.periodKey ??
          `${bill.dueDate.getFullYear()}-${`${bill.dueDate.getMonth() + 1}`.padStart(2, "0")}`;

        return routeId ? visibleRouteIds.has(routeId) && billPeriodKey === periodKey : false;
      });

      const billedAmount = roundMetric(
        periodBills.reduce((sum, bill) => sum + bill.totalCharges, 0)
      );
      const collectedAmount = roundMetric(
        periodBills.reduce(
          (sum, bill) =>
            sum + bill.payments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0),
          0
        )
      );
      const outstandingBalance = roundMetric(
        periodBills.reduce((sum, bill) => {
          const paid = bill.payments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0);
          return sum + Math.max(0, bill.totalCharges - paid);
        }, 0)
      );

      return {
        periodLabel: formatTrendLabel(periodKey),
        billedAmount,
        collectedAmount,
        outstandingBalance,
        collectionEfficiency: percentage(collectedAmount, billedAmount),
        overdueCount: periodBills.filter((bill) => bill.status === BillStatus.OVERDUE).length,
      };
    })
    .filter(
      (period) =>
        period.billedAmount > 0 || period.collectedAmount > 0 || period.outstandingBalance > 0
    );

  const lossWatchlist = filteredRouteMetrics
    .map((route) => {
      const recentRouteBills = allRouteBills.filter((bill) => {
        const billPeriodKey =
          bill.billingCycle?.periodKey ??
          `${bill.dueDate.getFullYear()}-${`${bill.dueDate.getMonth() + 1}`.padStart(2, "0")}`;

        return bill.reading.meter.serviceRouteId === route.id && recentLossWindow.has(billPeriodKey);
      });

      const recentBilledAmount = roundMetric(
        recentRouteBills.reduce((sum, bill) => sum + bill.totalCharges, 0)
      );
      const recentCollectedAmount = roundMetric(
        recentRouteBills.reduce(
          (sum, bill) =>
            sum + bill.payments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0),
          0
        )
      );
      const recentGapAmount = roundMetric(
        Math.max(0, recentBilledAmount - recentCollectedAmount)
      );
      const recentCollectionEfficiency = percentage(recentCollectedAmount, recentBilledAmount);
      const gapRatio = recentBilledAmount > 0 ? recentGapAmount / recentBilledAmount : 0;
      const routeRiskScore = roundMetric(
        clamp(gapRatio * 55 + Math.min(route.overdueCount, 8) * 4.5, 0, 100)
      );

      return {
        id: route.id,
        routeName: route.name,
        routeCode: route.code,
        zoneName: route.zoneName,
        recentBilledAmount,
        recentCollectedAmount,
        recentGapAmount,
        recentCollectionEfficiency,
        openOutstandingBalance: route.outstandingBalance,
        overdueCount: route.overdueCount,
        routeRiskScore,
      };
    })
    .filter(
      (route) =>
        route.recentBilledAmount > 0 || route.openOutstandingBalance > 0 || route.overdueCount > 0
    )
    .sort((left, right) => {
      if (right.routeRiskScore !== left.routeRiskScore) {
        return right.routeRiskScore - left.routeRiskScore;
      }

      if (right.recentGapAmount !== left.recentGapAmount) {
        return right.recentGapAmount - left.recentGapAmount;
      }

      return right.openOutstandingBalance - left.openOutstandingBalance;
    })
    .slice(0, 6);

  const complaintWatchlist = filteredRouteMetrics
    .map((route) => {
      const complaints = routeComplaints.filter((complaint) => complaint.serviceRouteId === route.id);
      const openComplaints = complaints.filter((complaint) => complaint.status === ComplaintStatus.OPEN);
      const complaintRiskScore = roundMetric(
        clamp(openComplaints.length * 20 + complaints.length * 5, 0, 100)
      );

      return {
        id: route.id,
        routeName: route.name,
        routeCode: route.code,
        zoneName: route.zoneName,
        openComplaintCount: openComplaints.length,
        complaintCount: complaints.length,
        topComplaintCategory: getTopComplaintCategory(
          complaints.map((complaint) => complaint.category)
        ),
        latestReportedAt: complaints[0]?.reportedAt ?? null,
        complaintRiskScore,
      };
    })
    .filter((route) => route.complaintCount > 0)
    .sort((left, right) => {
      if (right.complaintRiskScore !== left.complaintRiskScore) {
        return right.complaintRiskScore - left.complaintRiskScore;
      }

      if (right.openComplaintCount !== left.openComplaintCount) {
        return right.openComplaintCount - left.openComplaintCount;
      }

      return right.complaintCount - left.complaintCount;
    })
    .slice(0, 6);

  const overdueAging = [
    {
      label: "Current or not yet due",
      matches: (daysPastDue: number) => daysPastDue <= 0,
      priority: "ready" as const,
    },
    {
      label: "1-30 days overdue",
      matches: (daysPastDue: number) => daysPastDue >= 1 && daysPastDue <= 30,
      priority: "pending" as const,
    },
    {
      label: "31-60 days overdue",
      matches: (daysPastDue: number) => daysPastDue >= 31 && daysPastDue <= 60,
      priority: "attention" as const,
    },
    {
      label: "61+ days overdue",
      matches: (daysPastDue: number) => daysPastDue >= 61,
      priority: "overdue" as const,
    },
  ].map((bucket) => {
    const bucketBills = openBills.filter((bill) => {
      const routeId = bill.reading.meter.serviceRoute?.id;
      const paid = bill.payments.reduce((sum, payment) => sum + payment.amount, 0);
      const outstanding = Math.max(0, bill.totalCharges - paid);

      if (!routeId || !visibleRouteIds.has(routeId) || outstanding <= 0) {
        return false;
      }

      return bucket.matches(getDaysPastDue(bill.dueDate));
    });

    return {
      label: bucket.label,
      customerCount: new Set(bucketBills.map((bill) => bill.customer.accountNumber)).size,
      billCount: bucketBills.length,
      balance: roundMetric(
        bucketBills.reduce((sum, bill) => {
          const paid = bill.payments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0);
          return sum + Math.max(0, bill.totalCharges - paid);
        }, 0)
      ),
      priority: bucket.priority,
    };
  });

  const serviceActionTrend = recentPeriodKeys.map((periodKey) => {
    const periodEvents = routeNotifications.filter((event) => {
      const routeId =
        event.bill?.reading.meter.serviceRouteId ??
        event.customer.meters.find((meter) => meter.serviceRouteId)?.serviceRouteId ??
        null;
      const eventPeriodKey = `${event.createdAt.getFullYear()}-${`${event.createdAt.getMonth() + 1}`.padStart(2, "0")}`;

      return routeId ? visibleRouteIds.has(routeId) && eventPeriodKey === periodKey : false;
    });

    return {
      periodLabel: formatTrendLabel(periodKey),
      disconnections: periodEvents.filter((event) => event.template === "DISCONNECTION").length,
      reinstatements: periodEvents.filter((event) => event.template === "REINSTATEMENT").length,
    };
  });

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
  const recentComplaints = routeComplaints
    .filter((complaint) => visibleRouteIds.has(complaint.serviceRouteId))
    .slice(0, 8)
    .map((complaint) => ({
      id: complaint.id,
      summary: complaint.summary,
      category: complaint.category,
      status: complaint.status,
      reportedAt: complaint.reportedAt,
      routeName: complaint.serviceRoute.name,
      routeCode: complaint.serviceRoute.code,
      zoneName: complaint.serviceZone.name,
      meterNumber: complaint.meter?.meterNumber ?? null,
      customerName: complaint.customer?.name ?? null,
      accountNumber: complaint.customer?.accountNumber ?? null,
    }));
  const unroutedMeterCount = meters.filter((meter) => !meter.serviceRoute).length;
  const openComplaintCount = routeComplaints.filter(
    (complaint) =>
      complaint.status === ComplaintStatus.OPEN && visibleRouteIds.has(complaint.serviceRouteId)
  ).length;
  const topComplaintZone = [...zoneMetrics]
    .sort((left, right) => right.openComplaintCount - left.openComplaintCount)
    .find((zone) => zone.openComplaintCount > 0) ?? null;

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
          label: "Open complaints",
          value: openComplaintCount.toString(),
          detail: topComplaintZone
            ? `${topComplaintZone.name} currently carries ${topComplaintZone.openComplaintCount} open complaint${topComplaintZone.openComplaintCount === 1 ? "" : "s"}`
            : "Log route-linked complaints here to start ranking area pressure",
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
          currentRouteId: meter.serviceRoute?.id ?? null,
          currentRouteName: meter.serviceRoute?.name ?? null,
        }))}
      />

      <RouteComplaintPanel
        canManageRoutes={canManageRoutes}
        routes={routes.map((route) => ({
          id: route.id,
          name: route.name,
          code: route.code,
          zoneName: route.zone.name,
        }))}
        meterOptions={meters.map((meter) => ({
          id: meter.id,
          meterNumber: meter.meterNumber,
          customerName: meter.customer?.name ?? null,
          currentRouteId: meter.serviceRoute?.id ?? null,
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
        lossWatchlist={lossWatchlist}
        complaintWatchlist={complaintWatchlist}
        overdueAccounts={overdueAccounts}
        recentComplaints={recentComplaints}
        billingTrend={billingTrend}
        overdueAging={overdueAging}
        serviceActionTrend={serviceActionTrend}
      />
    </AdminPageShell>
  );
}
