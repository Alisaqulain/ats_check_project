import Link from "next/link";
import { ArrowUpRight, CodeXml } from "lucide-react";
import { DEVELOPER } from "@/lib/constants";
import { Logo } from "./logo";

const PRODUCT_LINKS = [
  { href: "/analyzer", label: "Analyzer" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#features", label: "Features" },
  { href: "/#privacy", label: "Privacy" },
];

export function Footer() {
  return (
    <footer className="relative mt-8 border-t border-border/60">
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
        aria-hidden="true"
      />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Resume and ATS compatibility analysis. Scores are estimates to guide improvements, not a guarantee of how any
            specific ATS or recruiter will evaluate your resume.
          </p>
        </div>

        <nav aria-label="Footer">
          <h2 className="text-sm font-semibold">Product</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {PRODUCT_LINKS.map((link) => (
              <li key={link.href}>
                <Link className="transition-colors hover:text-foreground" href={link.href}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-semibold">Developer</h2>
          <a
            href={DEVELOPER.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-3 flex items-center gap-3 rounded-2xl border border-border/70 bg-card/70 p-3 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-soft"
          >
            <span className="bg-brand flex size-10 shrink-0 items-center justify-center rounded-xl text-white shadow-glow">
              <CodeXml className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium">{DEVELOPER.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{DEVELOPER.handle}</span>
            </span>
            <ArrowUpRight
              className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
              aria-hidden="true"
            />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </div>
      </div>

      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} ResumeAI. Resumes are processed in memory and never stored.</p>
          <p>
            Developed by{" "}
            <a
              href={DEVELOPER.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
            >
              {DEVELOPER.name}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
