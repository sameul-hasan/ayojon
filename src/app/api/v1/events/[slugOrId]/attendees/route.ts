import { NextRequest, NextResponse } from "next/server";
import { getAuthorizedEventAttendees, loadDb } from "@/lib/db";
import { handleApiError } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slugOrId: string }> }
) {
  try {
    const { slugOrId } = await context.params;
    const db = loadDb();
    const actorUserId = req.headers.get("x-user-id") || "";
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format");

    const attendees = getAuthorizedEventAttendees(db, actorUserId, slugOrId, format === "csv");

    if (format === "csv") {
      const header = "Registration ID,Attendee Name,Email,Phone,Institute/Company,Status,Registered At\n";
      const rows = attendees
        .map(
          (a) =>
            `"${a.id}","${a.attendee_name}","${a.attendee_email}","${a.attendee_phone}","${a.institute_or_company}","${a.status}","${a.created_at}"`
        )
        .join("\n");
      return new NextResponse(header + rows, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="attendees-${slugOrId}.csv"`,
        },
      });
    }

    return NextResponse.json({ data: attendees, meta: { count: attendees.length } });
  } catch (err) {
    return handleApiError(err);
  }
}

