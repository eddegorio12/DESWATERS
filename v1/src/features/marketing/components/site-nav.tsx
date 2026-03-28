"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type SiteNavItem = {
  href: string;
  label: string;
};

export function SiteNav({ items }: { items: readonly SiteNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm text-muted-foreground lg:justify-center"
    >
      {items.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "rounded-full px-3 py-2 leading-none transition-colors duration-200 hover:bg-primary/7 hover:text-foreground focus-visible:bg-primary/7 focus-visible:text-foreground",
              isActive && "bg-primary text-primary-foreground hover:bg-primary"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
