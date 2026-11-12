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
  syncUserProfileToFirestore,
  fetchUserProfileFromFirestore,
} from "./firestore";
import {
  getFirebaseAuth,
  isFirebaseConfigured,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithGoogle as clientSignInWithGoogle,
  signOut,
  onAuthStateChanged,
  updateProfile,
  signInAsPersona,
  type FirebaseUser,
} from "./client";

export type UserRole = "attendee" | "organizer" | "staff" | "sponsor" | "admin" | "venue_owner" | "vendor" | "super_admin";

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
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (
    email: string,
    pass: string,
    name: string,
    role?: string
  ) => Promise<void>;
  signOutUser: () => Promise<void>;
  switchPersona: (personaUserId: string) => Promise<void>;
  updateUserProfile: (updates: Partial<Profile>) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Role Normalization Helpers
// ---------------------------------------------------------------------------

export function toUserRole(role: string | null | undefined): UserRole {
  const norm = (role || "").toLowerCase().trim();
  if (norm === "super_admin" || norm === "superadmin" || norm === "platform_super_admin") return "super_admin";
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
    case "super_admin":
      return "SUPER_ADMIN";
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
  "usr-superadmin": {
    uid: "usr-superadmin",
    id: "usr-superadmin",
    email: "superadmin@aayojon.bd",
    displayName: "Platform SuperAdmin",
    display_name: "Platform SuperAdmin",
    role: "super_admin",
    platform_role: "SUPER_ADMIN",
    phone: "+8801700000001",
    organization_label: "Aayojon Core Foundation & Platform Governance",
    tenantId: "aayojon-root",
    interests: ["System Operations", "RBAC Policies", "Security Auditing", "Platform Trust"],
    preferred_city: "Dhaka",
    mfa_enabled: true,
    created_at: "2026-09-01T00:00:00Z",
    photoURL: null,
    isAnonymous: false,
    defaultPortal: "ADMIN",
  },
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
    avatar_url: params.photoURL || undefined,
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
const SESSION_STORAGE_KEY = "aayojon_user_session";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<any | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>("attendee");
  const [loading, setLoading] = useState<boolean>(true);

  // Helper to persist user session in cookies and localStorage
  const persistUserState = useCallback((user: AuthUser | null) => {
    if (typeof window === "undefined") return;
    try {
      if (user) {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
        document.cookie = `aayojon_uid=${user.uid}; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `aayojon_role=${user.role}; path=/; max-age=604800; SameSite=Lax`;
      } else {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        localStorage.removeItem(LOCAL_STORAGE_PERSONA_KEY);
        document.cookie = `aayojon_uid=; path=/; max-age=0`;
        document.cookie = `aayojon_role=; path=/; max-age=0`;
        document.cookie = `aayojon_persona=; path=/; max-age=0`;
      }
    } catch {
      // Storage access errors in private browsing are non-fatal
    }
  }, []);

  // Switch persona handler (retained for backward compatibility and test runner)
  const switchPersona = useCallback(
    async (personaUserId: string): Promise<void> => {
      const persona = DEMO_PERSONAS[personaUserId];
      if (!persona) {
        throw new Error(`Unknown persona: ${personaUserId}`);
      }

      setCurrentUser(persona);
      setActiveRole(persona.role);
      const mockFbUser = createMockFirebaseUser(persona);
      setFirebaseUser(mockFbUser);
      persistUserState(persona);
      try {
        localStorage.setItem(LOCAL_STORAGE_PERSONA_KEY, personaUserId);
      } catch {
        // Storage error ignored
      }
    },
    [persistUserState]
  );

  // Initialize auth state on mount
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initAuth = async () => {
      try {
        const authInstance = getFirebaseAuth();

        unsubscribe = onAuthStateChanged(authInstance, async (fbUser) => {
          if (fbUser) {
            setFirebaseUser(fbUser);

            // Fetch live profile from Firestore database if available
            let liveProfile: Profile | null = null;
            try {
              liveProfile = await fetchUserProfileFromFirestore(fbUser.uid);
            } catch {
              // Firestore optional
            }

            // Determine role from live DB profile or fallback
            let savedRole: UserRole = liveProfile?.platform_role
              ? toUserRole(liveProfile.platform_role)
              : toUserRole(fbUser.role);

            try {
              const saved = localStorage.getItem(SESSION_STORAGE_KEY);
              if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.uid === fbUser.uid && parsed.role) {
                  savedRole = parsed.role;
                }
              }
            } catch {
              // Ignore parse errors
            }

            const normEmail = (fbUser.email || "").toLowerCase();
            if (normEmail === "bfos.info@gmail.com" || normEmail === "superadmin@ayojon.select" || normEmail === "superadmin@aayojon.bd") {
              savedRole = "super_admin";
            } else if (normEmail === "admin@ayojon.select" || normEmail === "admin@aayojon.bd") {
              savedRole = "admin";
            }

            const displayName =
              fbUser.displayName ||
              liveProfile?.display_name ||
              fbUser.email?.split("@")[0] ||
              "User";

            const mappedUser = createDefaultAuthUser({
              uid: fbUser.uid,
              email: fbUser.email || "",
              displayName,
              role: savedRole,
              tenantId: fbUser.tenantId,
              photoURL: fbUser.photoURL || liveProfile?.avatar_url || null,
              isAnonymous: fbUser.isAnonymous,
            });

            if (liveProfile) {
              mappedUser.preferred_city = liveProfile.preferred_city || mappedUser.preferred_city;
              mappedUser.interests = liveProfile.interests || mappedUser.interests;
              mappedUser.phone = liveProfile.phone || mappedUser.phone;
              mappedUser.organization_label = liveProfile.organization_label || mappedUser.organization_label;
            }

            setCurrentUser(mappedUser);
            setActiveRole(mappedUser.role);
            persistUserState(mappedUser);

            // Synchronize with Cloud Firestore to guarantee DB persistence
            syncUserProfileToFirestore(mappedUser);
          } else {
            // Restore local session or active persona if saved
            let restored = false;
            try {
              const saved = localStorage.getItem(SESSION_STORAGE_KEY);
              if (saved) {
                const parsed = JSON.parse(saved) as AuthUser;
                if (parsed && parsed.uid) {
                  setCurrentUser(parsed);
                  setActiveRole(parsed.role);
                  setFirebaseUser(createMockFirebaseUser(parsed));
                  persistUserState(parsed);
                  restored = true;
                }
              }

              if (!restored) {
                const personaKey = localStorage.getItem(LOCAL_STORAGE_PERSONA_KEY);
                if (personaKey && DEMO_PERSONAS[personaKey]) {
                  const persona = DEMO_PERSONAS[personaKey];
                  setCurrentUser(persona);
                  setActiveRole(persona.role);
                  setFirebaseUser(createMockFirebaseUser(persona));
                  persistUserState(persona);
                  restored = true;
                }
              }
            } catch {
              // Ignore parse errors
            }

            if (!restored) {
              setCurrentUser(null);
              setFirebaseUser(null);
              setActiveRole("attendee");
              persistUserState(null);
            }
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
  }, [persistUserState]);

  // Sign In with Email
  const signInWithEmail = useCallback(
    async (email: string, pass: string): Promise<void> => {
      validateEmail(email);
      validatePassword(pass);

      const authInstance = getFirebaseAuth();
      const { user } = await signInWithEmailAndPassword(
        authInstance,
        email,
        pass
      );

      // Check if this account has custom role metadata
      let assignedRole: UserRole = toUserRole(user.role);
      const matchedPersona = DEMO_PERSONAS_LIST.find(
        (p) => p.email && p.email.toLowerCase() === email.toLowerCase()
      );
      if (matchedPersona) {
        assignedRole = matchedPersona.role;
      }

      const displayName = user.displayName || email.split("@")[0];
      const authUser = createDefaultAuthUser({
        uid: user.uid,
        email: user.email || email,
        displayName,
        role: assignedRole,
        tenantId: user.tenantId,
        photoURL: user.photoURL,
        isAnonymous: user.isAnonymous,
      });

      setCurrentUser(authUser);
      setActiveRole(assignedRole);
      setFirebaseUser(user);
      persistUserState(authUser);
      await syncUserProfileToFirestore(authUser);
    },
    [persistUserState]
  );

  // Sign In with Google
  const signInWithGoogle = useCallback(async (): Promise<void> => {
    const authInstance = getFirebaseAuth();
    const { user } = await clientSignInWithGoogle(authInstance);

    let liveProfile: Profile | null = null;
    try {
      liveProfile = await fetchUserProfileFromFirestore(user.uid);
    } catch {
      // Optional
    }

    let assignedRole: UserRole = liveProfile?.platform_role
      ? toUserRole(liveProfile.platform_role)
      : toUserRole(user.role);

    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.uid === user.uid && parsed.role) {
          assignedRole = parsed.role;
        }
      }
    } catch {
      // Ignore
    }

    const normEmail = (user.email || "").toLowerCase();
    if (normEmail === "bfos.info@gmail.com" || normEmail === "superadmin@ayojon.select" || normEmail === "superadmin@aayojon.bd") {
      assignedRole = "super_admin";
    } else if (normEmail === "admin@ayojon.select" || normEmail === "admin@aayojon.bd") {
      assignedRole = "admin";
    }

    const displayName =
      user.displayName ||
      liveProfile?.display_name ||
      user.email?.split("@")[0] ||
      "User";

    const authUser = createDefaultAuthUser({
      uid: user.uid,
      email: user.email || "",
      displayName,
      role: assignedRole,
      tenantId: user.tenantId,
      photoURL: user.photoURL || liveProfile?.avatar_url || null,
      isAnonymous: user.isAnonymous,
    });

    if (liveProfile) {
      authUser.preferred_city = liveProfile.preferred_city || authUser.preferred_city;
      authUser.interests = liveProfile.interests || authUser.interests;
      authUser.phone = liveProfile.phone || authUser.phone;
      authUser.organization_label = liveProfile.organization_label || authUser.organization_label;
    }

    setCurrentUser(authUser);
    setActiveRole(assignedRole);
    setFirebaseUser(user);
    persistUserState(authUser);

    // Save to Firestore DB
    await syncUserProfileToFirestore(authUser);
  }, [persistUserState]);

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
      persistUserState(newUser);
      await syncUserProfileToFirestore(newUser);
    },
    [persistUserState]
  );

  // Sign Out
  const signOutUser = useCallback(async (): Promise<void> => {
    const authInstance = getFirebaseAuth();
    if (authInstance) {
      await signOut(authInstance);
    }

    try {
      localStorage.removeItem(LOCAL_STORAGE_PERSONA_KEY);
    } catch {}

    setCurrentUser(null);
    setFirebaseUser(null);
    setActiveRole("attendee");
    persistUserState(null);
  }, [persistUserState]);

  // Update Profile
  const updateUserProfile = useCallback(
    async (updates: Partial<Profile>): Promise<void> => {
      if (!currentUser) return;

      const newRole = updates.platform_role ? toUserRole(updates.platform_role) : currentUser.role;
      const newPlatformRole = updates.platform_role ? toPlatformRole(updates.platform_role) : currentUser.platform_role;

      const updatedUser: AuthUser = {
        ...currentUser,
        ...updates,
        role: newRole,
        platform_role: newPlatformRole,
        displayName: updates.display_name !== undefined ? updates.display_name : currentUser.displayName,
        display_name: updates.display_name !== undefined ? updates.display_name : currentUser.display_name,
        photoURL: updates.avatar_url !== undefined ? updates.avatar_url : currentUser.photoURL,
        avatar_url: updates.avatar_url !== undefined ? updates.avatar_url : currentUser.avatar_url,
      };

      setCurrentUser(updatedUser);
      setActiveRole(newRole);
      persistUserState(updatedUser);

      // Sync directly to Cloud Firestore (/profiles/{uid})
      await syncUserProfileToFirestore(updatedUser);
    },
    [currentUser, persistUserState]
  );

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      firebaseUser,
      activeRole,
      loading,
      signInWithEmail,
      signInWithGoogle,
      signUpWithEmail,
      signOutUser,
      switchPersona,
      updateUserProfile,
    }),
    [
      currentUser,
      firebaseUser,
      activeRole,
      loading,
      signInWithEmail,
      signInWithGoogle,
      signUpWithEmail,
      signOutUser,
      switchPersona,
      updateUserProfile,
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
