import { countWords } from "@/lib/parsing/normalize";

export type SectionKey =
  | "header"
  | "contact"
  | "summary"
  | "skills"
  | "experience"
  | "projects"
  | "education"
  | "certifications"
  | "other";

export interface ResumeSection {
  key: SectionKey;
  heading: string;
  lines: string[];
}

export interface ContactInfo {
  email: string | null;
  phone: string | null;
  linkedin: boolean;
  github: boolean;
  portfolio: boolean;
  location: boolean;
}

export interface ParsedResume {
  text: string;
  lines: string[];
  sections: ResumeSection[];
  sectionText: Partial<Record<SectionKey, string>>;
  headings: string[];
  contact: ContactInfo;
  /** Achievement statements (bullets, or long lines when bullets aren't used) from experience/projects. */
  statements: { text: string; section: SectionKey; isBullet: boolean }[];
  wordCount: number;
  headline: string | null;
}

const HEADINGS: Record<Exclude<SectionKey, "header">, string[]> = {
  contact: ["contact", "contact information", "contact details", "contact info", "personal information", "personal details"],
  summary: [
    "summary", "professional summary", "profile", "professional profile", "objective", "career objective",
    "about me", "about", "career summary", "executive summary", "overview", "personal statement",
    "summary of qualifications", "professional overview", "profile summary", "career profile",
  ],
  skills: [
    "skills", "technical skills", "core competencies", "competencies", "key skills", "skills and abilities",
    "technologies", "tech stack", "technical stack", "areas of expertise", "expertise", "skills and tools",
    "technical proficiencies", "core skills", "skill set", "skillset", "tools and technologies",
    "technical expertise", "professional skills", "relevant skills", "skills summary", "technical competencies",
  ],
  experience: [
    "experience", "work experience", "professional experience", "employment history", "work history",
    "employment", "career history", "relevant experience", "internships", "internship", "internship experience",
    "professional background", "experience and internships", "industry experience", "employment experience",
  ],
  projects: [
    "projects", "personal projects", "academic projects", "key projects", "selected projects", "side projects",
    "project experience", "portfolio", "notable projects", "technical projects", "project work", "open source",
  ],
  education: [
    "education", "academic background", "educational background", "academics", "education and training",
    "academic qualifications", "educational qualifications", "education details", "academic history",
  ],
  certifications: [
    "certifications", "certification", "certificates", "licenses", "licenses and certifications",
    "certifications and licenses", "professional certifications", "courses", "training",
    "certifications and training", "courses and certifications", "relevant coursework", "coursework",
  ],
  other: [
    "awards", "honors", "honors and awards", "awards and honors", "achievements", "accomplishments",
    "publications", "volunteer", "volunteering", "volunteer experience", "languages", "interests", "hobbies",
    "references", "activities", "leadership", "extracurricular activities", "extracurriculars",
    "leadership and activities", "additional information", "hobbies and interests", "affiliations",
  ],
};

const HEADING_LOOKUP = new Map<string, SectionKey>();
for (const [key, names] of Object.entries(HEADINGS) as [SectionKey, string[]][]) {
  for (const name of names) HEADING_LOOKUP.set(name, key);
}

const FUZZY_HEADINGS: [RegExp, SectionKey][] = [
  [/\b(experience|employment|work history)\b/, "experience"],
  [/\bprojects\b/, "projects"],
  [/\b(education|academics?)\b/, "education"],
  [/\b(certifications?|certificates|licenses)\b/, "certifications"],
  [/\b(skills|competencies|technologies)\b/, "skills"],
  [/\b(summary|profile|objective)\b/, "summary"],
  [/\b(awards|honors|achievements|publications|volunteer\w*|interests|languages|references|activities)\b/, "other"],
];

/** Sub-labels commonly used inside a skills block ("Languages: ..."), which must not start a new section. */
const INLINE_SKILL_LABELS = new Set(["languages", "tools", "technologies", "frameworks", "databases", "platforms", "tech stack"]);

