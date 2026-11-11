/**
 * Firebase Client SDK Initialization & In-Memory Authentication Engine
 * Milestone 1: FEAT-AUTH-001 & FEAT-AUTH-003
 * Location: src/lib/firebase/client.ts
 */

import {
  getFirebaseConfig,
  isFirebaseConfigured,
  isEmulatorEnabled,
  getFirebaseAuthEmulatorHost,
  getFirebaseStatus,
  type FirebaseConfig,
  type FirebaseEnvironmentStatus,
} from "./config";

// ---------------------------------------------------------------------------
// Type Definitions & Interfaces
// ---------------------------------------------------------------------------

export interface FirebaseApp {
  name: string;
  options: FirebaseConfig;
  automaticDataCollectionEnabled: boolean;
}

export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  tenantId?: string;
  role?: string;
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
  reload: () => Promise<void>;
}

export type AuthStateListener = (user: FirebaseUser | null) => void;

export interface Auth {
  app: FirebaseApp;
  currentUser: FirebaseUser | null;
  emulatorHost: string | null;
  onAuthStateChanged: (callback: AuthStateListener) => () => void;
}

export interface StoredUserCredential {
  uid: string;
  email: string;
  passwordHash: string;
  displayName: string | null;
  photoURL: string | null;
  role: "attendee" | "organizer" | "staff" | "sponsor" | "admin";
  tenantId?: string;
  phoneNumber?: string;
  emailVerified: boolean;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Standard Firebase Auth Error Class
// ---------------------------------------------------------------------------

export class FirebaseAuthError extends Error {
  code: string;
  constructor(code: string, message?: string) {
    super(message || `Firebase: ${code}`);
    this.name = "FirebaseError";
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Cryptographic Password Hashing (W3C SubtleCrypto / Node crypto fallback)
// ---------------------------------------------------------------------------

export async function hashPassword(password: string): Promise<string> {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  try {
    const nodeCrypto = require("crypto");
    return nodeCrypto.createHash("sha256").update(password).digest("hex");
  } catch {
    // Pure JS 64-character hexadecimal digest fallback
    let h1 = 0xdeadbeef,
      h2 = 0x41c6ce57;
    for (let i = 0; i < password.length; i++) {
      const ch = password.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (
      (h1 >>> 0).toString(16).padStart(8, "0") +
      (h2 >>> 0).toString(16).padStart(8, "0")
    );
  }
}

// ---------------------------------------------------------------------------
// Canonical Personas & In-Memory Store
// ---------------------------------------------------------------------------

// SHA-256 digest of "demo123456"
const DEMO_PASSWORD_HASH =
  "d2b000ce0875cad8615dd8cf34f788635c959a0ce2b8a977e22caab745380b06";

const CANONICAL_PERSONAS: StoredUserCredential[] = [
  {
    uid: "usr-attendee-rafiq",
    email: "rafiq@student.buet.ac.bd",
    passwordHash: DEMO_PASSWORD_HASH,
    displayName: "Rafiqul Islam",
    photoURL: null,
    role: "attendee",
    phoneNumber: "+8801711223344",
    emailVerified: true,
    createdAt: "2026-10-15T08:00:00Z",
  },
  {
    uid: "usr-org-nusrat",
    email: "nusrat@buetcs.org",
    passwordHash: DEMO_PASSWORD_HASH,
    displayName: "Nusrat Jahan",
    photoURL: null,
    role: "organizer",
    tenantId: "org-buet-cc",
    phoneNumber: "+8801819556677",
    emailVerified: true,
    createdAt: "2026-10-01T09:00:00Z",
  },
  {
    uid: "usr-org-tanvir",
    email: "tanvir@nsu-yes.org",
    passwordHash: DEMO_PASSWORD_HASH,
    displayName: "Tanvir Ahmed",
    photoURL: null,
    role: "organizer",
    tenantId: "org-nsu-yes",
    phoneNumber: "+8801912334455",
    emailVerified: true,
    createdAt: "2026-10-05T10:00:00Z",
  },
  {
    uid: "usr-staff-mehedi",
    email: "mehedi@staff.buetcs.org",
    passwordHash: DEMO_PASSWORD_HASH,
    displayName: "Mehedi Hasan",
    photoURL: null,
    role: "staff",
    tenantId: "org-buet-cc",
    phoneNumber: "+8801611889900",
    emailVerified: true,
    createdAt: "2026-10-12T11:00:00Z",
  },
  {
    uid: "usr-sponsor-farhana",
    email: "farhana@pathao-ventures.bd",
    passwordHash: DEMO_PASSWORD_HASH,
    displayName: "Farhana Rahman",
    photoURL: null,
    role: "sponsor",
    phoneNumber: "+8801755667788",
    emailVerified: true,
    createdAt: "2026-10-18T12:00:00Z",
  },
  {
    uid: "usr-admin-tariq",
    email: "admin@aayojon.bd",
    passwordHash: DEMO_PASSWORD_HASH,
    displayName: "Tariq Mahmud",
    photoURL: null,
    role: "admin",
    tenantId: "aayojon-admin",
    phoneNumber: "+8801700001122",
    emailVerified: true,
    createdAt: "2026-09-25T06:00:00Z",
  },
];

// Module-level in-memory credential store (keyed by normalized lowercase email)
const userStore: Map<string, StoredUserCredential> = new Map();

function initUserStore(): void {
  userStore.clear();
  for (const persona of CANONICAL_PERSONAS) {
    userStore.set(persona.email.toLowerCase(), { ...persona });
  }
}

// Initial seeding
initUserStore();

// ---------------------------------------------------------------------------
// Singleton Instances & Listener Registry
// ---------------------------------------------------------------------------

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;
const activeListeners: Set<AuthStateListener> = new Set();
let emulatorConnected = false;

function storedToFirebaseUser(stored: StoredUserCredential): FirebaseUser {
  return {
    uid: stored.uid,
    email: stored.email,
    displayName: stored.displayName,
    photoURL: stored.photoURL,
    emailVerified: stored.emailVerified,
    isAnonymous: false,
    tenantId: stored.tenantId,
    role: stored.role,
    getIdToken: async (_forceRefresh?: boolean) => {
      return `mock-firebase-token:${stored.uid}:${stored.role}:${stored.email}`;
    },
    reload: async () => {
      const refreshed = userStore.get(stored.email.toLowerCase());
      if (refreshed) {
        stored.displayName = refreshed.displayName;
        stored.photoURL = refreshed.photoURL;
      }
    },
  };
}

function notifyListeners(user: FirebaseUser | null): void {
  activeListeners.forEach((listener) => {
    try {
      listener(user);
    } catch (err) {
      console.error("[Firebase] Error in auth listener:", err);
    }
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getFirebaseApp(): FirebaseApp {
  if (cachedApp) return cachedApp;

  const config = getFirebaseConfig();
  cachedApp = {
    name: isFirebaseConfigured() ? "[DEFAULT]" : "aayojon-mock-app",
    options: config,
    automaticDataCollectionEnabled: true,
  };
  return cachedApp;
}

export function connectAuthEmulator(
  authInstance: Auth,
  url: string,
  _options?: { disableWarnings?: boolean }
): void {
  authInstance.emulatorHost = url;
  emulatorConnected = true;
  if (typeof window !== "undefined") {
    console.info(`[Firebase] Connected Auth to emulator at ${url}`);
  }
}

export function getFirebaseAuth(): Auth {
  if (cachedAuth) return cachedAuth;

  const appInstance = getFirebaseApp();

  cachedAuth = {
    app: appInstance,
    currentUser: null,
    emulatorHost: null,
    onAuthStateChanged: (callback: AuthStateListener) => {
      activeListeners.add(callback);
      // Trigger callback asynchronously with current user (Firebase semantics)
      Promise.resolve().then(() => {
        if (cachedAuth) {
          callback(cachedAuth.currentUser);
        }
      });
      return () => {
        activeListeners.delete(callback);
      };
    },
  };

  if (isEmulatorEnabled() && !emulatorConnected && typeof window !== "undefined") {
    try {
      const host = getFirebaseAuthEmulatorHost();
      connectAuthEmulator(cachedAuth, `http://${host}`, { disableWarnings: true });
    } catch (err: any) {
      console.warn("[Firebase] Could not connect to Auth Emulator:", err?.message);
    }
  }

  return cachedAuth;
}

export async function createUserWithEmailAndPassword(
  authInstance: Auth,
  email: string,
  pass: string,
  role?: string
): Promise<{ user: FirebaseUser }> {
  if (!email || typeof email !== "string" || !email.includes("@")) {
    throw new FirebaseAuthError(
      "auth/invalid-email",
      "The email address is badly formatted."
    );
  }

  if (!pass || typeof pass !== "string" || pass.length < 6) {
    throw new FirebaseAuthError(
      "auth/weak-password",
      "Password should be at least 6 characters."
    );
  }

  const normalizedEmail = email.toLowerCase().trim();
  if (userStore.has(normalizedEmail)) {
    throw new FirebaseAuthError(
      "auth/email-already-in-use",
      "The email address is already in use by another account."
    );
  }

  const passwordHash = await hashPassword(pass);
  const uid = `usr-gen-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
  const assignedRole = (role as any) || "attendee";

  const stored: StoredUserCredential = {
    uid,
    email: normalizedEmail,
    passwordHash,
    displayName: normalizedEmail.split("@")[0],
    photoURL: null,
    role: assignedRole,
    emailVerified: true,
    createdAt: new Date().toISOString(),
  };

  userStore.set(normalizedEmail, stored);
  const user = storedToFirebaseUser(stored);
  authInstance.currentUser = user;
  notifyListeners(user);
  return { user };
}

export async function signInWithEmailAndPassword(
  authInstance: Auth,
  email: string,
  pass: string
): Promise<{ user: FirebaseUser }> {
  if (!email || typeof email !== "string" || !email.includes("@")) {
    throw new FirebaseAuthError(
      "auth/invalid-email",
      "The email address is badly formatted."
    );
  }

  if (!pass || typeof pass !== "string") {
    throw new FirebaseAuthError(
      "auth/invalid-credential",
      "Missing password."
    );
  }

  if (pass.length < 6) {
    throw new FirebaseAuthError(
      "auth/weak-password",
      "Password should be at least 6 characters."
    );
  }

  const normalizedEmail = email.toLowerCase().trim();
  const stored = userStore.get(normalizedEmail);

  if (!stored) {
    throw new FirebaseAuthError(
      "auth/user-not-found",
      "There is no user record corresponding to this identifier."
    );
  }

  const candidateHash = await hashPassword(pass);
  if (stored.passwordHash !== candidateHash) {
    throw new FirebaseAuthError(
      "auth/wrong-password",
      "The password is invalid or the user does not have a password."
    );
  }

  const user = storedToFirebaseUser(stored);
  authInstance.currentUser = user;
  notifyListeners(user);
  return { user };
}

export async function signOut(authInstance: Auth): Promise<void> {
  authInstance.currentUser = null;
  notifyListeners(null);
}

export function onAuthStateChanged(
  authInstance: Auth,
  callback: AuthStateListener
): () => void {
  return authInstance.onAuthStateChanged(callback);
}

export async function updateProfile(
  user: FirebaseUser,
  profile: { displayName?: string | null; photoURL?: string | null }
): Promise<void> {
  if (profile.displayName !== undefined) {
    user.displayName = profile.displayName;
  }
  if (profile.photoURL !== undefined) {
    user.photoURL = profile.photoURL;
  }

  // Synchronize in-memory credential record
  if (user.email) {
    const stored = userStore.get(user.email.toLowerCase());
    if (stored) {
      if (profile.displayName !== undefined) stored.displayName = profile.displayName;
      if (profile.photoURL !== undefined) stored.photoURL = profile.photoURL;
    }
  }
}

export async function signInAsPersona(
  authInstance: Auth,
  personaUserId: string
): Promise<FirebaseUser> {
  const matched = Array.from(userStore.values()).find(
    (u) => u.uid === personaUserId
  );
  if (!matched) {
    throw new FirebaseAuthError(
      "auth/user-not-found",
      `Demo persona '${personaUserId}' not found.`
    );
  }
  const user = storedToFirebaseUser(matched);
  authInstance.currentUser = user;
  notifyListeners(user);
  return user;
}

export function isMockAuth(): boolean {
  return !isFirebaseConfigured();
}

export function resetFirebaseClient(): void {
  initUserStore();
  if (cachedAuth) {
    cachedAuth.currentUser = null;
  }
  activeListeners.clear();
  emulatorConnected = false;
}

export const app: FirebaseApp = getFirebaseApp();
export const auth: Auth = getFirebaseAuth();
export const isLiveFirebase: boolean = isFirebaseConfigured();

export {
  getFirebaseConfig,
  isFirebaseConfigured,
  isEmulatorEnabled,
  getFirebaseAuthEmulatorHost,
  getFirebaseStatus,
  type FirebaseEnvironmentStatus,
};
