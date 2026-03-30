import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeftRight, Menu } from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { DashboardChrome } from "@/features/admin/components/dashboard-chrome";
import { DashboardNav } from "@/features/admin/components/dashboard-nav";
import { getDashboardNavItems } from "@/features/admin/lib/dashboard-navigation";
import { AssistantPopup } from "@/features/assistant/components/assistant-popup";
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
    <div className="dwds-shell min-h-dvh bg-[linear-gradient(180deg,rgba(247,250,255,0.92),rgba(238,244,250,0.88))]">
      <DashboardChrome
        sidebar={
          <div className="contents">
            <details className="border-b border-border/70 bg-white/66 backdrop-blur lg:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-[0.8rem] border border-border/70 bg-white/70 text-foreground">
                    <Menu className="size-4" />
                  </div>
                  <div>
                    <BrandLockup size="sm" className="w-fit" />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {isAuthenticated
                        ? `${current.user.name} · ${roleDisplayName[current.user.role]}`
                        : "Protected navigation"}
                    </p>
                  </div>
                </div>
                <div className="dwds-kicker border-primary/10 bg-primary/6 text-primary/76">
                  Menu
                </div>
              </summary>

              <div className="space-y-4 border-t border-border/70 px-4 py-4">
                <div className="space-y-2 border-b border-border/70 pb-4">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-primary/72">
                    Workspace
                  </p>
                  <p className="font-heading text-[1.35rem] tracking-[-0.03em] text-foreground">
                    DWDS operations
                  </p>
                </div>

                {navItems.length ? <DashboardNav items={navItems} /> : null}

                <div className="space-y-3 border-t border-border/70 pt-4">
                  <Link
                    href="/"
                    className={cn(
                      buttonVariants({
                        variant: "outline",
                        className:
                          "h-10 w-full rounded-full border-border/80 bg-white/70 px-4 text-sm text-foreground hover:bg-white",
                      })
                    )}
                  >
                    <ArrowLeftRight className="size-4" />
                    Public site
                  </Link>
                  {isAuthenticated ? (
                    <AdminSessionButton className="w-full border-border/80 bg-white/70 text-foreground hover:bg-white hover:text-foreground" />
                  ) : null}
                </div>
              </div>
            </details>

            <aside className="hidden lg:flex lg:min-h-dvh lg:flex-col lg:border-r lg:border-border/70 lg:bg-white/52 lg:backdrop-blur">
              <div className="sticky top-0 flex h-dvh flex-col px-5 py-5">
                <div className="border-b border-border/70 pb-5">
                  <div className="flex items-start justify-between gap-3">
                    <BrandLockup size="sm" className="w-fit" />
                    <span className="dwds-kicker border-primary/10 bg-primary/6 text-primary/76">
                      Admin
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-primary/72">
                      Workspace
                    </p>
                    <p className="mt-2 font-heading text-[1.55rem] leading-tight tracking-[-0.04em] text-foreground">
                      DWDS operations
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Daily utility workflow with compact navigation and direct module access.
                    </p>
                  </div>
                </div>

                <div className="border-b border-border/70 py-5">
                  {isAuthenticated ? (
                    <>
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-primary/72">
                        Signed in
                      </p>
                      <p className="mt-2 text-sm font-semibold text-foreground">
                        {current.user.name}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {roleDisplayName[current.user.role]}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm leading-6 text-muted-foreground">
                      Sign in to open the protected DWDS modules.
                    </p>
                  )}
                </div>

                <div className="min-h-0 flex-1 overflow-auto py-5">
                  {navItems.length ? <DashboardNav items={navItems} /> : null}
                </div>

                <div className="mt-5 space-y-3 border-t border-border/70 pt-5">
                  <Link
                    href="/"
                    className={cn(
                      buttonVariants({
                        variant: "outline",
                        className:
                          "h-10 w-full rounded-full border-border/80 bg-white/70 px-4 text-sm text-foreground hover:bg-white",
                      })
                    )}
                  >
                    <ArrowLeftRight className="size-4" />
                    Public site
                  </Link>
                  {isAuthenticated ? (
                    <AdminSessionButton className="w-full border-border/80 bg-white/70 text-foreground hover:bg-white hover:text-foreground" />
                  ) : null}
                </div>
              </div>
            </aside>
          </div>
        }
        overlay={
          isAuthenticated && getAccessibleAdminModules(current.user.role).includes("assistant") ? (
            <AssistantPopup roleLabel={roleDisplayName[current.user.role]} />
          ) : null
        }
      >
        {children}
      </DashboardChrome>
    </div>
  );
}
