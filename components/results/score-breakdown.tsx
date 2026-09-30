import { Briefcase, FileCheck2, Gauge, GraduationCap, Puzzle, Tags, type LucideIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { AnalysisResult } from "@/types/analysis";
import { TONE_BG, TONE_TEXT, scoreTone } from "./score-utils";

type MetricKey = keyof AnalysisResult["scoreExplanations"];

const METRICS: { key: MetricKey; label: string; icon: LucideIcon }[] = [
  { key: "atsCompatibility", label: "ATS Compatibility", icon: Gauge },
  { key: "keywordMatch", label: "Keyword Match", icon: Tags },
  { key: "skillsMatch", label: "Skills Match", icon: Puzzle },
  { key: "experienceMatch", label: "Experience Match", icon: Briefcase },
  { key: "educationMatch", label: "Education Match", icon: GraduationCap },
  { key: "formattingScore", label: "Formatting", icon: FileCheck2 },
];

export function ScoreBreakdown({ result }: { result: AnalysisResult }) {
  return (
    <section aria-labelledby="breakdown-title">
      <h2 id="breakdown-title" className="sr-only">
        Score breakdown
      </h2>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {METRICS.map(({ key, label, icon: Icon }) => {
          const score = result[key];
          const tone = scoreTone(score);
          return (
            <li key={key} className="flex flex-col rounded-3xl border border-border/70 bg-card/85 p-5 shadow-soft backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                  {label}
                </div>
                <span className={cn("text-2xl font-semibold tabular-nums", TONE_TEXT[tone])}>
                  {score}
                  <span className="text-sm font-normal text-muted-foreground">/100</span>
                </span>
              </div>
              <Progress value={score} label={`${label} score`} className="mt-3" indicatorClassName={TONE_BG[tone]} />
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{result.scoreExplanations[key]}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
