import { NextRequest, NextResponse } from "next/server";
import { DomainError, isUserOrgAuthorized, loadDb, saveDb } from "@/lib/db";
import { handleApiError } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slugOrId: string }> }
) {
  try {
    const { slugOrId } = await context.params;
    const db = loadDb();
    const actorUserId = req.headers.get("x-user-id") || "";
    const event = db.events.find((e) => e.id === slugOrId || e.slug === slugOrId);

    if (!event) {
      throw new DomainError("NOT_FOUND", "Event not found", 404);
    }

    if (
      event.status !== "PUBLISHED" &&
      !isUserOrgAuthorized(db, actorUserId, event.organization_id, [
        "OWNER",
        "EVENT_MANAGER",
      ])
    ) {
      throw new DomainError("FORBIDDEN", "Draft or suspended event is not public", 403);
    }

    const ticketTypes = db.ticket_types.filter((t) => t.event_id === event.id);
    const venue = db.venues.find((v) => v.id === event.venue_id) || null;
    const organization = db.organizations.find((o) => o.id === event.organization_id);

    return NextResponse.json({
      data: {
        ...event,
        ticketTypes,
        venue,
        organization,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ slugOrId: string }> }
) {
  try {
    const { slugOrId } = await context.params;
    const db = loadDb();
    const actorUserId = req.headers.get("x-user-id") || "usr-org-nusrat";
    const event = db.events.find((e) => e.id === slugOrId || e.slug === slugOrId);

    if (!event) {
      throw new DomainError("NOT_FOUND", "Event not found", 404);
    }
    if (
      !isUserOrgAuthorized(db, actorUserId, event.organization_id, [
        "OWNER",
        "EVENT_MANAGER",
      ])
    ) {
      throw new DomainError("FORBIDDEN", "Not authorized to update this event", 403);
    }

    const body = await req.json();
    if (body.title) event.title = body.title.trim();
    if (body.description) event.description = body.description.trim();
    if (typeof body.capacity === "number" && body.capacity > 0) {
      event.capacity = body.capacity;
    }
    event.updated_at = new Date().toISOString();
    saveDb(db);

    return NextResponse.json({ data: event });
  } catch (err) {
    return handleApiError(err);
  }
}

