import { WorkOrderPriority, WorkOrderStatus } from "@prisma/client";
import { z } from "zod";

export const createFieldWorkOrderSchema = z.object({
  complaintId: z.uuid("Select a valid complaint."),
  assignedToId: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined)
    .refine((value) => !value || z.uuid().safeParse(value).success, "Select a valid technician."),
  title: z
    .string()
    .trim()
    .min(5, "Work-order title must be at least 5 characters.")
    .max(120, "Work-order title must be 120 characters or fewer."),
  detail: z
    .string()
    .trim()
    .max(500, "Dispatch detail must be 500 characters or fewer.")
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
  priority: z.nativeEnum(WorkOrderPriority),
  scheduledFor: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined)
    .refine(
      (value) => !value || !Number.isNaN(Date.parse(value)),
      "Choose a valid scheduled date and time."
    ),
});

export const updateFieldWorkOrderSchema = z.object({
  workOrderId: z.uuid("Select a valid work order."),
  assignedToId: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined)
    .refine((value) => !value || z.uuid().safeParse(value).success, "Select a valid technician."),
  status: z.nativeEnum(WorkOrderStatus),
  replacementAction: z
    .enum(["UNCHANGED", "REPLACED"])
    .optional()
    .or(z.literal(""))
    .transform((value) => value || "UNCHANGED"),
  replacementMeterId: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined)
    .refine(
      (value) => !value || z.uuid().safeParse(value).success,
      "Select a valid replacement meter."
    ),
  finalReading: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined)
    .refine(
      (value) => !value || !Number.isNaN(Number(value)),
      "Final reading must be a valid number."
    )
    .transform((value) => (value ? Number(value) : undefined))
    .refine(
      (value) => value === undefined || value >= 0,
      "Final reading cannot be negative."
    ),
  resolutionNotes: z
    .string()
    .trim()
    .max(500, "Resolution notes must be 500 characters or fewer.")
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
});
