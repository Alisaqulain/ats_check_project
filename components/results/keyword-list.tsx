"use client";

import { useState } from "react";
import { CircleCheck, CircleX, Tags } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { AnalysisResult, Importance } from "@/types/analysis";
import { IMPORTANCE_VARIANT, LEVEL_LABEL } from "./score-utils";
import { SectionTitle } from "./section-title";

const ORDER: Importance[] = ["high", "medium", "low"];
const INITIAL_MISSING = 8;

export function KeywordList({ result }: { result: AnalysisResult }) {
  const [showAll, setShowAll] = useState(false);
  const matched = [...result.matchedKeywords].sort((a, b) => ORDER.indexOf(a.importance) - ORDER.indexOf(b.importance));
  const missing = [...result.missingKeywords].sort((a, b) => ORDER.indexOf(a.importance) - ORDER.indexOf(b.importance));
  const visibleMissing = showAll ? missing : missing.slice(0, INITIAL_MISSING);

  return (
    <section id="keywords" aria-labelledby="keywords-title" className="scroll-mt-32">
      <SectionTitle
        id="keywords-title"
        icon={Tags}
        title="Keywords"
        description="Terms from the job description, ranked by how prominently the posting emphasizes them."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-border/70 bg-card/85 shadow-soft backdrop-blur-sm p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold">
              <CircleCheck className="size-4 text-success" aria-hidden="true" />
              Matched keywords
            </h3>
            <span className="text-sm tabular-nums text-muted-foreground">{matched.length}</span>
          </div>
          {matched.length === 0 ? (
            <EmptyState icon={Tags} title="No matching keywords yet" description="None of the job's key terms were found in your resume." />
          ) : (
            <ul className="flex flex-wrap gap-2" aria-label="Matched keywords">
              {matched.map((keyword) => (
                <li
                  key={keyword.keyword}
                  className="inline-flex items-center gap-2 rounded-lg border border-success/25 bg-success-soft/60 py-1 pl-2.5 pr-1.5 text-sm"
                >
                  {keyword.keyword}
                  <Badge variant={IMPORTANCE_VARIANT[keyword.importance]} className="px-1.5 py-0 text-[10px]">
                    {LEVEL_LABEL[keyword.importance]}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-3xl border border-border/70 bg-card/85 shadow-soft backdrop-blur-sm p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold">
              <CircleX className="size-4 text-danger" aria-hidden="true" />
              Missing keywords
            </h3>
            <span className="text-sm tabular-nums text-muted-foreground">{missing.length}</span>
          </div>
          {missing.length === 0 ? (
            <EmptyState icon={CircleCheck} title="Nothing missing" description="Your resume covers every keyword we identified in this job description." />
          ) : (
            <>
              <ul className="space-y-2.5" aria-label="Missing keywords">
                {visibleMissing.map((keyword) => (
                  <li key={keyword.keyword} className="rounded-xl border p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{keyword.keyword}</span>
                      <Badge variant={IMPORTANCE_VARIANT[keyword.importance]}>{LEVEL_LABEL[keyword.importance]} importance</Badge>
                    </div>
                    <p className="mt-1.5 text-sm text-muted-foreground">{keyword.reason}</p>
                  </li>
                ))}
              </ul>
              {missing.length > INITIAL_MISSING && (
                <Button variant="ghost" size="sm" className="mt-3" onClick={() => setShowAll((value) => !value)} aria-expanded={showAll}>
                  {showAll ? "Show fewer" : `Show all ${missing.length}`}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
