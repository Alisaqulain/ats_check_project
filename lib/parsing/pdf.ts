import "server-only";
import { extractLinks, extractTextItems, getDocumentProxy, type StructuredTextItem } from "unpdf";

export interface PdfExtraction {
  text: string;
  pageCount: number;
  multiColumn: boolean;
  links: string[];
}

interface Line {
  y: number;
  items: StructuredTextItem[];
}

const MAX_PAGES = 12;

function groupIntoLines(items: StructuredTextItem[]): Line[] {
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  const lines: Line[] = [];
  for (const item of sorted) {
    const tolerance = Math.max(2, (item.fontSize || 10) * 0.45);
    const line = lines.find((candidate) => Math.abs(candidate.y - item.y) <= tolerance);
    if (line) line.items.push(item);
    else lines.push({ y: item.y, items: [item] });
  }
  for (const line of lines) line.items.sort((a, b) => a.x - b.x);
  return lines.sort((a, b) => b.y - a.y);
}

function lineToText(line: Line): string {
  let output = "";
  let previous: StructuredTextItem | null = null;
  for (const item of line.items) {
    if (previous) {
      const gap = item.x - (previous.x + previous.width);
      const fontSize = item.fontSize || 10;
      const needsSpace =
        gap > fontSize * 0.2 && !output.endsWith(" ") && !item.str.startsWith(" ");
      if (needsSpace) output += gap > fontSize * 2.5 ? "  " : " ";
    }
    output += item.str;
    previous = item;
  }
  return output;
}

/**
 * Detects a two-column layout: a vertical boundary that almost no text run crosses,
 * with a meaningful number of lines that start to the right of it.
 */
function findColumnBoundary(lines: Line[], items: StructuredTextItem[]): number | null {
  if (lines.length < 8) return null;
  const columnStarts: number[] = [];
  for (const line of lines) {
    for (let i = 1; i < line.items.length; i++) {
      const prev = line.items[i - 1];
      const cur = line.items[i];
      const gap = cur.x - (prev.x + prev.width);
      if (gap > Math.max(18, (cur.fontSize || 10) * 2.5)) columnStarts.push(cur.x);
    }
  }
  if (columnStarts.length < lines.length * 0.15) return null;

  // Columns are left-aligned, so the right column's start is where the split happens.
  columnStarts.sort((a, b) => a - b);
  const median = columnStarts[Math.floor(columnStarts.length / 2)];
  const boundary = Math.min(...columnStarts.filter((x) => Math.abs(x - median) <= 15)) - 1;

  const substantial = items.filter((item) => item.str.trim().length > 3);
  if (substantial.length === 0) return null;
  const spanning = substantial.filter((item) => item.x < boundary - 2 && item.x + item.width > boundary + 2);
  if (spanning.length / substantial.length > 0.03) return null;

  const rightOnly = lines.filter((line) => line.items[0].x >= boundary).length;
  const splitAtBoundary = lines.filter((line) =>
    line.items.some((item, i) => i > 0 && line.items[i - 1].x + line.items[i - 1].width < boundary && item.x >= boundary - 30),
  ).length;
  // Columns either have lines that only exist on the right, or rows that consistently split at the boundary.
  if (rightOnly < lines.length * 0.15 && splitAtBoundary < lines.length * 0.35) return null;

  return boundary;
}

function pageToText(items: StructuredTextItem[]): { text: string; multiColumn: boolean } {
  const visible = items.filter((item) => item.str.trim().length > 0 || item.str === " ");
  const textItems = visible.filter((item) => item.str.trim().length > 0);
  const lines = groupIntoLines(textItems);
  const boundary = findColumnBoundary(lines, textItems);

  if (boundary === null) {
    return { text: lines.map(lineToText).join("\n"), multiColumn: false };
  }

  const left = groupIntoLines(textItems.filter((item) => item.x < boundary));
  const right = groupIntoLines(textItems.filter((item) => item.x >= boundary));
  return {
    text: [...left.map(lineToText), "", ...right.map(lineToText)].join("\n"),
    multiColumn: true,
  };
}

export async function extractPdfText(buffer: Uint8Array): Promise<PdfExtraction> {
  // verbosity 0 = errors only; pdf.js otherwise prints font-parsing warnings to the server console.
  const pdf = await getDocumentProxy(buffer, { verbosity: 0 });
  try {
    const pageCount = pdf.numPages;
    const { items } = await extractTextItems(pdf);
    let multiColumn = false;
    const pages = items.slice(0, MAX_PAGES).map((pageItems) => {
      const page = pageToText(pageItems);
      multiColumn ||= page.multiColumn;
      return page.text;
    });
    const links = await extractLinks(pdf)
      .then((result) => result.links.slice(0, 50))
      .catch(() => []);
    return { text: pages.join("\n\n"), pageCount, multiColumn, links };
  } finally {
    await pdf.loadingTask.destroy().catch(() => undefined);
  }
}
