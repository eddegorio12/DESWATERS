import { prisma } from "@/lib/prisma";

export async function getRecoveryExportData() {
  const [backupSnapshots, recentLoginAttempts] = await Promise.all([
    prisma.backupSnapshot.findMany({
      orderBy: [{ recordedAt: "desc" }],
      take: 24,
      select: {
        id: true,
        snapshotMonth: true,
        label: true,
        provider: true,
        storageReference: true,
        status: true,
        notes: true,
        recordedAt: true,
        createdBy: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.adminLoginAttempt.findMany({
      orderBy: [{ attemptedAt: "desc" }],
      take: 12,
      select: {
        id: true,
        email: true,
        status: true,
        attemptedAt: true,
      },
    }),
  ]);

  return {
    exportedAt: new Date(),
    envReadiness: {
      databaseUrl: Boolean(process.env.DATABASE_URL),
      directUrl: Boolean(process.env.DIRECT_URL),
      authSecret: Boolean(process.env.AUTH_SECRET),
    },
    restoreChecklist: [
      "Confirm the latest managed Supabase backup and the latest logged monthly snapshot reference.",
      "Point DIRECT_URL at the restore target, then restore the SQL snapshot or provider backup into a clean Postgres database.",
      "Run npm run prisma:generate and npm run prisma:migrate:deploy against the restored database.",
      "Verify /sign-in, /admin/dashboard, /admin/billing, and /admin/payments before reopening staff access.",
      "Record the recovery result and any data-gap notes back into DWDS.",
    ],
    backupSnapshots,
    recentLoginAttempts,
  };
}

function escapeCsvCell(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll("\"", "\"\"")}"`;
  }

  return value;
}

export function createRecoveryExportCsv(data: Awaited<ReturnType<typeof getRecoveryExportData>>) {
  const header = [
    "snapshot_month",
    "label",
    "provider",
    "status",
    "storage_reference",
    "recorded_at",
    "recorded_by",
    "notes",
  ];

  const snapshotRows = data.backupSnapshots.map((snapshot) =>
    [
      snapshot.snapshotMonth,
      snapshot.label,
      snapshot.provider,
      snapshot.status,
      snapshot.storageReference,
      snapshot.recordedAt.toISOString(),
      snapshot.createdBy.name,
      snapshot.notes ?? "",
    ]
      .map((cell) => escapeCsvCell(String(cell)))
      .join(",")
  );

  const loginHeader = ["email", "status", "attempted_at"];
  const loginRows = data.recentLoginAttempts.map((attempt) =>
    [attempt.email, attempt.status, attempt.attemptedAt.toISOString()]
      .map((cell) => escapeCsvCell(String(cell)))
      .join(",")
  );

  return [
    "# DWDS recovery export",
    `# exported_at,${data.exportedAt.toISOString()}`,
    `# database_url_ready,${data.envReadiness.databaseUrl}`,
    `# direct_url_ready,${data.envReadiness.directUrl}`,
    `# auth_secret_ready,${data.envReadiness.authSecret}`,
    "",
    "[backup_snapshots]",
    header.join(","),
    ...snapshotRows,
    "",
    "[recent_login_attempts]",
    loginHeader.join(","),
    ...loginRows,
  ].join("\n");
}
