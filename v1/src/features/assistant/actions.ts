"use server";

import { AssistantSourceGovernanceState } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireStaffCapability } from "@/features/auth/lib/authorization";
import {
  rollbackAssistantKnowledgeDocumentToRevision,
  syncAssistantKnowledgeBase,
  updateAssistantKnowledgeDocumentControls,
} from "@/features/assistant/lib/assistant-store";

const knowledgeControlSchema = z.object({
  documentId: z.string().uuid("Select a valid assistant source."),
  governanceState: z.nativeEnum(AssistantSourceGovernanceState),
  isPinned: z.enum(["true", "false"]).transform((value) => value === "true"),
  isDisabled: z.enum(["true", "false"]).transform((value) => value === "true"),
  disabledReason: z
    .string()
    .trim()
    .max(300, "Disable reason must be 300 characters or fewer.")
    .optional(),
});

const rollbackSchema = z.object({
  documentId: z.string().uuid("Select a valid assistant source."),
});

export async function syncAssistantKnowledgeAction() {
  const actor = await requireStaffCapability("assistant:knowledge:manage");

  await syncAssistantKnowledgeBase(actor.id);
  revalidatePath("/admin/assistant");
}

export async function updateAssistantKnowledgeControlsAction(formData: FormData) {
  const actor = await requireStaffCapability("assistant:knowledge:manage");
  const parsedInput = knowledgeControlSchema.safeParse({
    documentId: formData.get("documentId"),
    governanceState: formData.get("governanceState"),
    isPinned: formData.get("isPinned"),
    isDisabled: formData.get("isDisabled"),
    disabledReason: formData.get("disabledReason"),
  });

  if (!parsedInput.success) {
    throw new Error(parsedInput.error.issues[0]?.message ?? "Invalid assistant knowledge update.");
  }

  if (parsedInput.data.isDisabled && !parsedInput.data.disabledReason) {
    throw new Error("Add a short reason before disabling this assistant source.");
  }

  await updateAssistantKnowledgeDocumentControls({
    documentId: parsedInput.data.documentId,
    actorId: actor.id,
    governanceState: parsedInput.data.governanceState,
    isPinned: parsedInput.data.isPinned,
    isDisabled: parsedInput.data.isDisabled,
    disabledReason: parsedInput.data.disabledReason ?? null,
  });

  revalidatePath("/admin/assistant");
}

export async function rollbackAssistantKnowledgeDocumentAction(formData: FormData) {
  const actor = await requireStaffCapability("assistant:knowledge:manage");
  const parsedInput = rollbackSchema.safeParse({
    documentId: formData.get("documentId"),
  });

  if (!parsedInput.success) {
    throw new Error(parsedInput.error.issues[0]?.message ?? "Invalid assistant rollback request.");
  }

  await rollbackAssistantKnowledgeDocumentToRevision({
    documentId: parsedInput.data.documentId,
    actorId: actor.id,
  });

  revalidatePath("/admin/assistant");
}
