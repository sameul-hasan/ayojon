import { useState, useEffect } from "react";
import type { DatabaseState, EventRecord, RoleDefinition, VenueProfile, TicketType } from "@/lib/types";
import { createInitialSeed } from "./seed";
import {
  type PublicCatalog,
  type PublicEvent,
  type PublicCategory,
  type PublicEventDetail,
} from "./public-events-shared";
import {
  loadFirestoreState,
  saveEventToFirestore,
  updateEventStatusInFirestore,
} from "./firebase/firestore";

let cachedDb: DatabaseState | null = null;
let dbFetchPromise: Promise<DatabaseState> | null = null;

export function invalidateDbCache() {
  cachedDb = null;
  dbFetchPromise = null;
}

export async function fetchDatabaseState(): Promise<DatabaseState> {
  if (cachedDb) return cachedDb;
  if (!dbFetchPromise) {
    dbFetchPromise = (async () => {
      // 1. Try Firebase Cloud Firestore first (live DB)
      try {
        const firestoreState = await loadFirestoreState();
        if (firestoreState && firestoreState.events && firestoreState.events.length > 0) {
          cachedDb = firestoreState;
          dbFetchPromise = null;
          return firestoreState;
        }
      } catch (err) {
        console.warn("[ClientApi] Firestore fetch failed, trying API middleware:", err);
      }

      // 2. Try Local API Middleware if running
      try {
        const res = await fetch("/api/v1/state");
        if (res.ok) {
          const db = await res.json();
          cachedDb = db;
          dbFetchPromise = null;
          return db;
        }
      } catch {
        // API middleware not reachable (e.g. static hosting)
      }

      // 3. Fallback to Initial Seed State
      const fallback = createInitialSeed();
      cachedDb = fallback;
      dbFetchPromise = null;
      return fallback;
    })();
  }
  return dbFetchPromise;
}

export async function dispatchStateAction(
  action: string,
  payload: Record<string, unknown> = {},
  actorUserId?: string
): Promise<any> {
  let resultData: any = null;

  // 1. Send to server API middleware if available
  try {
    const res = await fetch("/api/v1/state", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(actorUserId ? { "X-Actor-User-Id": actorUserId } : {}),
      },
      body: JSON.stringify({ action, actorUserId, payload }),
    });
    if (res.ok) {
      const data = await res.json();
      resultData = data;
      if (data.data) cachedDb = data.data;
    }
  } catch {
    // API middleware not reachable
  }

  // 2. Sync directly to Cloud Firestore
  try {
    if (action === "CREATE_EVENT_DRAFT") {
      const p = payload as any;
      const eventId = `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const slug = (p.title || "event")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const newEvent: EventRecord = {
        id: eventId,
        organization_id: p.organizationId || "org-buet-cc",
        category_id: p.categoryId || "cat-tech",
        venue_id: null,
        title: p.title || "Untitled Event",
        slug: `${slug}-${Math.random().toString(36).slice(2, 6)}`,
        tagline: p.description ? p.description.slice(0, 100) : "",
        description: p.description || "",
        status: "DRAFT",
        visibility: "PUBLIC",
        starts_at: p.startsAt || new Date().toISOString(),
        ends_at: p.endsAt || new Date(Date.now() + 86400000).toISOString(),
        timezone: "Asia/Dhaka",
        capacity: Number(p.capacity) || 100,
        is_online: Boolean(p.isOnline),
        cover_gradient: "from-blue-600 to-indigo-900",
        brand_theme: p.brandTheme || "#2563eb",
        agenda: [],
        speakers: [],
        tags: ["tech", "bangladesh"],
        package_code: null,
        is_featured: false,
        views_count: 0,
        saves_count: 0,
        refund_policy: "Standard 7-day refund policy",
        contact_email: "organizer@aayojon.bd",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const ticketTypes: TicketType[] = (p.ticketTypes || []).map((t: any, idx: number) => ({
        id: `tkt-type-${Date.now().toString(36)}-${idx}`,
        event_id: eventId,
        name: t.name || "General Admission",
        description: t.description || "Official event admission pass",
        price_minor: t.priceMinor || 0,
        currency: "BDT",
        capacity: t.capacity || 100,
        sold_count: 0,
        sales_start: new Date().toISOString(),
        sales_end: p.endsAt || new Date(Date.now() + 86400000).toISOString(),
      }));

      await saveEventToFirestore(newEvent, ticketTypes);

      if (!resultData) {
        if (cachedDb) {
          cachedDb.events.push(newEvent);
          if (ticketTypes.length > 0) cachedDb.ticket_types.push(...ticketTypes);
        }
        resultData = {
          success: true,
          data: cachedDb,
          result: { id: eventId, title: newEvent.title, slug: newEvent.slug },
        };
      }
    } else if (action === "PUBLISH_EVENT" || action === "PURCHASE_PACKAGE_AND_VERIFY") {
      const p = payload as any;
      if (p.eventId) {
        await updateEventStatusInFirestore(p.eventId, {
          status: "PUBLISHED",
          package_code: p.packageCode || "BASIC",
          updated_at: new Date().toISOString(),
        });
        if (cachedDb) {
          const ev = cachedDb.events.find((e) => e.id === p.eventId);
          if (ev) {
            ev.status = "PUBLISHED";
            ev.package_code = p.packageCode || "BASIC";
          }
        }
      }
    }
  } catch (err: any) {
    console.warn("[Firestore] Action sync notice:", err?.message);
  }

  invalidateDbCache();
  return resultData || { success: true };
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
