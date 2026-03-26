"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { buttonVariants } from "@/components/ui/button-variants";
import { formatCurrency } from "@/features/billing/lib/billing-calculations";
import {
  disconnectCustomerService,
  reinstateCustomerService,
  updateReceivableFollowUp,
} from "@/features/follow-up/actions";
import { GenerateNoticeButton } from "@/features/notices/components/generate-notice-button";
import { cn } from "@/lib/utils";

type BillStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID" | "OVERDUE";
type CustomerStatus = "ACTIVE" | "INACTIVE" | "DISCONNECTED";
type ReceivableFollowUpStatus =
  | "CURRENT"
  | "REMINDER_SENT"
  | "FINAL_NOTICE_SENT"
  | "DISCONNECTION_REVIEW"
  | "DISCONNECTED"
  | "RESOLVED";

type FollowUpBoardProps = {
  customers: {
    id: string;
    accountNumber: string;
    name: string;
    status: CustomerStatus;
    statusNote: string | null;
    totalOutstanding: number;
    overdueBalance: number;
    canDisconnect: boolean;
    canReinstate: boolean;
    bills: {
      id: string;
      billingPeriod: string;
      meterNumber: string;
      dueDate: string;
      paidAmount: number;
      outstandingBalance: number;
      status: BillStatus;
      followUpStatus: ReceivableFollowUpStatus;
      followUpNote: string | null;
      daysPastDue: number;
    }[];
  }[];
};

function getServiceStatusClasses(status: CustomerStatus) {
  if (status === "DISCONNECTED") {
    return "bg-destructive/10 text-destructive";
  }

  if (status === "INACTIVE") {
    return "bg-amber-100 text-amber-800";
  }

  return "bg-emerald-100 text-emerald-700";
}

function getFollowUpStatusClasses(status: ReceivableFollowUpStatus) {
  if (status === "DISCONNECTED") {
    return "bg-destructive/10 text-destructive";
  }

  if (status === "DISCONNECTION_REVIEW") {
    return "bg-amber-100 text-amber-800";
  }

  if (status === "FINAL_NOTICE_SENT") {
    return "bg-orange-100 text-orange-800";
  }

  if (status === "REMINDER_SENT") {
    return "bg-primary/10 text-primary";
  }

  if (status === "RESOLVED") {
    return "bg-emerald-100 text-emerald-700";
  }

  return "bg-secondary text-secondary-foreground";
}

function getNextFollowUpAction(status: ReceivableFollowUpStatus) {
  switch (status) {
    case "CURRENT":
      return {
        label: "Send reminder",
        value: "REMINDER_SENT" as const,
      };
    case "REMINDER_SENT":
      return {
        label: "Send final notice",
        value: "FINAL_NOTICE_SENT" as const,
      };
    case "FINAL_NOTICE_SENT":
      return {
        label: "Queue review",
        value: "DISCONNECTION_REVIEW" as const,
      };
    default:
      return null;
  }
}

function getPrintableNoticeTemplate(
  status: ReceivableFollowUpStatus,
  billStatus: BillStatus
):
  | {
      label: string;
      template:
        | "BILLING_REMINDER"
        | "FOLLOW_UP_REMINDER"
        | "FINAL_NOTICE"
        | "DISCONNECTION";
    }
  | null {
  if (status === "DISCONNECTED") {
    return {
      label: "Disconnection notice",
      template: "DISCONNECTION",
    };
  }

  if (status === "FINAL_NOTICE_SENT" || status === "DISCONNECTION_REVIEW") {
    return {
      label: "Final notice",
      template: "FINAL_NOTICE",
    };
  }

  if (status === "REMINDER_SENT") {
    return {
      label: "Reminder notice",
      template: "FOLLOW_UP_REMINDER",
    };
  }

  if (billStatus === "UNPAID" || billStatus === "PARTIALLY_PAID") {
    return {
      label: "Billing reminder",
      template: "BILLING_REMINDER",
    };
  }

  return null;
}

