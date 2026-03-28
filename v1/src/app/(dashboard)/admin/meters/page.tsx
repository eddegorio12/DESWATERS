import { AdminPageActions } from "@/features/admin/components/admin-page-actions";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { ModuleAccessStateView } from "@/features/admin/components/module-access-state";
import {
  getSearchParamText,
  matchesSearch,
  type SearchParamValue,
} from "@/features/admin/lib/list-filters";
import { getModuleAccess } from "@/features/auth/lib/authorization";
import { MeterAssignmentForm } from "@/features/meters/components/meter-assignment-form";
import { MeterForm } from "@/features/meters/components/meter-form";
import { MeterHolderTransferForm } from "@/features/meters/components/meter-holder-transfer-form";
import { MeterList } from "@/features/meters/components/meter-list";
import { prisma } from "@/lib/prisma";

type MeterPageProps = {
  searchParams: Promise<Record<string, SearchParamValue>>;
};

export default async function AdminMetersPage({ searchParams }: MeterPageProps) {
  const access = await getModuleAccess("meters");

  if (access.status !== "authorized") {
    return <ModuleAccessStateView module="meters" access={access} />;
  }

  const [meters, customers, unassignedMeters] = await Promise.all([
    prisma.meter.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        meterNumber: true,
        installDate: true,
        status: true,
        serviceZone: {
          select: {
            name: true,
          },
        },
        serviceRoute: {
          select: {
            code: true,
            name: true,
          },
        },
        customer: {
          select: {
            accountNumber: true,
            name: true,
          },
        },
        holderTransfers: {
          orderBy: [{ effectiveDate: "desc" }, { createdAt: "desc" }],
          take: 3,
          select: {
            id: true,
            effectiveDate: true,
            transferReading: true,
            reason: true,
            fromCustomer: {
              select: {
                accountNumber: true,
                name: true,
              },
            },
            toCustomer: {
              select: {
                accountNumber: true,
                name: true,
              },
            },
          },
        },
        replacedMeterHistory: {
          orderBy: [{ replacementDate: "desc" }],
          take: 3,
          select: {
            id: true,
            replacementDate: true,
            finalReading: true,
            reason: true,
            replacementMeter: {
              select: {
                meterNumber: true,
              },
            },
          },
        },
      },
    }),
    prisma.customer.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        accountNumber: true,
        name: true,
      },
    }),
    prisma.meter.findMany({
      where: {
        customerId: null,
        status: "ACTIVE",
      },
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        meterNumber: true,
      },
    }),
  ]);
  const filters = await searchParams;
  const query = getSearchParamText(filters.query);
  const registry = getSearchParamText(filters.registry) as
    | "ALL"
    | "ACTIVE"
    | "UNASSIGNED"
    | "UNROUTED"
    | "DEFECTIVE"
    | "REPLACED";
  const filteredMeters = meters.filter((meter) => {
    const matchesRegistry =
      !registry || registry === "ALL"
        ? true
        : registry === "UNASSIGNED"
          ? !meter.customer
          : registry === "UNROUTED"
            ? !meter.serviceRoute
            : meter.status === registry;

    return (
      matchesRegistry &&
      matchesSearch(
        [
          meter.meterNumber,
          meter.customer?.name,
          meter.customer?.accountNumber,
          meter.serviceRoute?.code,
          meter.serviceRoute?.name,
          meter.serviceZone?.name,
          ...meter.holderTransfers.flatMap((transfer) => [
            transfer.fromCustomer?.name,
            transfer.fromCustomer?.accountNumber,
            transfer.toCustomer.name,
            transfer.toCustomer.accountNumber,
            transfer.reason,
          ]),
          ...meter.replacedMeterHistory.flatMap((entry) => [
            entry.replacementMeter.meterNumber,
            entry.reason,
          ]),
        ],
        query
      )
    );
  });

  const assignedMeterCount = meters.filter((meter) => meter.customer).length;
  const activeMeterCount = meters.filter((meter) => meter.status === "ACTIVE").length;
  const routedMeterCount = meters.filter((meter) => meter.serviceRoute).length;
  const assignedMeters = meters.flatMap((meter) =>
    meter.customer && meter.status === "ACTIVE"
      ? [
          {
            id: meter.id,
            meterNumber: meter.meterNumber,
            customer: meter.customer,
          },
        ]
      : []
  );

  return (
    <AdminPageShell
      eyebrow="Meter Operations"
      title="Keep every service connection visible from registration through assignment."
      description="Register new hardware, link unassigned meters to active customer accounts, and confirm which installed units are already in service versus still waiting for deployment."
      actions={
        <AdminPageActions
          links={[
            { href: "/admin/customers", label: "Customer module" },
            { href: "/admin/routes", label: "Route operations" },
          ]}
        />
      }
      stats={[
        {
          label: "Registered",
          value: meters.length.toString(),
          detail: "Meters recorded in the utility registry",
          accent: "teal",
        },
        {
          label: "In service",
          value: assignedMeterCount.toString(),
          detail: "Meters already linked to a customer account",
          accent: "sky",
        },
        {
          label: "Active units",
          value: activeMeterCount.toString(),
          detail: "Meters currently marked active",
          accent: "violet",
        },
        {
          label: "Routed",
          value: routedMeterCount.toString(),
          detail: "Meters already mapped to a zone and route",
          accent: "sky",
        },
        {
          label: "Unassigned",
          value: unassignedMeters.length.toString(),
          detail: "Meters still available for customer linkage",
          accent: "amber",
        },
      ]}
    >
      <section className="grid gap-6 xl:grid-cols-3">
        <MeterForm />
        <MeterAssignmentForm customers={customers} unassignedMeters={unassignedMeters} />
        <MeterHolderTransferForm customers={customers} assignedMeters={assignedMeters} />
      </section>

      <MeterList
        meters={filteredMeters}
        totalCount={meters.length}
        query={query}
        registry={registry || "ALL"}
      />
    </AdminPageShell>
  );
}
