import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  message: string;
  className?: string;
  children?: React.ReactNode;
}

export function ErrorState({ title = "Something went wrong", message, className, children }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn("flex gap-3 rounded-xl border border-danger/30 bg-danger-soft p-4 text-sm", className)}
    >
      <CircleAlert className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">{title}</p>
        <p className="mt-1 text-foreground/80">{message}</p>
        {children && <div className="mt-3 flex flex-wrap gap-2">{children}</div>}
      </div>
    </div>
  );
}
