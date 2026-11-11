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
  Category,
  TicketRecord,
  Order,
  Registration,
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

    console.info("[Firestore] Seed data written to Cloud Firestore successfully.");
  } catch (err: any) {
    console.warn("[Firestore] Error seeding initial data:", err?.message);
  }
}
