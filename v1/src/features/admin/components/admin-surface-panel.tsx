import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function AdminSurfacePanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "border border-border/70 bg-white/44 p-5 backdrop-blur-sm sm:p-6",
        className
      )}
    >
      {children}
    </section>
  );
}

export function AdminSurfaceHeader({
  eyebrow,
  title,
  description,
  aside,
  className,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-border/70 pb-5 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-primary/72">
          {eyebrow}
        </p>
        <h2 className="mt-3 font-heading text-[1.45rem] leading-tight tracking-[-0.03em] text-foreground sm:text-[1.7rem]">
          {title}
        </h2>
        {description ? (
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {aside ? <div className="shrink-0 text-sm text-muted-foreground">{aside}</div> : null}
    </div>
  );
}
