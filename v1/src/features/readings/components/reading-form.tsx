"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { createReading } from "@/features/readings/actions";
import {
  readingFormSchema,
  type ReadingFormInput,
  type ReadingFormValues,
} from "@/features/readings/lib/reading-schema";

const fieldClassName =
  "mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm text-foreground shadow-xs outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20";

type ReadingMeterOption = {
  id: string;
  meterNumber: string;
  customerName: string;
  accountNumber: string;
  previousReading: number;
};

type ReadingFormProps = {
  meters: ReadingMeterOption[];
};

export function ReadingForm({ meters }: ReadingFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<ReadingFormInput, undefined, ReadingFormValues>({
    resolver: zodResolver(readingFormSchema),
    defaultValues: {
      meterId: meters[0]?.id ?? "",
      currentReading: undefined,
    },
  });

  const selectedMeterId = useWatch({
    control: form.control,
    name: "meterId",
  });
  const selectedMeter = meters.find((meter) => meter.id === selectedMeterId) ?? meters[0] ?? null;
  const readingBlocked = meters.length === 0;

  useEffect(() => {
    if (!selectedMeter) {
      form.setValue("currentReading", 0, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });
      return;
    }

    form.setValue("currentReading", selectedMeter.previousReading + 1, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [form, selectedMeter]);

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null);

    startTransition(async () => {
      try {
        await createReading(values);
        form.reset({
          meterId: values.meterId,
          currentReading:
            (meters.find((meter) => meter.id === values.meterId)?.previousReading ?? 0) + 1,
        });
        router.refresh();
      } catch (error) {
        console.error(error);
        setServerError(
          error instanceof Error ? error.message : "Reading could not be submitted."
        );
      }
    });
  });

  return (
    <section className="rounded-[1.9rem] border border-[#dbe9e5] bg-white/92 p-6 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.55)]">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Field Entry
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Encode a meter reading
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Select an assigned meter, confirm the last recorded value, and submit the new
          reading for review.
        </p>
      </div>

      <form className="mt-6 space-y-5" onSubmit={onSubmit} noValidate>
        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="meterId">
            Assigned meter
          </label>
          <select
            id="meterId"
            className={`${fieldClassName} bg-white`}
            disabled={readingBlocked}
            {...form.register("meterId")}
          >
            {meters.length ? (
              meters.map((meter) => (
                <option key={meter.id} value={meter.id}>
                  {meter.meterNumber} - {meter.accountNumber}
                </option>
              ))
            ) : (
              <option value="">No assigned active meters available</option>
            )}
          </select>
          <p className="mt-2 text-sm text-destructive">{form.formState.errors.meterId?.message}</p>
        </div>

        {selectedMeter ? (
          <div className="grid gap-4 rounded-[1.4rem] border border-[#dbe9e5] bg-[linear-gradient(180deg,#f8fbfa,#eff7f5)] p-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Customer
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">
                {selectedMeter.customerName}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{selectedMeter.accountNumber}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Previous Reading
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                {selectedMeter.previousReading}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Minimum Next Value
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                {selectedMeter.previousReading + 1}
              </p>
            </div>
          </div>
        ) : null}

        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="currentReading">
            Current reading
          </label>
          <input
            id="currentReading"
            type="number"
            step="0.01"
            className={`${fieldClassName} bg-white`}
            disabled={readingBlocked}
            {...form.register("currentReading", { valueAsNumber: true })}
          />
          <p className="mt-2 text-sm text-destructive">
            {form.formState.errors.currentReading?.message}
          </p>
        </div>

        {readingBlocked ? (
          <p className="rounded-2xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
            Assign at least one active meter to a customer before encoding readings.
          </p>
        ) : null}

        {serverError ? (
          <p className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {serverError}
          </p>
        ) : null}

        <Button
          type="submit"
          size="lg"
          className="h-11 rounded-2xl px-5"
          disabled={isPending || readingBlocked}
        >
          {isPending ? "Saving reading..." : "Save reading"}
        </Button>
      </form>
    </section>
  );
}
