import "server-only";
import { RESUME_MIN_WORDS, RESUME_TEXT_MAX_CHARS, UNREADABLE_RESUME_MESSAGE } from "@/lib/constants";
import type { ResumeFileType } from "@/lib/validation/upload";
import type { ApiError } from "@/types/analysis";
import { extractDocxText } from "./docx";
import { hasMeaningfulText, normalizeText } from "./normalize";
import { extractPdfText } from "./pdf";

export interface ExtractedResume {
  text: string;
  pageCount: number | null;
  multiColumn: boolean;
  hasTables: boolean;
  /** Hyperlink targets embedded in the document (often hidden behind link text). */
  links: string[];
}

export type ExtractionOutcome = { ok: true; resume: ExtractedResume } | { ok: false; error: ApiError };

export async function extractResumeText(
  buffer: Buffer,
  fileType: ResumeFileType,
): Promise<ExtractionOutcome> {
  let raw: string;
  let pageCount: number | null = null;
  let multiColumn = false;
  let hasTables = false;
  let links: string[] = [];

  try {
    if (fileType === "pdf") {
      const pdf = await extractPdfText(new Uint8Array(buffer));
      raw = pdf.text;
      pageCount = pdf.pageCount;
      multiColumn = pdf.multiColumn;
      links = pdf.links;
    } else {
      const docx = await extractDocxText(buffer);
      raw = docx.text;
      hasTables = docx.hasTables;
      links = docx.links;
    }
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (fileType === "pdf" && name === "PasswordException") {
      return {
        ok: false,
        error: {
          code: "PDF_PARSE_ERROR",
          message: "This PDF is password-protected. Please upload an unlocked copy of your resume.",
        },
      };
    }
    return {
      ok: false,
      error:
        fileType === "pdf"
          ? {
              code: "PDF_PARSE_ERROR",
              message: "We couldn't read this PDF. It may be damaged or use an unsupported format. Try re-exporting it as a PDF or upload a DOCX instead.",
            }
          : {
              code: "DOCX_PARSE_ERROR",
              message: "We couldn't read this DOCX file. It may be damaged or saved in an older Word format. Try re-saving it as .docx or upload a PDF instead.",
            },
    };
  }

  const text = normalizeText(raw).slice(0, RESUME_TEXT_MAX_CHARS);
  if (!hasMeaningfulText(text, RESUME_MIN_WORDS)) {
    return { ok: false, error: { code: "UNREADABLE_RESUME", message: UNREADABLE_RESUME_MESSAGE } };
  }

  return { ok: true, resume: { text, pageCount, multiColumn, hasTables, links } };
}
