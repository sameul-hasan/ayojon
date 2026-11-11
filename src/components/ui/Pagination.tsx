"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/ui/cn";

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  showTotal?: boolean;
  totalItems?: number;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  className,
  showTotal = false,
  totalItems,
}: PaginationProps) {
  if (totalPages <= 1 && !showTotal) return null;

  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) pages.push(i);

      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={cn("flex flex-wrap items-center justify-between gap-4 py-3 select-none", className)}
    >
      {showTotal && totalItems !== undefined ? (
        <span className="text-xs text-ink-muted">
          Showing page <span className="font-semibold text-ink">{page}</span> of{" "}
          <span className="font-semibold text-ink">{totalPages}</span> ({totalItems.toLocaleString()} total items)
        </span>
      ) : (
        <div />
      )}

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className="inline-flex size-9 items-center justify-center rounded-btn border border-line bg-surface text-ink-muted hover:text-ink hover:bg-canvas-alt disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft className="size-4" />
        </button>

        {getPageNumbers().map((p, idx) => {
          if (p === "...") {
            return (
              <span key={`ellipsis-${idx}`} className="px-2 text-xs text-ink-muted">
                ...
              </span>
            );
          }

          const isActive = p === page;
          return (
            <button
              key={`page-${p}`}
              type="button"
              onClick={() => onPageChange(p as number)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-btn text-xs font-semibold transition cursor-pointer",
                isActive
                  ? "bg-brand-600 text-white shadow-sm"
                  : "border border-line bg-surface text-ink-muted hover:text-ink hover:bg-canvas-alt"
              )}
            >
              {p}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          className="inline-flex size-9 items-center justify-center rounded-btn border border-line bg-surface text-ink-muted hover:text-ink hover:bg-canvas-alt disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </nav>
  );
}

