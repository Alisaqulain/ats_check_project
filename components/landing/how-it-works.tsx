import { ClipboardCheck, FileUp, ListChecks, ScanText } from "lucide-react";
import { SectionHeading } from "./section-heading";

const STEPS = [
  {
    icon: FileUp,
    title: "Upload your resume",
    description: "Drop in a PDF or DOCX. We extract the text the same way an ATS parser would.",
  },
  {
    icon: ClipboardCheck,
    title: "Paste the job description",
    description: "Use the full posting, including requirements and responsibilities, for the most accurate comparison.",
  },
  {
    icon: ScanText,
    title: "Get your analysis",
    description: "Keywords, skills, experience, education and structure are compared and scored with a transparent method.",
  },
  {
    icon: ListChecks,
    title: "Improve and re-check",
    description: "Apply prioritized fixes and rewrite suggestions, then run the analysis again to compare.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative scroll-mt-24 py-20 sm:py-28" aria-labelledby="how-title">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          id="how-title"
          eyebrow="How it works"
          title="From upload to actionable feedback in seconds"
          description="No account, no setup. Four steps to understand how well your resume matches a specific role."
        />
        <div className="relative mt-16">
          <div
            className="absolute left-[12%] right-[12%] top-11 hidden h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent lg:block"
            aria-hidden="true"
          />
          <ol className="relative grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className="group relative rounded-3xl border border-border/70 bg-card/80 p-6 shadow-soft backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30"
              >
                <div className="mb-6 flex items-center justify-between">
                  <div className="bg-brand relative flex size-11 items-center justify-center rounded-2xl text-white shadow-glow transition-transform duration-300 group-hover:scale-105">
                    <step.icon className="size-5" aria-hidden="true" />
                  </div>
                  <span className="text-gradient font-mono text-sm font-semibold">0{index + 1}</span>
                </div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
