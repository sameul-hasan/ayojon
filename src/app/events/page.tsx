import React from "react";
import Link from "next/link";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { EventSearch } from "@/components/marketplace/EventSearch";
import { EventGrid } from "@/components/marketplace/EventCard";
import { CategoryCard } from "@/components/marketplace/CategoryCard";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { getPublicCatalog } from "@/lib/public-events";
import { filterEvents, type EventFilters, type PublicCatalog } from "@/lib/public-events-shared";
import { cn } from "@/lib/ui/cn";

export const dynamic = "force-dynamic";
export const metadata = { title: "Explore events — Aayojon" };

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

export default async function EventsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const price = one(sp.price);
  const sort = one(sp.sort) as any;
  const filters: EventFilters = {
    q: one(sp.q),
    city: one(sp.city),
    category: one(sp.category),
    from: one(sp.from),
    price: price === "free" || price === "paid" ? price : undefined,
    sort: ["soonest", "price_asc", "price_desc", "popularity"].includes(sort) ? sort : "soonest",
  };

  let catalog: PublicCatalog | null = null;
  try {
    catalog = getPublicCatalog();
  } catch {
    catalog = null;
  }
  const results = catalog ? filterEvents(catalog.events, filters, catalog.categories) : [];
  const hasFilters = Object.values(filters).some(Boolean);

  const priceHref = (p?: "free" | "paid") => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...filters, price: p })) if (v) qs.set(k, v);
    const s = qs.toString();
    return s ? `/events?${s}` : "/events";
  };

  const sortHref = (s?: string) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...filters, sort: s })) if (v) qs.set(k, v);
    const str = qs.toString();
    return str ? `/events?${str}` : "/events";
  };

  return (
    <>
      <PublicNavbar
        items={[
          { label: "Explore", href: "/events" },
          { label: "Categories", href: "/#categories" },
          { label: "About", href: "/#about" },
        ]}
        activeHref="/events"
        signInHref="/login"
        hostHref="/#host"
      />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight">Explore events</h1>
        <p className="mt-1 text-ink-muted">Find your people. Find your events.</p>

        {!catalog ? (
          <div className="mt-8">
            <ErrorState title="We couldn't load events" description="Please refresh the page in a moment." />
          </div>
        ) : (
          <>
            <div className="mt-6">
              <EventSearch cities={catalog.cities} defaults={filters} compact />
            </div>

            <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3" aria-label="Categories">
              {catalog.categories.map((c) => (
                <CategoryCard key={c.id} category={c} active={filters.category === c.slug} />
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4" role="group" aria-label="Filters and Sorting">
              {/* Left: Price Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-ink-muted mr-1">Price:</span>
                {([undefined, "free", "paid"] as const).map((p) => (
                  <Link
                    key={p ?? "all"}
                    href={priceHref(p)}
                    aria-current={filters.price === p ? "true" : undefined}
                    className={cn(
                      "rounded-full border px-3.5 py-1 text-xs font-medium transition",
                      filters.price === p ? "border-brand-600 bg-brand-50 text-brand-700 font-semibold" : "border-line bg-surface text-ink-muted hover:bg-canvas-alt hover:text-ink"
                    )}
                  >
                    {p === "free" ? "Free Only" : p === "paid" ? "Paid Tickets" : "All Prices"}
                  </Link>
                ))}
              </div>

              {/* Right: Sorting Options */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-ink-muted mr-1">Sort:</span>
                {[
                  { id: "soonest", label: "Date: Soonest" },
                  { id: "popularity", label: "Most Popular" },
                  { id: "price_asc", label: "Price: Low to High" },
                  { id: "price_desc", label: "Price: High to Low" },
                ].map((s) => (
                  <Link
                    key={s.id}
                    href={sortHref(s.id)}
                    aria-current={filters.sort === s.id ? "true" : undefined}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition",
                      filters.sort === s.id ? "border-brand-600 bg-brand-600 text-white font-semibold" : "border-line bg-surface text-ink-muted hover:bg-canvas-alt hover:text-ink"
                    )}
                  >
                    {s.label}
                  </Link>
                ))}

                {hasFilters && (
                  <Link href="/events" className="text-xs font-semibold text-brand-600 hover:text-brand-700 ml-2">
                    Clear all
                  </Link>
                )}
              </div>
            </div>

            <p className="mt-4 text-xs font-medium text-ink-muted" role="status">
              Showing <span className="font-bold text-ink">{results.length}</span> {results.length === 1 ? "event" : "events"} matching your criteria
            </p>
            <div className="mt-3">
              {results.length ? (
                <EventGrid events={results} categories={catalog.categories} />
              ) : (
                <EmptyState
                  title="No events match your search"
                  description="Try a different keyword, location, or date."
                  action={
                    <Link href="/events" className="inline-flex h-11 items-center rounded-btn bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700">
                      Clear filters
                    </Link>
                  }
                />
              )}
            </div>
          </>
        )}
      </main>
      <PublicFooter />
    </>
  );
}
