import assert from "assert";
import { NextRequest, NextResponse } from "next/server";
import {
  toUserRole,
  toPlatformRole,
  DEMO_PERSONAS,
  UserRole,
  AuthUser,
} from "../src/lib/firebase/auth-context";
import {
  verifyAuthToken,
  withAuth,
  createMockToken,
  createExpiredMockToken,
} from "../src/lib/firebase/auth-middleware";
import { DomainError } from "../src/lib/db";

// ---------------------------------------------------------------------------
// Test Runner Harness (with Async Support)
// ---------------------------------------------------------------------------

interface TestResult {
  id: string;
  scenario: string;
  passed: boolean;
  error?: any;
}

const results: TestResult[] = [];

async function runCase(id: string, scenario: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    results.push({ id, scenario, passed: true });
    console.log(`✅ [${id}] PASS — ${scenario}`);
  } catch (err) {
    results.push({ id, scenario, passed: false, error: err });
    console.error(`❌ [${id}] FAIL — ${scenario}`, err);
    process.exitCode = 1;
  }
}

// ---------------------------------------------------------------------------
// Mock In-Memory Auth Service (Simulating Firebase Auth Client in Tests)
// ---------------------------------------------------------------------------

interface StoredUser {
  uid: string;
  email: string;
  passwordHash: string;
  displayName: string;
  role: UserRole;
}

class MockAuthService {
  private users: Map<string, StoredUser> = new Map();
  public currentUser: AuthUser | null = null;
  public activeRole: UserRole = "attendee";
  public activeToken: string | null = null;

  constructor() {
    this.reset();
  }

  reset() {
    this.users.clear();
    // Seed initial demo personas into mock auth database
    for (const p of Object.values(DEMO_PERSONAS)) {
      this.users.set(p.email.toLowerCase(), {
        uid: p.uid,
        email: p.email,
        passwordHash: "demo123456",
        displayName: p.displayName || "",
        role: p.role,
      });
    }
    this.currentUser = null;
    this.activeRole = "attendee";
    this.activeToken = null;
  }

