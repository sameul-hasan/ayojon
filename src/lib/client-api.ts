import { useState, useEffect } from "react";
import type {
  DatabaseState,
  EventRecord,
  Order,
  OrderItem,
  Registration,
  RoleDefinition,
  TicketRecord,
  TicketType,
  VenueProfile,
} from "@/lib/types";
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
  saveOrderToFirestore,
  saveTicketToFirestore,
  saveRegistrationToFirestore,
  saveVenueProfileToFirestore,
  saveVenueRequestToFirestore,
  saveQuotationToFirestore,
  saveVenueBookingToFirestore,
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
        }
      } catch (err) {
        console.warn("[ClientApi] Firestore fetch failed, trying API middleware:", err);
      }

      // 2. Try Local API Middleware if running and firestore didn't populate
      if (!cachedDb) {
        try {
          const res = await fetch("/api/v1/state");
          if (res.ok) {
            const db = await res.json();
            cachedDb = db;
          }
        } catch {
          // API middleware not reachable (e.g. static hosting)
        }
      }

      // 3. Fallback to Initial Seed State
      if (!cachedDb) {
        cachedDb = createInitialSeed();
      }

      // 4. Attach active session profile if present so user is immediately in DB
      try {
        if (typeof window !== "undefined" && cachedDb) {
          const raw = localStorage.getItem("aayojon_user_session");
          if (raw) {
            const user = JSON.parse(raw);
            if (user && (user.uid || user.id)) {
              const uid = user.uid || user.id;
              const exists = cachedDb.profiles.some(
                (p) => p.id === uid || (user.email && p.email?.toLowerCase() === user.email.toLowerCase())
              );
              if (!exists) {
                cachedDb.profiles.unshift({
                  id: uid,
                  email: user.email || "",
                  display_name: user.displayName || user.display_name || user.email?.split("@")[0] || "User",
                  platform_role: user.platform_role || "ATTENDEE",
                  avatar_url: user.photoURL || undefined,
                  phone: user.phone || "",
                  organization_label: user.organization_label || "",
                  mfa_enabled: false,
                  interests: user.interests || [],
                  preferred_city: user.preferred_city || "Dhaka",
                  created_at: user.created_at || new Date().toISOString(),
                });
              }
            }
          }
        }
      } catch {
        // Ignore
      }

      dbFetchPromise = null;
      return cachedDb;
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
        organizer_user_id: p.organizerUserId || actorUserId,
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
        contact_email: "organizer@ayojon.select",
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

      if (!cachedDb) {
        cachedDb = createInitialSeed();
      }
      cachedDb.events = [newEvent, ...cachedDb.events.filter((e) => e.id !== eventId)];
      if (ticketTypes.length > 0) {
        cachedDb.ticket_types = [...ticketTypes, ...cachedDb.ticket_types];
      }

      resultData = {
        success: true,
        data: { ...cachedDb },
        result: { id: eventId, title: newEvent.title, slug: newEvent.slug },
      };
    } else if (action === "PUBLISH_EVENT" || action === "PURCHASE_PACKAGE_AND_VERIFY") {
      const p = payload as any;
      if (p.eventId) {
        await updateEventStatusInFirestore(p.eventId, {
          status: "PUBLISHED",
          package_code: p.packageCode || "BASIC",
          updated_at: new Date().toISOString(),
        });
        if (!cachedDb) {
          cachedDb = createInitialSeed();
        }
        const ev = cachedDb.events.find((e) => e.id === p.eventId);
        if (ev) {
          ev.status = "PUBLISHED";
          ev.package_code = p.packageCode || "BASIC";
        }
        resultData = {
          success: true,
          data: { ...cachedDb },
          result: { id: p.eventId, status: "PUBLISHED" },
        };
      }
    } else if (action === "VERIFY_PENDING_ORDER_WEBHOOK" || action === "PURCHASE_TICKET") {
      const p = payload as any;
      if (p.orderId && cachedDb) {
        const order = cachedDb.orders.find((o) => o.id === p.orderId);
        if (order) {
          await saveOrderToFirestore(order);
          const regs = cachedDb.registrations.filter((r) => r.order_id === p.orderId);
          const regIds = new Set(regs.map((r) => r.id));
          const tickets = cachedDb.tickets.filter((t) => regIds.has(t.registration_id));
          for (const t of tickets) {
            await saveTicketToFirestore(t);
          }
        }
      }
    } else if (action === "REGISTER_FREE") {
      const p = payload as any;
      if (!cachedDb) cachedDb = createInitialSeed();
      const ticketType =
        cachedDb.ticket_types.find((t) => t.id === p.ticketTypeId) ||
        cachedDb.ticket_types.find((t) => t.event_id === p.eventId);
      const regId = `reg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const orderId = `ord-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const ticketId = `tkt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const qrToken = `AAYOJON-TKT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

      const newReg: any = {
        id: regId,
        order_id: orderId,
        event_id: p.eventId,
        ticket_type_id: ticketType?.id || "tt-free",
        attendee_user_id: actorUserId || "usr-attendee-current",
        attendee_name: p.attendeeName || "Attendee",
        attendee_email: p.attendeeEmail || "attendee@ayojon.select",
        attendee_phone: p.phone || "",
        created_at: new Date().toISOString(),
      };

      const newTicket: any = {
        id: ticketId,
        registration_id: regId,
        qr_token: qrToken,
        status: "ISSUED",
        created_at: new Date().toISOString(),
      };

      cachedDb.registrations = [newReg, ...cachedDb.registrations];
      cachedDb.tickets = [newTicket, ...cachedDb.tickets];
      if (ticketType) {
        ticketType.sold_count = (ticketType.sold_count || 0) + 1;
      }

      await saveRegistrationToFirestore(newReg);
      await saveTicketToFirestore(newTicket);

      resultData = {
        success: true,
        data: { ...cachedDb },
        result: { registration: newReg, ticket: newTicket },
      };
    } else if (action === "BUY_TICKET") {
      const p = payload as any;
      if (!cachedDb) cachedDb = createInitialSeed();
      const ticketType =
        cachedDb.ticket_types.find((t) => t.id === p.ticketTypeId) ||
        cachedDb.ticket_types.find((t) => t.event_id === p.eventId);
      const orderId = `ord-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const regId = `reg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const ticketId = `tkt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const qrToken = `AAYOJON-TKT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

      const newOrder: any = {
        id: orderId,
        user_id: actorUserId || "usr-attendee-current",
        total_minor: ticketType ? ticketType.price_minor : 0,
        currency: "BDT",
        status: "PAID",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const newReg: any = {
        id: regId,
        order_id: orderId,
        event_id: p.eventId,
        ticket_type_id: ticketType?.id || "tt-gen",
        attendee_user_id: actorUserId || "usr-attendee-current",
        attendee_name: p.attendeeName || "Attendee",
        attendee_email: p.attendeeEmail || "attendee@ayojon.select",
        attendee_phone: p.phone || "",
        created_at: new Date().toISOString(),
      };

      const newTicket: any = {
        id: ticketId,
        registration_id: regId,
        qr_token: qrToken,
        status: "ISSUED",
        created_at: new Date().toISOString(),
      };

      cachedDb.orders = [newOrder, ...cachedDb.orders];
      cachedDb.registrations = [newReg, ...cachedDb.registrations];
      cachedDb.tickets = [newTicket, ...cachedDb.tickets];
      if (ticketType) {
        ticketType.sold_count = (ticketType.sold_count || 0) + 1;
      }

      await saveOrderToFirestore(newOrder);
      await saveRegistrationToFirestore(newReg);
      await saveTicketToFirestore(newTicket);

      resultData = {
        success: true,
        data: { ...cachedDb },
        result: { order: newOrder, registration: newReg, ticket: newTicket },
      };
    } else if (action === "SUBMIT_VENUE_RFQ" || action === "CREATE_VENUE_RFQ") {
      const p = payload as any;
      if (!cachedDb) cachedDb = createInitialSeed();
      const rfqId = p.id || `rfq-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const newRfq: any = {
        ...p,
        id: rfqId,
        organizer_user_id: p.organizer_user_id || actorUserId || "usr-org-current",
        status: "SUBMITTED",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      cachedDb.venue_requests = cachedDb.venue_requests || [];
      cachedDb.venue_requests = [newRfq, ...cachedDb.venue_requests.filter((r) => r.id !== rfqId)];
      await saveVenueRequestToFirestore(newRfq);
      resultData = {
        success: true,
        data: { ...cachedDb },
        result: newRfq,
      };
    } else if (action === "SUBMIT_PROVIDER_QUOTATION") {
      const p = payload as any;
      if (!cachedDb) cachedDb = createInitialSeed();
      const quoteId = p.id || `qt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const newQuote: any = {
        ...p,
        id: quoteId,
        provider_user_id: p.provider_user_id || actorUserId || "usr-venue-kamal",
        status: "SUBMITTED",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      cachedDb.quotations = cachedDb.quotations || [];
      cachedDb.quotations = [newQuote, ...cachedDb.quotations.filter((q) => q.id !== quoteId)];
      await saveQuotationToFirestore(newQuote);
      resultData = {
        success: true,
        data: { ...cachedDb },
        result: newQuote,
      };
    } else if (action === "BOOK_VENUE_ESCROW" || action === "CREATE_VENUE_BOOKING") {
      const p = payload as any;
      if (!cachedDb) cachedDb = createInitialSeed();
      const bookingId = p.id || `vb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const newBooking: any = {
        ...p,
        id: bookingId,
        status: "CONFIRMED",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      cachedDb.venue_bookings = cachedDb.venue_bookings || [];
      cachedDb.venue_bookings = [newBooking, ...cachedDb.venue_bookings.filter((b) => b.id !== bookingId)];
      await saveVenueBookingToFirestore(newBooking);
      resultData = {
        success: true,
        data: { ...cachedDb },
        result: newBooking,
      };
    } else if (action === "SAVE_VENUE_PROFILE") {
      const p = payload as any;
      if (!cachedDb) cachedDb = createInitialSeed();
      const venueId = p.id || `vp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const newVp: any = {
        ...p,
        id: venueId,
        updated_at: new Date().toISOString(),
      };
      cachedDb.venue_profiles = cachedDb.venue_profiles || [];
      cachedDb.venue_profiles = [newVp, ...cachedDb.venue_profiles.filter((v) => v.id !== venueId)];
      await saveVenueProfileToFirestore(newVp);
      resultData = {
        success: true,
        data: { ...cachedDb },
        result: newVp,
      };
    }
  } catch (err: any) {
    console.warn("[Firestore] Action sync notice:", err?.message);
  }

  if (resultData?.data) {
    cachedDb = resultData.data;
  }
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
        city: venue?.city || (e.is_online ? "Online" : "Dhaka"),
        venueName: venue?.name || (e.is_online ? "Online Event" : ((e as any).venue_name || "Dhaka, Bangladesh")),
        isOnline: Boolean(e.is_online),
        lat: venue?.geo_lat ?? null,
        lng: venue?.geo_lng ?? null,
        minPriceMinor: prices.length ? Math.min(...prices) : null,
        organizerName: org?.name ?? "Aayojon Organizer",
        organizerVerified: !!org?.verified_badge,
        isFeatured: Boolean(e.is_featured),
        popularity: e.views_count || 100,
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
  const [catalog, setCatalog] = useState<PublicCatalog>(() =>
    transformDbToCatalog(cachedDb || createInitialSeed())
  );
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
          city: venue?.city || (event.is_online ? "Online" : "Dhaka"),
          venueName: venue?.name || (event.is_online ? "Online Event" : ((event as any).venue_name || "Dhaka, Bangladesh")),
          isOnline: Boolean(event.is_online),
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
          contactEmail: event.contact_email || "support@ayojon.select",
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
      .then((res) => (res.ok && res.headers.get("content-type")?.includes("application/json") ? res.json() : null))
      .then((data) => {
        if (data?.roles) setRoles(data.roles);
      })
      .catch(() => {
        // Static hosting fallback: ignore missing local API
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  return { roles, loading, refresh: fetchRoles };
}

function browserRandomHex(bytes = 6): string {
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    const arr = new Uint8Array(bytes);
    window.crypto.getRandomValues(arr);
    return Array.from(arr, (b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
  }
  return Math.random().toString(36).slice(2, 2 + bytes * 2).toUpperCase();
}

async function browserSha256(value: string): Promise<string> {
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    const data = new TextEncoder().encode(value);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer), (b) => b.toString(16).padStart(2, "0")).join("");
  }
  return `hash-${value}`;
}

