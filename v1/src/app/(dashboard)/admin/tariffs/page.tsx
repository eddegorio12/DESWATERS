import { AdminPageActions } from "@/features/admin/components/admin-page-actions";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { AdminSurfacePanel } from "@/features/admin/components/admin-surface-panel";
import { ModuleAccessStateView } from "@/features/admin/components/module-access-state";
import {
  canPerformCapability,
  getModuleAccess,
} from "@/features/auth/lib/authorization";
import { TariffForm } from "@/features/tariffs/components/tariff-form";
import { TariffList } from "@/features/tariffs/components/tariff-list";
import { prisma } from "@/lib/prisma";

export default async function AdminTariffsPage() {
  const access = await getModuleAccess("tariffs");

  if (access.status !== "authorized") {
    return <ModuleAccessStateView module="tariffs" access={access} />;
  }

  const now = new Date();
  const tariffs = await prisma.tariff.findMany({
    orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      isActive: true,
      version: true,
      effectiveFrom: true,
      effectiveTo: true,
      changeReason: true,
      minimumCharge: true,
      minimumUsage: true,
      installationFee: true,
      penaltyRate: true,
      reconnectionFee: true,
      createdAt: true,
      createdBy: {
        select: {
          name: true,
        },
      },
      auditEvents: {
        orderBy: [{ createdAt: "desc" }],
        take: 3,
        select: {
          id: true,
          type: true,
          note: true,
          createdAt: true,
          actor: {
            select: {
              name: true,
            },
          },
        },
      },
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

  const activeTariff =
    tariffs.find(
      (tariff) =>
        tariff.effectiveFrom <= now && (!tariff.effectiveTo || tariff.effectiveTo >= now)
    ) ?? null;
  const totalTierCount = tariffs.reduce((sum, tariff) => sum + tariff.tiers.length, 0);
  const scheduledTariffCount = tariffs.filter((tariff) => tariff.effectiveFrom > now).length;
  const canCreateTariff = canPerformCapability(access.user.role, "tariffs:create");

  return (
    <AdminPageShell
      eyebrow="Billing Rules"
      title="Control the active water tariff with a clearer view of pricing logic and saved revisions."
      description="Configure the live billing tariff, maintain progressive usage tiers, and keep older tariff records visible so operations can confirm which pricing schedule is currently in force."
      actions={<AdminPageActions links={[{ href: "/admin/meters", label: "Meter module" }]} />}
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
          label: "Scheduled",
          value: scheduledTariffCount.toString(),
          detail: "Future tariff versions already queued by effectivity date",
          accent: "amber",
        },
        {
          label: "Defined tiers",
          value: totalTierCount.toString(),
          detail: "Progressive usage bands across all saved tariffs",
          accent: "sky",
        },
      ]}
    >
      <section className="grid gap-6 xl:grid-cols-[minmax(0,30rem)_minmax(0,1fr)]">
        {canCreateTariff ? (
          <TariffForm />
        ) : (
          <AdminSurfacePanel>
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/72">
                Read-Only Tariff Access
              </p>
              <h2 className="font-heading text-[1.8rem] leading-tight text-foreground">
                This role can review tariff history but cannot change pricing rules.
              </h2>
              <p className="text-sm leading-7 text-muted-foreground">
                Tariff creation and activation remain limited to managers and admins
                because those changes affect downstream billing calculations.
              </p>
            </div>
          </AdminSurfacePanel>
        )}
        <TariffList tariffs={tariffs} />
      </section>
    </AdminPageShell>
  );
}
