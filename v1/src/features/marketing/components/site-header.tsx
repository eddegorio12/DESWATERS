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
    <header className="sticky top-0 z-40 w-full px-4 pb-2 pt-4 sm:px-6 lg:px-8">
      <div className="dwds-section px-4 py-3 sm:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <div className="flex items-center justify-between gap-3 lg:min-w-0 lg:flex-none">
            <BrandLockup compact className="min-w-0" />
            <div className="dwds-kicker border-primary/10 bg-primary/6 text-primary sm:px-3">
              DWDS
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
                      "h-10 rounded-full bg-primary px-4 text-sm text-white shadow-[0_14px_28px_-20px_rgba(20,89,129,0.38)] hover:bg-primary/92 focus-visible:bg-primary/92 sm:px-5",
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
