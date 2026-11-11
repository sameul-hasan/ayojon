"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { PlatformRole, Profile } from "../types";
import {
  getFirebaseAuth,
  isFirebaseConfigured,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  signInAsPersona,
  type FirebaseUser,
} from "./client";

export type UserRole = "attendee" | "organizer" | "staff" | "sponsor" | "admin" | "venue_owner" | "vendor";

/**
 * Authenticated user interface.
 * Extends the legacy Profile interface (src/lib/types.ts) so that any AuthUser
 * can be passed directly to existing UI views (MarketplaceView, AttendeeWalletView, etc.)
 * with zero TypeScript compiler errors or undefined property crashes.
 */
export interface AuthUser {
  // Primary Firebase Auth identity fields
  uid: string;
  email: string;
  displayName: string | null;
  role: UserRole;
  tenantId?: string;
  photoURL?: string | null;
  isAnonymous?: boolean;

  // Compatibility fields fully satisfying the Profile interface
  id: string;
  display_name: string;
  platform_role: PlatformRole;
  phone?: string;
  avatar_url?: string;
  organization_label?: string;
  mfa_enabled?: boolean;
  interests?: string[];
  preferred_city?: string;
  created_at?: string;
}

export interface AuthContextValue {
  currentUser: AuthUser | null;
  firebaseUser: any | null;
  activeRole: UserRole;
  loading: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    pass: string,
    name: string,
    role?: string
  ) => Promise<void>;
  signOutUser: () => Promise<void>;
  switchPersona: (personaUserId: string) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Role Normalization Helpers
// ---------------------------------------------------------------------------

export function toUserRole(role: string | null | undefined): UserRole {
  const norm = (role || "").toLowerCase().trim();
  if (norm === "attendee") return "attendee";
  if (
    norm === "organizer" ||
    norm === "organizer_owner" ||
    norm === "event_manager"
  )
    return "organizer";
  if (norm === "staff" || norm === "checkin_staff") return "staff";
  if (norm === "sponsor") return "sponsor";
  if (norm === "admin") return "admin";
  if (norm === "venue_owner" || norm === "venue") return "venue_owner";
  if (norm === "vendor" || norm === "service_vendor") return "vendor";
  return "attendee";
}

export function toPlatformRole(role: UserRole | string): PlatformRole {
  switch (toUserRole(role)) {
    case "attendee":
      return "ATTENDEE";
    case "organizer":
      return "ORGANIZER_OWNER";
    case "staff":
      return "CHECKIN_STAFF";
    case "sponsor":
      return "SPONSOR";
    case "admin":
      return "ADMIN";
    case "venue_owner":
      return "VENUE_OWNER";
    case "vendor":
      return "VENDOR";
    default:
      return "ATTENDEE";
  }
}

// ---------------------------------------------------------------------------
// Canonical Demo Personas (FEAT-AUTH-003)
// Fully populated with seed timestamps, tenant IDs, and non-null UI fields
// ---------------------------------------------------------------------------

