"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { transferMeterHolder } from "@/features/meters/actions";
import {
  meterHolderTransferSchema,
  type MeterHolderTransferInput,
  type MeterHolderTransferValues,
} from "@/features/meters/lib/meter-schema";

const fieldClassName =
  "mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm text-foreground shadow-xs outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20";

type MeterHolderTransferFormProps = {
  customers: {
    id: string;
    accountNumber: string;
    name: string;
  }[];
  assignedMeters: {
    id: string;
    meterNumber: string;
    customer: {
      accountNumber: string;
      name: string;
    };
  }[];
};

function getTodayDateInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function MeterHolderTransferForm({
  customers,
  assignedMeters,
}: MeterHolderTransferFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<MeterHolderTransferInput, undefined, MeterHolderTransferValues>({
    resolver: zodResolver(meterHolderTransferSchema),
    defaultValues: {
      meterId: assignedMeters[0]?.id ?? "",
      customerId: customers[0]?.id ?? "",
      effectiveDate: getTodayDateInputValue(),
      transferReading: 0,
      reason: "",
    },
  });

  const transferBlocked = customers.length === 0 || assignedMeters.length === 0;

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null);

    startTransition(async () => {
      try {
        await transferMeterHolder(values);
        form.reset({
          meterId: assignedMeters[0]?.id ?? "",
          customerId: customers[0]?.id ?? "",
          effectiveDate: getTodayDateInputValue(),
          transferReading: 0,
          reason: "",
        });
        router.refresh();
      } catch (error) {
        console.error(error);
        setServerError(
          error instanceof Error ? error.message : "Meter holder could not be replaced."
        );
      }
    });
  });

  return (
    <section className="rounded-[1.9rem] border border-[#dbe9e5] bg-white/92 p-6 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.55)]">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Replace Holder
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Transfer a meter to a new account holder
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Keep the service meter in place, move future billing to the replacement account, and
          capture the turnover reading for audit purposes.
        </p>
      </div>

      <form className="mt-6 space-y-5" onSubmit={onSubmit} noValidate>
        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="transfer-meterId">
            Assigned meter
          </label>
          <select
            id="transfer-meterId"
            className={`${fieldClassName} bg-white`}
            disabled={transferBlocked}
            {...form.register("meterId")}
          >
            {assignedMeters.length ? (
              assignedMeters.map((meter) => (
                <option key={meter.id} value={meter.id}>
                  {meter.meterNumber} - {meter.customer.accountNumber} - {meter.customer.name}
                </option>
              ))
            ) : (
              <option value="">No assigned meters available</option>
            )}
          </select>
          <p className="mt-2 text-sm text-destructive">{form.formState.errors.meterId?.message}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="transfer-customerId">
            Replacement account
          </label>
          <select
            id="transfer-customerId"
            className={`${fieldClassName} bg-white`}
            disabled={transferBlocked}
            {...form.register("customerId")}
          >
            {customers.length ? (
              customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.accountNumber} - {customer.name}
                </option>
              ))
            ) : (
              <option value="">No customers available</option>
            )}
          </select>
          <p className="mt-2 text-sm text-destructive">
            {form.formState.errors.customerId?.message}
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="effectiveDate">
              Transfer date
            </label>
            <input
              id="effectiveDate"
              type="date"
              className={`${fieldClassName} bg-white`}
              disabled={transferBlocked}
              {...form.register("effectiveDate")}
            />
            <p className="mt-2 text-sm text-destructive">
              {form.formState.errors.effectiveDate?.message}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="transferReading">
              Turnover reading
            </label>
            <input
              id="transferReading"
              type="number"
              min="0"
              step="0.01"
              className={`${fieldClassName} bg-white`}
              disabled={transferBlocked}
              {...form.register("transferReading")}
            />
            <p className="mt-2 text-sm text-destructive">
              {form.formState.errors.transferReading?.message}
            </p>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="reason">
            Reason
          </label>
          <textarea
            id="reason"
            rows={3}
            className={`${fieldClassName} resize-y bg-white`}
            placeholder="Ownership transfer, tenant move-out, estate settlement..."
            disabled={transferBlocked}
            {...form.register("reason")}
          />
          <p className="mt-2 text-sm text-muted-foreground">
            Optional, but useful for support review and billing disputes.
          </p>
          <p className="mt-2 text-sm text-destructive">{form.formState.errors.reason?.message}</p>
        </div>

        {transferBlocked ? (
          <p className="rounded-2xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
            {customers.length === 0
              ? "Create at least one customer before transferring a meter."
              : "Assign a meter first before replacing its current holder."}
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
          disabled={isPending || transferBlocked}
        >
          {isPending ? "Replacing holder..." : "Replace holder"}
        </Button>
      </form>
    </section>
  );
}
