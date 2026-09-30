import type { z } from "zod";
import type { analysisResultSchema, scoreKeySchema } from "@/lib/validation/analysis-schema";

export type AnalysisResult = z.infer<typeof analysisResultSchema>;
export type ScoreKey = z.infer<typeof scoreKeySchema>;
export type Importance = "high" | "medium" | "low";
export type Severity = "high" | "medium" | "low";
export type ScoreBand = AnalysisResult["scoreBand"];

export type MatchedKeyword = AnalysisResult["matchedKeywords"][number];
export type MissingKeyword = AnalysisResult["missingKeywords"][number];
export type SectionAnalysis = AnalysisResult["sections"][number];
export type ResumeIssue = AnalysisResult["issues"][number];
export type RewriteSuggestion = AnalysisResult["rewriteSuggestions"][number];
export type ComparisonRow = AnalysisResult["comparison"][number];

export type AnalysisStage =
  | "reading"
  | "extracting"
  | "comparing"
  | "keywords"
  | "recommendations"
  | "preparing";

export type AnalyzeStreamEvent =
  | { type: "stage"; stage: AnalysisStage }
  | { type: "result"; data: AnalysisResult }
  | { type: "error"; error: ApiError };

export type ApiErrorCode =
  | "INVALID_REQUEST"
  | "MISSING_FILE"
  | "UNSUPPORTED_FILE"
  | "FILE_TOO_LARGE"
  | "EMPTY_FILE"
  | "UNREADABLE_RESUME"
  | "PDF_PARSE_ERROR"
  | "DOCX_PARSE_ERROR"
  | "JOB_DESCRIPTION_REQUIRED"
  | "JOB_DESCRIPTION_TOO_SHORT"
  | "JOB_DESCRIPTION_TOO_LONG"
  | "RATE_LIMITED"
  | "ANALYSIS_FAILED"
  | "NETWORK_ERROR"
  | "TIMEOUT";

export interface ApiError {
  code: ApiErrorCode;
  message: string;
}
