"use server";

import bcrypt from "bcrypt";
import { AuthError } from "next-auth";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth, signIn, signOut } from "@/auth";
import { requireStaffCapability, roleDisplayName } from "@/features/auth/lib/authorization";
import { prisma } from "@/lib/prisma";

const authenticateSchema = z.object({
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
  password: z.string().min(1, "Enter your password."),
  callbackUrl: z.string().trim().optional(),
});

const createAdminSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
  role: z.nativeEnum(Role),
  password: z
    .string()
    .min(8, "Temporary password must be at least 8 characters.")
    .max(72, "Temporary password must be 72 characters or fewer."),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters.")
      .max(72, "New password must be 72 characters or fewer."),
    confirmPassword: z.string().min(1, "Confirm the new password."),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "New password confirmation does not match.",
    path: ["confirmPassword"],
  });

const setTemporaryPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Temporary password must be at least 8 characters.")
    .max(72, "Temporary password must be 72 characters or fewer."),
});

const adminRoleOptions = [
  Role.SUPER_ADMIN,
  Role.ADMIN,
  Role.BILLING,
  Role.CASHIER,
  Role.METER_READER,
  Role.TECHNICIAN,
  Role.VIEWER,
] as const;

function parseRole(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  return adminRoleOptions.includes(value as Role) ? (value as Role) : null;
}

function parseUserId(value: FormDataEntryValue | null) {
  return typeof value === "string" && value ? value : null;
}

function revalidateAdminManagementPages() {
  revalidatePath("/dashboard");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/staff-access");
  revalidatePath("/admin/system-readiness");
}

function logAdminManagementEvent(input: {
  action: string;
  actorId: string;
  actorEmail: string;
  targetUserId: string;
  targetEmail: string;
  detail: string;
}) {
  // TODO: persist these admin-management events to a dedicated audit log table when one exists.
  console.info("[admin-auth]", input);
}

export type SignInFormState = {
  error?: string;
};

export async function authenticate(
  _previousState: SignInFormState | undefined,
  formData: FormData
): Promise<SignInFormState | undefined> {
  const parsedCredentials = authenticateSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsedCredentials.success) {
    return {
      error: parsedCredentials.error.issues[0]?.message ?? "Invalid email or password.",
    };
  }

  try {
    await signIn("credentials", {
      email: parsedCredentials.data.email,
      password: parsedCredentials.data.password,
      redirectTo:
        parsedCredentials.data.callbackUrl?.startsWith("/")
          ? parsedCredentials.data.callbackUrl
          : "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return {
          error: "Invalid email or password, or this admin account is inactive.",
        };
      }

      return {
        error: "Sign-in failed. Please try again.",
      };
    }

    throw error;
  }
}

export async function signOutAction() {
  await signOut({
    redirectTo: "/sign-in",
  });
}

export async function createAdminAccount(formData: FormData) {
  const actor = await requireStaffCapability("admins:manage");

  const parsedInput = createAdminSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: parseRole(formData.get("role")),
    password: formData.get("password"),
  });

  if (!parsedInput.success) {
    throw new Error(parsedInput.error.issues[0]?.message ?? "Invalid admin account details.");
  }

  const existingAdmin = await prisma.user.findUnique({
    where: { email: parsedInput.data.email },
    select: { id: true },
  });

  if (existingAdmin) {
    throw new Error("An admin account with that email already exists.");
  }

  const passwordHash = await bcrypt.hash(parsedInput.data.password, 12);

  const createdAdmin = await prisma.user.create({
    data: {
      name: parsedInput.data.name,
      email: parsedInput.data.email,
      passwordHash,
      mustChangePassword: true,
      role: parsedInput.data.role,
      isActive: true,
    },
    select: {
      id: true,
      email: true,
    },
  });

  logAdminManagementEvent({
    action: "create_admin",
    actorId: actor.id,
    actorEmail: actor.email,
    targetUserId: createdAdmin.id,
    targetEmail: createdAdmin.email,
    detail: `Created ${roleDisplayName[parsedInput.data.role]} account.`,
  });

  revalidateAdminManagementPages();
}

export async function updateAdminRole(formData: FormData) {
  const actor = await requireStaffCapability("admins:manage");
  const userId = parseUserId(formData.get("userId"));
  const role = parseRole(formData.get("role"));

  if (!userId || !role) {
    throw new Error("A valid admin account and role are required.");
  }

  const targetAdmin = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true },
  });

  if (!targetAdmin) {
    throw new Error("That admin account no longer exists.");
  }

  await prisma.user.update({
    where: { id: targetAdmin.id },
    data: { role },
  });

  logAdminManagementEvent({
    action: "change_role",
    actorId: actor.id,
    actorEmail: actor.email,
    targetUserId: targetAdmin.id,
    targetEmail: targetAdmin.email,
    detail: `Changed role from ${roleDisplayName[targetAdmin.role]} to ${roleDisplayName[role]}.`,
  });

  revalidateAdminManagementPages();
}

