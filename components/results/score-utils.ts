import type { Importance, ScoreBand, Severity } from "@/types/analysis";

export function scoreTone(score: number): "success" | "warning" | "danger" {
  if (score >= 75) return "success";
  if (score >= 55) return "warning";
  return "danger";
}

export const TONE_TEXT = { success: "text-success", warning: "text-warning", danger: "text-danger" } as const;
export const TONE_BG = { success: "bg-success", warning: "bg-warning", danger: "bg-danger" } as const;
export const TONE_VAR = { success: "var(--success)", warning: "var(--warning)", danger: "var(--danger)" } as const;

export const BAND_VARIANT: Record<ScoreBand, "success" | "warning" | "danger"> = {
  strong: "success",
  moderate: "warning",
  "needs-improvement": "danger",
};

export const IMPORTANCE_VARIANT: Record<Importance, "danger" | "warning" | "secondary"> = {
  high: "danger",
  medium: "warning",
  low: "secondary",
};

export const SEVERITY_VARIANT: Record<Severity, "danger" | "warning" | "secondary"> = IMPORTANCE_VARIANT;

export const LEVEL_LABEL: Record<Importance, string> = { high: "High", medium: "Medium", low: "Low" };
