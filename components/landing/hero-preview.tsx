import { CircleCheck, CircleX, FileText, SquarePen, TrendingUp } from "lucide-react";
import { ScoreRing } from "./score-ring";

const METRICS = [
  { label: "Keyword match", value: 78 },
  { label: "Skills match", value: 84 },
  { label: "Experience", value: 88 },
  { label: "Formatting", value: 76 },
];

const MATCHED = ["React", "TypeScript", "Node.js", "REST APIs"];
const MISSING = ["Docker", "AWS", "Redis"];

export function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-xl" aria-label="Sample ATS analysis dashboard" role="img">
      <div
        className="bg-brand absolute -inset-6 -z-10 rounded-[2.5rem] opacity-25 blur-3xl dark:opacity-30"
        aria-hidden="true"
      />

      <div className="glass border-gradient relative overflow-hidden rounded-3xl border border-border/60 shadow-2xl shadow-primary/10">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5" aria-hidden="true">
              <span className="size-2.5 rounded-full bg-danger/70" />
              <span className="size-2.5 rounded-full bg-warning/70" />
              <span className="size-2.5 rounded-full bg-success/70" />
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <FileText className="size-4 text-muted-foreground" aria-hidden="true" />
              <span className="font-medium">jordan-lee-resume.pdf</span>
            </div>
          </div>
          <span className="rounded-full border border-border/70 bg-card px-2 py-0.5 text-[11px] text-muted-foreground">
            Sample analysis
          </span>
        </div>

        <div className="grid gap-6 p-5 sm:grid-cols-[auto_1fr] sm:p-6">
          <div className="flex flex-col items-center gap-2">
            <ScoreRing score={82} label="Estimate" gradientId="hero-score-gradient" />
            <span className="rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-medium text-success">Strong</span>
          </div>
          <div className="space-y-3.5">
            {METRICS.map((metric) => (
              <div key={metric.label}>
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="text-muted-foreground">{metric.label}</span>
                  <span className="font-medium tabular-nums">{metric.value}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="bg-brand h-full rounded-full" style={{ width: `${metric.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 border-t border-border/60 p-5 sm:grid-cols-2 sm:p-6">
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Matched keywords</p>
            <div className="flex flex-wrap gap-1.5">
              {MATCHED.map((keyword) => (
                <span key={keyword} className="inline-flex items-center gap-1 rounded-lg bg-success-soft px-2 py-1 text-xs text-success">
                  <CircleCheck className="size-3" aria-hidden="true" />
                  {keyword}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Missing keywords</p>
            <div className="flex flex-wrap gap-1.5">
              {MISSING.map((keyword) => (
                <span key={keyword} className="inline-flex items-center gap-1 rounded-lg bg-danger-soft px-2 py-1 text-xs text-danger">
                  <CircleX className="size-3" aria-hidden="true" />
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        className="glass animate-float absolute -left-4 top-24 hidden items-center gap-2.5 rounded-2xl border border-border/60 px-3 py-2.5 shadow-xl shadow-primary/10 sm:flex lg:-left-10"
        aria-hidden="true"
      >
        <span className="flex size-8 items-center justify-center rounded-xl bg-success-soft text-success">
          <TrendingUp className="size-4" />
        </span>
        <span className="text-xs">
          <span className="block font-semibold">12 of 16</span>
          <span className="text-muted-foreground">keywords matched</span>
        </span>
      </div>

      <div
        className="glass animate-float absolute -bottom-5 -right-3 hidden items-center gap-2.5 rounded-2xl border border-border/60 px-3 py-2.5 shadow-xl shadow-primary/10 [animation-delay:1.5s] sm:flex lg:-right-8"
        aria-hidden="true"
      >
        <span className="bg-brand flex size-8 items-center justify-center rounded-xl text-white">
          <SquarePen className="size-4" />
        </span>
        <span className="text-xs">
          <span className="block font-semibold">3 rewrites</span>
          <span className="text-muted-foreground">ready to copy</span>
        </span>
      </div>
    </div>
  );
}
