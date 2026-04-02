"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BanknoteArrowDown,
  BotMessageSquare,
  Bot,
  ClipboardCheck,
  FileSpreadsheet,
  Gauge,
  LayoutDashboard,
  MapPinned,
  ReceiptText,
  Server,
  ShieldAlert,
  TriangleAlert,
  UserCog,
  Users,
  WalletCards,
} from "lucide-react";

import { cn } from "@/lib/utils";

const iconMap = {
  dashboard: LayoutDashboard,
  assistant: BotMessageSquare,
  automation: Bot,
  staffAccess: UserCog,
  systemReadiness: Server,
  routeOperations: MapPinned,
  customers: Users,
  meters: Gauge,
  exceptions: TriangleAlert,
  tariffs: FileSpreadsheet,
  readings: ClipboardCheck,
  billing: ReceiptText,
  payments: WalletCards,
  collections: BanknoteArrowDown,
  followUp: ShieldAlert,
} as const;

export type DashboardNavItem = {
  href: string;
  label: string;
  description: string;
  icon: keyof typeof iconMap;
};

function SidebarNavItem({
  item,
  isActive,
}: {
  item: DashboardNavItem;
  isActive: boolean;
}) {
  const Icon = iconMap[item.icon];

  return (
    <Link
      key={item.href}
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group relative flex cursor-pointer items-start gap-3.5 px-3.5 py-3 text-left transition-colors duration-200",
        isActive
          ? "bg-primary/6 text-foreground"
          : "text-muted-foreground hover:bg-secondary/46 hover:text-foreground"
      )}
    >
      <span
        className={cn(
          "absolute bottom-2 left-0 top-2 w-px rounded-full transition-colors duration-200",
          isActive ? "bg-primary" : "bg-transparent group-hover:bg-border"
        )}
      />
      <div
        className={cn(
          "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[0.8rem] border transition-colors duration-200",
          isActive
            ? "border-primary/14 bg-primary/8 text-primary"
            : "border-border/70 bg-white/35 text-muted-foreground group-hover:border-primary/12 group-hover:bg-white/58 group-hover:text-foreground"
        )}
      >
        <Icon className="size-[1.05rem]" />
      </div>
      <div className="min-w-0">
        <p
          className={cn(
            "text-[0.93rem] font-semibold tracking-[-0.01em]",
            isActive ? "text-foreground" : "text-foreground/92"
          )}
        >
          {item.label}
        </p>
        <p
          className={cn(
            "mt-1 line-clamp-2 pr-1 text-[0.72rem] leading-5",
            isActive ? "text-muted-foreground" : "text-muted-foreground/88"
          )}
        >
          {item.description}
        </p>
      </div>
    </Link>
  );
}

export function DashboardNav({ items }: { items: readonly DashboardNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="grid gap-1">
      {items.map((item) => {
        const isActive = pathname === item.href;

        return <SidebarNavItem key={item.href} item={item} isActive={isActive} />;
      })}
    </nav>
  );
}