export async function clientCreateTicketOrder(input: {
  eventId: string;
  buyerUserId: string;
  items: { ticketTypeId: string; quantity: number }[];
  attendee: {
    name: string;
    email: string;
    phone?: string;
    instituteOrCompany?: string;
  };
  idempotencyKey?: string;
}): Promise<Order> {
  const db = await fetchDatabaseState();
  const event = db.events.find((e) => e.id === input.eventId);
  if (!event || event.status !== "PUBLISHED") {
    throw new Error("Published event not found for ticket purchase.");
  }

  const idemKey = input.idempotencyKey || `ord-idem-${Date.now()}-${browserRandomHex(4)}`;
  const existing = db.orders.find((o) => o.idempotency_key === idemKey);
  if (existing) {
    return existing;
  }

  let subtotalMinor = 0;
  const pendingItems: Array<{ ticketType: TicketType; quantity: number; lineTotal: number }> = [];

  for (const item of input.items) {
    const qty = Math.floor(item.quantity);
    if (qty <= 0 || qty > 10) {
      throw new Error("Quantity per ticket tier must be between 1 and 10.");
    }
    const tt = db.ticket_types.find((t) => t.id === item.ticketTypeId && t.event_id === event.id);
    if (!tt) {
      throw new Error("Selected ticket tier not found.");
    }
    const remaining = Math.max(0, tt.capacity - tt.sold_count);
    if (qty > remaining) {
      throw new Error(`Only ${remaining} ticket(s) remaining for ${tt.name}.`);
    }
    const lineTotal = tt.price_minor * qty;
    subtotalMinor += lineTotal;
    pendingItems.push({ ticketType: tt, quantity: qty, lineTotal });
  }

  const feeMinor = Math.round(subtotalMinor * 0.025);
  const totalMinor = subtotalMinor + feeMinor;
  const orderId = `ord-${Date.now().toString(36)}-${browserRandomHex(3).toLowerCase()}`;
  const now = new Date().toISOString();

  const order: Order = {
    id: orderId,
    buyer_user_id: input.buyerUserId || null,
    event_id: event.id,
    order_type: "TICKET",
    status: "PENDING",
    subtotal_minor: subtotalMinor,
    fee_minor: feeMinor,
    total_minor: totalMinor,
    currency: "BDT",
    idempotency_key: idemKey,
    attendee_name: input.attendee.name.trim(),
    attendee_email: input.attendee.email.trim().toLowerCase(),
    attendee_phone: input.attendee.phone?.trim(),
    institute_or_company: input.attendee.instituteOrCompany?.trim(),
    created_at: now,
  };

  for (const p of pendingItems) {
    p.ticketType.sold_count += p.quantity;
    const orderItem: OrderItem = {
      id: `oi-${Date.now().toString(36)}-${browserRandomHex(2).toLowerCase()}`,
      order_id: orderId,
      ticket_type_id: p.ticketType.id,
      package_id: null,
      description: `${event.title} — ${p.ticketType.name}`,
      quantity: p.quantity,
      unit_price_minor: p.ticketType.price_minor,
      line_total_minor: p.lineTotal,
    };
    db.order_items.push(orderItem);
  }

  db.orders.unshift(order);
  cachedDb = db;
  await saveOrderToFirestore(order);
  return order;
}

