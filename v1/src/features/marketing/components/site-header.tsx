import Link from "next/link";

import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button-variants";
import { BrandLockup } from "@/features/marketing/components/brand-lockup";
import { SiteNav } from "@/features/marketing/components/site-nav";
import { navigationItems } from "@/features/marketing/lib/site-content";
import { cn } from "@/lib/utils";

export async function SiteHeader() {
  const session = await auth();
  const dashboardHref = session?.user?.id ? "/dashboard" : "/sign-in";
  const dashboardLabel = session?.user?.id ? "Open dashboard" : "Staff sign in";

  return (
    <header className="sticky top-0 z-40 mx-auto w-full max-w-7xl px-5 pb-2 pt-4 sm:px-8">
      <div className="dwds-section px-4 py-3 sm:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <div className="flex items-center justify-between gap-3 lg:min-w-0 lg:flex-none">
            <BrandLockup compact className="min-w-0" />
            <div className="dwds-kicker border-primary/12 bg-primary/6 text-primary/76 sm:px-3">
              Utility OS
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:min-w-0 lg:flex-1 lg:flex-row lg:items-center lg:justify-end">
            <SiteNav items={navigationItems} />

            <div className="flex lg:justify-end">
              <Link
                href={dashboardHref}
                aria-label={dashboardLabel}
                className={cn(
                  buttonVariants({
                    className:
                      "h-10 rounded-full bg-[linear-gradient(135deg,#163154,#15527a_56%,#10938d)] px-4 text-sm text-white shadow-[0_18px_40px_-28px_rgba(15,35,62,0.75)] hover:brightness-105 focus-visible:brightness-105 sm:px-5",
                  })
                )}
              >
                {dashboardLabel}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
