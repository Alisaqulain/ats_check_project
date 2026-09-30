import type { AnalysisResult, ResumeIssue, SectionAnalysis } from "@/types/analysis";
import { countWords } from "@/lib/parsing/normalize";
import { clamp } from "@/lib/utils";
import { formatYears, type ComputedScores } from "@/lib/scoring/engine";
import { detectLevels } from "./education";
import type { ParsedJob } from "./job-parser";
import type { KeywordMatch } from "./keywords";
import { detectSkills } from "./matcher";
import { hasSection, type ParsedResume } from "./resume-parser";
import { SKILL_BY_NAME } from "./skills-taxonomy";
import type { WritingStats } from "./writing";

export interface InsightContext {
  resume: ParsedResume;
  job: ParsedJob;
  matches: KeywordMatch[];
  writing: WritingStats;
  scores: ComputedScores;
  resumeYears: number | null;
  dateRangesFound: number;
  multiColumn: boolean;
  hasTables: boolean;
}

const TECH_CATEGORIES = new Set([
  "Languages", "Frontend", "Backend", "Databases", "Cloud & DevOps", "Data & AI", "Mobile", "Testing & QA", "Security", "Engineering Practices",
]);

const list = (items: string[], max = 5) =>
  items.length <= max ? items.join(", ") : `${items.slice(0, max).join(", ")} and ${items.length - max} more`;

const pct = (ratio: number) => `${Math.round(ratio * 100)}%`;

function isTechRole(matches: KeywordMatch[]): boolean {
  return matches.filter((m) => m.kind === "skill" && TECH_CATEGORIES.has(m.category)).length >= 3;
}

function section(
  name: string,
  found: boolean,
  optional: boolean,
  score: number,
  strengths: string[],
  issues: string[],
  suggestions: string[],
): SectionAnalysis {
  return { name, found, optional, score: Math.round(clamp(score)), strengths, issues, suggestions };
}

function contactSection({ resume, matches }: InsightContext): SectionAnalysis {
  const c = resume.contact;
  const tech = isTechRole(matches);
  const strengths: string[] = [];
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 0;

  if (c.email) { score += 35; strengths.push("Email address is present and machine-readable."); }
  else { issues.push("No email address detected."); suggestions.push("Add a professional email address near the top of the resume."); }
  if (c.phone) { score += 25; strengths.push("Phone number detected."); }
  else { issues.push("No phone number detected."); suggestions.push("Add a phone number in a standard format (e.g. +1 555 123 4567)."); }
  if (c.linkedin) { score += 20; strengths.push("LinkedIn profile included."); }
  else { issues.push("No LinkedIn profile link found."); suggestions.push("Add your LinkedIn profile URL. Many recruiters check it alongside the resume."); }
  if (c.github || c.portfolio) { score += 10; strengths.push(c.github ? "GitHub profile included." : "Portfolio or personal website included."); }
  else if (tech) { issues.push("No GitHub or portfolio link found."); suggestions.push("If you have public code or a portfolio relevant to this role, link it."); }
  else score += 5;
  if (c.location) { score += 10; strengths.push("Location is listed."); }
  else suggestions.push("Consider adding your city/region (or “Remote”). Some recruiters filter by location.");

  return section("Contact Information", Boolean(c.email || c.phone), false, score, strengths, issues, suggestions);
}

