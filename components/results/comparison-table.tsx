import { Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { AnalysisResult } from "@/types/analysis";
import { SectionTitle } from "./section-title";

const RESUME_LABEL = { found: "Found", related: "Related found", "not-found": "Not found" } as const;
const JOB_LABEL = { required: "Required", preferred: "Preferred", mentioned: "Mentioned" } as const;
const STATUS = {
  matched: { label: "Matched", variant: "success" },
  partial: { label: "Partial", variant: "warning" },
  missing: { label: "Missing", variant: "danger" },
} as const;

export function ComparisonTable({ result }: { result: AnalysisResult }) {
  const rows = result.comparison;
  return (
    <section id="comparison" aria-labelledby="comparison-title" className="scroll-mt-32">
      <SectionTitle id="comparison-title" icon={Scale} title="Resume vs. job description" description="Skill-by-skill comparison with where each skill was found." />
      {rows.length === 0 ? (
        <EmptyState icon={Scale} title="No specific skills to compare" description="We didn't detect specific hard skills or certifications in this job description." className="bg-card" />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border/70 bg-card/85 shadow-soft backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <caption className="sr-only">Comparison of job skills with your resume</caption>
              <thead className="bg-muted/40">
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th scope="col" className="px-4 py-3 font-medium sm:px-5">Skill</th>
                  <th scope="col" className="px-4 py-3 font-medium sm:px-5">Resume</th>
                  <th scope="col" className="px-4 py-3 font-medium sm:px-5">Job</th>
                  <th scope="col" className="px-4 py-3 font-medium sm:px-5">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.skill} className="border-b last:border-0 hover:bg-muted/30">
                    <th scope="row" className="px-4 py-3 text-left font-medium sm:px-5">
                      {row.skill}
                      <span className="block text-xs font-normal text-muted-foreground">{row.category}</span>
                    </th>
                    <td className="px-4 py-3 sm:px-5">
                      {RESUME_LABEL[row.resume]}
                      <span className="block text-xs text-muted-foreground">{row.evidence}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground sm:px-5">{JOB_LABEL[row.job]}</td>
                    <td className="px-4 py-3 sm:px-5">
                      <Badge variant={STATUS[row.status].variant}>{STATUS[row.status].label}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
