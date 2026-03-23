import { z } from "zod";

const numericField = (label: string) =>
  z
    .number({
      error: `${label} is required.`,
    })
    .finite(`${label} must be a valid number.`);

const tierSchema = z
  .object({
    minVolume: numericField("Tier minimum volume").min(
      0,
      "Tier minimum volume cannot be negative."
    ),
    maxVolume: numericField("Tier maximum volume")
      .positive("Tier maximum volume must be greater than 0.")
      .optional(),
    ratePerCuM: numericField("Tier rate").positive("Tier rate must be greater than 0."),
  })
  .superRefine((tier, ctx) => {
    if (tier.maxVolume !== undefined && tier.maxVolume < tier.minVolume) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maxVolume"],
        message: "Tier maximum volume must be greater than or equal to the minimum volume.",
      });
    }
  });

export const tariffFormSchema = z
  .object({
    name: z.string().trim().min(3, "Tariff name must be at least 3 characters."),
    minimumCharge: numericField("Minimum charge").min(
      0,
      "Minimum charge cannot be negative."
    ),
    minimumUsage: numericField("Minimum usage").min(
      0,
      "Minimum usage cannot be negative."
    ),
    installationFee: numericField("Installation fee").min(
      0,
      "Installation fee cannot be negative."
    ),
    tiers: z.array(tierSchema).min(1, "Add at least one tariff tier."),
  })
  .superRefine((value, ctx) => {
    value.tiers.forEach((tier, index) => {
      if (index === 0) {
        return;
      }

      const previousTier = value.tiers[index - 1];

      if (tier.minVolume <= previousTier.minVolume) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["tiers", index, "minVolume"],
          message: "Each tier must start after the previous tier starts.",
        });
      }

      if (previousTier.maxVolume === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["tiers", index, "minVolume"],
          message: "No additional tiers can follow an open-ended tier.",
        });
        return;
      }

      if (tier.minVolume !== previousTier.maxVolume + 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["tiers", index, "minVolume"],
          message: "Each tier must begin exactly one unit after the previous tier ends.",
        });
      }
    });
  });

export type TariffFormInput = z.input<typeof tariffFormSchema>;
export type TariffFormValues = z.output<typeof tariffFormSchema>;
