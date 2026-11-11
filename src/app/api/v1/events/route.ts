import { NextRequest, NextResponse } from "next/server";
import { createEventDraft, loadDb } from "@/lib/db";
import { handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const db = loadDb();
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const category = searchParams.get("category") || "";
  const city = searchParams.get("city") || "";
  const price = searchParams.get("price") || ""; // "free" | "paid"

  let events = db.events.filter((e) => e.status === "PUBLISHED" && e.visibility === "PUBLIC");

  if (q) {
    events = events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q))
    );
  }
  if (category) {
    const cat = db.categories.find((c) => c.id === category || c.slug === category);
    if (cat) {
      events = events.filter((e) => e.category_id === cat.id);
    }
  }
  if (city) {
    if (city.toLowerCase() === "online") {
      events = events.filter((e) => e.is_online);
    } else {
      events = events.filter((e) => {
        const ven = db.venues.find((v) => v.id === e.venue_id);
        return ven?.city.toLowerCase() === city.toLowerCase();
      });
    }
  }
  if (price === "free") {
    events = events.filter((e) => {
      const tts = db.ticket_types.filter((t) => t.event_id === e.id);
      return tts.some((t) => t.price_minor === 0);
    });
  } else if (price === "paid") {
    events = events.filter((e) => {
      const tts = db.ticket_types.filter((t) => t.event_id === e.id);
      return tts.every((t) => t.price_minor > 0);
    });
  }

  return NextResponse.json({
    data: events,
    meta: { count: events.length, currency: "BDT" },
  });
}

export async function POST(req: NextRequest) {
  try {
    const db = loadDb();
    const actorUserId = req.headers.get("x-user-id") || "usr-org-nusrat";
    const body = await req.json();
    const event = createEventDraft(db, actorUserId, body);
    return NextResponse.json({ data: event }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

