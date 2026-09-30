"use client";

import { CircleAlert, CircleCheck, Layers, Lightbulb } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AnalysisResult, SectionAnalysis as Section } from "@/types/analysis";
import { TONE_TEXT, scoreTone } from "./score-utils";
import { SectionTitle } from "./section-title";

function List({ title, items, icon: Icon, tone }: { title: string; items: string[]; icon: typeof CircleCheck; tone: string }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h4>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm">
            <Icon className={cn("mt-0.5 size-4 shrink-0", tone)} aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScoreLabel({ section }: { section: Section }) {
  if (!section.found) {
    return <Badge variant={section.optional ? "secondary" : "danger"}>{section.optional ? "Not included" : "Not found"}</Badge>;
  }
  return (
    <span className={cn("text-lg font-semibold tabular-nums", TONE_TEXT[scoreTone(section.score)])}>
      {section.score}
      <span className="text-xs font-normal text-muted-foreground">/100</span>
    </span>
  );
}

export function SectionAnalysis({ result }: { result: AnalysisResult }) {
  return (
    <section id="sections" aria-labelledby="sections-title" className="scroll-mt-32">
      <SectionTitle id="sections-title" icon={Layers} title="Section-by-section analysis" description="Expand a section to see its strengths, problems and suggestions." />
      <Accordion type="multiple" className="space-y-3">
        {result.sections.map((section) => (
          <AccordionItem key={section.name} value={section.name}>
            <AccordionTrigger>
              <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                <span className="min-w-0">
                  <span className="block font-medium">{section.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {section.issues.length > 0
                      ? `${section.issues.length} problem${section.issues.length > 1 ? "s" : ""} found`
                      : section.found
                        ? "No problems found"
                        : section.optional
                          ? "Optional section"
                          : "Section missing"}
                  </span>
                </span>
                <ScoreLabel section={section} />
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-5 border-t pt-4 md:grid-cols-3">
                <List title="Strengths" items={section.strengths} icon={CircleCheck} tone="text-success" />
                <List title="Problems" items={section.issues} icon={CircleAlert} tone="text-danger" />
                <List title="Suggestions" items={section.suggestions} icon={Lightbulb} tone="text-warning" />
                {section.strengths.length + section.issues.length + section.suggestions.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nothing to report for this section.</p>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
