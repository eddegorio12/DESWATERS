import Link from "next/link";
import { Role } from "@prisma/client";

import { buttonVariants } from "@/components/ui/button-variants";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { AdminSessionButton } from "@/features/auth/components/admin-session-button";
import { ModuleAccessStateView } from "@/features/admin/components/module-access-state";
import { StaffAccessBoard } from "@/features/auth/components/staff-access-board";
import { getModuleAccess } from "@/features/auth/lib/authorization";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

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
      lastLoginAt: true,
      createdAt: true,
    },
  });

  return (
    <AdminPageShell
      eyebrow="Admin Management"
      title="Manage internal admin accounts."
      description="SUPER_ADMIN accounts can create admins, change roles, and deactivate or reactivate access here. There is no public signup flow."
      actions={
        <>
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
          label: "Super Admins",
          value: admins.filter((user) => user.role === Role.SUPER_ADMIN).length.toString(),
          detail: "Accounts with admin-management authority",
          accent: "violet",
        },
      ]}
    >
      <StaffAccessBoard admins={admins} />
    </AdminPageShell>
  );
}
