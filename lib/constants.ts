export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_FILE_SIZE_LABEL = "5 MB";

export const JOB_DESCRIPTION_MIN_CHARS = 80;
export const JOB_DESCRIPTION_MAX_CHARS = 15000;

/** Resume text beyond this is truncated before analysis to bound processing cost. */
export const RESUME_TEXT_MAX_CHARS = 60000;
export const RESUME_MIN_WORDS = 30;

export const ACCEPTED_FILE_TYPES = {
  pdf: {
    extension: ".pdf",
    mimeTypes: ["application/pdf", "application/x-pdf"],
    label: "PDF",
  },
  docx: {
    extension: ".docx",
    mimeTypes: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    label: "DOCX",
  },
} as const;

export const ACCEPT_ATTRIBUTE =
  ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export const UNREADABLE_RESUME_MESSAGE =
  "Could not extract readable text from this file. Please upload a text-based PDF or DOCX resume.";

export const RESULT_STORAGE_KEY = "resumeai:analysis";

export const DEVELOPER = {
  name: "Ali Saqulain",
  handle: "github.com/Alisaqulain",
  url: "https://github.com/Alisaqulain/",
} as const;
