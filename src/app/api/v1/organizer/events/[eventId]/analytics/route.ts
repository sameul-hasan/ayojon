import { NextRequest, NextResponse } from "next/server";
import { DomainError, isUserOrgAuthorized, loadDb } from "@/lib/db";
import { handleApiError } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await context.params;
    const db = loadDb();
    const actorUserId = req.headers.get("x-user-id") || "usr-org-nusrat";
    const event = db.events.find((e) => e.id === eventId || e.slug === eventId);

    if (!event) throw new DomainError("NOT_FOUND", "Event not found", 404);
    if (
      !isUserOrgAuthorized(db, actorUserId, event.organization_id, [
        "OWNER",
        "EVENT_MANAGER",
      ])
    ) {
      throw new DomainError("FORBIDDEN", "Not authorized to view event analytics", 403);
    }

    const registrations = db.registrations.filter((r) => r.event_id === event.id);
    const tickets = db.tickets.filter((t) => t.event_id === event.id);
    const checkIns = db.check_ins.filter((c) => c.event_id === event.id);
    const paidOrders = db.orders.filter(
      (o) => o.event_id === event.id && o.order_type === "TICKET" && o.status === "PAID"
    );
    const revenueMinor = paidOrders.reduce((acc, o) => acc + o.subtotal_minor, 0);
    const campaigns = db.campaign_links.filter((c) => c.event_id === event.id);

    return NextResponse.json({
      data: {
        eventId: event.id,
        title: event.title,
        viewsCount: event.views_count,
        savesCount: event.saves_count,
        registrationsCount: registrations.length,
        ticketsIssuedCount: tickets.length,
        checkInsCount: checkIns.length,
        revenueMinor,
        currency: "BDT",
        campaigns,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

