import { Gauge, Layers, Puzzle, Sparkles, SquarePen, Tags } from "lucide-react";
import { FeatureCard } from "./feature-card";
import { SectionHeading } from "./section-heading";

const FEATURES = [
  {
    icon: Gauge,
    title: "ATS Score",
    description: "A 0–100 compatibility estimate built from six weighted factors, with a clear explanation of how every point is calculated.",
  },
  {
    icon: Tags,
    title: "Keyword Matching",
    description: "See which job-description keywords your resume already covers, ranked by how important they are in the posting.",
  },
  {
    icon: Puzzle,
    title: "Missing Skills",
    description: "Find required skills that aren't on your resume, plus related skills you have that may transfer.",
  },
  {
    icon: Layers,
    title: "Resume Structure Analysis",
    description: "Section-by-section scoring of contact details, summary, skills, experience, projects, education and certifications.",
  },
  {
    icon: Sparkles,
    title: "Smart Suggestions",
    description: "Prioritized fixes based only on what's actually in your resume and the job description. No invented experience.",
  },
  {
    icon: SquarePen,
    title: "Section Rewriting",
    description: "Stronger versions of weak bullets and summaries, side by side with the original, ready to copy.",
  },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-24 py-20 sm:py-28" aria-labelledby="features-title">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          id="features-title"
          eyebrow="Features"
          title="Everything you need to tailor your resume"
          description="Built to show you exactly what to change, and why, before your resume reaches an applicant tracking system."
        />
        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
