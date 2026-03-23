import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

import { buttonVariants } from "@/components/ui/button-variants";
import { navigationItems } from "@/features/marketing/lib/site-content";
import { cn } from "@/lib/utils";

export async function SiteHeader() {
  const { userId } = await auth();
  const dashboardHref = userId ? "/admin/dashboard" : "/sign-in";
  const dashboardLabel = userId ? "Open dashboard" : "Staff sign in";

  return (
    <header className="mx-auto w-full max-w-7xl px-5 pb-2 pt-5 sm:px-8">
      <div className="flex flex-col gap-4 rounded-full border border-white/70 bg-white/78 px-4 py-3 shadow-[0_20px_70px_-50px_rgba(14,60,63,0.45)] backdrop-blur md:flex-row md:items-center md:justify-between md:px-5">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="font-heading text-2xl tracking-tight text-foreground">
            DWDS
          </Link>
          <div className="rounded-full border border-primary/15 bg-primary/6 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-primary/70">
            Utility OS
          </div>
        </div>

        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex gap-3">
          <Link
            href={dashboardHref}
            className={cn(
              buttonVariants({
                className: "h-10 rounded-full px-5",
              })
            )}
          >
            {dashboardLabel}
          </Link>
        </div>
      </div>
    </header>
  );
}
