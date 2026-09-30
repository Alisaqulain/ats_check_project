import type { RewriteSuggestion } from "@/types/analysis";
import { countWords } from "@/lib/parsing/normalize";
import { claimedYears } from "./dates";
import type { KeywordMatch } from "./keywords";
import { detectSkills, escapeRegex, getCompiledSkill, skillInText } from "./matcher";
import type { ParsedResume } from "./resume-parser";
import { SKILL_BY_NAME, type SkillCategory } from "./skills-taxonomy";
import { CLICHES, analyzeStatement, type StatementAnalysis } from "./writing";

/** base verb -> [past tense, gerund] */
const VERBS: Record<string, [string, string]> = {
  build: ["Built", "building"], develop: ["Developed", "developing"], create: ["Created", "creating"],
  design: ["Designed", "designing"], implement: ["Implemented", "implementing"], manage: ["Managed", "managing"],
  lead: ["Led", "leading"], maintain: ["Maintained", "maintaining"], support: ["Supported", "supporting"],
  handle: ["Managed", "handling"], coordinate: ["Coordinated", "coordinating"], write: ["Wrote", "writing"],
  test: ["Tested", "testing"], deploy: ["Deployed", "deploying"], improve: ["Improved", "improving"],
  optimize: ["Optimized", "optimizing"], analyze: ["Analyzed", "analyzing"], research: ["Researched", "researching"],
  plan: ["Planned", "planning"], organize: ["Organized", "organizing"], train: ["Trained", "training"],
  mentor: ["Mentored", "mentoring"], review: ["Reviewed", "reviewing"], monitor: ["Monitored", "monitoring"],
  migrate: ["Migrated", "migrating"], integrate: ["Integrated", "integrating"], automate: ["Automated", "automating"],
  document: ["Documented", "documenting"], resolve: ["Resolved", "resolving"], troubleshoot: ["Troubleshot", "troubleshooting"],
  configure: ["Configured", "configuring"], launch: ["Launched", "launching"], deliver: ["Delivered", "delivering"],
  prepare: ["Prepared", "preparing"], conduct: ["Conducted", "conducting"], perform: ["Performed", "performing"],
  oversee: ["Oversaw", "overseeing"], run: ["Ran", "running"], update: ["Updated", "updating"],
  refactor: ["Refactored", "refactoring"], collaborate: ["Collaborated", "collaborating"],
  communicate: ["Communicated", "communicating"], present: ["Presented", "presenting"],
  negotiate: ["Negotiated", "negotiating"], process: ["Processed", "processing"], track: ["Tracked", "tracking"],
  report: ["Reported", "reporting"], own: ["Owned", "owning"], drive: ["Drove", "driving"],
  establish: ["Established", "establishing"], streamline: ["Streamlined", "streamlining"], reduce: ["Reduced", "reducing"],
  increase: ["Increased", "increasing"], generate: ["Generated", "generating"], execute: ["Executed", "executing"],
  evaluate: ["Evaluated", "evaluating"], identify: ["Identified", "identifying"], assess: ["Assessed", "assessing"],
  draft: ["Drafted", "drafting"], edit: ["Edited", "editing"], schedule: ["Scheduled", "scheduling"],
  supervise: ["Supervised", "supervising"], recruit: ["Recruited", "recruiting"], onboard: ["Onboarded", "onboarding"],
  teach: ["Taught", "teaching"], sell: ["Sold", "selling"], fix: ["Fixed", "fixing"], debug: ["Debugged", "debugging"],
  upgrade: ["Upgraded", "upgrading"], architect: ["Architected", "architecting"], engineer: ["Engineered", "engineering"],
  prototype: ["Prototyped", "prototyping"], ship: ["Shipped", "shipping"], scale: ["Scaled", "scaling"],
  secure: ["Secured", "securing"], audit: ["Audited", "auditing"], forecast: ["Forecasted", "forecasting"],
  answer: ["Answered", "answering"], respond: ["Responded", "responding"], set: ["Set", "setting"],
  program: ["Programmed", "programming"], code: ["Coded", "coding"],
  facilitate: ["Facilitated", "facilitating"], serve: ["Served", "serving"], assist: ["Assisted", "assisting"],
  publish: ["Published", "publishing"], produce: ["Produced", "producing"], market: ["Marketed", "marketing"],
  model: ["Modeled", "modeling"], compile: ["Compiled", "compiling"], coach: ["Coached", "coaching"],
};

