"use server";

import { BackupSnapshotStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireStaffCapability } from "@/features/auth/lib/authorization";
import { prisma } from "@/lib/prisma";

const backupSnapshotSchema = z.object({
  snapshotMonth: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}$/, "Choose the backup snapshot month."),
  label: z.string().trim().min(3, "Snapshot label must be at least 3 characters."),
  provider: z.string().trim().min(2, "Provider is required."),
  storageReference: z
    .string()
    .trim()
    .min(6, "Storage reference must be at least 6 characters."),
  status: z.nativeEnum(BackupSnapshotStatus),
  notes: z.string().trim().max(500, "Notes must be 500 characters or fewer.").optional(),
});

export async function logBackupSnapshot(formData: FormData) {
  const actor = await requireStaffCapability("system:backup:log");

  const parsedInput = backupSnapshotSchema.safeParse({
    snapshotMonth: formData.get("snapshotMonth"),
    label: formData.get("label"),
    provider: formData.get("provider"),
    storageReference: formData.get("storageReference"),
    status: formData.get("status"),
    notes: formData.get("notes"),
  });

  if (!parsedInput.success) {
    throw new Error(parsedInput.error.issues[0]?.message ?? "Invalid backup snapshot.");
  }

  await prisma.backupSnapshot.create({
    data: {
      snapshotMonth: parsedInput.data.snapshotMonth,
      label: parsedInput.data.label,
      provider: parsedInput.data.provider,
      storageReference: parsedInput.data.storageReference,
      status: parsedInput.data.status,
      notes: parsedInput.data.notes || null,
      createdById: actor.id,
    },
  });

  revalidatePath("/admin/system-readiness");
}
