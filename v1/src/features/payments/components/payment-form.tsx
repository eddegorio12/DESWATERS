"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { PaymentMethod } from "@prisma/client";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { recordPayment } from "@/features/payments/actions";
import {
  paymentFormSchema,
  type PaymentFormInput,
  type PaymentFormValues,
} from "@/features/payments/lib/payment-schema";
import { formatCurrency } from "@/features/billing/lib/billing-calculations";

const fieldClassName =
  "mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm text-foreground shadow-xs outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20";

const paymentMethodLabels: Record<PaymentMethod, string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank transfer",
  GCASH: "GCash",
  MAYA: "Maya",
  CARD: "Card",
};

type PaymentFormProps = {
  bills: {
    id: string;
    billingPeriod: string;
    totalCharges: number;
    outstandingBalance: number;
    customer: {
      accountNumber: string;
      name: string;
    };
    reading: {
      meter: {
        meterNumber: string;
      };
    };
  }[];
};

export function PaymentForm({ bills }: PaymentFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<PaymentFormInput, undefined, PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      billId: bills[0]?.id ?? "",
      amount: bills[0]?.outstandingBalance,
      method: PaymentMethod.CASH,
      referenceId: "",
    },
  });

  const selectedBillId = useWatch({
    control: form.control,
    name: "billId",
  });
  const selectedMethod = useWatch({
    control: form.control,
    name: "method",
  });
  const selectedBill = useMemo(
    () => bills.find((bill) => bill.id === selectedBillId) ?? bills[0] ?? null,
    [bills, selectedBillId]
  );
  const paymentBlocked = bills.length === 0;
  const requiresReference = selectedMethod !== PaymentMethod.CASH;

  useEffect(() => {
    if (!selectedBill) {
      form.setValue("amount", 0, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });
      return;
    }

    form.setValue("amount", selectedBill.outstandingBalance, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [form, selectedBill]);

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null);

    startTransition(async () => {
      try {
        await recordPayment(values);
        const nextBill = bills.find((bill) => bill.id !== values.billId);

        form.reset({
          billId: nextBill?.id ?? values.billId,
          amount: nextBill?.outstandingBalance,
          method: PaymentMethod.CASH,
          referenceId: "",
        });
        router.refresh();
      } catch (error) {
        console.error(error);
        setServerError(
          error instanceof Error ? error.message : "Payment could not be recorded."
        );
      }
    });
  });

  return (
    <section className="rounded-3xl border border-border bg-background p-6 shadow-sm">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Cashier Entry
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Record a manual payment
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Select an open bill, confirm the remaining balance, and encode the cashier
          payment manually.
        </p>
      </div>

      <form className="mt-6 space-y-5" onSubmit={onSubmit} noValidate>
        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="billId">
            Open bill
          </label>
          <select
            id="billId"
            className={fieldClassName}
            disabled={paymentBlocked}
            {...form.register("billId")}
          >
            {bills.length ? (
              bills.map((bill) => (
                <option key={bill.id} value={bill.id}>
                  {bill.customer.accountNumber} - {bill.billingPeriod} -{" "}
                  {formatCurrency(bill.outstandingBalance)}
                </option>
              ))
            ) : (
              <option value="">No open bills available</option>
            )}
          </select>
          <p className="mt-2 text-sm text-destructive">{form.formState.errors.billId?.message}</p>
        </div>

        {selectedBill ? (
          <div className="grid gap-4 rounded-2xl border border-border bg-muted/30 p-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Customer
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">
                {selectedBill.customer.name}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {selectedBill.customer.accountNumber}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Meter
              </p>
              <p className="mt-2 font-mono text-sm text-foreground">
                {selectedBill.reading.meter.meterNumber}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{selectedBill.billingPeriod}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Remaining Balance
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                {formatCurrency(selectedBill.outstandingBalance)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Original total: {formatCurrency(selectedBill.totalCharges)}
              </p>
            </div>
          </div>
        ) : null}

        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="amount">
            Payment amount
          </label>
          <input
            id="amount"
            type="number"
            step="0.01"
            className={fieldClassName}
            disabled={paymentBlocked}
            {...form.register("amount", { valueAsNumber: true })}
          />
          <p className="mt-2 text-sm text-destructive">{form.formState.errors.amount?.message}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="method">
            Payment method
          </label>
          <select
            id="method"
            className={fieldClassName}
            disabled={paymentBlocked}
            {...form.register("method")}
          >
            {Object.values(PaymentMethod).map((method) => (
              <option key={method} value={method}>
                {paymentMethodLabels[method]}
              </option>
            ))}
          </select>
          <p className="mt-2 text-sm text-destructive">{form.formState.errors.method?.message}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="referenceId">
            Reference ID
          </label>
          <input
            id="referenceId"
            type="text"
            className={fieldClassName}
            disabled={paymentBlocked}
            placeholder={requiresReference ? "Transaction or receipt reference" : "Optional"}
            {...form.register("referenceId")}
          />
          <p className="mt-2 text-sm text-muted-foreground">
            {requiresReference
              ? "Use this for transfer, wallet, or card references."
              : "Optional for cash receipts."}
          </p>
          <p className="mt-2 text-sm text-destructive">
            {form.formState.errors.referenceId?.message}
          </p>
        </div>

        {paymentBlocked ? (
          <p className="rounded-2xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
            Generate an unpaid bill first before recording a payment.
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
          disabled={isPending || paymentBlocked}
        >
          {isPending ? "Recording payment..." : "Record payment"}
        </Button>
      </form>
    </section>
  );
}
