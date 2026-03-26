import { z } from "zod";

export const meterFormSchema = z.object({
  meterNumber: z
    .string()
    .trim()
    .min(3, "Meter number must be at least 3 characters.")
    .max(50, "Meter number must be 50 characters or fewer."),
  installDate: z
    .string()
    .min(1, "Install date is required.")
    .refine((value) => !Number.isNaN(Date.parse(value)), "Install date must be valid."),
});

export const meterAssignmentSchema = z.object({
  meterId: z.uuid("Select a valid unassigned meter."),
  customerId: z.uuid("Select a valid customer."),
});

export const meterHolderTransferSchema = z.object({
  meterId: z.uuid("Select a valid assigned meter."),
  customerId: z.uuid("Select a valid replacement customer."),
  effectiveDate: z
    .string()
    .min(1, "Transfer date is required.")
    .refine((value) => !Number.isNaN(Date.parse(value)), "Transfer date must be valid."),
  transferReading: z.coerce
    .number()
    .finite("Transfer reading must be a valid number.")
    .min(0, "Transfer reading cannot be negative."),
  reason: z
    .string()
    .trim()
    .max(200, "Reason must be 200 characters or fewer.")
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
});

export type MeterFormInput = z.input<typeof meterFormSchema>;
export type MeterFormValues = z.output<typeof meterFormSchema>;

export type MeterAssignmentInput = z.input<typeof meterAssignmentSchema>;
export type MeterAssignmentValues = z.output<typeof meterAssignmentSchema>;

export type MeterHolderTransferInput = z.input<typeof meterHolderTransferSchema>;
export type MeterHolderTransferValues = z.output<typeof meterHolderTransferSchema>;
