/**
 * Firebase Firestore Client Adapter
 * Provides real-time synchronization between Cloud Firestore and Aayojon database state.
 * Location: src/lib/firebase/firestore.ts
 */

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
  type Firestore,
} from "firebase/firestore";
import { getFirebaseApp } from "./client";
import { isFirebaseConfigured } from "./config";
import type {
  DatabaseState,
  EventRecord,
  TicketType,
  Profile,
  Venue,
  VenueProfile,
  Category,
  TicketRecord,
  Order,
  Registration,
  VenueRequest,
  Quotation,
  VenueBooking,
} from "../types";
import { createInitialSeed } from "../seed";

let cachedFirestore: Firestore | null = null;

export function getFirestoreDb(): Firestore | null {
  if (cachedFirestore) return cachedFirestore;
  if (!isFirebaseConfigured()) return null;

  try {
    const app = getFirebaseApp();
    cachedFirestore = getFirestore(app);
    return cachedFirestore;
  } catch (err) {
    console.warn("[Firestore] Initialization notice:", err);
    return null;
  }
}

/**
 * Loads dynamic database state from Cloud Firestore.
 * Automatically seeds the database if collections are currently empty.
 */
export async function loadFirestoreState(): Promise<DatabaseState | null> {
  const fs = getFirestoreDb();
  if (!fs) return null;

  try {
    const eventsSnapshot = await getDocs(collection(fs, "events"));

    // If Firestore has no events yet, seed initial events into Firestore
    if (eventsSnapshot.empty) {
      console.info("[Firestore] Initializing Firestore with seed catalog...");
      const initialSeed = createInitialSeed();
      await seedFirestore(fs, initialSeed);
      return initialSeed;
    }

    // 1. Events from Firestore
    const events: EventRecord[] = [];
    eventsSnapshot.forEach((d) => {
      events.push(d.data() as EventRecord);
    });

    const seed = createInitialSeed();

    // 2. Ticket types from Firestore
    try {
      const ticketsSnapshot = await getDocs(collection(fs, "ticket_types"));
      const ticketTypes: TicketType[] = [];
      ticketsSnapshot.forEach((d) => {
        ticketTypes.push(d.data() as TicketType);
      });
      if (ticketTypes.length > 0) {
        seed.ticket_types = ticketTypes;
      }
    } catch {
      // Use fallback
    }

    // 3. Profiles from Firestore
    try {
      const profilesSnapshot = await getDocs(collection(fs, "profiles"));
      const profilesMap = new Map<string, Profile>();
      // Put existing seed profiles first
      seed.profiles.forEach((p) => profilesMap.set(p.id, p));
      // Overlay actual live Firestore profiles
      profilesSnapshot.forEach((d) => {
        const prof = d.data() as Profile;
        profilesMap.set(prof.id, prof);
      });
      seed.profiles = Array.from(profilesMap.values());
    } catch {
      // Use fallback
    }

    // 4. Venues from Firestore
    try {
      const venuesSnapshot = await getDocs(collection(fs, "venues"));
      const venues: Venue[] = [];
      venuesSnapshot.forEach((d) => {
        venues.push(d.data() as Venue);
      });
      if (venues.length > 0) {
        seed.venues = venues;
      }
    } catch {
      // Use fallback
    }

    // 5. Categories from Firestore
    try {
      const catsSnapshot = await getDocs(collection(fs, "categories"));
      const categories: Category[] = [];
      catsSnapshot.forEach((d) => {
        categories.push(d.data() as Category);
      });
      if (categories.length > 0) {
        seed.categories = categories;
      }
    } catch {
      // Use fallback
    }

    // 6. Tickets from Firestore
    try {
      const ticketsSnapshot = await getDocs(collection(fs, "tickets"));
      const liveTickets: TicketRecord[] = [];
      ticketsSnapshot.forEach((d) => {
        liveTickets.push(d.data() as TicketRecord);
      });
      if (liveTickets.length > 0) {
        const ticketMap = new Map<string, TicketRecord>();
        seed.tickets.forEach((t) => ticketMap.set(t.id, t));
        liveTickets.forEach((t) => ticketMap.set(t.id, t));
        seed.tickets = Array.from(ticketMap.values());
      }
    } catch {
      // Use fallback
    }

    // 7. Orders from Firestore
    try {
      const ordersSnapshot = await getDocs(collection(fs, "orders"));
      const liveOrders: Order[] = [];
      ordersSnapshot.forEach((d) => {
        liveOrders.push(d.data() as Order);
      });
      if (liveOrders.length > 0) {
        const orderMap = new Map<string, Order>();
        seed.orders.forEach((o) => orderMap.set(o.id, o));
        liveOrders.forEach((o) => orderMap.set(o.id, o));
        seed.orders = Array.from(orderMap.values());
      }
    } catch {
      // Use fallback
    }

    // 8. Registrations from Firestore
    try {
      const regsSnapshot = await getDocs(collection(fs, "registrations"));
      const liveRegs: Registration[] = [];
      regsSnapshot.forEach((d) => {
        liveRegs.push(d.data() as Registration);
      });
      if (liveRegs.length > 0) {
        const regMap = new Map<string, Registration>();
        seed.registrations.forEach((r) => regMap.set(r.id, r));
        liveRegs.forEach((r) => regMap.set(r.id, r));
        seed.registrations = Array.from(regMap.values());
      }
    } catch {
      // Use fallback
    }

    // 9. Venue Profiles from Firestore
    try {
      const vpSnapshot = await getDocs(collection(fs, "venue_profiles"));
      const liveVps: VenueProfile[] = [];
      vpSnapshot.forEach((d) => {
        liveVps.push(d.data() as VenueProfile);
      });
      if (liveVps.length > 0) {
        const vpMap = new Map<string, VenueProfile>();
        seed.venue_profiles.forEach((v) => vpMap.set(v.id, v));
        liveVps.forEach((v) => vpMap.set(v.id, v));
        seed.venue_profiles = Array.from(vpMap.values());
      }
    } catch {
      // Use fallback
    }

    // 10. Venue Requests (RFQs) from Firestore
    try {
      const rfqSnapshot = await getDocs(collection(fs, "venue_requests"));
      const liveRfqs: VenueRequest[] = [];
      rfqSnapshot.forEach((d) => {
        liveRfqs.push(d.data() as VenueRequest);
      });
      if (liveRfqs.length > 0) {
        const rfqMap = new Map<string, VenueRequest>();
        seed.venue_requests.forEach((r) => rfqMap.set(r.id, r));
        liveRfqs.forEach((r) => rfqMap.set(r.id, r));
        seed.venue_requests = Array.from(rfqMap.values());
      }
    } catch {
      // Use fallback
    }

    // 11. Quotations from Firestore
    try {
      const quotesSnapshot = await getDocs(collection(fs, "quotations"));
      const liveQuotes: Quotation[] = [];
      quotesSnapshot.forEach((d) => {
        liveQuotes.push(d.data() as Quotation);
      });
      if (liveQuotes.length > 0) {
        const quoteMap = new Map<string, Quotation>();
        seed.quotations.forEach((q) => quoteMap.set(q.id, q));
        liveQuotes.forEach((q) => quoteMap.set(q.id, q));
        seed.quotations = Array.from(quoteMap.values());
      }
    } catch {
      // Use fallback
    }

    // 12. Venue Bookings from Firestore
    try {
      const bookingsSnapshot = await getDocs(collection(fs, "venue_bookings"));
      const liveBookings: VenueBooking[] = [];
      bookingsSnapshot.forEach((d) => {
        liveBookings.push(d.data() as VenueBooking);
      });
      if (liveBookings.length > 0) {
        const bookingMap = new Map<string, VenueBooking>();
        seed.venue_bookings.forEach((b) => bookingMap.set(b.id, b));
        liveBookings.forEach((b) => bookingMap.set(b.id, b));
        seed.venue_bookings = Array.from(bookingMap.values());
      }
    } catch {
      // Use fallback
    }

    return {
      ...seed,
      events,
    };
  } catch (err: any) {
    console.warn("[Firestore] Could not load state from Firestore, falling back:", err?.message);
    return null;
  }
}

