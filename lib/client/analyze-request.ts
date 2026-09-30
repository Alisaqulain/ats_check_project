import { analysisResultSchema } from "@/lib/validation/analysis-schema";
import type { AnalysisResult, AnalysisStage, AnalyzeStreamEvent, ApiError } from "@/types/analysis";

const REQUEST_TIMEOUT_MS = 60_000;

export class AnalyzeError extends Error {
  constructor(public readonly error: ApiError) {
    super(error.message);
  }
}

interface Callbacks {
  onUploadProgress?: (percent: number) => void;
  onUploaded?: () => void;
  onStage?: (stage: AnalysisStage) => void;
  signal?: AbortSignal;
}

const GENERIC_ERROR: ApiError = {
  code: "ANALYSIS_FAILED",
  message: "Something went wrong while analyzing your resume. Please try again.",
};

function parseErrorBody(body: string, status: number): ApiError {
  try {
    const parsed = JSON.parse(body) as { error?: ApiError };
    if (parsed.error?.message) return parsed.error;
  } catch {
    // Fall through to status-based messages.
  }
  if (status === 413) return { code: "FILE_TOO_LARGE", message: "This file is too large. The maximum supported size is 5 MB." };
  if (status === 429) return { code: "RATE_LIMITED", message: "Too many analyses in a short time. Please wait a minute and try again." };
  return GENERIC_ERROR;
}

export function analyzeResumeRequest(file: File, jobDescription: string, callbacks: Callbacks = {}): Promise<AnalysisResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let consumed = 0;
    let settled = false;

    const finish = (outcome: { result: AnalysisResult } | { error: ApiError }) => {
      if (settled) return;
      settled = true;
      if ("result" in outcome) resolve(outcome.result);
      else reject(new AnalyzeError(outcome.error));
    };

    const consumeLines = (final: boolean) => {
      const text = xhr.responseText;
      const lastNewline = text.lastIndexOf("\n");
      const end = final ? text.length : lastNewline + 1;
      if (end <= consumed) return;
      const chunk = text.slice(consumed, end);
      consumed = end;
      for (const line of chunk.split("\n")) {
        if (!line.trim()) continue;
        let event: AnalyzeStreamEvent;
        try {
          event = JSON.parse(line) as AnalyzeStreamEvent;
        } catch {
          continue;
        }
        if (event.type === "stage") callbacks.onStage?.(event.stage);
        else if (event.type === "error") finish({ error: event.error });
        else if (event.type === "result") {
          const parsed = analysisResultSchema.safeParse(event.data);
          finish(parsed.success ? { result: parsed.data } : { error: { code: "ANALYSIS_FAILED", message: "The analysis response was incomplete. Please try again." } });
        }
      }
    };

    xhr.open("POST", "/api/analyze");
    xhr.timeout = REQUEST_TIMEOUT_MS;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) callbacks.onUploadProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    xhr.upload.onload = () => callbacks.onUploaded?.();

    xhr.onprogress = () => {
      if (xhr.status === 200) consumeLines(false);
    };
    xhr.onload = () => {
      if (xhr.status !== 200) {
        finish({ error: parseErrorBody(xhr.responseText, xhr.status) });
        return;
      }
      consumeLines(true);
      finish({ error: GENERIC_ERROR });
    };
    xhr.onerror = () =>
      finish({ error: { code: "NETWORK_ERROR", message: "Network error. Please check your connection and try again." } });
    xhr.ontimeout = () =>
      finish({ error: { code: "TIMEOUT", message: "The analysis took too long to respond. Please try again." } });
    xhr.onabort = () => finish({ error: { code: "NETWORK_ERROR", message: "The analysis was cancelled." } });

    callbacks.signal?.addEventListener("abort", () => xhr.abort(), { once: true });

    const form = new FormData();
    form.append("resume", file);
    form.append("jobDescription", jobDescription);
    xhr.send(form);
  });
}
