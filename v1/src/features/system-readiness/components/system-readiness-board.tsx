import { BackupSnapshotStatus } from "@prisma/client";

import { StatusPill } from "@/features/admin/components/status-pill";
import { logBackupSnapshot } from "@/features/system-readiness/actions";

type BackupSnapshotRow = {
  id: string;
  snapshotMonth: string;
  label: string;
  provider: string;
  storageReference: string;
  status: BackupSnapshotStatus;
  notes: string | null;
  recordedAt: Date;
  createdBy: {
    name: string;
  };
};

type LoginAttemptRow = {
  id: string;
  email: string;
  status: "SUCCESS" | "FAILED" | "LOCKED_OUT";
  attemptedAt: Date;
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

const statusOptions = [
  BackupSnapshotStatus.RECORDED,
  BackupSnapshotStatus.VERIFIED,
  BackupSnapshotStatus.RESTORE_TESTED,
  BackupSnapshotStatus.FAILED,
] as const;

function getBackupStatusPriority(status: BackupSnapshotStatus) {
  if (status === BackupSnapshotStatus.FAILED) {
    return "attention" as const;
  }

  if (status === BackupSnapshotStatus.RESTORE_TESTED) {
    return "success" as const;
  }

  if (status === BackupSnapshotStatus.VERIFIED) {
    return "ready" as const;
  }

  return "pending" as const;
}

function getLoginAttemptPriority(status: LoginAttemptRow["status"]) {
  if (status === "SUCCESS") {
    return "success" as const;
  }

  if (status === "LOCKED_OUT") {
    return "attention" as const;
  }

  return "readonly" as const;
}

export function SystemReadinessBoard({
  backupSnapshots,
  recentLoginAttempts,
  envReadiness,
}: {
  backupSnapshots: BackupSnapshotRow[];
  recentLoginAttempts: LoginAttemptRow[];
  envReadiness: {
    databaseUrl: boolean;
    directUrl: boolean;
    authSecret: boolean;
  };
}) {
  return (
    <div className="grid gap-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <section className="rounded-[1.9rem] border border-[#dbe9e5] bg-white/92 p-6 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.55)]">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Snapshot Log
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Record monthly backup exports
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Managed PostgreSQL backups remain the primary recovery layer. Use this log to
              record monthly exports and restore-test checkpoints inside DWDS.
            </p>
          </div>

          <form action={logBackupSnapshot} className="mt-6 space-y-5">
            <div>
              <label className="text-sm font-medium text-foreground" htmlFor="snapshotMonth">
                Snapshot month
              </label>
              <input
                id="snapshotMonth"
                name="snapshotMonth"
                type="month"
                className="mt-2 h-12 w-full rounded-2xl border border-input bg-white px-4 text-sm text-foreground outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground" htmlFor="label">
                Label
              </label>
              <input
                id="label"
                name="label"
                type="text"
                className="mt-2 w-full rounded-2xl border border-input bg-white px-4 py-3 text-sm text-foreground shadow-xs outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
                placeholder="March 2026 monthly snapshot"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground" htmlFor="provider">
                Provider
              </label>
              <input
                id="provider"
                name="provider"
                type="text"
                defaultValue="Supabase"
                className="mt-2 w-full rounded-2xl border border-input bg-white px-4 py-3 text-sm text-foreground shadow-xs outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
                required
              />
            </div>

            <div>
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="storageReference"
              >
                Storage reference
              </label>
              <input
                id="storageReference"
                name="storageReference"
                type="text"
                className="mt-2 w-full rounded-2xl border border-input bg-white px-4 py-3 text-sm text-foreground shadow-xs outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
                placeholder="supabase://project/backups/2026-03.sql.gz"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground" htmlFor="status">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={BackupSnapshotStatus.RECORDED}
                className="mt-2 h-12 w-full rounded-2xl border border-input bg-white px-4 text-sm text-foreground outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground" htmlFor="notes">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                className="mt-2 w-full rounded-2xl border border-input bg-white px-4 py-3 text-sm text-foreground shadow-xs outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
                placeholder="Restore drill result, checksum reference, or storage note."
              />
            </div>

            <button
              type="submit"
              className="h-11 rounded-2xl bg-primary px-5 text-sm font-medium text-primary-foreground"
            >
              Save snapshot log
            </button>
          </form>
        </section>

        <section className="grid gap-6">
          <section className="rounded-[1.9rem] border border-[#dbe9e5] bg-white/92 p-6 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.55)]">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Environment Readiness
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Production recovery prerequisites
              </h2>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                { label: "DATABASE_URL", ready: envReadiness.databaseUrl },
                { label: "DIRECT_URL", ready: envReadiness.directUrl },
                { label: "AUTH_SECRET", ready: envReadiness.authSecret },
              ].map((item) => (
                <article
                  key={item.label}
                  className="rounded-[1.4rem] border border-[#dbe9e5] bg-[linear-gradient(180deg,#fbfdfc,#f4f8f7)] p-4"
                >
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.ready ? "Configured in the current environment." : "Missing in the current environment."}
                  </p>
                  <div className="mt-3">
                    <StatusPill priority={item.ready ? "ready" : "attention"}>
                      {item.ready ? "Ready" : "Needs setup"}
                    </StatusPill>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[1.9rem] border border-[#dbe9e5] bg-white/92 p-6 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.55)]">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Restore Procedure
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Minimum recovery checklist
              </h2>
            </div>

            <ol className="mt-6 space-y-3 text-sm leading-6 text-muted-foreground">
              <li>1. Confirm the latest managed Supabase backup and the latest logged monthly snapshot reference.</li>
              <li>2. Point `DIRECT_URL` at the restore target, then restore the SQL snapshot or provider backup into a clean Postgres database.</li>
              <li>3. Run `npm run prisma:generate` and `npm run prisma:migrate:deploy` against the restored database.</li>
              <li>4. Verify `/sign-in`, `/admin/dashboard`, `/admin/billing`, and `/admin/payments` before reopening staff access.</li>
              <li>5. Record the recovery result and any data-gap notes back into this workspace.</li>
            </ol>
          </section>
        </section>
      </section>

      <section className="rounded-[1.9rem] border border-[#dbe9e5] bg-white/92 p-6 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.55)]">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Snapshot History
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Logged backup exports
          </h2>
        </div>

        <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-[#dbe9e5]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-left">
              <thead className="bg-secondary/55">
                <tr className="text-sm text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Snapshot</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Reference</th>
                  <th className="px-4 py-3 font-medium">Recorded by</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-background">
                {backupSnapshots.length ? (
                  backupSnapshots.map((snapshot) => (
                    <tr key={snapshot.id} className="align-top text-sm">
                      <td className="px-4 py-4">
                        <div className="font-medium text-foreground">{snapshot.label}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {snapshot.snapshotMonth} via {snapshot.provider}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {formatDate(snapshot.recordedAt)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <StatusPill priority={getBackupStatusPriority(snapshot.status)}>
                          {snapshot.status}
                        </StatusPill>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        <div>{snapshot.storageReference}</div>
                        {snapshot.notes ? (
                          <div className="mt-1 text-xs">{snapshot.notes}</div>
                        ) : null}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {snapshot.createdBy.name}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-10 text-center text-sm text-muted-foreground"
                    >
                      No backup snapshots are logged yet. Record the current monthly export to start the recovery trail.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="rounded-[1.9rem] border border-[#dbe9e5] bg-white/92 p-6 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.55)]">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Security Signal
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Latest sign-in outcomes
          </h2>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {recentLoginAttempts.map((attempt) => (
            <article
              key={attempt.id}
              className="rounded-[1.4rem] border border-[#dbe9e5] bg-[linear-gradient(180deg,#fbfdfc,#f4f8f7)] p-4"
            >
              <p className="text-sm font-semibold text-foreground">{attempt.email}</p>
              <div className="mt-2">
                <StatusPill priority={getLoginAttemptPriority(attempt.status)}>
                  {attempt.status}
                </StatusPill>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{formatDate(attempt.attemptedAt)}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
