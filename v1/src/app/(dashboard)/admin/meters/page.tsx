import Link from "next/link";

import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

import { buttonVariants } from "@/components/ui/button-variants";
import { MeterAssignmentForm } from "@/features/meters/components/meter-assignment-form";
import { MeterForm } from "@/features/meters/components/meter-form";
import { MeterList } from "@/features/meters/components/meter-list";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export default async function AdminMetersPage() {
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

  return (
    <main className="min-h-screen bg-muted/30 px-6 py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-border bg-background px-6 py-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Meter Operations
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Meter Management
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Register service meters, assign unlinked meters to existing customers, and
              verify the assignment appears in the registries immediately.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/customers"
              className={cn(
                buttonVariants({
                  variant: "outline",
                  className: "h-10 rounded-xl px-4",
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
                  className: "h-10 rounded-xl px-4",
                })
              )}
            >
              Back to dashboard
            </Link>
            <UserButton />
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-2">
          <MeterForm />
          <MeterAssignmentForm customers={customers} unassignedMeters={unassignedMeters} />
        </section>

        <MeterList meters={meters} />
      </div>
    </main>
  );
}
