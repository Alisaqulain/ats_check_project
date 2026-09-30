import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import type { RewriteSuggestion } from "@/types/analysis";

export function RewriteCard({ rewrite }: { rewrite: RewriteSuggestion }) {
  return (
    <article className="rounded-3xl border border-border/70 bg-card/85 shadow-soft backdrop-blur-sm transition-colors hover:border-primary/25 p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Badge variant="secondary">{rewrite.section}</Badge>
        <CopyButton text={rewrite.improved} label="Copy improved" />
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
        <div className="rounded-xl bg-muted/60 p-3">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Original</p>
          <p className="whitespace-pre-line break-words text-sm text-muted-foreground">{rewrite.original}</p>
        </div>
        <ArrowRight className="mx-auto size-4 rotate-90 self-center text-muted-foreground md:rotate-0" aria-hidden="true" />
        <div className="rounded-xl border border-success/30 bg-success-soft/50 p-3">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-success">Suggested</p>
          <p className="whitespace-pre-line break-words text-sm">{rewrite.improved}</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{rewrite.explanation}</p>
    </article>
  );
}
