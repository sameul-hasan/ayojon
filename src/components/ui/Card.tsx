import React from "react";
import { cn } from "@/lib/ui/cn";

export function Card({
  className,
  interactive,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-card border border-line bg-surface shadow-card",
        interactive && "transition-all hover:-translate-y-0.5 hover:shadow-pop motion-reduce:transform-none",
        className
      )}
      {...rest}
    />
  );
}

export function CardHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {action}
    </div>
  );
}

/** Dashboard metric card. */
export function StatCard({
  label,
  value,
  icon,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  hint?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-ink-muted">{label}</p>
          <p className="mt-1 text-2xl font-bold text-ink">{value}</p>
          {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
        </div>
        {icon && (
          <span className="flex size-10 items-center justify-center rounded-btn bg-brand-50 text-brand-600">
            {icon}
          </span>
        )}
      </div>
    </Card>
  );
}

