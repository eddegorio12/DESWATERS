import Link from "next/link";

import { MeterStatus } from "@prisma/client";

import { buttonVariants } from "@/components/ui/button-variants";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { ModuleAccessStateView } from "@/features/admin/components/module-access-state";
import { AdminSessionButton } from "@/features/auth/components/admin-session-button";
import {
  canPerformCapability,
  getModuleAccess,
} from "@/features/auth/lib/authorization";
import { PendingReadingApprovals } from "@/features/readings/components/pending-reading-approvals";
import { ReadingForm } from "@/features/readings/components/reading-form";
import { ReadingList } from "@/features/readings/components/reading-list";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export default async function AdminReadingsPage() {
  const access = await getModuleAccess("readings");

  if (access.status !== "authorized") {
    return <ModuleAccessStateView module="readings" access={access} />;
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
            id: true,
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
            id: true,
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
  const canCreateReading = canPerformCapability(access.user.role, "readings:create");
  const canApproveReading = canPerformCapability(access.user.role, "readings:approve");
  const canDeleteAnyReading = canPerformCapability(access.user.role, "readings:delete:any");
  const canDeleteOwnReading = canPerformCapability(access.user.role, "readings:delete:own");

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
            <AdminSessionButton />
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

        {canCreateReading ? (
          <section className="grid gap-6 xl:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
            <ReadingForm meters={meterOptions} />
          </section>
        ) : (
          <section className="rounded-[1.9rem] border border-[#dbe9e5] bg-white/92 p-6 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.55)]">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Read-Only Entry
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                This role cannot encode new readings.
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Meter reading entry remains limited to field readers, managers, and admins.
                You can still review pending submissions and recent reading history here.
              </p>
            </div>
          </section>
        )}

        <PendingReadingApprovals
          readings={pendingReadings}
          canApprove={canApproveReading}
          canDeleteAny={canDeleteAnyReading}
          canDeleteOwn={canDeleteOwnReading}
          currentUserId={access.user.id}
        />
        <ReadingList
          readings={readings}
          canDeleteAny={canDeleteAnyReading}
          canDeleteOwn={canDeleteOwnReading}
          currentUserId={access.user.id}
        />
    </AdminPageShell>
  );
}
