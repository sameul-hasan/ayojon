import React from "react";
import { useSearchParams } from "react-router-dom";
import { Link } from "@/components/ui/Link";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { EventSearch } from "@/components/marketplace/EventSearch";
import { EventGrid } from "@/components/marketplace/EventCard";
import { CategoryCard } from "@/components/marketplace/CategoryCard";
import { EmptyState } from "@/components/ui/States";
import { filterEvents, type EventFilters } from "@/lib/public-events-shared";
import { usePublicCatalog } from "@/lib/client-api";
import { cn } from "@/lib/ui/cn";

export function EventsPage() {
  const [searchParams] = useSearchParams();
  const { catalog, loading } = usePublicCatalog();

  const q = searchParams.get("q") || undefined;
  const city = searchParams.get("city") || undefined;
  const category = searchParams.get("category") || undefined;
  const from = searchParams.get("from") || undefined;
  const priceParam = searchParams.get("price");
  const price = priceParam === "free" || priceParam === "paid" ? priceParam : undefined;
  const sortParam = searchParams.get("sort");
  const sort = ["soonest", "price_asc", "price_desc", "popularity"].includes(sortParam || "")
    ? (sortParam as any)
    : "soonest";

  const filters: EventFilters = {
    q,
    city,
    category,
    from,
    price,
    sort,
  };

  const results = catalog ? filterEvents(catalog.events, filters, catalog.categories) : [];
  const hasFilters = Object.values(filters).some(Boolean);

  const priceHref = (p?: "free" | "paid") => {
    const qs = new URLSearchParams(searchParams);
    if (p) qs.set("price", p);
    else qs.delete("price");
    const s = qs.toString();
    return s ? `/events?${s}` : "/events";
  };

  const sortHref = (s?: string) => {
    const qs = new URLSearchParams(searchParams);
    if (s) qs.set("sort", s);
    else qs.delete("sort");
    const str = qs.toString();
    return str ? `/events?${str}` : "/events";
  };

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <PublicNavbar activeHref="/events" />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">Explore Events in Bangladesh</h1>
          <p className="mt-1 text-sm text-ink-muted">Concerts, tech summits, cultural festivals & student gatherings</p>
        </div>

        <EventSearch cities={catalog?.cities || []} defaults={{ q, city, category, from }} />

        {/* PILL FILTERS & SORT */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-ink-muted">Price:</span>
            <Link
              to={priceHref(undefined)}
              className={cn(
                "rounded-pill px-3 py-1 text-xs font-semibold transition",
                !price ? "bg-brand-600 text-white" : "bg-surface border border-line text-ink hover:bg-canvas-alt"
              )}
            >
              All
            </Link>
            <Link
              to={priceHref("free")}
              className={cn(
                "rounded-pill px-3 py-1 text-xs font-semibold transition",
                price === "free" ? "bg-brand-600 text-white" : "bg-surface border border-line text-ink hover:bg-canvas-alt"
              )}
            >
              Free
            </Link>
            <Link
              to={priceHref("paid")}
              className={cn(
                "rounded-pill px-3 py-1 text-xs font-semibold transition",
                price === "paid" ? "bg-brand-600 text-white" : "bg-surface border border-line text-ink hover:bg-canvas-alt"
              )}
            >
              Paid
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-ink-muted">Sort:</span>
            <select
              aria-label="Sort events"
              value={sort}
              onChange={(e) => {
                window.location.href = sortHref(e.target.value);
              }}
              className="rounded-btn border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink focus:border-brand-600 focus:outline-none"
            >
              <option value="soonest">Happening Soonest</option>
              <option value="popularity">Most Popular</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* RESULTS GRID */}
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="size-8 rounded-full border-3 border-brand-600 border-t-transparent animate-spin" />
          </div>
        ) : results.length > 0 ? (
          <div>
            <div className="mb-4 text-xs font-medium text-ink-muted">
              Showing {results.length} {results.length === 1 ? "event" : "events"}
            </div>
            <EventGrid events={results} categories={catalog?.categories || []} />
          </div>
        ) : (
          <EmptyState
            title="No events match your criteria"
            description="Try clearing some filters or searching for something else."
            action={
              hasFilters ? (
                <Link
                  to="/events"
                  className="rounded-btn bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700"
                >
                  Clear all filters
                </Link>
              ) : undefined
            }
          />
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
