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
              "rounded-full border border-transparent px-3 py-2 leading-none transition-colors duration-200 hover:border-[rgba(177,135,64,0.22)] hover:bg-[rgba(255,255,255,0.34)] hover:text-foreground focus-visible:border-[rgba(177,135,64,0.22)] focus-visible:bg-[rgba(255,255,255,0.34)] focus-visible:text-foreground",
              isActive &&
                "border-[rgba(177,135,64,0.28)] bg-[rgba(177,135,64,0.12)] text-foreground hover:bg-[rgba(177,135,64,0.16)]"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