export function normalizeHeading(line: string): string {
  return line
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectHeading(line: string, index: number): SectionKey | null {
  const trimmed = line.replace(/^•\s*/, "").trim();
  if (trimmed.length === 0 || trimmed.length > 48 || /\d/.test(trimmed)) return null;
  const normalized = normalizeHeading(trimmed);
  if (!normalized) return null;
  const exact = HEADING_LOOKUP.get(normalized);
  if (exact) return exact;

  if (index < 3) return null;
  const words = normalized.split(" ");
  const letters = trimmed.replace(/[^A-Za-z]/g, "");
  const isUpper = letters.length > 2 && letters === letters.toUpperCase();
  if (words.length > 5 || /[.,;]$/.test(trimmed) || !(isUpper || trimmed.endsWith(":"))) return null;
  for (const [pattern, key] of FUZZY_HEADINGS) if (pattern.test(normalized)) return key;
  return null;
}

/** "Skills: React, Node" style lines where the heading and content share a line. */
function detectInlineHeading(line: string, current: SectionKey): { key: SectionKey; rest: string } | null {
  const match = line.match(/^([A-Za-z &/]{3,32}):\s*(.+)$/);
  if (!match) return null;
  const label = normalizeHeading(match[1]);
  if (INLINE_SKILL_LABELS.has(label)) return null;
  const key = HEADING_LOOKUP.get(label);
  if (!key || key === current || key === "other" || key === "contact") return null;
  return { key, rest: match[2].trim() };
}

const DATE_HINT = /\b(?:19|20)\d{2}\b|\bpresent\b/i;

/** Re-joins bullet text that was wrapped across multiple lines by the PDF layout. */
function mergeWrappedLines(lines: string[]): string[] {
  const merged: string[] = [];
  for (const line of lines) {
    const previous = merged[merged.length - 1];
    const continuesBullet =
      previous !== undefined &&
      previous.startsWith("• ") &&
      !line.startsWith("• ") &&
      line.length > 0 &&
      !DATE_HINT.test(line) &&
      detectHeading(line, 99) === null &&
      (/^[a-z0-9(&,]/.test(line) || /(?:,|\band|&|-|\bto|\bof|\bthe|\bfor|\bwith)$/i.test(previous));
    if (continuesBullet) merged[merged.length - 1] = `${previous} ${line}`;
    else merged.push(line);
  }
  return merged;
}

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const PHONE = /(?:\+?\d{1,3}[\s.-]?)?(?:\(\d{2,5}\)[\s.-]?)?\d{2,5}[\s.-]?\d{3,5}(?:[\s.-]?\d{2,5})?/g;
const LINKEDIN = /linkedin\.com\/(?:in|pub)\/|\blinkedin\b/i;
const GITHUB = /github\.com\/[\w-]+|\bgithub\b/i;
const URL = /(?<![@\w.])(?:https?:\/\/)?(?:www\.)?[a-z0-9-]{2,}\.(?:dev|io|me|com|net|org|app|site|xyz|tech|design|co|page|in|ai)(?:\/[^\s|,]*)?/gi;
const LOCATION = /\b[A-Z][a-zA-Z.]+(?:\s[A-Z][a-zA-Z.]+)?,\s*(?:[A-Z]{2}\b|[A-Z][a-z]{2,})|\bremote\b/;

function detectContact(headerText: string, fullText: string, links: string[]): ContactInfo {
  const email = fullText.match(EMAIL)?.[0] ?? null;
  const phoneCandidates = fullText.match(PHONE) ?? [];
  const phone =
    phoneCandidates.find((candidate) => {
      const digits = candidate.replace(/\D/g, "").length;
      return digits >= 10 && digits <= 15 && !/^(?:19|20)\d{2}\s*[-–]\s*(?:19|20)\d{2}$/.test(candidate.trim());
    }) ?? null;

  const linkText = links.join(" ");
  const zone = `${headerText}\n${linkText}`;
  const portfolio = (zone.match(URL) ?? []).some(
    (url) => !/linkedin|github|gmail|yahoo|outlook|hotmail|icloud/i.test(url) && !(email ?? "").includes(url.replace(/^https?:\/\//, "")),
  );

  return {
    email,
    phone: phone?.trim() ?? null,
    linkedin: LINKEDIN.test(zone) || /linkedin\.com\//i.test(fullText),
    github: GITHUB.test(zone) || /github\.com\//i.test(fullText),
    portfolio: portfolio || /\bportfolio\b/i.test(headerText),
    location: LOCATION.test(headerText),
  };
}

const ROLE_WORDS =
  /\b(engineer|developer|designer|manager|analyst|scientist|consultant|architect|specialist|administrator|coordinator|accountant|marketer|writer|lead|intern|associate|director|officer|technician|representative|strategist|researcher|programmer|nurse|teacher|recruiter|executive|assistant)\b/i;

export function parseResume(text: string, links: string[] = []): ParsedResume {
  const rawLines = text.split("\n").map((line) => line.trim());
  const lines = mergeWrappedLines(rawLines.filter((line) => line.length > 0));

  const sections: ResumeSection[] = [{ key: "header", heading: "", lines: [] }];
  const headings: string[] = [];

  lines.forEach((line, index) => {
    const current = sections[sections.length - 1];
    const heading = detectHeading(line, index);
    if (heading) {
      headings.push(line.replace(/[:•]/g, "").trim());
      sections.push({ key: heading, heading: line, lines: [] });
      return;
    }
    const inline = detectInlineHeading(line, current.key);
    if (inline) {
      headings.push(line.split(":")[0].trim());
      sections.push({ key: inline.key, heading: line.split(":")[0], lines: [inline.rest] });
      return;
    }
    current.lines.push(line);
  });

  const sectionText: Partial<Record<SectionKey, string>> = {};
  for (const section of sections) {
    const body = section.lines.join("\n");
    sectionText[section.key] = sectionText[section.key] ? `${sectionText[section.key]}\n${body}` : body;
  }

  const headerLines = sections[0].lines.slice(0, 12);
  const headerText = [headerLines.join("\n"), sectionText.contact ?? ""].join("\n");
  const contact = detectContact(headerText, text, links);

  const statements: ParsedResume["statements"] = [];
  for (const section of sections) {
    if (section.key !== "experience" && section.key !== "projects") continue;
    const bullets = section.lines.filter((line) => line.startsWith("• "));
    const useBullets = bullets.length >= 2;
    for (const line of section.lines) {
      if (useBullets) {
        if (line.startsWith("• ")) statements.push({ text: line.slice(2).trim(), section: section.key, isBullet: true });
      } else if (countWords(line) >= 8 && !DATE_HINT.test(line)) {
        statements.push({ text: line.replace(/^•\s*/, ""), section: section.key, isBullet: false });
      }
    }
  }

  const headline =
    sections[0].lines
      .slice(1, 4)
      .find((line) => line.length <= 60 && ROLE_WORDS.test(line) && !EMAIL.test(line) && !/\d{3}/.test(line)) ?? null;

  return {
    text,
    lines,
    sections,
    sectionText,
    headings,
    contact,
    statements,
    wordCount: countWords(text),
    headline: headline ? headline.replace(/[|•].*$/, "").trim() : null,
  };
}

export function hasSection(resume: ParsedResume, key: SectionKey): boolean {
  return resume.sections.some((section) => section.key === key && section.lines.join("").trim().length > 0);
}
