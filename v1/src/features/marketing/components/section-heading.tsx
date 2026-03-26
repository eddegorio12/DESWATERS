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
    <div className="max-w-3xl">
      <p className="dwds-kicker border-primary/10 bg-primary/6 text-primary/76">
        {eyebrow}
      </p>
      <h2 className="mt-5 font-heading text-4xl leading-tight tracking-[-0.03em] text-foreground sm:text-[2.8rem]">
        {title}
      </h2>
      <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
        {description}
      </p>
    </div>
  );
}
