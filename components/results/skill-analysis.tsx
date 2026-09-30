import { CircleCheck, CircleMinus, Info, Plus, Puzzle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalysisResult } from "@/types/analysis";
import { SectionTitle } from "./section-title";

interface ColumnProps {
  title: string;
  description: string;
  skills: string[];
  icon: LucideIcon;
  tone: string;
  chip: string;
  empty: string;
}

function SkillColumn({ title, description, skills, icon: Icon, tone, chip, empty }: ColumnProps) {
  return (
    <div className="flex flex-col rounded-3xl border border-border/70 bg-card/85 shadow-soft backdrop-blur-sm p-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold">
          <Icon className={cn("size-4", tone)} aria-hidden="true" />
          {title}
        </h3>
        <span className="text-sm tabular-nums text-muted-foreground">{skills.length}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      {skills.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label={title}>
          {skills.map((skill) => (
            <li key={skill} className={cn("rounded-lg px-2.5 py-1 text-sm", chip)}>
              {skill}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SkillAnalysis({ result }: { result: AnalysisResult }) {
  const { matched, missing, additional } = result.skills;
  return (
    <section id="skills" aria-labelledby="skills-title" className="scroll-mt-32">
      <SectionTitle id="skills-title" icon={Puzzle} title="Skills analysis" description="Hard skills required by the job compared with the skills in your resume." />
      <div className="grid gap-4 md:grid-cols-3">
        <SkillColumn
          title="Matched skills"
          description="Required by the job and found in your resume."
          skills={matched}
          icon={CircleCheck}
          tone="text-success"
          chip="bg-success-soft text-success"
          empty="No required hard skills were found in your resume."
        />
        <SkillColumn
          title="Missing skills"
          description="Mentioned in the job but not found in your resume."
          skills={missing}
          icon={CircleMinus}
          tone="text-danger"
          chip="bg-danger-soft text-danger"
          empty="You cover all the hard skills we identified in this job."
        />
        <SkillColumn
          title="Additional skills"
          description="In your resume but not requested by this job."
          skills={additional}
          icon={Plus}
          tone="text-primary"
          chip="bg-accent text-accent-foreground"
          empty="No additional hard skills detected."
        />
      </div>
      {missing.length > 0 && (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-warning/30 bg-warning-soft/60 p-3 text-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
          <span>
            <strong className="font-medium">Only add a skill if you genuinely have the experience.</strong> Missing skills
            show gaps between your resume and this job. They are not a checklist to copy. Adding skills you don&apos;t have
            can hurt you in interviews.
          </span>
        </p>
      )}
    </section>
  );
}
