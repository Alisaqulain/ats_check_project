import { ArrowRight, TriangleAlert } from "lucide-react";
import { SectionHeading } from "./section-heading";

const ROWS = [
  { skill: "React", resume: "Found", job: "Required", status: "Matched" },
  { skill: "TypeScript", resume: "Found", job: "Required", status: "Matched" },
  { skill: "Docker", resume: "Not found", job: "Required", status: "Missing" },
  { skill: "GraphQL", resume: "Not found", job: "Preferred", status: "Missing" },
];

export function AnalysisPreview() {
  return (
    <section className="relative isolate overflow-hidden py-20 sm:py-28" aria-labelledby="preview-title">
      <div className="bg-aurora absolute inset-0 -z-10 rotate-180 opacity-70" aria-hidden="true" />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          id="preview-title"
          eyebrow="ATS analysis preview"
          title="See exactly where you stand"
          description="Every result explains itself: what matched, what's missing, and a concrete next step. Sample data shown below."
        />

        <div className="mt-16 grid gap-5 lg:grid-cols-5">
          <div className="overflow-hidden rounded-3xl border border-border/70 bg-card/80 shadow-soft backdrop-blur-sm lg:col-span-3">
            <div className="border-b px-5 py-4">
              <h3 className="font-semibold">Resume vs. job description</h3>
              <p className="text-sm text-muted-foreground">Skill-by-skill comparison</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th scope="col" className="px-5 py-3 font-medium">Skill</th>
                    <th scope="col" className="px-5 py-3 font-medium">Resume</th>
                    <th scope="col" className="px-5 py-3 font-medium">Job</th>
                    <th scope="col" className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row) => (
                    <tr key={row.skill} className="border-b last:border-0">
                      <td className="px-5 py-3 font-medium">{row.skill}</td>
                      <td className="px-5 py-3 text-muted-foreground">{row.resume}</td>
                      <td className="px-5 py-3 text-muted-foreground">{row.job}</td>
                      <td className="px-5 py-3">
                        <span
                          className={
                            row.status === "Matched"
                              ? "rounded-full bg-success-soft px-2 py-0.5 text-xs font-medium text-success"
                              : "rounded-full bg-danger-soft px-2 py-0.5 text-xs font-medium text-danger"
                          }
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:col-span-2">
            <div className="rounded-3xl border border-border/70 bg-card/80 shadow-soft backdrop-blur-sm p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-warning-soft p-2 text-warning">
                  <TriangleAlert className="size-4" aria-hidden="true" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">Missing measurable achievements</h3>
                    <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[11px] font-medium text-warning">Medium</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Only 1 of 9 bullets includes a measurable outcome. Add real numbers where you have them.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex-1 rounded-3xl border border-border/70 bg-card/80 shadow-soft backdrop-blur-sm p-5">
              <h3 className="text-sm font-semibold">Rewrite suggestion</h3>
              <div className="mt-3 space-y-2 text-sm">
                <p className="rounded-lg bg-muted px-3 py-2 text-muted-foreground line-through decoration-muted-foreground/40">
                  Responsible for maintaining the checkout page.
                </p>
                <ArrowRight className="mx-auto size-4 rotate-90 text-muted-foreground" aria-hidden="true" />
                <p className="rounded-lg border border-success/30 bg-success-soft px-3 py-2">Maintained the checkout page.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
