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
    } else if (action === "REGISTER_FREE" || action === "BUY_TICKET") {
      const p = payload as any;
      if (!cachedDb) cachedDb = createInitialSeed();
      const ticketType =
        cachedDb.ticket_types.find((t) => t.id === p.ticketTypeId) ||
        cachedDb.ticket_types.find((t) => t.event_id === p.eventId);
      const isPaid = action === "BUY_TICKET";
      const orderId = isPaid
        ? `ord-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
        : null;
      const regId = `reg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const ticketId = `tkt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const qrToken = `AAYOJON-TKT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const now = new Date().toISOString();
      const attendeeName = (p.attendeeName || "Attendee").trim();
      const attendeeEmail = (p.attendeeEmail || "attendee@ayojon.select").trim().toLowerCase();

      let newOrder: Order | null = null;
      if (isPaid && orderId) {
        const subtotal = ticketType ? ticketType.price_minor : 0;
        const fee = Math.round(subtotal * 0.025);
        newOrder = {
          id: orderId,
          buyer_user_id: actorUserId || null,
          event_id: p.eventId,
          order_type: "TICKET",
          status: "PAID",
          subtotal_minor: subtotal,
          fee_minor: fee,
          total_minor: subtotal + fee,
          currency: "BDT",
          idempotency_key: `client-${orderId}`,
          attendee_name: attendeeName,
          attendee_email: attendeeEmail,
          attendee_phone: p.phone || "",
          created_at: now,
        };
        cachedDb.orders = [newOrder, ...cachedDb.orders];
      }

      const newReg: Registration = {
        id: regId,
        order_id: orderId,
        event_id: p.eventId,
        user_id: actorUserId || null,
        ticket_type_id: ticketType?.id || (isPaid ? "tt-gen" : "tt-free"),
        attendee_name: attendeeName,
        attendee_email: attendeeEmail,
        attendee_phone: p.phone || "",
        institute_or_company: p.instituteOrCompany || "",
        marketing_consent: false,
        status: "CONFIRMED",
        created_at: now,
      };

      const newTicket: TicketRecord = {
        id: ticketId,
        registration_id: regId,
        event_id: p.eventId,
        ticket_type_id: newReg.ticket_type_id,
        attendee_name: attendeeName,
        attendee_email: attendeeEmail,
        ticket_type_name: ticketType?.name || (isPaid ? "General Admission" : "Free Pass"),
        qr_token: qrToken,
        token_hash: await browserSha256(qrToken),
        status: "VALID",
        issued_at: now,
      };

      cachedDb.registrations = [newReg, ...cachedDb.registrations];
      cachedDb.tickets = [newTicket, ...cachedDb.tickets];
      if (ticketType) {
        ticketType.sold_count = (ticketType.sold_count || 0) + 1;
      }

      if (newOrder) await saveOrderToFirestore(newOrder);
      await saveRegistrationToFirestore(newReg);
      await saveTicketToFirestore(newTicket);

      resultData = {
        success: true,
        data: { ...cachedDb },
        result: newOrder ? { order: newOrder, registration: newReg, ticket: newTicket } : { registration: newReg, ticket: newTicket },
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
    } else if (action === "SCAN_TICKET_QR" && !resultData?.result) {
      const p = payload as any;
      if (!cachedDb) cachedDb = await fetchDatabaseState();
      const trimmed = String(p.qrToken || "").trim();
      const hashed = await browserSha256(trimmed);
      const ticket = cachedDb.tickets.find(
        (t) => t.token_hash === hashed || t.qr_token.toLowerCase() === trimmed.toLowerCase()
      );
      if (!ticket) {
        resultData = {
          success: true,
          data: { ...cachedDb },
          result: { result: "INVALID", message: "Unrecognized or forged QR token." },
        };
      } else if (p.eventId && ticket.event_id !== p.eventId) {
        resultData = {
          success: true,
          data: { ...cachedDb },
          result: { result: "INVALID_EVENT", message: "Ticket belongs to a different event.", ticket },
        };
      } else if (ticket.status === "CANCELLED" || ticket.status === "TRANSFERRED") {
        resultData = {
          success: true,
          data: { ...cachedDb },
          result: { result: "CANCELLED", message: `Ticket is ${ticket.status.toLowerCase()} and cannot be used.`, ticket },
        };
      } else if (ticket.status === "USED") {
        const prev = cachedDb.check_ins.find((c) => c.ticket_id === ticket.id);
        resultData = {
          success: true,
          data: { ...cachedDb },
          result: {
            result: "ALREADY_USED",
            message: "Ticket has already been checked in.",
            ticket,
            previousCheckIn: prev
              ? { checkedInAt: prev.checked_in_at, staffName: prev.staff_name }
              : undefined,
          },
        };
      } else {
        const now = new Date().toISOString();
        ticket.status = "USED";
        const staffProfile = cachedDb.profiles.find((pr) => pr.id === actorUserId);
        cachedDb.check_ins.unshift({
          id: `chk-${Date.now().toString(36)}`,
          ticket_id: ticket.id,
          event_id: ticket.event_id,
          staff_user_id: actorUserId || "usr-staff-tanvir",
          staff_name: staffProfile?.display_name || "Gate Staff",
          checked_in_at: now,
        });
        await saveTicketToFirestore(ticket);
        resultData = {
          success: true,
          data: { ...cachedDb },
          result: {
            result: "VALID",
            message: "Check-in confirmed! Gate entry granted.",
            ticket,
            checkedInAt: now,
          },
        };
      }
    } else if (action === "SUBMIT_PAYMENT_PROOF") {
      const p = payload as any;
      const updated = await clientSubmitPaymentProof({
        orderId: p.orderId,
        provider: p.provider || "BKASH_SANDBOX",
        trxId: p.trxId || "",
        senderNumber: p.senderNumber,
      });
      if (cachedDb) {
        resultData = { success: true, data: { ...cachedDb }, result: updated };
      }
    } else if (action === "VERIFY_ORDER_PAYMENT") {
      const p = payload as any;
      const res = await clientVerifyOrderPayment({
        orderId: p.orderId,
        actorUserId: actorUserId || "usr-superadmin",
        approve: p.approve !== false,
        reason: p.reason,
      });
      cachedDb = res.db;
      resultData = { success: true, data: { ...res.db }, result: res.order };
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
  promoCode?: string;
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

  let discountMinor = 0;
  if (input.promoCode?.trim().toUpperCase() === "HALF50") {
    discountMinor = Math.round(subtotalMinor * 0.5);
  }
  const discountedSubtotal = Math.max(0, subtotalMinor - discountMinor);
  const feeMinor = Math.round(discountedSubtotal * 0.025);
  const totalMinor = discountedSubtotal + feeMinor;
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

export async function clientSubmitPaymentProof(input: {
  orderId: string;
  provider: string;
  trxId: string;
  senderNumber?: string;
}): Promise<Order> {
  const db = await fetchDatabaseState();
  const order = db.orders.find((o) => o.id === input.orderId);
  if (!order) {
    throw new Error("Order not found.");
  }
  if (order.status === "PAID") {
    return order;
  }
  const cleanTrx = input.trxId.trim().toUpperCase();
  if (cleanTrx.length < 4) {
    throw new Error("Please enter a valid Transaction ID (TrxID).");
  }

  const now = new Date().toISOString();
  order.status = "AWAITING_VERIFICATION";
  order.payment_provider = input.provider;
  order.payment_reference = cleanTrx;
  order.sender_number = input.senderNumber?.trim() || "";
  order.payment_submitted_at = now;

  const event = db.events.find((e) => e.id === order.event_id);
  const orgMembers = event
    ? db.organization_members.filter(
        (m) =>
          m.organization_id === event.organization_id &&
          (m.role === "OWNER" || m.role === "EVENT_MANAGER" || m.role === "CHECKIN_STAFF")
      )
    : [];
  const admins = db.profiles.filter(
    (p) => p.platform_role === "ADMIN" || p.platform_role === "SUPER_ADMIN"
  );

  const recipientIds = new Set<string>([
    ...orgMembers.map((m) => m.user_id),
    ...admins.map((a) => a.id),
  ]);

  db.notifications = db.notifications || [];
  for (const uid of recipientIds) {
    const profile = db.profiles.find((p) => p.id === uid);
    db.notifications.unshift({
      id: `notif-${Date.now().toString(36)}-${browserRandomHex(2).toLowerCase()}`,
      user_id: uid,
      destination: profile?.email || uid,
      channel: "EMAIL",
      template: "PAYMENT_VERIFICATION_REQUIRED",
      subject: `Verify payment ${cleanTrx} for ${event?.title || order.event_id} (${order.id})`,
      status: "QUEUED",
      retry_count: 0,
      idempotency_key: `notif-pay-${order.id}-${uid}`,
      sent_at: null,
      created_at: now,
    });
  }

  cachedDb = db;
  await saveOrderToFirestore(order);
  return order;
}

export async function clientVerifyOrderPayment(input: {
  orderId: string;
  actorUserId: string;
  approve: boolean;
  reason?: string;
}): Promise<{ order: Order; db: DatabaseState }> {
  const db = await fetchDatabaseState();
  const order = db.orders.find((o) => o.id === input.orderId);
  if (!order) {
    throw new Error("Order not found.");
  }

  const actor = db.profiles.find((p) => p.id === input.actorUserId);
  const event = db.events.find((e) => e.id === order.event_id);
  const isAdmin = actor?.platform_role === "ADMIN" || actor?.platform_role === "SUPER_ADMIN";
  const isOrgStaffOrOwner =
    event &&
    db.organization_members.some(
      (m) =>
        m.organization_id === event.organization_id &&
        m.user_id === input.actorUserId &&
        (m.role === "OWNER" || m.role === "EVENT_MANAGER" || m.role === "CHECKIN_STAFF")
    );

  if (!isAdmin && !isOrgStaffOrOwner) {
    throw new Error("Only the event organizer, dedicated staff, or platform admin can verify payments.");
  }

  const now = new Date().toISOString();
  if (input.approve) {
    order.verified_by_user_id = input.actorUserId;
    order.verified_at = now;
    const paidOrder = await clientSandboxConfirmPayment({
      orderId: order.id,
      provider: order.payment_provider,
    });
    db.notifications = db.notifications || [];
    db.notifications.unshift({
      id: `notif-${Date.now().toString(36)}-${browserRandomHex(2).toLowerCase()}`,
      user_id: order.buyer_user_id,
      destination: order.attendee_email,
      channel: "EMAIL",
      template: "TICKET_ISSUED",
      subject: `Payment verified! Your QR ticket for ${event?.title || order.event_id} is ready.`,
      status: "QUEUED",
      retry_count: 0,
      idempotency_key: `notif-tkt-${order.id}`,
      sent_at: null,
      created_at: now,
    });
    db.audit_logs = db.audit_logs || [];
    db.audit_logs.unshift({
      id: `aud-${Date.now().toString(36)}`,
      actor_id: input.actorUserId,
      actor_name: actor?.display_name || input.actorUserId,
      actor_role: actor?.platform_role || "STAFF",
      action: "PAYMENT_VERIFIED_AND_TICKET_ISSUED",
      resource_type: "orders",
      resource_id: order.id,
      metadata: {
        trxId: order.payment_reference || "SANDBOX",
        provider: order.payment_provider || "MFS",
        amountMinor: order.total_minor,
      },
      created_at: now,
    });
    cachedDb = db;
    return { order: paidOrder, db };
  }

  // Reject payment & release reserved inventory
  order.status = "FAILED";
  order.rejection_reason = input.reason?.trim() || "Transaction ID could not be verified.";
  const items = db.order_items.filter((oi) => oi.order_id === order.id);
  for (const item of items) {
    const tt = db.ticket_types.find((t) => t.id === item.ticket_type_id);
    if (tt) {
      tt.sold_count = Math.max(0, tt.sold_count - item.quantity);
    }
  }
  db.audit_logs = db.audit_logs || [];
  db.audit_logs.unshift({
    id: `aud-${Date.now().toString(36)}`,
    actor_id: input.actorUserId,
    actor_name: actor?.display_name || input.actorUserId,
    actor_role: actor?.platform_role || "STAFF",
    action: "PAYMENT_REJECTED",
    resource_type: "orders",
    resource_id: order.id,
    metadata: { reason: order.rejection_reason },
    created_at: now,
  });
  cachedDb = db;
  await saveOrderToFirestore(order);
  return { order, db };
}
