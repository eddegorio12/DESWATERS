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
    <div className="space-y-5">
      {items.map((item, index) => (
        <article
          key={item.title}
          className="dwds-section overflow-hidden"
        >
          <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
            <div
              className={cn(
                "border-b border-border/70 bg-[linear-gradient(180deg,rgba(224,239,249,0.92),rgba(243,248,252,0.84))] p-4 lg:border-b-0",
                index % 2 === 1 ? "lg:order-2 lg:border-l" : "lg:border-r"
              )}
            >
              <Image
                src={item.imageSrc}
                alt={item.imageAlt}
                width={1200}
                height={840}
                className="h-auto w-full rounded-[1.4rem] border border-border/60"
              />
            </div>
            <div className="flex flex-col justify-between p-6 lg:p-8">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/72">
                  Product view {index + 1}
                </p>
                <h3 className="mt-4 font-heading text-3xl text-foreground">{item.title}</h3>
                <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
                  {item.description}
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between gap-4 border-t border-border/70 pt-4">
                <p className="text-sm text-muted-foreground">
                  Live UI evidence from the current DWDS product surface.
                </p>
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
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
