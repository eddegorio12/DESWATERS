import Link from "next/link";

import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

import { buttonVariants } from "@/components/ui/button-variants";
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

  return (
    <main className="min-h-screen bg-muted/30 px-6 py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-border bg-background px-6 py-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Step 2.1
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Customer Management
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Create customer records and review linked service meters from the same
              registry after Step 2.2 assignments.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/meters"
              className={cn(
                buttonVariants({
                  variant: "outline",
                  className: "h-10 rounded-xl px-4",
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
                  className: "h-10 rounded-xl px-4",
                })
              )}
            >
              Back to dashboard
            </Link>
            <UserButton />
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
          <CustomerForm />
          <CustomerList customers={customers} />
        </section>
      </div>
    </main>
  );
}
