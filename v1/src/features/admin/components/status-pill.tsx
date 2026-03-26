import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type StatusPillTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "accent";

const toneClasses: Record<StatusPillTone, string> = {
  neutral: "bg-secondary text-secondary-foreground",
  info: "bg-[#eef3ff] text-[#294b8f]",
  success: "bg-[#dff3eb] text-[#145c3b]",
  warning: "bg-[#fbedd9] text-[#7a4f11]",
  danger: "bg-destructive/10 text-destructive",
  accent: "bg-primary/10 text-primary",
};

export function StatusPill({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: StatusPillTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-medium",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
