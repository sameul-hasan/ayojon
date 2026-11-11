/**
 * Firebase Configuration Loader & Environment Validator
 * Milestone 1: FEAT-AUTH-001
 * Location: src/lib/firebase/config.ts
 */

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  measurementId?: string;
}

export type FirebaseClientConfig = FirebaseConfig;

export interface FirebaseEnvironmentStatus {
  isConfigured: boolean;
  isEmulator: boolean;
  projectId: string;
  authDomain: string;
  hasApiKey: boolean;
  hasAppId: boolean;
}

/**
 * Production Firebase Configuration for ayojon-d3350.
 * Ensures the real Firebase credentials are permanently active in production bundles
 * across any custom domain (including ayojon.select).
 */
export const LIVE_AYOJON_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: "AIzaSyCMkAcVKZoH9_tp7L0Gv83Vh7MM_aLsWXA",
  authDomain: "ayojon-d3350.firebaseapp.com",
  projectId: "ayojon-d3350",
  storageBucket: "ayojon-d3350.firebasestorage.app",
  messagingSenderId: "369049072152",
  appId: "1:369049072152:web:647eb9367406df443d896d",
  measurementId: "G-CQS0CX9KZ9",
};

/**
 * Universal environment variable accessor supporting:
 * 1. Inlined Vite build variables via define
 * 2. Node / test runner process.env
 * 3. Guaranteed fallback to LIVE_AYOJON_FIREBASE_CONFIG
 */
export function getEnv(key: string): string | undefined {
  if (typeof process !== "undefined" && process.env) {
    const val = process.env[key];
    if (val !== undefined && val !== "") return val;
  }
  return undefined;
}

export function getFirebaseConfig(): FirebaseConfig {
  const apiKey =
    getEnv("VITE_FIREBASE_API_KEY") ||
    getEnv("NEXT_PUBLIC_FIREBASE_API_KEY") ||
    LIVE_AYOJON_FIREBASE_CONFIG.apiKey;

  const projectId =
    getEnv("VITE_FIREBASE_PROJECT_ID") ||
    getEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID") ||
    LIVE_AYOJON_FIREBASE_CONFIG.projectId;

  const authDomain =
    getEnv("VITE_FIREBASE_AUTH_DOMAIN") ||
    getEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN") ||
    LIVE_AYOJON_FIREBASE_CONFIG.authDomain;

  const storageBucket =
    getEnv("VITE_FIREBASE_STORAGE_BUCKET") ||
    getEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET") ||
    LIVE_AYOJON_FIREBASE_CONFIG.storageBucket;

  const messagingSenderId =
    getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID") ||
    getEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID") ||
    LIVE_AYOJON_FIREBASE_CONFIG.messagingSenderId;

  const appId =
    getEnv("VITE_FIREBASE_APP_ID") ||
    getEnv("NEXT_PUBLIC_FIREBASE_APP_ID") ||
    LIVE_AYOJON_FIREBASE_CONFIG.appId;

  const measurementId =
    getEnv("VITE_FIREBASE_MEASUREMENT_ID") ||
    getEnv("NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID") ||
    LIVE_AYOJON_FIREBASE_CONFIG.measurementId;

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    measurementId,
  };
}

export function isFirebaseConfigured(): boolean {
  const cfg = getFirebaseConfig();
  return Boolean(
    cfg.apiKey &&
    !cfg.apiKey.startsWith("mock-") &&
    cfg.projectId &&
    cfg.projectId !== "aayojon-demo" &&
    cfg.appId
  );
}

export function isEmulatorEnabled(): boolean {
  const flag = getEnv("VITE_USE_FIREBASE_EMULATOR");
  return flag === "true" || flag === "1";
}

export function getFirebaseAuthEmulatorHost(): string {
  return getEnv("VITE_FIREBASE_AUTH_EMULATOR_HOST") || "127.0.0.1:9099";
}

export const firebaseConfig: FirebaseConfig = getFirebaseConfig();

export function getFirebaseStatus(): FirebaseEnvironmentStatus {
  const cfg = getFirebaseConfig();
  return {
    isConfigured: isFirebaseConfigured(),
    isEmulator: isEmulatorEnabled(),
    projectId: cfg.projectId,
    authDomain: cfg.authDomain,
    hasApiKey: Boolean(cfg.apiKey),
    hasAppId: Boolean(cfg.appId),
  };
}