export const DEMO_PERSONAS: Record<string, AuthUser & { defaultPortal: string }> = {
  "usr-attendee-rafiq": {
    uid: "usr-attendee-rafiq",
    id: "usr-attendee-rafiq",
    email: "rafiq@student.buet.ac.bd",
    displayName: "Rafiqul Islam",
    display_name: "Rafiqul Islam",
    role: "attendee",
    platform_role: "ATTENDEE",
    phone: "+8801711223344",
    organization_label: "CSE Undergraduate, BUET",
    interests: ["tech-workshops", "university-clubs", "conferences"],
    preferred_city: "Dhaka",
    mfa_enabled: false,
    created_at: "2026-10-15T08:00:00Z",
    photoURL: null,
    isAnonymous: false,
    defaultPortal: "MARKETPLACE",
  },
  "usr-org-nusrat": {
    uid: "usr-org-nusrat",
    id: "usr-org-nusrat",
    email: "nusrat@buetcs.org",
    displayName: "Nusrat Jahan",
    display_name: "Nusrat Jahan",
    role: "organizer",
    platform_role: "ORGANIZER_OWNER",
    phone: "+8801819556677",
    organization_label: "BUET Computer Club & Dhaka Tech Collective",
    tenantId: "org-buet-cc",
    interests: ["conferences", "tech-workshops", "university-clubs"],
    preferred_city: "Dhaka",
    mfa_enabled: true,
    created_at: "2026-10-01T09:00:00Z",
    photoURL: null,
    isAnonymous: false,
    defaultPortal: "ORGANIZER",
  },
  "usr-org-tanvir": {
    uid: "usr-org-tanvir",
    id: "usr-org-tanvir",
    email: "tanvir@nsu-yes.org",
    displayName: "Tanvir Ahmed",
    display_name: "Tanvir Ahmed",
    role: "organizer",
    platform_role: "ORGANIZER_OWNER",
    phone: "+8801912334455",
    organization_label: "NSU Young Entrepreneurs Society (YES!)",
    tenantId: "org-nsu-yes",
    interests: ["startup-business", "university-clubs"],
    preferred_city: "Dhaka",
    mfa_enabled: true,
    created_at: "2026-10-05T10:00:00Z",
    photoURL: null,
    isAnonymous: false,
    defaultPortal: "ORGANIZER",
  },
  "usr-staff-mehedi": {
    uid: "usr-staff-mehedi",
    id: "usr-staff-mehedi",
    email: "mehedi@staff.buetcs.org",
    displayName: "Mehedi Hasan",
    display_name: "Mehedi Hasan",
    role: "staff",
    platform_role: "CHECKIN_STAFF",
    phone: "+8801611889900",
    organization_label: "Gate Check-In Lead (BUET Computer Club)",
    tenantId: "org-buet-cc",
    interests: ["university-clubs"],
    preferred_city: "Dhaka",
    mfa_enabled: false,
    created_at: "2026-10-12T11:00:00Z",
    photoURL: null,
    isAnonymous: false,
    defaultPortal: "SCANNER",
  },
  "usr-sponsor-farhana": {
    uid: "usr-sponsor-farhana",
    id: "usr-sponsor-farhana",
    email: "farhana@pathao-ventures.bd",
    displayName: "Farhana Rahman",
    display_name: "Farhana Rahman",
    role: "sponsor",
    platform_role: "SPONSOR",
    phone: "+8801755667788",
    organization_label: "Brand & Campus Partnerships, Pathao Ventures",
    interests: ["conferences", "startup-business", "university-clubs"],
    preferred_city: "Dhaka",
    mfa_enabled: false,
    created_at: "2026-10-18T12:00:00Z",
    photoURL: null,
    isAnonymous: false,
    defaultPortal: "SPONSOR",
  },
  "usr-admin-tariq": {
    uid: "usr-admin-tariq",
    id: "usr-admin-tariq",
    email: "admin@aayojon.bd",
    displayName: "Tariq Mahmud",
    display_name: "Tariq Mahmud",
    role: "admin",
    platform_role: "ADMIN",
    phone: "+8801700001122",
    organization_label: "Aayojon Platform Trust & Operations",
    tenantId: "aayojon-admin",
    interests: ["conferences", "tech-workshops", "startup-business"],
    preferred_city: "Dhaka",
    mfa_enabled: true,
    created_at: "2026-09-25T06:00:00Z",
    photoURL: null,
    isAnonymous: false,
    defaultPortal: "ADMIN",
  },
  "usr-venue-kamal": {
    uid: "usr-venue-kamal",
    id: "usr-venue-kamal",
    email: "kamal@kib-auditorium.org.bd",
    displayName: "Kamal Hossain",
    display_name: "Kamal Hossain",
    role: "venue_owner",
    platform_role: "VENUE_OWNER",
    phone: "+8801711234567",
    organization_label: "Krishibid Institution Bangladesh (KIB)",
    tenantId: "ven-kib-dhaka",
    interests: ["conferences", "university-clubs", "cultural-festivals"],
    preferred_city: "Dhaka",
    mfa_enabled: true,
    created_at: "2026-10-10T08:00:00Z",
    photoURL: null,
    isAnonymous: false,
    defaultPortal: "PROVIDER",
  },
  "usr-vendor-tariq": {
    uid: "usr-vendor-tariq",
    id: "usr-vendor-tariq",
    email: "tariq@soundcraft.com.bd",
    displayName: "Tariqul Islam",
    display_name: "Tariqul Islam",
    role: "vendor",
    platform_role: "VENDOR",
    phone: "+8801811998877",
    organization_label: "SoundCraft BD & Master Catering",
    tenantId: "vnd-soundcraft-bd",
    interests: ["concerts", "conferences", "tech-workshops"],
    preferred_city: "Dhaka",
    mfa_enabled: true,
    created_at: "2026-10-12T09:30:00Z",
    photoURL: null,
    isAnonymous: false,
    defaultPortal: "PROVIDER",
  },
};

