"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { buttonVariants } from "@/components/ui/button-variants";
import {
  AdminSurfaceHeader,
  AdminSurfacePanel,
} from "@/features/admin/components/admin-surface-panel";
import { RecordListSection } from "@/features/admin/components/record-list-section";
import { StatusPill } from "@/features/admin/components/status-pill";
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

type FollowUpQueueFocus =
  | "ALL"
  | "NEEDS_REMINDER"
  | "NEEDS_FINAL_NOTICE"
  | "READY_FOR_DISCONNECTION"
  | "DISCONNECTED_HOLD"
  | "MONITORING";

type FollowUpBoardProps = {
  queue: {
    id: string;
    customerId: string;
    customerName: string;
    accountNumber: string;
    customerStatus: CustomerStatus;
    customerStatusNote: string | null;
    billingPeriod: string;
    meterNumber: string;
    dueDate: string;
    paidAmount: number;
    outstandingBalance: number;
    status: BillStatus;
    followUpStatus: ReceivableFollowUpStatus;
    followUpNote: string | null;
    daysPastDue: number;
    queueFocus: Exclude<FollowUpQueueFocus, "ALL">;
  }[];
  totalCount: number;
  query: string;
  focus: FollowUpQueueFocus;
  serviceActions: {
    id: string;
    accountNumber: string;
    name: string;
    status: CustomerStatus;
    totalOutstanding: number;
    overdueBalance: number;
    canDisconnect: boolean;
    canReinstate: boolean;
    statusNote: string | null;
    highestDaysPastDue: number;
    escalatedBillCount: number;
  }[];
};

function getServiceStatusTone(status: CustomerStatus) {
  if (status === "DISCONNECTED") {
    return "attention" as const;
  }

  if (status === "INACTIVE") {
    return "readonly" as const;
  }

  return "success" as const;
}

function getFollowUpStatusTone(status: ReceivableFollowUpStatus) {
  if (status === "DISCONNECTED") {
    return "attention" as const;
  }

  if (status === "DISCONNECTION_REVIEW") {
    return "overdue" as const;
  }

  if (status === "FINAL_NOTICE_SENT") {
    return "attention" as const;
  }

  if (status === "REMINDER_SENT") {
    return "pending" as const;
  }

  if (status === "RESOLVED") {
    return "success" as const;
  }

  return "readonly" as const;
}

