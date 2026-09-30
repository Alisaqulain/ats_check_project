"use client";

import { useId } from "react";
import { Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JOB_DESCRIPTION_MAX_CHARS, JOB_DESCRIPTION_MIN_CHARS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const PLACEHOLDER = `Paste the full job description here, for example:

Senior Frontend Engineer

Requirements:
• 5+ years of experience building web applications
• Strong proficiency in React and TypeScript
• Experience with REST APIs and Node.js
• Familiarity with Docker and AWS is a plus`;

interface JobDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function JobDescriptionInput({ value, onChange, disabled }: JobDescriptionInputProps) {
  const id = useId();
  const counterId = useId();
  const length = value.trim().length;
  const tooLong = value.length > JOB_DESCRIPTION_MAX_CHARS;
  const tooShort = length > 0 && length < JOB_DESCRIPTION_MIN_CHARS;

  return (
    <div className="flex h-full flex-col">
      <label htmlFor={id} className="sr-only">
        Job description
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        placeholder={PLACEHOLDER}
        aria-describedby={counterId}
        aria-invalid={tooLong || tooShort || undefined}
        spellCheck={false}
        className={cn(
          "min-h-[260px] w-full flex-1 resize-y rounded-xl border bg-background px-4 py-3 text-sm leading-relaxed shadow-xs outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 disabled:opacity-60 lg:min-h-[300px]",
          (tooLong || tooShort) && "border-danger/60",
        )}
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <p id={counterId} className={cn("text-xs", tooLong || tooShort ? "text-danger" : "text-muted-foreground")} aria-live="polite">
          {tooShort
            ? `Add a bit more detail (at least ${JOB_DESCRIPTION_MIN_CHARS} characters).`
            : tooLong
              ? "Job description is too long."
              : "Include requirements and responsibilities for best results."}
          <span className="ml-2 tabular-nums">
            {value.length.toLocaleString("en-US")} / {JOB_DESCRIPTION_MAX_CHARS.toLocaleString("en-US")}
          </span>
        </p>
        <Button variant="ghost" size="sm" onClick={() => onChange("")} disabled={disabled || value.length === 0}>
          <Eraser aria-hidden="true" />
          Clear
        </Button>
      </div>
    </div>
  );
}
