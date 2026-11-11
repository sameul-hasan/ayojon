import { NextRequest, NextResponse } from "next/server";
import { createPackageOrPromoOrder, createTicketOrder, loadDb } from "@/lib/db";
import { handleApiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const db = loadDb();
    const idempotencyKey =
      req.headers.get("Idempotency-Key") ||
      req.headers.get("idempotency-key") ||
      "";
    const actorUserId = req.headers.get("x-user-id") || "usr-attendee-rafiq";
    const body = await req.json();

    if (body.packageCode) {
      const order = createPackageOrPromoOrder(db, actorUserId, {
        eventId: body.eventId,
        packageCode: body.packageCode,
        idempotencyKey: idempotencyKey || body.idempotencyKey || `idem-${Date.now()}`,
      });
      return NextResponse.json({ data: order }, { status: 201 });
    }

    const order = createTicketOrder(db, {
      eventId: body.eventId,
      buyerUserId: actorUserId,
      items: body.items,
      attendee: body.attendee,
      campaignCode: body.campaignCode,
      idempotencyKey: idempotencyKey || body.idempotencyKey,
    });

    return NextResponse.json({ data: order }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

