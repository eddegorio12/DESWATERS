import { BrandLockup } from "@/features/marketing/components/brand-lockup";

type AuthShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-6 py-16">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-background lg:grid-cols-[1.05fr_0.95fr]">
        <section className="flex flex-col justify-between border-b border-border bg-card px-8 py-10 lg:border-r lg:border-b-0 lg:px-12 lg:py-14">
          <div className="space-y-5">
            <BrandLockup size="sm" />
            <div className="space-y-3">
              <h1 className="max-w-md text-4xl font-semibold tracking-tight text-balance text-foreground">
                {title}
              </h1>
              <p className="max-w-lg text-base leading-7 text-muted-foreground">
                {description}
              </p>
            </div>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-background p-5">
              <p className="text-sm font-medium text-foreground">Protected admin routes</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                `/dashboard` and `/admin/*` now require an authenticated internal admin session.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-5">
              <p className="text-sm font-medium text-foreground">Admin-only access</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Email and password login only. New admins are created by a SUPER_ADMIN inside DWDS.
              </p>
            </div>
          </div>
        </section>
        <section className="flex items-center justify-center px-6 py-10 lg:px-10 lg:py-14">
          {children}
        </section>
      </div>
    </main>
  );
}
