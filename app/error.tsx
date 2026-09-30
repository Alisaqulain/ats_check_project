"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="mx-auto flex min-h-[70dvh] max-w-lg flex-col justify-center px-4">
      <ErrorState title="Something went wrong" message="An unexpected error occurred while loading this page. Please try again.">
        <Button size="sm" onClick={reset}>
          Try again
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link href="/">Go home</Link>
        </Button>
      </ErrorState>
    </main>
  );
}
