import { NextRequest, NextResponse } from "next/server";
import { registerFreeEvent, loadDb } from "@/lib/db";
import { handleApiError } from "@/lib/api-response";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slugOrId: string }> }
) {
  try {
    const { slugOrId } = await context.params;
    const db = loadDb();
    const body = await req.json();
    const result = registerFreeEvent(db, {
      eventId: slugOrId,
      ticketTypeId: body.ticketTypeId,
      userId: req.headers.get("x-user-id") || body.userId || null,
      attendeeName: body.attendeeName,
      attendeeEmail: body.attendeeEmail,
      attendeePhone: body.attendeePhone,
      instituteOrCompany: body.instituteOrCompany,
      marketingConsent: body.marketingConsent,
      campaignCode: body.campaignCode,
    });
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

