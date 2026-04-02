import { ScrollAnimate } from "@/features/marketing/components/scroll-animate";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <div className="max-w-4xl">
      <ScrollAnimate>
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-primary/72">
          {eyebrow}
        </p>
      </ScrollAnimate>
      <ScrollAnimate delay={80}>
        <h2 className="mt-3 font-heading text-[1.9rem] leading-tight tracking-[-0.05em] text-foreground sm:text-[2.35rem]">
          {title}
        </h2>
      </ScrollAnimate>
      <ScrollAnimate delay={140}>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
          {description}
        </p>
      </ScrollAnimate>
    </div>
  );
}
