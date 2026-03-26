import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

type ProductShowcaseItem = {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  href: string;
  ctaLabel: string;
};

export function ProductShowcase({
  items,
}: {
  items: readonly ProductShowcaseItem[];
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-3">
      {items.map((item) => (
        <article
          key={item.title}
          className="dwds-panel overflow-hidden"
        >
          <div className="border-b border-border/70 bg-[linear-gradient(180deg,rgba(224,239,249,0.92),rgba(243,248,252,0.84))] p-4">
            <Image
              src={item.imageSrc}
              alt={item.imageAlt}
              width={1200}
              height={840}
              className="h-auto w-full rounded-[1.4rem] border border-border/60"
            />
          </div>
          <div className="space-y-4 p-6">
            <div>
              <h3 className="font-heading text-2xl text-foreground">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {item.description}
              </p>
            </div>
            <Link
              href={item.href}
              className={cn(
                buttonVariants({
                  variant: "outline",
                  className:
                    "h-10 rounded-full border-primary/12 bg-white/70 px-4 text-sm text-foreground hover:bg-white",
                })
              )}
            >
              {item.ctaLabel}
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
