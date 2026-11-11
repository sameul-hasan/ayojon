import type { Plugin, ViteDevServer, PreviewServer } from "vite";
import type { IncomingMessage, ServerResponse } from "http";
import { loadDb, saveDb, validateTicketQr, createTicketOrder, recordAudit } from "../lib/db";
import { formatBDT } from "../lib/seed";
import type { DatabaseState, RoleDefinition } from "../lib/types";

function createApiMiddleware() {
  return (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = req.url || "";
    if (!url.startsWith("/api/v1/")) {
      return next();
    }

    const parsedUrl = new URL(url, "http://localhost:3000");
    const pathname = parsedUrl.pathname;
    const method = req.method?.toUpperCase() || "GET";

    function sendJson(status: number, data: any) {
      res.writeHead(status, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Actor-User-Id",
      });
      res.end(JSON.stringify(data));
    }

    if (method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Actor-User-Id",
      });
      return res.end();
    }

    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        const db = loadDb();
        const actorUserId = (req.headers["x-actor-user-id"] as string) || "usr-attendee-rafiq";

        // 1. GET /api/v1/roles — Dynamic Database RBAC Roles
        if (pathname === "/api/v1/roles" && method === "GET") {
          return sendJson(200, {
            success: true,
            roles: db.roles || [],
            total: db.roles?.length || 0,
          });
        }

        // 2. POST /api/v1/admin/roles — Update Database Role Permissions
        if (pathname === "/api/v1/admin/roles" && method === "POST") {
          const payload = JSON.parse(body || "{}");
          const { roleCode, permissions, name, description } = payload;
          if (!roleCode || !permissions) {
            return sendJson(400, { success: false, error: "Missing roleCode or permissions" });
          }

          const role = db.roles.find((r) => r.code.toUpperCase() === roleCode.toUpperCase());
          if (!role) {
            return sendJson(404, { success: false, error: `Role ${roleCode} not found` });
          }

          role.permissions = permissions;
          if (name) role.name = name;
          if (description) role.description = description;
          role.updated_at = new Date().toISOString();

          saveDb(db);
          recordAudit(
            db,
            actorUserId,
            "ROLE_PERMISSIONS_UPDATED",
            "ROLE",
            role.id,
            { roleCode, permissionsCount: permissions.length }
          );

          return sendJson(200, {
            success: true,
            role,
            message: `Permissions updated for ${role.name}`,
          });
        }

        // 3. GET /api/v1/events
        if (pathname === "/api/v1/events" && method === "GET") {
          const category = parsedUrl.searchParams.get("category");
          const search = parsedUrl.searchParams.get("search")?.toLowerCase();

          let events = db.events.filter((e) => e.status === "PUBLISHED" && e.visibility === "PUBLIC");
          if (category && category !== "all") {
            events = events.filter((e) => e.category_id === category);
          }
          if (search) {
            events = events.filter(
              (e) =>
                e.title.toLowerCase().includes(search) ||
                e.tagline.toLowerCase().includes(search) ||
                e.tags.some((t) => t.toLowerCase().includes(search))
            );
          }

          return sendJson(200, {
            events: events.map((e) => {
              const org = db.organizations.find((o) => o.id === e.organization_id);
              const venue = db.venues.find((v) => v.id === e.venue_id);
              const ticketTypes = db.ticket_types.filter((t) => t.event_id === e.id);
              const minPrice = ticketTypes.length > 0 ? Math.min(...ticketTypes.map((t) => t.price_minor / 100)) : 0;
              return {
                ...e,
                organization: org,
                venue,
                ticket_types: ticketTypes,
                formatted_price: formatBDT(minPrice),
              };
            }),
          });
        }

        // 4. GET /api/v1/events/:slugOrId
        const eventSlugMatch = pathname.match(/^\/api\/v1\/events\/([^/]+)$/);
        if (eventSlugMatch && method === "GET") {
          const slugOrId = eventSlugMatch[1];
          const event = db.events.find((e) => e.slug === slugOrId || e.id === slugOrId);
          if (!event) {
            return sendJson(404, { error: "Event not found" });
          }
          const org = db.organizations.find((o) => o.id === event.organization_id);
          const venue = db.venues.find((v) => v.id === event.venue_id);
          const ticketTypes = db.ticket_types.filter((t) => t.event_id === event.id);
          const media = db.event_media.filter((m) => m.event_id === event.id);

          return sendJson(200, {
            event: {
              ...event,
              organization: org,
              venue,
              ticket_types: ticketTypes,
              media,
            },
          });
        }

        // 5. GET /api/v1/venues
        if (pathname === "/api/v1/venues" && method === "GET") {
          const profiles = db.venue_profiles.map((vp) => {
            const venue = db.venues.find((v) => v.id === vp.id || v.name === vp.name);
            return {
              ...vp,
              venue,
            };
          });
          return sendJson(200, { venues: profiles });
        }

        // 6. GET /api/v1/venues/:slug
        const venueSlugMatch = pathname.match(/^\/api\/v1\/venues\/([^/]+)$/);
        if (venueSlugMatch && method === "GET") {
          const slug = venueSlugMatch[1];
          const vp = db.venue_profiles.find((p) => p.slug === slug || p.id === slug);
          if (!vp) {
            return sendJson(404, { error: "Venue not found" });
          }
          const venue = db.venues.find((v) => v.id === vp.id || v.name === vp.name);
          return sendJson(200, { venue: { ...vp, venue } });
        }

        // 7. GET /api/v1/me/tickets
        if (pathname === "/api/v1/me/tickets" && method === "GET") {
          const actor = db.profiles.find((p) => p.id === actorUserId);
          const userTickets = db.tickets.filter((t) => {
            const reg = db.registrations.find((r) => r.id === t.registration_id);
            return (reg && reg.user_id === actorUserId) || (actor && t.attendee_email === actor.email);
          });
          const enriched = userTickets.map((t) => {
            const event = db.events.find((e) => e.id === t.event_id);
            const venue = event ? db.venues.find((v) => v.id === event.venue_id) : null;
            const tt = db.ticket_types.find((item) => item.id === t.ticket_type_id);
            return {
              ...t,
              event,
              venue,
              ticket_type: tt,
            };
          });
          return sendJson(200, { tickets: enriched });
        }

        // 8. POST /api/v1/tickets/validate (Gate Check-in QR Scanner)
        if (pathname === "/api/v1/tickets/validate" && method === "POST") {
          const { qrPayload, staffUserId, eventId } = JSON.parse(body || "{}");
          if (!qrPayload || !staffUserId || !eventId) {
            return sendJson(400, { error: "Missing required scan parameters" });
          }
          const result = validateTicketQr(db, staffUserId, { qrToken: qrPayload, eventId });
          return sendJson(200, result);
        }

        // 9. GET /api/v1/state (For state synchronization & portal dashboards)
        if (pathname === "/api/v1/state" && method === "GET") {
          return sendJson(200, db);
        }

        return sendJson(404, { error: "API endpoint not found" });
      } catch (err: any) {
        console.error("API error:", err);
        return sendJson(500, { error: err.message || "Internal server error" });
      }
    });
  };
}

export function aayojonApiPlugin(): Plugin {
  return {
    name: "aayojon-api-middleware",
    configureServer(server: ViteDevServer) {
      server.middlewares.use(createApiMiddleware());
    },
    configurePreviewServer(server: PreviewServer) {
      server.middlewares.use(createApiMiddleware());
    },
  };
}
