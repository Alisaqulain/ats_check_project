import type { LucideIcon } from "lucide-react";

interface SectionTitleProps {
  id: string;
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function SectionTitle({ id, icon: Icon, title, description, action }: SectionTitleProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="bg-brand mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl text-white shadow-glow">
          <Icon className="size-4.5" aria-hidden="true" />
        </span>
        <div>
          <h2 id={id} className="text-xl font-semibold tracking-tight">
            {title}
          </h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
