import Link from "next/link";

import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

import { buttonVariants } from "@/components/ui/button-variants";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { ModuleAccessStateView } from "@/features/admin/components/module-access-state";
import { getModuleAccess } from "@/features/auth/lib/authorization";
import { MeterAssignmentForm } from "@/features/meters/components/meter-assignment-form";
import { MeterForm } from "@/features/meters/components/meter-form";
import { MeterList } from "@/features/meters/components/meter-list";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export default async function AdminMetersPage() {
  const access = await getModuleAccess("meters");

  if (access.status !== "authorized") {
    return <ModuleAccessStateView module="meters" access={access} />;
  }

  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const [meters, customers, unassignedMeters] = await Promise.all([
    prisma.meter.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        meterNumber: true,
        installDate: true,
        status: true,
        customer: {
          select: {
            accountNumber: true,
            name: true,
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

  return (
    <AdminPageShell
      eyebrow="Meter Operations"
      title="Keep every service connection visible from registration through assignment."
      description="Register new hardware, link unassigned meters to active customer accounts, and confirm which installed units are already in service versus still waiting for deployment."
      actions={
        <>
            <Link
              href="/admin/customers"
              className={cn(
                buttonVariants({
                  variant: "outline",
                  className:
                    "h-10 rounded-full border-white/18 bg-white/8 px-5 text-white hover:bg-white/12 hover:text-white",
                })
              )}
            >
              Customer module
            </Link>
            <Link
              href="/admin/dashboard"
              className={cn(
                buttonVariants({
                  variant: "outline",
                  className:
                    "h-10 rounded-full border-white/18 bg-white/8 px-5 text-white hover:bg-white/12 hover:text-white",
                })
              )}
            >
              Back to dashboard
            </Link>
            <UserButton />
        </>
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
          label: "Unassigned",
          value: unassignedMeters.length.toString(),
          detail: "Meters still available for customer linkage",
          accent: "amber",
        },
      ]}
    >

        <section className="grid gap-6 xl:grid-cols-2">
          <MeterForm />
          <MeterAssignmentForm customers={customers} unassignedMeters={unassignedMeters} />
        </section>

        <MeterList meters={meters} />
    </AdminPageShell>
  );
}
