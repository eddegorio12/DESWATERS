"use server";

import bcrypt from "bcrypt";
import { AuthError } from "next-auth";
import { AuthAdminManagementEventType, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import QRCode from "qrcode";
import { z } from "zod";

import { auth, signIn, signOut } from "@/auth";
import { requireStaffCapability, roleDisplayName } from "@/features/auth/lib/authorization";
import {
  createOtpAuthUri,
  decryptTwoFactorSecret,
  encryptTwoFactorSecret,
  formatTwoFactorSecret,
  generateRecoveryCodes,
  generateTwoFactorSecret,
  hashRecoveryCode,
  verifyTwoFactorCode,
} from "@/features/auth/lib/two-factor";
import { prisma } from "@/lib/prisma";

const authenticateSchema = z.object({
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
  password: z.string().min(1, "Enter your password."),
  verificationCode: z.string().trim().optional(),
  recoveryCode: z.string().trim().optional(),
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

const verifyTwoFactorSetupSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password."),
  verificationCode: z.string().trim().min(6, "Enter the 6-digit verification code."),
});

const disableTwoFactorSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    verificationCode: z.string().trim().optional(),
    recoveryCode: z.string().trim().optional(),
  })
  .refine(
    (value) => Boolean(value.verificationCode?.trim() || value.recoveryCode?.trim()),
    {
      message: "Enter either an authenticator code or a recovery code.",
      path: ["verificationCode"],
    }
  );

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

async function logAdminManagementEvent(input: {
  type: AuthAdminManagementEventType;
  actorId: string;
  actorEmail: string;
  targetUserId?: string | null;
  targetEmail: string;
  detail: string;
}) {
  await prisma.authAdminManagementEvent.create({
    data: {
      type: input.type,
      actorId: input.actorId,
      actorEmail: input.actorEmail,
      targetUserId: input.targetUserId ?? null,
      targetEmail: input.targetEmail,
      detail: input.detail,
    },
  });
}

export type SignInFormState = {
  error?: string;
};

export type TwoFactorSetupState = {
  error?: string;
  message?: string;
  pendingSetup?: {
    secret: string;
    otpAuthUri: string;
    qrDataUrl: string;
  } | null;
  recoveryCodes?: string[] | null;
  enabled?: boolean;
  disabled?: boolean;
};

async function requireSignedInSuperAdmin() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("You must be signed in with an active SUPER_ADMIN account.");
  }

  const currentAdmin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      passwordHash: true,
      twoFactorEnabled: true,
      twoFactorSecretCiphertext: true,
      twoFactorPendingSecretCiphertext: true,
      twoFactorRecoveryCodeHashes: true,
      twoFactorEnabledAt: true,
      twoFactorLastVerifiedAt: true,
    },
  });

  if (!currentAdmin?.isActive || currentAdmin.role !== Role.SUPER_ADMIN) {
    throw new Error("SUPER_ADMIN access is required for this action.");
  }

  return currentAdmin;
}

async function verifyCurrentPassword(passwordHash: string, currentPassword: string) {
  const passwordMatches = await bcrypt.compare(currentPassword, passwordHash);

  if (!passwordMatches) {
    throw new Error("Current password is incorrect.");
  }
}

