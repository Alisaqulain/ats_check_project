import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  id?: string;
  eyebrow: string;
  title: string;
  description?: string;
  className?: string;
}

export function SectionHeading({ id, eyebrow, title, description, className }: SectionHeadingProps) {
  return (
    <div className={cn("mx-auto max-w-2xl text-center", className)}>
      <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
        <span className="bg-brand size-1.5 rounded-full" aria-hidden="true" />
        {eyebrow}
      </p>
      <h2 id={id} className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-[2.6rem] lg:leading-tight">
        {title}
      </h2>
      {description && <p className="mt-4 text-pretty text-muted-foreground">{description}</p>}
    </div>
  );
}
