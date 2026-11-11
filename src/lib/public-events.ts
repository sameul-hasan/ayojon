import "server-only";
import { loadDb } from "@/lib/db";
import type { DatabaseState, EventRecord } from "@/lib/types";
import type {
  PublicCategory,
  PublicCatalog,
  PublicEvent,
  PublicEventDetail,
} from "./public-events-shared";

export type { PublicCategory, PublicCatalog, PublicEvent, PublicEventDetail };

function toPublicEvent(db: DatabaseState, e: EventRecord): PublicEvent {
  const venue = e.venue_id ? db.venues.find((v) => v.id === e.venue_id) : undefined;
  const org = db.organizations.find((o) => o.id === e.organization_id);
  const prices = db.ticket_types.filter((t) => t.event_id === e.id).map((t) => t.price_minor);
  return {
    id: e.id,
    slug: e.slug,
    title: e.title,
    tagline: e.tagline,
    categoryId: e.category_id,
    categoryName: db.categories.find((c) => c.id === e.category_id)?.name ?? "Event",
    startsAt: e.starts_at,
    endsAt: e.ends_at,
    city: e.is_online ? "Online" : (venue?.city ?? ""),
    venueName: e.is_online ? "Online event" : (venue?.name ?? ""),
    isOnline: e.is_online,
    lat: e.is_online ? null : (venue?.geo_lat ?? null),
    lng: e.is_online ? null : (venue?.geo_lng ?? null),
    minPriceMinor: prices.length ? Math.min(...prices) : null,
    organizerName: org?.name ?? "Organizer",
    organizerVerified: !!org?.verified_badge,
    isFeatured: e.is_featured,
    popularity: e.views_count + e.saves_count * 2,
  };
}

function isListable(db: DatabaseState, e: EventRecord, now: Date): boolean {
  return (
    e.status === "PUBLISHED" &&
    e.visibility === "PUBLIC" &&
    new Date(e.ends_at).getTime() >= now.getTime() &&
    db.organizations.find((o) => o.id === e.organization_id)?.status !== "SUSPENDED"
  );
}

/** Read published, public, not-yet-ended events straight from the data layer (server only). */
export function getPublicCatalog(now: Date = new Date()): PublicCatalog {
  const db = loadDb();
  const events = db.events
    .filter((e) => isListable(db, e, now))
    .map((e) => toPublicEvent(db, e))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  const categories: PublicCategory[] = db.categories
    .filter((c) => c.active)
    .map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      icon: c.icon,
      count: events.filter((e) => e.categoryId === c.id).length,
    }));

  const cities = Array.from(new Set(events.map((e) => e.city).filter(Boolean))).sort();
  return { events, categories, cities };
}

/**
 * Public details for one event, looked up by slug or id.
 * Published PUBLIC and UNLISTED events resolve (unlisted = direct link). Drafts, private,
 * cancelled, suspended events and suspended organizers return null.
 */
export function getPublicEventDetail(slugOrId: string, now: Date = new Date()): PublicEventDetail | null {
  const db = loadDb();
  const e = db.events.find((x) => x.slug === slugOrId || x.id === slugOrId);
  if (!e || e.status !== "PUBLISHED" || e.visibility === "PRIVATE") return null;
  const org = db.organizations.find((o) => o.id === e.organization_id);
  if (org?.status === "SUSPENDED") return null;

  const venue = e.venue_id ? db.venues.find((v) => v.id === e.venue_id) : undefined;
  const tickets = db.ticket_types
    .filter((t) => t.event_id === e.id)
    .map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      priceMinor: t.price_minor,
      remaining: Math.max(0, Math.min(t.capacity - t.sold_count, e.capacity - t.sold_count)),
    }));

  const sponsors = (db.sponsor_inquiries || [])
    .filter((s) => s.event_id === e.id && s.status === "APPROVED")
    .map((s) => ({
      id: s.id,
      name: s.sponsor_name,
      companyName: s.company_name || s.sponsor_name,
      tier: s.placement_tier.replace(/_/g, " "),
    }));

  const related = db.events
    .filter((r) => r.id !== e.id && r.category_id === e.category_id && isListable(db, r, now))
    .map((r) => toPublicEvent(db, r))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .slice(0, 4);

  return {
    ...toPublicEvent(db, e),
    description: e.description,
    address: e.is_online ? "" : (venue?.address ?? ""),
    agenda: e.agenda,
    speakers: e.speakers,
    sponsors,
    tags: e.tags,
    refundPolicy: e.refund_policy,
    contactEmail: e.contact_email || "support@aayojon.com.bd",
    organizerDescription: org?.description ?? "",
    tickets,
    hasEnded: new Date(e.ends_at).getTime() < now.getTime(),
    related,
  };
}
