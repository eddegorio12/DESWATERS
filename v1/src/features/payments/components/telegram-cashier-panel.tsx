"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AutomationApprovalStatus, TelegramCashierSessionStage, TelegramConversationStatus } from "@prisma/client";

import { buttonVariants } from "@/components/ui/button-variants";
import {
  AdminSurfaceHeader,
  AdminSurfacePanel,
} from "@/features/admin/components/admin-surface-panel";
import {
  saveTelegramCashierIdentity,
  toggleTelegramCashierIdentity,
  type TelegramCashierLinkState,
} from "@/features/payments/actions";
import { cn } from "@/lib/utils";

const initialState: TelegramCashierLinkState = {};
const fieldClassName =
  "mt-2 h-11 w-full rounded-2xl border border-input bg-white px-4 text-sm text-foreground shadow-xs outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value);
}

function formatSessionStatus(status: TelegramConversationStatus, stage: TelegramCashierSessionStage) {
  if (status === "ACTIVE" && stage === "AWAITING_APPROVAL") {
    return "Awaiting approval";
  }

  if (status === "ACTIVE") {
    return "In progress";
  }

  if (status === "COMPLETED") {
    return "Completed";
  }

  if (status === "CANCELLED") {
    return "Cancelled";
  }

  return "Expired";
}

function formatApprovalStatus(status: AutomationApprovalStatus | null) {
  if (!status) {
    return "No approval yet";
  }

  return status.replaceAll("_", " ").toLowerCase();
}

