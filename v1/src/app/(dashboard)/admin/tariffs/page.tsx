import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { ModuleAccessStateView } from "@/features/admin/components/module-access-state";
import { AdminSessionButton } from "@/features/auth/components/admin-session-button";
import {
  canPerformCapability,
  getModuleAccess,
} from "@/features/auth/lib/authorization";
import { TariffForm } from "@/features/tariffs/components/tariff-form";
import { TariffList } from "@/features/tariffs/components/tariff-list";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export default async function AdminTariffsPage() {
  const access = await getModuleAccess("tariffs");

  if (access.status !== "authorized") {
    return <ModuleAccessStateView module="tariffs" access={access} />;
  }

  const tariffs = await prisma.tariff.findMany({
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      isActive: true,
      minimumCharge: true,
      minimumUsage: true,
      installationFee: true,
      createdAt: true,
      tiers: {
        orderBy: [{ minVolume: "asc" }],
        select: {
          id: true,
          minVolume: true,
          maxVolume: true,
          ratePerCuM: true,
        },
      },
    },
  });

  const activeTariff = tariffs.find((tariff) => tariff.isActive) ?? null;
  const totalTierCount = tariffs.reduce((sum, tariff) => sum + tariff.tiers.length, 0);
  const canCreateTariff = canPerformCapability(access.user.role, "tariffs:create");

  return (
    <AdminPageShell
      eyebrow="Billing Rules"
      title="Control the active water tariff with a clearer view of pricing logic and saved revisions."
      description="Configure the live billing tariff, maintain progressive usage tiers, and keep older tariff records visible so operations can confirm which pricing schedule is currently in force."
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
            <AdminSessionButton />
        </>
      }
      stats={[
        {
          label: "Saved tariffs",
          value: tariffs.length.toString(),
          detail: "Billing configurations retained in the registry",
          accent: "teal",
        },
        {
          label: "Active rule",
          value: activeTariff ? activeTariff.name : "Not set",
          detail: activeTariff
            ? "Tariff currently used for new bill generation"
            : "Create a tariff to enable billing",
          accent: "violet",
        },
        {
          label: "Defined tiers",
          value: totalTierCount.toString(),
          detail: "Progressive usage bands across all saved tariffs",
          accent: "amber",
        },
      ]}
    >

        <section className="grid gap-6 xl:grid-cols-[minmax(0,30rem)_minmax(0,1fr)]">
          {canCreateTariff ? (
            <TariffForm />
          ) : (
            <section className="rounded-[1.9rem] border border-[#dbe9e5] bg-white/92 p-6 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.55)]">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Read-Only Tariff Access
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  This role can review tariff history but cannot change pricing rules.
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Tariff creation and activation remain limited to managers and admins
                  because those changes affect downstream billing calculations.
                </p>
              </div>
            </section>
          )}
          <TariffList tariffs={tariffs} />
        </section>
    </AdminPageShell>
  );
}
