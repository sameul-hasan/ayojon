import { useState, useEffect } from "react";
import type { DatabaseState, EventRecord, RoleDefinition, VenueProfile } from "@/lib/types";
import { createInitialSeed } from "./seed";
import {
  type PublicCatalog,
  type PublicEvent,
  type PublicCategory,
  type PublicEventDetail,
} from "./public-events-shared";

let cachedDb: DatabaseState | null = null;
let dbFetchPromise: Promise<DatabaseState> | null = null;

export function invalidateDbCache() {
  cachedDb = null;
  dbFetchPromise = null;
}

export async function fetchDatabaseState(): Promise<DatabaseState> {
  if (cachedDb) return cachedDb;
  if (!dbFetchPromise) {
    dbFetchPromise = fetch("/api/v1/state")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load database state from API");
        return res.json();
      })
      .then((db) => {
        cachedDb = db;
        dbFetchPromise = null;
        return db;
      })
      .catch((err) => {
        dbFetchPromise = null;
        console.warn("fetchDatabaseState fallback to initial seed:", err.message);
        const fallback = createInitialSeed();
        cachedDb = fallback;
        return fallback;
      });
  }
  return dbFetchPromise;
}

export async function dispatchStateAction(
  action: string,
  payload: Record<string, unknown> = {},
  actorUserId?: string
): Promise<any> {
  const res = await fetch("/api/v1/state", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(actorUserId ? { "X-Actor-User-Id": actorUserId } : {}),
    },
    body: JSON.stringify({ action, actorUserId, payload }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `Action ${action} failed`);
  }
  if (data.data) {
    cachedDb = data.data;
  } else {
    invalidateDbCache();
  }
  return data;
}

export function transformDbToCatalog(db: DatabaseState): PublicCatalog {
  const events: PublicEvent[] = db.events
    .filter((e) => e.status === "PUBLISHED" && e.visibility === "PUBLIC")
    .map((e) => {
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
        city: venue?.city || "Dhaka",
        venueName: venue?.name || "Online event",
        isOnline: !venue,
        lat: venue?.geo_lat ?? null,
        lng: venue?.geo_lng ?? null,
        minPriceMinor: prices.length ? Math.min(...prices) : null,
        organizerName: org?.name ?? "Aayojon Organizer",
        organizerVerified: !!org?.verified_badge,
        isFeatured: false,
        popularity: 100,
      };
    });

  const categories: PublicCategory[] = db.categories
    .filter((c) => c.active)
    .map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      icon: c.icon,
      count: events.filter((e) => e.categoryId === c.id).length,
    }));

  const citySet = new Set<string>();
  events.forEach((e) => {
    if (e.city) citySet.add(e.city);
  });

  return {
    events,
    categories,
    cities: Array.from(citySet),
  };
}

export function usePublicCatalog() {
  const [catalog, setCatalog] = useState<PublicCatalog>(() => transformDbToCatalog(createInitialSeed()));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchDatabaseState()
      .then((db) => {
        if (active) {
          setCatalog(transformDbToCatalog(db));
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return { catalog, loading, error };
}

export function useEventDetail(slug: string) {
  const [eventDetail, setEventDetail] = useState<PublicEventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchDatabaseState()
      .then((db) => {
        if (!active) return;
        const event = db.events.find((e) => e.slug === slug || e.id === slug);
        if (!event) {
          setError("Event not found");
          setLoading(false);
          return;
        }

        const venue = event.venue_id ? db.venues.find((v) => v.id === event.venue_id) : undefined;
        const org = db.organizations.find((o) => o.id === event.organization_id);
        const ticketTypes = db.ticket_types.filter((t) => t.event_id === event.id);
        const prices = ticketTypes.map((t) => t.price_minor);

        const detail: PublicEventDetail = {
          id: event.id,
          slug: event.slug,
          title: event.title,
          tagline: event.tagline,
          categoryId: event.category_id,
          categoryName: db.categories.find((c) => c.id === event.category_id)?.name ?? "Event",
          startsAt: event.starts_at,
          endsAt: event.ends_at,
          city: venue?.city || "Dhaka",
          venueName: venue?.name || "Online event",
          isOnline: !venue,
          lat: venue?.geo_lat ?? null,
          lng: venue?.geo_lng ?? null,
          minPriceMinor: prices.length ? Math.min(...prices) : null,
          organizerName: org?.name ?? "Aayojon Organizer",
          organizerVerified: !!org?.verified_badge,
          isFeatured: false,
          popularity: 150,
          description: event.description,
          address: venue?.address || "Dhaka, Bangladesh",
          agenda: event.agenda || [],
          speakers: [],
          sponsors: [],
          tags: event.tags || [],
          refundPolicy: "Full refund up to 48 hours before the event starts.",
          contactEmail: org ? `contact@${org.slug}.bd` : "support@aayojon.bd",
          organizerDescription: org?.description || "Verified Organizer on Aayojon",
          tickets: ticketTypes.map((tt) => ({
            id: tt.id,
            name: tt.name,
            description: tt.description,
            priceMinor: tt.price_minor,
            remaining: Math.max(0, tt.capacity - tt.sold_count),
          })),
          hasEnded: new Date(event.ends_at).getTime() < Date.now(),
          related: [],
        };

        setEventDetail(detail);
        setLoading(false);
      })
      .catch((err) => {
        if (active) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [slug]);

  return { eventDetail, loading, error };
}

export function useVenues() {
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDatabaseState()
      .then((db) => {
        const list = db.venue_profiles.map((vp) => {
          const venue = db.venues.find((v) => v.id === vp.id || v.name === vp.name);
          return {
            ...vp,
            venue,
          };
        });
        setVenues(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { venues, loading };
}

export function useRoles() {
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = () => {
    setLoading(true);
    fetch("/api/v1/roles")
      .then((res) => res.json())
      .then((data) => {
        if (data.roles) setRoles(data.roles);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  return { roles, loading, refresh: fetchRoles };
}
