import { AdminLoginAttemptStatus, Role } from "@prisma/client";

import {
  clearAdminLockout,
  createAdminAccount,
  setAdminTemporaryPassword,
  toggleAdminActiveState,
  updateAdminRole,
} from "@/features/auth/actions/auth-actions";
import { roleDisplayName } from "@/features/auth/lib/authorization";

type AdminManagementUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  failedSignInCount: number;
  lockedUntil: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
};

type RecentLoginAttempt = {
  id: string;
  email: string;
  status: AdminLoginAttemptStatus;
  failureReason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  attemptedAt: Date;
  user: {
    name: string;
  } | null;
};

const roleOptions: Role[] = [
  Role.SUPER_ADMIN,
  Role.ADMIN,
  Role.BILLING,
  Role.CASHIER,
  Role.METER_READER,
  Role.TECHNICIAN,
  Role.VIEWER,
];

function formatDate(value: Date | null) {
  if (!value) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function formatLoginAttemptStatus(status: AdminLoginAttemptStatus) {
  switch (status) {
    case AdminLoginAttemptStatus.SUCCESS:
      return "Success";
    case AdminLoginAttemptStatus.LOCKED_OUT:
      return "Locked";
    default:
      return "Failed";
  }
}

export function StaffAccessBoard({
  admins,
  recentLoginAttempts,
}: {
  admins: AdminManagementUser[];
  recentLoginAttempts: RecentLoginAttempt[];
}) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
      <section className="rounded-[1.9rem] border border-[#dbe9e5] bg-white/92 p-6 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.55)]">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Create Admin
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Add a new internal admin account
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            This page is SUPER_ADMIN-only. Set a temporary password here, then hand it to
            the admin securely outside the app.
          </p>
        </div>

        <form action={createAdminAccount} className="mt-6 space-y-5">
          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              className="mt-2 w-full rounded-2xl border border-input bg-white px-4 py-3 text-sm text-foreground shadow-xs outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
              placeholder="Maria Santos"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="mt-2 w-full rounded-2xl border border-input bg-white px-4 py-3 text-sm text-foreground shadow-xs outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
              placeholder="admin@example.com"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="role">
              Role
            </label>
            <select
              id="role"
              name="role"
              defaultValue={Role.ADMIN}
              className="mt-2 h-12 w-full rounded-2xl border border-input bg-white px-4 text-sm text-foreground outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {roleDisplayName[role]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="password">
              Temporary password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              minLength={8}
              className="mt-2 w-full rounded-2xl border border-input bg-white px-4 py-3 text-sm text-foreground shadow-xs outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
              placeholder="At least 8 characters"
              required
            />
            <p className="mt-2 text-sm text-muted-foreground">
              Passwords are hashed with bcrypt before they are stored.
            </p>
          </div>

          <button
            type="submit"
            className="h-11 rounded-2xl bg-primary px-5 text-sm font-medium text-primary-foreground"
          >
            Create admin
          </button>
        </form>
      </section>

      <section className="rounded-[1.9rem] border border-[#dbe9e5] bg-white/92 p-6 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.55)]">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Admin Directory
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Manage existing admin accounts
          </h2>
        </div>

        <div className="mt-6 grid gap-4">
          {admins.map((admin) => (
            <article
              key={admin.id}
              className="rounded-[1.5rem] border border-border/80 bg-secondary/20 p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-foreground">{admin.name}</p>
                  <p className="text-sm text-muted-foreground">{admin.email}</p>
                  <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    <span className="rounded-full bg-[#e4f3ef] px-3 py-1 text-[#19545a]">
                      {roleDisplayName[admin.role]}
                    </span>
                    <span
                      className={
                        admin.isActive
                          ? "rounded-full bg-[#e4f3ef] px-3 py-1 text-[#19545a]"
                          : "rounded-full bg-[#fae4e2] px-3 py-1 text-[#8a2f28]"
                      }
                    >
                      {admin.isActive ? "Active" : "Inactive"}
                    </span>
                    {admin.lockedUntil && admin.lockedUntil > new Date() ? (
                      <span className="rounded-full bg-[#fae4e2] px-3 py-1 text-[#8a2f28]">
                        Locked until {formatDate(admin.lockedUntil)}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Last login: {formatDate(admin.lastLoginAt)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Failed attempts: {admin.failedSignInCount}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Created: {formatDate(admin.createdAt)}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-[minmax(0,220px)_minmax(0,220px)_minmax(0,220px)_auto]">
                  <form action={updateAdminRole} className="grid gap-2">
                    <input type="hidden" name="userId" value={admin.id} />
                    <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Change role
                    </label>
                    <select
                      name="role"
                      defaultValue={admin.role}
                      className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                    >
                      {roleOptions.map((role) => (
                        <option key={role} value={role}>
                          {roleDisplayName[role]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="h-10 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground"
                    >
                      Save role
                    </button>
                  </form>

                  <form action={setAdminTemporaryPassword} className="grid gap-2">
                    <input type="hidden" name="userId" value={admin.id} />
                    <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Set temp password
                    </label>
                    <input
                      name="password"
                      type="password"
                      minLength={8}
                      placeholder="At least 8 characters"
                      className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                      required
                    />
                    <button
                      type="submit"
                      className="h-10 rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground"
                    >
                      Save password
                    </button>
                  </form>

                  <form action={toggleAdminActiveState} className="flex items-end">
                    <input type="hidden" name="userId" value={admin.id} />
                    <button
                      type="submit"
                      className="h-10 rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground"
                    >
                      {admin.isActive ? "Deactivate" : "Reactivate"}
                    </button>
                  </form>

                  <form action={clearAdminLockout} className="flex items-end">
                    <input type="hidden" name="userId" value={admin.id} />
                    <button
                      type="submit"
                      className="h-10 rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground"
                    >
                      Clear lockout
                    </button>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
      </div>

      <section className="rounded-[1.9rem] border border-[#dbe9e5] bg-white/92 p-6 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.55)]">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Login History
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Recent sign-in activity
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Review recent successes, failures, and lockouts with the IP and device details
            captured during each sign-in attempt.
          </p>
        </div>

        <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-[#dbe9e5]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-left">
              <thead className="bg-secondary/55">
                <tr className="text-sm text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Attempt</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">IP</th>
                  <th className="px-4 py-3 font-medium">Device</th>
                  <th className="px-4 py-3 font-medium">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-background">
                {recentLoginAttempts.length ? (
                  recentLoginAttempts.map((attempt) => (
                    <tr key={attempt.id} className="align-top text-sm">
                      <td className="px-4 py-4">
                        <div className="font-medium text-foreground">
                          {attempt.user?.name ?? attempt.email}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {attempt.email}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {formatDate(attempt.attemptedAt)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={
                            attempt.status === AdminLoginAttemptStatus.SUCCESS
                              ? "rounded-full bg-[#e4f3ef] px-3 py-1 text-xs font-medium text-[#19545a]"
                              : "rounded-full bg-[#fae4e2] px-3 py-1 text-xs font-medium text-[#8a2f28]"
                          }
                        >
                          {formatLoginAttemptStatus(attempt.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {attempt.ipAddress ?? "Unavailable"}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {attempt.userAgent ?? "Unavailable"}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {attempt.failureReason ?? "Signed in successfully"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-sm text-muted-foreground"
                    >
                      Login attempts will appear here after the next sign-in activity.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