const PAST_BY_GERUND = new Map(Object.values(VERBS).map(([past, gerund]) => [gerund, past]));
const GERUND_BY_BASE = new Map(Object.entries(VERBS).map(([base, [, gerund]]) => [base, gerund]));

const TECH_OBJECT =
  /\b(app|apps|application|applications|website|web ?site|web app|api|apis|feature|features|service|services|platform|system|systems|tool|tools|dashboard|dashboards|pipeline|pipelines|module|modules|component|components|backend|frontend|front-end|back-end|integration|integrations|script|scripts|database|library|sdk|bot|extension|portal|microservice|microservices|ui|interface)\b/i;

const FILLERS: [RegExp, string][] = [
  [/\bsuccessfully\s+/gi, ""],
  [/\b(?:very|really|basically|actually)\s+/gi, ""],
  [/\s*,?\s*etc\.?(?=\s|$)/gi, ""],
  [/\bin order to\b/gi, "to"],
  [/\butiliz(?:ed|ing)\b/gi, "used"],
  [/\butilize\b/gi, "use"],
  [/\ba lot of\b/gi, "many"],
];

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function tidy(value: string): string {
  return value.replace(/\s{2,}/g, " ").replace(/\s+([,.;])/g, "$1").trim();
}

interface RewriteOutcome {
  text: string;
  changes: string[];
}

function rewriteOpener(text: string): RewriteOutcome | null {
  const withGerund = (rest: string, label: string): RewriteOutcome | null => {
    const match = rest.match(/^(\w+ing)\b(.*)$/i);
    const past = match ? PAST_BY_GERUND.get(match[1].toLowerCase()) : undefined;
    if (!match || !past) return null;
    // Keep coordinated verbs in the same tense: "reviewing X and mentoring Y" -> "Reviewed X and mentored Y".
    const tail = match[2].replace(/(\s(?:and|or)\s|,\s)(\w+ing)\b/g, (full, joiner: string, gerund: string) => {
      const verb = PAST_BY_GERUND.get(gerund.toLowerCase());
      return verb ? `${joiner}${verb.toLowerCase()}` : full;
    });
    return { text: `${past}${tail}`, changes: [`Replaced “${label}” with the action verb “${past}”.`] };
  };

  let m = text.match(/^(?:was |were )?responsible for\s+(?:the\s+)?(.*)$/i);
  if (m) {
    return (
      withGerund(m[1], "Responsible for") ?? {
        text: `Owned ${m[1]}`,
        changes: ["Replaced “Responsible for” with the direct verb “Owned”."],
      }
    );
  }

  m = text.match(/^(?:duties|responsibilities) (?:included|include)\s+(.*)$/i);
  if (m) return withGerund(m[1], "Duties included");

  m = text.match(/^tasked with\s+(.*)$/i);
  if (m) return withGerund(m[1], "Tasked with");

  m = text.match(/^in charge of\s+(.*)$/i);
  if (m) {
    return withGerund(m[1], "In charge of") ?? { text: `Led ${m[1]}`, changes: ["Replaced “In charge of” with “Led”."] };
  }

  m = text.match(/^worked on\s+(.*)$/i);
  if (m) {
    const gerund = withGerund(m[1], "Worked on");
    if (gerund) return gerund;
    const technical = TECH_OBJECT.test(m[1]) || detectSkills(m[1]).size > 0;
    const verb = technical ? "Developed" : "Contributed to";
    return {
      text: `${verb} ${m[1]}`,
      changes: [
        `Replaced the vague “Worked on” with “${verb}”.${technical ? " Keep “Developed” only if you built it; otherwise use “Maintained” or “Contributed to”." : ""}`,
      ],
    };
  }

  m = text.match(/^(?:helped|assisted)\s+(?:to\s+|in\s+)?(\w+)\b(.*)$/i);
  if (m) {
    const lead = capitalize(text.split(/\s+/)[0].toLowerCase());
    const word = m[1].toLowerCase();
    const gerund = GERUND_BY_BASE.get(word) ?? (PAST_BY_GERUND.has(word) ? word : undefined);
    if (gerund) {
      return { text: `Contributed to ${gerund}${m[2]}`, changes: [`Replaced “${lead}” with the more active “Contributed to”.`] };
    }
    if (word === "with") {
      return { text: `Supported${m[2]}`, changes: [`Replaced “${lead} with” with “Supported”.`] };
    }
    return { text: `Supported ${m[1]}${m[2]}`, changes: [`Replaced “${lead}” with “Supported”.`] };
  }

  m = text.match(/^(?:was |were )?(?:involved|participated) in\s+(.*)$/i);
  if (m) return { text: `Contributed to ${m[1]}`, changes: ["Replaced a passive opener with “Contributed to”."] };

  m = text.match(/^(?:was |were )?(?:a )?part of\s+(.*)$/i);
  if (m) return { text: `Contributed as part of ${m[1]}`, changes: ["Reframed “Part of” to emphasize your contribution."] };

  m = text.match(/^handled\s+(.*)$/i);
  if (m) return { text: `Managed ${m[1]}`, changes: ["Replaced “Handled” with “Managed”."] };

  m = text.match(/^I\s+(\w+)(.*)$/);
  if (m) return { text: `${capitalize(m[1])}${m[2]}`, changes: ["Removed the first-person “I”."] };

  return null;
}

