import type { ScoreBand, ScoreKey } from "@/types/analysis";

export const SCORE_WEIGHTS: { key: ScoreKey; label: string; weight: number; description: string }[] = [
  {
    key: "keywordMatch",
    label: "Keyword relevance",
    weight: 0.25,
    description: "Share of job-description keywords found in the resume, weighted by importance (high ×3, medium ×2, low ×1).",
  },
  {
    key: "skillsMatch",
    label: "Skills match",
    weight: 0.25,
    description: "Hard skills from the job found in the resume. Full credit when a skill appears in experience or projects, 85% when it's only listed, and partial credit for closely related skills.",
  },
  {
    key: "experienceMatch",
    label: "Experience relevance",
    weight: 0.2,
    description: "Years of experience calculated from your listed dates vs. what the job asks for, plus how many required skills appear in your work history and how closely your titles match the role.",
  },
  {
    key: "educationMatch",
    label: "Education",
    weight: 0.1,
    description: "Your highest detected degree and field vs. the job's stated education requirement.",
  },
  {
    key: "structureScore",
    label: "Resume structure",
    weight: 0.1,
    description: "Presence of standard sections an ATS expects: contact details, summary, skills, experience, and education.",
  },
  {
    key: "formatting",
    label: "Formatting & readability",
    weight: 0.1,
    description: "Average of the Formatting score (bullets, length, action verbs, measurable results) and the ATS Compatibility score (how cleanly the text, headings, dates and contact details can be parsed).",
  },
];

export function scoreBand(score: number): ScoreBand {
  if (score >= 75) return "strong";
  if (score >= 55) return "moderate";
  return "needs-improvement";
}

export const SCORE_BAND_LABEL: Record<ScoreBand, string> = {
  strong: "Strong",
  moderate: "Moderate",
  "needs-improvement": "Needs Improvement",
};
