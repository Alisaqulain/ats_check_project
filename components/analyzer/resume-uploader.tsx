"use client";

import { useId, useRef, useState } from "react";
import { CircleCheck, CloudUpload, FileText, LoaderCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ACCEPT_ATTRIBUTE, ACCEPTED_FILE_TYPES, MAX_FILE_SIZE_LABEL } from "@/lib/constants";
import { cn, formatBytes } from "@/lib/utils";
import { validateResumeFile, verifyFileSignature } from "@/lib/validation/upload";

interface ResumeUploaderProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
  uploadProgress?: number | null;
}

export function ResumeUploader({ file, onFileChange, disabled, uploadProgress }: ResumeUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorId = useId();
  const hintId = useId();

  const handleFile = async (candidate: File | undefined) => {
    if (!candidate) return;
    setError(null);
    const result = validateResumeFile(candidate);
    if (!result.ok) {
      setError(result.error.message);
      onFileChange(null);
      return;
    }
    setChecking(true);
    try {
      const head = new Uint8Array(await candidate.slice(0, 1024).arrayBuffer());
      if (!verifyFileSignature(head, result.fileType)) {
        setError(`This file isn't a valid ${ACCEPTED_FILE_TYPES[result.fileType].label} document. It may be renamed or corrupted.`);
        onFileChange(null);
        return;
      }
      onFileChange(candidate);
    } catch {
      setError("We couldn't read this file. Please try selecting it again.");
      onFileChange(null);
    } finally {
      setChecking(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = () => {
    setError(null);
    onFileChange(null);
  };

  const type = file?.name.toLowerCase().endsWith(".pdf") ? "PDF" : "DOCX";

  return (
    <div className="flex h-full flex-col">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTRIBUTE}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        disabled={disabled}
        onChange={(event) => handleFile(event.target.files?.[0])}
      />

      {file ? (
        <div className="flex flex-1 flex-col justify-center rounded-2xl border border-primary/20 bg-primary/[0.03] p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="bg-brand flex size-11 shrink-0 items-center justify-center rounded-xl text-white shadow-glow">
              <FileText className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium" title={file.name}>
                {file.name}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {type} · {formatBytes(file.size)}
              </p>
              {uploadProgress !== null && uploadProgress !== undefined ? (
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>{uploadProgress < 100 ? "Uploading…" : "Uploaded"}</span>
                    <span className="tabular-nums">{uploadProgress}%</span>
                  </div>
                  <div
                    className="h-1.5 overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-label="Upload progress"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={uploadProgress}
                  >
                    <div className="bg-brand h-full rounded-full transition-[width]" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              ) : (
                <p className="mt-2 inline-flex items-center gap-1 text-xs text-success">
                  <CircleCheck className="size-3.5" aria-hidden="true" />
                  Ready to analyze
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={remove}
              disabled={disabled}
              aria-label={`Remove ${file.name}`}
              className="-mr-1 -mt-1 size-8"
            >
              <X aria-hidden="true" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            if (!disabled) handleFile(event.dataTransfer.files?.[0]);
          }}
          className={cn(
            "group flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-all duration-200",
            dragging ? "scale-[1.01] border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-primary/[0.03]",
            error && "border-danger/50",
          )}
        >
          <div
            className={cn(
              "mb-4 flex size-14 items-center justify-center rounded-2xl transition-all duration-300",
              dragging
                ? "bg-brand -translate-y-1 text-white shadow-glow"
                : "bg-primary/10 text-primary group-hover:bg-brand group-hover:-translate-y-1 group-hover:text-white group-hover:shadow-glow",
            )}
          >
            {checking ? <LoaderCircle className="size-5 animate-spin" aria-hidden="true" /> : <CloudUpload className="size-5" aria-hidden="true" />}
          </div>
          <p className="text-sm font-medium">{checking ? "Checking file…" : "Drag and drop your resume here"}</p>
          <p id={hintId} className="mt-1 text-xs text-muted-foreground">
            PDF or DOCX, up to {MAX_FILE_SIZE_LABEL}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            disabled={disabled || checking}
            onClick={() => inputRef.current?.click()}
            aria-describedby={`${hintId}${error ? ` ${errorId}` : ""}`}
          >
            Choose file
          </Button>
        </div>
      )}

      {error && (
        <p id={errorId} role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
