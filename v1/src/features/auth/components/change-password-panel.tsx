import {
  AdminSurfaceHeader,
  AdminSurfacePanel,
} from "@/features/admin/components/admin-surface-panel";
import { changeOwnPassword } from "@/features/auth/actions/auth-actions";

const fieldClassName =
  "mt-2 h-11 w-full rounded-2xl border border-input bg-white px-4 text-sm text-foreground shadow-xs outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20";

export function ChangePasswordPanel() {
  return (
    <AdminSurfacePanel>
      <AdminSurfaceHeader
        eyebrow="Password"
        title="Change your sign-in password"
        description="Update your own password here. Use a new password and keep it separate from the temporary one a SUPER_ADMIN may have assigned."
      />

      <form action={changeOwnPassword} className="mt-6 grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="currentPassword">
            Current password
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            className={fieldClassName}
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
            className={fieldClassName}
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
            className={fieldClassName}
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
    </AdminSurfacePanel>
  );
}
