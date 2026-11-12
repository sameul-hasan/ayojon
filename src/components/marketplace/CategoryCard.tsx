import React from "react";
import Link from "@/components/ui/Link";
import type { PublicCategory } from "@/lib/public-events-shared";
import { categoryIcon } from "./categoryStyle";
import { cn } from "@/lib/ui/cn";
import { ArrowRight } from "lucide-react";

const CATEGORY_META: Record<
  string,
  {
    iconBg: string;
    tagline: string;
  }
> = {
  "tech-workshops": {
    iconBg: "bg-cyan-50 text-cyan-700 border-cyan-200",
    tagline: "Workshops & Labs",
  },
  conferences: {
    iconBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
    tagline: "Summits & Keynotes",
  },
  "university-clubs": {
    iconBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    tagline: "Campus & Contests",
  },
  "cultural-festivals": {
    iconBg: "bg-rose-50 text-rose-700 border-rose-200",
    tagline: "Concerts & Music",
  },
  "startup-business": {
    iconBg: "bg-amber-50 text-amber-700 border-amber-200",
    tagline: "Pitch & Networking",
  },
  "design-arts": {
    iconBg: "bg-pink-50 text-pink-700 border-pink-200",
    tagline: "UI/UX & Creative",
  },
};

export function CategoryCard({
  category,
  active,
}: {
  category: PublicCategory;
  active?: boolean;
  variant?: string;
}) {
  const Icon = categoryIcon(category.icon);
  const meta = CATEGORY_META[category.slug] || {
    iconBg: "bg-brand-50 text-brand-700 border-brand-200",
    tagline: "Explore events",
  };

  const hasLiveEvents = category.count > 0;

  return (
    <Link
      href={`/events?category=${encodeURIComponent(category.slug)}`}
      aria-current={active ? "true" : undefined}
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl border border-line bg-surface p-4 sm:p-4.5 shadow-2xs hover:border-brand-300 hover:bg-canvas-alt/50 hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 motion-reduce:transform-none",
        active && "border-brand-600 ring-2 ring-brand-500/20 bg-brand-50/20"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-xl border transition-transform duration-200 group-hover:scale-105",
            meta.iconBg
          )}
        >
          <Icon className="size-5 shrink-0" aria-hidden />
        </div>
        <ArrowRight className="size-3.5 text-ink-muted/50 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
      </div>

      <div className="mt-3">
        <h3 className="text-sm font-bold text-ink group-hover:text-brand-600 transition-colors leading-snug truncate">
          {category.name}
        </h3>
        <p className="mt-1 text-xs text-ink-muted flex items-center gap-1.5">
          {hasLiveEvents ? (
            <>
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="font-semibold text-emerald-700">
                {category.count} {category.count === 1 ? "event" : "events"}
              </span>
            </>
          ) : (
            <span>{meta.tagline}</span>
          )}
        </p>
      </div>
    </Link>
  );
}
