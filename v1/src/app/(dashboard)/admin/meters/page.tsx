import { AdminPageActions } from "@/features/admin/components/admin-page-actions";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { ModuleAccessStateView } from "@/features/admin/components/module-access-state";
import { getModuleAccess } from "@/features/auth/lib/authorization";
import { MeterAssignmentForm } from "@/features/meters/components/meter-assignment-form";
import { MeterForm } from "@/features/meters/components/meter-form";
import { MeterHolderTransferForm } from "@/features/meters/components/meter-holder-transfer-form";
import { MeterList } from "@/features/meters/components/meter-list";
import { prisma } from "@/lib/prisma";

export default async function AdminMetersPage() {
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
      },
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        meterNumber: true,
      },
    }),
  ]);

  const assignedMeterCount = meters.filter((meter) => meter.customer).length;
  const activeMeterCount = meters.filter((meter) => meter.status === "ACTIVE").length;
  const routedMeterCount = meters.filter((meter) => meter.serviceRoute).length;
  const assignedMeters = meters.flatMap((meter) =>
    meter.customer
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

      <MeterList meters={meters} />
    </AdminPageShell>
  );
}