function summarySection({ resume, job, matches, writing }: InsightContext): SectionAnalysis {
  let text = resume.sectionText.summary?.trim() ?? "";
  let untitled = false;
  if (!text) {
    const paragraph = resume.sections[0].lines.find((line) => countWords(line) >= 20);
    if (paragraph) { text = paragraph; untitled = true; }
  }
  if (!text) {
    return section("Professional Summary", false, false, 0, [], ["No professional summary found."], [
      "Add a 2–4 sentence summary that states your role, experience level, and the core skills this job asks for, using only facts from your background.",
    ]);
  }

  const strengths: string[] = [];
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;
  const words = countWords(text);

  if (words < 25) { score -= 20; issues.push(`Very short (${words} words).`); suggestions.push("Expand to 2–4 sentences covering your role, focus area and strongest relevant skills."); }
  else if (words > 120) { score -= 20; issues.push(`Long for a summary (${words} words).`); suggestions.push("Trim to about 40–90 words. Move detail into your experience section."); }
  else strengths.push(`Good length (${words} words).`);

  if (/(?<![A-Za-z])(?:I|my|me)(?![A-Za-z'])/.test(text)) { score -= 10; issues.push("Uses first-person pronouns."); suggestions.push("Write in implied first person (“Frontend engineer with…”, not “I am a…”)."); }
  const cliches = writing.cliches.filter((cliche) => text.toLowerCase().includes(cliche));
  if (cliches.length > 0) { score -= 15; issues.push(`Relies on generic phrases: ${cliches.map((c) => `“${c}”`).join(", ")}.`); suggestions.push("Replace buzzwords with concrete skills, domains, or the kind of work you've done."); }

  const topSkills = matches.filter((m) => m.kind === "skill" && m.status === "matched").slice(0, 5).map((m) => m.name);
  const inSummary = [...detectSkills(text).keys()].filter((name) => topSkills.includes(name));
  if (topSkills.length >= 2 && inSummary.length < 2) {
    score -= 15;
    issues.push("Doesn't mention the job's key skills that appear elsewhere in your resume.");
    suggestions.push(`Mention a few of your most relevant skills here, e.g. ${list(topSkills.filter((s) => !inSummary.includes(s)), 3)}.`);
  } else if (inSummary.length > 0) strengths.push(`Highlights relevant skills: ${list(inSummary)}.`);

  if (job.title) {
    const core = job.title.toLowerCase().replace(/\b(senior|sr|junior|jr|lead|principal|staff)\b\.?/g, "").trim().split(/\s+/).pop() ?? "";
    if (core && !text.toLowerCase().includes(core)) { score -= 10; issues.push("Doesn't reference the type of role you're targeting."); }
    else if (core) strengths.push("References the target role.");
  }
  if (untitled) { score -= 10; issues.push("The summary has no heading, so some ATS may not recognize it."); suggestions.push("Add a “Professional Summary” heading above this paragraph."); }

  return section("Professional Summary", true, false, score, strengths, issues, suggestions);
}

function skillsSection({ resume, matches }: InsightContext): SectionAnalysis {
  const text = resume.sectionText.skills ?? "";
  const jobSkills = matches.filter((m) => m.kind === "skill");
  if (!hasSection(resume, "skills")) {
    return section("Skills", false, false, 0, [], ["No dedicated skills section found."], [
      "Add a “Skills” section listing the tools and technologies you've actually used. ATS keyword filters rely heavily on it.",
    ]);
  }

  const listed = [...detectSkills(text).keys()];
  const hard = listed.filter((name) => SKILL_BY_NAME.get(name)?.category !== "Soft Skills");
  const soft = listed.length - hard.length;
  const strengths: string[] = [];
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 40;

  const inSection = jobSkills.filter((m) => m.locations.includes("skills"));
  if (jobSkills.length > 0) {
    score += (inSection.length / jobSkills.length) * 40;
    if (inSection.length > 0) strengths.push(`Lists ${inSection.length} of ${jobSkills.length} skills from the job description.`);
    const missing = jobSkills.filter((m) => m.status !== "matched" && m.importance !== "low").map((m) => m.name);
    if (missing.length > 0) {
      issues.push(`Job skills not in your resume: ${list(missing)}.`);
      suggestions.push("Add any of these you genuinely have experience with. Leave out the ones you don't.");
    }
  } else score += 30;

  const grouped = text.split("\n").filter((line) => /^[A-Za-z &/]{3,30}:/.test(line)).length >= 2;
  if (grouped) { score += 10; strengths.push("Organized into clear categories."); }
  else if (hard.length >= 8) suggestions.push("Group skills into categories (e.g. Languages, Frameworks, Tools) to make them easier to scan.");
  else score += 5;

  if (hard.length >= 6 && hard.length <= 45) { score += 10; strengths.push(`${hard.length} recognizable technical/professional skills.`); }
  else if (hard.length > 45) { issues.push(`Very long skills list (${hard.length} items) can dilute your core strengths.`); suggestions.push("Keep the skills most relevant to this job and remove outdated or minor ones."); }
  else if (hard.length < 6) { issues.push("Only a few recognizable hard skills are listed."); suggestions.push("List specific tools, technologies or methods rather than general abilities."); }

  if (soft > hard.length && soft >= 4) { issues.push("Mostly soft skills. ATS filters mainly look for hard skills."); suggestions.push("Show soft skills through experience bullets and keep this section for concrete skills."); }

  const unbacked = jobSkills.filter((m) => m.status === "matched" && m.locations.includes("skills") && !m.locations.some((loc) => loc === "experience" || loc === "projects"));
  if (unbacked.length >= 2) {
    issues.push(`Listed but not shown in experience or projects: ${list(unbacked.map((m) => m.name))}.`);
    suggestions.push("Where true, mention these skills in a bullet describing how you used them.");
  }

  return section("Skills", true, false, score, strengths, issues, suggestions);
}

function experienceSection({ resume, matches, writing, dateRangesFound, resumeYears, job }: InsightContext): SectionAnalysis {
  if (!hasSection(resume, "experience")) {
    const hasProjects = hasSection(resume, "projects");
    return section("Experience", false, false, 0, [], ["No work experience section detected."], [
      hasProjects
        ? "If you have internships, freelance or part-time work, add an “Experience” section. Your projects partly compensate."
        : "Add an “Experience” section with job title, company, dates, and 3–6 achievement bullets per role.",
    ]);
  }

  const strengths: string[] = [];
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;
  const experienceStatements = writing.statements.filter((_, i) => resume.statements[i]?.section === "experience");
  const total = experienceStatements.length;

  if (dateRangesFound === 0) { score -= 20; issues.push("Employment dates couldn't be detected."); suggestions.push("Use a consistent date format for each role, e.g. “Jan 2021 – Present”."); }
  else strengths.push(`${dateRangesFound} dated role${dateRangesFound > 1 ? "s" : ""} detected${resumeYears !== null ? ` (~${formatYears(resumeYears)} total)` : ""}.`);

  if (job.requiredYears && resumeYears !== null && resumeYears < job.requiredYears) {
    issues.push(`About ${formatYears(resumeYears)} of experience detected; the job asks for ${job.requiredYears}+ years.`);
    suggestions.push("If you have relevant experience not listed (internships, freelance, open-source), include it with accurate dates.");
  }

  if (!writing.experienceUsesBullets) { score -= 15; issues.push("Responsibilities are written as paragraphs instead of bullets."); suggestions.push("Break each role into 3–6 bullet points that start with an action verb."); }

  if (total >= 2) {
    const quantified = experienceStatements.filter((s) => s.quantified).length / total;
    if (quantified < 0.2) { score -= 20; issues.push(`Only ${pct(quantified)} of bullets include measurable results.`); suggestions.push("Where you have real numbers (scale, time saved, volume, quality), add them. Never estimate or invent figures."); }
    else if (quantified < 0.4) { score -= 10; issues.push(`${pct(quantified)} of bullets include measurable results.`); suggestions.push("Add verifiable outcomes to a few more bullets where you have them."); }
    else strengths.push(`${pct(quantified)} of bullets include measurable results.`);

    const verbs = experienceStatements.filter((s) => s.actionVerb).length / total;
    if (verbs < 0.5) { score -= 10; issues.push("Many bullets don't start with a strong action verb."); suggestions.push("Start bullets with verbs like Built, Led, Designed, Automated, Reduced."); }
    else strengths.push("Most bullets start with action verbs.");

    const weak = experienceStatements.filter((s) => s.weakOpener);
    if (weak.length > 0) { score -= Math.min(15, weak.length * 4); issues.push(`${weak.length} bullet${weak.length > 1 ? "s use" : " uses"} weak phrasing (e.g. “${weak[0].weakOpener}”).`); suggestions.push("See the rewrite suggestions below for stronger versions of these bullets."); }

    const long = experienceStatements.filter((s) => s.words > 38);
    if (long.length > 0) { score -= Math.min(10, long.length * 3); issues.push(`${long.length} bullet${long.length > 1 ? "s are" : " is"} longer than ~38 words.`); suggestions.push("Keep bullets to one or two lines. Split long ones."); }
  }

  const jobSkills = matches.filter((m) => m.kind === "skill");
  if (jobSkills.length > 0) {
    const inExperience = jobSkills.filter((m) => m.locations.includes("experience"));
    const ratio = inExperience.length / jobSkills.length;
    if (ratio < 0.3) { score -= 15; issues.push("Few of the job's skills appear in your experience descriptions."); suggestions.push("Name the specific tools and technologies you used in each role (only those you actually used)."); }
    else if (ratio < 0.6) score -= 5;
    if (inExperience.length > 0) strengths.push(`Experience mentions job skills: ${list(inExperience.map((m) => m.name))}.`);
  }

  return section("Experience", true, false, score, strengths, issues, suggestions);
}

function projectsSection({ resume, matches, resumeYears }: InsightContext): SectionAnalysis {
  if (!hasSection(resume, "projects")) {
    const early = resumeYears === null || resumeYears < 2;
    return section(
      "Projects",
      false,
      true,
      0,
      [],
      early ? ["No projects section. For early-career candidates, projects are a strong way to show skills."] : [],
      early
        ? ["If you've built relevant projects (academic, personal, open-source), add 2–3 with the technologies used and what they do."]
        : ["Optional for your experience level. Add only if you have projects that show skills your work history doesn't."],
    );
  }

  const text = resume.sectionText.projects ?? "";
  const strengths: string[] = [];
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  const tech = [...detectSkills(text).keys()].filter((name) => SKILL_BY_NAME.get(name)?.category !== "Soft Skills");
  if (tech.length === 0) { score -= 25; issues.push("Projects don't name the technologies or methods used."); suggestions.push("List the key tools/technologies for each project."); }
  else strengths.push(`Mentions ${tech.length} technologies/skills.`);

  const relevant = matches.filter((m) => m.locations.includes("projects")).map((m) => m.name);
  if (relevant.length > 0) strengths.push(`Shows job-relevant skills: ${list(relevant)}.`);
  else if (matches.length > 0) { score -= 15; issues.push("Projects don't show skills from this job description."); }

  if (!/https?:\/\/|github\.com|\.io\b|\.dev\b|\.app\b/i.test(text) && isTechRole(matches)) { score -= 10; issues.push("No project links."); suggestions.push("Link to live demos or repositories where possible."); }
  const statements = resume.statements.filter((s) => s.section === "projects");
  if (statements.length === 0) { score -= 10; suggestions.push("Describe each project in 1–3 bullets: what it does, your role, and the stack."); }

  return section("Projects", true, true, score, strengths, issues, suggestions);
}

function educationSection({ resume, job, scores }: InsightContext): SectionAnalysis {
  if (!hasSection(resume, "education")) {
    return section(
      "Education",
      false,
      false,
      0,
      [],
      ["No education section found."],
      [job.education.level ? `The job mentions a ${job.education.level.label}. If you have a degree, add an Education section.` : "Add an Education section with degree, institution and graduation year (if applicable)."],
    );
  }
  const text = resume.sectionText.education ?? "";
  const strengths: string[] = [];
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  const levels = detectLevels(text);
  if (levels.length === 0) { score -= 30; issues.push("Degree type isn't clearly stated."); suggestions.push("Write the full degree name (e.g. “Bachelor of Science in Computer Science”)."); }
  else strengths.push(`Degree detected: ${levels.map((l) => l.label).join(", ")}.`);
  if (!/\b(?:19|20)\d{2}\b/.test(text)) { score -= 10; suggestions.push("Add a graduation year (or expected graduation date)."); }
  else strengths.push("Graduation dates included.");

  if (scores.educationMatch.score < 60) { score -= 30; issues.push(scores.educationMatch.explanation); }
  else if (scores.educationMatch.score < 100 && job.education.level) { score -= 10; issues.push(scores.educationMatch.explanation); }
  else if (job.education.level) strengths.push(scores.educationMatch.explanation);

  return section("Education", true, false, score, strengths, issues, suggestions);
}

function certificationsSection({ resume, matches }: InsightContext): SectionAnalysis {
  const jobCerts = matches.filter((m) => m.kind === "certification");
  if (!hasSection(resume, "certifications")) {
    const missing = jobCerts.filter((m) => m.status !== "matched");
    return section(
      "Certifications",
      false,
      true,
      0,
      [],
      missing.length > 0 ? [`The job mentions ${list(missing.map((m) => m.name))}.`] : [],
      missing.length > 0 ? ["If you hold these certifications, add a Certifications section. Don't list ones you haven't earned."] : ["Optional. Add relevant certifications if you have them."],
    );
  }
  const text = resume.sectionText.certifications ?? "";
  const strengths: string[] = [];
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;
  const entries = text.split("\n").filter((line) => line.trim().length > 3).length;
  strengths.push(`${entries} entr${entries === 1 ? "y" : "ies"} listed.`);
  const matched = jobCerts.filter((m) => m.status === "matched");
  const missing = jobCerts.filter((m) => m.status !== "matched");
  if (matched.length > 0) strengths.push(`Includes certifications the job mentions: ${list(matched.map((m) => m.name))}.`);
  if (missing.length > 0) { score -= 20; issues.push(`The job mentions ${list(missing.map((m) => m.name))}, which isn't listed.`); suggestions.push("Only add certifications you actually hold."); }
  if (!/\b(?:19|20)\d{2}\b/.test(text)) { score -= 10; suggestions.push("Add the year each certification was earned."); }
  return section("Certifications", true, true, score, strengths, issues, suggestions);
}

export function buildSections(context: InsightContext): SectionAnalysis[] {
  return [
    contactSection(context),
    summarySection(context),
    skillsSection(context),
    experienceSection(context),
    projectsSection(context),
    educationSection(context),
    certificationsSection(context),
  ];
}

export function buildIssues(context: InsightContext, sections: SectionAnalysis[]): ResumeIssue[] {
  const { resume, job, matches, writing, scores, resumeYears, dateRangesFound, multiColumn, hasTables } = context;
  const issues: ResumeIssue[] = [];
  const add = (severity: ResumeIssue["severity"], title: string, description: string, suggestion: string) =>
    issues.push({ severity, title, description, suggestion });

  const missingHigh = matches.filter((m) => m.importance === "high" && m.status !== "matched");
  if (missingHigh.length > 0) {
    add(
      "high",
      "Missing important job keywords",
      `${missingHigh.length} high-priority term${missingHigh.length > 1 ? "s" : ""} from the job description ${missingHigh.length > 1 ? "were" : "was"} not found: ${list(missingHigh.map((m) => m.name), 6)}.`,
      "Where you genuinely have this experience, use the job's exact wording in your skills section and in a relevant experience bullet. Don't add skills you don't have.",
    );
  }

  if (!resume.contact.email || !resume.contact.phone) {
    const missing = [!resume.contact.email && "email", !resume.contact.phone && "phone number"].filter(Boolean).join(" and ");
    add("high", "Missing contact details", `No ${missing} could be detected. Recruiters and ATS profiles need these to reach you.`, `Add your ${missing} as plain text at the top of the resume (not inside an image or header graphic).`);
  }

  if (!hasSection(resume, "experience") && !hasSection(resume, "projects")) {
    add("high", "No experience section detected", "The resume doesn't contain a recognizable Experience (or Projects) section, which is the most heavily weighted part of most screenings.", "Add an “Experience” heading with each role's title, company, dates and achievement bullets.");
  }

  if (job.requiredYears && resumeYears !== null && resumeYears < job.requiredYears) {
    const ratio = resumeYears / job.requiredYears;
    add(
      ratio < 0.7 ? "high" : "medium",
      "Less experience than the job asks for",
      `About ${formatYears(resumeYears)} of experience was calculated from your dates; the job asks for ${job.requiredYears}+ years.`,
      "Make sure all relevant roles (including internships, contract or freelance work) are listed with accurate dates. Don't inflate dates.",
    );
  }

  if (job.education.level && !job.education.preferredOnly && scores.educationMatch.score <= 55) {
    add("high", "Education requirement may not be met", scores.educationMatch.explanation, "If you have a qualifying degree, state it clearly with its full name. Otherwise, emphasize equivalent experience if the job allows it.");
  }

  if (writing.statements.length >= 3 && writing.quantifiedRatio < 0.3) {
    add("medium", "Missing measurable achievements", `Only ${pct(writing.quantifiedRatio)} of your experience/project bullets include a number or measurable outcome.`, "Add real metrics where you have them: scale (users, requests, budget), speed, quality or time saved. Never estimate numbers you can't back up.");
  }

  if (writing.weakStatements.length >= 2) {
    add("medium", "Weak or passive phrasing", `${writing.weakStatements.length} bullets start with phrases like “${writing.weakStatements[0].weakOpener}”, which describe duties rather than contributions.`, "Lead with a specific action verb that describes what you did. See the rewrite suggestions.");
  }

  const summary = sections.find((s) => s.name === "Professional Summary");
  if (summary && !summary.found) {
    add("medium", "No professional summary", "There's no summary at the top of the resume to frame your background for this role.", "Add a 2–4 sentence summary using your real role, experience level and most relevant skills.");
  } else if (summary && summary.score < 60) {
    add("medium", "Weak summary", summary.issues.join(" "), "Tighten the summary around your role and the skills this job emphasizes (that you actually have).");
  }

  if (!hasSection(resume, "skills")) {
    add("medium", "No dedicated skills section", "ATS keyword filters often weight a clearly labelled skills section heavily.", "Add a “Skills” section listing the tools, technologies and methods you've used.");
  }

  if (writing.longParagraphs > 0) {
    add("medium", "Long paragraphs", `${writing.longParagraphs} dense paragraph${writing.longParagraphs > 1 ? "s" : ""} detected. Long blocks of text are hard to scan for both recruiters and parsers.`, "Break long paragraphs into concise bullet points.");
  }

  if (multiColumn) {
    add("medium", "Multi-column layout", "A two-column layout was detected. Some ATS read columns in the wrong order, mixing up sections.", "Consider a single-column layout for applications that go through an ATS.");
  }

  if (hasSection(resume, "experience") && dateRangesFound === 0) {
    add("medium", "Employment dates not detected", "No date ranges could be read from your experience section, so tenure can't be calculated.", "Use a standard format for each role, e.g. “Mar 2021 – Present” or “03/2021 – 06/2023”.");
  }

  const unbacked = matches.filter((m) => m.kind === "skill" && m.status === "matched" && m.importance !== "low" && !m.locations.some((loc) => loc === "experience" || loc === "projects"));
  if (unbacked.length >= 3) {
    add("medium", "Skills not backed by experience", `${list(unbacked.map((m) => m.name))} ${unbacked.length > 1 ? "are" : "is"} listed but not mentioned in any role or project.`, "Where accurate, mention these skills in the experience bullets where you used them.");
  }

  if (hasTables) add("low", "Tables used in layout", "Your document uses tables. Some ATS extract table content out of order.", "Use simple text with headings and bullets instead of tables where possible.");
  if (!resume.contact.linkedin) add("low", "No LinkedIn profile", "No LinkedIn URL was detected.", "Add your LinkedIn profile URL to the contact section.");
  if (!resume.contact.github && !resume.contact.portfolio && isTechRole(matches)) {
    add("low", "No GitHub or portfolio link", "For technical roles, recruiters often look for examples of your work.", "If you have relevant public work, add a GitHub or portfolio link.");
  }
  if (writing.dateFormats.size > 1) add("low", "Inconsistent date formats", "Dates use more than one format (e.g. “Jan 2021” and “01/2021”).", "Pick one date format and use it everywhere.");
  if (writing.pronounCount >= 3) add("low", "First-person pronouns", "The resume uses “I/my/me” several times.", "Drop pronouns and start statements with verbs (“Built…”, not “I built…”).");
  if (writing.cliches.length >= 2) add("low", "Generic buzzwords", `Phrases like ${writing.cliches.slice(0, 3).map((c) => `“${c}”`).join(", ")} add little information.`, "Replace them with specific skills, domains or achievements.");
  if (resume.wordCount < 250) add("low", "Resume is very short", `Only about ${resume.wordCount} words were extracted.`, "Make sure each role has a few bullets describing your contributions and the skills you used.");
  if (resume.wordCount > 1400) add("low", "Resume is long", `About ${resume.wordCount} words. Long resumes can bury your most relevant experience.`, "Prioritize recent, relevant experience and trim older or unrelated details.");

  if (job.title) {
    const expText = (resume.sectionText.experience ?? "").toLowerCase();
    const roleWord = job.title.toLowerCase().split(/\s+/).pop() ?? "";
    if (expText && roleWord.length > 3 && !expText.includes(roleWord) && scores.experienceMatch.score < 60) {
      add("low", "Job titles differ from the target role", `Your listed titles don't include “${roleWord}”, so title-based ATS searches may not surface your resume.`, "Keep your real job titles. Don't change them. Instead, make sure bullets clearly describe the responsibilities that match this role.");
    }
  }

  const order = { high: 0, medium: 1, low: 2 } as const;
  return issues.sort((a, b) => order[a.severity] - order[b.severity]).slice(0, 20);
}

export function buildSuggestions(context: InsightContext, issues: ResumeIssue[]): string[] {
  const { matches } = context;
  const suggestions: string[] = [];

  const exact = matches.filter((m) => m.status === "partial" && m.related);
  for (const match of exact.slice(0, 2)) {
    suggestions.push(`Your resume mentions ${match.related?.name}; list “${match.name}” explicitly too, since ATS filters match exact terms.`);
  }
  const related = matches.filter((m) => m.status === "missing" && m.related?.relation === "related" && m.importance !== "low");
  if (related.length > 0) {
    suggestions.push(`For ${list(related.map((m) => m.name), 3)}, you list related experience (${list([...new Set(related.map((m) => m.related?.name ?? ""))], 3)}). Mention the exact tool if you've used it, or frame the related experience as transferable.`);
  }

  for (const issue of issues) {
    if (suggestions.length >= 8) break;
    if (!suggestions.includes(issue.suggestion)) suggestions.push(issue.suggestion);
  }

  suggestions.push("Tailor the resume for each application: mirror the job's exact phrasing for skills you genuinely have, and keep the most relevant experience near the top.");
  return suggestions.slice(0, 10);
}

export function buildMissingReason(match: KeywordMatch): string {
  const requirement =
    match.requirement === "required" ? "Required" : match.requirement === "preferred" ? "Listed as preferred" : "Mentioned";
  if (match.status === "partial" && match.related) {
    return `Your resume mentions ${match.related.name}, which implies ${match.name}. List “${match.name}” explicitly so keyword-based filters recognize it.`;
  }
  if (match.related?.relation === "related") {
    return `${requirement} in the job description. You list ${match.related.name}, a related skill. If you've also used ${match.name}, name it explicitly; if not, present your ${match.related.name} experience as transferable.`;
  }
  switch (match.kind) {
    case "soft":
      return `${requirement} in the job description. Rather than just listing it, show it in an experience bullet that describes a real situation where you applied it.`;
    case "certification":
      return `${requirement} in the job description. Add it only if you actually hold this certification.`;
    case "phrase":
      return `A recurring term in the job description. If it reflects your real experience, use the same wording.`;
    default:
      return `${requirement} in the job description but not found in your resume. Add it only if you genuinely have this experience.`;
  }
}

export function buildComparison(matches: KeywordMatch[]): AnalysisResult["comparison"] {
  const labels: Record<string, string> = {
    experience: "Experience", projects: "Projects", skills: "Skills", summary: "Summary",
    education: "Education", certifications: "Certifications", header: "Header", contact: "Contact", other: "Other",
  };
  return matches
    .filter((m) => m.kind === "skill" || m.kind === "certification")
    .map((m) => ({
      skill: m.name,
      category: m.category,
      resume: m.status === "matched" ? ("found" as const) : m.related ? ("related" as const) : ("not-found" as const),
      evidence:
        m.status === "matched"
          ? `Found in ${[...new Set(m.locations.map((loc) => labels[loc] ?? loc))].join(", ")}`
          : m.related
            ? `${m.related.relation === "implied" ? "Implied by" : "Related"}: ${m.related.name}`
            : "Not found",
      job: m.requirement,
      status: m.status === "matched" ? ("matched" as const) : m.status === "partial" ? ("partial" as const) : ("missing" as const),
    }));
}

export function buildSummary(context: InsightContext, overall: number, jobTitle: string | null): string {
  const { matches, scores, writing } = context;
  const found = matches.filter((m) => m.status === "matched").length;
  const high = matches.filter((m) => m.importance === "high");
  const highFound = high.filter((m) => m.status === "matched").length;
  const target = jobTitle ? `the ${jobTitle} role` : "this job description";

  const areas = [
    { label: "keyword coverage", score: scores.keywordMatch.score },
    { label: "skills alignment", score: scores.skillsMatch.score },
    { label: "experience relevance", score: scores.experienceMatch.score },
    { label: "education fit", score: scores.educationMatch.score },
    { label: "resume structure", score: scores.structureScore.score },
    { label: "formatting", score: scores.formattingScore.score },
  ].sort((a, b) => b.score - a.score);

  const parts: string[] = [];
  parts.push(
    matches.length > 0
      ? `Your resume contains ${found} of ${matches.length} keywords identified for ${target}${high.length > 0 ? `, including ${highFound} of ${high.length} high-priority terms` : ""}.`
      : `Your resume was compared against ${target}.`,
  );
  parts.push(`Your strongest area is ${areas[0].label} (${areas[0].score}/100); the biggest opportunity is ${areas[areas.length - 1].label} (${areas[areas.length - 1].score}/100).`);

  const missingHigh = matches.filter((m) => m.importance === "high" && m.status !== "matched").slice(0, 3).map((m) => m.name);
  if (missingHigh.length > 0) parts.push(`Key gaps include ${list(missingHigh, 3)}.`);
  if (writing.statements.length >= 3 && writing.quantifiedRatio < 0.3) parts.push("Adding real, measurable outcomes to your bullets would also strengthen it.");

  parts.push(`Overall estimate: ${overall}/100. This is based on text analysis of your resume and the job description; real ATS systems and recruiters evaluate resumes differently.`);
  return parts.join(" ");
}
