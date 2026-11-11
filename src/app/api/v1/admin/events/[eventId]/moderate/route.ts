import { NextRequest, NextResponse } from "next/server";
import { moderateEventListing, loadDb } from "@/lib/db";
import { handleApiError } from "@/lib/api-response";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await context.params;
    const db = loadDb();
    const adminUserId = req.headers.get("x-user-id") || "usr-admin-tariq";
    const body = await req.json();

    const result = moderateEventListing(db, adminUserId, {
      eventId,
      decision: body.decision,
      reason: body.reason,
    });

    return NextResponse.json({ data: result });
  } catch (err) {
    return handleApiError(err);
  }
}

