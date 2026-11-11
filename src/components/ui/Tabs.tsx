"use client";

import React from "react";
import { cn } from "@/lib/ui/cn";

export interface TabItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  variant?: "pill" | "underline" | "contained";
  size?: "sm" | "md" | "lg";
  className?: string;
  fullWidth?: boolean;
}

export function Tabs({
  tabs,
  activeId,
  onChange,
  variant = "pill",
  size = "md",
  className,
  fullWidth = false,
}: TabsProps) {
  const sizeClasses = {
    sm: "px-2.5 py-1 text-xs",
    md: "px-3.5 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={cn(
        "flex overflow-x-auto scrollbar-none",
        variant === "contained" && "rounded-btn bg-canvas-alt p-1 border border-line",
        variant === "underline" && "border-b border-line gap-4 sm:gap-6",
        variant === "pill" && "flex-wrap gap-1.5 sm:gap-2",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeId === tab.id;

        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            aria-disabled={tab.disabled}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onChange(tab.id)}
            className={cn(
              "inline-flex items-center justify-center gap-2 font-medium transition-all focus-visible:outline-2 focus-visible:outline-brand-600 cursor-pointer whitespace-nowrap",
              sizeClasses[size],
              fullWidth && "flex-1",
              tab.disabled && "opacity-40 cursor-not-allowed",

              // Pill variant
              variant === "pill" &&
                (isActive
                  ? "rounded-full bg-brand-600 text-white shadow-sm"
                  : "rounded-full bg-surface border border-line text-ink-muted hover:text-ink hover:bg-canvas-alt"),

              // Contained variant
              variant === "contained" &&
                (isActive
                  ? "rounded-btn bg-surface text-ink font-semibold shadow-sm border border-line/60"
                  : "rounded-btn text-ink-muted hover:text-ink"),

              // Underline variant
              variant === "underline" &&
                (isActive
                  ? "border-b-2 -mb-px pb-3 px-1 rounded-none border-brand-600 text-brand-700 font-bold"
                  : "border-b-2 -mb-px pb-3 px-1 rounded-none border-transparent text-ink-muted hover:text-ink hover:border-line")
            )}
          >
            {tab.icon && <span className="size-4 shrink-0 [&>svg]:size-4">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge && (
              <span
                className={cn(
                  "ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold leading-tight",
                  isActive
                    ? variant === "pill"
                      ? "bg-white/20 text-white"
                      : "bg-brand-50 text-brand-700"
                    : "bg-canvas-alt text-ink-muted border border-line"
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
