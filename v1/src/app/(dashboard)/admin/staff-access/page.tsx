import Link from "next/link";

import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { StaffApprovalStatus } from "@prisma/client";

import { buttonVariants } from "@/components/ui/button-variants";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
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

  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const [pendingUsers, approvedUsers, rejectedUsers] = await Promise.all([
    prisma.user.findMany({
      where: {
        approvalStatus: StaffApprovalStatus.PENDING,
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        approvalStatus: true,
        approvalNote: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.findMany({
      where: {
        approvalStatus: StaffApprovalStatus.APPROVED,
      },
      orderBy: [{ active: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        approvalStatus: true,
        approvalNote: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.findMany({
      where: {
        approvalStatus: StaffApprovalStatus.REJECTED,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        approvalStatus: true,
        approvalNote: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  return (
    <AdminPageShell
      eyebrow="Staff Access"
      title="Authorize Clerk accounts before they enter the DWDS dashboard."
      description="New sign-ins now remain blocked until an admin or manager explicitly approves the local staff account. Approved accounts can also be deactivated or reactivated here."
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
          <UserButton />
        </>
      }
      stats={[
        {
          label: "Pending",
          value: pendingUsers.length.toString(),
          detail: "New staff requests waiting for review",
          accent: "amber",
        },
        {
          label: "Approved",
          value: approvedUsers.filter((user) => user.active).length.toString(),
          detail: "Approved accounts with active dashboard access",
          accent: "teal",
        },
        {
          label: "Inactive",
          value: approvedUsers.filter((user) => !user.active).length.toString(),
          detail: "Approved staff accounts that are currently deactivated",
          accent: "rose",
        },
        {
          label: "Rejected",
          value: rejectedUsers.length.toString(),
          detail: "Most recent rejected staff requests",
          accent: "violet",
        },
      ]}
    >
      <StaffAccessBoard
        pendingUsers={pendingUsers}
        approvedUsers={approvedUsers}
        rejectedUsers={rejectedUsers}
      />
    </AdminPageShell>
  );
}
