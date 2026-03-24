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
    <Link href={href} className={cn("inline-flex shrink-0", className)}>
      <span className="flex items-center">
        <Image
          src="/brand/dwds-logo.png"
          alt="DWDS logo"
          width={compact ? 122 : 184}
          height={compact ? 45 : 68}
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
