import { SKILLS, type SkillDefinition } from "./skills-taxonomy";

export interface CompiledSkill {
  def: SkillDefinition;
  regexes: RegExp[];
  globalRegexes: RegExp[];
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Builds a boundary-aware pattern that tolerates space/hyphen variants and simple plurals. */
function termToPattern(term: string): string {
  const body = term
    .trim()
    .split(/[\s-]+/)
    .map(escapeRegex)
    .join("[\\s-]?");
  const plural = /[a-z]$/i.test(term) && term.length > 3 ? "(?:s|es)?" : "";
  return `(?<![A-Za-z0-9+#])${body}${plural}(?![A-Za-z0-9+#])`;
}

function compile(def: SkillDefinition): CompiledSkill {
  const terms = [...(def.skipName ? [] : [def.name]), ...(def.aliases ?? [])].sort(
    (a, b) => b.length - a.length,
  );
  const regexes: RegExp[] = [];
  if (terms.length > 0) {
    regexes.push(new RegExp(`(?:${terms.map(termToPattern).join("|")})`, def.caseSensitive ? "" : "i"));
  }
  for (const pattern of def.patterns ?? []) regexes.push(pattern);
  const globalRegexes = regexes.map(
    (regex) => new RegExp(regex.source, regex.flags.includes("g") ? regex.flags : `${regex.flags}g`),
  );
  return { def, regexes, globalRegexes };
}

export const COMPILED_SKILLS: CompiledSkill[] = SKILLS.map(compile);

const COMPILED_BY_NAME = new Map(COMPILED_SKILLS.map((skill) => [skill.def.name, skill]));

export function getCompiledSkill(name: string): CompiledSkill | undefined {
  return COMPILED_BY_NAME.get(name);
}

export function skillInText(skill: CompiledSkill, text: string): boolean {
  return skill.regexes.some((regex) => regex.test(text));
}

interface Span {
  name: string;
  start: number;
  end: number;
}

/**
 * Counts skill mentions in a text. A mention fully contained in a longer mention of a
 * different skill is ignored ("React" inside "React Native"), unless the longer skill
 * implies it ("Spring" inside "Spring Boot").
 */
export function detectSkills(text: string): Map<string, number> {
  const spans: Span[] = [];
  for (const skill of COMPILED_SKILLS) {
    for (const regex of skill.globalRegexes) {
      regex.lastIndex = 0;
      for (const match of text.matchAll(regex)) {
        if (match[0].length === 0) continue;
        const start = match.index ?? 0;
        spans.push({ name: skill.def.name, start, end: start + match[0].length });
      }
    }
  }

  const counts = new Map<string, number>();
  const seen = new Set<string>();
  for (const span of spans) {
    const key = `${span.name}:${span.start}:${span.end}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const swallowed = spans.some(
      (other) =>
        other.start <= span.start &&
        other.end >= span.end &&
        other.end - other.start > span.end - span.start &&
        (other.name === span.name ||
          !(COMPILED_BY_NAME.get(other.name)?.def.implies ?? []).includes(span.name)),
    );
    if (!swallowed) counts.set(span.name, (counts.get(span.name) ?? 0) + 1);
  }
  return counts;
}

/** Matches a free-form phrase with tolerance for plural/suffix variations of each word. */
export function phraseRegex(phrase: string): RegExp {
  const words = phrase
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const stem = word.length > 5 ? word.slice(0, word.length - 2) : word;
      return `${escapeRegex(stem)}[a-z]{0,4}`;
    });
  return new RegExp(`(?<![a-z0-9])${words.join("[\\s-]+")}(?![a-z0-9])`, "i");
}
