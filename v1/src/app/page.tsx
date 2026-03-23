import Link from "next/link";

import { auth } from "@clerk/nextjs/server";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function Home() {
  const { userId } = await auth();

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-6 py-16">
      <section className="grid w-full max-w-5xl gap-10 rounded-3xl border border-border bg-background p-8 shadow-sm lg:grid-cols-[1.1fr_0.9fr] lg:p-12">
        <div className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            DESWATERS
          </p>
          <div className="space-y-4">
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance text-foreground lg:text-5xl">
              Water utility operations, starting with a protected admin surface.
            </h1>
            <p className="max-w-xl text-base leading-7 text-muted-foreground">
              Clerk authentication is now wired into the app shell. Use the admin route
              to validate redirects, sign-in, and first-login user provisioning.
            </p>
          </div>
        </div>
        <div className="flex flex-col justify-between rounded-3xl border border-border bg-card p-6">
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Validation path</p>
            <p className="text-sm leading-6 text-muted-foreground">
              Open `/admin/dashboard` while signed out, then sign in and confirm the
              dashboard loads.
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-3">
            <Link
              href={userId ? "/admin/dashboard" : "/sign-in"}
              className={cn(buttonVariants({ className: "h-11 rounded-xl" }))}
            >
              {userId ? "Open admin dashboard" : "Go to sign in"}
            </Link>
            <Link
              href="/admin/dashboard"
              prefetch={false}
              className={cn(
                buttonVariants({ variant: "outline", className: "h-11 rounded-xl" })
              )}
            >
              Test protected route
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
