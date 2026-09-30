"use client";

import { useState } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Calculator, ChevronDown } from "lucide-react";
import { SCORE_WEIGHTS } from "@/lib/scoring/weights";
import { cn } from "@/lib/utils";
import type { AnalysisResult } from "@/types/analysis";
import { TONE_VAR, scoreTone } from "./score-utils";

export function Methodology({ result }: { result: AnalysisResult }) {
  const [open, setOpen] = useState(false);
  const data = result.scoreBreakdown.map((item) => ({ ...item, name: item.label }));

  return (
    <section aria-labelledby="methodology-title" className="rounded-3xl border border-border/70 bg-card/85 shadow-soft backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="methodology-panel"
        className="flex w-full items-center justify-between gap-4 rounded-2xl p-5 text-left hover:bg-muted/40 sm:p-6"
      >
        <span className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Calculator className="size-4" aria-hidden="true" />
          </span>
          <span>
            <span id="methodology-title" className="block font-semibold">
              How this score is calculated
            </span>
            <span className="block text-sm text-muted-foreground">
              A transparent weighted average of six components. No black-box scoring.
            </span>
          </span>
        </span>
        <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>

      {open && (
        <div id="methodology-panel" className="animate-fade-in grid gap-6 border-t p-5 sm:p-6 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-medium">Points contributed to your {result.overallScore}/100</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                  <XAxis type="number" domain={[0, 25]} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: "var(--muted)" }}
                    contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--popover-foreground)" }}
                    formatter={(value, _name, item) => {
                      const payload = (item as { payload?: { weight: number; score: number } }).payload;
                      return [`${value} of ${payload ? payload.weight * 100 : 0} pts (score ${payload?.score ?? 0})`, "Contribution"];
                    }}
                  />
                  <Bar dataKey="contribution" radius={[0, 6, 6, 0]} barSize={18}>
                    {data.map((item) => (
                      <Cell key={item.key} fill={TONE_VAR[scoreTone(item.score)]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Overall = Σ (component score × weight). Maximum points per component: 25, 25, 20, 10, 10 and 10.
            </p>
          </div>
          <div>
            <p className="mb-3 text-sm font-medium">Components and weights</p>
            <ul className="space-y-3">
              {SCORE_WEIGHTS.map((item) => {
                const entry = result.scoreBreakdown.find((b) => b.key === item.key);
                return (
                  <li key={item.key} className="rounded-xl border p-3">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium">{item.label}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {Math.round(item.weight * 100)}% · {entry?.score ?? 0}/100
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.description}</p>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              All scores come from deterministic rules applied to the extracted text: keyword and skill matching against a
              curated skills dictionary, date parsing for experience, degree detection, and structure/formatting checks.
              The same resume and job description always produce the same score.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
