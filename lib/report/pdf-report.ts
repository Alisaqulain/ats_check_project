import type { AnalysisResult, Importance } from "@/types/analysis";
import { SCORE_BAND_LABEL, SCORE_WEIGHTS } from "@/lib/scoring/weights";

type RGB = [number, number, number];

const COLORS = {
  text: [24, 24, 36] as RGB,
  muted: [100, 102, 120] as RGB,
  border: [226, 228, 236] as RGB,
  track: [238, 239, 245] as RGB,
  primary: [79, 70, 229] as RGB,
  success: [22, 150, 90] as RGB,
  warning: [200, 120, 10] as RGB,
  danger: [210, 50, 50] as RGB,
};

const LEVEL: Record<Importance, string> = { high: "High", medium: "Medium", low: "Low" };

/** jsPDF's built-in fonts only cover Latin-1, so normalize typographic characters and drop the rest. */
function sanitize(value: string): string {
  return value
    .replace(/[“”„]/g, '"')
    .replace(/[‘’‚]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/•/g, "-")
    .replace(/…/g, "...")
    .replace(/×/g, "x")
    .replace(/Σ/g, "Sum")
    .replace(/→/g, "->")
    .replace(/[^\x20-\x7E\n\u00A0-\u00FF]/g, "");
}

function toneColor(score: number): RGB {
  if (score >= 75) return COLORS.success;
  if (score >= 55) return COLORS.warning;
  return COLORS.danger;
}

