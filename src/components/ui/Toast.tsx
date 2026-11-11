"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, Info, TriangleAlert, XCircle, X } from "lucide-react";

export type ToastTone = "success" | "error" | "info" | "warning" | "danger";

export interface ToastOptions {
  title?: string;
  description?: string;
  message?: string;
  tone?: ToastTone;
}

export type ToastFunction = {
  (message: string, tone?: ToastTone): void;
  (options: ToastOptions): void;
};

interface ToastItem {
  id: number;
  tone: ToastTone;
  title?: string;
  message: string;
}

const ToastContext = createContext<{ toast: ToastFunction } | null>(null);

const toneStyle: Record<ToastTone, { icon: React.ReactNode; cls: string }> = {
  success: { icon: <CheckCircle2 className="size-5 text-success shrink-0" />, cls: "border-green-200" },
  error: { icon: <XCircle className="size-5 text-danger shrink-0" />, cls: "border-red-200" },
  danger: { icon: <XCircle className="size-5 text-danger shrink-0" />, cls: "border-red-200" },
  info: { icon: <Info className="size-5 text-info shrink-0" />, cls: "border-blue-200" },
  warning: { icon: <TriangleAlert className="size-5 text-warning shrink-0" />, cls: "border-amber-200" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => setItems((cur) => cur.filter((t) => t.id !== id)), []);

  const toast: ToastFunction = useCallback(
    (arg1: string | ToastOptions, arg2?: ToastTone) => {
      const id = Date.now() + Math.random();
      let tone: ToastTone = "info";
      let title: string | undefined;
      let message = "";

      if (typeof arg1 === "string") {
        message = arg1;
        if (arg2) tone = arg2;
      } else if (arg1 && typeof arg1 === "object") {
        title = arg1.title;
        message = arg1.description || arg1.message || "";
        if (arg1.tone) tone = arg1.tone;
      }

      setItems((cur) => [...cur, { id, tone, title, message }]);
      window.setTimeout(() => dismiss(id), 5000);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[150] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6"
      >
        {items.map((t) => {
          const style = toneStyle[t.tone] || toneStyle.info;
          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-card border bg-surface p-3.5 shadow-pop ${style.cls}`}
            >
              {style.icon}
              <div className="flex-1 text-sm">
                {t.title && <h5 className="font-bold text-ink mb-0.5">{t.title}</h5>}
                <p className="text-ink-muted text-xs leading-relaxed">{t.message}</p>
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="cursor-pointer text-ink-muted hover:text-ink transition"
              >
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
