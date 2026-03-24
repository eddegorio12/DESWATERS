"use server";

import { Role, StaffApprovalStatus } from "@prisma/client";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

function getDisplayName(user: Awaited<ReturnType<typeof currentUser>>) {
  if (!user) {
    return null;
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();

  return (
    fullName ||
    user.username ||
    user.primaryEmailAddress?.emailAddress ||
    user.id
  );
}

export async function syncCurrentUser() {
  const { userId, isAuthenticated } = await auth();

  if (!isAuthenticated || !userId) {
    throw new Error("You must be signed in to sync your account.");
  }

  const clerkUser = await currentUser();
  const email = clerkUser?.primaryEmailAddress?.emailAddress;
  const name = getDisplayName(clerkUser);

  if (!clerkUser || !email || !name) {
    throw new Error("Clerk user profile is missing a primary email address.");
  }

  const localUser = await prisma.$transaction(async (tx) => {
    const existingByClerkId = await tx.user.findUnique({
      where: { clerkId: userId },
    });

    if (existingByClerkId) {
      return tx.user.update({
        where: { id: existingByClerkId.id },
        data: {
          email,
          name,
        },
      });
    }

    const existingByEmail = await tx.user.findUnique({
      where: { email },
    });

    if (existingByEmail) {
      return tx.user.update({
        where: { id: existingByEmail.id },
        data: {
          clerkId: userId,
          name,
        },
      });
    }

    return tx.user.create({
      data: {
        clerkId: userId,
        email,
        name,
        role: Role.CUSTOMER_SERVICE,
        active: false,
        approvalStatus: StaffApprovalStatus.PENDING,
        approvalNote: "Awaiting admin or manager approval for first-time staff access.",
        approvalUpdatedAt: new Date(),
      },
    });
  });

  revalidatePath("/admin/staff-access");
  revalidatePath("/admin/dashboard");

  return {
    localUserId: localUser.id,
    role: localUser.role,
    approvalStatus: localUser.approvalStatus,
  };
}