export async function toggleAdminActiveState(formData: FormData) {
  const actor = await requireStaffCapability("admins:manage");
  const userId = parseUserId(formData.get("userId"));

  if (!userId) {
    throw new Error("A valid admin account is required.");
  }

  if (userId === actor.id) {
    throw new Error("SUPER_ADMIN accounts cannot deactivate themselves from this screen.");
  }

  const targetAdmin = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      isActive: true,
    },
  });

  if (!targetAdmin) {
    throw new Error("That admin account no longer exists.");
  }

  await prisma.user.update({
    where: { id: targetAdmin.id },
    data: {
      isActive: !targetAdmin.isActive,
    },
  });

  logAdminManagementEvent({
    action: targetAdmin.isActive ? "deactivate_admin" : "reactivate_admin",
    actorId: actor.id,
    actorEmail: actor.email,
    targetUserId: targetAdmin.id,
    targetEmail: targetAdmin.email,
    detail: targetAdmin.isActive ? "Deactivated admin account." : "Reactivated admin account.",
  });

  revalidateAdminManagementPages();
}

export async function clearAdminLockout(formData: FormData) {
  const actor = await requireStaffCapability("admins:unlock");
  const userId = parseUserId(formData.get("userId"));

  if (!userId) {
    throw new Error("A valid admin account is required.");
  }

  const targetAdmin = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      lockedUntil: true,
    },
  });

  if (!targetAdmin) {
    throw new Error("That admin account no longer exists.");
  }

  await prisma.user.update({
    where: { id: targetAdmin.id },
    data: {
      failedSignInCount: 0,
      lastFailedSignInAt: null,
      lockedUntil: null,
    },
  });

  logAdminManagementEvent({
    action: "clear_lockout",
    actorId: actor.id,
    actorEmail: actor.email,
    targetUserId: targetAdmin.id,
    targetEmail: targetAdmin.email,
    detail: targetAdmin.lockedUntil
      ? "Cleared active admin lockout."
      : "Reset failed sign-in counters.",
  });

  revalidateAdminManagementPages();
}

export async function changeOwnPassword(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("You must be signed in with an active admin account.");
  }

  const parsedInput = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsedInput.success) {
    throw new Error(parsedInput.error.issues[0]?.message ?? "Invalid password update.");
  }

  const currentAdmin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      isActive: true,
      mustChangePassword: true,
      passwordHash: true,
    },
  });

  if (!currentAdmin?.isActive) {
    throw new Error("Your admin account no longer exists.");
  }

  if (!currentAdmin.mustChangePassword && !currentAdmin.passwordHash) {
    throw new Error("Your admin account is missing password credentials.");
  }

  const currentPasswordMatches = await bcrypt.compare(
    parsedInput.data.currentPassword,
    currentAdmin.passwordHash
  );

  if (!currentPasswordMatches) {
    throw new Error("Current password is incorrect.");
  }

  const nextPasswordMatchesCurrent = await bcrypt.compare(
    parsedInput.data.newPassword,
    currentAdmin.passwordHash
  );

  if (nextPasswordMatchesCurrent) {
    throw new Error("Choose a new password that is different from the current password.");
  }

  const nextPasswordHash = await bcrypt.hash(parsedInput.data.newPassword, 12);

  await prisma.user.update({
    where: { id: currentAdmin.id },
    data: {
      passwordHash: nextPasswordHash,
      mustChangePassword: false,
    },
  });

  logAdminManagementEvent({
    action: "change_own_password",
    actorId: currentAdmin.id,
    actorEmail: currentAdmin.email,
    targetUserId: currentAdmin.id,
    targetEmail: currentAdmin.email,
    detail: "Changed own password.",
  });

  revalidatePath("/dashboard");
  revalidatePath("/admin/dashboard");

  await signOut({
    redirectTo: "/sign-in",
  });
}

export async function setAdminTemporaryPassword(formData: FormData) {
  const actor = await requireStaffCapability("admins:manage");
  const userId = parseUserId(formData.get("userId"));

  const parsedInput = setTemporaryPasswordSchema.safeParse({
    password: formData.get("password"),
  });

  if (!userId || !parsedInput.success) {
    throw new Error(
      parsedInput.success
        ? "A valid admin account is required."
        : parsedInput.error.issues[0]?.message ?? "Invalid temporary password."
    );
  }

  const targetAdmin = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  if (!targetAdmin) {
    throw new Error("That admin account no longer exists.");
  }

  if (targetAdmin.id === actor.id) {
    throw new Error("Use the change-password form to update your own password.");
  }

  const passwordHash = await bcrypt.hash(parsedInput.data.password, 12);

  await prisma.user.update({
    where: { id: targetAdmin.id },
    data: {
      passwordHash,
      mustChangePassword: true,
    },
  });

  logAdminManagementEvent({
    action: "set_temporary_password",
    actorId: actor.id,
    actorEmail: actor.email,
    targetUserId: targetAdmin.id,
    targetEmail: targetAdmin.email,
    detail: "Set a new temporary password for an admin account.",
  });

  revalidateAdminManagementPages();
}
