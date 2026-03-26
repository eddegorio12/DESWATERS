"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BanknoteArrowDown,
  ClipboardCheck,
  FileSpreadsheet,
  Gauge,
  LayoutDashboard,
  ReceiptText,
  ShieldAlert,
  UserCog,
  Users,
  WalletCards,
} from "lucide-react";

import { cn } from "@/lib/utils";

const iconMap = {
  dashboard: LayoutDashboard,
  staffAccess: UserCog,
  customers: Users,
  meters: Gauge,
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

export function DashboardNav({ items }: { items: readonly DashboardNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="grid gap-2">
      {items.map((item) => {
        const isActive = pathname === item.href;
        const Icon = iconMap[item.icon];

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex cursor-pointer items-start gap-3 rounded-[1.3rem] border px-3.5 py-3 text-left transition-colors duration-200",
              isActive
                ? "border-white/10 bg-white text-[#13253f]"
                : "border-transparent bg-transparent text-white/74 hover:border-white/10 hover:bg-white/8 hover:text-white"
            )}
          >
            <div
              className={cn(
                "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl",
                isActive ? "bg-[#d9f8f1] text-[#11645e]" : "bg-white/8 text-white/80"
              )}
            >
              <Icon className="size-[1.1rem]" />
            </div>
            <div className="min-w-0">
              <p className={cn("text-sm font-semibold", isActive ? "text-[#13253f]" : "text-white")}>
                {item.label}
              </p>
              <p
                className={cn(
                  "mt-1 text-xs leading-5",
                  isActive ? "text-[#49617d]" : "text-white/56 group-hover:text-white/72"
                )}
              >
                {item.description}
              </p>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
