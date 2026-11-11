/**
 * Aayojon E2E Test Harness
 * 
 * Provides an opaque-box client simulator, auth/persona manager, in-memory route dispatcher,
 * database isolation controller, and assertion helpers for Tiers 1-4 requirement testing.
 */

import path from "path";
import fs from "fs";
import assert from "assert";
import { NextRequest, NextResponse } from "next/server";

// Register TypeScript and TSX compilation extensions for transparent resolution
try {
  const typescript = require("typescript");
  if (require.extensions) {
    if (!require.extensions[".tsx"]) {
      require.extensions[".tsx"] = function (module: any, filename: string) {
        const content = fs.readFileSync(filename, "utf8");
        const transpiled = typescript.transpileModule(content, {
          compilerOptions: {
            module: typescript.ModuleKind.CommonJS,
            jsx: typescript.JsxEmit.ReactJSX,
            target: typescript.ScriptTarget.ES2022,
          },
        });
        module._compile(transpiled.outputText, filename);
      };
    }
    if (!require.extensions[".ts"]) {
      require.extensions[".ts"] = function (module: any, filename: string) {
        const content = fs.readFileSync(filename, "utf8");
        const transpiled = typescript.transpileModule(content, {
          compilerOptions: {
            module: typescript.ModuleKind.CommonJS,
            target: typescript.ScriptTarget.ES2022,
          },
        });
        module._compile(transpiled.outputText, filename);
      };
    }
  }
} catch {
  // TypeScript already supported by runtime (e.g. tsx)
}

// Dynamic loader with tsconfig alias resolution
const jiti = require("jiti")(process.cwd(), {
  alias: { "@": path.join(process.cwd(), "src") },
});

const { loadDb, saveDb, setTestDatabaseOverride, resetDbToSeed, signWebhookPayload, WEBHOOK_SECRET } = jiti("./src/lib/db");
const { createInitialSeed, hashToken } = jiti("./src/lib/seed");

// Personas
export const PERSONAS = {
  attendee: {
    id: "usr-attendee-rafiq",
    name: "Rafiqul Islam",
    email: "rafiq@student.buet.ac.bd",
    role: "ATTENDEE",
  },
  organizer: {
    id: "usr-org-nusrat",
    name: "Nusrat Jahan",
    email: "nusrat@buetcs.org",
    role: "ORGANIZER_OWNER",
    organizationId: "org-buet-cc",
  },
  organizer2: {
    id: "usr-org-tanvir",
    name: "Tanvir Ahmed",
    email: "tanvir@nsu-yes.org",
    role: "ORGANIZER_OWNER",
    organizationId: "org-nsu-yes",
  },
  staff: {
    id: "usr-staff-mehedi",
    name: "Mehedi Hasan",
    email: "mehedi@staff.buetcs.org",
    role: "CHECKIN_STAFF",
    organizationId: "org-buet-cc",
  },
  sponsor: {
    id: "usr-sponsor-farhana",
    name: "Farhana Rahman",
    email: "farhana@pathao-ventures.bd",
    role: "SPONSOR",
  },
  admin: {
    id: "usr-admin-tariq",
    name: "Tariq Mahmud",
    email: "admin@aayojon.bd",
    role: "ADMIN",
  },
} as const;

export type PersonaKey = keyof typeof PERSONAS;

export interface TestResponse<T = any> {
  status: number;
  statusText: string;
  headers: Headers;
  body: T;
  data: any;
  error?: { code: string; message: string };
  rawText: string;
  ok: boolean;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  persona?: PersonaKey | string | null;
  idempotencyKey?: string;
  query?: Record<string, string | number | boolean>;
}

