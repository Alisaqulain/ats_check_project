import Link from "next/link";
import { FileSearch } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main id="main" className="mx-auto flex min-h-[70dvh] max-w-md flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
          <FileSearch className="size-5 text-muted-foreground" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-2 text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist.</p>
        <div className="mt-6 flex gap-2">
          <Button asChild variant="outline">
            <Link href="/">Go home</Link>
          </Button>
          <Button asChild>
            <Link href="/analyzer">Analyze a resume</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </>
  );
}
