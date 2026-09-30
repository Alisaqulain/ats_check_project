"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Briefcase, FileSearch, FileText, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { AnalyzeError, analyzeResumeRequest } from "@/lib/client/analyze-request";
import { JOB_DESCRIPTION_MAX_CHARS, JOB_DESCRIPTION_MIN_CHARS, RESULT_STORAGE_KEY } from "@/lib/constants";
import { analysisResultSchema } from "@/lib/validation/analysis-schema";
import type { AnalysisResult, ApiError } from "@/types/analysis";
import { AnalyzeButton } from "./analyze-button";
import { JobDescriptionInput } from "./job-description-input";
import { LoadingAnalysis, STAGES } from "./loading-analysis";
import { ResumeUploader } from "./resume-uploader";

const ResultsDashboard = dynamic(
  () => import("@/components/results/results-dashboard").then((mod) => mod.ResultsDashboard),
  { ssr: false, loading: () => <LoadingAnalysis activeIndex={STAGES.length - 1} uploadProgress={null} /> },
);

/** Minimum time each completed stage stays visible so the steps are readable. */
const STAGE_DISPLAY_MS = 420;

type Status = "idle" | "analyzing" | "error" | "done";

const subscribeNoop = () => () => {};

function StepBadge({ step, icon: Icon }: { step: number; icon: LucideIcon }) {
  return (
    <span className="relative">
      <span className="bg-brand flex size-9 items-center justify-center rounded-xl text-white shadow-glow">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="absolute -right-1.5 -top-1.5 flex size-4.5 items-center justify-center rounded-full border-2 border-card bg-foreground text-[9px] font-bold text-background">
        <span className="sr-only">Step </span>
        {step}
      </span>
    </span>
  );
}

