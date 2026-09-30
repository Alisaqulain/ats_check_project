"use client";

import { useEffect, useRef } from "react";
import { Briefcase, CircleCheck, FileText, ListChecks, RotateCcw, Sparkles, SquarePen, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatBytes } from "@/lib/utils";
import type { AnalysisResult, Severity } from "@/types/analysis";
import { ComparisonTable } from "./comparison-table";
import { ExportButton } from "./export-button";
import { IssueCard } from "./issue-card";
import { KeywordList } from "./keyword-list";
import { Methodology } from "./methodology";
import { RewriteCard } from "./rewrite-card";
import { ScoreBreakdown } from "./score-breakdown";
import { ScoreCard } from "./score-card";
import { SectionAnalysis } from "./section-analysis";
import { SectionTitle } from "./section-title";
import { SkillAnalysis } from "./skill-analysis";

const NAV = [
  { href: "#overview", label: "Overview" },
  { href: "#keywords", label: "Keywords" },
  { href: "#skills", label: "Skills" },
  { href: "#comparison", label: "Comparison" },
  { href: "#sections", label: "Sections" },
  { href: "#issues", label: "Issues" },
  { href: "#improve", label: "Improve" },
];

interface ResultsDashboardProps {
  result: AnalysisResult;
  onNewAnalysis: () => void;
}

export function ResultsDashboard({ result, onNewAnalysis }: ResultsDashboardProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const counts = result.issues.reduce<Record<Severity, number>>(
    (acc, issue) => ({ ...acc, [issue.severity]: acc[issue.severity] + 1 }),
    { high: 0, medium: 0, low: 0 },
  );

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="animate-fade-up space-y-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-success/25 bg-success-soft px-3 py-1 text-xs font-medium text-success">
            <CircleCheck className="size-3.5" aria-hidden="true" />
            Analysis complete
          </p>
          <h1 ref={headingRef} tabIndex={-1} className="mt-4 text-3xl font-semibold tracking-tight outline-none sm:text-4xl">
            Your resume <span className="text-gradient">report</span>
          </h1>
          <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <div className="flex min-w-0 items-center gap-1.5">
              <dt className="sr-only">Resume file</dt>
              <FileText className="size-4 shrink-0" aria-hidden="true" />
              <dd className="max-w-[16rem] truncate sm:max-w-sm" title={result.meta.fileName}>
                {result.meta.fileName}
              </dd>
              <dd className="shrink-0">· {formatBytes(result.meta.fileSize)}</dd>
            </div>
            {result.meta.jobTitle && (
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">Detected job title</dt>
                <Briefcase className="size-4 shrink-0" aria-hidden="true" />
                <dd>{result.meta.jobTitle}</dd>
              </div>
            )}
          </dl>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <ExportButton result={result} />
          <Button onClick={onNewAnalysis}>
            <RotateCcw aria-hidden="true" />
            New Analysis
          </Button>
        </div>
      </header>

      <nav
        aria-label="Report sections"
        className="glass sticky top-[4.75rem] z-30 -mx-4 border-y border-border/60 px-2 shadow-soft sm:mx-0 sm:rounded-2xl sm:border"
      >
        <ul className="flex gap-1 overflow-x-auto py-1.5 [scrollbar-width:none]">
          {NAV.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="block whitespace-nowrap rounded-xl px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div id="overview" className="scroll-mt-32 space-y-4">
        <ScoreCard result={result} />
        <ScoreBreakdown result={result} />
        <Methodology result={result} />
      </div>

      <KeywordList result={result} />
      <SkillAnalysis result={result} />
      <ComparisonTable result={result} />
      <SectionAnalysis result={result} />

      <section id="issues" aria-labelledby="issues-title" className="scroll-mt-32">
        <SectionTitle
          id="issues-title"
          icon={TriangleAlert}
          title="Issues to fix"
          description={
            result.issues.length > 0
              ? `${counts.high} high · ${counts.medium} medium · ${counts.low} low priority`
              : "Problems detected in your resume, ordered by priority."
          }
        />
        {result.issues.length === 0 ? (
          <EmptyState icon={CircleCheck} title="No significant issues found" description="We didn't detect structural or content problems. Focus on the keyword gaps above." className="bg-card" />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {result.issues.map((issue) => (
              <IssueCard key={issue.title} issue={issue} />
            ))}
          </div>
        )}
      </section>

      <section id="improve" aria-labelledby="improve-title" className="scroll-mt-32 space-y-8">
        <div>
          <SectionTitle
            id="improve-title"
            icon={SquarePen}
            title="Improve My Resume"
            description="Stronger versions of statements from your resume. Nothing is invented, so review each one before using it."
          />
          {result.rewriteSuggestions.length === 0 ? (
            <EmptyState icon={Sparkles} title="No rewrites needed" description="Your bullets already start with strong verbs and read concisely." className="bg-card" />
          ) : (
            <div className="space-y-3">
              {result.rewriteSuggestions.map((rewrite, index) => (
                <RewriteCard key={`${rewrite.section}-${index}`} rewrite={rewrite} />
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-border/70 bg-card/85 p-5 shadow-soft backdrop-blur-sm sm:p-6">
          <h3 className="flex items-center gap-2 font-semibold">
            <ListChecks className="size-4 text-primary" aria-hidden="true" />
            Recommendations
          </h3>
          <ol className="mt-4 space-y-3">
            {result.suggestions.map((suggestion, index) => (
              <li key={suggestion} className="flex gap-3 text-sm">
                <span className="bg-brand flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white">
                  {index + 1}
                </span>
                <span className="pt-0.5">{suggestion}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="border-gradient relative flex flex-col items-center gap-3 overflow-hidden rounded-3xl border border-border/70 bg-card/85 p-6 text-center shadow-soft backdrop-blur-sm sm:flex-row sm:justify-between sm:text-left">
        <p className="text-sm text-muted-foreground">
          Updated your resume? Run a new analysis to see how your score changes.
        </p>
        <div className="flex gap-2">
          <ExportButton result={result} />
          <Button onClick={onNewAnalysis}>
            <RotateCcw aria-hidden="true" />
            New Analysis
          </Button>
        </div>
      </div>
    </div>
  );
}
