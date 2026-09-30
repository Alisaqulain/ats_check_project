import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Cta() {
  return (
    <section className="py-20 sm:py-28" aria-labelledby="cta-title">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="bg-brand-animated animate-gradient relative isolate overflow-hidden rounded-[2rem] px-6 py-16 text-center text-white shadow-2xl shadow-primary/25 sm:px-12 sm:py-20">
          <div
            className="bg-grid absolute inset-0 -z-10 opacity-20 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"
            aria-hidden="true"
          />
          <div className="absolute -left-24 -top-24 -z-10 size-72 rounded-full bg-white/20 blur-3xl" aria-hidden="true" />
          <div className="absolute -bottom-24 -right-24 -z-10 size-72 rounded-full bg-white/15 blur-3xl" aria-hidden="true" />
          <h2 id="cta-title" className="mx-auto max-w-2xl text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
            Ready to see how your resume measures up?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-white/85">
            Upload your resume, paste a job description, and get a detailed analysis in seconds. Free, private, and no
            account needed.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="bg-white text-zinc-900 shadow-xl shadow-black/10 hover:-translate-y-px hover:bg-white/95"
            >
              <Link href="/analyzer">
                Analyze My Resume
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <p className="flex items-center gap-2 text-sm text-white/85">
              <Lock className="size-4" aria-hidden="true" />
              Nothing is stored
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
