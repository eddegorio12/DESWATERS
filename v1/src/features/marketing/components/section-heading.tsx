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
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/70">
        {eyebrow}
      </p>
      <h2 className="mt-4 font-heading text-4xl leading-tight text-foreground">
        {title}
      </h2>
      <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
        {description}
      </p>
    </div>
  );
}
