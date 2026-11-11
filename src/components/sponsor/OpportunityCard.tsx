"use client";

import React from "react";
import { Users, CalendarDays, MapPin, Building2, Award, ArrowRight } from "lucide-react";
import type { EventRecord, Organization } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/ui/cn";
import { demoEventImage } from "@/components/marketplace/categoryStyle";

export interface OpportunityCardProps {
  event: EventRecord;
  org?: Organization;
  isSelected: boolean;
  onSelect: () => void;
  onOpenDetails?: () => void;
}

export function OpportunityCard({
  event,
  org,
  isSelected,
  onSelect,
  onOpenDetails,
}: OpportunityCardProps) {
  const imageUrl = demoEventImage(event.category_id);

  return (
    <div
      onClick={onSelect}
      className={cn(
        "rounded-2xl border p-5 transition-all cursor-pointer relative bg-surface shadow-card",
        isSelected
          ? "border-brand-600 ring-2 ring-brand-500/20 shadow-md bg-brand-50/20"
          : "border-line hover:border-brand-300 hover:shadow-md"
      )}
    >
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Event Thumbnail */}
        <div className="relative h-28 w-full sm:w-36 shrink-0 overflow-hidden rounded-xl bg-canvas-alt">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={event.title} className="h-full w-full object-cover" />
          {event.is_featured && (
            <Badge tone="coral" className="absolute top-2 left-2 text-[10px] border-none bg-coral text-white font-bold">
              Featured
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-700">
                <Building2 className="size-3.5" />
                <span>{org?.name || "Host Organization"}</span>
                {org?.verified_badge && (
                  <span className="text-brand-600 font-bold" title="Verified Host">✓</span>
                )}
              </div>
              <h3 className="mt-0.5 text-base font-bold text-ink leading-snug line-clamp-1">{event.title}</h3>
            </div>
            <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700 border border-brand-200">
              {event.capacity.toLocaleString()} Seats
            </span>
          </div>

          <p className="text-xs text-ink-muted leading-relaxed line-clamp-2">
            {event.tagline || event.description}
          </p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-ink-muted border-t border-line/70 pt-2.5">
            <span className="flex items-center gap-1 text-ink font-medium">
              <CalendarDays className="size-3.5 text-brand-600" />
              {new Date(event.starts_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1">
              <Users className="size-3.5 text-teal-600" />
              Verified Audience Reach
            </span>
            <div className="ml-auto flex items-center gap-2">
              {onOpenDetails && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDetails();
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  Opportunity Details <ArrowRight className="size-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