function splitLongStatement(text: string): string[] | null {
  const parts = text.split(/;\s+|,\s+and\s+(?=[a-z]+ed\b)|\.\s+(?=[A-Z])/);
  if (parts.length < 2) return null;
  const cleaned = parts.map((part) => capitalize(tidy(part.replace(/\.$/, ""))));
  return cleaned.every((part) => countWords(part) >= 5) ? cleaned.slice(0, 3) : null;
}

export function rewriteStatement(original: string, analysis: StatementAnalysis): RewriteOutcome | null {
  const changes: string[] = [];
  let text = original.trim();

  const opener = rewriteOpener(text);
  if (opener) {
    text = opener.text;
    changes.push(...opener.changes);
  }

  let filtered = text;
  for (const [pattern, replacement] of FILLERS) filtered = filtered.replace(pattern, replacement);
  if (/[.!?]$/.test(text) && !/[.!?]$/.test(filtered)) filtered = `${filtered.trimEnd()}.`;
  if (filtered !== text) {
    text = filtered;
    changes.push("Removed filler words so the statement reads tighter.");
  }

  text = capitalize(tidy(text));

  let improved = text;
  if (analysis.words > 38) {
    const split = splitLongStatement(text);
    if (split) {
      improved = split.map((part) => `• ${part}`).join("\n");
      changes.push("Split an overly long bullet into shorter, scannable bullets.");
    }
  }

  if (changes.length === 0) return null;
  if (!analysis.quantified) {
    changes.push("If you have a real, verifiable result for this work (time saved, users served, error rate, revenue), add it. Don't estimate numbers you can't support.");
  }
  return { text: improved, changes };
}

const CATEGORY_LABELS: Partial<Record<SkillCategory, string>> = {
  Languages: "Languages",
  Frontend: "Frontend",
  Backend: "Backend",
  Databases: "Databases",
  "Cloud & DevOps": "Cloud & DevOps",
  "Data & AI": "Data & AI",
  Mobile: "Mobile",
  "Testing & QA": "Testing",
  Tools: "Tools",
  Design: "Design",
  Security: "Security",
  "Engineering Practices": "Practices",
  Business: "Business",
  Marketing: "Marketing",
  Finance: "Finance",
  Healthcare: "Healthcare",
  Methodologies: "Methodologies",
  Certifications: "Certifications",
};

function rewriteSkillsSection(resume: ParsedResume, matches: KeywordMatch[]): RewriteSuggestion | null {
  const skillsText = resume.sectionText.skills;
  if (!skillsText) return null;
  const listed = [...detectSkills(skillsText).keys()].filter(
    (name) => SKILL_BY_NAME.get(name)?.category !== "Soft Skills",
  );
  if (listed.length < 4) return null;

  const priority = new Map<string, number>();
  const rank = { high: 0, medium: 1, low: 2 } as const;
  for (const match of matches) if (match.status === "matched") priority.set(match.name, rank[match.importance]);

  const groups = new Map<string, string[]>();
  for (const name of listed) {
    const category = SKILL_BY_NAME.get(name)?.category;
    const label = (category && CATEGORY_LABELS[category]) ?? "Other";
    groups.set(label, [...(groups.get(label) ?? []), name]);
  }

  const lines = [...groups.entries()]
    .map(([label, names]) => {
      const sorted = [...names].sort((a, b) => (priority.get(a) ?? 9) - (priority.get(b) ?? 9));
      const best = Math.min(...sorted.map((name) => priority.get(name) ?? 9));
      return { label, sorted, best };
    })
    .sort((a, b) => a.best - b.best || b.sorted.length - a.sorted.length)
    .map(({ label, sorted }) => `${label}: ${sorted.join(", ")}`);

  const alreadyGrouped = skillsText.split("\n").filter((line) => /^[A-Za-z &/]{3,30}:/.test(line)).length >= 2;
  const relevantFirst = listed.slice(0, 3).some((name) => priority.has(name));
  if (alreadyGrouped && relevantFirst) return null;

  const original = skillsText.split("\n").slice(0, 8).join("\n");
  return {
    section: "Skills",
    original: original.length > 600 ? `${original.slice(0, 600)}…` : original,
    improved: lines.join("\n"),
    explanation:
      "Grouped your existing skills by category and moved the ones this job asks for to the front of each group, so recruiters and ATS filters see them first. No new skills were added.",
  };
}

