import { AdminLoginAttemptStatus, AuthAdminManagementEventType, Role } from "@prisma/client";

import { StatusPill } from "@/features/admin/components/status-pill";
import {
  AdminSurfaceHeader,
  AdminSurfacePanel,
} from "@/features/admin/components/admin-surface-panel";
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
  twoFactorEnabled: boolean;
  twoFactorEnabledAt: Date | null;
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

type RecentAdminManagementEvent = {
  id: string;
  type: AuthAdminManagementEventType;
  detail: string;
  actorEmail: string;
  targetEmail: string;
  occurredAt: Date;
  actor: {
    name: string;
    role: Role;
  };
  targetUser: {
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

function getAdminStatePriority(admin: AdminManagementUser) {
  if (admin.lockedUntil && admin.lockedUntil > new Date()) {
    return "attention" as const;
  }

  if (!admin.isActive) {
    return "readonly" as const;
  }

  return "success" as const;
}

function getLoginAttemptPriority(status: AdminLoginAttemptStatus) {
  if (status === AdminLoginAttemptStatus.SUCCESS) {
    return "success" as const;
  }

  if (status === AdminLoginAttemptStatus.LOCKED_OUT) {
    return "attention" as const;
  }

  return "readonly" as const;
}

function formatAdminManagementEventType(type: AuthAdminManagementEventType) {
  switch (type) {
    case AuthAdminManagementEventType.ADMIN_CREATED:
      return "Admin created";
    case AuthAdminManagementEventType.ROLE_CHANGED:
      return "Role changed";
    case AuthAdminManagementEventType.ACCOUNT_DEACTIVATED:
      return "Account deactivated";
    case AuthAdminManagementEventType.ACCOUNT_REACTIVATED:
      return "Account reactivated";
    case AuthAdminManagementEventType.LOCKOUT_CLEARED:
      return "Lockout cleared";
    case AuthAdminManagementEventType.TEMPORARY_PASSWORD_SET:
      return "Temp password set";
    case AuthAdminManagementEventType.OWN_PASSWORD_CHANGED:
      return "Own password changed";
    case AuthAdminManagementEventType.TWO_FACTOR_ENABLED:
      return "2FA enabled";
    case AuthAdminManagementEventType.TWO_FACTOR_DISABLED:
      return "2FA disabled";
    default:
      return "Admin event";
  }
}

function getAdminManagementEventPriority(type: AuthAdminManagementEventType) {
  if (
    type === AuthAdminManagementEventType.ACCOUNT_DEACTIVATED ||
    type === AuthAdminManagementEventType.LOCKOUT_CLEARED ||
    type === AuthAdminManagementEventType.TEMPORARY_PASSWORD_SET ||
    type === AuthAdminManagementEventType.TWO_FACTOR_DISABLED
  ) {
    return "attention" as const;
  }

  if (
    type === AuthAdminManagementEventType.ADMIN_CREATED ||
    type === AuthAdminManagementEventType.ACCOUNT_REACTIVATED ||
    type === AuthAdminManagementEventType.TWO_FACTOR_ENABLED
  ) {
    return "ready" as const;
  }

  return "readonly" as const;
}

export function StaffAccessBoard({
  admins,
  recentLoginAttempts,
  recentAdminManagementEvents,
}: {
  admins: AdminManagementUser[];
  recentLoginAttempts: RecentLoginAttempt[];
  recentAdminManagementEvents: RecentAdminManagementEvent[];
}) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <AdminSurfacePanel>
          <AdminSurfaceHeader
            eyebrow="Create Admin"
            title="Add a new internal admin account"
            description="This page is SUPER_ADMIN-only. Set a temporary password here, then hand it to the admin securely outside the app."
          />

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
        </AdminSurfacePanel>

        <AdminSurfacePanel>
          <AdminSurfaceHeader
            eyebrow="Admin Directory"
            title="Manage existing admin accounts"
            aside={`${admins.length} account${admins.length === 1 ? "" : "s"}`}
          />

          <div className="mt-6 divide-y divide-border/70 overflow-hidden rounded-[1.5rem] border border-border/70 bg-white/76">
          {admins.map((admin) => (
            <article
              key={admin.id}
              className="px-5 py-5"
            >
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-lg font-semibold text-foreground">{admin.name}</p>
                      <StatusPill priority="ready" className="uppercase tracking-[0.18em]">
                        {roleDisplayName[admin.role]}
                      </StatusPill>
                      <StatusPill
                        priority={getAdminStatePriority(admin)}
                        className="uppercase tracking-[0.18em]"
                      >
                        {admin.isActive ? "Active" : "Inactive"}
                      </StatusPill>
                      {admin.lockedUntil && admin.lockedUntil > new Date() ? (
                        <StatusPill priority="attention" className="uppercase tracking-[0.18em]">
                          Locked until {formatDate(admin.lockedUntil)}
                        </StatusPill>
                      ) : null}
                      {admin.role === Role.SUPER_ADMIN ? (
                        <StatusPill
                          priority={admin.twoFactorEnabled ? "ready" : "readonly"}
                          className="uppercase tracking-[0.18em]"
                        >
                          {admin.twoFactorEnabled ? "2FA enabled" : "2FA off"}
                        </StatusPill>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground">{admin.email}</p>
                  </div>

                  <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-4">
                    <div className="rounded-[1.15rem] border border-border/65 bg-secondary/26 px-4 py-3">
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/72">
                        Last login
                      </p>
                      <p className="mt-2 text-sm text-foreground">{formatDate(admin.lastLoginAt)}</p>
                    </div>
                    <div className="rounded-[1.15rem] border border-border/65 bg-secondary/26 px-4 py-3">
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/72">
                        Failed attempts
                      </p>
                      <p className="mt-2 text-sm text-foreground">{admin.failedSignInCount}</p>
                    </div>
                    <div className="rounded-[1.15rem] border border-border/65 bg-secondary/26 px-4 py-3">
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/72">
                        Created
                      </p>
                      <p className="mt-2 text-sm text-foreground">{formatDate(admin.createdAt)}</p>
                    </div>
                    <div className="rounded-[1.15rem] border border-border/65 bg-secondary/26 px-4 py-3">
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/72">
                        2FA enabled
                      </p>
                      <p className="mt-2 text-sm text-foreground">
                        {admin.twoFactorEnabledAt ? formatDate(admin.twoFactorEnabledAt) : "Not enabled"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 xl:grid-cols-[minmax(0,240px)_minmax(0,240px)]">
                  <form
                    action={updateAdminRole}
                    className="grid gap-2 rounded-[1.2rem] border border-border/65 bg-background/85 p-4"
                  >
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

                  <form
                    action={setAdminTemporaryPassword}
                    className="grid gap-2 rounded-[1.2rem] border border-border/65 bg-background/85 p-4"
                  >
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

                </div>

                <div className="flex flex-col gap-3 border-t border-border/70 pt-3 sm:flex-row sm:flex-wrap">
                  <form action={toggleAdminActiveState}>
                    <input type="hidden" name="userId" value={admin.id} />
                    <button
                      type="submit"
                      className="h-10 rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground"
                    >
                      {admin.isActive ? "Deactivate" : "Reactivate"}
                    </button>
                  </form>

                  <form action={clearAdminLockout}>
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
        </AdminSurfacePanel>
      </div>

      <AdminSurfacePanel>
        <AdminSurfaceHeader
          eyebrow="Login History"
          title="Recent sign-in activity"
          description="Review recent successes, failures, and lockouts with the IP and device details captured during each sign-in attempt."
          aside={`${recentLoginAttempts.length} sampled attempt${recentLoginAttempts.length === 1 ? "" : "s"}`}
        />

        <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-border/70">
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
                        <StatusPill priority={getLoginAttemptPriority(attempt.status)}>
                          {formatLoginAttemptStatus(attempt.status)}
                        </StatusPill>
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
      </AdminSurfacePanel>

      <AdminSurfacePanel>
        <AdminSurfaceHeader
          eyebrow="Audit Trail"
          title="Recent admin-management changes"
          description="Every account create, role update, activation change, lockout reset, and temporary-password reset now writes to a dedicated admin-management audit log."
          aside={`${recentAdminManagementEvents.length} recorded event${recentAdminManagementEvents.length === 1 ? "" : "s"}`}
        />

        <div className="mt-6 space-y-3">
          {recentAdminManagementEvents.length ? (
            recentAdminManagementEvents.map((event) => (
              <article
                key={event.id}
                className="rounded-[1.2rem] border border-border/70 bg-white/82 px-5 py-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-sm font-semibold text-foreground">
                        {formatAdminManagementEventType(event.type)}
                      </p>
                      <StatusPill priority={getAdminManagementEventPriority(event.type)}>
                        {formatAdminManagementEventType(event.type)}
                      </StatusPill>
                    </div>
                    <p className="text-sm text-muted-foreground">{event.detail}</p>
                  </div>

                  <p className="text-xs text-muted-foreground">{formatDate(event.occurredAt)}</p>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
                  <div className="rounded-[1rem] border border-border/65 bg-secondary/22 px-4 py-3">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/72">
                      Actor
                    </p>
                    <p className="mt-2 text-sm text-foreground">{event.actor.name}</p>
                    <p className="mt-1 text-xs">
                      {roleDisplayName[event.actor.role]} • {event.actorEmail}
                    </p>
                  </div>
                  <div className="rounded-[1rem] border border-border/65 bg-secondary/22 px-4 py-3">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/72">
                      Target
                    </p>
                    <p className="mt-2 text-sm text-foreground">
                      {event.targetUser?.name ?? event.targetEmail}
                    </p>
                    <p className="mt-1 text-xs">{event.targetEmail}</p>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-[1.2rem] border border-dashed border-border/80 bg-background/70 px-5 py-8 text-sm text-muted-foreground">
              Admin-management audit events will appear here after the next account change.
            </div>
          )}
        </div>
      </AdminSurfacePanel>
    </div>
  );
}
