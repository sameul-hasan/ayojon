import { NextRequest, NextResponse } from "next/server";
import { publishEvent, loadDb } from "@/lib/db";
import { handleApiError } from "@/lib/api-response";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slugOrId: string }> }
) {
  try {
    const { slugOrId } = await context.params;
    const db = loadDb();
    const actorUserId = req.headers.get("x-user-id") || "usr-org-nusrat";
    const event = publishEvent(db, actorUserId, slugOrId);
    return NextResponse.json({ data: event });
  } catch (err) {
    return handleApiError(err);
  }
}