// Route handlers cache
const routes = {
  events: jiti("./src/app/api/v1/events/route.ts"),
  eventSlug: jiti("./src/app/api/v1/events/[slugOrId]/route.ts"),
  eventPublish: jiti("./src/app/api/v1/events/[slugOrId]/publish/route.ts"),
  eventCancel: jiti("./src/app/api/v1/events/[slugOrId]/cancel/route.ts"),
  eventRegistrations: jiti("./src/app/api/v1/events/[slugOrId]/registrations/route.ts"),
  eventAttendees: jiti("./src/app/api/v1/events/[slugOrId]/attendees/route.ts"),
  orders: jiti("./src/app/api/v1/orders/route.ts"),
  ticketValidate: jiti("./src/app/api/v1/tickets/validate/route.ts"),
  adminModerate: jiti("./src/app/api/v1/admin/events/[eventId]/moderate/route.ts"),
  meOrders: jiti("./src/app/api/v1/me/orders/route.ts"),
  meTickets: jiti("./src/app/api/v1/me/tickets/route.ts"),
  organizerAnalytics: jiti("./src/app/api/v1/organizer/events/[eventId]/analytics/route.ts"),
  webhooksPayments: jiti("./src/app/api/v1/webhooks/payments/[provider]/route.ts"),
  state: jiti("./src/app/api/v1/state/route.ts"),
};

export class TestHarness {
  private activeUserId: string | null = "usr-attendee-rafiq";
  private baseUrl: string | null = process.env.E2E_BASE_URL || null;

  constructor() {
    this.resetToSeed();
  }

  // Persona switching
  public asPersona(key: PersonaKey): this {
    this.activeUserId = PERSONAS[key]?.id || null;
    return this;
  }

  public asUser(userId: string | null): this {
    this.activeUserId = userId;
    return this;
  }

  public asAnonymous(): this {
    this.activeUserId = null;
    return this;
  }

  public getActiveUserId(): string | null {
    return this.activeUserId;
  }

  // Database seed isolation
  public resetToSeed(): void {
    const seed = createInitialSeed();
    setTestDatabaseOverride(seed);
  }

  public getDbState(): any {
    return loadDb();
  }