export async function clientSandboxConfirmPayment(input: {
  orderId: string;
  provider?: string;
}): Promise<Order> {
  const db = await fetchDatabaseState();
  const order = db.orders.find((o) => o.id === input.orderId);
  if (!order) {
    throw new Error("Order not found.");
  }
  if (order.status === "PAID") {
    return order;
  }

  order.status = "PAID";
  const now = new Date().toISOString();
  const items = db.order_items.filter((oi) => oi.order_id === order.id);

  for (const item of items) {
    if (!item.ticket_type_id) continue;
    const tt = db.ticket_types.find((t) => t.id === item.ticket_type_id);
    const reg: Registration = {
      id: `reg-${Date.now().toString(36)}-${browserRandomHex(3).toLowerCase()}`,
      event_id: order.event_id,
      user_id: order.buyer_user_id,
      order_id: order.id,
      ticket_type_id: item.ticket_type_id,
      attendee_name: order.attendee_name,
      attendee_email: order.attendee_email,
      attendee_phone: order.attendee_phone || "",
      institute_or_company: order.institute_or_company || "",
      marketing_consent: true,
      status: "CONFIRMED",
      created_at: now,
    };
    db.registrations.unshift(reg);
    await saveRegistrationToFirestore(reg);

    for (let q = 0; q < item.quantity; q++) {
      const rawToken = `AAYOJON-TKT-${order.event_id.toUpperCase()}-${browserRandomHex(6)}`;
      const tkt: TicketRecord = {
        id: `tkt-${Date.now().toString(36)}-${browserRandomHex(3).toLowerCase()}`,
        registration_id: reg.id,
        event_id: order.event_id,
        ticket_type_id: item.ticket_type_id,
        attendee_name: order.attendee_name,
        attendee_email: order.attendee_email,
        ticket_type_name: tt?.name || "General Admission",
        qr_token: rawToken,
        token_hash: await browserSha256(rawToken),
        status: "VALID",
        issued_at: now,
      };
      db.tickets.unshift(tkt);
      await saveTicketToFirestore(tkt);
    }
  }

  cachedDb = db;
  await saveOrderToFirestore(order);
  return order;
}

