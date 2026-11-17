import React from "react";
import Link from "@/components/ui/Link";
import { CalendarDays, MapPin, BadgeCheck, ArrowRight, Globe } from "lucide-react";
import type { PublicCategory, PublicEvent } from "@/lib/public-events-shared";
import { eventHref } from "@/lib/public-events-shared";
import { formatBDT } from "@/lib/ui/cn";
import { Badge } from "@/components/ui/Badge";
import { demoEventImage } from "./categoryStyle";
import { FavoriteButton } from "./FavoriteButton";

export function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Dhaka",
  });
}

function getDateParts(iso: string): { month: string; day: string } {
  const d = new Date(iso);
  const month = d
    .toLocaleString("en-US", { month: "short", timeZone: "Asia/Dhaka" })
    .toUpperCase();
  const day = d.toLocaleString("en-US", { day: "2-digit", timeZone: "Asia/Dhaka" });
  return { month, day };
}

export function EventCard({
  event,
  distanceKm,
}: {
  event: PublicEvent;
  category?: PublicCategory;
  distanceKm?: number;
}) {
  const isFree = event.minPriceMinor === 0;
  const price =
    event.minPriceMinor === null
      ? "Tickets soon"
      : isFree
        ? "Free Entry"
        : `From ${formatBDT(event.minPriceMinor)}`;

  const imageUrl = demoEventImage(event.categoryId);
  const { month, day } = getDateParts(event.startsAt);
  const orgInitial = (event.organizerName || "A").charAt(0).toUpperCase();

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-brand-300 hover:shadow-pop motion-reduce:transform-none">
      <div className="relative h-48 w-full overflow-hidden bg-canvas-alt">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={event.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-black/25 pointer-events-none" />

        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5 z-10">
          <Badge tone="neutral" className="border-transparent bg-white/95 text-ink shadow-sm backdrop-blur-xs">
            {event.categoryName}
          </Badge>
          {event.isFeatured && (
            <span className="inline-flex items-center rounded-full bg-amber-500 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-white shadow-md ring-1 ring-white/50">
              ★ Featured
            </span>
          )}
        </div>

        <div className="absolute right-3 top-3 z-10">
          <FavoriteButton eventId={event.id} title={event.title} />
        </div>

        {/* Floating Calendar Date Pill */}
        <div className="absolute bottom-3 right-3 rounded-xl bg-white/95 px-2.5 py-1.5 text-center shadow-sm backdrop-blur-xs">
          <span className="block text-[10px] font-extrabold uppercase tracking-wider text-brand-700 leading-none">
            {month}
          </span>
          <span className="block text-base font-extrabold text-ink leading-tight mt-0.5">
            {day}
          </span>
        </div>

        {/* Online / City pill bottom-left */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-xs">
            {event.isOnline ? (
              <>
                <Globe className="size-3 text-emerald-300" />
                <span>Online</span>
              </>
            ) : (
              <>
                <MapPin className="size-3 text-brand-300" />
                <span>{event.city}</span>
              </>
            )}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between space-y-3 p-4">
        <div className="space-y-2">
          <h3 className="line-clamp-2 text-base font-bold leading-snug text-ink transition-colors group-hover:text-brand-700">
            <Link href={eventHref(event)} className="after:absolute after:inset-0 focus-visible:outline-offset-[-2px]">
              {event.title}
            </Link>
          </h3>

          {event.tagline && (
            <p className="line-clamp-1 text-xs text-ink-muted">
              {event.tagline}
            </p>
          )}

          <div className="space-y-1.5 pt-1">
            <p className="flex items-center gap-2 text-xs text-ink-muted">
              <CalendarDays className="size-3.5 shrink-0 text-brand-600" aria-hidden />
              <span className="truncate">{formatEventDate(event.startsAt)}</span>
            </p>
            <p className="flex items-center gap-2 text-xs text-ink-muted">
              <MapPin className="size-3.5 shrink-0 text-brand-600" aria-hidden />
              <span className="truncate">
                {event.isOnline ? "Live Virtual Event" : [event.venueName, event.city].filter(Boolean).join(", ")}
                {distanceKm !== undefined && ` · ${distanceKm.toFixed(1)} km`}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-line pt-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-700 border border-brand-200">
              {orgInitial}
            </span>
            <p className="flex min-w-0 items-center gap-1 text-xs font-medium text-ink-muted">
              <span className="truncate">{event.organizerName}</span>
              {event.organizerVerified && (
                <BadgeCheck className="size-3.5 shrink-0 text-brand-600" aria-label="Verified organizer" />
              )}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={
                isFree
                  ? "rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-700"
                  : "text-sm font-extrabold text-brand-700"
              }
            >
              {price}
            </span>
            <ArrowRight className="size-3.5 text-brand-600 opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0" aria-hidden />
          </div>
        </div>
      </div>
    </article>
  );
}

export function EventGrid({
  events,
  categories,
}: {
  events: PublicEvent[];
  categories: PublicCategory[];
}) {
  const byId = new Map(categories.map((c) => [c.id, c]));
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {events.map((e) => (
        <EventCard key={e.id} event={e} category={byId.get(e.categoryId)} />
      ))}
    </div>
  );
}
