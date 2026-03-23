"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { createTariff } from "@/features/tariffs/actions";
import {
  tariffFormSchema,
  type TariffFormValues,
} from "@/features/tariffs/lib/tariff-schema";

const fieldClassName =
  "mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm text-foreground shadow-xs outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20";

const defaultTier: TariffFormValues["tiers"][number] = {
  minVolume: 2,
  maxVolume: 7,
  ratePerCuM: 50,
};

export function TariffForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<TariffFormValues>({
    resolver: zodResolver(tariffFormSchema),
    defaultValues: {
      name: "Standard Residential Tariff",
      minimumCharge: 25,
      minimumUsage: 1,
      installationFee: 3000,
      tiers: [defaultTier],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "tiers",
  });

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null);

    startTransition(async () => {
      try {
        await createTariff(values);
        form.reset({
          name: "",
          minimumCharge: 25,
          minimumUsage: 1,
          installationFee: 3000,
          tiers: [defaultTier],
        });
        router.refresh();
      } catch (error) {
        console.error(error);
        setServerError(
          error instanceof Error ? error.message : "Tariff could not be saved."
        );
      }
    });
  });

  return (
    <section className="rounded-[1.9rem] border border-[#dbe9e5] bg-white/92 p-6 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.55)]">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Active Tariff
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Configure progressive billing rules
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Saving a new tariff marks it as the active computing tariff and retires the
          previously active one.
        </p>
      </div>

      <form className="mt-6 space-y-6" onSubmit={onSubmit} noValidate>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-foreground" htmlFor="name">
              Tariff name
            </label>
            <input
              id="name"
              type="text"
              className={`${fieldClassName} bg-white`}
              placeholder="Residential March 2026 Tariff"
              {...form.register("name")}
            />
            <p className="mt-2 text-sm text-destructive">{form.formState.errors.name?.message}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="minimumCharge">
              Minimum charge
            </label>
            <input
              id="minimumCharge"
              type="number"
              step="0.01"
              className={`${fieldClassName} bg-white`}
              {...form.register("minimumCharge", { valueAsNumber: true })}
            />
            <p className="mt-2 text-sm text-destructive">
              {form.formState.errors.minimumCharge?.message}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="minimumUsage">
              Minimum usage (cu.m)
            </label>
            <input
              id="minimumUsage"
              type="number"
              step="0.01"
              className={`${fieldClassName} bg-white`}
              {...form.register("minimumUsage", { valueAsNumber: true })}
            />
            <p className="mt-2 text-sm text-destructive">
              {form.formState.errors.minimumUsage?.message}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="installationFee">
              Installation fee
            </label>
            <input
              id="installationFee"
              type="number"
              step="0.01"
              className={`${fieldClassName} bg-white`}
              {...form.register("installationFee", { valueAsNumber: true })}
            />
            <p className="mt-2 text-sm text-destructive">
              {form.formState.errors.installationFee?.message}
            </p>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-[#dbe9e5] bg-[linear-gradient(180deg,#fbfdfc,#f4f8f7)] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Progressive tiers</h3>
              <p className="text-sm leading-6 text-muted-foreground">
                Define sequential usage bands. Leave maximum volume blank for the final
                open-ended tier.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-10 rounded-xl px-4"
              onClick={() => append({ minVolume: 0, maxVolume: undefined, ratePerCuM: 0 })}
            >
              Add tier
            </Button>
          </div>

          <div className="mt-5 space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="rounded-[1.35rem] border border-[#dbe9e5] bg-white p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">Tier {index + 1}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-xl px-3"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    Remove
                  </Button>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div>
                    <label
                      className="text-sm font-medium text-foreground"
                      htmlFor={`tiers.${index}.minVolume`}
                    >
                      Min volume
                    </label>
                    <input
                      id={`tiers.${index}.minVolume`}
                      type="number"
                      step="0.01"
                      className={`${fieldClassName} bg-white`}
                      {...form.register(`tiers.${index}.minVolume`, {
                        valueAsNumber: true,
                      })}
                    />
                    <p className="mt-2 text-sm text-destructive">
                      {form.formState.errors.tiers?.[index]?.minVolume?.message}
                    </p>
                  </div>

                  <div>
                    <label
                      className="text-sm font-medium text-foreground"
                      htmlFor={`tiers.${index}.maxVolume`}
                    >
                      Max volume
                    </label>
                    <input
                      id={`tiers.${index}.maxVolume`}
                      type="number"
                      step="0.01"
                      className={`${fieldClassName} bg-white`}
                      placeholder="Leave blank for no limit"
                      {...form.register(`tiers.${index}.maxVolume`, {
                        setValueAs: (value) => (value === "" ? undefined : Number(value)),
                      })}
                    />
                    <p className="mt-2 text-sm text-destructive">
                      {form.formState.errors.tiers?.[index]?.maxVolume?.message}
                    </p>
                  </div>

                  <div>
                    <label
                      className="text-sm font-medium text-foreground"
                      htmlFor={`tiers.${index}.ratePerCuM`}
                    >
                      Rate per cu.m
                    </label>
                    <input
                      id={`tiers.${index}.ratePerCuM`}
                      type="number"
                      step="0.01"
                      className={`${fieldClassName} bg-white`}
                      {...form.register(`tiers.${index}.ratePerCuM`, {
                        valueAsNumber: true,
                      })}
                    />
                    <p className="mt-2 text-sm text-destructive">
                      {form.formState.errors.tiers?.[index]?.ratePerCuM?.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-3 text-sm text-destructive">{form.formState.errors.tiers?.message}</p>
        </div>

        {serverError ? (
          <p className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {serverError}
          </p>
        ) : null}

        <Button
          type="submit"
          size="lg"
          className="h-11 rounded-2xl px-5"
          disabled={isPending}
        >
          {isPending ? "Saving tariff..." : "Save active tariff"}
        </Button>
      </form>
    </section>
  );
}
