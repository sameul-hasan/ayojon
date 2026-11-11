import { NextRequest, NextResponse } from "next/server";
import { loadDb, processPaymentWebhook, signWebhookPayload } from "@/lib/db";
import { handleApiError } from "@/lib/api-response";
import { PaymentProvider } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { orderId, provider = "BKASH_SANDBOX" } = await req.json();
    if (!orderId) {
      return NextResponse.json({ error: { message: "orderId is required" } }, { status: 400 });
    }
    const db = loadDb();
    const order = db.orders.find((o) => o.id === orderId);
    if (!order) {
      return NextResponse.json({ error: { message: "Order not found" } }, { status: 404 });
    }
    if (order.status !== "PENDING") {
      return NextResponse.json({ data: { order, message: `Order is already in status: ${order.status}` } });
    }

    const rawBody = JSON.stringify({
      webhookEventId: `wh-sandbox-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      providerReference: `${provider}-REF-${Date.now()}`,
      orderId: order.id,
      status: "SUCCESS",
      amountMinor: order.total_minor,
    });

    const signature = signWebhookPayload(rawBody);

    const result = processPaymentWebhook(db, {
      provider: provider as PaymentProvider,
      rawBody,
      signatureHeader: signature,
    });

    return NextResponse.json({ data: result });
  } catch (err) {
    return handleApiError(err);
  }
}