export function TelegramCashierPanel({
  currentLink,
  recentSessions,
}: {
  currentLink: {
    telegramUserId: string;
    telegramChatId: string | null;
    telegramUsername: string | null;
    isActive: boolean;
    lastSeenAt: string | null;
  } | null;
  recentSessions: {
    id: string;
    status: TelegramConversationStatus;
    stage: TelegramCashierSessionStage;
    lastInboundText: string | null;
    lastBotReply: string | null;
    createdAt: string;
    completedAt: string | null;
    approvalStatus: AutomationApprovalStatus | null;
    cashierName: string;
    telegramUserId: string;
    telegramUsername: string | null;
    payment:
      | {
          id: string;
          receiptNumber: string;
          amount: number;
        }
      | null;
  }[];
}) {
  const [saveState, saveAction, savePending] = useActionState(
    saveTelegramCashierIdentity,
    initialState
  );
  const [toggleState, toggleAction, togglePending] = useActionState(
    toggleTelegramCashierIdentity,
    initialState
  );
  const feedback = toggleState.error
    ? { tone: "error" as const, text: toggleState.error }
    : saveState.error
      ? { tone: "error" as const, text: saveState.error }
      : toggleState.message
        ? { tone: "success" as const, text: toggleState.message }
        : saveState.message
          ? { tone: "success" as const, text: saveState.message }
          : null;

  return (
    <AdminSurfacePanel>
      <AdminSurfaceHeader
        eyebrow="Telegram Cashier"
        title="Link one Telegram cashier identity and monitor recent bot-led posting activity"
        description="EH18 lets an authorized cashier start a cash payment intent from Telegram, clarify one bill, confirm partial settlement explicitly, and queue a bounded PAYMENT_POST approval before DWDS records anything."
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <div className="space-y-4 rounded-[1.35rem] border border-border/70 bg-background/90 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.15rem] border border-border/70 bg-secondary/26 px-4 py-3">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/72">
                Link status
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">
                {currentLink ? (currentLink.isActive ? "Linked and active" : "Linked but paused") : "Not linked"}
              </p>
            </div>
            <div className="rounded-[1.15rem] border border-border/70 bg-secondary/26 px-4 py-3">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/72">
                Last seen
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">
                {currentLink?.lastSeenAt ?? "No Telegram activity yet"}
              </p>
            </div>
          </div>

          <form action={saveAction} className="grid gap-4">
            <div>
              <label className="text-sm font-medium text-foreground" htmlFor="telegramUserId">
                Telegram user ID
              </label>
              <input
                id="telegramUserId"
                name="telegramUserId"
                defaultValue={currentLink?.telegramUserId ?? ""}
                placeholder="Example: 123456789"
                className={fieldClassName}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground" htmlFor="telegramChatId">
                Telegram chat ID
              </label>
              <input
                id="telegramChatId"
                name="telegramChatId"
                defaultValue={currentLink?.telegramChatId ?? ""}
                placeholder="Optional until the first inbound message arrives"
                className={fieldClassName}
              />
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                Link your own Telegram account here once. After that, the bot can accept payment
                lines such as <span className="font-mono">pay DWDS-SMP-1001 350</span>.
              </p>
            </div>

            <button
              type="submit"
              className="h-11 rounded-2xl bg-primary px-5 text-sm font-medium text-primary-foreground"
              disabled={savePending}
            >
              {savePending ? "Saving Telegram link..." : currentLink ? "Update Telegram link" : "Save Telegram link"}
            </button>
          </form>

          {currentLink ? (
            <form action={toggleAction}>
              <input type="hidden" name="enable" value={currentLink.isActive ? "false" : "true"} />
              <button
                type="submit"
                className="h-11 rounded-2xl border border-border bg-background px-5 text-sm font-medium text-foreground"
                disabled={togglePending}
              >
                {togglePending
                  ? "Updating assistant status..."
                  : currentLink.isActive
                    ? "Pause Telegram cashier assistant"
                    : "Enable Telegram cashier assistant"}
              </button>
            </form>
          ) : null}

          {feedback ? (
            <p
              className={`rounded-2xl border px-4 py-3 text-sm ${
                feedback.tone === "error"
                  ? "border-destructive/20 bg-destructive/5 text-destructive"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
              }`}
            >
              {feedback.text}
            </p>
          ) : null}
        </div>

        <div className="space-y-4">
          {recentSessions.length ? (
            recentSessions.map((session) => (
              <article
                key={session.id}
                className="rounded-[1.35rem] border border-border/70 bg-background/90 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {session.cashierName} via Telegram user {session.telegramUserId}
                      {session.telegramUsername ? ` (@${session.telegramUsername})` : ""}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{session.createdAt}</p>
                  </div>
                  <div className="rounded-full border border-border/70 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-foreground">
                    {formatSessionStatus(session.status, session.stage)}
                  </div>
                </div>

                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Approval
                    </dt>
                    <dd className="mt-1 text-foreground">{formatApprovalStatus(session.approvalStatus)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Last cashier message
                    </dt>
                    <dd className="mt-1 text-foreground">{session.lastInboundText ?? "No message recorded"}</dd>
                  </div>
                </dl>

                {session.lastBotReply ? (
                  <p className="mt-4 rounded-[1.1rem] border border-border/70 bg-secondary/24 px-4 py-3 text-sm text-muted-foreground">
                    {session.lastBotReply}
                  </p>
                ) : null}

                {session.payment ? (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[1.1rem] border border-emerald-200 bg-emerald-50/70 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-emerald-900">
                        Receipt {session.payment.receiptNumber}
                      </p>
                      <p className="mt-1 text-xs text-emerald-800">
                        {formatCurrency(session.payment.amount)} posted from Telegram
                      </p>
                    </div>
                    <Link
                      href={`/admin/payments/${session.payment.id}/receipt`}
                      className={cn(
                        buttonVariants({
                          variant: "outline",
                          size: "sm",
                          className: "rounded-xl px-3",
                        })
                      )}
                    >
                      View receipt
                    </Link>
                  </div>
                ) : null}
              </article>
            ))
          ) : (
            <div className="rounded-[1.35rem] border border-dashed border-border/70 bg-background/70 p-5 text-sm text-muted-foreground">
              No Telegram cashier sessions exist yet. Link a cashier account first, then send a
              payment line to the bot to start the EH18 flow.
            </div>
          )}
        </div>
      </div>
    </AdminSurfacePanel>
  );
}
