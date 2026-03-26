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
    ? { width: 146, height: 40 }
    : size === "sm"
      ? { width: 168, height: 46 }
      : size === "lg"
        ? { width: 264, height: 72 }
        : { width: 212, height: 58 };

  return (
    <Link href={href} className={cn("inline-flex shrink-0", className)}>
      <span
        className="relative block shrink-0"
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        <Image
          src={inverse ? "/brand/transparent.png" : "/brand/Official%20Logo.png"}
          alt="DEGORIO WATER DISTRIBUTION SERVICES logo"
          fill
          sizes={`${dimensions.width}px`}
          className="object-cover object-center"
          priority
        />
      </span>
    </Link>
  );
}
