"use client";

import React from "react";
import { cn } from "@/lib/ui/cn";
import { Logo } from "./Logo";

export interface DashboardNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

/**
 * Shared shell for all dashboard portals: desktop sidebar, top header,
 * and a bottom tab bar on mobile. Navigation is state-driven via onSelect.
 */
export function DashboardShell({
  title,
  items,
  activeId,
  onSelect,
  headerRight,
  children,
}: {
  title: string;
  items: DashboardNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-canvas">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-surface p-4 lg:flex">
        <Logo className="px-2 py-2" />
        <nav aria-label={`${title} navigation`} className="mt-6 flex flex-1 flex-col gap-1 overflow-y-auto">
          {items.map((i) => (
            <button
              key={i.id}
              type="button"
              onClick={() => onSelect(i.id)}
              aria-current={activeId === i.id ? "page" : undefined}
              className={cn(
                "flex h-11 w-full cursor-pointer items-center gap-3 rounded-btn px-3 text-sm font-medium transition-colors",
                activeId === i.id ? "bg-brand-50 text-brand-700" : "text-ink-muted hover:bg-canvas-alt hover:text-ink"
              )}
            >
              <span className="size-5 [&>svg]:size-5">{i.icon}</span>
              {i.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-canvas/95 px-4 sm:px-6">
          <h1 className="truncate text-lg font-semibold text-ink">{title}</h1>
          <div className="flex items-center gap-2">{headerRight}</div>
        </header>
        <main className="flex-1 px-4 py-6 pb-24 sm:px-6 lg:pb-8">{children}</main>
      </div>

      <MobileNavigation items={items} activeId={activeId} onSelect={onSelect} />
    </div>
  );
}

export function MobileNavigation({
  items,
  activeId,
  onSelect,
}: {
  items: DashboardNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 flex overflow-x-auto border-t border-line bg-surface px-1 lg:hidden"
    >
      {items.map((i) => (
        <button
          key={i.id}
          type="button"
          onClick={() => onSelect(i.id)}
          aria-current={activeId === i.id ? "page" : undefined}
          className={cn(
            "flex min-w-[4.5rem] flex-1 cursor-pointer flex-col items-center gap-1 px-2 py-2 text-[11px] font-medium",
            activeId === i.id ? "text-brand-600" : "text-ink-muted"
          )}
        >
          <span className="[&>svg]:size-5">{i.icon}</span>
          <span className="truncate">{i.label}</span>
        </button>
      ))}
    </nav>
  );
}

