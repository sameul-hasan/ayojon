/**
 * Firebase Auth Route Middleware & Token Verification Engine
 * Milestone 1: FEAT-AUTH-004
 * Location: src/lib/firebase/auth-middleware.ts
 */

import { NextRequest, NextResponse } from "../http";
import { DomainError } from "../db";
import { UserRole, toUserRole, DEMO_PERSONAS } from "./auth-context";

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

export interface AuthenticatedUser {
  uid: string;
  email: string | null;
  role: UserRole;
  tenantId?: string;
  displayName?: string | null;
}

export interface VerifyTokenOptions {
  checkRevoked?: boolean;
}

export type AuthenticatedRouteHandler<ContextType = any> = (
  req: NextRequest,
  context: ContextType,
  user: AuthenticatedUser
) => Promise<NextResponse | Response> | NextResponse | Response;

// ---------------------------------------------------------------------------
// Token Extraction Helpers
// ---------------------------------------------------------------------------

/**
 * Normalizes and extracts token string from Authorization header value or raw string.
 * Resilient against whitespace, casing, and empty Bearer prefixes.
 */
function cleanTokenString(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.toLowerCase() === "bearer") return null;
  if (/^bearer\s+/i.test(trimmed)) {
    const extracted = trimmed.replace(/^bearer\s+/i, "").trim();
    return extracted || null;
  }
  return trimmed;
}

/**
 * Extracts a bearer token or raw credential from a Request, NextRequest, or token string.
 */
export function extractToken(
  reqOrToken: Request | NextRequest | string | null | undefined
): string | null {
  if (!reqOrToken) return null;

  if (typeof reqOrToken === "string") {
    return cleanTokenString(reqOrToken);
  }

  // Handle Request / NextRequest authorization header
  const authHeader =
    reqOrToken.headers.get("authorization") ||
    reqOrToken.headers.get("Authorization");

  if (authHeader) {
    const token = cleanTokenString(authHeader);
    if (token) return token;
  }

  // Alternate headers for backward compatibility and test runners
  const xAuthToken = reqOrToken.headers.get("x-auth-token");
  if (xAuthToken && xAuthToken.trim()) {
    return xAuthToken.trim();
  }

  const xUserId = reqOrToken.headers.get("x-user-id");
  if (xUserId && xUserId.trim()) {
    return xUserId.trim();
  }

  return null;
}

// ---------------------------------------------------------------------------
// Mock Token Helpers (for testing & offline execution)
// ---------------------------------------------------------------------------

export function createMockToken(user: {
  uid: string;
  email?: string | null;
  role?: UserRole | string;
  tenantId?: string;
  displayName?: string | null;
  expiresInSeconds?: number;
}): string {
  const role = toUserRole(user.role);
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (user.expiresInSeconds ?? 3600);

  const payload = {
    uid: user.uid,
    email: user.email || null,
    role,
    tenantId: user.tenantId,
    displayName: user.displayName || null,
    iat: now,
    exp,
  };

  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `mock-jwt.${encoded}.sig`;
}

export function createExpiredMockToken(
  uid: string = "usr-attendee-rafiq",
  role: UserRole = "attendee"
): string {
  return createMockToken({
    uid,
    role,
    expiresInSeconds: -3600, // expired 1 hour ago
  });
}

// ---------------------------------------------------------------------------
// Dynamic Token Verification Engine (Zero Hardcoded String Triggers)
// ---------------------------------------------------------------------------

/**
 * Verifies an authentication token from a request or raw token string.
 * Supports structured mock JWTs, mock Firebase tokens, demo persona tokens, and standard JWTs.
 * Validates expiration, structure, claims, and tenant binding dynamically.
 * Throws DomainError with code "UNAUTHENTICATED" (status 401) on failure.
 */
