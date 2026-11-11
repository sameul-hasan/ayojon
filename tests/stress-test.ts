/**
 * Empirical Adversarial Stress Test Suite for Milestone 1 (Firebase Auth & Middleware)
 * Authored by: Challenger 1 (critic, specialist)
 * Location: tests/stress-test.ts
 */

import assert from "assert";
import { NextRequest, NextResponse } from "next/server";
import {
  verifyAuthToken,
  withAuth,
  createMockToken,
  createExpiredMockToken,
  extractToken,
} from "../src/lib/firebase/auth-middleware";
import {
  toUserRole,
  toPlatformRole,
  DEMO_PERSONAS,
  UserRole,
} from "../src/lib/firebase/auth-context";
import { DomainError } from "../src/lib/db";

interface EmpiricalFinding {
  id: string;
  category: string;
  title: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  reproductionCode: string;
  observedOutput: any;
  expectedOutput: any;
  verdict: "VULNERABILITY" | "BUG" | "ROBUST";
}

const findings: EmpiricalFinding[] = [];

async function runEmpiricalSuite() {
  console.log("==================================================");
  console.log("CHALLENGER 1: EMPIRICAL AUTH STRESS HARNESS");
  console.log("==================================================\n");

  // -------------------------------------------------------------------------
  // AREA A: Malformed, corrupt, or forged bearer tokens
  // -------------------------------------------------------------------------
  console.log("--- [Area A] Malformed, Corrupt & Forged Bearer Tokens ---");

  // A1: Corrupt base64 string
  let a1Err: any = null;
  try {
    await verifyAuthToken("mock-jwt.invalidbase64!@#$.sig");
  } catch (e) {
    a1Err = e;
  }
  assert.ok(a1Err instanceof DomainError && a1Err.code === "UNAUTHENTICATED");
  console.log("  [A1] PASS: Corrupt base64 payload rejected with 401 UNAUTHENTICATED");

  // A2: Forged mock-firebase-token with arbitrary role (Privilege Escalation)
  let a2AdminUser: any = null;
  try {
    a2AdminUser = await verifyAuthToken(
      "mock-firebase-token:attacker-hacker:admin:attacker@evil.com"
    );
  } catch (e) {
    a2AdminUser = null;
  }
  if (a2AdminUser && a2AdminUser.role === "admin") {
    findings.push({
      id: "CHALLENGE-001",
      category: "A: Forged Tokens",
      title: "Arbitrary admin privilege escalation via forged mock-firebase-token",
      severity: "HIGH",
      reproductionCode:
        'verifyAuthToken("mock-firebase-token:attacker:admin:attacker@evil.com")',
      observedOutput: a2AdminUser,
      expectedOutput: "Rejection (401 UNAUTHENTICATED)",
      verdict: "VULNERABILITY",
    });
    console.log(
      "  [A2] FINDING [HIGH]: Forged mock-firebase-token granted unauthenticated caller admin role:",
      a2AdminUser
    );
  }

  // A3: Forged mock-jwt token with arbitrary signature (Unsigned Mock JWT)
  const a3Payload = {
    uid: "attacker-jwt",
    role: "admin",
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
  const a3B64 = Buffer.from(JSON.stringify(a3Payload)).toString("base64url");
  const a3User = await verifyAuthToken(`mock-jwt.${a3B64}.fake_unsigned_signature`);
  if (a3User && a3User.role === "admin") {
    findings.push({
      id: "CHALLENGE-002",
      category: "A: Forged Tokens",
      title: "Arbitrary role spoofing in mock-jwt without signature verification",
      severity: "HIGH",
      reproductionCode:
        "verifyAuthToken(`mock-jwt.${base64Payload}.fake_unsigned_signature`)",
      observedOutput: a3User,
      expectedOutput: "Rejection (401 UNAUTHENTICATED) or HMAC verification",
      verdict: "VULNERABILITY",
    });
    console.log(
      "  [A3] FINDING [HIGH]: Unsigned mock-jwt with forged signature granted admin role:",
      a3User
    );
  }

  // -------------------------------------------------------------------------
  // AREA B: Expired mock JWT tokens
  // -------------------------------------------------------------------------
  console.log("\n--- [Area B] Expired Mock JWT Tokens ---");

  // B1: Explicit expired token trigger
  let b1Err: any = null;
  try {
    await verifyAuthToken("expired-token");
  } catch (e) {
    b1Err = e;
  }
  assert.ok(b1Err instanceof DomainError && b1Err.code === "UNAUTHENTICATED");
  console.log("  [B1] PASS: Explicit 'expired-token' rejected with 401");

  // B2: createExpiredMockToken helper
  const b2Token = createExpiredMockToken("usr-attendee-rafiq", "attendee");
  let b2Err: any = null;
  try {
    await verifyAuthToken(b2Token);
  } catch (e) {
    b2Err = e;
  }
  assert.ok(b2Err instanceof DomainError && b2Err.message === "Token has expired");
  console.log("  [B2] PASS: createExpiredMockToken rejected with 'Token has expired'");

  // B3: Expiration bypass with string timestamp in exp ("1000")
  const b3Payload = {
    uid: "usr-exp-bypass",
    role: "attendee",
    exp: "1000", // Year 1970 timestamp passed as string
  };
  const b3B64 = Buffer.from(JSON.stringify(b3Payload)).toString("base64url");
  let b3User: any = null;
  try {
    b3User = await verifyAuthToken(`mock-jwt.${b3B64}.sig`);
  } catch (e) {
    b3User = null;
  }
  if (b3User) {
    findings.push({
      id: "CHALLENGE-003",
      category: "B: Expired Tokens",
      title: "Expiration check bypass when exp is passed as a numeric string",
      severity: "MEDIUM",
      reproductionCode:
        'verifyAuthToken(mockJwtWithPayload({ uid: "usr-x", exp: "1000" }))',
      observedOutput: b3User,
      expectedOutput: "Rejection (401 UNAUTHENTICATED: Token has expired)",
      verdict: "BUG",
    });
    console.log(
      "  [B3] FINDING [MEDIUM]: Expired token with exp='1000' bypassed expiration check:",
      b3User
    );
  }

  // -------------------------------------------------------------------------
  // AREA C: Tampered payload tokens
  // -------------------------------------------------------------------------
  console.log("\n--- [Area C] Tampered Payload Tokens ---");

  // C1: Missing uid in mock-jwt payload
  const c1Payload = {
    role: "organizer",
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
  const c1B64 = Buffer.from(JSON.stringify(c1Payload)).toString("base64url");
  const c1User = await verifyAuthToken(`mock-jwt.${c1B64}.sig`);
  if (c1User && c1User.uid === undefined) {
    findings.push({
      id: "CHALLENGE-004",
      category: "C: Tampered Payload",
      title: "Missing uid field in mock-jwt returns undefined uid violating AuthenticatedUser contract",
      severity: "MEDIUM",
      reproductionCode:
        'verifyAuthToken(mockJwtWithPayload({ role: "organizer" }))',
      observedOutput: c1User,
      expectedOutput: "Rejection (401: Invalid or missing user ID in token payload)",
      verdict: "BUG",
    });
    console.log(
      "  [C1] FINDING [MEDIUM]: Mock-jwt with missing uid accepted, returning uid: undefined:",
      c1User
    );
  }

  // C2: Whitespace-only uid in mock-firebase-token
  let c2User: any = null;
  try {
    c2User = await verifyAuthToken("mock-firebase-token:   :attendee:test@test.bd");
  } catch (e) {
    c2User = null;
  }
  if (c2User && c2User.uid === "   ") {
    findings.push({
      id: "CHALLENGE-005",
      category: "C: Tampered Payload",
      title: "Whitespace-only uid in mock-firebase-token accepted as valid user",
      severity: "LOW",
      reproductionCode:
        'verifyAuthToken("mock-firebase-token:   :attendee:test@test.bd")',
      observedOutput: c2User,
      expectedOutput: "Rejection (401 UNAUTHENTICATED: Invalid mock Firebase token)",
      verdict: "BUG",
    });
    console.log(
      "  [C2] FINDING [LOW]: Whitespace-only uid accepted in mock-firebase-token:",
      c2User
    );
  }

  // -------------------------------------------------------------------------
  // AREA D: Token verification under missing / empty / whitespace headers
  // -------------------------------------------------------------------------
  console.log("\n--- [Area D] Header Parsing & Whitespace Variations ---");

  // D1: extractToken("Bearer ")
  const d1Token = extractToken("Bearer ");
  if (d1Token === "Bearer") {
    findings.push({
      id: "CHALLENGE-006",
      category: "D: Header Variations",
      title: "extractToken incorrectly returns string 'Bearer' when header is empty 'Bearer '",
      severity: "MEDIUM",
      reproductionCode: 'extractToken("Bearer ")',
      observedOutput: d1Token,
      expectedOutput: "null",
      verdict: "BUG",
    });
    console.log(
      "  [D1] FINDING [MEDIUM]: extractToken('Bearer ') returned 'Bearer' instead of null"
    );
  }

  // D2: Empty authorization header
  const d2Req = new NextRequest("https://aayojon.bd/api/v1/test", {
    headers: { authorization: "" },
  });
  assert.strictEqual(extractToken(d2Req), null);
  console.log("  [D2] PASS: Empty authorization header returns null");

  // D3: Whitespace authorization header
  const d3Req = new NextRequest("https://aayojon.bd/api/v1/test", {
    headers: { authorization: "    " },
  });
  assert.strictEqual(extractToken(d3Req), null);
  console.log("  [D3] PASS: Whitespace authorization header returns null");

  // -------------------------------------------------------------------------
  // AREA E: Unknown / invalid persona IDs in header or token
  // -------------------------------------------------------------------------
  console.log("\n--- [Area E] Unknown & Invalid Persona IDs ---");

  // E1: Invalid persona ID via x-user-id
  let e1Err: any = null;
  try {
    const e1Req = new NextRequest("https://aayojon.bd/api/v1/test", {
      headers: { "x-user-id": "usr-unknown-nonexistent" },
    });
    await verifyAuthToken(e1Req);
  } catch (e) {
    e1Err = e;
  }
  assert.ok(e1Err instanceof DomainError && e1Err.code === "UNAUTHENTICATED");
  console.log("  [E1] PASS: Unknown persona in x-user-id rejected with 401 UNAUTHENTICATED");

  // E2: All 6 demo personas verified successfully
  const demoIds = [
    "usr-attendee-rafiq",
    "usr-org-nusrat",
    "usr-org-tanvir",
    "usr-staff-mehedi",
    "usr-sponsor-farhana",
    "usr-admin-tariq",
  ];
  for (const id of demoIds) {
    const u = await verifyAuthToken(id);
    assert.strictEqual(u.uid, id);
  }
  console.log("  [E2] PASS: All 6 demo personas verified cleanly");

  // -------------------------------------------------------------------------
  // AREA F: Boundary / non-existent role permissions in withAuth
  // -------------------------------------------------------------------------
  console.log("\n--- [Area F] withAuth RBAC Boundaries & Error Propagation ---");

  // F1: Non-existent role permission rejects admin
  const f1Handler = withAuth(
    async () => NextResponse.json({ ok: true }),
    ["super_root_admin" as any]
  );
  const f1Req = new NextRequest("https://aayojon.bd/api/v1/test", {
    headers: { "x-user-id": "usr-admin-tariq" },
  });
  const f1Res = await f1Handler(f1Req);
  assert.strictEqual(f1Res.status, 403);
  console.log("  [F1] PASS: Non-existent role permission blocks user with 403 FORBIDDEN");

  // F2: withAuth masking handler errors as 401 UNAUTHENTICATED
  const f2Handler = withAuth(async () => {
    throw new Error("Critical database pool exhaustion");
  });
  const f2Req = new NextRequest("https://aayojon.bd/api/v1/test", {
    headers: { "x-user-id": "usr-admin-tariq" },
  });
  const f2Res = await f2Handler(f2Req);
  const f2Json = await f2Res.json();
  if (f2Res.status === 401 && f2Json.error.code === "UNAUTHENTICATED") {
    findings.push({
      id: "CHALLENGE-007",
      category: "F: withAuth Error Propagation",
      title: "withAuth catches downstream handler errors and masks them as 401 UNAUTHENTICATED",
      severity: "MEDIUM",
      reproductionCode:
        'withAuth(async () => { throw new Error("Database error"); })(req)',
      observedOutput: { status: f2Res.status, json: f2Json },
      expectedOutput: "HTTP 500 INTERNAL_SERVER_ERROR or uncaught rethrow",
      verdict: "BUG",
    });
    console.log(
      "  [F2] FINDING [MEDIUM]: Downstream handler error masked as 401 UNAUTHENTICATED:",
      f2Json
    );
  }

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log("\n==================================================");
  console.log("EMPIRICAL FINDINGS SUMMARY");
  console.log("==================================================");
  console.log(`Total Empirical Findings Discovered: ${findings.length}`);
  for (const f of findings) {
    console.log(`- [${f.severity}] ${f.id} (${f.category}): ${f.title}`);
  }
  console.log("==================================================\n");
}

runEmpiricalSuite().catch((err) => {
  console.error("Empirical suite failed to execute:", err);
  process.exit(1);
});
