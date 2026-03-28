"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { authenticate, type SignInFormState } from "@/features/auth/actions/auth-actions";

const fieldClassName =
  "mt-2 w-full rounded-2xl border border-input bg-white px-4 py-3 text-sm text-foreground shadow-xs outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20";

const initialState: SignInFormState = {};

export function SignInForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, formAction, pending] = useActionState(authenticate, initialState);

  return (
    <form action={formAction} className="w-full max-w-md space-y-5" noValidate>
      <input type="hidden" name="callbackUrl" value={callbackUrl ?? "/dashboard"} />
      <div>
        <label className="text-sm font-medium text-foreground" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="admin@dwds.local"
          className={fieldClassName}
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          className={fieldClassName}
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground" htmlFor="verificationCode">
          Authenticator code
        </label>
        <input
          id="verificationCode"
          name="verificationCode"
          type="text"
          inputMode="numeric"
          pattern="[0-9]{6}"
          autoComplete="one-time-code"
          placeholder="Optional unless SUPER_ADMIN 2FA is enabled"
          className={fieldClassName}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground" htmlFor="recoveryCode">
          Recovery code
        </label>
        <input
          id="recoveryCode"
          name="recoveryCode"
          type="text"
          autoComplete="off"
          placeholder="Use only if you cannot access the authenticator app"
          className={fieldClassName}
        />
      </div>

      {state?.error ? (
        <p className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <p className="text-sm leading-6 text-muted-foreground">
        Standard admins still sign in with email and password only. SUPER_ADMIN accounts use the
        extra field only after optional two-factor sign-in is enabled from the dashboard.
      </p>

      <Button type="submit" size="lg" className="h-11 w-full rounded-2xl" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
