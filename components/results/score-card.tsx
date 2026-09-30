"use client";

import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";
import { Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SCORE_BAND_LABEL } from "@/lib/scoring/weights";
import type { AnalysisResult } from "@/types/analysis";
import { BAND_VARIANT, TONE_VAR, scoreTone } from "./score-utils";

export function ScoreCard({ result }: { result: AnalysisResult }) {
  const tone = scoreTone(result.overallScore);
  const data = [{ name: "score", value: result.overallScore }];

  return (
    <section
      aria-labelledby="overall-score"
      className="border-gradient relative overflow-hidden rounded-3xl border border-border/70 bg-card/85 p-5 shadow-soft backdrop-blur-sm sm:p-8"
    >
      <div className="bg-brand absolute -left-24 -top-24 size-72 rounded-full opacity-15 blur-3xl" aria-hidden="true" />
      <div className="relative flex flex-col items-center gap-6 md:flex-row md:items-center md:gap-10">
        <div className="relative size-48 shrink-0 sm:size-52">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart data={data} innerRadius="78%" outerRadius="100%" startAngle={90} endAngle={-270} barSize={14}>
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
              <RadialBar
                dataKey="value"
                cornerRadius={10}
                background={{ fill: "var(--muted)" }}
                fill={TONE_VAR[tone]}
                isAnimationActive
                animationDuration={900}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
            <span className="text-5xl font-semibold tracking-tight tabular-nums">{result.overallScore}</span>
            <span className="text-sm text-muted-foreground">/ 100</span>
          </div>
        </div>

        <div className="min-w-0 flex-1 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
            <h2 id="overall-score" className="text-lg font-semibold tracking-tight">
              ATS Compatibility Estimate
            </h2>
            <Badge variant={BAND_VARIANT[result.scoreBand]}>{SCORE_BAND_LABEL[result.scoreBand]}</Badge>
          </div>
          <p className="sr-only">
            Overall score {result.overallScore} out of 100, rated {SCORE_BAND_LABEL[result.scoreBand]}.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{result.summary}</p>
          <p className="mt-4 flex items-start justify-center gap-2 text-xs text-muted-foreground md:justify-start">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            An estimate from comparing your resume&apos;s text with this job description. It does not guarantee how any
            specific ATS or recruiter will rank your application.
          </p>
        </div>
      </div>
    </section>
  );
}
