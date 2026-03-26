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

      {state?.error ? (
        <p className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="h-11 w-full rounded-2xl" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
