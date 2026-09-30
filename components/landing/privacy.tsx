import { EyeOff, Lock, ServerCog, ShieldCheck } from "lucide-react";

const POINTS = [
  { icon: ServerCog, title: "Processed in memory", description: "Your file is read, analyzed and discarded within a single request." },
  { icon: Lock, title: "Never stored", description: "No database, no file storage, and no copies of your resume are kept by the application." },
  { icon: EyeOff, title: "No accounts or tracking", description: "No sign-up and no analytics profiles. Resume contents are never written to logs." },
];

export function Privacy() {
  return (
    <section id="privacy" className="scroll-mt-24 py-12 sm:py-16" aria-labelledby="privacy-title">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="border-gradient relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/80 p-6 shadow-soft backdrop-blur-sm sm:p-10">
          <div className="absolute -left-20 -top-20 size-64 rounded-full bg-success/10 blur-3xl" aria-hidden="true" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-md">
              <div className="mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-success-soft text-success">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </div>
              <h2 id="privacy-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Your resume stays yours
              </h2>
              <p className="mt-3 text-muted-foreground">
                Resumes are processed temporarily and are not stored permanently by the application. Results live only in
                your browser tab and disappear when you start a new analysis or close the tab.
              </p>
            </div>
            <ul className="grid flex-1 gap-4 sm:grid-cols-3 lg:max-w-2xl">
              {POINTS.map((point) => (
                <li
                  key={point.title}
                  className="rounded-2xl border border-border/70 bg-background/60 p-5 transition-colors hover:border-primary/30"
                >
                  <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <point.icon className="size-4.5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-3 text-sm font-semibold">{point.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{point.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
