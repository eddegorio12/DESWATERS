"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { registerMeter } from "@/features/meters/actions";
import {
  meterFormSchema,
  type MeterFormInput,
  type MeterFormValues,
} from "@/features/meters/lib/meter-schema";

const fieldClassName =
  "mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm text-foreground shadow-xs outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20";

export function MeterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<MeterFormInput, undefined, MeterFormValues>({
    resolver: zodResolver(meterFormSchema),
    defaultValues: {
      meterNumber: "",
      installDate: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null);

    startTransition(async () => {
      try {
        await registerMeter(values);
        form.reset();
        router.refresh();
      } catch (error) {
        console.error(error);
        setServerError(
          error instanceof Error ? error.message : "Meter could not be registered."
        );
      }
    });
  });

  return (
    <section className="rounded-[1.9rem] border border-[#dbe9e5] bg-white/92 p-6 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.55)]">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Register Meter
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Add a new service meter
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Register the meter first, then assign it to a customer from the next panel.
        </p>
      </div>

      <form className="mt-6 space-y-5" onSubmit={onSubmit} noValidate>
        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="meterNumber">
            Meter number
          </label>
          <input
            id="meterNumber"
            type="text"
            className={`${fieldClassName} bg-white`}
            placeholder="MTR-000123"
            {...form.register("meterNumber")}
          />
          <p className="mt-2 text-sm text-destructive">
            {form.formState.errors.meterNumber?.message}
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="installDate">
            Install date
          </label>
          <input
            id="installDate"
            type="date"
            className={`${fieldClassName} bg-white`}
            {...form.register("installDate")}
          />
          <p className="mt-2 text-sm text-destructive">
            {form.formState.errors.installDate?.message}
          </p>
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
          {isPending ? "Registering meter..." : "Register meter"}
        </Button>
      </form>
    </section>
  );
}
