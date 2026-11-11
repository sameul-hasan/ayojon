import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  createEventDraft,
  createPackageOrPromoOrder,
  createTicketOrder,
  getAuthorizedEventAttendees,
  loadDb,
  moderateEventListing,
  processPaymentWebhook,
  publishEvent,
  registerFreeEvent,
  resetDbToSeed,
  retryPendingNotifications,
  saveDb,
  signWebhookPayload,
  validateAndStoreEventMedia,
  validateTicketQr,
  verifyOrganizationCustomDomain,
} from "@/lib/db";
import { handleApiError } from "@/lib/api-response";

export async function GET() {
  const db = loadDb();
  return NextResponse.json({ data: db });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, actorUserId, payload } = body;
    const db = loadDb();

    switch (action) {
      case "RESET_SEED": {
        const fresh = resetDbToSeed();
        return NextResponse.json({ data: fresh, message: "Database restored to initial Bangladesh pilot seed." });
      }

      case "CREATE_EVENT_DRAFT": {
        const event = createEventDraft(db, actorUserId, payload);
        return NextResponse.json({ data: db, result: event });
      }

      case "PURCHASE_PACKAGE_AND_VERIFY": {
        const order = createPackageOrPromoOrder(db, actorUserId, {
          eventId: payload.eventId,
          packageCode: payload.packageCode,
          idempotencyKey: payload.idempotencyKey || `idem-pkg-${Date.now()}`,
        });

        // If browserRedirectOnly is true (QA-008), do NOT run webhook verification
        if (payload.browserRedirectOnly) {
          return NextResponse.json({
            data: db,
            result: {
              order,
              webhookVerified: false,
              message: "Browser redirected, but payment webhook NOT verified yet. Entitlement remains inactive.",
            },
          });
        }

        const rawWebhook = JSON.stringify({
          webhookEventId: payload.webhookEventId || `wh-${crypto.randomUUID().slice(0, 8)}`,
          providerReference: payload.providerReference || `BKASH-PKG-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
          orderId: order.id,
          status: payload.paymentStatus || "SUCCESS",
          amountMinor: order.total_minor,
        });
        const sig = signWebhookPayload(rawWebhook);
        const webhookResult = processPaymentWebhook(db, {
          provider: payload.provider || "BKASH_SANDBOX",
          rawBody: rawWebhook,
          signatureHeader: sig,
        });

        let publishedEvent = null;
        if (payload.autoPublish && webhookResult.order.status === "PAID" && payload.packageCode !== "FEATURED_ADDON") {
          publishedEvent = publishEvent(db, actorUserId, payload.eventId);
        }

        return NextResponse.json({
          data: db,
          result: { order: webhookResult.order, webhookResult, publishedEvent },
        });
      }

      case "PUBLISH_EVENT": {
        const event = publishEvent(db, actorUserId, payload.eventId);
        return NextResponse.json({ data: db, result: event });
      }

      case "REGISTER_FREE": {
        const regResult = registerFreeEvent(db, {
          ...payload,
          userId: actorUserId,
        });
        return NextResponse.json({ data: db, result: regResult });
      }

      case "BUY_TICKET": {
        const order = createTicketOrder(db, {
          eventId: payload.eventId,
          buyerUserId: actorUserId,
          items: payload.items,
          attendee: payload.attendee,
          campaignCode: payload.campaignCode,
          idempotencyKey: payload.idempotencyKey || `idem-tkt-${Date.now()}`,
        });

        if (payload.browserRedirectOnly) {
          return NextResponse.json({
            data: db,
            result: {
              order,
              issuedTickets: [],
              webhookVerified: false,
              message: "Order created & browser redirected, awaiting verified server webhook before issuing QR ticket.",
            },
          });
        }

        const rawWebhook = JSON.stringify({
          webhookEventId: payload.webhookEventId || `wh-${crypto.randomUUID().slice(0, 8)}`,
          providerReference: payload.providerReference || `SSLCZ-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
          orderId: order.id,
          status: "SUCCESS",
          amountMinor: order.total_minor,
        });
        const sig = signWebhookPayload(rawWebhook);
        const webhookResult = processPaymentWebhook(db, {
          provider: payload.provider || "SSLCOMMERZ_SANDBOX",
          rawBody: rawWebhook,
          signatureHeader: sig,
        });

        return NextResponse.json({ data: db, result: webhookResult });
      }

      case "VERIFY_PENDING_ORDER_WEBHOOK": {
        const order = db.orders.find((o) => o.id === payload.orderId);
        if (!order) throw new Error("Order not found");
        const rawWebhook = JSON.stringify({
          webhookEventId: payload.webhookEventId || `wh-${crypto.randomUUID().slice(0, 8)}`,
          providerReference: payload.providerReference || `VERIFIED-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
          orderId: order.id,
          status: "SUCCESS",
          amountMinor: order.total_minor,
        });
        const sig = signWebhookPayload(rawWebhook);
        const webhookResult = processPaymentWebhook(db, {
          provider: payload.provider || "SSLCOMMERZ_SANDBOX",
          rawBody: rawWebhook,
          signatureHeader: sig,
        });
        return NextResponse.json({ data: db, result: webhookResult });
      }

      case "SCAN_TICKET_QR": {
        const scanResult = validateTicketQr(db, actorUserId, {
          qrToken: payload.qrToken,
          eventId: payload.eventId,
        });
        return NextResponse.json({ data: db, result: scanResult });
      }

      case "CREATE_CAMPAIGN_LINK": {
        const code = (payload.code || `CMP-${crypto.randomUUID().slice(0, 5)}`).toUpperCase().replace(/[^A-Z0-9-_]/g, "");
        const link = {
          id: `cmp-${crypto.randomUUID().slice(0, 8)}`,
          event_id: payload.eventId,
          code,
          source: payload.source || "facebook",
          medium: payload.medium || "social",
          campaign: payload.campaign || "campus_promo",
          clicks: 1,
          conversions: 0,
          revenue_minor: 0,
          created_by: actorUserId,
          created_at: new Date().toISOString(),
        };
        db.campaign_links.unshift(link);
        saveDb(db);
        return NextResponse.json({ data: db, result: link });
      }

      case "MODERATE_EVENT": {
        const modResult = moderateEventListing(db, actorUserId, {
          eventId: payload.eventId,
          decision: payload.decision,
          reason: payload.reason,
        });
        return NextResponse.json({ data: db, result: modResult });
      }

      case "VERIFY_CUSTOM_DOMAIN": {
        const domResult = verifyOrganizationCustomDomain(db, actorUserId, {
          organizationId: payload.organizationId,
          customDomain: payload.customDomain,
          simulatedDnsCnameRecord: payload.simulatedDnsCnameRecord,
        });
        return NextResponse.json({ data: db, result: domResult });
      }

      case "UPLOAD_MEDIA_CHECK": {
        const media = validateAndStoreEventMedia(db, actorUserId, payload);
        return NextResponse.json({ data: db, result: media });
      }

      case "CHECK_ATTENDEE_ACCESS": {
        const attendees = getAuthorizedEventAttendees(db, actorUserId, payload.eventId, false);
        return NextResponse.json({ data: db, result: { count: attendees.length, attendees } });
      }

      case "SUBMIT_SPONSOR_INQUIRY": {
        const inquiry = {
          id: `spn-${crypto.randomUUID().slice(0, 8)}`,
          sponsor_user_id: actorUserId,
          sponsor_name: payload.sponsorName,
          company_name: payload.companyName,
          contact_email: payload.contactEmail,
          event_id: payload.eventId,
          budget_minor: Math.round(Number(payload.budgetBDT || 50000) * 100),
          placement_tier: payload.placementTier || "GOLD_BOOTH",
          message: payload.message,
          status: "PENDING" as const,
          created_at: new Date().toISOString(),
        };
        db.sponsor_inquiries.unshift(inquiry);
        saveDb(db);
        return NextResponse.json({ data: db, result: inquiry });
      }

      case "FILE_ABUSE_REPORT": {
        const rep = {
          id: `rep-${crypto.randomUUID().slice(0, 8)}`,
          reporter_id: actorUserId,
          reporter_email: payload.reporterEmail || "attendee@aayojon.bd",
          event_id: payload.eventId,
          reason: payload.reason,
          details: payload.details || "",
          status: "OPEN" as const,
          created_at: new Date().toISOString(),
        };
        db.reports.unshift(rep);
        saveDb(db);
        return NextResponse.json({ data: db, result: rep });
      }

      case "RETRY_NOTIFICATIONS": {
        const retried = retryPendingNotifications(db);
        return NextResponse.json({ data: db, result: { retried } });
      }

      default:
        return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: `Unknown action: ${action}` } }, { status: 400 });
    }
  } catch (err) {
    return handleApiError(err);
  }
}

