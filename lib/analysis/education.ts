export interface EducationLevel {
  level: number;
  label: string;
}

const LEVELS: { level: number; label: string; pattern: RegExp }[] = [
  {
    level: 5,
    label: "Doctorate",
    pattern: /(?<![A-Za-z])(?:ph\.?\s?d\.?|doctorate|doctoral degree|doctor of philosophy)(?![A-Za-z])/i,
  },
  {
    level: 4,
    label: "Master's",
    pattern:
      /(?<![A-Za-z])(?:master(?:'?s)?\s+(?:degree|of|in)|masters|master's|m\.s\.|m\.sc\.?|msc|m\.eng|meng|m\.tech|mtech|mba|m\.b\.a\.|m\.a\.|ms in|ma in|mca|m\.com)(?![A-Za-z])/i,
  },
  {
    level: 3,
    label: "Bachelor's",
    pattern:
      /(?<![A-Za-z])(?:bachelor(?:'?s)?|b\.s\.|b\.sc\.?|bsc|b\.a\.|ba in|bs in|b\.tech|btech|b\.e\.|b\.eng|beng|bba|b\.b\.a\.|bca|b\.com|undergraduate degree|four[- ]year degree|4[- ]year degree)(?![A-Za-z])/i,
  },
  {
    level: 2,
    label: "Associate",
    pattern: /(?<![A-Za-z])(?:associate(?:'?s)? degree|associate of (?:arts|science|applied science)|a\.a\.s?\.)(?![A-Za-z])/i,
  },
  {
    level: 1,
    label: "High school",
    pattern: /(?<![A-Za-z])(?:high school|secondary school|ged|higher secondary)(?![A-Za-z])/i,
  },
];

export const FIELDS_OF_STUDY = [
  "computer science", "computer engineering", "software engineering", "information technology",
  "information systems", "electrical engineering", "electronics", "mechanical engineering", "engineering",
  "mathematics", "statistics", "data science", "physics", "economics", "business administration", "business",
  "finance", "accounting", "marketing", "communications", "design", "graphic design", "psychology",
  "human resources", "nursing", "biology", "chemistry", "operations research",
];

export function detectLevels(text: string): EducationLevel[] {
  return LEVELS.filter((entry) => entry.pattern.test(text)).map(({ level, label }) => ({ level, label }));
}

export function highestLevel(text: string): EducationLevel | null {
  const levels = detectLevels(text);
  return levels.length > 0 ? levels.reduce((a, b) => (b.level > a.level ? b : a)) : null;
}

export function detectFields(text: string): string[] {
  const lower = text.toLowerCase();
  const found = FIELDS_OF_STUDY.filter((field) => new RegExp(`(?<![a-z])${field}(?![a-z])`).test(lower));
  // Drop generic fields already covered by a more specific match ("engineering" vs "software engineering").
  return found.filter((field) => !found.some((other) => other !== field && other.includes(field)));
}
