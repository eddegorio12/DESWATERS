import { PaymentMethod } from "@prisma/client";
import { z } from "zod";

const numericField = (label: string) =>
  z
    .number({
      error: `${label} is required.`,
    })
    .finite(`${label} must be a valid number.`);

export const paymentFormSchema = z.object({
  billId: z.uuid("Select a valid bill."),
  amount: numericField("Payment amount").positive("Payment amount must be greater than 0."),
  method: z.enum(PaymentMethod, {
    error: "Select a valid payment method.",
  }),
  referenceId: z
    .string()
    .trim()
    .max(100, "Reference ID must be 100 characters or fewer.")
    .optional()
    .or(z.literal("")),
}).superRefine((value, ctx) => {
  if (value.method !== PaymentMethod.CASH && !value.referenceId?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Reference ID is required for non-cash payments.",
      path: ["referenceId"],
    });
  }
});

export type PaymentFormInput = z.input<typeof paymentFormSchema>;
export type PaymentFormValues = z.output<typeof paymentFormSchema>;
