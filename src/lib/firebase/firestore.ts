/**
 * Firebase Firestore Client Adapter
 * Provides real-time synchronization between Cloud Firestore and Aayojon database state.
 * Location: src/lib/firebase/firestore.ts
 */

import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
  type Firestore,
} from "firebase/firestore";
import { getFirebaseApp } from "./client";
import { isFirebaseConfigured } from "./config";
import type { DatabaseState, EventRecord, TicketType } from "../types";
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

    // Build DatabaseState from Firestore collections
    const events: EventRecord[] = [];
    eventsSnapshot.forEach((d) => {
      events.push(d.data() as EventRecord);
    });

    const seed = createInitialSeed();

    // Fetch ticket types
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
      // Use seed ticket types if not yet customized
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
 * Seeds initial demo data into Firestore collections so that fresh databases
 * immediately have all partner venues, categories, and published events.
 */
export async function seedFirestore(fs: Firestore, seed: DatabaseState): Promise<void> {
  try {
    // 1. Seed events (batch in chunks of 500)
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

