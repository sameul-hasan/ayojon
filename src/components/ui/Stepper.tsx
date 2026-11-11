import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/ui/cn";

/** Accessible step progress indicator. `current` is 1-based. */
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center gap-2">
        {steps.map((label, i) => {
          const n = i + 1;
          const done = n < current;
          const active = n === current;
          return (
            <li key={label} className="flex min-w-0 flex-1 items-center gap-2" aria-current={active ? "step" : undefined}>
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  done && "bg-brand-600 text-white",
                  active && "bg-brand-600 text-white ring-4 ring-brand-100",
                  !done && !active && "bg-canvas-alt text-ink-muted"
                )}
              >
                {done ? <Check className="size-4" aria-hidden /> : n}
                <span className="sr-only">{done ? " (completed)" : active ? " (current)" : ""}</span>
              </span>
              <span className={cn("hidden truncate text-sm font-medium sm:block", active ? "text-ink" : "text-ink-muted")}>{label}</span>
              {n < steps.length && <span aria-hidden className={cn("h-0.5 flex-1 rounded", done ? "bg-brand-600" : "bg-line")} />}
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-sm font-medium text-ink sm:hidden">
        Step {current} of {steps.length}: {steps[current - 1]}
      </p>
    </nav>
  );
}

