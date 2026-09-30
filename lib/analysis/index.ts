import "server-only";
import { analysisResultSchema } from "@/lib/validation/analysis-schema";
import { computeScores } from "@/lib/scoring/engine";
import { scoreBand } from "@/lib/scoring/weights";
import type { AnalysisResult, AnalysisStage } from "@/types/analysis";
import { claimedYears, findDateRanges, mergedMonths } from "./dates";
import { highestLevel } from "./education";
import {
  buildComparison,
  buildIssues,
  buildMissingReason,
  buildSections,
  buildSuggestions,
  buildSummary,
  type InsightContext,
} from "./insights";
import { parseJobDescription } from "./job-parser";
import { extractJobKeywords, indexResumeSkills, matchKeywords } from "./keywords";
import { parseResume, type ParsedResume } from "./resume-parser";
import { buildRewriteSuggestions } from "./rewrite";
import { SKILL_BY_NAME } from "./skills-taxonomy";
import { analyzeWriting } from "./writing";

export interface AnalysisInput {
  resumeText: string;
  links: string[];
  jobDescription: string;
  file: { name: string; type: "pdf" | "docx"; size: number; pageCount: number | null };
  multiColumn: boolean;
  hasTables: boolean;
  onStage?: (stage: AnalysisStage) => Promise<void>;
  now?: Date;
}

function experienceYears(resume: ParsedResume, now: Date): { years: number | null; ranges: number } {
  const scope =
    resume.sectionText.experience && findDateRanges(resume.sectionText.experience, now).length > 0
      ? resume.sectionText.experience
      : resume.sections
          .filter((section) => section.key !== "education" && section.key !== "projects" && section.key !== "certifications")
          .map((section) => section.lines.join("\n"))
          .join("\n");
  const ranges = findDateRanges(scope, now);
  const computed = ranges.length > 0 ? mergedMonths(ranges) / 12 : null;
  const claimed = claimedYears(`${resume.sectionText.summary ?? ""}\n${resume.sectionText.header ?? ""}`);
  const years = computed === null ? claimed : claimed === null ? computed : Math.max(computed, claimed);
  return { years: years === null ? null : Math.round(years * 10) / 10, ranges: ranges.length };
}

export async function analyzeResume(input: AnalysisInput): Promise<AnalysisResult> {
  const now = input.now ?? new Date();
  const stage = input.onStage ?? (async () => undefined);

  await stage("comparing");
  const resume = parseResume(input.resumeText, input.links);
  const job = parseJobDescription(input.jobDescription);

  await stage("keywords");
  const keywords = extractJobKeywords(job);
  const skillIndex = indexResumeSkills(resume);
  const matches = matchKeywords(keywords, resume, skillIndex);
  const writing = analyzeWriting(resume);
  const { years: resumeYears, ranges: dateRangesFound } = experienceYears(resume, now);
  const resumeLevel = highestLevel(resume.sectionText.education || resume.text);

  await stage("recommendations");
  const scores = computeScores({
    resume,
    job,
    matches,
    writing,
    resumeYears,
    resumeLevel,
    multiColumn: input.multiColumn,
    hasTables: input.hasTables,
    dateRangesFound,
  });

  const context: InsightContext = {
    resume,
    job,
    matches,
    writing,
    scores,
    resumeYears,
    dateRangesFound,
    multiColumn: input.multiColumn,
    hasTables: input.hasTables,
  };
  const sections = buildSections(context);
  const issues = buildIssues(context, sections);
  const suggestions = buildSuggestions(context, issues);
  const rewriteSuggestions = buildRewriteSuggestions(resume, matches, resumeYears, job.title);

  await stage("preparing");
  const hardSkill = (name: string) => {
    const category = SKILL_BY_NAME.get(name)?.category;
    return category !== undefined && category !== "Soft Skills" && category !== "Certifications";
  };
  const jobSkillNames = new Set(matches.map((m) => m.name));

  const result: AnalysisResult = {
    meta: {
      fileName: input.file.name.slice(0, 255),
      fileType: input.file.type,
      fileSize: input.file.size,
      pageCount: input.file.pageCount,
      wordCount: resume.wordCount,
      jobTitle: job.title,
      analyzedAt: now.toISOString(),
    },
    overallScore: scores.overall,
    scoreBand: scoreBand(scores.overall),
    summary: buildSummary(context, scores.overall, job.title),
    atsCompatibility: scores.atsCompatibility.score,
    keywordMatch: scores.keywordMatch.score,
    skillsMatch: scores.skillsMatch.score,
    experienceMatch: scores.experienceMatch.score,
    educationMatch: scores.educationMatch.score,
    formattingScore: scores.formattingScore.score,
    structureScore: scores.structureScore.score,
    scoreExplanations: {
      atsCompatibility: scores.atsCompatibility.explanation,
      keywordMatch: scores.keywordMatch.explanation,
      skillsMatch: scores.skillsMatch.explanation,
      experienceMatch: scores.experienceMatch.explanation,
      educationMatch: scores.educationMatch.explanation,
      formattingScore: scores.formattingScore.explanation,
      structureScore: scores.structureScore.explanation,
    },
    scoreBreakdown: scores.breakdown,
    matchedKeywords: matches
      .filter((m) => m.status === "matched")
      .map((m) => ({ keyword: m.name, importance: m.importance })),
    missingKeywords: matches
      .filter((m) => m.status !== "matched")
      .map((m) => ({ keyword: m.name, importance: m.importance, reason: buildMissingReason(m) })),
    skills: {
      matched: matches.filter((m) => m.kind === "skill" && m.status === "matched").map((m) => m.name),
      missing: matches.filter((m) => m.kind === "skill" && m.status !== "matched").map((m) => m.name),
      additional: [...skillIndex.all].filter((name) => hardSkill(name) && !jobSkillNames.has(name)).slice(0, 40),
    },
    comparison: buildComparison(matches),
    sections,
    issues,
    suggestions,
    rewriteSuggestions,
    experience: { resumeYears, requiredYears: job.requiredYears },
    education: { resumeLevel: resumeLevel?.label ?? null, requiredLevel: job.education.level?.label ?? null },
  };

  return analysisResultSchema.parse(result);
}
