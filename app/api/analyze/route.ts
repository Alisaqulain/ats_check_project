import { NextResponse } from "next/server";
import { analyzeResume } from "@/lib/analysis";
import { MAX_FILE_SIZE_BYTES } from "@/lib/constants";
import { extractResumeText } from "@/lib/parsing/extract";
import { checkRateLimit, clientKey } from "@/lib/server/rate-limit";
import { jobDescriptionSchema, validateResumeFile, verifyFileSignature } from "@/lib/validation/upload";
import type { AnalysisStage, AnalyzeStreamEvent, ApiError, ApiErrorCode } from "@/types/analysis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MULTIPART_OVERHEAD = 64 * 1024;

function errorResponse(status: number, code: ApiErrorCode, message: string, headers?: HeadersInit) {
  return NextResponse.json({ error: { code, message } satisfies ApiError }, { status, headers });
}

function extractLinks(text: string): string[] {
  return (text.match(/https?:\/\/[^\s)>\]]+|(?:www\.)?(?:linkedin|github)\.com\/[^\s)>\]]+/gi) ?? []).slice(0, 50);
}

export async function POST(request: Request) {
  const limit = checkRateLimit(clientKey(request.headers));
  if (!limit.allowed) {
    return errorResponse(429, "RATE_LIMITED", `Too many analyses in a short time. Please wait ${limit.retryAfterSeconds} seconds and try again.`, {
      "Retry-After": String(limit.retryAfterSeconds),
    });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    return errorResponse(415, "INVALID_REQUEST", "Invalid request format. Please submit the form again.");
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_FILE_SIZE_BYTES + 32 * 1024 + MULTIPART_OVERHEAD + 64 * 1024) {
    return errorResponse(413, "FILE_TOO_LARGE", "This file is too large. The maximum supported size is 5 MB.");
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return errorResponse(400, "INVALID_REQUEST", "We couldn't read the uploaded data. Please try again.");
  }

  const file = form.get("resume");
  if (!(file instanceof File)) {
    return errorResponse(400, "MISSING_FILE", "Please upload your resume (PDF or DOCX).");
  }

  const fileCheck = validateResumeFile({ name: file.name, size: file.size, type: file.type });
  if (!fileCheck.ok) {
    const status = fileCheck.error.code === "FILE_TOO_LARGE" ? 413 : fileCheck.error.code === "UNSUPPORTED_FILE" ? 415 : 400;
    return errorResponse(status, fileCheck.error.code, fileCheck.error.message);
  }

  const rawDescription = form.get("jobDescription");
  const description = jobDescriptionSchema.safeParse(typeof rawDescription === "string" ? rawDescription : "");
  if (!description.success) {
    const issue = description.error.issues[0];
    const code = ((issue as { params?: { code?: ApiErrorCode } }).params?.code ?? "JOB_DESCRIPTION_REQUIRED") as ApiErrorCode;
    return errorResponse(400, code, issue.message);
  }

  const fileType = fileCheck.fileType;
  const fileMeta = { name: file.name, size: file.size };
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: AnalyzeStreamEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      const stage = async (name: AnalysisStage) => {
        send({ type: "stage", stage: name });
        // Yield so each stage event is flushed to the client before the next step runs.
        await new Promise((resolve) => setTimeout(resolve, 0));
      };

      try {
        await stage("reading");
        const buffer = Buffer.from(await file.arrayBuffer());
        if (!verifyFileSignature(buffer, fileType)) {
          send({
            type: "error",
            error: {
              code: "UNSUPPORTED_FILE",
              message: `This file isn't a valid ${fileType.toUpperCase()} document. It may be renamed or corrupted. Please upload a real PDF or DOCX file.`,
            },
          });
          return;
        }

        await stage("extracting");
        const extraction = await extractResumeText(buffer, fileType);
        if (!extraction.ok) {
          send({ type: "error", error: extraction.error });
          return;
        }

        const result = await analyzeResume({
          resumeText: extraction.resume.text,
          links: [...extraction.resume.links, ...extractLinks(extraction.resume.text)],
          jobDescription: description.data,
          file: { name: fileMeta.name, type: fileType, size: fileMeta.size, pageCount: extraction.resume.pageCount },
          multiColumn: extraction.resume.multiColumn,
          hasTables: extraction.resume.hasTables,
          onStage: stage,
        });
        send({ type: "result", data: result });
      } catch (error) {
        // Log only the error type — never resume content or personal data.
        console.error("[analyze] analysis failed:", error instanceof Error ? error.name : "UnknownError");
        send({
          type: "error",
          error: { code: "ANALYSIS_FAILED", message: "Something went wrong while analyzing your resume. Please try again." },
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export function GET() {
  return errorResponse(405, "INVALID_REQUEST", "Use POST with multipart/form-data to analyze a resume.", { Allow: "POST" });
}
