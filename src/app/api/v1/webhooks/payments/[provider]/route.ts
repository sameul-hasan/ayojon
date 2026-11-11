import { NextRequest, NextResponse } from "next/server";
import { processPaymentWebhook, loadDb } from "@/lib/db";
import { PaymentProvider } from "@/lib/types";
import { handleApiError } from "@/lib/api-response";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await context.params;
    const rawBody = await req.text();
    const signatureHeader = req.headers.get("x-webhook-signature");
    const db = loadDb();

    const result = processPaymentWebhook(db, {
      provider: (provider.toUpperCase() as PaymentProvider) || "SSLCOMMERZ_SANDBOX",
      rawBody,
      signatureHeader,
    });

    return NextResponse.json({ data: result });
  } catch (err) {
    return handleApiError(err);
  }
}

