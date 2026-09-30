import type { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-3xl border border-border/70 bg-card/80 p-6 shadow-soft backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10">
      <div
        className="bg-brand absolute -right-16 -top-16 size-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-20"
        aria-hidden="true"
      />
      <div className="relative mb-5 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15 transition-all duration-300 group-hover:bg-transparent group-hover:text-white group-hover:ring-0">
        <span className="bg-brand absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden="true" />
        <Icon className="relative size-5" aria-hidden="true" />
      </div>
      <h3 className="relative font-semibold">{title}</h3>
      <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </article>
  );
}
