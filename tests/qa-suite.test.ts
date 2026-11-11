import assert from "assert";
import { createInitialSeed } from "../src/lib/seed";
import {
  createEventDraft,
  createPackageOrPromoOrder,
  createTicketOrder,
  DomainError,
  getAuthorizedEventAttendees,
  moderateEventListing,
  processPaymentWebhook,
  publishEvent,
  registerFreeEvent,
  retryPendingNotifications,
  setTestDatabaseOverride,
  signWebhookPayload,
  validateAndStoreEventMedia,
  validateTicketQr,
  verifyOrganizationCustomDomain,
} from "../src/lib/db";

function freshDb() {
  const state = createInitialSeed();
  setTestDatabaseOverride(state);
  return state;
}

const results: Array<{ id: string; scenario: string; passed: boolean }> = [];

function runCase(id: string, scenario: string, fn: () => void) {
  try {
    fn();
    results.push({ id, scenario, passed: true });
    console.log(`✅ [${id}] PASS — ${scenario}`);
  } catch (err) {
    results.push({ id, scenario, passed: false });
    console.error(`❌ [${id}] FAIL — ${scenario}`, err);
    process.exitCode = 1;
  }
}

// QA-001: Create event draft without package payment -> Draft saved; not public
runCase("QA-001", "Create event draft without package payment -> Draft saved; not public", () => {
  const db = freshDb();
  const draft = createEventDraft(db, "usr-org-nusrat", {
    organizationId: "org-buet-cc",
    categoryId: "cat-tech",
    title: "BUET Robotics Workshop 2027",
    description: "Hands-on embedded systems workshop",
    startsAt: "2027-03-01T09:00:00Z",
    endsAt: "2027-03-01T15:00:00Z",
    capacity: 60,
  });
  assert.strictEqual(draft.status, "DRAFT");
  assert.strictEqual(draft.package_code, null);
  const publicEvents = db.events.filter((e) => e.status === "PUBLISHED");
  assert.strictEqual(publicEvents.some((e) => e.id === draft.id), false);
});

// QA-002: Purchase Basic package for ৳799 -> Verified payment activates package
runCase("QA-002", "Purchase Basic package for ৳799 -> Verified payment activates package", () => {
  const db = freshDb();
  const order = createPackageOrPromoOrder(db, "usr-org-nusrat", {
    eventId: "evt-draft-cyber-ctf",
    packageCode: "BASIC",
    idempotencyKey: "qa-002-idem",
  });
  assert.strictEqual(order.total_minor, 79900); // ৳799 in paisa
  assert.strictEqual(order.status, "PENDING");

  const rawBody = JSON.stringify({
    webhookEventId: "wh-qa-002",
    providerReference: "BKASH-QA-002",
    orderId: order.id,
    status: "SUCCESS",
    amountMinor: 79900,
  });
  const res = processPaymentWebhook(db, {
    provider: "BKASH_SANDBOX",
    rawBody,
    signatureHeader: signWebhookPayload(rawBody),
  });
  assert.strictEqual(res.order.status, "PAID");
  assert.strictEqual(res.activatedPackage, "BASIC");
  const activePurchase = db.package_purchases.find(
    (pp) => pp.event_id === "evt-draft-cyber-ctf" && pp.status === "ACTIVE"
  );
  assert.ok(activePurchase);
});

// QA-003: Webhook delivered twice -> One payment transition and one entitlement
runCase("QA-003", "Webhook delivered twice -> One payment transition and one entitlement", () => {
  const db = freshDb();
  const order = createPackageOrPromoOrder(db, "usr-org-nusrat", {
    eventId: "evt-draft-cyber-ctf",
    packageCode: "PROMOTED",
    idempotencyKey: "qa-003-idem",
  });
  const rawBody = JSON.stringify({
    webhookEventId: "wh-qa-003-dup",
    providerReference: "SSLCZ-QA-003",
    orderId: order.id,
    status: "SUCCESS",
    amountMinor: 149900,
  });
  const sig = signWebhookPayload(rawBody);

  const first = processPaymentWebhook(db, {
    provider: "SSLCOMMERZ_SANDBOX",
    rawBody,
    signatureHeader: sig,
  });
  const second = processPaymentWebhook(db, {
    provider: "SSLCOMMERZ_SANDBOX",
    rawBody,
    signatureHeader: sig,
  });

  assert.strictEqual(first.alreadyProcessed, false);
  assert.strictEqual(second.alreadyProcessed, true);

  const purchases = db.package_purchases.filter((pp) => pp.order_id === order.id);
  const entitlements = db.subscriptions_or_entitlements.filter((e) => e.event_id === "evt-draft-cyber-ctf");
  assert.strictEqual(purchases.length, 1);
  assert.strictEqual(entitlements.length, 1);
});

