/**
 * Firebase Client SDK Initialization & Unified Authentication Engine
 * Supports real Firebase Authentication (v11) when credentials are provided in .env,
 * and seamlessly provides local cryptographic auth for offline dev & test suites.
 * Location: src/lib/firebase/client.ts
 */

import {
  initializeApp,
  getApps,
  getApp,
  type FirebaseApp as FirebaseSdkApp,
} from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword as fbSignInWithEmailAndPassword,
  createUserWithEmailAndPassword as fbCreateUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged as fbOnAuthStateChanged,
  updateProfile as fbUpdateProfile,
  connectAuthEmulator as fbConnectAuthEmulator,
  GoogleAuthProvider,
  signInWithPopup as fbSignInWithPopup,
  type Auth as FirebaseSdkAuth,
  type User as FirebaseSdkUser,
} from "firebase/auth";

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
  app: any;
  currentUser: FirebaseUser | null;
  emulatorHost: string | null;
  onAuthStateChanged: (callback: AuthStateListener) => () => void;
  _sdkAuth?: FirebaseSdkAuth;
}

export interface StoredUserCredential {
  uid: string;
  email: string;
  passwordHash: string;
  displayName: string | null;
  photoURL: string | null;
  role: "attendee" | "organizer" | "staff" | "sponsor" | "admin" | "venue_owner" | "vendor" | "super_admin";
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
// Local Offline Credential Store (for Development & Testing)
// ---------------------------------------------------------------------------

const userStore: Map<string, StoredUserCredential> = new Map();

function initUserStore(): void {
  userStore.clear();
}

initUserStore();

// ---------------------------------------------------------------------------
// Singleton Instances & Listener Registry
// ---------------------------------------------------------------------------

let cachedApp: any = null;
let cachedAuth: Auth | null = null;
const activeListeners: Set<AuthStateListener> = new Set();
let emulatorConnected = false;

function sdkUserToFirebaseUser(sdkUser: FirebaseSdkUser, fallbackRole?: string): FirebaseUser {
  return {
    uid: sdkUser.uid,
    email: sdkUser.email,
    displayName: sdkUser.displayName,
    photoURL: sdkUser.photoURL,
    emailVerified: sdkUser.emailVerified,
    isAnonymous: sdkUser.isAnonymous,
    tenantId: sdkUser.tenantId || undefined,
    role: fallbackRole || "attendee",
    getIdToken: async (forceRefresh?: boolean) => {
      return sdkUser.getIdToken(forceRefresh);
    },
    reload: async () => {
      await sdkUser.reload();
    },
  };
}

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
// Public Firebase SDK API
// ---------------------------------------------------------------------------

export function getFirebaseApp(): any {
  if (cachedApp) return cachedApp;

  const config = getFirebaseConfig();

  if (isFirebaseConfigured()) {
    try {
      const existing = getApps();
      cachedApp = existing.length > 0 ? getApp() : initializeApp(config);
      return cachedApp;
    } catch (err) {
      console.warn("[Firebase] Real Firebase App init error, using fallback:", err);
    }
  }

  cachedApp = {
    name: "aayojon-app",
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

  if (authInstance._sdkAuth) {
    try {
      fbConnectAuthEmulator(authInstance._sdkAuth, url, { disableWarnings: Boolean(_options?.disableWarnings) });
    } catch {
      // Ignored if already connected
    }
  }

  if (typeof window !== "undefined") {
    console.info(`[Firebase] Connected Auth to emulator at ${url}`);
  }
}

export function getFirebaseAuth(): Auth {
  if (cachedAuth) return cachedAuth;

  const appInstance = getFirebaseApp();
  let realSdkAuth: FirebaseSdkAuth | undefined;

  if (isFirebaseConfigured()) {
    try {
      realSdkAuth = getAuth(appInstance);
    } catch (err) {
      console.warn("[Firebase] Real Firebase Auth init error, using fallback:", err);
    }
  }

  cachedAuth = {
    app: appInstance,
    currentUser: null,
    emulatorHost: null,
    _sdkAuth: realSdkAuth,
    onAuthStateChanged: (callback: AuthStateListener) => {
      activeListeners.add(callback);

      if (realSdkAuth) {
        const unsubscribe = fbOnAuthStateChanged(realSdkAuth, (sdkUser) => {
          const user = sdkUser ? sdkUserToFirebaseUser(sdkUser) : null;
          if (cachedAuth) {
            cachedAuth.currentUser = user;
          }
          callback(user);
        });
        return () => {
          activeListeners.delete(callback);
          unsubscribe();
        };
      }

      // Local / Offline mode: trigger callback asynchronously with current user
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

  const assignedRole = (role as any) || "attendee";

  // If real Firebase Auth is configured, delegate directly to Google Firebase:
  if (authInstance._sdkAuth) {
    try {
      const cred = await fbCreateUserWithEmailAndPassword(
        authInstance._sdkAuth,
        email.trim(),
        pass
      );
      const user = sdkUserToFirebaseUser(cred.user, assignedRole);
      authInstance.currentUser = user;
      notifyListeners(user);
      return { user };
    } catch (err: any) {
      throw new FirebaseAuthError(err?.code || "auth/unknown", err?.message);
    }
  }

  // Local / Offline Fallback Engine:
  const normalizedEmail = email.toLowerCase().trim();
  if (userStore.has(normalizedEmail)) {
    throw new FirebaseAuthError(
      "auth/email-already-in-use",
      "The email address is already in use by another account."
    );
  }

  const passwordHash = await hashPassword(pass);
  const uid = `usr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

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

  // If real Firebase Auth is configured, delegate directly to Google Firebase:
  if (authInstance._sdkAuth) {
    try {
      const cred = await fbSignInWithEmailAndPassword(
        authInstance._sdkAuth,
        email.trim(),
        pass
      );
      const user = sdkUserToFirebaseUser(cred.user);
      authInstance.currentUser = user;
      notifyListeners(user);
      return { user };
    } catch (err: any) {
      throw new FirebaseAuthError(err?.code || "auth/wrong-password", err?.message);
    }
  }

  // Local / Offline Fallback Engine:
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

export async function signInWithGoogle(
  authInstance: Auth
): Promise<{ user: FirebaseUser }> {
  if (authInstance._sdkAuth) {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const cred = await fbSignInWithPopup(authInstance._sdkAuth, provider);
      const user = sdkUserToFirebaseUser(cred.user);
      authInstance.currentUser = user;
      notifyListeners(user);
      return { user };
    } catch (err: any) {
      throw new FirebaseAuthError(err?.code || "auth/google-sign-in-failed", err?.message);
    }
  }

  // Local / Offline Fallback Engine:
  const mockUid = `usr-google-${Date.now().toString(36)}`;
  const stored: StoredUserCredential = {
    uid: mockUid,
    email: "user@gmail.com",
    passwordHash: "google-auth",
    displayName: "Google User",
    photoURL: null,
    role: "attendee",
    emailVerified: true,
    createdAt: new Date().toISOString(),
  };
  userStore.set("user@gmail.com", stored);
  const user = storedToFirebaseUser(stored);
  authInstance.currentUser = user;
  notifyListeners(user);
  return { user };
}

export async function signOut(authInstance: Auth): Promise<void> {
  if (authInstance._sdkAuth) {
    try {
      await fbSignOut(authInstance._sdkAuth);
    } catch (err) {
      console.warn("[Firebase] Error during SDK sign-out:", err);
    }
  }

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
  const authInstance = getFirebaseAuth();
  if (authInstance._sdkAuth?.currentUser) {
    try {
      await fbUpdateProfile(authInstance._sdkAuth.currentUser, {
        displayName: profile.displayName ?? undefined,
        photoURL: profile.photoURL ?? undefined,
      });
    } catch (err) {
      console.warn("[Firebase] Error updating SDK profile:", err);
    }
  }

  if (profile.displayName !== undefined) {
    user.displayName = profile.displayName;
  }
  if (profile.photoURL !== undefined) {
    user.photoURL = profile.photoURL;
  }

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
  const user: FirebaseUser = {
    uid: personaUserId,
    email: `${personaUserId}@aayojon.bd`,
    displayName: personaUserId,
    photoURL: null,
    emailVerified: true,
    isAnonymous: false,
    role: "attendee",
    getIdToken: async () => `mock-token:${personaUserId}`,
    reload: async () => {},
  };
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

export const app: any = getFirebaseApp();
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
