import "server-only";
import mammoth from "mammoth";

export interface DocxExtraction {
  text: string;
  hasTables: boolean;
  links: string[];
}

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
};

function decodeEntities(value: string): string {
  return value
    .replace(/&(?:amp|lt|gt|quot|#39|apos|nbsp);/g, (entity) => ENTITIES[entity] ?? entity)
    .replace(/&#(\d{1,6});/g, (_, code: string) => {
      const point = Number(code);
      return point > 0 && point < 0x110000 ? String.fromCodePoint(point) : "";
    })
    .replace(/&#x([0-9a-f]{1,6});/gi, (_, code: string) => {
      const point = parseInt(code, 16);
      return point > 0 && point < 0x110000 ? String.fromCodePoint(point) : "";
    });
}

/**
 * Converts mammoth's semantic HTML to structured plain text. Going through HTML
 * (instead of `extractRawText`) keeps list items as bullets and headings on their own lines.
 */
function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<img[^>]*>/gi, "")
      .replace(/<li[^>]*>/gi, "\n• ")
      .replace(/<\/(?:p|h[1-6]|li|tr|ul|ol|table)>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/t[dh]>/gi, "  ")
      .replace(/<[^>]+>/g, ""),
  );
}

export async function extractDocxText(buffer: Buffer): Promise<DocxExtraction> {
  const { value: html } = await mammoth.convertToHtml(
    { buffer },
    { convertImage: mammoth.images.imgElement(() => Promise.resolve({ src: "" })) },
  );
  const links = [...html.matchAll(/<a[^>]+href="([^"]{1,300})"/gi)]
    .map((match) => decodeEntities(match[1]))
    .filter((href) => /^(?:https?:|mailto:|www\.)/i.test(href))
    .slice(0, 50);
  return { text: htmlToText(html), hasTables: /<table[\s>]/i.test(html), links };
}