export async function downloadPdfReport(result: AnalysisResult): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const ensure = (height: number) => {
    if (y + height > pageHeight - margin - 16) {
      doc.addPage();
      y = margin;
    }
  };

  const write = (
    value: string,
    options: { size?: number; bold?: boolean; color?: RGB; indent?: number; gap?: number; lineHeight?: number } = {},
  ) => {
    const { size = 10, bold = false, color = COLORS.text, indent = 0, gap = 4, lineHeight = 1.4 } = options;
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(sanitize(value), contentWidth - indent) as string[];
    const lh = size * lineHeight;
    for (const line of lines) {
      ensure(lh);
      doc.text(line, margin + indent, y + size);
      y += lh;
    }
    y += gap;
  };

  const heading = (value: string) => {
    ensure(40);
    y += 10;
    write(value, { size: 14, bold: true, gap: 2 });
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;
  };

  const bullets = (items: string[], color: RGB = COLORS.text) => {
    for (const item of items) write(`-  ${item}`, { indent: 8, color, gap: 2 });
    y += 2;
  };

  const scoreBar = (label: string, score: number, note?: string) => {
    ensure(34);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.text);
    doc.text(sanitize(label), margin, y + 10);
    doc.setFont("helvetica", "bold");
    doc.text(`${score}/100`, pageWidth - margin, y + 10, { align: "right" });
    y += 16;
    doc.setFillColor(...COLORS.track);
    doc.roundedRect(margin, y, contentWidth, 6, 3, 3, "F");
    doc.setFillColor(...toneColor(score));
    doc.roundedRect(margin, y, Math.max(6, (contentWidth * score) / 100), 6, 3, 3, "F");
    y += 12;
    if (note) write(note, { size: 8.5, color: COLORS.muted, gap: 6 });
  };

  // Header
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 6, "F");
  write("ResumeAI - ATS Analysis Report", { size: 20, bold: true, gap: 6 });
  const analyzed = new Date(result.meta.analyzedAt);
  write(
    [
      `Resume: ${result.meta.fileName}`,
      result.meta.jobTitle ? `Target role: ${result.meta.jobTitle}` : null,
      `Generated: ${analyzed.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}`,
    ]
      .filter(Boolean)
      .join("   |   "),
    { size: 9, color: COLORS.muted, gap: 14 },
  );

  // Overall score block
  ensure(90);
  const boxTop = y;
  doc.setDrawColor(...COLORS.border);
  doc.setFillColor(248, 248, 252);
  doc.roundedRect(margin, boxTop, contentWidth, 78, 8, 8, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(34);
  doc.setTextColor(...toneColor(result.overallScore));
  doc.text(String(result.overallScore), margin + 20, boxTop + 48);
  const scoreWidth = doc.getTextWidth(String(result.overallScore));
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.muted);
  doc.text("/ 100", margin + 26 + scoreWidth, boxTop + 48);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.text);
  doc.text("ATS Compatibility Estimate", margin + 130, boxTop + 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...toneColor(result.overallScore));
  doc.text(SCORE_BAND_LABEL[result.scoreBand], margin + 130, boxTop + 46);
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text("Estimate based on text analysis. Not a guarantee of any specific ATS outcome.", margin + 130, boxTop + 62);
  y = boxTop + 92;

  write(result.summary, { size: 10, gap: 8 });

  heading("Score breakdown");
  const cards: [keyof AnalysisResult["scoreExplanations"], string][] = [
    ["atsCompatibility", "ATS Compatibility"],
    ["keywordMatch", "Keyword Match"],
    ["skillsMatch", "Skills Match"],
    ["experienceMatch", "Experience Match"],
    ["educationMatch", "Education Match"],
    ["formattingScore", "Formatting"],
    ["structureScore", "Resume Structure"],
  ];
  for (const [key, label] of cards) scoreBar(label, result[key], result.scoreExplanations[key]);

  heading("How the score is calculated");
  for (const item of SCORE_WEIGHTS) {
    const entry = result.scoreBreakdown.find((b) => b.key === item.key);
    write(`${item.label} - ${Math.round(item.weight * 100)}% weight, score ${entry?.score ?? 0}/100, contributes ${entry?.contribution ?? 0} pts`, { bold: true, size: 9.5, gap: 1 });
    write(item.description, { size: 8.5, color: COLORS.muted, gap: 6 });
  }

  heading(`Matched keywords (${result.matchedKeywords.length})`);
  if (result.matchedKeywords.length === 0) write("No job keywords were found in the resume.", { color: COLORS.muted });
  for (const level of ["high", "medium", "low"] as Importance[]) {
    const items = result.matchedKeywords.filter((k) => k.importance === level).map((k) => k.keyword);
    if (items.length > 0) write(`${LEVEL[level]} importance: ${items.join(", ")}`, { gap: 4 });
  }

  heading(`Missing keywords (${result.missingKeywords.length})`);
  if (result.missingKeywords.length === 0) write("No missing keywords identified.", { color: COLORS.muted });
  for (const keyword of result.missingKeywords) {
    write(`${keyword.keyword}  (${LEVEL[keyword.importance]} importance)`, { bold: true, size: 10, gap: 1 });
    write(keyword.reason, { size: 9, color: COLORS.muted, gap: 6 });
  }

  heading("Skills");
  write(`Matched: ${result.skills.matched.join(", ") || "None"}`, { gap: 4 });
  write(`Missing: ${result.skills.missing.join(", ") || "None"}`, { gap: 4 });
  write(`Additional (not requested by this job): ${result.skills.additional.join(", ") || "None"}`, { gap: 4 });
  write("Only add a skill if you genuinely have the experience.", { size: 9, color: COLORS.muted, gap: 6 });

  if (result.comparison.length > 0) {
    heading("Resume vs. job description");
    const cols = [0, 0.34, 0.62, 0.82].map((f) => margin + contentWidth * f);
    const header = ["Skill", "Resume", "Job", "Status"];
    ensure(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.muted);
    header.forEach((h, i) => doc.text(h, cols[i], y + 9));
    y += 16;
    for (const row of result.comparison) {
      ensure(16);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.text);
      const resumeLabel = row.resume === "found" ? "Found" : row.resume === "related" ? "Related found" : "Not found";
      const jobLabel = row.job.charAt(0).toUpperCase() + row.job.slice(1);
      doc.text(sanitize(row.skill).slice(0, 34), cols[0], y + 9);
      doc.text(resumeLabel, cols[1], y + 9);
      doc.text(jobLabel, cols[2], y + 9);
      doc.setTextColor(...(row.status === "matched" ? COLORS.success : row.status === "partial" ? COLORS.warning : COLORS.danger));
      doc.text(row.status.charAt(0).toUpperCase() + row.status.slice(1), cols[3], y + 9);
      y += 14;
      doc.setDrawColor(...COLORS.track);
      doc.line(margin, y, pageWidth - margin, y);
      y += 2;
    }
    y += 6;
  }

  heading("Section analysis");
  for (const section of result.sections) {
    write(`${section.name}: ${section.found ? `${section.score}/100` : section.optional ? "Not included (optional)" : "Not found"}`, { bold: true, gap: 2 });
    if (section.strengths.length) bullets(section.strengths.map((s) => `Strength: ${s}`), COLORS.muted);
    if (section.issues.length) bullets(section.issues.map((s) => `Problem: ${s}`));
    if (section.suggestions.length) bullets(section.suggestions.map((s) => `Suggestion: ${s}`), COLORS.muted);
    y += 4;
  }

  heading(`Issues to fix (${result.issues.length})`);
  if (result.issues.length === 0) write("No significant issues detected.", { color: COLORS.muted });
  for (const issue of result.issues) {
    write(`[${LEVEL[issue.severity]}] ${issue.title}`, {
      bold: true,
      color: issue.severity === "high" ? COLORS.danger : issue.severity === "medium" ? COLORS.warning : COLORS.text,
      gap: 1,
    });
    write(issue.description, { size: 9.5, gap: 1 });
    write(`Fix: ${issue.suggestion}`, { size: 9, color: COLORS.muted, gap: 8 });
  }

  heading("Recommendations");
  bullets(result.suggestions);

  heading(`Rewrite suggestions (${result.rewriteSuggestions.length})`);
  if (result.rewriteSuggestions.length === 0) write("No rewrites needed. Your statements are already strong.", { color: COLORS.muted });
  for (const rewrite of result.rewriteSuggestions) {
    write(rewrite.section, { bold: true, color: COLORS.primary, gap: 2 });
    write(`Original: ${rewrite.original}`, { size: 9.5, color: COLORS.muted, gap: 2 });
    write(`Suggested: ${rewrite.improved}`, { size: 9.5, gap: 2 });
    write(rewrite.explanation, { size: 8.5, color: COLORS.muted, gap: 10 });
  }

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text("ResumeAI - estimates only; resumes are not stored.", margin, pageHeight - 24);
    doc.text(`Page ${page} of ${pages}`, pageWidth - margin, pageHeight - 24, { align: "right" });
  }

  const base = sanitize(result.meta.fileName.replace(/\.[^.]+$/, "")).replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "resume";
  doc.save(`resumeai-report-${base}.pdf`);
}
