import Link from "next/link";

import { UserButton } from "@clerk/nextjs";

import { buttonVariants } from "@/components/ui/button-variants";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import {
  getForbiddenModuleMessage,
  roleDisplayName,
  roleSummaries,
  type AdminModule,
  type ModuleAccessState,
} from "@/features/auth/lib/authorization";
import { cn } from "@/lib/utils";

type ModuleAccessStateProps = {
  module: AdminModule;
  access: Exclude<ModuleAccessState, { status: "authorized" }>;
};

export function ModuleAccessStateView({ module, access }: ModuleAccessStateProps) {
  const title =
    access.status === "forbidden"
      ? "This module is outside your staff role."
      : "Staff access is not ready for this module yet.";

  const description =
    access.status === "signed_out"
      ? "Sign in with Clerk to continue into the protected DWDS admin surface."
      : access.status === "missing_profile"
        ? "Your Clerk session is active, but the local DWDS staff record still needs to sync on the dashboard before role-based access can be enforced."
        : access.status === "inactive"
          ? "Your local DWDS staff profile is marked inactive. Ask an administrator to reactivate your access before opening this module."
          : getForbiddenModuleMessage(access.user.role, module);

  return (
    <AdminPageShell
      eyebrow="Access Control"
      title={title}
      description={description}
      actions={
        <>
          <Link
            href="/admin/dashboard"
            className={cn(
              buttonVariants({
                variant: "outline",
                className:
                  "h-10 rounded-full border-white/18 bg-white/8 px-5 text-white hover:bg-white/12 hover:text-white",
              })
            )}
          >
            Back to dashboard
          </Link>
          <UserButton />
        </>
      }
      stats={
        access.status === "forbidden"
          ? [
              {
                label: "Current role",
                value: roleDisplayName[access.user.role],
                detail: roleSummaries[access.user.role],
                accent: "amber" as const,
              },
            ]
          : []
      }
    >
      <section className="rounded-[1.9rem] border border-[#dbe9e5] bg-white/92 p-6 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.55)]">
        <div className="max-w-3xl space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Role Enforcement
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Server-side authorization is active for this route.
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            The page stopped before loading operational data or enabling mutations for this
            staff session.
          </p>
        </div>
      </section>
    </AdminPageShell>
  );
}
