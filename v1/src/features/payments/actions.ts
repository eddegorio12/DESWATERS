"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireStaffCapability } from "@/features/auth/lib/authorization";
import {
  setTelegramStaffIdentityActive,
  upsertTelegramStaffIdentityForCurrentUser,
} from "@/features/automation/lib/telegram-cashier";
import { syncReceivableStatuses } from "@/features/follow-up/lib/workflow";
import { recordPaymentForActor } from "@/features/payments/lib/payment-recording";
import {
  paymentFormSchema,
  type PaymentFormInput,
} from "@/features/payments/lib/payment-schema";

const telegramIdentitySchema = z.object({
  telegramUserId: z
    .string()
    .trim()
    .min(4, "Telegram user ID is required.")
    .max(64, "Telegram user ID must be 64 characters or fewer."),
  telegramChatId: z
    .string()
    .trim()
    .max(64, "Telegram chat ID must be 64 characters or fewer.")
    .optional()
    .or(z.literal("")),
});

export type TelegramCashierLinkState = {
  error?: string;
  message?: string;
};

export async function recordPayment(values: PaymentFormInput) {
  const staffUser = await requireStaffCapability("payments:record");
  await syncReceivableStatuses();

  const parsedValues = paymentFormSchema.safeParse(values);

  if (!parsedValues.success) {
    throw new Error(parsedValues.error.issues[0]?.message || "Invalid payment data.");
  }

  const payment = await recordPaymentForActor({
    actorId: staffUser.id,
    billId: parsedValues.data.billId,
    amount: parsedValues.data.amount,
    method: parsedValues.data.method,
    referenceId: parsedValues.data.referenceId || null,
  });

  revalidatePath("/admin/payments");
  revalidatePath("/admin/billing");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/collections");
  revalidatePath("/admin/follow-up");
  revalidatePath(`/admin/payments/${payment.id}/receipt`);

  return payment;
}

export async function saveTelegramCashierIdentity(
  _previousState: TelegramCashierLinkState | undefined,
  formData: FormData
): Promise<TelegramCashierLinkState> {
  try {
    const staffUser = await requireStaffCapability("payments:record");
    const parsed = telegramIdentitySchema.safeParse({
      telegramUserId: formData.get("telegramUserId"),
      telegramChatId: formData.get("telegramChatId"),
    });

    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "Invalid Telegram cashier identity.",
      };
    }

    await upsertTelegramStaffIdentityForCurrentUser({
      userId: staffUser.id,
      telegramUserId: parsed.data.telegramUserId,
      telegramChatId: parsed.data.telegramChatId || null,
    });

    revalidatePath("/admin/payments");

    return {
      message: "Telegram cashier identity saved.",
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Telegram cashier identity could not be saved.",
    };
  }
}

export async function toggleTelegramCashierIdentity(
  _previousState: TelegramCashierLinkState | undefined,
  formData: FormData
): Promise<TelegramCashierLinkState> {
  try {
    const staffUser = await requireStaffCapability("payments:record");
    const shouldEnable = formData.get("enable") === "true";

    await setTelegramStaffIdentityActive({
      userId: staffUser.id,
      isActive: shouldEnable,
    });

    revalidatePath("/admin/payments");

    return {
      message: shouldEnable
        ? "Telegram cashier assistant was enabled for this account."
        : "Telegram cashier assistant was disabled for this account.",
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Telegram cashier assistant status could not be updated.",
    };
  }
}
