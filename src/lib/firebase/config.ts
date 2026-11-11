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
 * Universal environment variable accessor supporting:
 * 1. Vite's `import.meta.env`
 * 2. Node / test runner's `process.env`
 */
export function getEnv(key: string): string | undefined {
  try {
    const metaEnv = (new Function("try { return import.meta.env; } catch { return undefined; }"))();
    if (metaEnv && metaEnv[key] !== undefined && metaEnv[key] !== "") {
      return metaEnv[key];
    }
  } catch {
    // Ignore in non-ESM environments
  }

  if (typeof process !== "undefined" && process.env) {
    const val = process.env[key];
    if (val !== undefined && val !== "") return val;
  }
  return undefined;
}

export function getFirebaseEnvVar(suffix: string): string | undefined {
  return (
    getEnv(`VITE_FIREBASE_${suffix}`) ||
    getEnv(`NEXT_PUBLIC_FIREBASE_${suffix}`) ||
    getEnv(`FIREBASE_${suffix}`)
  );
}

/**
 * Standard fallback configuration used when real Firebase credentials
 * are not yet supplied in .env. Prevents initialization crashes.
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
 * Returns true if real, valid Firebase credentials are provided.
 * Returns false if credentials are empty or known placeholders.
 */
export function isFirebaseConfigured(): boolean {
  const apiKey = getFirebaseEnvVar("API_KEY");
  const projectId = getFirebaseEnvVar("PROJECT_ID");
  const appId = getFirebaseEnvVar("APP_ID");

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
    trimmedKey === "your-api-key-here" ||
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
  const emulatorFlag =
    getEnv("VITE_USE_FIREBASE_EMULATOR") ||
    getEnv("NEXT_PUBLIC_USE_FIREBASE_EMULATOR");
  return emulatorFlag === "true" || emulatorFlag === "1";
}

/**
 * Returns the host and port string for the Auth Emulator (default: "127.0.0.1:9099").
 */
export function getFirebaseAuthEmulatorHost(): string {
  return (
    getEnv("VITE_FIREBASE_AUTH_EMULATOR_HOST") ||
    getEnv("NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST") ||
    "127.0.0.1:9099"
  );
}

/**
 * Returns the active Firebase configuration object.
 */
export function getFirebaseConfig(): FirebaseConfig {
  if (isFirebaseConfigured()) {
    const projectId = getFirebaseEnvVar("PROJECT_ID")!.trim();
    return {
      apiKey: getFirebaseEnvVar("API_KEY")!.trim(),
      authDomain:
        getFirebaseEnvVar("AUTH_DOMAIN")?.trim() ||
        `${projectId}.firebaseapp.com`,
      projectId,
      storageBucket:
        getFirebaseEnvVar("STORAGE_BUCKET")?.trim() ||
        `${projectId}.firebasestorage.app`,
      messagingSenderId:
        getFirebaseEnvVar("MESSAGING_SENDER_ID")?.trim() || undefined,
      appId: getFirebaseEnvVar("APP_ID")!.trim(),
      measurementId:
        getFirebaseEnvVar("MEASUREMENT_ID")?.trim() || undefined,
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
