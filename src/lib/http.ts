/**
 * Standard Web Request/Response types & helpers for middleware & API compatibility.
 * Replaces Next.js server dependencies in pure React / Vite architecture.
 */

export class NextResponse extends Response {
  static json(data: any, init?: ResponseInit): Response {
    const headers = new Headers(init?.headers);
    if (!headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }
    return new Response(JSON.stringify(data), {
      ...init,
      headers,
    });
  }

  static next(): Response {
    return new Response(null, { status: 200 });
  }
}

export class NextRequest extends Request {
  public cookies: {
    get: (name: string) => { value: string } | undefined;
    set: (name: string, value: string) => void;
  };
  public nextUrl: URL;

  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(input, init);
    const urlStr = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    this.nextUrl = new URL(urlStr);

    const cookieMap = new Map<string, string>();
    const cookieHeader = this.headers.get("cookie");
    if (cookieHeader) {
      cookieHeader.split(";").forEach((c) => {
        const [k, v] = c.trim().split("=");
        if (k && v) cookieMap.set(k, v);
      });
    }

    this.cookies = {
      get: (name: string) => {
        const val = cookieMap.get(name);
        return val ? { value: val } : undefined;
      },
      set: (name: string, value: string) => {
        cookieMap.set(name, value);
      },
    };
  }
}
