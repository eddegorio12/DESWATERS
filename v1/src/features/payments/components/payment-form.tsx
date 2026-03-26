"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { recordPayment } from "@/features/payments/actions";
import {
  PAYMENT_METHODS,
  type PaymentMethod,
} from "@/features/payments/lib/payment-methods";
import {
  paymentFormSchema,
  type PaymentFormInput,
  type PaymentFormValues,
} from "@/features/payments/lib/payment-schema";
import { formatCurrency } from "@/features/billing/lib/billing-calculations";
import { cn } from "@/lib/utils";

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

type RecordedPaymentSummary = {
  id: string;
  receiptNumber: string;
  amount: number;
  balanceAfter: number;
  billId: string;
};

export function PaymentForm({ bills }: PaymentFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [latestRecordedPayment, setLatestRecordedPayment] =
    useState<RecordedPaymentSummary | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<PaymentFormInput, undefined, PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      billId: bills[0]?.id ?? "",
      amount: bills[0]?.outstandingBalance,
      method: "CASH",
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
  const enteredAmount = useWatch({
    control: form.control,
    name: "amount",
  });
  const selectedBill = useMemo(
    () => bills.find((bill) => bill.id === selectedBillId) ?? bills[0] ?? null,
    [bills, selectedBillId]
  );
  const paymentBlocked = bills.length === 0;
  const requiresReference = selectedMethod !== "CASH";
  const safeEnteredAmount =
    typeof enteredAmount === "number" && Number.isFinite(enteredAmount) ? enteredAmount : 0;
  const balanceAfterPreview = selectedBill
    ? Math.max(0, selectedBill.outstandingBalance - safeEnteredAmount)
    : 0;
  const settlementModeLabel =
    selectedBill && safeEnteredAmount > 0
      ? balanceAfterPreview <= 0.000001
        ? "Full settlement"
        : "Partial settlement"
      : "Awaiting amount";

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
        const createdPayment = await recordPayment(values);
        const nextBill = bills.find((bill) => bill.id !== values.billId);

        setLatestRecordedPayment(createdPayment);
        form.reset({
          billId: nextBill?.id ?? values.billId,
          amount: nextBill?.outstandingBalance,
          method: "CASH",
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
    <section className="rounded-[1.9rem] border border-[#dbe9e5] bg-white/92 p-6 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.55)]">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Cashier Entry
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Record a settlement and issue an official receipt
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Select an open bill, post a full or partial settlement, and issue a receipt from
          the same workflow.
        </p>
      </div>

      <form className="mt-6 space-y-5" onSubmit={onSubmit} noValidate>
        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="billId">
            Open bill
          </label>
          <select
            id="billId"
            className={`${fieldClassName} bg-white`}
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
          <div className="grid gap-4 rounded-[1.4rem] border border-[#dbe9e5] bg-[linear-gradient(180deg,#f8fbfa,#eff7f5)] p-4 sm:grid-cols-3">
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
            min="0.01"
            max={selectedBill?.outstandingBalance}
            className={`${fieldClassName} bg-white`}
            disabled={paymentBlocked}
            {...form.register("amount", { valueAsNumber: true })}
          />
          <p className="mt-2 text-sm text-muted-foreground">
            Exact-balance posting is no longer required, but overpayment is still blocked
            until customer credit handling is explicitly approved.
          </p>
          <p className="mt-2 text-sm text-destructive">{form.formState.errors.amount?.message}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Next step after save: open the new receipt or jump back to the related bill.
          </p>
        </div>

        {selectedBill ? (
          <div className="grid gap-4 rounded-[1.4rem] border border-[#dbe9e5] bg-white p-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Settlement mode
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {settlementModeLabel}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Payment preview
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {formatCurrency(safeEnteredAmount)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Balance after posting
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {formatCurrency(balanceAfterPreview)}
              </p>
            </div>
          </div>
        ) : null}

        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="method">
            Payment method
          </label>
          <select
            id="method"
            className={`${fieldClassName} bg-white`}
            disabled={paymentBlocked}
            {...form.register("method")}
          >
            {PAYMENT_METHODS.map((method) => (
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
            className={`${fieldClassName} bg-white`}
            disabled={paymentBlocked}
            placeholder={requiresReference ? "Transaction or wallet reference" : "Optional"}
            {...form.register("referenceId")}
          />
          <p className="mt-2 text-sm text-muted-foreground">
            {requiresReference
              ? "Required for bank transfer, wallet, and card settlements."
              : "Optional for cash counter postings."}
          </p>
          <p className="mt-2 text-sm text-destructive">
            {form.formState.errors.referenceId?.message}
          </p>
        </div>

        {latestRecordedPayment ? (
          <div className="rounded-[1.4rem] border border-emerald-200 bg-emerald-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Receipt ready
            </p>
            <p className="mt-2 text-sm text-emerald-900">
              {latestRecordedPayment.receiptNumber} was issued for{" "}
              {formatCurrency(latestRecordedPayment.amount)}.
            </p>
            <p className="mt-1 text-sm text-emerald-800">
              Remaining balance after posting:{" "}
              {formatCurrency(latestRecordedPayment.balanceAfter)}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={`/admin/payments/${latestRecordedPayment.id}/receipt`}
                className={cn(
                  buttonVariants({
                    className: "h-10 rounded-xl px-4",
                  })
                )}
              >
                View official receipt
              </Link>
              <Link
                href={`/admin/billing/${latestRecordedPayment.billId}`}
                className={cn(
                  buttonVariants({
                    variant: "outline",
                    className: "h-10 rounded-xl px-4",
                  })
                )}
              >
                Review related bill
              </Link>
            </div>
          </div>
        ) : null}

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
          {isPending ? "Recording settlement..." : "Record payment and issue receipt"}
        </Button>
      </form>
    </section>
  );
}
