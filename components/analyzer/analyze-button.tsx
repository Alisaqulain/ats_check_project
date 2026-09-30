import { useId } from "react";
import { LoaderCircle, ScanText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AnalyzeButtonProps {
  onClick: () => void;
  disabledReason: string | null;
  loading: boolean;
}

export function AnalyzeButton({ onClick, disabledReason, loading }: AnalyzeButtonProps) {
  const hintId = useId();
  return (
    <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-end sm:gap-4">
      {disabledReason && !loading && (
        <p id={hintId} className="text-center text-sm text-muted-foreground sm:text-right">
          {disabledReason}
        </p>
      )}
      <Button
        size="lg"
        onClick={onClick}
        disabled={Boolean(disabledReason) || loading}
        aria-describedby={disabledReason ? hintId : undefined}
        className="w-full sm:w-auto"
      >
        {loading ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <ScanText aria-hidden="true" />}
        {loading ? "Analyzing…" : "Analyze Resume"}
      </Button>
    </div>
  );
}