const PRONOUN_OPENERS: [RegExp, string][] = [
  [/^I am an?\s+/i, ""],
  [/^I am\s+/i, ""],
  [/^I have\s+/i, "Bringing "],
  [/^I\s+(\w+)/i, "$1"],
  [/^My\s+/i, ""],
];

function cleanSentence(sentence: string): string {
  let result = sentence.trim();
  for (const [pattern, replacement] of PRONOUN_OPENERS) {
    if (pattern.test(result)) {
      result = result.replace(pattern, replacement);
      break;
    }
  }
  return capitalize(tidy(result));
}

const ROLE_WORD =
  /\b(engineer|developer|designer|manager|analyst|scientist|consultant|architect|specialist|administrator|coordinator|accountant|marketer|writer|intern|associate|director|officer|technician|representative|strategist|researcher|programmer|nurse|teacher|recruiter|assistant)\b/i;

const OBJECTIVE_SENTENCE = /\b(looking for|seeking|goal|aspir\w*|want to|hope to|eager to|opportunity to|wish to)\b/i;

/** Most recent job title, taken from the first title-like line of the experience section. */
function recentJobTitle(resume: ParsedResume): string | null {
  const experience = resume.sections.find((section) => section.key === "experience");
  if (!experience) return null;
  for (const line of experience.lines.slice(0, 6)) {
    if (line.startsWith("• ")) continue;
    const segment = line
      .split(/\s[|–—-]\s|,|\s@\s|\bat\b/)
      .map((part) => part.trim())
      .find((part) => ROLE_WORD.test(part) && part.split(/\s+/).length <= 5 && !/\d/.test(part));
    if (segment) return segment.replace(/\b(senior|sr\.?|junior|jr\.?)\s+/i, "").trim();
  }
  return null;
}

