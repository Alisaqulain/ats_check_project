import Link from "next/link";
import { ArrowRight, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroPreview } from "./hero-preview";

const STATS = [
  { value: "6", label: "weighted scoring factors" },
  { value: "400+", label: "skills and tools recognized" },
  { value: "0", label: "resumes stored" },
];

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden" aria-labelledby="hero-title">
      <div className="bg-aurora absolute inset-0 -z-10" aria-hidden="true" />
      <div
        className="bg-grid absolute inset-0 -z-10 opacity-70 [mask-image:radial-gradient(ellipse_at_top,black_15%,transparent_65%)]"
        aria-hidden="true"
      />
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-14 sm:px-6 md:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pb-28">
        <div className="animate-fade-up">
          <Link
            href="/analyzer"
            className="group mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/70 py-1 pl-1 pr-3 text-xs font-medium shadow-xs backdrop-blur transition-colors hover:border-primary/40"
          >
            <span className="bg-brand inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-white">
              <Sparkles className="size-3" aria-hidden="true" />
              Free
            </span>
            <span className="text-muted-foreground">No sign-up. Nothing stored.</span>
            <ArrowRight className="size-3 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
          <h1
            id="hero-title"
            className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl lg:leading-[1.04]"
          >
            Know How Your Resume Performs <span className="text-gradient">Before You Apply.</span>
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Analyze your resume against any job description and discover the skills, keywords, and improvements that can
            increase your ATS compatibility.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/analyzer">
                Analyze My Resume
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#how-it-works">See How It Works</Link>
            </Button>
          </div>
          <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="size-4 text-success" aria-hidden="true" />
            Processed in memory. Your resume is never stored.
          </p>

          <dl className="mt-10 grid max-w-lg grid-cols-3 divide-x divide-border/70 rounded-2xl border border-border/70 bg-card/60 py-4 backdrop-blur">
            {STATS.map((stat) => (
              <div key={stat.label} className="px-3 text-center sm:px-4">
                <dt className="sr-only">{stat.label}</dt>
                <dd className="text-gradient text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">{stat.value}</dd>
                <dd className="mt-1 text-[11px] leading-tight text-muted-foreground sm:text-xs">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="animate-fade-up [animation-delay:120ms]">
          <HeroPreview />
        </div>
      </div>
    </section>
  );
}
