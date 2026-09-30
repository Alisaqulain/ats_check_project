import type { Importance } from "@/types/analysis";
import type { JobSegment, ParsedJob } from "./job-parser";
import { detectSkills, getCompiledSkill, phraseRegex, skillInText, COMPILED_SKILLS } from "./matcher";
import type { ParsedResume, SectionKey } from "./resume-parser";
import { SKILL_BY_NAME, type SkillCategory } from "./skills-taxonomy";

export type KeywordKind = "skill" | "soft" | "certification" | "phrase";
export type JobRequirement = "required" | "preferred" | "mentioned";

export interface JobKeyword {
  name: string;
  kind: KeywordKind;
  category: SkillCategory | "Job-specific terms";
  importance: Importance;
  requirement: JobRequirement;
  occurrences: number;
}

export interface KeywordMatch extends JobKeyword {
  status: "matched" | "partial" | "missing";
  locations: SectionKey[];
  related: { name: string; relation: "implied" | "related" } | null;
}

const STOP_WORDS = new Set(
  "a an and are as at be been being but by can could did do does for from had has have having he her his how i if in into is it its just may me more most my no nor not of on or our out over own same she should so some such than that the their them then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours about above after again against all am any because before below between both during each few further here itself let off once only other ought ourselves themselves down etc via per e.g i.e".split(
    " ",
  ),
);

const GENERIC_WORDS = new Set(
  (
    "experience experienced team teams work working works ability able strong skills skill knowledge understanding including include includes role roles company candidate candidates years year job jobs position opportunity opportunities business environment requirements requirement required preferred plus bonus responsibilities responsible develop developing development build building builds using use used new great good excellent highly well across within also ensure help helping support supporting provide providing looking join will can must should would like based related relevant degree field equivalent familiarity proficiency proficient level high quality time part full day days world people product products engineering engineer engineers software technical technology technologies tools tool systems system solutions solution services service applications application projects project design designs data code coding process processes best practices practice industry clients client collaborate collaborating communicate deliver delivering delivery drive driving make making lead leading manage managing own owning apply applying benefits salary remote hybrid office location equal employer status race gender disability veteran national origin religion orientation identity age color sex applicants qualified consideration regard without fast paced dynamic passionate motivated self love excited exciting mission culture values growth grow career learn learning impact meaningful members member cross functional closely others various multiple complex large scale modern latest current future first second one two three four five minimum least ideal ideally bring need needs want every day-to-day key core main solid deep proven track record demonstrated hands-on environment environments organization organizations area areas focus value customer customers user users problem problems features feature platform platforms ideas quickly effectively opportunity insurance health dental vision paid leave pto 401k stock equity competitive package hiring apply today us yourself whether million billion senior junior principal staff mid entry intermediate".split(
      " ",
    )
  ),
);

const WEIGHTS: Record<Importance, number> = { high: 3, medium: 2, low: 1 };

function kindFor(category: SkillCategory): KeywordKind {
  if (category === "Soft Skills") return "soft";
  if (category === "Certifications") return "certification";
  return "skill";
}

interface Tally {
  total: number;
  required: number;
  preferred: number;
  responsibilities: number;
  other: number;
  general: number;
  inTitle: boolean;
}

function importanceFrom(tally: Tally, structured: boolean): { importance: Importance; requirement: JobRequirement } {
  const requirement: JobRequirement =
    tally.required > 0 ? "required" : tally.preferred > 0 && tally.responsibilities + tally.general === 0 ? "preferred" : "mentioned";

  let importance: Importance;
  if (tally.inTitle || tally.required > 0 || tally.total >= 3) importance = "high";
  else if (tally.responsibilities > 0 || tally.total >= 2) importance = "medium";
  else if (tally.preferred > 0) importance = "low";
  else if (tally.general > 0) importance = structured ? "low" : "medium";
  else importance = "low";

  if (requirement === "preferred" && importance === "high" && tally.required === 0 && !tally.inTitle) importance = "medium";
  return { importance, requirement };
}