// QA-004: Publish with failed/unverified payment -> Publication blocked
runCase("QA-004", "Publish with failed/unverified payment -> Publication blocked", () => {
  const db = freshDb();
  let blockedError: DomainError | null = null;
  try {
    publishEvent(db, "usr-org-nusrat", "evt-draft-cyber-ctf");
  } catch (err) {
    blockedError = err as DomainError;
  }
  assert.ok(blockedError);
  assert.strictEqual(blockedError?.code, "FORBIDDEN");
  assert.strictEqual(db.events.find((e) => e.id === "evt-draft-cyber-ctf")?.status, "DRAFT");
});

// QA-005: Two users request final ticket concurrently -> Only available inventory is sold
runCase("QA-005", "Two users request final ticket concurrently -> Only available inventory is sold", () => {
  const db = freshDb();
  const tt = db.ticket_types.find((t) => t.id === "tt-ai-student")!;
  tt.sold_count = tt.capacity - 1; // Only 1 ticket left

  const order1 = createTicketOrder(db, {
    eventId: "evt-dhaka-ai-summit",
    buyerUserId: "usr-attendee-rafiq",
    items: [{ ticketTypeId: tt.id, quantity: 1 }],
    attendee: { name: "User One", email: "user1@buet.ac.bd" },
    idempotencyKey: "qa-005-user1",
  });
  assert.ok(order1.id);

  let secondErr: DomainError | null = null;
  try {
    createTicketOrder(db, {
      eventId: "evt-dhaka-ai-summit",
      buyerUserId: "usr-attendee-rafiq",
      items: [{ ticketTypeId: tt.id, quantity: 1 }],
      attendee: { name: "User Two", email: "user2@buet.ac.bd" },
      idempotencyKey: "qa-005-user2",
    });
  } catch (err) {
    secondErr = err as DomainError;
  }
  assert.ok(secondErr);
  assert.strictEqual(secondErr?.code, "CONFLICT");
  assert.strictEqual(tt.sold_count, tt.capacity);
});

// QA-006: Free registration at full capacity -> Registration rejected or waitlist offered
runCase("QA-006", "Free registration at full capacity -> Registration rejected", () => {
  const db = freshDb();
  const freeTt = db.ticket_types.find((t) => t.id === "tt-design-free")!;
  freeTt.sold_count = freeTt.capacity; // 80/80 full

  let rejectedErr: DomainError | null = null;
  try {
    registerFreeEvent(db, {
      eventId: "evt-product-design-workshop",
      ticketTypeId: freeTt.id,
      attendeeName: "Late Attendee",
      attendeeEmail: "late@dhaka.bd",
    });
  } catch (err) {
    rejectedErr = err as DomainError;
  }
  assert.ok(rejectedErr);
  assert.strictEqual(rejectedErr?.code, "CONFLICT");
});

// QA-007: Paid ticket payment success -> Unique ticket issued once
runCase("QA-007", "Paid ticket payment success -> Unique ticket issued once", () => {
  const db = freshDb();
  const order = createTicketOrder(db, {
    eventId: "evt-dhaka-ai-summit",
    buyerUserId: "usr-attendee-rafiq",
    items: [{ ticketTypeId: "tt-ai-pro", quantity: 1 }],
    attendee: { name: "Nadia Karim", email: "nadia@bracu.ac.bd" },
    idempotencyKey: "qa-007-order",
  });

  const rawBody = JSON.stringify({
    webhookEventId: "wh-qa-007",
    providerReference: "NAGAD-QA-007",
    orderId: order.id,
    status: "SUCCESS",
    amountMinor: order.total_minor,
  });
  const res = processPaymentWebhook(db, {
    provider: "NAGAD_SANDBOX",
    rawBody,
    signatureHeader: signWebhookPayload(rawBody),
  });

  assert.strictEqual(res.issuedTickets.length, 1);
  assert.strictEqual(res.issuedTickets[0].status, "VALID");
  assert.ok(res.issuedTickets[0].token_hash.length === 64);
});

// QA-008: Payment success browser redirect but no verified webhook -> No ticket until server verifies payment
runCase("QA-008", "Payment success browser redirect but no verified webhook -> No ticket issued", () => {
  const db = freshDb();
  const initialTicketCount = db.tickets.length;
  const order = createTicketOrder(db, {
    eventId: "evt-dhaka-ai-summit",
    buyerUserId: "usr-attendee-rafiq",
    items: [{ ticketTypeId: "tt-ai-student", quantity: 1 }],
    attendee: { name: "Redirect User", email: "redirect@du.ac.bd" },
    idempotencyKey: "qa-008-order",
  });

  // Order exists in PENDING state, browser redirected, no webhook called yet
  assert.strictEqual(order.status, "PENDING");
  assert.strictEqual(db.tickets.length, initialTicketCount);
});

// QA-009: Scan valid ticket twice -> First accepted; second flagged already used
runCase("QA-009", "Scan valid ticket twice -> First accepted; second flagged ALREADY_USED", () => {
  const db = freshDb();
  const validTicket = db.tickets.find((t) => t.id === "tkt-1")!;
  assert.strictEqual(validTicket.status, "VALID");

  const firstScan = validateTicketQr(db, "usr-staff-mehedi", {
    qrToken: validTicket.qr_token,
    eventId: validTicket.event_id,
  });
  assert.strictEqual(firstScan.result, "VALID");

  const secondScan = validateTicketQr(db, "usr-staff-mehedi", {
    qrToken: validTicket.qr_token,
    eventId: validTicket.event_id,
  });
  assert.strictEqual(secondScan.result, "ALREADY_USED");
  assert.ok(secondScan.previousCheckIn?.checkedInAt);
});

