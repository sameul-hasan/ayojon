import React from "react";
import { CalendarDays, MapPin, Search } from "lucide-react";

/** Plain GET form to /events: works without JavaScript. */
export function EventSearch({
  cities,
  defaults,
  compact,
}: {
  cities: string[];
  defaults?: { q?: string; city?: string; from?: string; category?: string };
  compact?: boolean;
}) {
  const field =
    "h-12 w-full rounded-btn border border-line bg-surface pl-10 pr-3 text-sm text-ink placeholder:text-ink-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";
  return (
    <form
      action="/events"
      method="get"
      role="search"
      aria-label="Search events"
      className={`grid gap-2 rounded-card border border-line bg-surface p-2 shadow-pop ${compact ? "lg:grid-cols-[1.6fr_1fr_1fr_auto]" : "md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_auto]"}`}
    >
      {defaults?.category && <input type="hidden" name="category" value={defaults.category} />}
      <div className="relative">
        <label htmlFor="es-q" className="sr-only">
          Search events
        </label>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted" aria-hidden />
        <input id="es-q" name="q" type="search" defaultValue={defaults?.q} placeholder="Search events, topics, organizers" className={field} />
      </div>
      <div className="relative">
        <label htmlFor="es-city" className="sr-only">
          Location
        </label>
        <MapPin className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted" aria-hidden />
        <select id="es-city" name="city" defaultValue={defaults?.city ?? ""} className={`${field} cursor-pointer`}>
          <option value="">All locations</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="relative">
        <label htmlFor="es-from" className="sr-only">
          From date
        </label>
        <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted" aria-hidden />
        <input id="es-from" name="from" type="date" defaultValue={defaults?.from} className={field} />
      </div>
      <button
        type="submit"
        className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-btn bg-brand-600 px-6 text-sm font-semibold text-white hover:bg-brand-700 md:col-span-2 lg:col-span-1"
      >
        <Search className="size-4" aria-hidden />
        Search
      </button>
    </form>
  );
}

