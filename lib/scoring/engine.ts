import { clamp } from "@/lib/utils";
import type { AnalysisResult } from "@/types/analysis";
import type { EducationLevel } from "@/lib/analysis/education";
import { detectFields } from "@/lib/analysis/education";
import type { ParsedJob } from "@/lib/analysis/job-parser";
import { keywordWeight, vocabularyOverlap, type KeywordMatch } from "@/lib/analysis/keywords";
import { hasSection, type ParsedResume } from "@/lib/analysis/resume-parser";
import type { WritingStats } from "@/lib/analysis/writing";
import { SCORE_WEIGHTS } from "./weights";

export interface ScoreResult {
  score: number;
  explanation: string;
}

export interface ScoringContext {
  resume: ParsedResume;
  job: ParsedJob;
  matches: KeywordMatch[];
  writing: WritingStats;
  resumeYears: number | null;
  resumeLevel: EducationLevel | null;
  multiColumn: boolean;
  hasTables: boolean;
  dateRangesFound: number;
}

const round = (value: number) => Math.round(clamp(value));

export function scoreKeywords({ matches, job, resume }: ScoringContext): ScoreResult {
  if (matches.length === 0) {
    const overlap = vocabularyOverlap(job.text, resume.text);
    return {
      score: round(overlap * 140),
      explanation: `No specific skills or recurring terms were detected in the job description, so this reflects general vocabulary overlap (${Math.round(overlap * 100)}% of meaningful job terms appear in your resume).`,
    };
  }
  let total = 0;
  let earned = 0;
  for (const match of matches) {
    const weight = keywordWeight(match.importance);
    total += weight;
    if (match.status === "matched") earned += weight;
    else if (match.status === "partial") earned += weight * 0.5;
  }
  const found = matches.filter((m) => m.status === "matched").length;
  const high = matches.filter((m) => m.importance === "high");
  const highFound = high.filter((m) => m.status === "matched").length;
  return {
    score: round((earned / total) * 100),
    explanation: `${found} of ${matches.length} job keywords found${high.length > 0 ? `, including ${highFound} of ${high.length} high-priority terms` : ""}.`,
  };
}

export function scoreSkills(context: ScoringContext, keywordScore: ScoreResult): ScoreResult {
  const skills = context.matches.filter((m) => m.kind === "skill");
  if (skills.length === 0) {
    return {
      score: keywordScore.score,
      explanation: "The job description doesn't list specific hard skills we recognize, so this mirrors the keyword score.",
    };
  }
  let total = 0;
  let earned = 0;
  for (const match of skills) {
    const weight = keywordWeight(match.importance);
    total += weight;
    if (match.status === "matched") {
      const demonstrated = match.locations.some((loc) => loc === "experience" || loc === "projects");
      earned += weight * (demonstrated ? 1 : 0.85);
    } else if (match.status === "partial") earned += weight * 0.5;
    else if (match.related) earned += weight * 0.25;
  }
  const matched = skills.filter((m) => m.status === "matched");
  const demonstrated = matched.filter((m) => m.locations.some((loc) => loc === "experience" || loc === "projects"));
  return {
    score: round((earned / total) * 100),
    explanation: `${matched.length} of ${skills.length} required hard skills found; ${demonstrated.length} of them are backed by experience or project descriptions.`,
  };
}

const SENIORITY = /\b(senior|sr|junior|jr|lead|principal|staff|head|chief|mid|level|entry|i{1,3}|iv|associate|intern|remote|hybrid|contract|full|time|part)\b/g;

function normalizeRoleText(value: string): string {
  return value
    .toLowerCase()
    .replace(/front[\s-]?end/g, "frontend")
    .replace(/back[\s-]?end/g, "backend")
    .replace(/full[\s-]?stack/g, "fullstack")
    .replace(/\b(developer|programmer|swe)\b/g, "engineer");
}

