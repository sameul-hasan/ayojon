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
  recordAudit,
  registerFreeEvent,
  resetDbToSeed,
  retryPendingNotifications,
  saveDb,
  signWebhookPayload,
  validateAndStoreEventMedia,
  validateTicketQr,
  verifyOrganizationCustomDomain,
  DomainError,
} from "@/lib/db";
import { handleApiError } from "@/lib/api-response";
import { canAccessResource } from "@/lib/permissions/rbac";

export async function GET() {
  const db = loadDb();
  return NextResponse.json({ data: db });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, actorUserId, payload } = body;
    const db = loadDb();

    // Security Check: Resolve actor profile and verify account status
    const actorProfile = db.profiles.find((p) => p.id === actorUserId);
    if (
      actorProfile &&
      (actorProfile as any).status === "SUSPENDED" &&
      action !== "RESET_SEED"
    ) {
      throw new DomainError(
        "FORBIDDEN",
        "Account suspended by Trust & Governance. Contact compliance@aayojon.com.bd",
        403
      );
    }

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

      case "UPDATE_USER_ROLE": {
        // Enforce: Only Admin can change roles. Prevent self-escalation!
        if (!actorProfile || actorProfile.platform_role !== "ADMIN") {
          recordAudit(
            db,
            actorUserId || "anonymous",
            "UNAUTHORIZED_ROLE_ESCALATION_ATTEMPT",
            "profiles",
            payload.targetUserId || "self",
            {
              requestedRole: payload.newRole,
            }
          );
          saveDb(db);
          throw new DomainError(
            "FORBIDDEN",
            "Security Policy Violation: Only administrators can modify platform roles.",
            403
          );
        }
        const target = db.profiles.find((p) => p.id === payload.targetUserId);
        if (!target) throw new DomainError("NOT_FOUND", "Target user profile not found", 404);
        target.platform_role = payload.newRole;
        recordAudit(db, actorUserId, "USER_ROLE_UPDATED", "profiles", target.id, {
          newRole: payload.newRole,
        });
        saveDb(db);
        return NextResponse.json({ data: db, result: target });
      }

      case "SUSPEND_USER": {
        // Enforce: Only Admin can suspend users
        if (!actorProfile || actorProfile.platform_role !== "ADMIN") {
          throw new DomainError(
            "FORBIDDEN",
            "Security Policy Violation: Only administrators can suspend user accounts.",
            403
          );
        }
        const target = db.profiles.find((p) => p.id === payload.targetUserId);
        if (!target) throw new DomainError("NOT_FOUND", "Target user not found", 404);
        (target as any).status = payload.status || "SUSPENDED";
        recordAudit(db, actorUserId, "USER_SUSPENDED", "profiles", target.id, {
          reason: payload.reason || "Policy violation",
        });
        saveDb(db);
        return NextResponse.json({ data: db, result: target });
      }

      case "CHECK_RESOURCE_ACCESS": {
        const check = canAccessResource(
          actorUserId,
          actorProfile?.platform_role || "ATTENDEE",
          payload.resourceType,
          payload.resourceId,
          db
        );
        if (!check.allowed) {
          throw new DomainError(
            check.code as any,
            check.message || "Access denied",
            check.code === "UNAUTHENTICATED" ? 401 : 403
          );
        }
        return NextResponse.json({ data: db, result: { allowed: true } });
      }

      case "SUBMIT_VENUE_RFQ": {
        if (
          !actorProfile ||
          (actorProfile.platform_role !== "ORGANIZER_OWNER" &&
            actorProfile.platform_role !== "EVENT_MANAGER" &&
            actorProfile.platform_role !== "ADMIN")
        ) {
          throw new DomainError(
            "FORBIDDEN",
            "Only event organizers can submit venue and service requirements.",
            403
          );
        }
        const rfq = {
          ...payload,
          id: payload.id || `rfq-${crypto.randomUUID().slice(0, 8)}`,
          organizer_user_id: actorUserId,
          status: "SUBMITTED",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        db.venue_requests = db.venue_requests || [];
        db.venue_requests.unshift(rfq);
        saveDb(db);
        return NextResponse.json({ data: db, result: rfq });
      }

      case "SUBMIT_PROVIDER_QUOTATION": {
        if (
          !actorProfile ||
          (actorProfile.platform_role !== "VENUE_OWNER" &&
            actorProfile.platform_role !== "VENDOR" &&
            actorProfile.platform_role !== "ADMIN")
        ) {
          throw new DomainError(
            "FORBIDDEN",
            "Only verified venue owners or vendors can submit formal quotations.",
            403
          );
        }
        const quote = {
          ...payload,
          id: payload.id || `qt-${crypto.randomUUID().slice(0, 8)}`,
          provider_user_id: actorUserId,
          status: "SUBMITTED",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        db.quotations = db.quotations || [];
        db.quotations.unshift(quote);
        saveDb(db);
        return NextResponse.json({ data: db, result: quote });
      }

      default:
        return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: `Unknown action: ${action}` } }, { status: 400 });
    }
  } catch (err) {
    return handleApiError(err);
  }
}