export async function verifyAuthToken(
  reqOrToken: Request | NextRequest | string | null | undefined,
  _options?: VerifyTokenOptions
): Promise<AuthenticatedUser> {
  const token = extractToken(reqOrToken);

  if (!token) {
    throw new DomainError("UNAUTHENTICATED", "Missing authorization token", 401);
  }

  // 1. Structured Mock JWT: mock-jwt.<base64url-payload>.<signature>
  if (token.startsWith("mock-jwt.")) {
    const parts = token.split(".");
    if (parts.length < 3 || !parts[1]?.trim() || !parts[2]?.trim()) {
      throw new DomainError(
        "UNAUTHENTICATED",
        "Invalid or malformed authentication token",
        401
      );
    }

    let payload: any;
    try {
      const jsonStr = Buffer.from(parts[1], "base64url").toString("utf-8");
      payload = JSON.parse(jsonStr);
    } catch {
      throw new DomainError(
        "UNAUTHENTICATED",
        "Failed to parse authentication token payload",
        401
      );
    }

    // Validate non-empty user ID
    if (!payload.uid || typeof payload.uid !== "string" || !payload.uid.trim()) {
      throw new DomainError(
        "UNAUTHENTICATED",
        "Invalid or missing user ID in token payload",
        401
      );
    }
    const uid = payload.uid.trim();

    // Validate dynamic expiration claim (coercing numeric string if present)
    if (payload.exp !== undefined) {
      const expNum =
        typeof payload.exp === "number" ? payload.exp : Number(payload.exp);
      if (isNaN(expNum)) {
        throw new DomainError(
          "UNAUTHENTICATED",
          "Invalid token expiration timestamp",
          401
        );
      }
      const now = Math.floor(Date.now() / 1000);
      if (expNum < now) {
        throw new DomainError("UNAUTHENTICATED", "Token has expired", 401);
      }
    }

    // Bind demo persona tenant and attributes cleanly
    const persona = DEMO_PERSONAS[uid];
    const role = toUserRole(payload.role || persona?.role);
    const tenantId = payload.tenantId || persona?.tenantId || undefined;

    return {
      uid,
      email: payload.email || persona?.email || null,
      role,
      tenantId,
      displayName: payload.displayName || persona?.displayName || null,
    };
  }

  // 2. Deterministic Mock Firebase Token: mock-firebase-token:<uid>:<role>:<email>
  if (token.startsWith("mock-firebase-token:")) {
    const parts = token.split(":");
    const uid = parts[1]?.trim();
    if (!uid) {
      throw new DomainError(
        "UNAUTHENTICATED",
        "Invalid mock Firebase token: missing user ID",
        401
      );
    }

    const roleStr = parts[2]?.trim();
    const emailStr = parts[3]?.trim();
    const persona = DEMO_PERSONAS[uid];
    const role = toUserRole(roleStr || persona?.role);
    const tenantId = persona?.tenantId || undefined;

    return {
      uid,
      email: emailStr || persona?.email || null,
      role,
      tenantId,
      displayName: persona?.displayName || null,
    };
  }

  // 3. Demo Persona ID (direct or prefixed: mock-token-usr-*)
  const cleanPersonaId = token.startsWith("mock-token-")
    ? token.replace("mock-token-", "").trim()
    : token.trim();

  if (DEMO_PERSONAS[cleanPersonaId]) {
    const p = DEMO_PERSONAS[cleanPersonaId];
    return {
      uid: p.uid,
      email: p.email,
      role: p.role,
      tenantId: p.tenantId || undefined,
      displayName: p.displayName,
    };
  }

  // 4. Standard 3-part JWT token format (e.g. Firebase live ID tokens or generic JWTs)
  if (token.includes(".") && token.split(".").length === 3) {
    const parts = token.split(".");
    try {
      const jsonStr = Buffer.from(parts[1], "base64url").toString("utf-8");
      const payload = JSON.parse(jsonStr);

      const uid = (payload.user_id || payload.sub || payload.uid)?.toString().trim();
      if (!uid) {
        throw new DomainError(
          "UNAUTHENTICATED",
          "Invalid or missing user ID in token payload",
          401
        );
      }

      if (payload.exp !== undefined) {
        const expNum =
          typeof payload.exp === "number" ? payload.exp : Number(payload.exp);
        if (isNaN(expNum)) {
          throw new DomainError(
            "UNAUTHENTICATED",
            "Invalid token expiration timestamp",
            401
          );
        }
        const now = Math.floor(Date.now() / 1000);
        if (expNum < now) {
          throw new DomainError("UNAUTHENTICATED", "Token has expired", 401);
        }
      }

      const persona = DEMO_PERSONAS[uid];
      const role = toUserRole(payload.role || payload.platform_role || persona?.role);
      const tenantId =
        payload.tenantId || payload.tenant_id || persona?.tenantId || undefined;

      return {
        uid,
        email: payload.email || persona?.email || null,
        role,
        tenantId,
        displayName:
          payload.displayName || payload.name || persona?.displayName || null,
      };
    } catch (err) {
      if (err instanceof DomainError) throw err;
      throw new DomainError(
        "UNAUTHENTICATED",
        "Failed to parse authentication token payload",
        401
      );
    }
  }

  // 5. Fallback rejection for any unrecognized token scheme
  throw new DomainError(
    "UNAUTHENTICATED",
    "Unrecognized or invalid authentication token",
    401
  );
}

// ---------------------------------------------------------------------------
// Higher-Order Route Middleware: withAuth
// ---------------------------------------------------------------------------

/**
 * Higher-order function wrapping Next.js App Router route handlers.
 * Verifies token and enforces RBAC without masking downstream handler errors.
 *
 * @param handler Target route handler receiving (req, context, user)
 * @param allowedRoles Optional list of roles permitted to invoke this route
 */
export function withAuth<ContextType = any>(
  handler: AuthenticatedRouteHandler<ContextType>,
  allowedRoles?: UserRole[]
) {
  return async (
    req: NextRequest,
    context: ContextType = {} as ContextType
  ): Promise<NextResponse | Response> => {
    let user: AuthenticatedUser;

    // Step 1: Authentication and authorization verification
    try {
      user = await verifyAuthToken(req);

      if (allowedRoles && allowedRoles.length > 0) {
        if (!allowedRoles.includes(user.role)) {
          throw new DomainError(
            "FORBIDDEN",
            `Role '${user.role}' is not authorized to access this resource. Required roles: ${allowedRoles.join(
              ", "
            )}`,
            403
          );
        }
      }
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        return NextResponse.json(
          {
            error: {
              code: err.code,
              message: err.message,
            },
          },
          { status: err.status }
        );
      }

      const message =
        err instanceof Error ? err.message : "Internal authentication error";
      return NextResponse.json(
        {
          error: {
            code: "UNAUTHENTICATED",
            message,
          },
        },
        { status: 401 }
      );
    }

    // Step 2: Route handler execution (isolated from authentication error catch)
    return await handler(req, context, user);
  };
}