/**
 * Saves or updates an event directly in Cloud Firestore.
 */
export async function saveEventToFirestore(
  event: EventRecord,
  ticketTypes?: TicketType[]
): Promise<void> {
  const fs = getFirestoreDb();
  if (!fs) return;

  try {
    const eventRef = doc(fs, "events", event.id);
    await setDoc(eventRef, event, { merge: true });

    if (ticketTypes && ticketTypes.length > 0) {
      const batch = writeBatch(fs);
      for (const t of ticketTypes) {
        const ticketRef = doc(fs, "ticket_types", t.id);
        batch.set(ticketRef, t, { merge: true });
      }
      await batch.commit();
    }
    console.info(`[Firestore] Event "${event.title}" saved to Firestore successfully.`);
  } catch (err: any) {
    console.warn("[Firestore] Failed to save event to Firestore:", err?.message);
  }
}

/**
 * Updates an event's publication or status in Cloud Firestore.
 */
export async function updateEventStatusInFirestore(
  eventId: string,
  updates: Partial<EventRecord>
): Promise<void> {
  const fs = getFirestoreDb();
  if (!fs) return;

  try {
    const eventRef = doc(fs, "events", eventId);
    await updateDoc(eventRef, {
      ...updates,
      updated_at: new Date().toISOString(),
    });
    console.info(`[Firestore] Event ${eventId} updated in Firestore successfully.`);
  } catch (err: any) {
    console.warn("[Firestore] Failed to update event in Firestore:", err?.message);
  }
}