// QA-010: Organizer A requests Organizer B attendee data -> 403/denied; no data leakage
runCase("QA-010", "Organizer A requests Organizer B attendee data -> 403 FORBIDDEN; no data leakage", () => {
  const db = freshDb();
  // Nusrat (BUET CC) requests attendees for NSU Startup Pitch (owned by Tanvir / NSU YES!)
  let accessError: DomainError | null = null;
  try {
    getAuthorizedEventAttendees(db, "usr-org-nusrat", "evt-nsu-startup-pitch");
  } catch (err) {
    accessError = err as DomainError;
  }
  assert.ok(accessError);
  assert.strictEqual(accessError?.code, "FORBIDDEN");
  assert.strictEqual(accessError?.status, 403);
});

// QA-011: Upload executable/oversized image -> Rejected safely
runCase("QA-011", "Upload executable or oversized (>5MB) file -> Rejected safely", () => {
  const db = freshDb();
  let execErr: DomainError | null = null;
  try {
    validateAndStoreEventMedia(db, "usr-org-nusrat", {
      eventId: "evt-dhaka-ai-summit",
      filename: "payload.exe",
      mimeType: "application/x-msdownload",
      sizeBytes: 12000,
    });
  } catch (err) {
    execErr = err as DomainError;
  }
  assert.ok(execErr);
  assert.strictEqual(execErr?.code, "VALIDATION_ERROR");

  let sizeErr: DomainError | null = null;
  try {
    validateAndStoreEventMedia(db, "usr-org-nusrat", {
      eventId: "evt-dhaka-ai-summit",
      filename: "huge-poster.png",
      mimeType: "image/png",
      sizeBytes: 8 * 1024 * 1024, // 8 MB > 5 MB
    });
  } catch (err) {
    sizeErr = err as DomainError;
  }
  assert.ok(sizeErr);
  assert.strictEqual(sizeErr?.code, "VALIDATION_ERROR");
});

// QA-012: Admin suspends reported event -> Event hidden and audit record created
runCase("QA-012", "Admin suspends reported event -> Event hidden and audit record created", () => {
  const db = freshDb();
  const { event, auditLog } = moderateEventListing(db, "usr-admin-tariq", {
    eventId: "evt-nsu-startup-pitch",
    decision: "SUSPEND",
    reason: "Pending venue safety permit verification",
  });
  assert.strictEqual(event.status, "SUSPENDED");
  assert.strictEqual(auditLog.action, "ADMIN_MODERATE_SUSPEND");
  assert.strictEqual(auditLog.actor_id, "usr-admin-tariq");
  const publicVisible = db.events.filter((e) => e.status === "PUBLISHED");
  assert.strictEqual(publicVisible.some((e) => e.id === "evt-nsu-startup-pitch"), false);
});

// QA-013: Custom domain DNS incorrect -> Domain remains pending/error; default URL works
runCase("QA-013", "Custom domain DNS incorrect -> Domain status ERROR; default URL remains active", () => {
  const db = freshDb();
  const res = verifyOrganizationCustomDomain(db, "usr-org-tanvir", {
    organizationId: "org-nsu-yes",
    customDomain: "summit.nsu-yes.org",
    simulatedDnsCnameRecord: "wrong-target.example.com",
  });
  assert.strictEqual(res.dnsValid, false);
  assert.strictEqual(res.organization.custom_domain_status, "ERROR");
  assert.strictEqual(res.defaultPlatformUrl, "https://aayojon.bd/org/nsu-yes-society");
});

// QA-014: Email provider temporarily unavailable -> Job retries; no duplicate confirmation
runCase("QA-014", "Email provider temporarily unavailable -> Job retries without duplicate confirmation", () => {
  const db = freshDb();
  const { registration } = registerFreeEvent(db, {
    eventId: "evt-online-nextjs-clinic",
    attendeeName: "Retry Test User",
    attendeeEmail: "retry@sylhet.bd",
    simulateEmailProviderDown: true,
  });

  const jobBefore = db.notifications.find((n) => n.idempotency_key === `notif-reg-${registration.id}`)!;
  assert.strictEqual(jobBefore.status, "RETRYING");

  const retriedIds = retryPendingNotifications(db);
  assert.ok(retriedIds.includes(jobBefore.id));
  assert.strictEqual(jobBefore.status, "SENT");

  const matchingJobs = db.notifications.filter((n) => n.destination === "retry@sylhet.bd");
  assert.strictEqual(matchingJobs.length, 1);
});

console.log(`\nSummary: ${results.filter((r) => r.passed).length}/${results.length} QA test cases passed.`);