function getQueueFocusMeta(focus: Exclude<FollowUpQueueFocus, "ALL">) {
  switch (focus) {
    case "READY_FOR_DISCONNECTION":
      return {
        label: "Ready for disconnection",
        tone: "overdue" as const,
        summary: "Final notice or review is already on record.",
      };
    case "NEEDS_FINAL_NOTICE":
      return {
        label: "Needs final notice",
        tone: "attention" as const,
        summary: "Reminder was recorded and the next escalation is due.",
      };
    case "NEEDS_REMINDER":
      return {
        label: "Needs reminder",
        tone: "pending" as const,
        summary: "Overdue account has not entered follow-up yet.",
      };
    case "DISCONNECTED_HOLD":
      return {
        label: "Disconnected hold",
        tone: "attention" as const,
        summary: "Service is off and the account needs clearance or reinstatement review.",
      };
    default:
      return {
        label: "Monitoring",
        tone: "readonly" as const,
        summary: "Keep visible, but no immediate escalation step is due.",
      };
  }
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

function getDueDetail(status: BillStatus, daysPastDue: number) {
  if (status === "OVERDUE") {
    return `${daysPastDue} day${daysPastDue === 1 ? "" : "s"} overdue`;
  }

  return "Current receivable";
}

export function FollowUpBoard({
  queue,
  totalCount,
  query,
  focus,
  serviceActions,
}: FollowUpBoardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasActiveFilters = Boolean(query || focus !== "ALL");
  const resultsText = hasActiveFilters
    ? `Showing ${queue.length} of ${totalCount} follow-up item${totalCount === 1 ? "" : "s"}`
    : `${queue.length} follow-up item${queue.length === 1 ? "" : "s"} currently in scope`;
  const focusCounts = {
    NEEDS_REMINDER: queue.filter((bill) => bill.queueFocus === "NEEDS_REMINDER").length,
    NEEDS_FINAL_NOTICE: queue.filter((bill) => bill.queueFocus === "NEEDS_FINAL_NOTICE").length,
    READY_FOR_DISCONNECTION: queue.filter(
      (bill) => bill.queueFocus === "READY_FOR_DISCONNECTION"
    ).length,
    DISCONNECTED_HOLD: queue.filter((bill) => bill.queueFocus === "DISCONNECTED_HOLD").length,
  };

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
    <>
      {error ? (
        <p className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <AdminSurfacePanel>
        <AdminSurfaceHeader
          eyebrow="Action Ladder"
          title="Escalate overdue balances by urgency, then handle service status separately."
          description="Review bills by urgency first, then use the service-action panel for disconnection or reinstatement once the account reaches the right stage."
          aside={
            <div className="grid gap-3 sm:grid-cols-2">
              <article className="rounded-[1.1rem] border border-border/65 bg-secondary/24 px-4 py-3">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/72">
                  Ready for disconnection
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {focusCounts.READY_FOR_DISCONNECTION}
                </p>
              </article>
              <article className="rounded-[1.1rem] border border-border/65 bg-background/85 px-4 py-3">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/72">
                  Disconnected hold
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {focusCounts.DISCONNECTED_HOLD}
                </p>
              </article>
            </div>
          }
        />

        <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-4">
          <article className="rounded-[1.2rem] border border-border/65 bg-white/76 p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Needs reminder
              </p>
              <StatusPill priority="pending">{focusCounts.NEEDS_REMINDER}</StatusPill>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Overdue bills still at the first follow-up stage.
            </p>
          </article>
          <article className="rounded-[1.2rem] border border-border/65 bg-white/76 p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Needs final notice
              </p>
              <StatusPill priority="attention">{focusCounts.NEEDS_FINAL_NOTICE}</StatusPill>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Reminder already logged, so escalation is the next bill-level move.
            </p>
          </article>
          <article className="rounded-[1.2rem] border border-border/65 bg-white/76 p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Ready for disconnection
              </p>
              <StatusPill priority="overdue">{focusCounts.READY_FOR_DISCONNECTION}</StatusPill>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Final notice or disconnection review is already on record.
            </p>
          </article>
          <article className="rounded-[1.2rem] border border-border/65 bg-white/76 p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Service action panel
              </p>
              <StatusPill priority="ready">{serviceActions.length}</StatusPill>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Customers already eligible for disconnection or reinstatement review.
            </p>
          </article>
        </div>
      </AdminSurfacePanel>

      <section className="grid gap-4 xl:grid-cols-2">
        {serviceActions.filter((customer) => customer.canDisconnect).length ? (
          <AdminSurfacePanel>
            <AdminSurfaceHeader
              eyebrow="Service Enforcement"
              title="Customers ready for disconnection"
              aside={
                <StatusPill priority="overdue">
                  {serviceActions.filter((customer) => customer.canDisconnect).length} ready
                </StatusPill>
              }
            />

            <div className="mt-5 grid gap-4">
              {serviceActions
                .filter((customer) => customer.canDisconnect)
                .map((customer) => (
                  <article
                    key={customer.id}
                    className="rounded-[1.25rem] border border-border/65 bg-white/76 p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusPill priority={getServiceStatusTone(customer.status)}>
                            {customer.status.replace("_", " ")}
                          </StatusPill>
                          <StatusPill priority="ready">{customer.accountNumber}</StatusPill>
                        </div>
                        <h3 className="mt-3 text-lg font-semibold text-foreground">
                          {customer.name}
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {customer.escalatedBillCount} escalated bill
                          {customer.escalatedBillCount === 1 ? "" : "s"} and{" "}
                          {customer.highestDaysPastDue} day
                          {customer.highestDaysPastDue === 1 ? "" : "s"} past due at the highest
                          overdue point.
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Overdue {formatCurrency(customer.overdueBalance)} | Outstanding{" "}
                          {formatCurrency(customer.totalOutstanding)}
                        </p>
                        {customer.statusNote ? (
                          <p className="mt-2 text-sm text-muted-foreground">
                            {customer.statusNote}
                          </p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        className={cn(
                          buttonVariants({ className: "h-10 w-full rounded-xl px-4 sm:w-auto" })
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
                    </div>
                  </article>
                ))}
            </div>
          </AdminSurfacePanel>
        ) : null}

        {serviceActions.filter((customer) => customer.canReinstate).length ? (
          <AdminSurfacePanel>
            <AdminSurfaceHeader
              eyebrow="Reinstatement Review"
              title="Customers cleared for reconnection"
              aside={
                <StatusPill priority="success">
                  {serviceActions.filter((customer) => customer.canReinstate).length} ready
                </StatusPill>
              }
            />

            <div className="mt-5 grid gap-4">
              {serviceActions
                .filter((customer) => customer.canReinstate)
                .map((customer) => (
                  <article
                    key={customer.id}
                    className="rounded-[1.25rem] border border-border/65 bg-white/76 p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusPill priority={getServiceStatusTone(customer.status)}>
                            {customer.status.replace("_", " ")}
                          </StatusPill>
                          <StatusPill priority="ready">{customer.accountNumber}</StatusPill>
                        </div>
                        <h3 className="mt-3 text-lg font-semibold text-foreground">
                          {customer.name}
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          No overdue balances remain, so reinstatement can proceed.
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Outstanding {formatCurrency(customer.totalOutstanding)}
                        </p>
                        {customer.statusNote ? (
                          <p className="mt-2 text-sm text-muted-foreground">
                            {customer.statusNote}
                          </p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        className={cn(
                          buttonVariants({
                            variant: "outline",
                            className: "h-10 w-full rounded-xl px-4 sm:w-auto",
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
                    </div>
                  </article>
                ))}
            </div>
          </AdminSurfacePanel>
        ) : null}
      </section>

      <RecordListSection
        eyebrow="Follow-up Queue"
        title="Bill-level receivables actions"
        description="Search by customer, account, bill period, or meter, then narrow by escalation focus so the highest-pressure overdue items rise ahead of supporting monitoring work."
        resultsText={resultsText}
        searchName="query"
        searchValue={query}
        searchPlaceholder="Search customer, account, bill, meter, or stage"
        filterName="focus"
        filterValue={focus}
        filterLabel="Follow-up focus"
        filterOptions={[
          { label: "All follow-up items", value: "ALL" },
          { label: "Ready for disconnection", value: "READY_FOR_DISCONNECTION" },
          { label: "Needs final notice", value: "NEEDS_FINAL_NOTICE" },
          { label: "Needs reminder", value: "NEEDS_REMINDER" },
          { label: "Disconnected hold", value: "DISCONNECTED_HOLD" },
          { label: "Monitoring", value: "MONITORING" },
        ]}
        helperText="Filter by escalation focus first. The queue is ordered so action-ready overdue balances appear before general monitoring items."
        nextStep="Next: update the bill-level stage here, then use the service-action panel once the customer is eligible for disconnection or reinstatement."
        resetHref="/admin/follow-up"
        hasActiveFilters={hasActiveFilters}
      >
        <div className="grid gap-4">
          {queue.length ? (
            queue.map((bill) => {
              const nextAction = getNextFollowUpAction(bill.followUpStatus);
              const printableNotice = getPrintableNoticeTemplate(
                bill.followUpStatus,
                bill.status
              );
              const allowNextAction =
                bill.status === "OVERDUE" &&
                bill.customerStatus !== "DISCONNECTED" &&
                nextAction !== null;
              const allowReset =
                bill.followUpStatus !== "CURRENT" &&
                bill.followUpStatus !== "DISCONNECTED" &&
                bill.followUpStatus !== "RESOLVED" &&
                bill.customerStatus !== "DISCONNECTED";
              const focusMeta = getQueueFocusMeta(bill.queueFocus);

              return (
                <article
                  key={bill.id}
                  className="rounded-[1.5rem] border border-[#dbe9e5] bg-white/92 p-5 shadow-[0_18px_40px_-38px_rgba(16,63,67,0.3)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill priority={focusMeta.tone}>{focusMeta.label}</StatusPill>
                      <StatusPill priority={getFollowUpStatusTone(bill.followUpStatus)}>
                        {bill.followUpStatus.replaceAll("_", " ")}
                      </StatusPill>
                      <StatusPill priority={getServiceStatusTone(bill.customerStatus)}>
                        {bill.customerStatus.replace("_", " ")}
                      </StatusPill>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div>{bill.billingPeriod}</div>
                      <div className="mt-1 font-mono text-xs">{bill.id}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">
                          {bill.customerName}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {bill.accountNumber} | Meter {bill.meterNumber}
                        </p>
                      </div>
                      <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                        {focusMeta.summary}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span>Due {bill.dueDate}</span>
                        <span>{getDueDetail(bill.status, bill.daysPastDue)}</span>
                        <span>Paid {formatCurrency(bill.paidAmount)}</span>
                        <span>Balance {formatCurrency(bill.outstandingBalance)}</span>
                      </div>
                      {bill.followUpNote ? (
                        <p className="text-sm text-muted-foreground">{bill.followUpNote}</p>
                      ) : null}
                      {bill.customerStatusNote ? (
                        <p className="text-sm text-muted-foreground">{bill.customerStatusNote}</p>
                      ) : null}
                    </div>

                    <div className="grid w-full gap-2 sm:grid-cols-2 xl:max-w-md">
                      {allowNextAction && nextAction ? (
                        <button
                          type="button"
                          className={cn(
                            buttonVariants({
                              size: "sm",
                              className: "w-full rounded-xl px-3 justify-center",
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
                            className: "w-full rounded-xl px-3 justify-center",
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
                          className="w-full justify-center rounded-xl px-3"
                        />
                      ) : null}
                      {allowReset ? (
                        <button
                          type="button"
                          className={cn(
                            buttonVariants({
                              variant: "outline",
                              size: "sm",
                              className: "w-full rounded-xl px-3 justify-center",
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
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-[1.5rem] border border-[#dbe9e5] bg-background px-4 py-10 text-center text-sm text-muted-foreground">
              {hasActiveFilters
                ? "No follow-up items match the current search or escalation focus."
                : "No overdue or open receivable accounts currently require follow-up actions."}
            </div>
          )}
        </div>
      </RecordListSection>
    </>
  );
}
