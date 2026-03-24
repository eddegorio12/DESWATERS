"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  createCustomer,
} from "@/features/customers/actions";
import {
  customerFormSchema,
  type CustomerFormInput,
  type CustomerFormValues,
} from "@/features/customers/lib/customer-schema";

const fieldClassName =
  "mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm text-foreground shadow-xs outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20";

export function CustomerForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<CustomerFormInput, undefined, CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      address: "",
      contactNumber: "",
      email: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null);

    startTransition(async () => {
      try {
        await createCustomer(values);
        form.reset();
        router.refresh();
      } catch (error) {
        console.error(error);
        setServerError("Customer could not be created. Please try again.");
      }
    });
  });

  return (
    <section className="rounded-[1.9rem] border border-[#dbe9e5] bg-white/92 p-6 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.55)]">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          New Customer
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Create a residential account
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Enter the base customer record here. Meter assignment now happens in the meter
          module.
        </p>
      </div>

      <form className="mt-6 space-y-5" onSubmit={onSubmit} noValidate>
        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="name">
            Customer name
          </label>
          <input
            id="name"
            type="text"
            className={`${fieldClassName} bg-white`}
            placeholder="Maria Santos"
            {...form.register("name")}
          />
          <p className="mt-2 text-sm text-destructive">{form.formState.errors.name?.message}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="address">
            Service address
          </label>
          <textarea
            id="address"
            rows={4}
            className={`${fieldClassName} resize-y bg-white`}
            placeholder="Purok 2, Barangay Poblacion"
            {...form.register("address")}
          />
          <p className="mt-2 text-sm text-destructive">
            {form.formState.errors.address?.message}
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="contactNumber">
            Contact number
          </label>
          <input
            id="contactNumber"
            type="text"
            className={`${fieldClassName} bg-white`}
            placeholder="09XX XXX XXXX"
            {...form.register("contactNumber")}
          />
          <p className="mt-2 text-sm text-destructive">
            {form.formState.errors.contactNumber?.message}
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            type="email"
            className={`${fieldClassName} bg-white`}
            placeholder="customer@example.com"
            {...form.register("email")}
          />
          <p className="mt-2 text-sm text-muted-foreground">
            Optional, but required if overdue notices should also go out by email.
          </p>
          <p className="mt-2 text-sm text-destructive">{form.formState.errors.email?.message}</p>
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
          {isPending ? "Saving customer..." : "Create customer"}
        </Button>
      </form>
    </section>
  );
}
