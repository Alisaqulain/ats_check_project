import { detectFields, detectLevels, type EducationLevel } from "./education";

export type JobSegment = "required" | "preferred" | "responsibilities" | "other" | "general";

export interface JobLine {
  text: string;
  segment: JobSegment;
  requiredMarker: boolean;
  preferredMarker: boolean;
}

export interface ParsedJob {
  text: string;
  title: string | null;
  lines: JobLine[];
  structured: boolean;
  requiredYears: number | null;
  education: {
    level: EducationLevel | null;
    fields: string[];
    equivalentAllowed: boolean;
    preferredOnly: boolean;
  };
}

const SEGMENT_HEADINGS: Record<Exclude<JobSegment, "general">, string[]> = {
  preferred: [
    "nice to have", "nice to haves", "preferred qualifications", "preferred skills", "preferred", "bonus points",
    "bonus", "pluses", "desired skills", "desired qualifications", "good to have", "extra credit",
    "it would be great if you have", "bonus if you have", "additional qualifications", "preferred experience",
    "nice to have skills", "bonus skills",
  ],
  responsibilities: [
    "responsibilities", "key responsibilities", "job responsibilities", "your responsibilities", "what you'll do",
    "what you will do", "what you'll be doing", "what you will be doing", "the role", "your role", "about the role",
    "role overview", "duties", "job duties", "day to day", "in this role", "in this role you will", "your impact",
    "key accountabilities", "the opportunity", "role description", "job description", "overview",
    "responsibilities include",
  ],
  required: [
    "requirements", "job requirements", "key requirements", "minimum requirements", "qualifications",
    "minimum qualifications", "basic qualifications", "required qualifications", "required skills", "skills",
    "key skills", "skills and experience", "experience", "required experience", "what you'll need", "what you need",
    "what we're looking for", "what we are looking for", "must have", "must haves", "you have", "who you are",
    "about you", "your profile", "what you bring", "you should have", "competencies", "ideal candidate",
    "the ideal candidate", "your skills", "technical skills", "requirements and qualifications",
    "qualifications and experience", "you will have", "what you'll bring", "who you'll be", "must have skills",
  ],
  other: [
    "about us", "about the company", "about the team", "who we are", "benefits", "perks", "perks and benefits",
    "what we offer", "compensation", "salary", "equal opportunity", "equal opportunity employer", "why join us",
    "why join", "our culture", "our mission", "location", "how to apply", "company overview", "our values",
    "why you'll love working here", "compensation and benefits",
  ],
};

const HEADING_TO_SEGMENT = new Map<string, JobSegment>();
for (const [segment, names] of Object.entries(SEGMENT_HEADINGS) as [JobSegment, string[]][]) {
  for (const name of names) HEADING_TO_SEGMENT.set(name, segment);
}