function loadStoredResult(): AnalysisResult | null {
  try {
    const raw = sessionStorage.getItem(RESULT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = analysisResultSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function AnalyzerApp() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const showingResultParam = searchParams.get("result") === "temporary";

  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<ApiError | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [dismissedRestore, setDismissedRestore] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [receivedStage, setReceivedStage] = useState(-1);
  const [displayedStage, setDisplayedStage] = useState(-1);
  const pendingResult = useRef<AnalysisResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // sessionStorage only exists in the browser, so read it after hydration.
  const isClient = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const restoredResult = useMemo(
    () => (isClient && showingResultParam ? loadStoredResult() : null),
    [isClient, showingResultParam],
  );

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (status !== "analyzing" || displayedStage >= receivedStage) return;
    const timer = setTimeout(() => setDisplayedStage((index) => index + 1), displayedStage < 0 ? 0 : STAGE_DISPLAY_MS);
    return () => clearTimeout(timer);
  }, [status, displayedStage, receivedStage]);

  useEffect(() => {
    if (status !== "analyzing" || !pendingResult.current || displayedStage < STAGES.length - 1) return;
    const timer = setTimeout(() => {
      const finished = pendingResult.current;
      if (!finished) return;
      pendingResult.current = null;
      try {
        sessionStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(finished));
      } catch {
        // Storage may be unavailable (private mode / quota); results still render in memory.
      }
      setResult(finished);
      setStatus("done");
      router.replace(`${pathname}?result=temporary`, { scroll: false });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, STAGE_DISPLAY_MS);
    return () => clearTimeout(timer);
  }, [status, displayedStage, pathname, router]);

  const disabledReason = !file
    ? "Upload your resume to continue."
    : jobDescription.trim().length === 0
      ? "Paste the job description to continue."
      : jobDescription.trim().length < JOB_DESCRIPTION_MIN_CHARS
        ? "The job description is too short."
        : jobDescription.length > JOB_DESCRIPTION_MAX_CHARS
          ? "The job description is too long."
          : null;

  const analyze = useCallback(async () => {
    if (!file || disabledReason) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("analyzing");
    setError(null);
    setUploadProgress(0);
    setReceivedStage(-1);
    setDisplayedStage(-1);
    pendingResult.current = null;

    try {
      const analysis = await analyzeResumeRequest(file, jobDescription, {
        signal: controller.signal,
        onUploadProgress: setUploadProgress,
        onUploaded: () => setUploadProgress(100),
        onStage: (stage) => {
          const index = STAGES.findIndex((item) => item.key === stage);
          setReceivedStage((current) => Math.max(current, index));
        },
      });
      pendingResult.current = analysis;
      setReceivedStage(STAGES.length - 1);
    } catch (caught) {
      if (controller.signal.aborted) return;
      setError(
        caught instanceof AnalyzeError
          ? caught.error
          : { code: "ANALYSIS_FAILED", message: "Something went wrong while analyzing your resume. Please try again." },
      );
      setStatus("error");
      setUploadProgress(null);
      requestAnimationFrame(() => headingRef.current?.focus());
    }
  }, [file, jobDescription, disabledReason]);

  const startNew = useCallback(() => {
    abortRef.current?.abort();
    try {
      sessionStorage.removeItem(RESULT_STORAGE_KEY);
    } catch {
      // Ignore storage errors.
    }
    setResult(null);
    setDismissedRestore(true);
    setStatus("idle");
    setError(null);
    setUploadProgress(null);
    setFile(null);
    setJobDescription("");
    router.replace(pathname, { scroll: false });
    window.scrollTo({ top: 0 });
  }, [pathname, router]);

  const activeResult = status === "done" ? result : status === "idle" && !dismissedRestore ? restoredResult : null;
  if (activeResult) {
    return <ResultsDashboard result={activeResult} onNewAnalysis={startNew} />;
  }

  if (showingResultParam && isClient && status === "idle" && !dismissedRestore) {
    return (
      <EmptyState
        icon={FileSearch}
        title="No analysis to show"
        description="Results are temporary and only kept in this browser tab. Start a new analysis to see your report."
        className="bg-card py-16"
      >
        <Button onClick={startNew}>Start a new analysis</Button>
      </EmptyState>
    );
  }

  const analyzing = status === "analyzing";

  return (
    <div className="animate-fade-up space-y-6">
      <div className="text-center sm:text-left">
        <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="size-3" aria-hidden="true" />
          ATS Analyzer
        </p>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="mt-4 text-3xl font-semibold tracking-tight outline-none sm:text-4xl"
        >
          Analyze your <span className="text-gradient">resume</span>
        </h1>
        <p className="mt-3 text-muted-foreground">
          Upload your resume and paste the job description. The analysis takes a few seconds.
        </p>
      </div>

      {status === "error" && error && (
        <ErrorState title="We couldn't complete the analysis" message={error.message}>
          <Button size="sm" onClick={analyze} disabled={Boolean(disabledReason)}>
            Try again
          </Button>
          {(error.code === "UNREADABLE_RESUME" || error.code === "PDF_PARSE_ERROR" || error.code === "DOCX_PARSE_ERROR" || error.code === "UNSUPPORTED_FILE") && (
            <Button size="sm" variant="outline" onClick={() => setFile(null)}>
              Choose a different file
            </Button>
          )}
        </ErrorState>
      )}

      {analyzing ? (
        <LoadingAnalysis activeIndex={displayedStage} uploadProgress={uploadProgress} />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <StepBadge step={1} icon={FileText} />
                  Resume
                </CardTitle>
                <CardDescription>Text-based PDF or DOCX works best.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <ResumeUploader file={file} onFileChange={setFile} disabled={analyzing} uploadProgress={uploadProgress} />
              </CardContent>
            </Card>

            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <StepBadge step={2} icon={Briefcase} />
                  Job description
                </CardTitle>
                <CardDescription>Paste the complete posting for the role you&apos;re targeting.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <JobDescriptionInput value={jobDescription} onChange={setJobDescription} disabled={analyzing} />
              </CardContent>
            </Card>
          </div>

          <div className="glass flex flex-col gap-4 rounded-3xl border border-border/70 p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <p className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-success-soft text-success">
                <ShieldCheck className="size-4" aria-hidden="true" />
              </span>
              Your resume is processed in memory and never stored.
            </p>
            <AnalyzeButton onClick={analyze} disabledReason={disabledReason} loading={analyzing} />
          </div>
        </>
      )}
    </div>
  );
}
