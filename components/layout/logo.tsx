import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn("bg-brand inline-flex size-8 items-center justify-center rounded-[10px] shadow-glow", className)}
      aria-hidden="true"
    >
      <svg viewBox="0 0 32 32" className="size-full">
        <path d="M10 8.5h8.5L23 13v10.5H10z" fill="none" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M13.5 17.5l2.2 2.2 4-4.4" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center gap-2.5 rounded-lg font-semibold tracking-tight", className)}
      aria-label="ResumeAI home"
    >
      <LogoMark />
      <span className="text-base">
        Resume<span className="text-gradient">AI</span>
      </span>
    </Link>
  );
}
