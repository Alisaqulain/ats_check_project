import { CircleCheck, LoaderCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { AnalysisStage } from "@/types/analysis";

export const STAGES: { key: AnalysisStage; label: string }[] = [
  { key: "reading", label: "Reading resume..." },
  { key: "extracting", label: "Extracting content..." },
  { key: "comparing", label: "Comparing with job description..." },
  { key: "keywords", label: "Analyzing keywords..." },
  { key: "recommendations", label: "Generating recommendations..." },
  { key: "preparing", label: "Preparing results..." },
];

interface LoadingAnalysisProps {
  /** Index of the stage currently shown as in progress; -1 while the file is uploading. */
  activeIndex: number;
  uploadProgress: number | null;
}

export function LoadingAnalysis({ activeIndex, uploadProgress }: LoadingAnalysisProps) {
  const current = activeIndex < 0 ? "Uploading resume..." : STAGES[activeIndex]?.label;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="border-gradient relative overflow-hidden rounded-3xl border border-border/70 bg-card/85 p-5 shadow-soft backdrop-blur-sm sm:p-6">
        <div className="bg-brand absolute -right-20 -top-20 size-56 rounded-full opacity-15 blur-3xl" aria-hidden="true" />
        <div className="relative mb-5 flex items-center gap-3">
          <span className="bg-brand flex size-10 items-center justify-center rounded-xl text-white shadow-glow">
            <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-semibold">Analyzing your resume</h2>
            <p className="text-sm text-muted-foreground" aria-hidden="true">
              {current}
            </p>
          </div>
        </div>
        <p className="sr-only" role="status" aria-live="polite">
          {current}
        </p>

        {activeIndex < 0 && uploadProgress !== null && (
          <div className="mb-5">
            <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
              <span>Uploading resume...</span>
              <span className="tabular-nums">{uploadProgress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="bg-brand h-full rounded-full transition-[width]" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        )}

        <ol className="relative grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {STAGES.map((stage, index) => {
            const done = index < activeIndex;
            const active = index === activeIndex;
            return (
              <li
                key={stage.key}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition-all duration-300",
                  done && "border-success/30 bg-success-soft/50",
                  active && "border-primary/40 bg-primary/5",
                  !done && !active && "text-muted-foreground",
                )}
              >
                {done ? (
                  <CircleCheck className="size-4 shrink-0 text-success" aria-hidden="true" />
                ) : active ? (
                  <LoaderCircle className="size-4 shrink-0 animate-spin text-primary" aria-hidden="true" />
                ) : (
                  <span className="size-4 shrink-0 rounded-full border-2" aria-hidden="true" />
                )}
                <span className={cn(active && "font-medium")}>{stage.label}</span>
                <span className="sr-only">{done ? "(done)" : active ? "(in progress)" : "(pending)"}</span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="grid gap-4 md:grid-cols-[280px_1fr]" aria-hidden="true">
        <Skeleton className="h-64 rounded-2xl" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-2xl" />
          ))}
        </div>
      </div>
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  );
}
