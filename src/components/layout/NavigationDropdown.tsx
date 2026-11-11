"use client";

import React, { useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/ui/cn";

export interface NavDropdownItem {
  label: string;
  href: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export interface NavigationDropdownProps {
  label: string;
  items: NavDropdownItem[];
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  activeHref?: string;
}

export function NavigationDropdown({
  label,
  items,
  isOpen,
  onToggle,
  onClose,
  activeHref,
}: NavigationDropdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle keyboard navigation (Escape to close)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
      buttonRef.current?.focus();
    }
  };

  const isCurrentGroupActive = items.some(
    (item) =>
      activeHref === item.href ||
      (item.href !== "/" && activeHref?.startsWith(item.href))
  );

  return (
    <div
      ref={containerRef}
      className="relative inline-block text-left"
      onKeyDown={handleKeyDown}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={cn(
          "inline-flex items-center gap-1 rounded-btn px-3 py-2 text-sm font-medium transition-colors",
          isCurrentGroupActive || isOpen
            ? "bg-brand-50 text-brand-700 font-semibold"
            : "text-ink-muted hover:text-ink hover:bg-canvas-alt focus-visible:outline-2 focus-visible:outline-brand-600"
        )}
      >
        <span>{label}</span>
        <ChevronDown
          className={cn(
            "size-3.5 transition-transform duration-200",
            isOpen ? "rotate-180 text-brand-700" : "text-ink-muted"
          )}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute left-0 mt-2 w-64 origin-top-left rounded-card border border-line bg-surface p-1.5 shadow-pop backdrop-blur-md z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="space-y-0.5">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = activeHref === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  role="menuitem"
                  className={cn(
                    "group flex items-start gap-3 rounded-btn p-2.5 text-sm transition-colors",
                    isActive
                      ? "bg-brand-50 text-brand-700 font-semibold"
                      : "text-ink hover:bg-canvas-alt hover:text-brand-700"
                  )}
                >
                  {Icon && (
                    <div
                      className={cn(
                        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-btn border border-line bg-surface transition-colors",
                        isActive
                          ? "border-brand-200 bg-brand-100/50 text-brand-700"
                          : "text-ink-muted group-hover:border-brand-200 group-hover:text-brand-600"
                      )}
                    >
                      <Icon className="size-4" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="font-medium truncate">{item.label}</span>
                      {item.badge && (
                        <span className="rounded bg-brand-50 border border-brand-200 px-1.5 py-0.2 text-[10px] font-bold text-brand-700 uppercase">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="mt-0.5 text-xs text-ink-muted line-clamp-1">
                        {item.description}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

