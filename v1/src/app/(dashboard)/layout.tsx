import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeftRight, Menu } from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { DashboardChrome } from "@/features/admin/components/dashboard-chrome";
import { DashboardNav } from "@/features/admin/components/dashboard-nav";
import { getDashboardNavItems } from "@/features/admin/lib/dashboard-navigation";
import { AdminSessionButton } from "@/features/auth/components/admin-session-button";
import {
  getAccessibleAdminModules,
  getCurrentStaffUser,
  roleDisplayName,
} from "@/features/auth/lib/authorization";
import { BrandLockup } from "@/features/marketing/components/brand-lockup";
import { cn } from "@/lib/utils";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const current = await getCurrentStaffUser();
  const isAuthenticated = current.isAuthenticated && current.user;
  const navItems = isAuthenticated
    ? getDashboardNavItems(getAccessibleAdminModules(current.user.role))
    : [];

  return (
    <div className="dwds-shell min-h-dvh">
      <DashboardChrome
        sidebar={
          <>
            <details className="dwds-panel-dark overflow-hidden lg:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-[0.95rem] border border-white/12 bg-white/8 text-white">
                    <Menu className="size-4" />
                  </div>
                  <div>
                    <BrandLockup inverse size="sm" className="w-fit" />
                    <p className="mt-1 text-xs text-white/60">
                      {isAuthenticated
                        ? `${current.user.name} · ${roleDisplayName[current.user.role]}`
                        : "Protected navigation"}
                    </p>
                  </div>
                </div>
                <div className="dwds-kicker border-white/12 bg-white/8 text-white/78">Menu</div>
              </summary>

              <div className="space-y-4 border-t border-white/10 px-4 py-4">
                <div className="pb-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/56">
                    Workspace
                  </p>
                  <p className="mt-2 font-heading text-[1.45rem] tracking-[-0.03em] text-white">
                    DWDS operations
                  </p>
                </div>

                {navItems.length ? (
                  <div className="border-y border-white/10 py-4">
                    <DashboardNav items={navItems} />
                  </div>
                ) : null}

                <div className="space-y-3">
                  <Link
                    href="/"
                    className={cn(
                      buttonVariants({
                        variant: "outline",
                        className:
                          "h-10 w-full rounded-full border-white/14 bg-white/6 text-white hover:bg-white/10 hover:text-white",
                      })
                    )}
                  >
                    <ArrowLeftRight className="size-4" />
                    Public site
                  </Link>
                  {isAuthenticated ? <AdminSessionButton /> : null}
                </div>
              </div>
            </details>

            <aside className="dwds-panel-dark hidden flex-col gap-6 p-5 lg:sticky lg:top-4 lg:flex lg:max-h-[calc(100dvh-2rem)] lg:overflow-auto">
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <BrandLockup inverse size="sm" className="w-fit" />
                  <div className="dwds-kicker border-white/12 bg-white/8 text-white/78">
                    Internal
                  </div>
                </div>

                <div className="border-b border-white/10 pb-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/56">
                    Workspace
                  </p>
                  <h1 className="mt-3 font-heading text-[1.8rem] tracking-[-0.03em] text-white">
                    DWDS operations
                  </h1>
                  <p className="mt-3 text-sm leading-6 text-white/68">
                    Daily utility workflow, queue review, and finance control in one staff
                    console.
                  </p>
                </div>

                {isAuthenticated ? (
                  <div className="border-b border-white/10 pb-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/56">
                      Signed in
                    </p>
                    <p className="mt-3 text-lg font-semibold text-white">{current.user.name}</p>
                    <p className="mt-1 text-sm text-white/68">
                      {roleDisplayName[current.user.role]}
                    </p>
                    <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-white/50">
                      Active internal access
                    </p>
                  </div>
                ) : (
                  <div className="border-b border-white/10 pb-5 text-sm leading-6 text-white/68">
                    Sign in to open the protected DWDS modules.
                  </div>
                )}
              </div>

              {navItems.length ? (
                <div className="border-b border-white/10 pb-5">
                  <DashboardNav items={navItems} />
                </div>
              ) : null}

              <div className="mt-auto space-y-3">
                <Link
                  href="/"
                  className={cn(
                    buttonVariants({
                      variant: "outline",
                      className:
                        "h-10 w-full rounded-full border-white/14 bg-white/6 text-white hover:bg-white/10 hover:text-white",
                    })
                  )}
                >
                  <ArrowLeftRight className="size-4" />
                  Public site
                </Link>
                {isAuthenticated ? <AdminSessionButton /> : null}
              </div>
            </aside>
          </>
        }
      >
        {children}
      </DashboardChrome>
    </div>
  );
}
