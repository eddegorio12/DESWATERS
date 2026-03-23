import { z } from "zod";

const numericField = (label: string) =>
  z
    .number({
      error: `${label} is required.`,
    })
    .finite(`${label} must be a valid number.`);

export const readingFormSchema = z.object({
  meterId: z.uuid("Select a valid meter."),
  currentReading: numericField("Current reading").min(
    0,
    "Current reading cannot be negative."
  ),
});

export type ReadingFormInput = z.input<typeof readingFormSchema>;
export type ReadingFormValues = z.output<typeof readingFormSchema>;
