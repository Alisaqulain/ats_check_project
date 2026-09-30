import { CircleCheck } from "lucide-react";
import { SectionHeading } from "./section-heading";

const ITEMS = [
  "Overall ATS compatibility estimate with a transparent breakdown",
  "Six component scores: keywords, skills, experience, education, structure and formatting",
  "Matched and missing keywords ranked by importance",
  "Matched, missing and additional skills",
  "Resume vs. job description comparison table",
  "Section-by-section strengths, problems and suggestions",
  "Prioritized list of issues to fix, by severity",
  "Rewrite suggestions for weak bullets and summaries",
  "A downloadable PDF report of the full analysis",
];

export function WhatYouGet() {
  return (
    <section className="py-20 sm:py-28" aria-labelledby="get-title">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
        <SectionHeading
          id="get-title"
          eyebrow="What you get"
          title="A complete report, not just a number"
          description="Scores help you prioritize, but the real value is in the specifics: which keywords to address, which bullets to strengthen, and which gaps are real."
          className="lg:mx-0 lg:text-left"
        />
        <ul className="grid gap-2.5">
          {ITEMS.map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card/80 px-4 py-3.5 text-sm shadow-soft backdrop-blur-sm transition-all duration-200 hover:translate-x-1 hover:border-primary/30"
            >
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
                <CircleCheck className="size-3.5" aria-hidden="true" />
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
