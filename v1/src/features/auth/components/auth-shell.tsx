import { BrandLockup } from "@/features/marketing/components/brand-lockup";

type AuthShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <main className="dwds-shell flex min-h-dvh items-center justify-center px-6 py-16">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/65 bg-white/78 shadow-[0_32px_110px_-55px_rgba(15,35,62,0.42)] backdrop-blur lg:grid-cols-[1.08fr_0.92fr]">
        <section className="dwds-panel-dark flex flex-col justify-between rounded-none border-0 px-8 py-10 lg:px-12 lg:py-14">
          <div className="space-y-5">
            <BrandLockup inverse size="sm" />
            <div className="space-y-3">
              <div className="dwds-kicker w-fit border-white/14 bg-white/8 text-white/78">
                Protected Staff Access
              </div>
              <h1 className="max-w-md font-heading text-4xl tracking-[-0.03em] text-balance text-white sm:text-5xl">
                {title}
              </h1>
              <p className="max-w-lg text-base leading-7 text-white/76">
                {description}
              </p>
            </div>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-white/12 bg-white/8 p-5">
              <p className="text-sm font-medium text-white">Protected admin routes</p>
              <p className="mt-2 text-sm leading-6 text-white/70">
                `/dashboard` and `/admin/*` now require an authenticated internal admin session.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/12 bg-white/8 p-5">
              <p className="text-sm font-medium text-white">Admin-only access</p>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Internal admins sign in here. SUPER_ADMIN accounts can also require an authenticator
                code after optional two-factor setup inside DWDS.
              </p>
            </div>
          </div>
        </section>
        <section className="flex items-center justify-center bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(245,248,252,0.96))] px-6 py-10 lg:px-10 lg:py-14">
          {children}
        </section>
      </div>
    </main>
  );
}
