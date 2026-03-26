import { changeOwnPassword } from "@/features/auth/actions/auth-actions";

export function ChangePasswordPanel() {
  return (
    <section className="rounded-[1.9rem] border border-[#dbe9e5] bg-white/92 p-6 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.55)]">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Password
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Change your sign-in password
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Update your own password here. Use a new password and keep it separate from the
          temporary one a SUPER_ADMIN may have assigned.
        </p>
      </div>

      <form action={changeOwnPassword} className="mt-6 grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="currentPassword">
            Current password
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            className="mt-2 h-11 w-full rounded-2xl border border-input bg-white px-4 text-sm text-foreground shadow-xs outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="newPassword">
            New password
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            minLength={8}
            className="mt-2 h-11 w-full rounded-2xl border border-input bg-white px-4 text-sm text-foreground shadow-xs outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="confirmPassword">
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            minLength={8}
            className="mt-2 h-11 w-full rounded-2xl border border-input bg-white px-4 text-sm text-foreground shadow-xs outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
            required
          />
        </div>

        <div className="md:col-span-3">
          <button
            type="submit"
            className="h-11 rounded-2xl bg-primary px-5 text-sm font-medium text-primary-foreground"
          >
            Update password
          </button>
        </div>
      </form>
    </section>
  );
}