function emptyTally(): Tally {
  return { total: 0, required: 0, preferred: 0, responsibilities: 0, other: 0, general: 0, inTitle: false };
}

function tokenize(line: string): string[][] {
  return line
    .toLowerCase()
    .replace(/[’']/g, "")
    .split(/[,.;:()!?/|"•\[\]{}]+|\s-\s|\s–\s/)
    .map((chunk) => chunk.split(/\s+/).filter(Boolean));
}

function isContentWord(word: string): boolean {
  return /^[a-z][a-z-]{2,}$/.test(word) && !STOP_WORDS.has(word) && !GENERIC_WORDS.has(word);
}

/** Recurring domain phrases that aren't in the taxonomy (e.g. "payment processing"). */
function extractPhrases(job: ParsedJob): JobKeyword[] {
  const bigrams = new Map<string, Tally>();
  const unigrams = new Map<string, Tally>();

  const record = (map: Map<string, Tally>, key: string, segment: JobSegment) => {
    const tally = map.get(key) ?? emptyTally();
    tally.total += 1;
    tally[segment] += 1;
    map.set(key, tally);
  };

  for (const line of job.lines) {
    if (line.segment === "other") continue;
    const segment: JobSegment = line.preferredMarker
      ? "preferred"
      : line.requiredMarker && line.segment === "general"
        ? "required"
        : line.segment;
    for (const words of tokenize(line.text)) {
      words.forEach((word, index) => {
        if (!isContentWord(word)) return;
        record(unigrams, word, segment);
        const next = words[index + 1];
        if (next && isContentWord(next)) record(bigrams, `${word} ${next}`, segment);
      });
    }
  }

  const overlapsTaxonomy = (phrase: string) => COMPILED_SKILLS.some((skill) => skillInText(skill, phrase));

  const phrases: JobKeyword[] = [];
  const chosenBigrams = [...bigrams.entries()]
    .filter(([phrase, tally]) => tally.total >= 2 && !overlapsTaxonomy(phrase))
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5);

  for (const [phrase, tally] of chosenBigrams) {
    const { importance, requirement } = importanceFrom(tally, job.structured);
    phrases.push({
      name: phrase,
      kind: "phrase",
      category: "Job-specific terms",
      importance: importance === "high" ? "medium" : importance,
      requirement,
      occurrences: tally.total,
    });
  }

  const chosenUnigrams = [...unigrams.entries()]
    .filter(
      ([word, tally]) =>
        tally.total >= 3 &&
        word.length >= 5 &&
        !overlapsTaxonomy(word) &&
        !chosenBigrams.some(([phrase]) => phrase.split(" ").includes(word)),
    )
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, Math.max(0, 7 - phrases.length));

  for (const [word, tally] of chosenUnigrams) {
    const { requirement } = importanceFrom(tally, job.structured);
    phrases.push({
      name: word,
      kind: "phrase",
      category: "Job-specific terms",
      importance: tally.total >= 4 ? "medium" : "low",
      requirement,
      occurrences: tally.total,
    });
  }

  return phrases;
}

export function extractJobKeywords(job: ParsedJob): JobKeyword[] {
  const tallies = new Map<string, Tally>();
  const titleSkills = job.title ? detectSkills(job.title) : new Map<string, number>();

  for (const line of job.lines) {
    const found = detectSkills(line.text);
    for (const [name, count] of found) {
      const tally = tallies.get(name) ?? emptyTally();
      tally.total += count;
      if (line.preferredMarker && !/\brequired\b|\bmust\b/i.test(line.text)) tally.preferred += 1;
      else if (line.segment === "general" && line.requiredMarker) tally.required += 1;
      else if (line.segment === "responsibilities" && line.requiredMarker && /\b(strong|expert|proficien|deep)\w*/i.test(line.text)) tally.required += 1;
      else tally[line.segment] += 1;
      tallies.set(name, tally);
    }
  }
  for (const name of titleSkills.keys()) {
    const tally = tallies.get(name) ?? emptyTally();
    tally.inTitle = true;
    tally.total = Math.max(tally.total, 1);
    tallies.set(name, tally);
  }

  const keywords: JobKeyword[] = [];
  for (const [name, tally] of tallies) {
    const def = SKILL_BY_NAME.get(name);
    if (!def) continue;
    // Skills mentioned only in "About us"/benefits text aren't requirements.
    if (tally.other === tally.total && !tally.inTitle) continue;
    const { importance, requirement } = importanceFrom(tally, job.structured);
    keywords.push({
      name,
      kind: kindFor(def.category),
      category: def.category,
      importance,
      requirement,
      occurrences: tally.total,
    });
  }

  keywords.push(...extractPhrases(job));

  const order: Record<Importance, number> = { high: 0, medium: 1, low: 2 };
  return keywords.sort((a, b) => order[a.importance] - order[b.importance] || b.occurrences - a.occurrences);
}

export interface ResumeSkillIndex {
  bySection: Map<SectionKey, Map<string, number>>;
  all: Set<string>;
}

export function indexResumeSkills(resume: ParsedResume): ResumeSkillIndex {
  const bySection = new Map<SectionKey, Map<string, number>>();
  const all = new Set<string>();
  for (const section of resume.sections) {
    // Profile URLs and emails ("github.com/…") aren't evidence of a skill.
    const text = [section.heading, ...section.lines]
      .join("\n")
      .replace(/\S+@\S+\.\S+/g, " ")
      .replace(/(?:https?:\/\/)?(?:www\.)?[\w-]+\.(?:com|io|dev|me|net|org|app)\/\S*/gi, " ");
    const found = detectSkills(text);
    const existing = bySection.get(section.key) ?? new Map<string, number>();
    for (const [name, count] of found) {
      existing.set(name, (existing.get(name) ?? 0) + count);
      all.add(name);
    }
    bySection.set(section.key, existing);
  }
  return { bySection, all };
}

export function matchKeywords(keywords: JobKeyword[], resume: ParsedResume, index: ResumeSkillIndex): KeywordMatch[] {
  return keywords.map((keyword) => {
    if (keyword.kind === "phrase") {
      const regex = phraseRegex(keyword.name);
      const locations = resume.sections
        .filter((section) => regex.test(section.lines.join("\n")))
        .map((section) => section.key);
      return {
        ...keyword,
        status: locations.length > 0 ? "matched" : "missing",
        locations: [...new Set(locations)],
        related: null,
      };
    }

    const locations = [...index.bySection.entries()]
      .filter(([, skills]) => skills.has(keyword.name))
      .map(([key]) => key);
    if (locations.length > 0) {
      return { ...keyword, status: "matched", locations, related: null };
    }

    const implier = [...index.all].find((name) => SKILL_BY_NAME.get(name)?.implies?.includes(keyword.name));
    if (implier) {
      return { ...keyword, status: "partial", locations: [], related: { name: implier, relation: "implied" } };
    }

    const group = getCompiledSkill(keyword.name)?.def.group;
    const relative = group
      ? [...index.all].find((name) => name !== keyword.name && SKILL_BY_NAME.get(name)?.group === group)
      : undefined;
    return {
      ...keyword,
      status: "missing",
      locations: [],
      related: relative ? { name: relative, relation: "related" } : null,
    };
  });
}

export function keywordWeight(importance: Importance): number {
  return WEIGHTS[importance];
}

/** Share of the JD's meaningful vocabulary that also appears in the resume (fallback signal). */
export function vocabularyOverlap(jobText: string, resumeText: string): number {
  const jobWords = new Set(
    tokenize(jobText)
      .flat()
      .filter((word) => isContentWord(word) && word.length >= 4),
  );
  if (jobWords.size === 0) return 0;
  const resumeWords = new Set(tokenize(resumeText).flat());
  let hits = 0;
  for (const word of jobWords) if (resumeWords.has(word) || resumeWords.has(`${word}s`) || resumeWords.has(word.replace(/s$/, ""))) hits += 1;
  return hits / jobWords.size;
}
