import { NextRequest, NextResponse } from "next/server";
import { DomainError, isUserOrgAuthorized, loadDb, recordAudit, saveDb } from "@/lib/db";
import { handleApiError } from "@/lib/api-response";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slugOrId: string }> }
) {
  try {
    const { slugOrId } = await context.params;
    const db = loadDb();
    const actorUserId = req.headers.get("x-user-id") || "usr-org-nusrat";
    const event = db.events.find((e) => e.id === slugOrId || e.slug === slugOrId);

    if (!event) throw new DomainError("NOT_FOUND", "Event not found", 404);
    if (
      !isUserOrgAuthorized(db, actorUserId, event.organization_id, [
        "OWNER",
        "EVENT_MANAGER",
      ])
    ) {
      throw new DomainError("FORBIDDEN", "Not authorized to cancel this event", 403);
    }

    event.status = "CANCELLED";
    event.updated_at = new Date().toISOString();
    for (const tkt of db.tickets) {
      if (tkt.event_id === event.id) {
        tkt.status = "CANCELLED";
      }
    }
    recordAudit(db, actorUserId, "EVENT_CANCELLED", "events", event.id, {});
    saveDb(db);

    return NextResponse.json({ data: event });
  } catch (err) {
    return handleApiError(err);
  }
}

