import { NextRequest, NextResponse } from "next/server";
import { loadDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const db = loadDb();
  const userId = req.headers.get("x-user-id") || "usr-attendee-rafiq";
  const orders = db.orders.filter((o) => o.buyer_user_id === userId);
  return NextResponse.json({ data: orders });
}

