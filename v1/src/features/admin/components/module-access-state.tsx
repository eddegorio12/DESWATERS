import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { AdminSessionButton } from "@/features/auth/components/admin-session-button";
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
      : access.status === "password_change_required"
        ? "Change your temporary password before opening DWDS modules."
      : "Admin access is not ready for this module.";

  const description =
    access.status === "signed_out"
      ? "Sign in with your DWDS admin email and password to continue into the protected admin surface."
      : access.status === "password_change_required"
        ? "Your account still uses a temporary password. Update it first, then return to the protected admin workspace."
      : access.status === "inactive"
        ? "Your DWDS admin account is inactive. Ask a SUPER_ADMIN to reactivate it before opening this module."
        : getForbiddenModuleMessage(access.user.role, module);

  return (
    <AdminPageShell
      eyebrow="Access Control"
      title={title}
      description={description}
      actions={
        <>
          <Link
            href={access.status === "password_change_required" ? "/change-password" : "/admin/dashboard"}
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
          {access.status === "signed_out" ? null : <AdminSessionButton />}
        </>
      }
      stats={
        access.status === "forbidden" || access.status === "password_change_required"
          ? [
              {
                label: access.status === "password_change_required" ? "Access state" : "Current role",
                value:
                  access.status === "password_change_required"
                    ? "Password change required"
                    : roleDisplayName[access.user.role],
                detail:
                  access.status === "password_change_required"
                    ? "Protected routes stay blocked until the temporary password is replaced."
                    : roleSummaries[access.user.role],
                accent: access.status === "password_change_required" ? "rose" : "amber",
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
