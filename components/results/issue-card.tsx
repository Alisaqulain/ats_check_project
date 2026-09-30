import { CircleAlert, Info, Lightbulb, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ResumeIssue } from "@/types/analysis";
import { LEVEL_LABEL, SEVERITY_VARIANT } from "./score-utils";

const ICONS = { high: CircleAlert, medium: TriangleAlert, low: Info } as const;
const ICON_STYLE = {
  high: "bg-danger-soft text-danger",
  medium: "bg-warning-soft text-warning",
  low: "bg-muted text-muted-foreground",
} as const;

export function IssueCard({ issue }: { issue: ResumeIssue }) {
  const Icon = ICONS[issue.severity];
  return (
    <article className="flex gap-3 rounded-3xl border border-border/70 bg-card/85 shadow-soft backdrop-blur-sm transition-colors hover:border-primary/25 p-4 sm:p-5">
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", ICON_STYLE[issue.severity])}>
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold">{issue.title}</h3>
          <Badge variant={SEVERITY_VARIANT[issue.severity]}>{LEVEL_LABEL[issue.severity]}</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{issue.description}</p>
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
          <span>{issue.suggestion}</span>
        </p>
      </div>
    </article>
  );
}