export async function clientRegisterFreeEvent(input: {
  eventSlugOrId: string;
  buyerUserId: string;
  ticketTypeId?: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone?: string;
  instituteOrCompany?: string;
}): Promise<{ registration: Registration; ticket: TicketRecord }> {
  const db = await fetchDatabaseState();
  const event = db.events.find((e) => e.slug === input.eventSlugOrId || e.id === input.eventSlugOrId);
  if (!event || event.status !== "PUBLISHED") {
    throw new Error("Published event not found.");
  }

  const normalizedEmail = input.attendeeEmail.trim().toLowerCase();
  const duplicate = db.registrations.find(
    (r) =>
      r.event_id === event.id &&
      r.attendee_email.toLowerCase() === normalizedEmail &&
      r.status === "CONFIRMED"
  );
  if (duplicate) {
    throw new Error("This email is already registered for this event.");
  }

  const tt = input.ticketTypeId
    ? db.ticket_types.find((t) => t.id === input.ticketTypeId && t.event_id === event.id)
    : db.ticket_types.find((t) => t.event_id === event.id);

  if (!tt) {
    throw new Error("Ticket tier not found for event.");
  }
  if (tt.price_minor > 0) {
    throw new Error("Paid ticket types require order and payment checkout.");
  }
  if (tt.sold_count >= tt.capacity || tt.sold_count >= event.capacity) {
    throw new Error("Event is at full capacity.");
  }

  tt.sold_count += 1;
  const now = new Date().toISOString();

  const registration: Registration = {
    id: `reg-${Date.now().toString(36)}-${browserRandomHex(3).toLowerCase()}`,
    event_id: event.id,
    user_id: input.buyerUserId || null,
    order_id: null,
    ticket_type_id: tt.id,
    attendee_name: input.attendeeName.trim(),
    attendee_email: normalizedEmail,
    attendee_phone: input.attendeePhone?.trim() || "",
    institute_or_company: input.instituteOrCompany?.trim() || "",
    marketing_consent: false,
    status: "CONFIRMED",
    created_at: now,
  };

  const rawQrToken = `AAYOJON-TKT-${event.id.toUpperCase()}-${browserRandomHex(6)}`;
  const ticket: TicketRecord = {
    id: `tkt-${Date.now().toString(36)}-${browserRandomHex(3).toLowerCase()}`,
    registration_id: registration.id,
    event_id: event.id,
    ticket_type_id: tt.id,
    attendee_name: registration.attendee_name,
    attendee_email: registration.attendee_email,
    ticket_type_name: tt.name,
    qr_token: rawQrToken,
    token_hash: await browserSha256(rawQrToken),
    status: "VALID",
    issued_at: now,
  };

  db.registrations.unshift(registration);
  db.tickets.unshift(ticket);
  cachedDb = db;

  await saveRegistrationToFirestore(registration);
  await saveTicketToFirestore(ticket);

  return { registration, ticket };
}

export async function clientGetMyOrders(buyerUserId: string): Promise<Order[]> {
  const db = await fetchDatabaseState();
  return db.orders.filter((o) => o.buyer_user_id === buyerUserId || !buyerUserId);
}
