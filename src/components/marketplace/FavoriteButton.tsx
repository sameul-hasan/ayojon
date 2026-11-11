"use client";

import React, { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/ui/cn";

const KEY = "aayojon:favorites";

function read(): string[] {
  try {
    const v = JSON.parse(window.localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Device-local favorites (no backend support for saved events exists yet). */
export function FavoriteButton({ eventId, title }: { eventId: string; title: string }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(read().includes(eventId));
  }, [eventId]);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const cur = read();
    const next = cur.includes(eventId) ? cur.filter((x) => x !== eventId) : [...cur, eventId];
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable */
    }
    setSaved(next.includes(eventId));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${title} from favorites` : `Save ${title} to favorites`}
      className="flex size-9 cursor-pointer items-center justify-center rounded-full bg-white/95 shadow-sm transition-colors hover:bg-white"
    >
      <Heart className={cn("size-[18px]", saved ? "fill-pink text-pink" : "text-ink-muted")} />
    </button>
  );
}

