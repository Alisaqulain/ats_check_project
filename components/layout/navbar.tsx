import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

const LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#features", label: "Features" },
  { href: "/#privacy", label: "Privacy" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-4">
      <nav
        aria-label="Main"
        className="glass mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 rounded-2xl border border-border/60 pl-3 pr-2 shadow-soft sm:pl-4"
      >
        <Logo />
        <ul className="hidden items-center gap-1 rounded-xl bg-muted/60 p-1 md:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="block rounded-lg px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-card hover:text-foreground hover:shadow-xs"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <Button asChild size="sm" className="h-9 px-3 sm:px-4">
            <Link href="/analyzer">
              <span className="hidden sm:inline">Analyze resume</span>
              <span className="sm:hidden">Analyze</span>
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}
