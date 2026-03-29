"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BanknoteArrowDown,
  BotMessageSquare,
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
        "group flex cursor-pointer items-start gap-3 rounded-[1.15rem] border px-3.5 py-3 text-left transition-colors duration-200",
        isActive
          ? "border-white/12 bg-white text-[#13253f] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]"
          : "border-transparent bg-white/[0.03] text-white/80 hover:border-white/10 hover:bg-white/8 hover:text-white"
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-[0.95rem] border transition-colors duration-200",
          isActive
            ? "border-[#bdeee5] bg-[#dff8f1] text-[#11645e]"
            : "border-white/8 bg-white/7 text-white/82 group-hover:border-white/14 group-hover:bg-white/10"
        )}
      >
        <Icon className="size-[1.05rem]" />
      </div>
      <div className="min-w-0">
        <p
          className={cn(
            "text-[0.95rem] font-semibold tracking-[-0.01em]",
            isActive ? "text-[#13253f]" : "text-white"
          )}
        >
          {item.label}
        </p>
        <p
          className={cn(
            "mt-1 line-clamp-2 text-[0.72rem] leading-5",
            isActive ? "text-[#4a627e]" : "text-white/60 group-hover:text-white/74"
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
    <nav className="grid gap-1.5">
      {items.map((item) => {
        const isActive = pathname === item.href;

        return <SidebarNavItem key={item.href} item={item} isActive={isActive} />;
      })}
    </nav>
  );
}