export function FollowUpBoard({ customers }: FollowUpBoardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAction = (key: string, action: () => Promise<void>) => {
    setError(null);
    setPendingKey(key);

    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch (actionError) {
        setError(
          actionError instanceof Error
            ? actionError.message
            : "The follow-up action could not be completed."
        );
      } finally {
        setPendingKey(null);
      }
    });
  };

  return (
    <section className="rounded-[1.9rem] border border-[#dbe9e5] bg-white/92 p-6 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.55)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Receivables Workflow
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Overdue follow-up and service enforcement
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {customers.length} customer{customers.length === 1 ? "" : "s"} currently in scope
        </p>
      </div>

      {error ? (
        <p className="mt-5 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="mt-6 space-y-5">
        {customers.length ? (
          customers.map((customer) => (
            <article
              key={customer.id}
              className="rounded-[1.6rem] border border-[#dbe9e5] bg-[linear-gradient(180deg,#ffffff,#f6fbf9)] p-5 shadow-[0_18px_40px_-38px_rgba(16,63,67,0.45)]"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
                        getServiceStatusClasses(customer.status)
                      )}
                    >
                      {customer.status.replace("_", " ")}
                    </span>
                    <span className="inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-secondary-foreground">
                      {customer.accountNumber}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold tracking-tight text-foreground">
                      {customer.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Outstanding: {formatCurrency(customer.totalOutstanding)} | Overdue:{" "}
                      {formatCurrency(customer.overdueBalance)}
                    </p>
                    {customer.statusNote ? (
                      <p className="mt-2 text-sm text-muted-foreground">{customer.statusNote}</p>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {customer.canDisconnect ? (
                    <button
                      type="button"
                      className={cn(
                        buttonVariants({
                          className: "h-10 rounded-xl px-4",
                        })
                      )}
                      disabled={isPending}
                      onClick={() =>
                        runAction(`disconnect-${customer.id}`, () =>
                          disconnectCustomerService(customer.id)
                        )
                      }
                    >
                      {pendingKey === `disconnect-${customer.id}`
                        ? "Recording disconnection..."
                        : "Mark disconnected"}
                    </button>
                  ) : null}
                  {customer.canReinstate ? (
                    <button
                      type="button"
                      className={cn(
                        buttonVariants({
                          variant: "outline",
                          className: "h-10 rounded-xl px-4",
                        })
                      )}
                      disabled={isPending}
                      onClick={() =>
                        runAction(`reinstate-${customer.id}`, () =>
                          reinstateCustomerService(customer.id)
                        )
                      }
                    >
                      {pendingKey === `reinstate-${customer.id}`
                        ? "Reinstating..."
                        : "Reinstate service"}
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-[1.4rem] border border-[#dbe9e5]">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border text-left">
                    <thead className="bg-secondary/55">
                      <tr className="text-sm text-muted-foreground">
                        <th className="px-4 py-3 font-medium">Bill</th>
                        <th className="px-4 py-3 font-medium">Meter</th>
                        <th className="px-4 py-3 font-medium">Due</th>
                        <th className="px-4 py-3 font-medium">Paid</th>
                        <th className="px-4 py-3 font-medium">Balance</th>
                        <th className="px-4 py-3 font-medium">Workflow</th>
                        <th className="px-4 py-3 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-background">
                      {customer.bills.map((bill) => {
                        const nextAction = getNextFollowUpAction(bill.followUpStatus);
                        const printableNotice = getPrintableNoticeTemplate(
                          bill.followUpStatus,
                          bill.status
                        );
                        const allowNextAction =
                          bill.status === "OVERDUE" &&
                          customer.status !== "DISCONNECTED" &&
                          nextAction !== null;
                        const allowReset =
                          bill.followUpStatus !== "CURRENT" &&
                          bill.followUpStatus !== "DISCONNECTED" &&
                          bill.followUpStatus !== "RESOLVED" &&
                          customer.status !== "DISCONNECTED";

                        return (
                          <tr key={bill.id} className="align-top text-sm">
                            <td className="px-4 py-4">
                              <div className="font-medium text-foreground">{bill.billingPeriod}</div>
                              <div className="mt-1 font-mono text-xs text-muted-foreground">
                                {bill.id}
                              </div>
                            </td>
                            <td className="px-4 py-4 font-mono text-xs text-muted-foreground">
                              {bill.meterNumber}
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-foreground">{bill.dueDate}</div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                {bill.status === "OVERDUE"
                                  ? `${bill.daysPastDue} day${bill.daysPastDue === 1 ? "" : "s"} overdue`
                                  : "Current receivable"}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-muted-foreground">
                              {formatCurrency(bill.paidAmount)}
                            </td>
                            <td className="px-4 py-4 font-medium text-foreground">
                              {formatCurrency(bill.outstandingBalance)}
                            </td>
                            <td className="px-4 py-4">
                              <span
                                className={cn(
                                  "inline-flex rounded-full px-3 py-1 text-xs font-medium",
                                  getFollowUpStatusClasses(bill.followUpStatus)
                                )}
                              >
                                {bill.followUpStatus.replaceAll("_", " ")}
                              </span>
                              {bill.followUpNote ? (
                                <p className="mt-2 max-w-xs text-xs leading-5 text-muted-foreground">
                                  {bill.followUpNote}
                                </p>
                              ) : null}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex justify-end gap-2">
                                {allowReset ? (
                                  <button
                                    type="button"
                                    className={cn(
                                      buttonVariants({
                                        variant: "outline",
                                        size: "sm",
                                        className: "rounded-xl px-3",
                                      })
                                    )}
                                    disabled={isPending}
                                    onClick={() =>
                                      runAction(`reset-${bill.id}`, () =>
                                        updateReceivableFollowUp(bill.id, "CURRENT")
                                      )
                                    }
                                  >
                                    {pendingKey === `reset-${bill.id}` ? "Resetting..." : "Reset"}
                                  </button>
                                ) : null}
                                {allowNextAction && nextAction ? (
                                  <button
                                    type="button"
                                    className={cn(
                                      buttonVariants({
                                        size: "sm",
                                        className: "rounded-xl px-3",
                                      })
                                    )}
                                    disabled={isPending}
                                    onClick={() =>
                                      runAction(`${nextAction.value}-${bill.id}`, () =>
                                        updateReceivableFollowUp(bill.id, nextAction.value)
                                      )
                                    }
                                  >
                                    {pendingKey === `${nextAction.value}-${bill.id}`
                                      ? "Updating..."
                                      : nextAction.label}
                                  </button>
                                ) : null}
                                <Link
                                  href={`/admin/billing/${bill.id}`}
                                  className={cn(
                                    buttonVariants({
                                      variant: "outline",
                                      size: "sm",
                                      className: "rounded-xl px-3",
                                    })
                                  )}
                                >
                                  Statement
                                </Link>
                                {printableNotice ? (
                                  <GenerateNoticeButton
                                    billId={bill.id}
                                    template={printableNotice.template}
                                    label={printableNotice.label}
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl px-3"
                                  />
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-[1.6rem] border border-[#dbe9e5] bg-white px-5 py-10 text-center text-sm text-muted-foreground">
            No overdue or open receivable accounts currently require EH5 follow-up actions.
          </div>
        )}
      </div>
    </section>
  );
}
