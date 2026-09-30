import type { Metadata } from "next";
import { Suspense } from "react";
import { AnalyzerApp } from "@/components/analyzer/analyzer-app";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Analyzer",
  description: "Upload your resume and paste a job description to get an ATS compatibility analysis.",
};

function AnalyzerFallback() {
  return (
    <div className="space-y-6" aria-busy="true">
      <Skeleton className="h-9 w-64" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    </div>
  );
}

export default function AnalyzerPage() {
  return (
    <>
      <Navbar />
      <div className="relative isolate">
        <div
          className="bg-aurora pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem] opacity-80 [mask-image:linear-gradient(to_bottom,black,transparent)]"
          aria-hidden="true"
        />
        <main id="main" className="mx-auto min-h-[calc(100dvh-4rem)] max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <Suspense fallback={<AnalyzerFallback />}>
            <AnalyzerApp />
          </Suspense>
        </main>
      </div>
      <Footer />
    </>
  );
}