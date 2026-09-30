"use client";

import { useState } from "react";
import { Download, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AnalysisResult } from "@/types/analysis";

export function ExportButton({ result }: { result: AnalysisResult }) {
  const [state, setState] = useState<"idle" | "working" | "error">("idle");

  const download = async () => {
    setState("working");
    try {
      const { downloadPdfReport } = await import("@/lib/report/pdf-report");
      await downloadPdfReport(result);
      setState("idle");
    } catch {
      setState("error");
    }
  };

  return (
    <div className="flex flex-col items-stretch gap-1 sm:items-end">
      <Button onClick={download} disabled={state === "working"} variant="outline">
        {state === "working" ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Download aria-hidden="true" />}
        {state === "working" ? "Generating…" : "Download Report"}
      </Button>
      {state === "error" && (
        <p role="alert" className="text-xs text-danger">
          Couldn&apos;t generate the PDF. Please try again.
        </p>
      )}
    </div>
  );
}
