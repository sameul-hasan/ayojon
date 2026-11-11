import { NextRequest, NextResponse } from "next/server";
import { loadDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const db = loadDb();
  const userId = req.headers.get("x-user-id") || "usr-attendee-rafiq";
  const user = db.profiles.find((p) => p.id === userId);
  const tickets = db.tickets.filter(
    (t) =>
      (user && t.attendee_email.toLowerCase() === user.email.toLowerCase()) ||
      db.registrations.some((r) => r.id === t.registration_id && r.user_id === userId)
  );
  return NextResponse.json({ data: tickets });
}

