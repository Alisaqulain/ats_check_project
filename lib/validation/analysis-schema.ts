import { z } from "zod";

const score = z.number().int().min(0).max(100);
const level = z.enum(["high", "medium", "low"]);
const text = z.string().max(4000);

export const scoreKeySchema = z.enum([
  "keywordMatch",
  "skillsMatch",
  "experienceMatch",
  "educationMatch",
  "structureScore",
  "formatting",
]);

export const analysisResultSchema = z.object({
  meta: z.object({
    fileName: z.string().max(255),
    fileType: z.enum(["pdf", "docx"]),
    fileSize: z.number().int().nonnegative(),
    pageCount: z.number().int().positive().nullable(),
    wordCount: z.number().int().nonnegative(),
    jobTitle: z.string().max(120).nullable(),
    analyzedAt: z.string(),
  }),

  overallScore: score,
  scoreBand: z.enum(["strong", "moderate", "needs-improvement"]),
  summary: text,

  atsCompatibility: score,
  keywordMatch: score,
  skillsMatch: score,
  experienceMatch: score,
  educationMatch: score,
  formattingScore: score,
  structureScore: score,

  scoreExplanations: z.object({
    atsCompatibility: text,
    keywordMatch: text,
    skillsMatch: text,
    experienceMatch: text,
    educationMatch: text,
    formattingScore: text,
    structureScore: text,
  }),

  scoreBreakdown: z
    .array(
      z.object({
        key: scoreKeySchema,
        label: z.string(),
        weight: z.number().min(0).max(1),
        score,
        contribution: z.number().min(0).max(100),
      }),
    )
    .length(6),

  matchedKeywords: z.array(z.object({ keyword: z.string(), importance: level })).max(200),

  missingKeywords: z
    .array(z.object({ keyword: z.string(), importance: level, reason: text }))
    .max(200),

  skills: z.object({
    matched: z.array(z.string()).max(200),
    missing: z.array(z.string()).max(200),
    additional: z.array(z.string()).max(200),
  }),

  comparison: z
    .array(
      z.object({
        skill: z.string(),
        category: z.string(),
        resume: z.enum(["found", "related", "not-found"]),
        evidence: z.string().max(200),
        job: z.enum(["required", "preferred", "mentioned"]),
        status: z.enum(["matched", "partial", "missing"]),
      }),
    )
    .max(200),

  sections: z
    .array(
      z.object({
        name: z.string(),
        found: z.boolean(),
        optional: z.boolean(),
        score,
        strengths: z.array(text),
        issues: z.array(text),
        suggestions: z.array(text),
      }),
    )
    .max(12),

  issues: z
    .array(
      z.object({
        severity: level,
        title: z.string().max(200),
        description: text,
        suggestion: text,
      }),
    )
    .max(40),

  suggestions: z.array(text).max(20),

  rewriteSuggestions: z
    .array(
      z.object({
        section: z.string(),
        original: text,
        improved: text,
        explanation: text,
      }),
    )
    .max(12),

  experience: z.object({
    resumeYears: z.number().nonnegative().nullable(),
    requiredYears: z.number().nonnegative().nullable(),
  }),

  education: z.object({
    resumeLevel: z.string().nullable(),
    requiredLevel: z.string().nullable(),
  }),
});
