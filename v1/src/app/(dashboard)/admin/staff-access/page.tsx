import { AdminPageActions } from "@/features/admin/components/admin-page-actions";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { ModuleAccessStateView } from "@/features/admin/components/module-access-state";
import { StaffAccessBoard } from "@/features/auth/components/staff-access-board";
import { getModuleAccess } from "@/features/auth/lib/authorization";
import { prisma } from "@/lib/prisma";

export default async function AdminStaffAccessPage() {
  const access = await getModuleAccess("staffAccess");

  if (access.status !== "authorized") {
    return <ModuleAccessStateView module="staffAccess" access={access} />;
  }

  const admins = await prisma.user.findMany({
    orderBy: [{ isActive: "desc" }, { role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      failedSignInCount: true,
      lockedUntil: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  const recentLoginAttempts = await prisma.adminLoginAttempt.findMany({
    orderBy: [{ attemptedAt: "desc" }],
    take: 20,
    select: {
      id: true,
      email: true,
      status: true,
      failureReason: true,
      ipAddress: true,
      userAgent: true,
      attemptedAt: true,
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  return (
    <AdminPageShell
      eyebrow="Admin Management"
      title="Manage internal admin accounts."
      description="SUPER_ADMIN accounts can create admins, change roles, and deactivate or reactivate access here. There is no public signup flow."
      actions={<AdminPageActions />}
      stats={[
        {
          label: "Total Admins",
          value: admins.length.toString(),
          detail: "Admin accounts in the DWDS database",
          accent: "teal",
        },
        {
          label: "Active",
          value: admins.filter((user) => user.isActive).length.toString(),
          detail: "Accounts that can currently sign in",
          accent: "sky",
        },
        {
          label: "Inactive",
          value: admins.filter((user) => !user.isActive).length.toString(),
          detail: "Accounts blocked from sign-in",
          accent: "rose",
        },
        {
          label: "Locked",
          value: admins
            .filter((user) => user.lockedUntil && user.lockedUntil > new Date())
            .length.toString(),
          detail: "Accounts currently blocked by failed-login lockout",
          accent: "violet",
        },
      ]}
    >
      <StaffAccessBoard admins={admins} recentLoginAttempts={recentLoginAttempts} />
    </AdminPageShell>
  );
}
