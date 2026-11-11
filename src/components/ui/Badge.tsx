import React from "react";
import { cn } from "@/lib/ui/cn";

export type BadgeTone = "brand" | "pink" | "coral" | "success" | "warning" | "danger" | "info" | "neutral";

const tones: Record<BadgeTone, string> = {
  brand: "bg-brand-50 text-brand-700 border-brand-200",
  pink: "bg-pink-50 text-pink-700 border-pink-200",
  coral: "bg-orange-50 text-orange-700 border-orange-200",
  success: "bg-green-50 text-green-700 border-green-200",
  warning: "bg-amber-50 text-amber-800 border-amber-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  neutral: "bg-canvas-alt text-ink-muted border-line",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/** Map backend status strings to a consistent badge tone. */
export function statusTone(status: string): BadgeTone {
  switch (status) {
    case "PAID":
    case "VALID":
    case "VERIFIED":
    case "PUBLISHED":
      return "success";
    case "PENDING":
    case "INITIATED":
    case "DRAFT":
      return "warning";
    case "FAILED":
    case "CANCELLED":
    case "SUSPENDED":
    case "INVALID":
      return "danger";
    case "USED":
    case "ALREADY_USED":
      return "info";
    default:
      return "neutral";
  }
}

