import Link from "next/link";

import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button-variants";
import { BrandLockup } from "@/features/marketing/components/brand-lockup";
import { navigationItems } from "@/features/marketing/lib/site-content";
import { cn } from "@/lib/utils";

export async function SiteHeader() {
  const session = await auth();
  const dashboardHref = session?.user?.id ? "/dashboard" : "/sign-in";
  const dashboardLabel = session?.user?.id ? "Open dashboard" : "Staff sign in";

  return (
    <header className="mx-auto w-full max-w-7xl px-5 pb-2 pt-5 sm:px-8">
      <div className="rounded-[2rem] border border-white/70 bg-white/78 px-4 py-3 shadow-[0_20px_70px_-50px_rgba(14,60,63,0.45)] backdrop-blur sm:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <div className="flex items-center justify-between gap-3 lg:min-w-0 lg:flex-none">
            <BrandLockup compact className="min-w-0" />
            <div className="rounded-full border border-primary/15 bg-primary/6 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-primary/70 sm:px-3">
            Utility OS
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:min-w-0 lg:flex-1 lg:flex-row lg:items-center lg:justify-end">
            <nav className="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm text-muted-foreground lg:justify-center">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full px-3 py-2 leading-none transition-colors duration-200 hover:bg-primary/6 hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex lg:justify-end">
              <Link
                href={dashboardHref}
                className={cn(
                  buttonVariants({
                    className: "h-10 rounded-full px-4 text-sm sm:px-5",
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