  // HTTP & In-Memory Dispatch
  public async request(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    urlPath: string,
    body?: any,
    options: RequestOptions = {}
  ): Promise<TestResponse> {
    const personaId = options.persona !== undefined
      ? (typeof options.persona === "string" && options.persona in PERSONAS
          ? (PERSONAS as any)[options.persona].id
          : options.persona)
      : this.activeUserId;

    const headers = new Headers(options.headers || {});
    if (body !== undefined && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    if (personaId) {
      headers.set("x-user-id", personaId);
      headers.set("Authorization", `Bearer mock-firebase-token:${personaId}:user:${personaId}@example.com`);
    }
    if (options.idempotencyKey !== undefined) {
      if (options.idempotencyKey) {
        headers.set("Idempotency-Key", options.idempotencyKey);
      }
    } else {
      headers.set("Idempotency-Key", `idem-harness-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    }

    // Build URL with query params
    let finalPath = urlPath;
    if (options.query) {
      const sp = new URLSearchParams();
      for (const [k, v] of Object.entries(options.query)) {
        sp.set(k, String(v));
      }
      finalPath += (finalPath.includes("?") ? "&" : "?") + sp.toString();
    }

    // Mode B: Live HTTP fetch
    if (this.baseUrl) {
      const fullUrl = this.baseUrl.replace(/\/$/, "") + finalPath;
      const resp = await fetch(fullUrl, {
        method,
        headers,
        body: body ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
      });
      const rawText = await resp.text();
      let parsedJson: any = null;
      try { parsedJson = JSON.parse(rawText); } catch {}
      return {
        status: resp.status,
        statusText: resp.statusText,
        headers: resp.headers,
        body: parsedJson !== null ? parsedJson : rawText,
        data: parsedJson?.data ?? parsedJson ?? rawText,
        error: parsedJson?.error,
        rawText,
        ok: resp.ok,
      };
    }

    // Mode A: In-Memory NextRequest Dispatch
    const fullUrl = "http://localhost:3000" + finalPath;
    const reqBody = (method === "GET" || method === "DELETE")
      ? undefined
      : (body !== undefined
          ? (typeof body === "string" ? body : JSON.stringify(body))
          : undefined);

    const req = new NextRequest(fullUrl, {
      method,
      headers,
      body: reqBody,
    });

    const routeMatch = this.matchRoute(urlPath);
    if (!routeMatch) {
      return {
        status: 404,
        statusText: "Not Found",
        headers: new Headers(),
        body: { error: { code: "NOT_FOUND", message: `No route matching ${urlPath}` } },
        data: null,
        error: { code: "NOT_FOUND", message: `No route matching ${urlPath}` },
        rawText: `{"error":{"code":"NOT_FOUND","message":"No route matching ${urlPath}"}}`,
        ok: false,
      };
    }

    const handler = (routeMatch.module as any)[method];
    if (!handler) {
      return {
        status: 405,
        statusText: "Method Not Allowed",
        headers: new Headers(),
        body: { error: { code: "METHOD_NOT_ALLOWED", message: `Method ${method} not allowed on ${urlPath}` } },
        data: null,
        error: { code: "METHOD_NOT_ALLOWED", message: `Method ${method} not allowed on ${urlPath}` },
        rawText: `{"error":{"code":"METHOD_NOT_ALLOWED"}}`,
        ok: false,
      };
    }

    const context = { params: Promise.resolve(routeMatch.params) };
    const res: NextResponse = await handler(req, context);

    let parsedBody: any = null;
    let rawText = "";
    try {
      rawText = await res.text();
      parsedBody = JSON.parse(rawText);
    } catch {
      parsedBody = rawText;
    }

    return {
      status: res.status,
      statusText: res.statusText || (res.status >= 200 && res.status < 300 ? "OK" : "Error"),
      headers: res.headers,
      body: parsedBody,
      data: parsedBody?.data ?? parsedBody,
      error: parsedBody?.error,
      rawText,
      ok: res.status >= 200 && res.status < 300,
    };
  }

  // Convenient HTTP helpers
  public get(path: string, options?: RequestOptions): Promise<TestResponse> {
    return this.request("GET", path, undefined, options);
  }
  public post(path: string, body?: any, options?: RequestOptions): Promise<TestResponse> {
    return this.request("POST", path, body, options);
  }
  public put(path: string, body?: any, options?: RequestOptions): Promise<TestResponse> {
    return this.request("PUT", path, body, options);
  }
  public patch(path: string, body?: any, options?: RequestOptions): Promise<TestResponse> {
    return this.request("PATCH", path, body, options);
  }
  public delete(path: string, options?: RequestOptions): Promise<TestResponse> {
    return this.request("DELETE", path, undefined, options);
  }

  // Webhook signer
  public signWebhook(payload: string): string {
    return signWebhookPayload(payload, WEBHOOK_SECRET);
  }

  // Route URL matcher
  private matchRoute(urlPath: string): { module: any; params: Record<string, string> } | null {
    const cleanPath = urlPath.split("?")[0].replace(/\/$/, "");

    // 1. Static routes
    if (cleanPath === "/api/v1/events") return { module: routes.events, params: {} };
    if (cleanPath === "/api/v1/orders") return { module: routes.orders, params: {} };
    if (cleanPath === "/api/v1/tickets/validate") return { module: routes.ticketValidate, params: {} };
    if (cleanPath === "/api/v1/me/orders") return { module: routes.meOrders, params: {} };
    if (cleanPath === "/api/v1/me/tickets") return { module: routes.meTickets, params: {} };
    if (cleanPath === "/api/v1/state") return { module: routes.state, params: {} };

    // 2. Parameterized routes
    let m = cleanPath.match(/^\/api\/v1\/events\/([^/]+)\/publish$/);
    if (m) return { module: routes.eventPublish, params: { slugOrId: m[1] } };

    m = cleanPath.match(/^\/api\/v1\/events\/([^/]+)\/cancel$/);
    if (m) return { module: routes.eventCancel, params: { slugOrId: m[1] } };

    m = cleanPath.match(/^\/api\/v1\/events\/([^/]+)\/registrations$/);
    if (m) return { module: routes.eventRegistrations, params: { slugOrId: m[1] } };

    m = cleanPath.match(/^\/api\/v1\/events\/([^/]+)\/attendees$/);
    if (m) return { module: routes.eventAttendees, params: { slugOrId: m[1] } };

    m = cleanPath.match(/^\/api\/v1\/events\/([^/]+)$/);
    if (m) return { module: routes.eventSlug, params: { slugOrId: m[1] } };

    m = cleanPath.match(/^\/api\/v1\/admin\/events\/([^/]+)\/moderate$/);
    if (m) return { module: routes.adminModerate, params: { eventId: m[1] } };

    m = cleanPath.match(/^\/api\/v1\/organizer\/events\/([^/]+)\/analytics$/);
    if (m) return { module: routes.organizerAnalytics, params: { eventId: m[1] } };

    m = cleanPath.match(/^\/api\/v1\/webhooks\/payments\/([^/]+)$/);
    if (m) return { module: routes.webhooksPayments, params: { provider: m[1] } };

    return null;
  }
}

// Opaque assertion helpers
export const expect = {
  status(res: TestResponse, expected: number, msg?: string) {
    assert.strictEqual(
      res.status,
      expected,
      msg || `Expected status ${expected}, got ${res.status}. Body: ${res.rawText}`
    );
  },
  ok(res: TestResponse, msg?: string) {
    assert.ok(
      res.ok,
      msg || `Expected 2xx status, got ${res.status}. Body: ${res.rawText}`
    );
  },
  error(res: TestResponse, expectedCode: string, expectedStatus = 400) {
    assert.strictEqual(
      res.status,
      expectedStatus,
      `Expected error status ${expectedStatus}, got ${res.status}. Body: ${res.rawText}`
    );
    assert.strictEqual(
      res.error?.code,
      expectedCode,
      `Expected error code ${expectedCode}, got ${res.error?.code}. Body: ${res.rawText}`
    );
  },
  forbidden(res: TestResponse, msg?: string) {
    assert.strictEqual(
      res.status,
      403,
      msg || `Expected 403 Forbidden, got ${res.status}. Body: ${res.rawText}`
    );
  },
  notFound(res: TestResponse, msg?: string) {
    assert.strictEqual(
      res.status,
      404,
      msg || `Expected 404 Not Found, got ${res.status}. Body: ${res.rawText}`
    );
  },
  validationError(res: TestResponse, msg?: string) {
    assert.strictEqual(
      res.status,
      400,
      msg || `Expected 400 Validation Error, got ${res.status}. Body: ${res.rawText}`
    );
    assert.strictEqual(
      res.error?.code,
      "VALIDATION_ERROR",
      `Expected error code VALIDATION_ERROR, got ${res.error?.code}`
    );
  },
  idempotent(res1: TestResponse, res2: TestResponse) {
    assert.strictEqual(res1.status, res2.status, "Idempotent calls must yield identical status codes");
    if (res1.data?.id && res2.data?.id) {
      assert.strictEqual(res1.data.id, res2.data.id, "Idempotent resource IDs must match");
    }
  },
  lightThemeTokens(fileOrCssContent: string) {
    const required = ["bg-slate-50", "bg-white", "border-slate-200", "text-slate-900"];
    for (const token of required) {
      assert.ok(
        fileOrCssContent.includes(token),
        `Light theme must include token '${token}'`
      );
    }
  },
  noDarkArtifacts(fileOrCssContent: string) {
    const forbidden = ["#070b12", "#0a0f1d", "bg-[#070b12]"];
    for (const artifact of forbidden) {
      assert.ok(
        !fileOrCssContent.includes(artifact),
        `Dark mode artifact '${artifact}' detected`
      );
    }
  },
};