export const DEMO_PERSONAS_LIST = Object.values(DEMO_PERSONAS);

// ---------------------------------------------------------------------------
// Mock Firebase User Factory (for Offline & Persona Mode)
// ---------------------------------------------------------------------------

export function createMockFirebaseUser(user: AuthUser): FirebaseUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL || null,
    isAnonymous: !!user.isAnonymous,
    emailVerified: true,
    tenantId: user.tenantId,
    role: user.role,
    getIdToken: async (_forceRefresh?: boolean): Promise<string> => {
      return `mock-firebase-token:${user.uid}:${user.role}:${user.email || ""}`;
    },
    reload: async (): Promise<void> => {},
  };
}

// ---------------------------------------------------------------------------
// Dynamic User Construction Helper with Safe UI Defaults
// ---------------------------------------------------------------------------

function createDefaultAuthUser(params: {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  tenantId?: string;
  photoURL?: string | null;
  isAnonymous?: boolean;
}): AuthUser {
  return {
    uid: params.uid,
    id: params.uid,
    email: params.email,
    displayName: params.displayName,
    display_name: params.displayName,
    role: params.role,
    platform_role: toPlatformRole(params.role),
    phone: "",
    organization_label: "",
    interests: [], // Guaranteed non-null array prevents MarketplaceView.tsx crash
    preferred_city: "Dhaka", // Guaranteed non-null string
    mfa_enabled: false,
    created_at: new Date().toISOString(), // Guaranteed non-optional ISO timestamp
    photoURL: params.photoURL || null,
    isAnonymous: !!params.isAnonymous,
    tenantId: params.tenantId,
  };
}

// ---------------------------------------------------------------------------
// Validation Helpers
// ---------------------------------------------------------------------------

function validateEmail(email: string): void {
  if (!email || typeof email !== "string" || !email.includes("@")) {
    const err: any = new Error("Invalid email format");
    err.code = "auth/invalid-email";
    throw err;
  }
}