function normalizeJobHeading(line: string): string {
  return line
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/&/g, " and ")
    .replace(/-/g, " ")
    .replace(/[^a-z' ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectSegmentHeading(line: string): JobSegment | null {
  if (!isHeadingLike(line)) return null;
  const normalized = normalizeJobHeading(line);
  const exact = HEADING_TO_SEGMENT.get(normalized);
  if (exact) return exact;
  if (!line.endsWith(":")) return null;
  // "What you'll need to succeed:" — a colon-terminated line that starts with a known heading phrase.
  for (const [name, segment] of HEADING_TO_SEGMENT) {
    if (name.length > 5 && normalized.startsWith(name)) return segment;
  }
  return null;
}

const PREFERRED_MARKER = /\b(preferred|nice to have|a plus|is a plus|bonus|ideally|desirable|familiarity with|exposure to|good to have)\b/i;
const REQUIRED_MARKER = /\b(required|requires|must|minimum|at least|strong|proficien\w*|expert\w*|solid|deep|extensive|essential|mandatory|hands-on)\b/i;

const ROLE_NOUNS =
  "engineer|developer|designer|manager|analyst|scientist|consultant|architect|specialist|administrator|coordinator|accountant|marketer|writer|lead|intern|associate|director|officer|technician|representative|strategist|researcher|programmer|nurse|teacher|recruiter|executive|assistant|product owner|scrum master|devops|sre";

const ROLE_REGEX = new RegExp(`\\b(${ROLE_NOUNS})s?\\b`, "i");

function isHeadingLike(line: string): boolean {
  const words = line.split(/\s+/).length;
  return line.length <= 70 && words <= 9 && !/[.!?]$/.test(line) && !line.startsWith("• ");
}

function cleanTitle(value: string): string | null {
  const title = value
    .replace(/^(job title|position|role|title|job)\s*[:\-–]\s*/i, "")
    .replace(/\s*[-–|(].*$/, "")
    .replace(/[.:,]+$/, "")
    .trim();
  if (title.length < 3 || title.length > 80 || title.split(/\s+/).length > 8) return null;
  return title.replace(/\b([a-z])/g, (char) => char.toUpperCase());
}

function detectTitle(lines: string[]): string | null {
  for (const line of lines.slice(0, 15)) {
    const labelled = line.match(/^(?:job title|position|role|title)\s*[:\-–]\s*(.+)$/i);
    if (labelled) return cleanTitle(labelled[1]);
  }

  const hiring = lines
    .slice(0, 12)
    .join(" ")
    .match(
      new RegExp(
        `(?:hiring|looking for|seeking|searching for|join us as|recruiting)\\s+(?:an?\\s+|our\\s+(?:next\\s+)?)?((?:[A-Za-z/+.#-]+\\s+){0,4}(?:${ROLE_NOUNS}))\\b`,
        "i",
      ),
    );
  if (hiring) return cleanTitle(hiring[1]);

  const first = lines.slice(0, 4).find((line) => isHeadingLike(line) && ROLE_REGEX.test(line));
  return first ? cleanTitle(first) : null;
}

function detectRequiredYears(lines: JobLine[]): number | null {
  const pattern =
    /(?:minimum\s+(?:of\s+)?|at least\s+)?(\d{1,2})\s*\+?\s*(?:(?:-|–|to)\s*\d{1,2}\s*)?\+?\s*(?:years?|yrs?)(?:\s+of)?[^.\n]{0,60}?\b(?:experience|exp\b|background|working)/i;
  const required: number[] = [];
  const preferred: number[] = [];
  for (const line of lines) {
    const match = line.text.match(pattern);
    if (!match) continue;
    const years = Number(match[1]);
    if (years <= 0 || years > 20) continue;
    if (line.segment === "preferred" || line.preferredMarker) preferred.push(years);
    else required.push(years);
  }
  const pool = required.length > 0 ? required : preferred;
  return pool.length > 0 ? Math.max(...pool) : null;
}

export function parseJobDescription(text: string): ParsedJob {
  const rawLines = text
    .split("\n")
    .map((line) => line.replace(/^\s*(?:[•●▪■◦*\-–]|\d+[.)])\s+/, "• ").replace(/\s+/g, " ").trim())
    .filter(Boolean);

  let segment: JobSegment = "general";
  let structured = false;
  const lines: JobLine[] = [];

  for (const line of rawLines) {
    const heading = detectSegmentHeading(line);
    if (heading) {
      segment = heading;
      structured = true;
      continue;
    }
    lines.push({
      text: line,
      segment,
      preferredMarker: PREFERRED_MARKER.test(line),
      requiredMarker: REQUIRED_MARKER.test(line),
    });
  }

  const educationLines = lines.filter((line) => detectLevels(line.text).length > 0);
  const levels = educationLines.flatMap((line) => detectLevels(line.text));
  const minimumLevel = levels.length > 0 ? levels.reduce((a, b) => (b.level < a.level ? b : a)) : null;
  const educationText = educationLines.map((line) => line.text).join("\n");

  return {
    text,
    title: detectTitle(rawLines),
    lines,
    structured,
    requiredYears: detectRequiredYears(lines),
    education: {
      level: minimumLevel,
      fields: detectFields(educationText),
      equivalentAllowed: /equivalent|in lieu|or related experience|or comparable experience/i.test(educationText),
      preferredOnly:
        educationLines.length > 0 &&
        educationLines.every((line) => line.segment === "preferred" || (line.preferredMarker && !/required/i.test(line.text))),
    },
  };
}
