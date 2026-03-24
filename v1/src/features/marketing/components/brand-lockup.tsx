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
          src="/brand/dwds-logo.png"
          alt="DWDS logo"
          width={compact ? 168 : 220}
          height={compact ? 62 : 82}
          className={cn(
            "h-auto w-auto object-contain",
            inverse && "brightness-0 invert"
          )}
          priority
        />
      </span>
    </Link>
  );
}
