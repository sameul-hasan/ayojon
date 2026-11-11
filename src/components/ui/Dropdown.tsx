"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/ui/cn";

export interface DropdownItem {
  label: string;
  onSelect: () => void;
  icon?: React.ReactNode;
  danger?: boolean;
}

export function Dropdown({
  label,
  items,
  align = "right",
  triggerClassName,
}: {
  label: React.ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex h-10 cursor-pointer items-center gap-2 rounded-btn border border-line bg-surface px-3 text-sm font-medium hover:bg-canvas-alt",
          triggerClassName
        )}
      >
        {label}
        <ChevronDown className="size-4 text-ink-muted" aria-hidden />
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute z-40 mt-2 min-w-48 rounded-card border border-line bg-surface p-1 shadow-pop",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {items.map((item) => (
            <button
              key={item.label}
              role="menuitem"
              type="button"
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
              className={cn(
                "flex w-full cursor-pointer items-center gap-2 rounded-btn px-3 py-2 text-left text-sm hover:bg-canvas-alt",
                item.danger ? "text-danger" : "text-ink"
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

