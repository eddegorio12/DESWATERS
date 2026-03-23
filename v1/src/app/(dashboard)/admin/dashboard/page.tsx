import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

import { FirstLoginSync } from "@/features/auth/components/first-login-sync";
import { syncCurrentUser } from "@/features/auth/actions/sync-current-user";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const localUser = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  return (
    <main className="min-h-screen bg-muted/30 px-6 py-8">
      <FirstLoginSync needsSync={!localUser} syncUser={syncCurrentUser} />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-border bg-background px-6 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Protected Area
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Admin Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Step 1.3 validation target: authenticated access plus local user provisioning.
            </p>
          </div>
          <UserButton />
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-border bg-background p-5 shadow-sm">
            <p className="text-sm font-medium text-foreground">Route protection</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Visiting `/admin/dashboard` without a session should redirect to `/sign-in`.
            </p>
          </article>
          <article className="rounded-2xl border border-border bg-background p-5 shadow-sm">
            <p className="text-sm font-medium text-foreground">Clerk session</p>
            <p className="mt-2 break-all font-mono text-sm text-muted-foreground">
              {userId}
            </p>
          </article>
          <article className="rounded-2xl border border-border bg-background p-5 shadow-sm">
            <p className="text-sm font-medium text-foreground">Local database user</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {localUser
                ? `${localUser.name} (${localUser.role})`
                : "Sync in progress. Refresh once the automatic upsert completes."}
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}