export async function authenticate(
  _previousState: SignInFormState | undefined,
  formData: FormData
): Promise<SignInFormState | undefined> {
  const parsedCredentials = authenticateSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    verificationCode: formData.get("verificationCode"),
    recoveryCode: formData.get("recoveryCode"),
    callbackUrl: formData.get("callbackUrl"),
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
      verificationCode: parsedCredentials.data.verificationCode,
      recoveryCode: parsedCredentials.data.recoveryCode,
      redirectTo:
        parsedCredentials.data.callbackUrl?.startsWith("/")
          ? parsedCredentials.data.callbackUrl
          : "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return {
          error:
            "Sign-in failed. Check your password, account status, and any required authenticator or recovery code.",
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

  await logAdminManagementEvent({
    type: AuthAdminManagementEventType.ADMIN_CREATED,
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
    select: { id: true, email: true, role: true, twoFactorEnabled: true },
  });

  if (!targetAdmin) {
    throw new Error("That admin account no longer exists.");
  }

  const nextRoleRemovesTwoFactor =
    targetAdmin.role === Role.SUPER_ADMIN &&
    role !== Role.SUPER_ADMIN &&
    targetAdmin.twoFactorEnabled;

  await prisma.user.update({
    where: { id: targetAdmin.id },
    data: {
      role,
      twoFactorEnabled: nextRoleRemovesTwoFactor ? false : undefined,
      twoFactorSecretCiphertext: nextRoleRemovesTwoFactor ? null : undefined,
      twoFactorPendingSecretCiphertext: nextRoleRemovesTwoFactor ? null : undefined,
      twoFactorRecoveryCodeHashes: nextRoleRemovesTwoFactor ? [] : undefined,
      twoFactorEnabledAt: nextRoleRemovesTwoFactor ? null : undefined,
      twoFactorLastVerifiedAt: nextRoleRemovesTwoFactor ? null : undefined,
    },
  });

  await logAdminManagementEvent({
    type: AuthAdminManagementEventType.ROLE_CHANGED,
    actorId: actor.id,
    actorEmail: actor.email,
    targetUserId: targetAdmin.id,
    targetEmail: targetAdmin.email,
    detail: nextRoleRemovesTwoFactor
      ? `Changed role from ${roleDisplayName[targetAdmin.role]} to ${roleDisplayName[role]} and cleared the existing SUPER_ADMIN two-factor configuration.`
      : `Changed role from ${roleDisplayName[targetAdmin.role]} to ${roleDisplayName[role]}.`,
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

  await logAdminManagementEvent({
    type: targetAdmin.isActive
      ? AuthAdminManagementEventType.ACCOUNT_DEACTIVATED
      : AuthAdminManagementEventType.ACCOUNT_REACTIVATED,
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

  await logAdminManagementEvent({
    type: AuthAdminManagementEventType.LOCKOUT_CLEARED,
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

  await logAdminManagementEvent({
    type: AuthAdminManagementEventType.OWN_PASSWORD_CHANGED,
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

  await logAdminManagementEvent({
    type: AuthAdminManagementEventType.TEMPORARY_PASSWORD_SET,
    actorId: actor.id,
    actorEmail: actor.email,
    targetUserId: targetAdmin.id,
    targetEmail: targetAdmin.email,
    detail: "Set a new temporary password for an admin account.",
  });

  revalidateAdminManagementPages();
}

export async function beginSuperAdminTwoFactorSetup(
  _previousState: TwoFactorSetupState | undefined
): Promise<TwoFactorSetupState> {
  try {
    void _previousState;
    const currentAdmin = await requireSignedInSuperAdmin();

    if (currentAdmin.twoFactorEnabled) {
      return {
        error: "Disable the current two-factor configuration before generating a new setup key.",
      };
    }

    const secret = generateTwoFactorSecret();
    const otpAuthUri = createOtpAuthUri({
      email: currentAdmin.email,
      secret,
    });
    const qrDataUrl = await QRCode.toDataURL(otpAuthUri, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 240,
    });

    await prisma.user.update({
      where: { id: currentAdmin.id },
      data: {
        twoFactorPendingSecretCiphertext: encryptTwoFactorSecret(secret),
      },
    });

    revalidatePath("/admin/dashboard");

    return {
      message: "A new authenticator setup key is ready. Confirm it with a 6-digit code to enable two-factor sign-in.",
      pendingSetup: {
        secret: formatTwoFactorSecret(secret),
        otpAuthUri,
        qrDataUrl,
      },
      recoveryCodes: null,
      enabled: false,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to start two-factor setup.",
    };
  }
}

export async function confirmSuperAdminTwoFactorSetup(
  _previousState: TwoFactorSetupState | undefined,
  formData: FormData
): Promise<TwoFactorSetupState> {
  try {
    void _previousState;
    const currentAdmin = await requireSignedInSuperAdmin();
    const parsedInput = verifyTwoFactorSetupSchema.safeParse({
      currentPassword: formData.get("currentPassword"),
      verificationCode: formData.get("verificationCode"),
    });

    if (!parsedInput.success) {
      return {
        error: parsedInput.error.issues[0]?.message ?? "Invalid two-factor setup details.",
      };
    }

    if (!currentAdmin.twoFactorPendingSecretCiphertext) {
      return {
        error: "Generate a setup key before confirming two-factor sign-in.",
      };
    }

    await verifyCurrentPassword(currentAdmin.passwordHash, parsedInput.data.currentPassword);

    const pendingSecret = decryptTwoFactorSecret(currentAdmin.twoFactorPendingSecretCiphertext);
    const isCodeValid = verifyTwoFactorCode({
      secret: pendingSecret,
      code: parsedInput.data.verificationCode,
    });

    if (!isCodeValid) {
      const otpAuthUri = createOtpAuthUri({
        email: currentAdmin.email,
        secret: pendingSecret,
      });

      return {
        error: "The authenticator code did not match the generated setup key.",
        pendingSetup: {
          secret: formatTwoFactorSecret(pendingSecret),
          otpAuthUri,
          qrDataUrl: await QRCode.toDataURL(otpAuthUri, {
            errorCorrectionLevel: "M",
            margin: 1,
            width: 240,
          }),
        },
      };
    }

    const now = new Date();
    const recoveryCodes = generateRecoveryCodes();

    await prisma.user.update({
      where: { id: currentAdmin.id },
      data: {
        twoFactorEnabled: true,
        twoFactorSecretCiphertext: encryptTwoFactorSecret(pendingSecret),
        twoFactorPendingSecretCiphertext: null,
        twoFactorRecoveryCodeHashes: recoveryCodes.map(hashRecoveryCode),
        twoFactorEnabledAt: now,
        twoFactorLastVerifiedAt: now,
      },
    });

    await logAdminManagementEvent({
      type: AuthAdminManagementEventType.TWO_FACTOR_ENABLED,
      actorId: currentAdmin.id,
      actorEmail: currentAdmin.email,
      targetUserId: currentAdmin.id,
      targetEmail: currentAdmin.email,
      detail: "Enabled SUPER_ADMIN two-factor sign-in and issued new recovery codes.",
    });

    revalidateAdminManagementPages();

    return {
      message: "SUPER_ADMIN two-factor sign-in is now enabled. Save the recovery codes now; they will not be shown again.",
      enabled: true,
      pendingSetup: null,
      recoveryCodes,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to enable two-factor sign-in.",
    };
  }
}

export async function disableSuperAdminTwoFactor(
  _previousState: TwoFactorSetupState | undefined,
  formData: FormData
): Promise<TwoFactorSetupState> {
  try {
    void _previousState;
    const currentAdmin = await requireSignedInSuperAdmin();
    const parsedInput = disableTwoFactorSchema.safeParse({
      currentPassword: formData.get("currentPassword"),
      verificationCode: formData.get("verificationCode"),
      recoveryCode: formData.get("recoveryCode"),
    });

    if (!parsedInput.success) {
      return {
        error: parsedInput.error.issues[0]?.message ?? "Invalid two-factor disable request.",
      };
    }

    if (!currentAdmin.twoFactorEnabled || !currentAdmin.twoFactorSecretCiphertext) {
      return {
        error: "Two-factor sign-in is not currently enabled for this SUPER_ADMIN account.",
      };
    }

    await verifyCurrentPassword(currentAdmin.passwordHash, parsedInput.data.currentPassword);

    const activeSecret = decryptTwoFactorSecret(currentAdmin.twoFactorSecretCiphertext);
    const hasVerificationCode = Boolean(parsedInput.data.verificationCode?.trim());

    if (hasVerificationCode) {
      const isCodeValid = verifyTwoFactorCode({
        secret: activeSecret,
        code: parsedInput.data.verificationCode ?? "",
      });

      if (!isCodeValid) {
        return {
          error: "The authenticator code was not accepted.",
        };
      }
    } else {
      const hashedRecoveryCode = hashRecoveryCode(parsedInput.data.recoveryCode ?? "");

      if (!currentAdmin.twoFactorRecoveryCodeHashes.includes(hashedRecoveryCode)) {
        return {
          error: "The recovery code was not accepted.",
        };
      }
    }

    await prisma.user.update({
      where: { id: currentAdmin.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecretCiphertext: null,
        twoFactorPendingSecretCiphertext: null,
        twoFactorRecoveryCodeHashes: [],
        twoFactorEnabledAt: null,
        twoFactorLastVerifiedAt: null,
      },
    });

    await logAdminManagementEvent({
      type: AuthAdminManagementEventType.TWO_FACTOR_DISABLED,
      actorId: currentAdmin.id,
      actorEmail: currentAdmin.email,
      targetUserId: currentAdmin.id,
      targetEmail: currentAdmin.email,
      detail: "Disabled SUPER_ADMIN two-factor sign-in.",
    });

    revalidateAdminManagementPages();

    return {
      message: "SUPER_ADMIN two-factor sign-in has been disabled.",
      disabled: true,
      enabled: false,
      pendingSetup: null,
      recoveryCodes: null,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to disable two-factor sign-in.",
    };
  }
}
