import { NextRequest, NextResponse } from "next/server";
import { validateTicketQr, loadDb } from "@/lib/db";
import { handleApiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const db = loadDb();
    const staffUserId = req.headers.get("x-user-id") || "usr-staff-mehedi";
    const body = await req.json();

    const result = validateTicketQr(db, staffUserId, {
      qrToken: body.qrToken,
      eventId: body.eventId,
    });

    return NextResponse.json({ data: result });
  } catch (err) {
    return handleApiError(err);
  }
}

