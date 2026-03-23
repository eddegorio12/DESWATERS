"use server";

import { Role } from "@prisma/client";
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

  const localUser = await prisma.user.upsert({
    where: { clerkId: userId },
    update: {
      email,
      name,
      active: true,
    },
    create: {
      clerkId: userId,
      email,
      name,
      role: Role.CUSTOMER_SERVICE,
      active: true,
    },
  });

  revalidatePath("/admin/dashboard");

  return {
    localUserId: localUser.id,
    role: localUser.role,
  };
}
