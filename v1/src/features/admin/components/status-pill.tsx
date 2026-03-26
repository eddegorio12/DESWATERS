import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type StatusPillTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "accent";

type StatusPillPriority =
  | "pending"
  | "overdue"
  | "readonly"
  | "ready"
  | "success"
  | "attention";

const toneClasses: Record<StatusPillTone, string> = {
  neutral: "border border-border/80 bg-secondary text-secondary-foreground",
  info: "border border-[#d8e3fb] bg-[#eef3ff] text-[#294b8f]",
  success: "border border-[#bfe4d4] bg-[#dff3eb] text-[#145c3b]",
  warning: "border border-[#f0d6ad] bg-[#fbedd9] text-[#7a4f11]",
  danger: "border border-destructive/15 bg-destructive/10 text-destructive",
  accent: "border border-primary/15 bg-primary/10 text-primary",
};

const priorityToneMap: Record<StatusPillPriority, StatusPillTone> = {
  pending: "info",
  overdue: "danger",
  readonly: "neutral",
  ready: "accent",
  success: "success",
  attention: "warning",
};

export function StatusPill({
  children,
  tone = "neutral",
  priority,
  className,
}: {
  children: ReactNode;
  tone?: StatusPillTone;
  priority?: StatusPillPriority;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium",
        toneClasses[priority ? priorityToneMap[priority] : tone],
        className
      )}
    >
      {children}
    </span>
  );
}
