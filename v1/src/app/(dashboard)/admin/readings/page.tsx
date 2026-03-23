import Link from "next/link";

import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { MeterStatus } from "@prisma/client";

import { buttonVariants } from "@/components/ui/button-variants";
import { PendingReadingApprovals } from "@/features/readings/components/pending-reading-approvals";
import { ReadingForm } from "@/features/readings/components/reading-form";
import { ReadingList } from "@/features/readings/components/reading-list";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export default async function AdminReadingsPage() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const [meters, pendingReadings, readings] = await Promise.all([
    prisma.meter.findMany({
      where: {
        customerId: {
          not: null,
        },
        status: MeterStatus.ACTIVE,
      },
      orderBy: [{ meterNumber: "asc" }],
      select: {
        id: true,
        meterNumber: true,
        customer: {
          select: {
            accountNumber: true,
            name: true,
          },
        },
        readings: {
          orderBy: [{ readingDate: "desc" }],
          take: 1,
          select: {
            currentReading: true,
          },
        },
      },
    }),
    prisma.reading.findMany({
      where: {
        status: "PENDING_REVIEW",
      },
      orderBy: [{ readingDate: "asc" }],
      select: {
        id: true,
        readingDate: true,
        previousReading: true,
        currentReading: true,
        consumption: true,
        meter: {
          select: {
            meterNumber: true,
            customer: {
              select: {
                accountNumber: true,
                name: true,
              },
            },
          },
        },
        reader: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.reading.findMany({
      orderBy: [{ readingDate: "desc" }],
      take: 20,
      select: {
        id: true,
        readingDate: true,
        previousReading: true,
        currentReading: true,
        consumption: true,
        status: true,
        meter: {
          select: {
            meterNumber: true,
            customer: {
              select: {
                accountNumber: true,
                name: true,
              },
            },
          },
        },
        reader: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  const meterOptions = meters
    .filter((meter) => meter.customer)
    .map((meter) => ({
      id: meter.id,
      meterNumber: meter.meterNumber,
      customerName: meter.customer!.name,
      accountNumber: meter.customer!.accountNumber,
      previousReading: meter.readings[0]?.currentReading ?? 0,
    }));

  return (
    <main className="min-h-screen bg-muted/30 px-6 py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-border bg-background px-6 py-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Step 3.2
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Reading Approval Workflow
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Review the pending reading queue, approve readings individually or in bulk,
              and keep encoding history visible for audit and correction work.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/tariffs"
              className={cn(
                buttonVariants({
                  variant: "outline",
                  className: "h-10 rounded-xl px-4",
                })
              )}
            >
              Tariff module
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

        <section className="grid gap-6 xl:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
          <ReadingForm meters={meterOptions} />
        </section>

        <PendingReadingApprovals readings={pendingReadings} />
        <ReadingList readings={readings} />
      </div>
    </main>
  );
}