  async signUpWithEmail(
    email: string,
    pass: string,
    name: string,
    role?: string
  ): Promise<AuthUser> {
    if (!email || !email.includes("@")) {
      const err = new Error("Invalid email format");
      (err as any).code = "auth/invalid-email";
      throw err;
    }
    if (!pass || pass.length < 6) {
      const err = new Error("Password must be at least 6 characters");
      (err as any).code = "auth/weak-password";
      throw err;
    }
    if (this.users.has(email.toLowerCase())) {
      const err = new Error("Email already registered");
      (err as any).code = "auth/email-already-in-use";
      throw err;
    }

    const assignedRole = toUserRole(role);
    const uid = `usr-gen-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const stored: StoredUser = {
      uid,
      email,
      passwordHash: pass,
      displayName: name,
      role: assignedRole,
    };
    this.users.set(email.toLowerCase(), stored);

    const user: AuthUser = {
      uid,
      id: uid,
      email,
      displayName: name,
      display_name: name,
      role: assignedRole,
      platform_role: toPlatformRole(assignedRole),
    };

    this.currentUser = user;
    this.activeRole = assignedRole;
    this.activeToken = createMockToken({ uid, email, role: assignedRole });
    return user;
  }

  async signInWithEmail(email: string, pass: string): Promise<AuthUser> {
    if (!email || !pass) {
      const err = new Error("Missing email or password");
      (err as any).code = "auth/invalid-credential";
      throw err;
    }
    const stored = this.users.get(email.toLowerCase());
    if (!stored) {
      const err = new Error("User not found");
      (err as any).code = "auth/user-not-found";
      throw err;
    }
    if (stored.passwordHash !== pass) {
      const err = new Error("Incorrect password");
      (err as any).code = "auth/wrong-password";
      throw err;
    }

    const user: AuthUser = {
      uid: stored.uid,
      id: stored.uid,
      email: stored.email,
      displayName: stored.displayName,
      display_name: stored.displayName,
      role: stored.role,
      platform_role: toPlatformRole(stored.role),
    };

    this.currentUser = user;
    this.activeRole = stored.role;
    this.activeToken = createMockToken({
      uid: stored.uid,
      email: stored.email,
      role: stored.role,
    });
    return user;
  }

  async signOutUser(): Promise<void> {
    this.currentUser = null;
    this.activeRole = "attendee";
    this.activeToken = null;
  }

  async switchPersona(personaUserId: string): Promise<AuthUser> {
    const persona = DEMO_PERSONAS[personaUserId];
    if (!persona) {
      throw new Error(`Demo persona '${personaUserId}' not found`);
    }
    this.currentUser = { ...persona };
    this.activeRole = persona.role;
    this.activeToken = `mock-firebase-token:${persona.uid}:${persona.role}:${persona.email}`;
    return this.currentUser;
  }
}

// ---------------------------------------------------------------------------
// Test Execution Suite
// ---------------------------------------------------------------------------

export async function runFirebaseAuthSuite(): Promise<boolean> {
  const auth = new MockAuthService();

  // AUTH-001: Sign-up with email and password + role assignment
  await runCase(
    "AUTH-001",
    "Sign-up with email and password + role assignment",
    async () => {
      auth.reset();

      // 1. Sign up with explicit organizer role
      const orgUser = await auth.signUpWithEmail(
        "test-org@buet.ac.bd",
        "secret123",
        "Test Organizer",
        "organizer"
      );
      assert.ok(orgUser.uid.startsWith("usr-gen-"), "UID should be generated");
      assert.strictEqual(orgUser.email, "test-org@buet.ac.bd");
      assert.strictEqual(orgUser.displayName, "Test Organizer");
      assert.strictEqual(orgUser.role, "organizer");
      assert.strictEqual(orgUser.platform_role, "ORGANIZER_OWNER");

      // 2. Sign up with default role (no role specified)
      const attendeeUser = await auth.signUpWithEmail(
        "test-attendee@gmail.com",
        "secret123",
        "Test Attendee"
      );
      assert.strictEqual(attendeeUser.role, "attendee", "Default role must be attendee");
      assert.strictEqual(attendeeUser.platform_role, "ATTENDEE");

      // 3. Duplicate email rejection
      let dupErr: any = null;
      try {
        await auth.signUpWithEmail("test-org@buet.ac.bd", "anotherpass", "Duplicate");
      } catch (e) {
        dupErr = e;
      }
      assert.ok(dupErr, "Duplicate email registration must fail");
      assert.strictEqual(dupErr.code, "auth/email-already-in-use");

      // 4. Invalid email format rejection
      let invalidEmailErr: any = null;
      try {
        await auth.signUpWithEmail("not-an-email", "secret123", "Invalid");
      } catch (e) {
        invalidEmailErr = e;
      }
      assert.ok(invalidEmailErr);
      assert.strictEqual(invalidEmailErr.code, "auth/invalid-email");
    }
  );

  // AUTH-002: Sign-in with valid credentials
  await runCase("AUTH-002", "Sign-in with valid credentials", async () => {
    auth.reset();

    // Sign in using seeded demo persona credentials
    const user = await auth.signInWithEmail(
      "rafiq@student.buet.ac.bd",
      "demo123456"
    );
    assert.ok(user, "User should be returned");
    assert.strictEqual(user.uid, "usr-attendee-rafiq");
    assert.strictEqual(user.email, "rafiq@student.buet.ac.bd");
    assert.strictEqual(user.role, "attendee");
    assert.strictEqual(auth.activeRole, "attendee");
    assert.ok(auth.activeToken, "Active token must be generated upon sign-in");
  });

  // AUTH-003: Sign-in failure with invalid credentials
  await runCase(
    "AUTH-003",
    "Sign-in failure with invalid credentials",
    async () => {
      auth.reset();

      // 1. Non-existent user
      let notFoundErr: any = null;
      try {
        await auth.signInWithEmail("nonexistent@domain.com", "anypass123");
      } catch (e) {
        notFoundErr = e;
      }
      assert.ok(notFoundErr);
      assert.strictEqual(notFoundErr.code, "auth/user-not-found");
      assert.strictEqual(auth.currentUser, null, "CurrentUser must remain null");

      // 2. Wrong password
      let wrongPassErr: any = null;
      try {
        await auth.signInWithEmail("rafiq@student.buet.ac.bd", "wrongpass");
      } catch (e) {
        wrongPassErr = e;
      }
      assert.ok(wrongPassErr);
      assert.strictEqual(wrongPassErr.code, "auth/wrong-password");
      assert.strictEqual(auth.currentUser, null, "CurrentUser must remain null");
    }
  );

  // AUTH-004: Sign-out and session clearance
  await runCase("AUTH-004", "Sign-out and session clearance", async () => {
    auth.reset();
    await auth.signInWithEmail("nusrat@buetcs.org", "demo123456");
    assert.ok(auth.currentUser !== null);
    assert.strictEqual(auth.activeRole, "organizer");

    await auth.signOutUser();
    assert.strictEqual(auth.currentUser, null, "CurrentUser must be cleared");
    assert.strictEqual(auth.activeToken, null, "Active token must be cleared");
    assert.strictEqual(auth.activeRole, "attendee", "Role should reset to attendee");
  });

  // AUTH-005: Session recovery / persistence behavior
  await runCase(
    "AUTH-005",
    "Session recovery / persistence behavior",
    async () => {
      auth.reset();
      // Sign in user and retrieve persistent mock token
      await auth.signInWithEmail("tanvir@nsu-yes.org", "demo123456");
      const token = auth.activeToken!;
      assert.ok(token);

      // Verify token restores user session correctly
      const restored = await verifyAuthToken(token);
      assert.strictEqual(restored.uid, "usr-org-tanvir");
      assert.strictEqual(restored.email, "tanvir@nsu-yes.org");
      assert.strictEqual(restored.role, "organizer");

      // Verify expired session token is rejected upon recovery
      const expiredToken = createExpiredMockToken("usr-org-tanvir", "organizer");
      let expiredErr: any = null;
      try {
        await verifyAuthToken(expiredToken);
      } catch (e) {
        expiredErr = e;
      }
      assert.ok(expiredErr, "Expired token must be rejected");
      assert.strictEqual(expiredErr.code, "UNAUTHENTICATED");
    }
  );

  // AUTH-006: Role mapping across all 5 roles
  await runCase("AUTH-006", "Role mapping across all 5 roles", () => {
    // 1. toUserRole mapping
    assert.strictEqual(toUserRole("ATTENDEE"), "attendee");
    assert.strictEqual(toUserRole("ORGANIZER_OWNER"), "organizer");
    assert.strictEqual(toUserRole("EVENT_MANAGER"), "organizer");
    assert.strictEqual(toUserRole("CHECKIN_STAFF"), "staff");
    assert.strictEqual(toUserRole("SPONSOR"), "sponsor");
    assert.strictEqual(toUserRole("ADMIN"), "admin");

    // 2. toPlatformRole inverse mapping
    assert.strictEqual(toPlatformRole("attendee"), "ATTENDEE");
    assert.strictEqual(toPlatformRole("organizer"), "ORGANIZER_OWNER");
    assert.strictEqual(toPlatformRole("staff"), "CHECKIN_STAFF");
    assert.strictEqual(toPlatformRole("sponsor"), "SPONSOR");
    assert.strictEqual(toPlatformRole("admin"), "ADMIN");

    // 3. Fallback and case-insensitivity
    assert.strictEqual(toUserRole("Organizer"), "organizer");
    assert.strictEqual(toUserRole("admin"), "admin");
    assert.strictEqual(toUserRole("UNKNOWN_ROLE"), "attendee");
    assert.strictEqual(toUserRole(null as any), "attendee");
  });

  // AUTH-007: Persona Bridge: switching across all 6 personas
  await runCase(
    "AUTH-007",
    "Persona Bridge: switching across all 6 personas",
    async () => {
      auth.reset();

      // 1. Rafiq (Attendee)
      const p1 = await auth.switchPersona("usr-attendee-rafiq");
      assert.strictEqual(p1.uid, "usr-attendee-rafiq");
      assert.strictEqual(p1.email, "rafiq@student.buet.ac.bd");
      assert.strictEqual(p1.role, "attendee");
      assert.strictEqual(p1.platform_role, "ATTENDEE");

      // 2. Nusrat (Organizer)
      const p2 = await auth.switchPersona("usr-org-nusrat");
      assert.strictEqual(p2.uid, "usr-org-nusrat");
      assert.strictEqual(p2.email, "nusrat@buetcs.org");
      assert.strictEqual(p2.role, "organizer");
      assert.strictEqual(p2.platform_role, "ORGANIZER_OWNER");

      // 3. Tanvir (Organizer)
      const p3 = await auth.switchPersona("usr-org-tanvir");
      assert.strictEqual(p3.uid, "usr-org-tanvir");
      assert.strictEqual(p3.email, "tanvir@nsu-yes.org");
      assert.strictEqual(p3.role, "organizer");

      // 4. Mehedi (Staff)
      const p4 = await auth.switchPersona("usr-staff-mehedi");
      assert.strictEqual(p4.uid, "usr-staff-mehedi");
      assert.strictEqual(p4.email, "mehedi@staff.buetcs.org");
      assert.strictEqual(p4.role, "staff");
      assert.strictEqual(p4.platform_role, "CHECKIN_STAFF");

      // 5. Farhana (Sponsor)
      const p5 = await auth.switchPersona("usr-sponsor-farhana");
      assert.strictEqual(p5.uid, "usr-sponsor-farhana");
      assert.strictEqual(p5.email, "farhana@pathao-ventures.bd");
      assert.strictEqual(p5.role, "sponsor");
      assert.strictEqual(p5.platform_role, "SPONSOR");

      // 6. Tariq (Admin)
      const p6 = await auth.switchPersona("usr-admin-tariq");
      assert.strictEqual(p6.uid, "usr-admin-tariq");
      assert.strictEqual(p6.email, "admin@aayojon.bd");
      assert.strictEqual(p6.role, "admin");
      assert.strictEqual(p6.platform_role, "ADMIN");

      // 7. Invalid persona rejection
      let invalidPersonaErr: any = null;
      try {
        await auth.switchPersona("usr-nonexistent");
      } catch (e) {
        invalidPersonaErr = e;
      }
      assert.ok(invalidPersonaErr);
    }
  );

  // AUTH-008: Auth middleware token verification & withAuth
  await runCase(
    "AUTH-008",
    "Auth middleware token verification & withAuth",
    async () => {
      // 1. Valid Bearer Token Verification from Request
      const token = createMockToken({
        uid: "usr-org-nusrat",
        email: "nusrat@buetcs.org",
        role: "organizer",
        tenantId: "org-buet-cc",
      });
      const req = new NextRequest("https://aayojon.bd/api/v1/organizer/test", {
        headers: { authorization: `Bearer ${token}` },
      });
      const verified = await verifyAuthToken(req);
      assert.strictEqual(verified.uid, "usr-org-nusrat");
      assert.strictEqual(verified.email, "nusrat@buetcs.org");
      assert.strictEqual(verified.role, "organizer");
      assert.strictEqual(verified.tenantId, "org-buet-cc");

      // 2. Missing Token Failure (401)
      const unauthReq = new NextRequest("https://aayojon.bd/api/v1/organizer/test");
      let missingErr: any = null;
      try {
        await verifyAuthToken(unauthReq);
      } catch (e) {
        missingErr = e;
      }
      assert.ok(missingErr instanceof DomainError);
      assert.strictEqual(missingErr.code, "UNAUTHENTICATED");
      assert.strictEqual(missingErr.status, 401);

      // 3. Expired Token Failure (401)
      let expErr: any = null;
      try {
        await verifyAuthToken("expired-token");
      } catch (e) {
        expErr = e;
      }
      assert.ok(expErr instanceof DomainError);
      assert.strictEqual(expErr.code, "UNAUTHENTICATED");

      // 4. Malformed Token Failure (401)
      let malformedErr: any = null;
      try {
        await verifyAuthToken("invalid-token");
      } catch (e) {
        malformedErr = e;
      }
      assert.ok(malformedErr instanceof DomainError);
      assert.strictEqual(malformedErr.code, "UNAUTHENTICATED");

      // 5. withAuth Route Execution: Authorized (200)
      const organizerHandler = withAuth(
        async (_req, _ctx, user) => {
          return NextResponse.json({ success: true, actor: user.uid });
        },
        ["organizer", "admin"]
      );

      const orgRes = await organizerHandler(req);
      assert.strictEqual(orgRes.status, 200);
      const orgJson = await orgRes.json();
      assert.strictEqual(orgJson.actor, "usr-org-nusrat");

      // 6. withAuth Route Execution: Forbidden Role (403)
      const attendeeToken = createMockToken({
        uid: "usr-attendee-rafiq",
        role: "attendee",
      });
      const attendeeReq = new NextRequest("https://aayojon.bd/api/v1/organizer/test", {
        headers: { authorization: `Bearer ${attendeeToken}` },
      });
      const forbiddenRes = await organizerHandler(attendeeReq);
      assert.strictEqual(forbiddenRes.status, 403);
      const forbiddenJson = await forbiddenRes.json();
      assert.strictEqual(forbiddenJson.error.code, "FORBIDDEN");

      // 7. withAuth Route Execution: Unauthenticated Request (401)
      const unauthRes = await organizerHandler(unauthReq);
      assert.strictEqual(unauthRes.status, 401);
      const unauthJson = await unauthRes.json();
      assert.strictEqual(unauthJson.error.code, "UNAUTHENTICATED");
    }
  );

  // Summary Report
  const passedCount = results.filter((r) => r.passed).length;
  console.log(`\nSummary: ${passedCount}/${results.length} Firebase Auth test cases passed.`);
  return passedCount === results.length;
}

// Direct execution when run via `node .test-dist/tests/firebase-auth.test.js`
if (require.main === module) {
  runFirebaseAuthSuite().catch((err) => {
    console.error("Firebase Auth test suite crashed:", err);
    process.exit(1);
  });
}
