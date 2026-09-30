import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { AnalysisPreview } from "@/components/landing/analysis-preview";
import { Cta } from "@/components/landing/cta";
import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Privacy } from "@/components/landing/privacy";
import { WhatYouGet } from "@/components/landing/what-you-get";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main id="main">
        <Hero />
        <HowItWorks />
        <Features />
        <AnalysisPreview />
        <WhatYouGet />
        <Privacy />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
