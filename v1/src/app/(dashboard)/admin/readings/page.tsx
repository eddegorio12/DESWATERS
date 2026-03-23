import Link from "next/link";

import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { MeterStatus } from "@prisma/client";

import { buttonVariants } from "@/components/ui/button-variants";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
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

  const flaggedForEntryCount = meterOptions.length;

  return (
    <AdminPageShell
      eyebrow="Reading Operations"
      title="Move field submissions from meter entry to bill-ready approval without losing audit visibility."
      description="Encode readings for active service connections, inspect the pending review queue, and keep the most recent encoding history available for correction, supervision, and downstream billing handoff."
      actions={
        <>
            <Link
              href="/admin/billing"
              className={cn(
                buttonVariants({
                  variant: "outline",
                  className:
                    "h-10 rounded-full border-white/18 bg-white/8 px-5 text-white hover:bg-white/12 hover:text-white",
                })
              )}
            >
              Billing module
            </Link>
            <Link
              href="/admin/tariffs"
              className={cn(
                buttonVariants({
                  variant: "outline",
                  className:
                    "h-10 rounded-full border-white/18 bg-white/8 px-5 text-white hover:bg-white/12 hover:text-white",
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
          label: "Active meters",
          value: flaggedForEntryCount.toString(),
          detail: "Assigned active meters ready for new reading entry",
          accent: "teal",
        },
        {
          label: "Pending review",
          value: pendingReadings.length.toString(),
          detail: "Encoded submissions waiting for approval",
          accent: "amber",
        },
        {
          label: "Recent history",
          value: readings.length.toString(),
          detail: "Latest recorded readings in the activity log",
          accent: "sky",
        },
      ]}
    >

        <section className="grid gap-6 xl:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
          <ReadingForm meters={meterOptions} />
        </section>

        <PendingReadingApprovals readings={pendingReadings} />
        <ReadingList readings={readings} />
    </AdminPageShell>
  );
}
