import { Role, StaffApprovalStatus } from "@prisma/client";

import {
  approveStaffAccess,
  deactivateStaffAccess,
  reactivateStaffAccess,
  rejectStaffAccess,
} from "@/features/auth/actions/review-staff-access";
import { roleDisplayName } from "@/features/auth/lib/authorization";

type StaffAccessUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  approvalStatus: StaffApprovalStatus;
  approvalNote: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const roleOptions: Role[] = [
  Role.CUSTOMER_SERVICE,
  Role.METER_READER,
  Role.BILLING_STAFF,
  Role.CASHIER,
  Role.MANAGER,
  Role.ADMIN,
];

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function StaffAccessBoard({
  pendingUsers,
  approvedUsers,
  rejectedUsers,
}: {
  pendingUsers: StaffAccessUser[];
  approvedUsers: StaffAccessUser[];
  rejectedUsers: StaffAccessUser[];
}) {
  return (
    <div className="grid gap-6">
      <section className="rounded-[1.9rem] border border-[#dbe9e5] bg-white/92 p-6 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.55)]">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Pending Requests
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Review new Clerk-linked staff sign-ins before dashboard access is granted.
          </h2>
        </div>

        <div className="mt-6 grid gap-4">
          {pendingUsers.length ? (
            pendingUsers.map((user) => (
              <article
                key={user.id}
                className="rounded-[1.5rem] border border-border/80 bg-secondary/20 p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-foreground">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      <span className="rounded-full bg-[#fbedd9] px-3 py-1 text-[#7a4f11]">
                        Pending
                      </span>
                      <span className="rounded-full bg-[#e5f1fb] px-3 py-1 text-[#1d4f84]">
                        Requested {formatDate(user.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {user.approvalNote ?? "No approval note recorded yet."}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[minmax(0,220px)_auto_auto]">
                    <form action={approveStaffAccess} className="grid gap-2">
                      <input type="hidden" name="userId" value={user.id} />
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Approve as
                      </label>
                      <select
                        name="role"
                        defaultValue={user.role}
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
                        Approve access
                      </button>
                    </form>

                    <form action={rejectStaffAccess} className="flex items-end">
                      <input type="hidden" name="userId" value={user.id} />
                      <button
                        type="submit"
                        className="h-10 rounded-full border border-rose-200 bg-rose-50 px-4 text-sm font-medium text-rose-700"
                      >
                        Reject
                      </button>
                    </form>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-[1.5rem] border border-border/80 bg-secondary/20 px-5 py-5 text-sm leading-6 text-muted-foreground">
              No pending staff requests are waiting for approval.
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-[1.9rem] border border-[#dbe9e5] bg-white/92 p-6 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.55)]">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Approved Staff
          </p>
          <div className="mt-6 grid gap-4">
            {approvedUsers.length ? (
              approvedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col gap-4 rounded-[1.5rem] border border-border/80 bg-secondary/20 p-5 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-base font-semibold text-foreground">{user.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {roleDisplayName[user.role]} ·{" "}
                      {user.active ? "Active dashboard access" : "Access deactivated"}
                    </p>
                  </div>

                  <form action={user.active ? deactivateStaffAccess : reactivateStaffAccess}>
                    <input type="hidden" name="userId" value={user.id} />
                    <button
                      type="submit"
                      className="h-10 rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground"
                    >
                      {user.active ? "Deactivate" : "Reactivate"}
                    </button>
                  </form>
                </div>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-border/80 bg-secondary/20 px-5 py-5 text-sm leading-6 text-muted-foreground">
                No approved staff accounts are available yet.
              </div>
            )}
          </div>
        </article>

        <article className="rounded-[1.9rem] border border-[#dbe9e5] bg-white/92 p-6 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.55)]">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Rejected Requests
          </p>
          <div className="mt-6 grid gap-4">
            {rejectedUsers.length ? (
              rejectedUsers.map((user) => (
                <div
                  key={user.id}
                  className="rounded-[1.5rem] border border-border/80 bg-secondary/20 p-5"
                >
                  <p className="text-base font-semibold text-foreground">{user.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Last reviewed {formatDate(user.updatedAt)}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {user.approvalNote ?? "Rejected for DWDS staff access."}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-border/80 bg-secondary/20 px-5 py-5 text-sm leading-6 text-muted-foreground">
                No rejected staff requests are recorded.
              </div>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
