import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type BrandLockupProps = {
  href?: string;
  className?: string;
  inverse?: boolean;
  compact?: boolean;
};

export function BrandLockup({
  href = "/",
  className,
  inverse = false,
  compact = false,
}: BrandLockupProps) {
  return (
    <Link href={href} className={cn("inline-flex", className)}>
      <span className={cn("flex items-center gap-3", compact && "gap-2.5")}>
        <Image
          src="/brand/dwds-mark.svg"
          alt="DWDS mark"
          width={compact ? 38 : 44}
          height={compact ? 38 : 44}
          className="h-auto w-auto"
          priority
        />
        <span className="min-w-0">
          <span
            className={cn(
              "block font-heading text-xl leading-none tracking-tight",
              inverse ? "text-white" : "text-foreground",
              compact && "text-lg"
            )}
          >
            DWDS
          </span>
          <span
            className={cn(
              "mt-1 block text-[0.68rem] font-semibold uppercase tracking-[0.24em]",
              inverse ? "text-white/70" : "text-primary/70"
            )}
          >
            Water Utility OS
          </span>
        </span>
      </span>
    </Link>
  );
}
