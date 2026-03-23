import Link from "next/link";

import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

import { buttonVariants } from "@/components/ui/button-variants";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { CustomerForm } from "@/features/customers/components/customer-form";
import { CustomerList } from "@/features/customers/components/customer-list";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export default async function AdminCustomersPage() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      accountNumber: true,
      name: true,
      address: true,
      contactNumber: true,
      status: true,
      createdAt: true,
      meters: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          meterNumber: true,
          status: true,
        },
      },
    },
  });

  const linkedMeterCount = customers.reduce((sum, customer) => sum + customer.meters.length, 0);
  const customersWithoutMeter = customers.filter((customer) => customer.meters.length === 0).length;

  return (
    <AdminPageShell
      eyebrow="Customer Operations"
      title="Build and audit the active consumer registry from one operations view."
      description="Create customer records, inspect service addresses and contact details, and verify which accounts still need a linked water meter before downstream reading and billing work starts."
      actions={
        <>
            <Link
              href="/admin/meters"
              className={cn(
                buttonVariants({
                  variant: "outline",
                  className:
                    "h-10 rounded-full border-white/18 bg-white/8 px-5 text-white hover:bg-white/12 hover:text-white",
                })
              )}
            >
              Meter module
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
          label: "Accounts",
          value: customers.length.toString(),
          detail: "Registered residential customer records",
          accent: "teal",
        },
        {
          label: "Linked meters",
          value: linkedMeterCount.toString(),
          detail: "Meters already assigned to customer accounts",
          accent: "sky",
        },
        {
          label: "Needs setup",
          value: customersWithoutMeter.toString(),
          detail: "Accounts still waiting for a service meter",
          accent: "amber",
        },
      ]}
    >
        <section className="grid gap-6 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
          <CustomerForm />
          <CustomerList customers={customers} />
        </section>
    </AdminPageShell>
  );
}
