"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  AdminSurfaceHeader,
  AdminSurfacePanel,
} from "@/features/admin/components/admin-surface-panel";
import { assignMeterToCustomer } from "@/features/meters/actions";
import {
  meterAssignmentSchema,
  type MeterAssignmentInput,
  type MeterAssignmentValues,
} from "@/features/meters/lib/meter-schema";

const fieldClassName =
  "mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm text-foreground shadow-xs outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20";

type MeterAssignmentFormProps = {
  customers: {
    id: string;
    accountNumber: string;
    name: string;
  }[];
  unassignedMeters: {
    id: string;
    meterNumber: string;
  }[];
};

export function MeterAssignmentForm({
  customers,
  unassignedMeters,
}: MeterAssignmentFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<MeterAssignmentInput, undefined, MeterAssignmentValues>({
    resolver: zodResolver(meterAssignmentSchema),
    defaultValues: {
      customerId: customers[0]?.id ?? "",
      meterId: unassignedMeters[0]?.id ?? "",
    },
  });

  const assignmentBlocked = customers.length === 0 || unassignedMeters.length === 0;

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null);

    startTransition(async () => {
      try {
        await assignMeterToCustomer(values);
        form.reset({
          customerId: customers[0]?.id ?? "",
          meterId: "",
        });
        router.refresh();
      } catch (error) {
        console.error(error);
        setServerError(
          error instanceof Error ? error.message : "Meter could not be assigned."
        );
      }
    });
  });

  return (
    <AdminSurfacePanel>
      <AdminSurfaceHeader
        eyebrow="Assign Meter"
        title="Link an unassigned meter to a customer"
        description="Only meters without a customer appear here. Assigned meters immediately surface in the customer registry."
      />

      <form className="mt-6 space-y-5" onSubmit={onSubmit} noValidate>
        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="meterId">
            Unassigned meter
          </label>
          <select
            id="meterId"
            className={`${fieldClassName} bg-white`}
            disabled={assignmentBlocked}
            {...form.register("meterId")}
          >
            {unassignedMeters.length ? (
              unassignedMeters.map((meter) => (
                <option key={meter.id} value={meter.id}>
                  {meter.meterNumber}
                </option>
              ))
            ) : (
              <option value="">No unassigned meters available</option>
            )}
          </select>
          <p className="mt-2 text-sm text-destructive">{form.formState.errors.meterId?.message}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="customerId">
            Customer account
          </label>
          <select
            id="customerId"
            className={`${fieldClassName} bg-white`}
            disabled={assignmentBlocked}
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

        {assignmentBlocked ? (
          <p className="rounded-2xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
            {customers.length === 0
              ? "Create at least one customer before assigning a meter."
              : "Register a meter first before assigning one."}
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
          disabled={isPending || assignmentBlocked}
        >
          {isPending ? "Assigning meter..." : "Assign meter"}
        </Button>
      </form>
    </AdminSurfacePanel>
  );
}
