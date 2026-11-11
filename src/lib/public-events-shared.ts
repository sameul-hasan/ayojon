// Client-safe types and pure helpers (no server imports).

/** Sanitized, public-safe event shape for discovery pages (no PII, no orders, no tokens). */
export interface PublicEvent {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  categoryId: string;
  categoryName: string;
  startsAt: string;
  endsAt: string;
  city: string;
  venueName: string;
  isOnline: boolean;
  lat: number | null;
  lng: number | null;
  /** Lowest ticket price in minor units; null when no ticket types exist. */
  minPriceMinor: number | null;
  organizerName: string;
  organizerVerified: boolean;
  isFeatured: boolean;
  popularity: number;
}

export interface PublicCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  count: number;
}

export interface PublicCatalog {
  events: PublicEvent[];
  categories: PublicCategory[];
  cities: string[];
}

export interface EventFilters {
  q?: string;
  city?: string;
  category?: string;
  /** YYYY-MM-DD; keep events that start on or after this day. */
  from?: string;
  price?: "free" | "paid";
  sort?: "soonest" | "price_asc" | "price_desc" | "popularity";
}

export function filterEvents(events: PublicEvent[], f: EventFilters, categories: PublicCategory[]): PublicEvent[] {
  const q = f.q?.trim().toLowerCase();
  const cat = f.category ? categories.find((c) => c.slug === f.category || c.id === f.category) : undefined;
  const filtered = events.filter((e) => {
    if (q && !`${e.title} ${e.tagline} ${e.categoryName} ${e.organizerName}`.toLowerCase().includes(q)) return false;
    if (f.city && e.city.toLowerCase() !== f.city.toLowerCase()) return false;
    if (f.category && (!cat || e.categoryId !== cat.id)) return false;
    if (f.from && /^\d{4}-\d{2}-\d{2}$/.test(f.from) && e.endsAt.slice(0, 10) < f.from) return false;
    if (f.price === "free" && e.minPriceMinor !== 0) return false;
    if (f.price === "paid" && !(e.minPriceMinor !== null && e.minPriceMinor > 0)) return false;
    return true;
  });

  if (f.sort === "price_asc") {
    filtered.sort((a, b) => (a.minPriceMinor ?? 0) - (b.minPriceMinor ?? 0));
  } else if (f.sort === "price_desc") {
    filtered.sort((a, b) => (b.minPriceMinor ?? 0) - (a.minPriceMinor ?? 0));
  } else if (f.sort === "popularity") {
    filtered.sort((a, b) => b.popularity - a.popularity);
  } else {
    // default soonest
    filtered.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  }

  return filtered;
}

/** Event details route. */
export function eventHref(e: Pick<PublicEvent, "slug">): string {
  return `/events/${encodeURIComponent(e.slug)}`;
}

export const TICKET_SERVICE_FEE_BPS = 250; // mirrors TICKET_SERVICE_FEE_BPS in src/lib/db.ts
export const MAX_TICKETS_PER_ORDER = 10; // mirrors the backend limit

export interface PublicTicketType {
  id: string;
  name: string;
  description: string;
  priceMinor: number;
  remaining: number;
}

export interface PublicSponsor {
  id: string;
  name: string;
  companyName: string;
  tier: string;
}

export interface PublicEventDetail extends PublicEvent {
  description: string;
  address: string;
  agenda: Array<{ time: string; title: string; speaker?: string }>;
  speakers: Array<{ name: string; role: string; org: string }>;
  sponsors: PublicSponsor[];
  tags: string[];
  refundPolicy: string;
  contactEmail: string;
  organizerDescription: string;
  tickets: PublicTicketType[];
  hasEnded: boolean;
  related: PublicEvent[];
}

export function computeTotals(priceMinor: number, quantity: number) {
  const subtotalMinor = priceMinor * quantity;
  const feeMinor = subtotalMinor > 0 ? Math.round((subtotalMinor * TICKET_SERVICE_FEE_BPS) / 10000) : 0;
  return { subtotalMinor, feeMinor, totalMinor: subtotalMinor + feeMinor };
}

export function formatBDT(amount: number): string {
  return `৳ ${Math.round(amount).toLocaleString("en-BD")}`;
}

