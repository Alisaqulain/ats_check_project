import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { DEVELOPER } from "@/lib/constants";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ResumeAI — AI Resume & ATS Analyzer",
    template: "%s · ResumeAI",
  },
  description:
    "Analyze your resume against any job description. See your ATS compatibility estimate, matched and missing keywords, skills gaps, and concrete improvements.",
  applicationName: "ResumeAI",
  authors: [{ name: DEVELOPER.name, url: DEVELOPER.url }],
  creator: DEVELOPER.name,
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0e1a" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="min-h-dvh font-sans antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
