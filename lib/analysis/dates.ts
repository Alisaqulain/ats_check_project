const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

const MONTH_PATTERN =
  "jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?";
const DATE_PATTERN = `(?:(?:${MONTH_PATTERN})\\.?,?\\s*'?\\d{2,4}|\\d{1,2}\\s*[/.]\\s*\\d{4}|(?:19|20)\\d{2})`;
const PRESENT_PATTERN = "present|current(?:ly)?|now|today|ongoing|till date|to date";

export const DATE_RANGE = new RegExp(
  `(?<![\\d/A-Za-z])(${DATE_PATTERN})\\s*(?:-|–|—|to|until|through|~)\\s*(${DATE_PATTERN}|${PRESENT_PATTERN})(?![\\d/])`,
  "gi",
);

interface ParsedDate {
  year: number;
  month: number;
  hasMonth: boolean;
}

function parseDate(value: string, now: Date): ParsedDate | null {
  const v = value.trim().toLowerCase();
  if (new RegExp(`^(?:${PRESENT_PATTERN})$`).test(v)) {
    return { year: now.getFullYear(), month: now.getMonth(), hasMonth: true };
  }
  const monthName = v.match(new RegExp(`^(${MONTH_PATTERN})\\.?,?\\s*'?(\\d{2,4})$`));
  if (monthName) {
    let year = Number(monthName[2]);
    if (year < 100) year += year > 50 ? 1900 : 2000;
    return { year, month: MONTHS[monthName[1].slice(0, 3)], hasMonth: true };
  }
  const numeric = v.match(/^(\d{1,2})\s*[/.]\s*(\d{4})$/);
  if (numeric) {
    const month = Number(numeric[1]) - 1;
    if (month < 0 || month > 11) return null;
    return { year: Number(numeric[2]), month, hasMonth: true };
  }
  const yearOnly = v.match(/^((?:19|20)\d{2})$/);
  if (yearOnly) return { year: Number(yearOnly[1]), month: 0, hasMonth: false };
  return null;
}

export interface DateRange {
  start: number;
  end: number;
  raw: string;
  format: "month-name" | "numeric" | "year";
}

export function findDateRanges(text: string, now = new Date()): DateRange[] {
  const ranges: DateRange[] = [];
  const maxYear = now.getFullYear() + 1;
  for (const match of text.matchAll(DATE_RANGE)) {
    const start = parseDate(match[1], now);
    const end = parseDate(match[2], now);
    if (!start || !end) continue;
    if (start.year < 1970 || start.year > maxYear || end.year < 1970 || end.year > maxYear) continue;
    const startIndex = start.year * 12 + start.month;
    // Month-precise ranges are inclusive (Jan–Jan counts as one month).
    const endIndex = end.year * 12 + end.month + (start.hasMonth && end.hasMonth ? 1 : 0);
    if (endIndex <= startIndex) continue;
    const format = /[a-z]{3}/i.test(match[1]) ? "month-name" : /[/.]/.test(match[1]) ? "numeric" : "year";
    ranges.push({ start: startIndex, end: endIndex, raw: match[0], format });
  }
  return ranges;
}

/** Total months covered by the ranges, counting overlapping periods only once. */
export function mergedMonths(ranges: DateRange[]): number {
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  let total = 0;
  let currentStart = -1;
  let currentEnd = -1;
  for (const range of sorted) {
    if (range.start > currentEnd) {
      if (currentEnd > currentStart) total += currentEnd - currentStart;
      currentStart = range.start;
      currentEnd = range.end;
    } else {
      currentEnd = Math.max(currentEnd, range.end);
    }
  }
  if (currentEnd > currentStart) total += currentEnd - currentStart;
  return total;
}

const CLAIMED_YEARS =
  /(\d{1,2})(?:\.\d)?\s*\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:professional\s+|industry\s+|hands[- ]on\s+|work\s+|relevant\s+)?experience/i;

export function claimedYears(text: string): number | null {
  const match = text.match(CLAIMED_YEARS);
  if (!match) return null;
  const years = Number(match[1]);
  return years > 0 && years <= 45 ? years : null;
}