function titleAlignment(title: string | null, resume: ParsedResume): number | null {
  if (!title) return null;
  const core = normalizeRoleText(title)
    .replace(SENIORITY, " ")
    .split(/[^a-z0-9+#.]+/)
    .filter((token) => token.length >= 2 && !["and", "of", "the", "for", "with", "to", "in"].includes(token));
  if (core.length === 0) return null;
  const experience = normalizeRoleText(`${resume.sectionText.experience ?? ""}\n${resume.headline ?? ""}\n${resume.sectionText.summary ?? ""}`);
  const everywhere = normalizeRoleText(resume.text);
  let score = 0;
  for (const token of core) {
    const pattern = new RegExp(`(?<![a-z0-9])${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);
    if (pattern.test(experience)) score += 1;
    else if (pattern.test(everywhere)) score += 0.6;
  }
  return score / core.length;
}

export function scoreExperience(context: ScoringContext): ScoreResult {
  const { job, resume, matches, resumeYears } = context;
  const parts: { value: number; weight: number }[] = [];
  const notes: string[] = [];

  if (job.requiredYears) {
    const value = resumeYears === null ? 0.4 : Math.min(1, resumeYears / job.requiredYears);
    parts.push({ value, weight: 0.4 });
    notes.push(
      resumeYears === null
        ? `the job asks for ${job.requiredYears}+ years, but no employment dates could be read from your resume`
        : `about ${formatYears(resumeYears)} of experience detected vs. ${job.requiredYears}+ required`,
    );
  } else if (resumeYears !== null) {
    notes.push(`about ${formatYears(resumeYears)} of experience detected (no minimum stated in the job)`);
  }

  const skills = matches.filter((m) => m.kind === "skill");
  const relevant = skills.length > 0 ? skills : matches;
  if (relevant.length > 0) {
    let total = 0;
    let earned = 0;
    for (const match of relevant) {
      const weight = keywordWeight(match.importance);
      total += weight;
      if (match.locations.some((loc) => loc === "experience" || loc === "projects")) earned += weight;
      else if (match.status === "matched") earned += weight * 0.35;
    }
    parts.push({ value: earned / total, weight: 0.4 });
    const inHistory = relevant.filter((m) => m.locations.some((loc) => loc === "experience" || loc === "projects")).length;
    notes.push(`${inHistory} of ${relevant.length} job skills appear in your work or project history`);
  } else {
    const overlap = vocabularyOverlap(job.text, resume.sectionText.experience ?? resume.text);
    parts.push({ value: Math.min(1, overlap * 1.4), weight: 0.4 });
  }

  const title = titleAlignment(job.title, resume);
  if (title !== null) {
    parts.push({ value: title, weight: 0.2 });
    notes.push(title >= 0.99 ? "your experience reflects the target job title" : title > 0.4 ? "your titles partially match the target role" : "your titles don't closely match the target role");
  }

  const totalWeight = parts.reduce((sum, part) => sum + part.weight, 0);
  let score = (parts.reduce((sum, part) => sum + part.value * part.weight, 0) / totalWeight) * 100;
  if (!hasSection(resume, "experience") && !hasSection(resume, "projects")) score = Math.min(score, 40);

  const sentence = notes.length > 0 ? notes.join("; ") : "Based on how your experience aligns with the job's responsibilities";
  return { score: round(score), explanation: `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}.` };
}

export function formatYears(years: number): string {
  if (years < 1) return `${Math.max(1, Math.round(years * 12))} months`;
  const rounded = Math.round(years * 2) / 2;
  return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)} year${rounded === 1 ? "" : "s"}`;
}

const STEM = /computer|software|engineering|information|mathematics|statistics|data science|physics|electronics|electrical/;

export function scoreEducation(context: ScoringContext): ScoreResult {
  const { job, resume, resumeLevel, resumeYears } = context;
  const educationText = resume.sectionText.education ?? "";
  const hasEducation = hasSection(resume, "education");
  const required = job.education.level;

  if (!required) {
    return hasEducation
      ? { score: 100, explanation: `The job doesn't state an education requirement; your education section${resumeLevel ? ` (${resumeLevel.label})` : ""} is present.` }
      : { score: 75, explanation: "The job doesn't state an education requirement, but your resume has no education section." };
  }

  const requirementLabel = `${required.label}${job.education.preferredOnly ? " (preferred)" : ""}`;
  if (resumeLevel && resumeLevel.level >= required.level) {
    const jobFields = job.education.fields;
    const resumeFields = detectFields(educationText || resume.text);
    const fieldMatch =
      jobFields.length === 0 ||
      resumeFields.some((field) => jobFields.some((jf) => jf.includes(field) || field.includes(jf))) ||
      (/related|technical|quantitative/i.test(job.text) && resumeFields.some((f) => STEM.test(f)) && jobFields.some((f) => STEM.test(f)));
    return {
      score: fieldMatch ? 100 : 85,
      explanation: fieldMatch
        ? `Your ${resumeLevel.label} meets the ${requirementLabel} requirement.`
        : `Your ${resumeLevel.label} meets the degree level, but your field of study doesn't clearly match (${jobFields.join(", ")}).`,
    };
  }

  if (job.education.preferredOnly) {
    return {
      score: resumeLevel ? 80 : 70,
      explanation: `The job lists a ${required.label} as preferred, not required. ${resumeLevel ? `Your highest detected degree is ${resumeLevel.label}.` : "No degree was detected in your resume."}`,
    };
  }

  if (job.education.equivalentAllowed && resumeYears !== null && resumeYears >= Math.max(job.requiredYears ?? 0, 4)) {
    return {
      score: 75,
      explanation: `The job asks for a ${required.label} or equivalent experience. No matching degree was detected, but your ~${formatYears(resumeYears)} of experience may count as equivalent.`,
    };
  }

  if (resumeLevel) {
    return { score: 55, explanation: `The job asks for a ${required.label}; your highest detected degree is ${resumeLevel.label}.` };
  }
  return {
    score: hasEducation ? 35 : 25,
    explanation: `The job asks for a ${required.label}, but no degree could be detected in your resume${hasEducation ? "" : " (no education section found)"}.`,
  };
}

export function scoreStructure({ resume }: ScoringContext): ScoreResult {
  let score = 0;
  const present: string[] = [];
  const missing: string[] = [];
  const add = (condition: boolean, points: number, label: string) => {
    if (condition) {
      score += points;
      present.push(label);
    } else missing.push(label);
  };

  add(Boolean(resume.contact.email), 12, "email");
  add(Boolean(resume.contact.phone), 8, "phone");
  const hasExperience = hasSection(resume, "experience");
  if (!hasExperience && hasSection(resume, "projects")) {
    score += 18;
    missing.push("work experience (projects partially compensate)");
  } else add(hasExperience, 30, "experience");
  add(hasSection(resume, "skills"), 20, "skills");
  add(hasSection(resume, "education"), 15, "education");
  const untitledSummary = !hasSection(resume, "summary") && resume.sections[0].lines.some((line) => line.split(/\s+/).length >= 20);
  if (untitledSummary) {
    score += 5;
    missing.push("a labelled summary");
  } else add(hasSection(resume, "summary"), 10, "summary");
  if (hasSection(resume, "projects") || hasSection(resume, "certifications")) score += 5;

  return {
    score: round(score),
    explanation: missing.length === 0 ? "All standard sections are present and recognizable." : `Missing or unrecognized: ${missing.join(", ")}.`,
  };
}

export function scoreReadability({ resume, writing }: ScoringContext): ScoreResult {
  let score = 100;
  const notes: string[] = [];
  const deduct = (points: number, note: string) => {
    score -= points;
    notes.push(note);
  };

  if (resume.wordCount < 250) deduct(15, "very short resume");
  else if (resume.wordCount < 400) deduct(5, "fairly short resume");
  else if (resume.wordCount > 1600) deduct(15, "very long resume");
  else if (resume.wordCount > 1200) deduct(8, "long resume");

  if (!writing.experienceUsesBullets) deduct(15, "experience isn't written as bullet points");
  if (writing.longStatements.length > 0) deduct(Math.min(12, writing.longStatements.length * 3), `${writing.longStatements.length} overly long bullet${writing.longStatements.length > 1 ? "s" : ""}`);
  if (writing.longParagraphs > 0) deduct(Math.min(15, writing.longParagraphs * 5), "dense paragraphs");

  if (writing.statements.length >= 3) {
    if (writing.quantifiedRatio < 0.2) deduct(12, "few measurable results");
    else if (writing.quantifiedRatio < 0.4) deduct(6, "some bullets lack measurable results");
    if (writing.actionVerbRatio < 0.5) deduct(8, "many bullets don't start with action verbs");
  }
  if (writing.weakStatements.length >= 3) deduct(8, "weak phrasing such as “responsible for”");
  else if (writing.weakStatements.length > 0) deduct(4, "some weak phrasing");
  if (writing.pronounCount >= 3) deduct(5, "first-person pronouns");
  if (writing.cliches.length >= 2) deduct(4, "generic buzzwords");
  if (writing.dateFormats.size > 1) deduct(5, "inconsistent date formats");

  return {
    score: round(score),
    explanation: notes.length === 0 ? "Concise, bullet-based writing with action verbs and measurable results." : `Points deducted for: ${notes.join(", ")}.`,
  };
}

export function scoreParseability(context: ScoringContext): ScoreResult {
  const { resume, multiColumn, hasTables, dateRangesFound } = context;
  let score = 100;
  const notes: string[] = [];
  const deduct = (points: number, note: string) => {
    score -= points;
    notes.push(note);
  };

  if (resume.wordCount < 150) deduct(25, "little readable text");
  if (!resume.contact.email) deduct(15, "no email detected");
  if (!resume.contact.phone) deduct(8, "no phone number detected");
  const standardHeadings = new Set(resume.sections.filter((s) => s.key !== "header").map((s) => s.key)).size;
  if (standardHeadings < 3) deduct(20, "few standard section headings");
  else if (standardHeadings < 4) deduct(8, "some sections lack standard headings");
  if (hasSection(resume, "experience") && dateRangesFound === 0) deduct(12, "employment dates not recognizable");
  if (multiColumn) deduct(10, "multi-column layout");
  if (hasTables) deduct(6, "tables used for layout");
  const noise = (resume.text.match(/[^\x20-\x7E\n\u00C0-\u024F•–—’‘“”€£₹]/g)?.length ?? 0) / Math.max(1, resume.text.length);
  if (noise > 0.02) deduct(12, "unusual characters or symbols in the extracted text");

  return {
    score: round(score),
    explanation: notes.length === 0 ? "Text, headings, dates and contact details were extracted cleanly." : `Parsing concerns: ${notes.join(", ")}.`,
  };
}

export interface ComputedScores {
  keywordMatch: ScoreResult;
  skillsMatch: ScoreResult;
  experienceMatch: ScoreResult;
  educationMatch: ScoreResult;
  structureScore: ScoreResult;
  formattingScore: ScoreResult;
  atsCompatibility: ScoreResult;
  overall: number;
  breakdown: AnalysisResult["scoreBreakdown"];
}

export function computeScores(context: ScoringContext): ComputedScores {
  const keywordMatch = scoreKeywords(context);
  const skillsMatch = scoreSkills(context, keywordMatch);
  const experienceMatch = scoreExperience(context);
  const educationMatch = scoreEducation(context);
  const structureScore = scoreStructure(context);
  const formattingScore = scoreReadability(context);
  const atsCompatibility = scoreParseability(context);
  const formatting = Math.round((formattingScore.score + atsCompatibility.score) / 2);

  const values: Record<(typeof SCORE_WEIGHTS)[number]["key"], number> = {
    keywordMatch: keywordMatch.score,
    skillsMatch: skillsMatch.score,
    experienceMatch: experienceMatch.score,
    educationMatch: educationMatch.score,
    structureScore: structureScore.score,
    formatting,
  };

  const breakdown = SCORE_WEIGHTS.map(({ key, label, weight }) => ({
    key,
    label,
    weight,
    score: values[key],
    contribution: Math.round(values[key] * weight * 10) / 10,
  }));
  const overall = round(breakdown.reduce((sum, item) => sum + item.score * item.weight, 0));

  return { keywordMatch, skillsMatch, experienceMatch, educationMatch, structureScore, formattingScore, atsCompatibility, overall, breakdown };
}