function validatePassword(pass: string): void {
  if (!pass || typeof pass !== "string" || pass.length < 6) {
    const err: any = new Error("Password must be at least 6 characters");
    err.code = "auth/weak-password";
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Auth Context & Provider
// ---------------------------------------------------------------------------

const LOCAL_STORAGE_PERSONA_KEY = "aayojon_active_persona";
const DEFAULT_PERSONA_ID = "usr-attendee-rafiq";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const defaultPersona = DEMO_PERSONAS[DEFAULT_PERSONA_ID];
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(defaultPersona);
  const [firebaseUser, setFirebaseUser] = useState<any | null>(() =>
    createMockFirebaseUser(defaultPersona)
  );
  const [activeRole, setActiveRole] = useState<UserRole>(defaultPersona.role);
  const [loading, setLoading] = useState<boolean>(true);

  // Helper to persist persona cookies and localStorage
  const persistPersonaState = useCallback((user: AuthUser | null) => {
    if (typeof window === "undefined") return;
    try {
      if (user) {
        localStorage.setItem(LOCAL_STORAGE_PERSONA_KEY, user.uid);
        document.cookie = `aayojon_persona=${user.uid}; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `aayojon_role=${user.role}; path=/; max-age=604800; SameSite=Lax`;
      } else {
        localStorage.removeItem(LOCAL_STORAGE_PERSONA_KEY);
        document.cookie = `aayojon_persona=; path=/; max-age=0`;
        document.cookie = `aayojon_role=; path=/; max-age=0`;
      }
    } catch {
      // Storage access errors in private browsing are non-fatal
    }
  }, []);

  // Switch persona handler (FEAT-AUTH-003)
  const switchPersona = useCallback(
    async (personaUserId: string): Promise<void> => {
      const persona = DEMO_PERSONAS[personaUserId];
      if (!persona) {
        throw new Error(`Unknown demo persona: ${personaUserId}`);
      }

      const authInstance = getFirebaseAuth();
      try {
        await signInAsPersona(authInstance, personaUserId);
      } catch {
        // Fallback if not found in userStore
      }

      setCurrentUser(persona);
      setActiveRole(persona.role);
      const mockFbUser = createMockFirebaseUser(persona);
      setFirebaseUser(mockFbUser);
      persistPersonaState(persona);
    },
    [persistPersonaState]
  );

  // Initialize auth state on mount
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initAuth = async () => {
      try {
        const authInstance = getFirebaseAuth();

        unsubscribe = onAuthStateChanged(authInstance, (fbUser) => {
          if (fbUser) {
            setFirebaseUser(fbUser);
            const persona = fbUser.email
              ? DEMO_PERSONAS_LIST.find(
                  (p) => p.email.toLowerCase() === fbUser.email!.toLowerCase()
                )
              : undefined;

            const displayName =
              fbUser.displayName ||
              persona?.displayName ||
              fbUser.email?.split("@")[0] ||
              "User";
            const role = persona ? persona.role : toUserRole(fbUser.role);
            const tenantId = persona?.tenantId || fbUser.tenantId;

            const mappedUser = createDefaultAuthUser({
              uid: fbUser.uid,
              email: fbUser.email || "",
              displayName,
              role,
              tenantId,
              photoURL: fbUser.photoURL,
              isAnonymous: fbUser.isAnonymous,
            });
            setCurrentUser(mappedUser);
            setActiveRole(mappedUser.role);
            persistPersonaState(mappedUser);
          } else {
            const storedPersonaId =
              typeof window !== "undefined"
                ? localStorage.getItem(LOCAL_STORAGE_PERSONA_KEY)
                : null;
            const personaToLoad =
              storedPersonaId && DEMO_PERSONAS[storedPersonaId]
                ? DEMO_PERSONAS[storedPersonaId]
                : DEMO_PERSONAS[DEFAULT_PERSONA_ID];

            setCurrentUser(personaToLoad);
            setActiveRole(personaToLoad.role);
            setFirebaseUser(createMockFirebaseUser(personaToLoad));
            persistPersonaState(personaToLoad);
          }
          setLoading(false);
        });
      } catch (err) {
        console.warn("Auth initialization notice:", err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [persistPersonaState]);

  // Sign In with Email
  const signInWithEmail = useCallback(
    async (email: string, pass: string): Promise<void> => {
      validateEmail(email);
      validatePassword(pass);

      const authInstance = getFirebaseAuth();

      // Authenticate via client.ts in-memory engine
      const { user } = await signInWithEmailAndPassword(
        authInstance,
        email,
        pass
      );

      // Check if email matches any demo persona
      const matchedPersona = DEMO_PERSONAS_LIST.find(
        (p) => p.email && p.email.toLowerCase() === email.toLowerCase()
      );

      const displayName = user.displayName || email.split("@")[0];
      const assignedRole = matchedPersona ? matchedPersona.role : toUserRole(user.role);
      const tenantId = matchedPersona?.tenantId || user.tenantId;

      const authUser = createDefaultAuthUser({
        uid: user.uid,
        email: user.email || email,
        displayName,
        role: assignedRole,
        tenantId,
        photoURL: user.photoURL,
        isAnonymous: user.isAnonymous,
      });

      setCurrentUser(authUser);
      setActiveRole(assignedRole);
      setFirebaseUser(user);
      persistPersonaState(authUser);
    },
    [persistPersonaState]
  );

  // Sign Up with Email
  const signUpWithEmail = useCallback(
    async (
      email: string,
      pass: string,
      name: string,
      role?: string
    ): Promise<void> => {
      validateEmail(email);
      validatePassword(pass);

      const assignedRole = toUserRole(role || "attendee");
      const authInstance = getFirebaseAuth();

      const cred = await createUserWithEmailAndPassword(
        authInstance,
        email,
        pass,
        assignedRole
      );
      if (name) {
        await updateProfile(cred.user, { displayName: name });
      }

      const displayName = name || email.split("@")[0];
      const newUser = createDefaultAuthUser({
        uid: cred.user.uid,
        email: cred.user.email || email,
        displayName,
        role: assignedRole,
        photoURL: null,
        isAnonymous: false,
      });

      setCurrentUser(newUser);
      setActiveRole(assignedRole);
      setFirebaseUser(cred.user);
      persistPersonaState(newUser);
    },
    [persistPersonaState]
  );

  // Sign Out
  const signOutUser = useCallback(async (): Promise<void> => {
    const authInstance = getFirebaseAuth();
    if (authInstance) {
      await signOut(authInstance);
    }

    setCurrentUser(null);
    setFirebaseUser(null);
    setActiveRole("attendee");
    persistPersonaState(null);
  }, [persistPersonaState]);

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      firebaseUser,
      activeRole,
      loading,
      signInWithEmail,
      signUpWithEmail,
      signOutUser,
      switchPersona,
    }),
    [
      currentUser,
      firebaseUser,
      activeRole,
      loading,
      signInWithEmail,
      signUpWithEmail,
      signOutUser,
      switchPersona,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// useAuth Hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
