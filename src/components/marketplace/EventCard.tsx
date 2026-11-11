import React from "react";
import Link from "next/link";
import { CalendarDays, MapPin, BadgeCheck } from "lucide-react";
import type { PublicCategory, PublicEvent } from "@/lib/public-events-shared";
import { eventHref } from "@/lib/public-events-shared";
import { formatBDT } from "@/lib/ui/cn";
import { Badge } from "@/components/ui/Badge";
import { categoryIcon, demoEventImage } from "./categoryStyle";
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

export function EventCard({
  event,
  category,
  distanceKm,
}: {
  event: PublicEvent;
  category?: PublicCategory;
  distanceKm?: number;
}) {
  const price =
    event.minPriceMinor === null
      ? "Tickets soon"
      : event.minPriceMinor === 0
        ? "Free"
        : `From ${formatBDT(event.minPriceMinor)}`;

  const imageUrl = demoEventImage(event.categoryId);

  return (
    <article className="group relative overflow-hidden rounded-card border border-line bg-surface shadow-card transition-all hover:-translate-y-0.5 hover:shadow-pop motion-reduce:transform-none">
      <div className="relative h-44 w-full overflow-hidden bg-canvas-alt">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={event.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

        <div className="absolute left-3 top-3">
          <Badge tone="neutral" className="border-transparent bg-white/95 text-ink shadow-xs">
            {event.categoryName}
          </Badge>
        </div>
        <div className="absolute right-3 top-3 z-10">
          <FavoriteButton eventId={event.id} title={event.title} />
        </div>
        {event.isFeatured && (
          <div className="absolute bottom-3 left-3">
            <Badge tone="coral" className="border-transparent bg-coral text-white font-bold shadow-xs">
              Featured
            </Badge>
          </div>
        )}
      </div>

      <div className="space-y-2.5 p-4">
        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-ink">
          <Link href={eventHref(event)} className="after:absolute after:inset-0 focus-visible:outline-offset-[-2px]">
            {event.title}
          </Link>
        </h3>
        <p className="flex items-center gap-2 text-xs text-ink-muted">
          <CalendarDays className="size-3.5 shrink-0 text-brand-600" aria-hidden />
          {formatEventDate(event.startsAt)}
        </p>
        <p className="flex items-center gap-2 text-xs text-ink-muted">
          <MapPin className="size-3.5 shrink-0 text-brand-600" aria-hidden />
          <span className="truncate">
            {event.isOnline ? "Online Event" : [event.venueName, event.city].filter(Boolean).join(", ")}
            {distanceKm !== undefined && ` · ${distanceKm.toFixed(1)} km`}
          </span>
        </p>
        <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
          <p className="flex min-w-0 items-center gap-1 text-xs text-ink-muted">
            <span className="truncate">{event.organizerName}</span>
            {event.organizerVerified && (
              <BadgeCheck className="size-3.5 shrink-0 text-brand-600" aria-label="Verified organizer" />
            )}
          </p>
          <p className="shrink-0 text-sm font-bold text-brand-700">{price}</p>
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