function rewriteSummary(
  resume: ParsedResume,
  matches: KeywordMatch[],
  years: number | null,
  jobTitle: string | null,
): RewriteSuggestion | null {
  let summary = resume.sectionText.summary?.replace(/\s*\n\s*/g, " ").trim() ?? "";
  let untitled = false;
  if (!summary) {
    const paragraph = resume.sections[0].lines.find((line) => countWords(line) >= 20);
    if (paragraph) {
      summary = paragraph;
      untitled = true;
    }
  }

  const topSkills = matches
    .filter((match) => match.status === "matched" && match.kind === "skill")
    .slice(0, 4)
    .map((match) => match.name);

  let role = resume.headline ?? recentJobTitle(resume);
  if (!role && jobTitle) {
    const core = jobTitle.replace(/\b(senior|sr\.?|junior|jr\.?|lead|principal|staff|mid[- ]level|entry[- ]level|i{1,3}|iv)\b/gi, "").trim();
    if (core && new RegExp(`\\b${core.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(resume.text)) role = core;
  }
  const roleLabel = role ? role.replace(/\s+/g, " ") : "Professional";
  // Prefer the candidate's own stated experience over the date-derived estimate.
  const stated = claimedYears(summary);
  const shownYears = stated ?? years;
  const yearsLabel = shownYears && shownYears >= 1 ? ` with ${Math.floor(shownYears)}+ years of experience` : "";
  const skillsLabel =
    topSkills.length > 0
      ? `${yearsLabel ? "" : " with hands-on experience"} in ${topSkills.length > 1 ? `${topSkills.slice(0, -1).join(", ")} and ${topSkills[topSkills.length - 1]}` : topSkills[0]}`
      : "";
  const opener = `${roleLabel}${yearsLabel}${skillsLabel}.`;

  if (!summary) {
    if (topSkills.length === 0) return null;
    return {
      section: "Professional Summary (new)",
      original: "No professional summary was found in your resume.",
      improved: opener,
      explanation:
        "A short summary at the top helps recruiters and ATS filters quickly connect your background to the role. This draft only uses facts already in your resume: your stated role, the experience length from your listed dates, and skills you list that match the job. Extend it with one sentence about the kind of work you do best.",
    };
  }

  const sentences = summary
    .replace(/\n/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const lowerCliches = CLICHES.map((cliche) => cliche.toLowerCase());
  const hasPronouns = /(?<![A-Za-z])(?:I|my|me)(?![A-Za-z'])/.test(summary);
  const hasCliches = sentences.some((s) => lowerCliches.some((c) => s.toLowerCase().includes(c)));
  const missingSkills = topSkills.filter((skill) => {
    const compiled = getCompiledSkill(skill);
    return compiled ? !skillInText(compiled, summary) : !new RegExp(escapeRegex(skill), "i").test(summary);
  });

  if (!hasPronouns && !hasCliches && missingSkills.length < 2 && !untitled) return null;

  const terminate = (sentence: string) => (/[.!?]$/.test(sentence) ? sentence : `${sentence}.`);
  const joinSkills = (skills: string[]) =>
    skills.length > 1 ? `${skills.slice(0, -1).join(", ")} and ${skills[skills.length - 1]}` : skills[0];

  let improved: string;
  if (!hasPronouns && !hasCliches) {
    // The summary itself is fine; keep it and surface relevant skills it doesn't mention.
    improved = missingSkills.length > 0
      ? `${terminate(summary)} Core skills include ${joinSkills(missingSkills)}.`
      : terminate(summary);
  } else {
    const kept = sentences
      .filter((sentence) => !lowerCliches.some((cliche) => sentence.toLowerCase().includes(cliche)))
      .filter((sentence) => !OBJECTIVE_SENTENCE.test(sentence))
      // The generated opener already states role and experience length.
      .filter((sentence) => !/\b\d+\+?\s*(?:years?|yrs?)\b/i.test(sentence))
      .map(cleanSentence)
      .filter((sentence) => countWords(sentence) >= 4)
      .slice(0, 2);
    improved = [opener, ...kept].map(terminate).join(" ");
  }
  if (improved.trim().toLowerCase() === terminate(summary).toLowerCase() && !untitled) return null;

  const reasons: string[] = [];
  if (untitled) reasons.push("your summary has no heading, so add a “Professional Summary” heading above it");
  if (hasPronouns) reasons.push("removed first-person pronouns");
  if (hasCliches) reasons.push("dropped generic phrases that ATS filters and recruiters skip over");
  if (missingSkills.length >= 2) {
    reasons.push(
      hasPronouns || hasCliches
        ? `led with skills from your resume that this job asks for (${missingSkills.join(", ")})`
        : `kept your summary and added skills from elsewhere in your resume that this job asks for (${missingSkills.join(", ")})`,
    );
  }

  return {
    section: "Professional Summary",
    original: summary.length > 700 ? `${summary.slice(0, 700)}…` : summary,
    improved,
    explanation: `${capitalize(reasons.join("; "))}. Everything in this version comes from your resume. Nothing was invented.`,
  };
}

export function buildRewriteSuggestions(
  resume: ParsedResume,
  matches: KeywordMatch[],
  years: number | null,
  jobTitle: string | null,
): RewriteSuggestion[] {
  const suggestions: RewriteSuggestion[] = [];

  const summary = rewriteSummary(resume, matches, years, jobTitle);
  if (summary) suggestions.push(summary);

  const candidates = resume.statements
    .map((statement) => ({ statement, analysis: analyzeStatement(statement.text) }))
    .map((entry) => ({
      ...entry,
      priority: (entry.analysis.weakOpener ? 3 : 0) + (entry.analysis.words > 38 ? 2 : 0) + (entry.analysis.actionVerb ? 0 : 1),
    }))
    .filter((entry) => entry.priority > 0)
    .sort((a, b) => b.priority - a.priority);

  const seen = new Set<string>();
  for (const { statement, analysis } of candidates) {
    if (suggestions.filter((s) => s.section !== "Skills" && !s.section.startsWith("Professional")).length >= 6) break;
    const key = statement.text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const rewrite = rewriteStatement(statement.text, analysis);
    if (!rewrite || rewrite.text.toLowerCase() === statement.text.toLowerCase()) continue;
    suggestions.push({
      section: statement.section === "projects" ? "Projects" : "Experience",
      original: statement.text,
      improved: rewrite.text,
      explanation: rewrite.changes.join(" "),
    });
  }

  const skills = rewriteSkillsSection(resume, matches);
  if (skills) suggestions.push(skills);

  return suggestions.slice(0, 10);
}
