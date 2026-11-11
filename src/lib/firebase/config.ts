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
 * Standard deterministic fallback configuration used when real Firebase credentials
 * are not supplied in .env.local. Prevents initialization crashes.
 */
export const DEFAULT_MOCK_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: "mock-api-key-aayojon-demo-2026",
  authDomain: "aayojon-demo.firebaseapp.com",
  projectId: "aayojon-demo",
  storageBucket: "aayojon-demo.firebasestorage.app",
  messagingSenderId: "109876543210",
  appId: "1:109876543210:web:aayojonmockapp123456",
  measurementId: "G-AAYOJONDEMO",
};

/**
 * Returns true if real, valid-looking Firebase credentials are provided.
 * Returns false if credentials are empty or known placeholders.
 */
export function isFirebaseConfigured(): boolean {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  if (!apiKey || !projectId || !appId) {
    return false;
  }

  const trimmedKey = apiKey.trim();
  const trimmedProject = projectId.trim();

  if (
    trimmedKey === "" ||
    trimmedKey.startsWith("mock-") ||
    trimmedKey.includes("placeholder") ||
    trimmedKey === "your-api-key" ||
    trimmedProject === "" ||
    trimmedProject === "aayojon-demo" ||
    trimmedProject === "your-project-id"
  ) {
    return false;
  }

  return true;
}

/**
 * Returns true if the application is configured to connect to local Firebase Emulators.
 */
export function isEmulatorEnabled(): boolean {
  const emulatorFlag = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR;
  return emulatorFlag === "true" || emulatorFlag === "1";
}

/**
 * Returns the host and port string for the Auth Emulator (default: "127.0.0.1:9099").
 */
export function getFirebaseAuthEmulatorHost(): string {
  return process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
}

/**
 * Returns the active Firebase configuration object.
 */
export function getFirebaseConfig(): FirebaseConfig {
  if (isFirebaseConfigured()) {
    return {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!.trim(),
      authDomain:
        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() ||
        `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!.trim(),
      storageBucket:
        process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() ||
        `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
      messagingSenderId:
        process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim() || undefined,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!.trim(),
      measurementId:
        process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim() || undefined,
    };
  }
  return DEFAULT_MOCK_FIREBASE_CONFIG;
}

export const firebaseConfig: FirebaseConfig = getFirebaseConfig();

/**
 * Returns diagnostic details of the active Firebase configuration.
 */
export function getFirebaseStatus(): FirebaseEnvironmentStatus {
  const configured = isFirebaseConfigured();
  const cfg = getFirebaseConfig();
  return {
    isConfigured: configured,
    isEmulator: isEmulatorEnabled(),
    projectId: cfg.projectId,
    authDomain: cfg.authDomain,
    hasApiKey: Boolean(cfg.apiKey),
    hasAppId: Boolean(cfg.appId),
  };
}
