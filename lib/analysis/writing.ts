import { countWords } from "@/lib/parsing/normalize";
import { findDateRanges } from "./dates";
import type { ParsedResume } from "./resume-parser";

const ACTION_VERBS = new Set(
  (
    "accelerated accomplished achieved acquired adapted administered advised advocated analyzed architected arranged " +
    "assembled assessed attained audited authored automated balanced boosted budgeted built calculated captured " +
    "centralized championed clarified coached collaborated compiled completed composed computed conceived conceptualized " +
    "conducted configured consolidated constructed consulted converted coordinated created cultivated customized cut " +
    "debugged decreased defined delivered demonstrated deployed designed detected developed devised diagnosed directed " +
    "discovered documented doubled drafted drove edited educated eliminated enabled engineered enhanced established " +
    "evaluated executed expanded expedited facilitated finalized forecasted formulated founded generated grew guided " +
    "headed identified implemented improved increased influenced initiated innovated inspected installed instituted " +
    "integrated interpreted introduced investigated launched led leveraged maintained managed mapped marketed maximized " +
    "measured mentored merged migrated minimized modeled modernized monitored motivated negotiated operated optimized " +
    "orchestrated organized originated outperformed overhauled oversaw owned partnered performed pioneered planned " +
    "prepared presented prioritized processed produced programmed promoted proposed prototyped provided published " +
    "raised ran rebuilt recommended reconciled recruited redesigned reduced refactored refined reorganized replaced " +
    "reported researched resolved restructured revamped reviewed revised saved scaled scheduled secured selected " +
    "shaped shipped simplified solved spearheaded standardized steered streamlined strengthened structured supervised " +
    "surpassed synthesized systematized taught tested tracked trained transformed translated tripled troubleshot " +
    "unified upgraded validated visualized won wrote " +
    "build develop design lead manage create implement deliver drive own maintain optimize analyze coordinate mentor " +
    "architect engineer deploy automate improve launch ship write test oversee establish streamline"
  ).split(/\s+/),
);

export const WEAK_OPENERS: { pattern: RegExp; label: string }[] = [
  { pattern: /^(?:was |were )?responsible for\b/i, label: "Responsible for" },
  { pattern: /^worked on\b/i, label: "Worked on" },
  { pattern: /^(?:helped|assisted)\b/i, label: "Helped / Assisted" },
  { pattern: /^(?:was |were )?involved in\b/i, label: "Involved in" },
  { pattern: /^participated in\b/i, label: "Participated in" },
  { pattern: /^(?:duties|responsibilities) (?:included|include)\b/i, label: "Duties included" },
  { pattern: /^tasked with\b/i, label: "Tasked with" },
  { pattern: /^in charge of\b/i, label: "In charge of" },
  { pattern: /^(?:was |were )?part of\b/i, label: "Part of" },
  { pattern: /^handled\b/i, label: "Handled" },
  { pattern: /^i\s+/i, label: "Starts with “I”" },
];

export const CLICHES = [
  "hardworking", "hard-working", "hard working", "team player", "go-getter", "results-driven", "results-oriented",
  "passionate", "highly motivated", "self-starter", "think outside the box", "synergy", "dynamic individual",
  "fast learner", "quick learner", "enthusiastic", "dedicated professional", "seeking a challenging",
  "looking for an opportunity", "utilize my skills", "best of my abilities", "detail-oriented individual",
];

const QUANTIFIED =
  /\d+(?:\.\d+)?\s*(?:%|percent|x\b|k\b|m\b|\+)|[$€£₹]\s?\d|\b\d{2,}(?:,\d{3})*\b|\b\d+\s+(?:users|customers|clients|people|engineers|members|projects|hours|days|weeks|months|ms|seconds|requests|transactions|stores|countries|teams|applications|apps|services|servers|pages|features|tickets|leads|accounts|students|patients|employees|reports|markets|sites|locations|products|releases|campaigns|partners|vendors|stakeholders|developers|interns|departments|regions)\b/i;

const PRONOUN = /(?<![A-Za-z])(?:I|me|my|mine|myself)(?![A-Za-z'])/g;

export interface StatementAnalysis {
  text: string;
  words: number;
  actionVerb: boolean;
  weakOpener: string | null;
  quantified: boolean;
}

export function analyzeStatement(text: string): StatementAnalysis {
  const firstWord = text.replace(/^[^A-Za-z]+/, "").split(/\s+/)[0]?.toLowerCase().replace(/[^a-z-]/g, "") ?? "";
  const weak = WEAK_OPENERS.find((opener) => opener.pattern.test(text));
  return {
    text,
    words: countWords(text),
    actionVerb: !weak && (ACTION_VERBS.has(firstWord) || (/ed$/.test(firstWord) && firstWord.length > 4)),
    weakOpener: weak?.label ?? null,
    quantified: QUANTIFIED.test(text),
  };
}

export interface WritingStats {
  statements: StatementAnalysis[];
  bulletCount: number;
  actionVerbRatio: number;
  quantifiedRatio: number;
  weakStatements: StatementAnalysis[];
  longStatements: StatementAnalysis[];
  longParagraphs: number;
  pronounCount: number;
  cliches: string[];
  dateFormats: Set<string>;
  experienceUsesBullets: boolean;
}

export function analyzeWriting(resume: ParsedResume): WritingStats {
  const statements = resume.statements.map((statement) => analyzeStatement(statement.text));
  const total = statements.length || 1;

  let longParagraphs = 0;
  for (const section of resume.sections) {
    if (section.key === "header" || section.key === "skills") continue;
    let blockWords = 0;
    for (const line of section.lines) {
      const isProse = !line.startsWith("• ") && line.length > 50;
      if (isProse) blockWords += countWords(line);
      else {
        if (blockWords > 70) longParagraphs += 1;
        blockWords = 0;
      }
    }
    if (blockWords > 70) longParagraphs += 1;
  }

  const experienceLines = resume.sections
    .filter((section) => section.key === "experience")
    .flatMap((section) => section.lines);
  const experienceBullets = experienceLines.filter((line) => line.startsWith("• ")).length;

  const lower = resume.text.toLowerCase();
  const summaryAndHeader = `${resume.sectionText.summary ?? ""}\n${resume.sectionText.header ?? ""}`;

  return {
    statements,
    bulletCount: resume.statements.filter((statement) => statement.isBullet).length,
    actionVerbRatio: statements.filter((s) => s.actionVerb).length / total,
    quantifiedRatio: statements.filter((s) => s.quantified).length / total,
    weakStatements: statements.filter((s) => s.weakOpener !== null),
    longStatements: statements.filter((s) => s.words > 38),
    longParagraphs,
    pronounCount: (summaryAndHeader.match(PRONOUN)?.length ?? 0) + resume.statements.filter((s) => /^I\s/.test(s.text)).length,
    cliches: CLICHES.filter((cliche) => lower.includes(cliche)),
    dateFormats: new Set(findDateRanges(resume.text).map((range) => range.format)),
    experienceUsesBullets: experienceLines.length < 4 || experienceBullets >= Math.min(3, experienceLines.length / 3),
  };
}
