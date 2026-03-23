import { z } from "zod";

export const customerFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Customer name must be at least 2 characters."),
  address: z
    .string()
    .trim()
    .min(5, "Address must be at least 5 characters."),
  contactNumber: z
    .string()
    .trim()
    .max(30, "Contact number must be 30 characters or fewer.")
    .optional()
    .transform((value) => value || undefined),
});

export type CustomerFormInput = z.input<typeof customerFormSchema>;
export type CustomerFormValues = z.output<typeof customerFormSchema>;
