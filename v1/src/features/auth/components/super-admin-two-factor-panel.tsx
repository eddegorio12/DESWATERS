"use client";

import Image from "next/image";
import { useActionState } from "react";

import {
  beginSuperAdminTwoFactorSetup,
  confirmSuperAdminTwoFactorSetup,
  disableSuperAdminTwoFactor,
  type TwoFactorSetupState,
} from "@/features/auth/actions/auth-actions";

const initialActionState: TwoFactorSetupState = {};
const fieldClassName =
  "mt-2 h-11 w-full rounded-2xl border border-input bg-white px-4 text-sm text-foreground shadow-xs outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20";

type PendingSetup = {
  secret: string;
  otpAuthUri: string;
  qrDataUrl: string;
};

export function SuperAdminTwoFactorPanel({
  email,
  isEnabled,
  enabledAt,
  lastVerifiedAt,
  recoveryCodeCount,
  pendingSetup: initialPendingSetup,
}: {
  email: string;
  isEnabled: boolean;
  enabledAt: string | null;
  lastVerifiedAt: string | null;
  recoveryCodeCount: number;
  pendingSetup: PendingSetup | null;
}) {
  const [startState, startAction, startPending] = useActionState(
    beginSuperAdminTwoFactorSetup,
    initialActionState
  );
  const [confirmState, confirmAction, confirmPending] = useActionState(
    confirmSuperAdminTwoFactorSetup,
    initialActionState
  );
  const [disableState, disableAction, disablePending] = useActionState(
    disableSuperAdminTwoFactor,
    initialActionState
  );
  const panelEnabled = disableState.disabled ? false : confirmState.enabled ? true : isEnabled;
  const panelPendingSetup =
    disableState.disabled || confirmState.enabled
      ? null
      : startState.pendingSetup ?? initialPendingSetup;
  const panelRecoveryCodes = disableState.disabled ? null : confirmState.recoveryCodes ?? null;
  const panelRecoveryCodeCount = panelRecoveryCodes?.length
    ? panelRecoveryCodes.length
    : disableState.disabled
      ? 0
      : startState.pendingSetup
        ? 0
        : recoveryCodeCount;

  const feedback = disableState.error
    ? { tone: "error" as const, text: disableState.error }
    : confirmState.error
      ? { tone: "error" as const, text: confirmState.error }
      : startState.error
        ? { tone: "error" as const, text: startState.error }
        : disableState.message
          ? { tone: "success" as const, text: disableState.message }
          : confirmState.message
            ? { tone: "success" as const, text: confirmState.message }
            : startState.message
              ? { tone: "success" as const, text: startState.message }
              : null;

  return (
    <section className="dwds-panel p-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Two-Factor Sign-In
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Protect the SUPER_ADMIN account with an authenticator app
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Optional EH11 security follow-on. When enabled, DWDS requires your password plus a
          6-digit authenticator code or one recovery code before a SUPER_ADMIN session is issued.
        </p>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <div className="rounded-[1.2rem] border border-border/70 bg-secondary/26 px-4 py-3">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/72">
            Status
          </p>
          <p className="mt-2 text-sm font-medium text-foreground">
            {panelEnabled ? "Enabled" : panelPendingSetup ? "Setup pending" : "Not enabled"}
          </p>
        </div>
        <div className="rounded-[1.2rem] border border-border/70 bg-secondary/26 px-4 py-3">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/72">
            Recovery codes
          </p>
          <p className="mt-2 text-sm font-medium text-foreground">{panelRecoveryCodeCount}</p>
        </div>
        <div className="rounded-[1.2rem] border border-border/70 bg-secondary/26 px-4 py-3">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/72">
            Last verified
          </p>
          <p className="mt-2 text-sm font-medium text-foreground">{lastVerifiedAt ?? "Not yet"}</p>
        </div>
      </div>

      <div className="mt-6 rounded-[1.35rem] border border-border/70 bg-background/85 p-5">
        <p className="text-sm font-medium text-foreground">Authenticator account label</p>
        <p className="mt-2 text-sm text-muted-foreground">{email}</p>
        {enabledAt ? (
          <p className="mt-2 text-xs leading-6 text-muted-foreground">
            Two-factor sign-in was enabled on {enabledAt}.
          </p>
        ) : null}
      </div>

      {feedback ? (
        <p
          className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${
            feedback.tone === "error"
              ? "border-destructive/20 bg-destructive/5 text-destructive"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {feedback.text}
        </p>
      ) : null}

      {!panelEnabled && !panelPendingSetup ? (
        <form action={startAction} className="mt-6">
          <button
            type="submit"
            className="h-11 rounded-2xl bg-primary px-5 text-sm font-medium text-primary-foreground"
            disabled={startPending}
          >
            {startPending ? "Generating setup key..." : "Generate setup key"}
          </button>
        </form>
      ) : null}

      {panelPendingSetup ? (
        <div className="mt-6 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[1.35rem] border border-border/70 bg-background/90 p-5">
            <p className="text-sm font-medium text-foreground">Scan QR code</p>
            <div className="mt-4 flex justify-center rounded-[1.25rem] border border-border/70 bg-white p-4">
              <Image
                src={panelPendingSetup.qrDataUrl}
                alt="QR code for DWDS SUPER_ADMIN two-factor setup"
                className="h-56 w-56 rounded-lg"
                width={224}
                height={224}
                unoptimized
              />
            </div>
            <p className="mt-4 text-xs leading-6 text-muted-foreground">
              Scan this QR code with your authenticator app. If scanning is unavailable, use the
              manual setup key below.
            </p>
            <p className="mt-5 text-sm font-medium text-foreground">Manual setup key</p>
            <p className="mt-3 font-mono text-sm tracking-[0.24em] text-foreground">
              {panelPendingSetup.secret}
            </p>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              OTPAuth URI
            </label>
            <textarea
              readOnly
              value={panelPendingSetup.otpAuthUri}
              className="mt-2 min-h-28 w-full rounded-2xl border border-input bg-white px-4 py-3 text-xs text-foreground shadow-xs outline-none"
            />
          </div>

          <form action={confirmAction} className="rounded-[1.35rem] border border-border/70 bg-background/90 p-5">
            <p className="text-sm font-medium text-foreground">Confirm and enable</p>
            <div className="mt-4">
              <label className="text-sm font-medium text-foreground" htmlFor="twoFactorCurrentPassword">
                Current password
              </label>
              <input
                id="twoFactorCurrentPassword"
                name="currentPassword"
                type="password"
                className={fieldClassName}
                required
              />
            </div>
            <div className="mt-4">
              <label className="text-sm font-medium text-foreground" htmlFor="verificationCode">
                6-digit code
              </label>
              <input
                id="verificationCode"
                name="verificationCode"
                inputMode="numeric"
                pattern="[0-9]{6}"
                placeholder="123456"
                className={fieldClassName}
                required
              />
            </div>
            <button
              type="submit"
              className="mt-5 h-11 rounded-2xl bg-primary px-5 text-sm font-medium text-primary-foreground"
              disabled={confirmPending}
            >
              {confirmPending ? "Enabling..." : "Enable two-factor sign-in"}
            </button>
          </form>
        </div>
      ) : null}

      {panelRecoveryCodes?.length ? (
        <div className="mt-6 rounded-[1.35rem] border border-amber-200 bg-amber-50/80 p-5">
          <p className="text-sm font-semibold text-foreground">Recovery codes</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Save these codes in a secure offline location. Each code works once and replaces the
            authenticator code during sign-in or disable flow.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {panelRecoveryCodes.map((code) => (
              <div
                key={code}
                className="rounded-xl border border-amber-200 bg-white px-4 py-3 font-mono text-sm text-foreground"
              >
                {code}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {panelEnabled ? (
        <form action={disableAction} className="mt-6 grid gap-4 rounded-[1.35rem] border border-border/70 bg-background/90 p-5 md:grid-cols-3">
          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="disableCurrentPassword">
              Current password
            </label>
            <input
              id="disableCurrentPassword"
              name="currentPassword"
              type="password"
              className={fieldClassName}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="disableVerificationCode">
              Authenticator code
            </label>
            <input
              id="disableVerificationCode"
              name="verificationCode"
              inputMode="numeric"
              pattern="[0-9]{6}"
              placeholder="123456"
              className={fieldClassName}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="disableRecoveryCode">
              Or recovery code
            </label>
            <input
              id="disableRecoveryCode"
              name="recoveryCode"
              placeholder="ABCD-EFGH"
              className={fieldClassName}
            />
          </div>

          <div className="md:col-span-3">
            <button
              type="submit"
              className="h-11 rounded-2xl border border-border bg-background px-5 text-sm font-medium text-foreground"
              disabled={disablePending}
            >
              {disablePending ? "Disabling..." : "Disable two-factor sign-in"}
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
