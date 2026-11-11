"use client";

import React, { useState, useRef, useEffect } from "react";
import { Check, Copy, ExternalLink, MessageSquare, Send, Share2 } from "lucide-react";
import { cn } from "@/lib/ui/cn";

export function ShareButton({
  title,
  url,
  variant = "icon",
  className,
}: {
  title: string;
  url?: string;
  variant?: "icon" | "button";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const getUrl = () => url || (typeof window !== "undefined" ? window.location.href : "");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // fallback
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title,
          url: getUrl(),
        });
        return;
      } catch {
        // user cancelled or share failed, fallback to popover
      }
    }
    setOpen((o) => !o);
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const targetUrl = encodeURIComponent(getUrl());
  const targetText = encodeURIComponent(`Check out ${title} on Aayojon!`);

  const channels = [
    {
      name: "WhatsApp",
      href: `https://api.whatsapp.com/send?text=${targetText}%20${targetUrl}`,
      icon: MessageSquare,
      color: "text-emerald-700 bg-emerald-50",
    },
    {
      name: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${targetUrl}`,
      icon: ExternalLink,
      color: "text-blue-700 bg-blue-50",
    },
    {
      name: "Telegram",
      href: `https://t.me/share/url?url=${targetUrl}&text=${targetText}`,
      icon: Send,
      color: "text-sky-700 bg-sky-50",
    },
  ];

  return (
    <div className={cn("relative inline-block", className)} ref={ref}>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={handleNativeShare}
          aria-label={`Share ${title}`}
          aria-expanded={open}
          className="flex size-9 cursor-pointer items-center justify-center rounded-full bg-white/95 text-ink-muted shadow-sm transition hover:bg-white hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <Share2 className="size-[18px]" aria-hidden />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleNativeShare}
          aria-label={`Share ${title}`}
          aria-expanded={open}
          className="inline-flex h-9 items-center gap-2 rounded-btn border border-line bg-surface px-3.5 text-xs font-semibold text-ink shadow-sm transition hover:border-brand-300 hover:bg-canvas-alt hover:text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <Share2 className="size-4 text-brand-600" aria-hidden /> Share
        </button>
      )}

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-line bg-surface p-3 shadow-modal animate-in fade-in slide-in-from-top-1">
          <p className="mb-2 text-xs font-semibold text-ink">Share this event</p>
          <button
            type="button"
            onClick={handleCopy}
            className="flex w-full items-center justify-between rounded-lg border border-line bg-canvas-alt px-3 py-2 text-xs font-medium text-ink transition hover:bg-surface"
          >
            <span className="flex items-center gap-2">
              {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4 text-brand-600" />}
              <span>{copied ? "Link copied to clipboard!" : "Copy link"}</span>
            </span>
          </button>
          <div className="mt-2 space-y-1">
            {channels.map((ch) => {
              const Icon = ch.icon;
              return (
                <a
                  key={ch.name}
                  href={ch.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink transition hover:bg-canvas-alt"
                >
                  <span className={cn("flex size-6 items-center justify-center rounded-md", ch.color)}>
                    <Icon className="size-3.5" />
                  </span>
                  Share on {ch.name}
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

