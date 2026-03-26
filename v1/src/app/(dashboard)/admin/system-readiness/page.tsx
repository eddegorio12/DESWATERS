import { AdminPageActions } from "@/features/admin/components/admin-page-actions";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { ModuleAccessStateView } from "@/features/admin/components/module-access-state";
import { getModuleAccess } from "@/features/auth/lib/authorization";
import { SystemReadinessBoard } from "@/features/system-readiness/components/system-readiness-board";
import { prisma } from "@/lib/prisma";

export default async function AdminSystemReadinessPage() {
  const access = await getModuleAccess("systemReadiness");

  if (access.status !== "authorized") {
    return <ModuleAccessStateView module="systemReadiness" access={access} />;
  }

  const [backupSnapshots, recentLoginAttempts] = await Promise.all([
    prisma.backupSnapshot.findMany({
      orderBy: [{ recordedAt: "desc" }],
      take: 12,
      select: {
        id: true,
        snapshotMonth: true,
        label: true,
        provider: true,
        storageReference: true,
        status: true,
        notes: true,
        recordedAt: true,
        createdBy: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.adminLoginAttempt.findMany({
      orderBy: [{ attemptedAt: "desc" }],
      take: 6,
      select: {
        id: true,
        email: true,
        status: true,
        attemptedAt: true,
      },
    }),
  ]);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthSnapshots = backupSnapshots.filter(
    (snapshot) => snapshot.snapshotMonth === currentMonth
  );

  return (
    <AdminPageShell
      eyebrow="System Readiness"
      title="Keep recovery readiness and admin security visible from inside operations."
      description="Keep backup snapshot logging, restore procedure guidance, environment readiness checks, and recent security signal visibility visible for internal staff access."
      actions={<AdminPageActions links={[{ href: "/admin/staff-access", label: "Staff access" }]} />}
      stats={[
        {
          label: "Logged snapshots",
          value: backupSnapshots.length.toString(),
          detail: "Most recent monthly exports recorded inside DWDS",
          accent: "teal",
        },
        {
          label: "This month",
          value: currentMonthSnapshots.length.toString(),
          detail: "Snapshots logged for the current calendar month",
          accent: "amber",
        },
        {
          label: "Recent sign-ins",
          value: recentLoginAttempts.length.toString(),
          detail: "Latest login outcomes sampled for quick security review",
          accent: "violet",
        },
      ]}
    >
      <SystemReadinessBoard
        backupSnapshots={backupSnapshots}
        recentLoginAttempts={recentLoginAttempts}
        envReadiness={{
          databaseUrl: Boolean(process.env.DATABASE_URL),
          directUrl: Boolean(process.env.DIRECT_URL),
          authSecret: Boolean(process.env.AUTH_SECRET),
        }}
      />
    </AdminPageShell>
  );
}
