"use server";

import { Role, StaffApprovalStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requireStaffCapability } from "@/features/auth/lib/authorization";
import { prisma } from "@/lib/prisma";

function parseRole(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  return Object.values(Role).includes(value as Role) ? (value as Role) : null;
}

function parseUserId(value: FormDataEntryValue | null) {
  return typeof value === "string" && value ? value : null;
}

function revalidateStaffAccessPages() {
  revalidatePath("/admin/staff-access");
  revalidatePath("/admin/dashboard");
}

export async function approveStaffAccess(formData: FormData) {
  const reviewer = await requireStaffCapability("staff:approve");
  const userId = parseUserId(formData.get("userId"));
  const role = parseRole(formData.get("role"));

  if (!userId || !role) {
    throw new Error("A valid staff request and role are required for approval.");
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      role,
      active: true,
      approvalStatus: StaffApprovalStatus.APPROVED,
      approvalNote: "Approved for DWDS staff access.",
      approvalUpdatedAt: new Date(),
      approvalUpdatedById: reviewer.id,
    },
  });

  revalidateStaffAccessPages();
}

export async function rejectStaffAccess(formData: FormData) {
  const reviewer = await requireStaffCapability("staff:approve");
  const userId = parseUserId(formData.get("userId"));

  if (!userId) {
    throw new Error("A valid staff request is required for rejection.");
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      active: false,
      approvalStatus: StaffApprovalStatus.REJECTED,
      approvalNote: "Rejected for DWDS staff access.",
      approvalUpdatedAt: new Date(),
      approvalUpdatedById: reviewer.id,
    },
  });

  revalidateStaffAccessPages();
}

export async function reactivateStaffAccess(formData: FormData) {
  const reviewer = await requireStaffCapability("staff:approve");
  const userId = parseUserId(formData.get("userId"));

  if (!userId) {
    throw new Error("A valid staff account is required for reactivation.");
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      active: true,
      approvalStatus: StaffApprovalStatus.APPROVED,
      approvalNote: "Reactivated for DWDS staff access.",
      approvalUpdatedAt: new Date(),
      approvalUpdatedById: reviewer.id,
    },
  });

  revalidateStaffAccessPages();
}

export async function deactivateStaffAccess(formData: FormData) {
  const reviewer = await requireStaffCapability("staff:approve");
  const userId = parseUserId(formData.get("userId"));

  if (!userId) {
    throw new Error("A valid staff account is required for deactivation.");
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      active: false,
      approvalStatus: StaffApprovalStatus.APPROVED,
      approvalNote: "Deactivated by an admin or manager.",
      approvalUpdatedAt: new Date(),
      approvalUpdatedById: reviewer.id,
    },
  });

  revalidateStaffAccessPages();
}
