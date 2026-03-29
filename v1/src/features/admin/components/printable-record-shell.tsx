import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PrintableRecordShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function PrintableRecordShell({
  eyebrow,
  title,
  description,
  actions,
  children,
}: PrintableRecordShellProps) {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eef6f4_0%,#f7faf9_35%,#ffffff_100%)] px-4 py-6 print:min-h-0 print:bg-white print:px-0 print:py-0 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 print:max-w-none print:gap-0">
        <header className="overflow-hidden rounded-[2rem] border border-[#d4e7e3] bg-[linear-gradient(135deg,#0f3f43,#1f5a60_55%,#2e7a7d)] px-6 py-6 text-white shadow-[0_32px_90px_-48px_rgba(16,63,67,0.88)] print:hidden lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">
                {eyebrow}
              </p>
              <h1 className="font-heading text-4xl tracking-tight text-white">{title}</h1>
              <p className="max-w-2xl text-sm leading-7 text-white/78">{description}</p>
            </div>

            {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
          </div>
        </header>

        {children}
      </div>
    </main>
  );
}

export function PrintableRecordPaper({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "mx-auto w-full max-w-[210mm] overflow-hidden rounded-[2rem] border border-[#d9e7e4] bg-white shadow-[0_28px_80px_-54px_rgba(15,63,67,0.5)] print:max-w-none print:rounded-none print:border-0 print:shadow-none",
        className
      )}
    >
      {children}
    </section>
  );
}
