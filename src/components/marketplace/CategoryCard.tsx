import React from "react";
import Link from "next/link";
import type { PublicCategory } from "@/lib/public-events-shared";
import { categoryIcon, categoryTile } from "./categoryStyle";
import { cn } from "@/lib/ui/cn";

export function CategoryCard({ category, active }: { category: PublicCategory; active?: boolean }) {
  const Icon = categoryIcon(category.icon);
  return (
    <Link
      href={`/events?category=${encodeURIComponent(category.slug)}`}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-card border bg-surface p-3.5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-pop motion-reduce:transform-none",
        active ? "border-pink ring-2 ring-pink/20" : "border-line"
      )}
    >
      <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-btn", categoryTile(category.id))}>
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-ink">{category.name}</span>
        <span className="block text-xs text-ink-muted">
          {category.count} {category.count === 1 ? "event" : "events"}
        </span>
      </span>
    </Link>
  );
}
