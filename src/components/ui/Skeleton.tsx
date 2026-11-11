import React from "react";
import { cn } from "@/lib/ui/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-btn bg-brand-100/70 motion-reduce:animate-none", className)}
    />
  );
}

export function EventCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface" role="status" aria-label="Loading event">
      <Skeleton className="h-40 rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

