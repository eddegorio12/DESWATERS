import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type BrandLockupProps = {
  href?: string;
  className?: string;
  inverse?: boolean;
  compact?: boolean;
  size?: "sm" | "md" | "lg";
};

export function BrandLockup({
  href = "/",
  className,
  inverse = false,
  compact = false,
  size = "md",
}: BrandLockupProps) {
  const dimensions = compact
    ? { width: 122, height: 45 }
    : size === "sm"
      ? { width: 126, height: 46 }
      : size === "lg"
        ? { width: 196, height: 72 }
        : { width: 168, height: 62 };

  return (
    <Link href={href} className={cn("inline-flex shrink-0", className)}>
      <span className="flex items-center">
        <Image
          src="/brand/dwds-logo.png"
          alt="DWDS logo"
          width={dimensions.width}
          height={dimensions.height}
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