/**
 * Synchronizes a user's profile document in Cloud Firestore (/profiles/{uid}).
 */
export async function syncUserProfileToFirestore(
  profile: Partial<Profile> & { id: string }
): Promise<void> {
  const fs = getFirestoreDb();
  if (!fs) return;

  try {
    const profRef = doc(fs, "profiles", profile.id);
    await setDoc(
      profRef,
      {
        id: profile.id,
        email: profile.email || "",
        display_name: profile.display_name || profile.email?.split("@")[0] || "User",
        platform_role: profile.platform_role || "ATTENDEE",
        avatar_url: profile.avatar_url || null,
        phone: profile.phone || null,
        organization_label: profile.organization_label || null,
        preferred_city: profile.preferred_city || "Dhaka",
        interests: profile.interests || [],
        mfa_enabled: !!profile.mfa_enabled,
        created_at: profile.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { merge: true }
    );
    console.info(`[Firestore] Profile for ${profile.display_name || profile.id} synced to Firestore.`);
  } catch (err: any) {
    console.warn("[Firestore] Failed to sync user profile to Firestore:", err?.message);
  }
}

/**
 * Fetches a single user profile from Cloud Firestore.
 */
export async function fetchUserProfileFromFirestore(uid: string): Promise<Profile | null> {
  const fs = getFirestoreDb();
  if (!fs) return null;

  try {
    const snap = await getDoc(doc(fs, "profiles", uid));
    if (snap.exists()) {
      return snap.data() as Profile;
    }
    return null;
  } catch (err: any) {
    console.warn("[Firestore] Could not fetch profile from Firestore:", err?.message);
    return null;
  }
}

/**
 * Saves a ticket record directly to Cloud Firestore.
 */
export async function saveTicketToFirestore(ticket: TicketRecord): Promise<void> {
  const fs = getFirestoreDb();
  if (!fs) return;

  try {
    await setDoc(doc(fs, "tickets", ticket.id), ticket, { merge: true });
    console.info(`[Firestore] Ticket ${ticket.id} saved to Firestore.`);
  } catch (err: any) {
    console.warn("[Firestore] Failed to save ticket to Firestore:", err?.message);
  }
}

/**
 * Saves an order directly to Cloud Firestore.
 */
export async function saveOrderToFirestore(order: Order): Promise<void> {
  const fs = getFirestoreDb();
  if (!fs) return;

  try {
    await setDoc(doc(fs, "orders", order.id), order, { merge: true });
    console.info(`[Firestore] Order ${order.id} saved to Firestore.`);
  } catch (err: any) {
    console.warn("[Firestore] Failed to save order to Firestore:", err?.message);
  }
}

/**
 * Saves a registration directly to Cloud Firestore.
 */
export async function saveRegistrationToFirestore(reg: Registration): Promise<void> {
  const fs = getFirestoreDb();
  if (!fs) return;

  try {
    await setDoc(doc(fs, "registrations", reg.id), reg, { merge: true });
    console.info(`[Firestore] Registration ${reg.id} saved to Firestore.`);
  } catch (err: any) {
    console.warn("[Firestore] Failed to save registration to Firestore:", err?.message);
  }
}

/**
 * Saves a venue profile directly to Cloud Firestore.
 */
export async function saveVenueProfileToFirestore(vp: VenueProfile): Promise<void> {
  const fs = getFirestoreDb();
  if (!fs) return;

  try {
    await setDoc(doc(fs, "venue_profiles", vp.id), vp, { merge: true });
    console.info(`[Firestore] VenueProfile ${vp.id} saved to Firestore.`);
  } catch (err: any) {
    console.warn("[Firestore] Failed to save venue profile to Firestore:", err?.message);
  }
}

/**
 * Saves a venue request (RFQ) directly to Cloud Firestore.
 */
export async function saveVenueRequestToFirestore(rfq: VenueRequest): Promise<void> {
  const fs = getFirestoreDb();
  if (!fs) return;

  try {
    await setDoc(doc(fs, "venue_requests", rfq.id), rfq, { merge: true });
    console.info(`[Firestore] VenueRequest ${rfq.id} saved to Firestore.`);
  } catch (err: any) {
    console.warn("[Firestore] Failed to save venue request to Firestore:", err?.message);
  }
}

/**
 * Saves a quotation directly to Cloud Firestore.
 */
export async function saveQuotationToFirestore(quote: Quotation): Promise<void> {
  const fs = getFirestoreDb();
  if (!fs) return;

  try {
    await setDoc(doc(fs, "quotations", quote.id), quote, { merge: true });
    console.info(`[Firestore] Quotation ${quote.id} saved to Firestore.`);
  } catch (err: any) {
    console.warn("[Firestore] Failed to save quotation to Firestore:", err?.message);
  }
}

/**
 * Saves a venue booking directly to Cloud Firestore.
 */
export async function saveVenueBookingToFirestore(booking: VenueBooking): Promise<void> {
  const fs = getFirestoreDb();
  if (!fs) return;

  try {
    await setDoc(doc(fs, "venue_bookings", booking.id), booking, { merge: true });
    console.info(`[Firestore] VenueBooking ${booking.id} saved to Firestore.`);
  } catch (err: any) {
    console.warn("[Firestore] Failed to save venue booking to Firestore:", err?.message);
  }
}

/**
 * Seeds initial demo data into Firestore collections so that fresh databases
 * immediately have all partner venues, categories, and published events.
 */
export async function seedFirestore(fs: Firestore, seed: DatabaseState): Promise<void> {
  try {
    // 1. Seed events
    for (const event of seed.events) {
      await setDoc(doc(fs, "events", event.id), event);
    }

    // 2. Seed ticket types
    for (const tt of seed.ticket_types) {
      await setDoc(doc(fs, "ticket_types", tt.id), tt);
    }

    // 3. Seed venues
    for (const venue of seed.venues) {
      await setDoc(doc(fs, "venues", venue.id), venue);
    }

    // 4. Seed categories
    for (const cat of seed.categories) {
      await setDoc(doc(fs, "categories", cat.id), cat);
    }

    // 5. Seed venue profiles
    if (seed.venue_profiles && seed.venue_profiles.length > 0) {
      for (const vp of seed.venue_profiles) {
        await setDoc(doc(fs, "venue_profiles", vp.id), vp);
      }
    }

    // 6. Seed venue requests
    if (seed.venue_requests && seed.venue_requests.length > 0) {
      for (const rfq of seed.venue_requests) {
        await setDoc(doc(fs, "venue_requests", rfq.id), rfq);
      }
    }

    // 7. Seed quotations
    if (seed.quotations && seed.quotations.length > 0) {
      for (const q of seed.quotations) {
        await setDoc(doc(fs, "quotations", q.id), q);
      }
    }

    console.info("[Firestore] Seed data written to Cloud Firestore successfully.");
  } catch (err: any) {
    console.warn("[Firestore] Error seeding initial data:", err?.message);
  }
}
