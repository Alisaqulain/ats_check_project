const BULLET_GLYPHS =
  /^[\s]*(?:[•●▪■◦○◆◇►▶▸‣⁃∙·➢➤✓✔☐□❖*]|[\uE000-\uF8FF]|-(?=\s)|–(?=\s)|—(?=\s))\s*/u;

const LIGATURES: Record<string, string> = {
  "\uFB00": "ff",
  "\uFB01": "fi",
  "\uFB02": "fl",
  "\uFB03": "ffi",
  "\uFB04": "ffl",
};

const PAGE_NUMBER_LINE = /^(?:page\s*)?\d{1,3}(?:\s*(?:of|\/)\s*\d{1,3})?$/i;

/**
 * Cleans raw extracted text while preserving line/section structure:
 * - unifies line breaks, whitespace, ligatures and bullet glyphs
 * - joins words hyphenated across line breaks
 * - drops standalone page-number lines
 * - collapses runs of blank lines
 */
export function normalizeText(raw: string): string {
  let text = raw
    .replace(/\r\n?/g, "\n")
    .replace(/[\u200B-\u200D\uFEFF\u00AD]/g, "")
    .replace(/[\u00A0\u2000-\u200A\u202F\u205F\u3000\t]/g, " ")
    .replace(/[\uFB00-\uFB04]/g, (match) => LIGATURES[match] ?? match)
    .replace(/[\u2018\u2019\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201F]/g, '"')
    .replace(/(\p{Ll})-\n(\p{Ll})/gu, "$1$2");

  const lines = text.split("\n").map((line) => {
    let cleaned = line.replace(/ {2,}/g, " ").trim();
    if (BULLET_GLYPHS.test(cleaned)) {
      const rest = cleaned.replace(BULLET_GLYPHS, "").trim();
      cleaned = rest ? `• ${rest}` : "";
    }
    return cleaned;
  });

  text = lines
    .filter((line) => !PAGE_NUMBER_LINE.test(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text;
}

export function countWords(text: string): number {
  const matches = text.match(/[\p{L}\p{N}][\p{L}\p{N}'’.+#-]*/gu);
  return matches ? matches.length : 0;
}

/** True when the text contains enough real words to be worth analyzing. */
export function hasMeaningfulText(text: string, minWords: number): boolean {
  const words = text.match(/\p{L}{2,}/gu) ?? [];
  if (words.length < minWords) return false;
  const letters = (text.match(/\p{L}/gu) ?? []).length;
  const visible = text.replace(/\s/g, "").length;
  return visible > 0 && letters / visible > 0.5;
}
