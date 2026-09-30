import { z } from "zod";
import {
  ACCEPTED_FILE_TYPES,
  JOB_DESCRIPTION_MAX_CHARS,
  JOB_DESCRIPTION_MIN_CHARS,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_LABEL,
} from "@/lib/constants";
import { getFileExtension } from "@/lib/utils";
import type { ApiError } from "@/types/analysis";

export type ResumeFileType = keyof typeof ACCEPTED_FILE_TYPES;

type FileLike = { name: string; size: number; type: string };

export type FileValidation =
  | { ok: true; fileType: ResumeFileType }
  | { ok: false; error: ApiError };

/**
 * Validates metadata that is available both in the browser and on the server.
 * The server additionally verifies the file signature (see `verifyFileSignature`).
 */
export function validateResumeFile(file: FileLike): FileValidation {
  const extension = getFileExtension(file.name);
  const fileType = (Object.keys(ACCEPTED_FILE_TYPES) as ResumeFileType[]).find(
    (key) => ACCEPTED_FILE_TYPES[key].extension === extension,
  );

  if (!fileType) {
    return {
      ok: false,
      error: {
        code: "UNSUPPORTED_FILE",
        message: "Unsupported file type. Please upload your resume as a PDF or DOCX file.",
      },
    };
  }

  const allowedMimes: readonly string[] = ACCEPTED_FILE_TYPES[fileType].mimeTypes;
  // Some browsers/OSes send an empty or generic MIME type; the signature check covers those cases.
  const genericMime = file.type === "" || file.type === "application/octet-stream";
  if (!genericMime && !allowedMimes.includes(file.type)) {
    return {
      ok: false,
      error: {
        code: "UNSUPPORTED_FILE",
        message: `This file doesn't look like a valid ${ACCEPTED_FILE_TYPES[fileType].label}. Please upload a PDF or DOCX resume.`,
      },
    };
  }

  if (file.size === 0) {
    return { ok: false, error: { code: "EMPTY_FILE", message: "The selected file is empty." } };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      ok: false,
      error: {
        code: "FILE_TOO_LARGE",
        message: `This file is too large. The maximum supported size is ${MAX_FILE_SIZE_LABEL}.`,
      },
    };
  }

  return { ok: true, fileType };
}

/** Checks the leading bytes so a renamed file can't masquerade as a PDF/DOCX. */
export function verifyFileSignature(bytes: Uint8Array, fileType: ResumeFileType): boolean {
  if (fileType === "pdf") {
    // "%PDF-" may be preceded by a few junk bytes in some generators.
    const head = new TextDecoder("latin1").decode(bytes.subarray(0, 1024));
    return head.includes("%PDF-");
  }
  // DOCX files are ZIP archives: "PK\x03\x04".
  return bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
}

export const jobDescriptionSchema = z
  .string({ error: "Please paste the job description." })
  .transform((value) => value.replace(/\r\n?/g, "\n").trim())
  .superRefine((value, ctx) => {
    if (value.length === 0) {
      ctx.addIssue({ code: "custom", message: "Please paste the job description.", params: { code: "JOB_DESCRIPTION_REQUIRED" } });
    } else if (value.length < JOB_DESCRIPTION_MIN_CHARS) {
      ctx.addIssue({
        code: "custom",
        message: `The job description is too short to analyze. Please paste the full posting (at least ${JOB_DESCRIPTION_MIN_CHARS} characters).`,
        params: { code: "JOB_DESCRIPTION_TOO_SHORT" },
      });
    } else if (value.length > JOB_DESCRIPTION_MAX_CHARS) {
      ctx.addIssue({
        code: "custom",
        message: `The job description is too long. Please keep it under ${JOB_DESCRIPTION_MAX_CHARS.toLocaleString("en-US")} characters.`,
        params: { code: "JOB_DESCRIPTION_TOO_LONG" },
      });
    }
  });
