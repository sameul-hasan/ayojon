import type { Plugin, ViteDevServer, PreviewServer } from "vite";
import type { IncomingMessage, ServerResponse } from "http";
import crypto from "crypto";
import {
  loadDb,
  saveDb,
  resetDbToSeed,
  validateTicketQr,
  createTicketOrder,
  recordAudit,
  createEventDraft,
  createPackageOrPromoOrder,
  publishEvent,
  registerFreeEvent,
  retryPendingNotifications,
  signWebhookPayload,
  processPaymentWebhook,
  getAuthorizedEventAttendees,
  DomainError,
} from "../lib/db";
import { canAccessResource } from "../lib/permissions/rbac";
import { formatBDT, hashToken } from "../lib/seed";
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
        "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Actor-User-Id,Idempotency-Key",
      });
      res.end(JSON.stringify(data));
    }

    if (method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Actor-User-Id,Idempotency-Key",
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
        const actorUserId = (req.headers["x-actor-user-id"] as string) || "usr-superadmin";

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

        // 3. GET & POST /api/v1/state (Master Database State & Domain Action Dispatcher)
        if (pathname === "/api/v1/state") {
          if (method === "GET") {
            return sendJson(200, db);
          }

          if (method === "POST") {
            const { action, actorUserId: reqActor, payload = {} } = JSON.parse(body || "{}");
            const effectiveActorId = reqActor || actorUserId;
            const actorProfile = db.profiles.find((p) => p.id === effectiveActorId);

            if (actorProfile && (actorProfile as any).status === "SUSPENDED" && action !== "RESET_SEED") {
              return sendJson(403, {
                error: {
                  code: "FORBIDDEN",
                  message: "Account suspended by Trust & Governance. Contact compliance@aayojon.com.bd",
                },
              });
            }

            switch (action) {
              case "RESET_SEED": {
                const fresh = resetDbToSeed();
                return sendJson(200, {
                  data: fresh,
                  message: "Database restored to initial Bangladesh pilot seed.",
                });
              }

              case "CREATE_EVENT_DRAFT": {
                const event = createEventDraft(db, effectiveActorId, payload);
                saveDb(db);
                return sendJson(200, { data: db, result: event });
              }

              case "PURCHASE_PACKAGE_AND_VERIFY": {
                const order = createPackageOrPromoOrder(db, effectiveActorId, {
                  eventId: payload.eventId,
                  packageCode: payload.packageCode,
                  idempotencyKey: payload.idempotencyKey || `idem-pkg-${Date.now()}`,
                });

                if (payload.browserRedirectOnly) {
                  saveDb(db);
                  return sendJson(200, {
                    data: db,
                    result: {
                      order,
                      webhookVerified: false,
                      message: "Browser redirected, but payment webhook NOT verified yet. Entitlement remains inactive.",
                    },
                  });
                }

                const rawWebhook = JSON.stringify({
                  webhookEventId: payload.webhookEventId || `wh-${crypto.randomUUID().slice(0, 8)}`,
                  providerReference: payload.providerReference || `BKASH-PKG-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
                  orderId: order.id,
                  status: payload.paymentStatus || "SUCCESS",
                  amountMinor: order.total_minor,
                });
                const sig = signWebhookPayload(rawWebhook);
                const webhookResult = processPaymentWebhook(db, {
                  provider: payload.provider || "BKASH_SANDBOX",
                  rawBody: rawWebhook,
                  signatureHeader: sig,
                });

                let publishedEvent = null;
                if (payload.autoPublish && webhookResult.order.status === "PAID" && payload.packageCode !== "FEATURED_ADDON") {
                  publishedEvent = publishEvent(db, effectiveActorId, payload.eventId);
                }

                saveDb(db);
                return sendJson(200, {
                  data: db,
                  result: { order: webhookResult.order, webhookResult, publishedEvent },
                });
              }

              case "PUBLISH_EVENT": {
                const event = publishEvent(db, effectiveActorId, payload.eventId);
                saveDb(db);
                return sendJson(200, { data: db, result: event });
              }

              case "REGISTER_FREE": {
                const regResult = registerFreeEvent(db, {
                  ...payload,
                  eventId: payload.eventId,
                  userId: effectiveActorId,
                  attendeeName: payload.attendeeName || "Attendee",
                  attendeeEmail: payload.attendeeEmail || "attendee@example.com",
                });
                saveDb(db);
                return sendJson(200, { data: db, result: regResult });
              }

              case "RETRY_NOTIFICATIONS": {
                const retried = retryPendingNotifications(db);
                saveDb(db);
                return sendJson(200, { data: db, result: { retried } });
              }

              case "UPDATE_USER_ROLE": {
                if (!actorProfile || (actorProfile.platform_role !== "ADMIN" && actorProfile.platform_role !== "SUPER_ADMIN")) {
                  recordAudit(
                    db,
                    effectiveActorId || "anonymous",
                    "UNAUTHORIZED_ROLE_ESCALATION_ATTEMPT",
                    "profiles",
                    payload.targetUserId || "self",
                    { requestedRole: payload.newRole }
                  );
                  saveDb(db);
                  return sendJson(403, {
                    error: {
                      code: "FORBIDDEN",
                      message: "Security Policy Violation: Only administrators can modify platform roles.",
                    },
                  });
                }
                const target = db.profiles.find((p) => p.id === payload.targetUserId);
                if (!target) {
                  return sendJson(404, { error: { code: "NOT_FOUND", message: "Target user not found" } });
                }
                target.platform_role = payload.newRole;
                recordAudit(db, effectiveActorId, "USER_ROLE_UPDATED", "profiles", target.id, {
                  newRole: payload.newRole,
                });
                saveDb(db);
                return sendJson(200, { data: db, result: target });
              }

              case "SUSPEND_USER": {
                if (!actorProfile || (actorProfile.platform_role !== "ADMIN" && actorProfile.platform_role !== "SUPER_ADMIN")) {
                  return sendJson(403, {
                    error: {
                      code: "FORBIDDEN",
                      message: "Security Policy Violation: Only administrators can suspend user accounts.",
                    },
                  });
                }
                const target = db.profiles.find((p) => p.id === payload.targetUserId);
                if (!target) {
                  return sendJson(404, { error: { code: "NOT_FOUND", message: "Target user not found" } });
                }
                (target as any).status = payload.status || "SUSPENDED";
                recordAudit(db, effectiveActorId, "USER_SUSPENDED", "profiles", target.id, {
                  reason: payload.reason || "Policy violation",
                });
                saveDb(db);
                return sendJson(200, { data: db, result: target });
              }

              case "CHECK_RESOURCE_ACCESS": {
                const check = canAccessResource(
                  effectiveActorId,
                  actorProfile?.platform_role || "ATTENDEE",
                  payload.resourceType,
                  payload.resourceId,
                  db
                );
                if (!check.allowed) {
                  return sendJson(check.code === "UNAUTHENTICATED" ? 401 : 403, {
                    error: { code: check.code, message: check.message || "Access denied" },
                  });
                }
                return sendJson(200, { data: db, result: { allowed: true } });
              }

              case "SUBMIT_VENUE_RFQ": {
                if (
                  !actorProfile ||
                  (actorProfile.platform_role !== "ORGANIZER_OWNER" &&
                    actorProfile.platform_role !== "EVENT_MANAGER" &&
                    actorProfile.platform_role !== "ADMIN" &&
                    actorProfile.platform_role !== "SUPER_ADMIN")
                ) {
                  return sendJson(403, {
                    error: {
                      code: "FORBIDDEN",
                      message: "Only event organizers can submit venue and service requirements.",
                    },
                  });
                }
                const rfq = {
                  ...payload,
                  id: payload.id || `rfq-${crypto.randomUUID().slice(0, 8)}`,
                  organizer_user_id: effectiveActorId,
                  status: "SUBMITTED",
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                };
                db.venue_requests = db.venue_requests || [];
                db.venue_requests.unshift(rfq);
                saveDb(db);
                return sendJson(200, { data: db, result: rfq });
              }

              case "SUBMIT_PROVIDER_QUOTATION": {
                if (
                  !actorProfile ||
                  (actorProfile.platform_role !== "VENUE_OWNER" &&
                    actorProfile.platform_role !== "VENDOR" &&
                    actorProfile.platform_role !== "ADMIN" &&
                    actorProfile.platform_role !== "SUPER_ADMIN")
                ) {
                  return sendJson(403, {
                    error: {
                      code: "FORBIDDEN",
                      message: "Only verified venue owners or vendors can submit formal quotations.",
                    },
                  });
                }
                const quote = {
                  ...payload,
                  id: payload.id || `qt-${crypto.randomUUID().slice(0, 8)}`,
                  provider_user_id: effectiveActorId,
                  status: "SUBMITTED",
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                };
                db.quotations = db.quotations || [];
                db.quotations.unshift(quote);
                saveDb(db);
                return sendJson(200, { data: db, result: quote });
              }

              default:
                return sendJson(400, {
                  error: { code: "VALIDATION_ERROR", message: `Unknown action: ${action}` },
                });
            }
          }
        }

        // 4. GET /api/v1/events
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

        // 5. GET /api/v1/events/:slugOrId/attendees (Attendee List & CSV Export)
        const attendeesMatch = pathname.match(/^\/api\/v1\/events\/([^/]+)\/attendees$/);
        if (attendeesMatch && method === "GET") {
          const slugOrId = attendeesMatch[1];
          const format = parsedUrl.searchParams.get("format");
          const event = db.events.find((e) => e.slug === slugOrId || e.id === slugOrId);
          if (!event) return sendJson(404, { error: "Event not found" });

          try {
            const attendees = getAuthorizedEventAttendees(db, actorUserId, event.id);
            if (format === "csv") {
              const csvRows = [
                "id,attendee_name,attendee_email,attendee_phone,ticket_type_id,status,created_at",
                ...attendees.map(
                  (a) =>
                    `"${a.id}","${a.attendee_name}","${a.attendee_email}","${a.attendee_phone || ""}","${a.ticket_type_id}","${a.status}","${a.created_at}"`
                ),
              ].join("\n");
              res.writeHead(200, {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="attendees-${event.slug}.csv"`,
              });
              return res.end(csvRows);
            }
            return sendJson(200, { attendees });
          } catch (err: any) {
            return sendJson(err.status || 403, { error: err.message });
          }
        }

        // 6. GET /api/v1/events/:slugOrId
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

        // 7. GET /api/v1/venues
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

        // 8. GET /api/v1/venues/:slug
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

        // 9. GET /api/v1/me/tickets
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

        // 10. POST /api/v1/tickets/validate (Gate Check-in QR Scanner)
        if (pathname === "/api/v1/tickets/validate" && method === "POST") {
          const { qrPayload, staffUserId, eventId } = JSON.parse(body || "{}");
          if (!qrPayload || !staffUserId || !eventId) {
            return sendJson(400, { error: "Missing required scan parameters" });
          }
          const result = validateTicketQr(db, staffUserId, { qrToken: qrPayload, eventId });
          saveDb(db);
          return sendJson(200, result);
        }

        // 11. POST /api/v1/orders (Ticket Order Creation)
        if (pathname === "/api/v1/orders" && method === "POST") {
          const payload = JSON.parse(body || "{}");
          const idempotencyKey = (req.headers["idempotency-key"] as string) || payload.idempotencyKey || `idem-${Date.now()}`;
          const order = createTicketOrder(db, {
            ...payload,
            buyerUserId: actorUserId,
            idempotencyKey,
          });
          saveDb(db);
          return sendJson(200, { order, data: order });
        }

        // 12. POST /api/v1/payments/sandbox-confirm (bKash/Nagad Sandbox Confirm)
        if (pathname === "/api/v1/payments/sandbox-confirm" && method === "POST") {
          const { orderId, provider = "BKASH_SANDBOX" } = JSON.parse(body || "{}");
          const order = db.orders.find((o) => o.id === orderId);
          if (!order) return sendJson(404, { error: "Order not found" });

          const rawWebhook = JSON.stringify({
            webhookEventId: `wh-sbx-${crypto.randomUUID().slice(0, 8)}`,
            providerReference: `${provider}-REF-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
            orderId: order.id,
            status: "SUCCESS",
            amountMinor: order.total_minor,
          });
          const sig = signWebhookPayload(rawWebhook);
          const webhookResult = processPaymentWebhook(db, {
            provider: provider as any,
            rawBody: rawWebhook,
            signatureHeader: sig,
          });
          saveDb(db);
          return sendJson(200, { success: true, result: webhookResult });
        }

        // 13. GET /api/v1/me/orders (Orders lookup)
        if (pathname === "/api/v1/me/orders" && method === "GET") {
          return sendJson(200, { data: db.orders, orders: db.orders });
        }

        // 14. POST /api/v1/events/:slugOrId/registrations (Free Community Registration)
        const eventRegMatch = pathname.match(/^\/api\/v1\/events\/([^/]+)\/registrations$/);
        if (eventRegMatch && method === "POST") {
          const slugOrId = decodeURIComponent(eventRegMatch[1]);
          const event = db.events.find((e) => e.slug === slugOrId || e.id === slugOrId);
          if (!event) return sendJson(404, { error: "Event not found" });
          const { ticketTypeId, attendeeName, attendeeEmail, attendeePhone } = JSON.parse(body || "{}");
          const tt = db.ticket_types.find((t) => t.id === ticketTypeId);
          if (!tt) return sendJson(404, { error: "Ticket type not found" });

          const regId = `reg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
          const tktId = `tkt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
          const rawSecret = `AAYOJON-TKT-${event.slug.toUpperCase()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

          const newReg = {
            id: regId,
            event_id: event.id,
            user_id: actorUserId,
            status: "CONFIRMED" as const,
            registered_at: new Date().toISOString(),
          };
          const newTkt = {
            id: tktId,
            event_id: event.id,
            registration_id: regId,
            ticket_type_id: tt.id,
            qr_token_hash: hashToken(rawSecret),
            qr_raw_secret: rawSecret,
            status: "ISSUED" as const,
            attendee_name: attendeeName || "Attendee",
            attendee_email: attendeeEmail || "attendee@ayojon.select",
            attendee_phone: attendeePhone || "+8801700000000",
            issued_at: new Date().toISOString(),
          };

          db.registrations.push(newReg as any);
          db.tickets.push(newTkt as any);
          tt.sold_count = (tt.sold_count || 0) + 1;
          saveDb(db);

          return sendJson(200, { success: true, data: { registration: newReg, ticket: newTkt } });
        }

        return sendJson(404, { error: "API endpoint not found" });
      } catch (err: any) {
        console.error("API error:", err);
        return sendJson(err.status || 500, { error: { message: err.message || "Internal server error" } });
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
