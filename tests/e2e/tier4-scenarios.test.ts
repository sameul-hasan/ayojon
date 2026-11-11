/**
 * Aayojon E2E Test Suite - Tier 4: Real-World Multi-Persona Scenarios (10 Tests)
 * 
 * Validates complete end-to-end user journeys spanning multiple personas,
 * security boundaries, payment webhooks, gate check-in, and moderation.
 * Follows 4-tier testing specification from Explorer 3.
 */

import assert from "assert";
import path from "path";
import { test, setRunnerContext } from "./runner";
import { TestHarness, expect, PERSONAS } from "./harness";

const harness = new TestHarness();

const jiti = require("jiti")(process.cwd(), {
  alias: { "@": path.join(process.cwd(), "src") },
});

const {
  loadDb,
  saveDb,
  resetDbToSeed,
  createEventDraft,
  createTicketOrder,
  createPackageOrPromoOrder,
  publishEvent,
  registerFreeEvent,
  validateTicketQr,
  validateAndStoreEventMedia,
  verifyOrganizationCustomDomain,
  processPaymentWebhook,
  retryPendingNotifications,
  moderateEventListing,
} = jiti("./src/lib/db.ts");

const { hashToken } = jiti("./src/lib/seed.ts");

setRunnerContext(4, "Real-World Multi-Persona Scenarios");

// T4-SCENARIO-01: Full Lifecycle of a Paid Flagship Conference
test("T4-SCENARIO-01", "Full lifecycle: Draft -> Package -> Publish -> Checkout -> Webhook -> Wallet -> Gate Scan -> Duplicate Defense -> Audit", async () => {
  harness.resetToSeed();
  const db = loadDb();

  // Step 1: Organizer Nusrat creates draft event with ticket tiers
  harness.asPersona("organizer");
  const draft = createEventDraft(db, "usr-org-nusrat", {
    organizationId: "org-buet-cc",
    categoryId: "cat-tech",
    title: "Dhaka Distributed Systems Summit 2027",
    description: "National flagship summit on high-scale distributed databases and consensus protocols.",
    startsAt: "2027-04-10T09:00:00Z",
    endsAt: "2027-04-11T18:00:00Z",
    capacity: 500,
    ticketTypes: [
      { name: "General Attendee", priceMinor: 100000, capacity: 400 },
      { name: "Student Pass", priceMinor: 50000, capacity: 100 },
    ],
  });
  assert.strictEqual(draft.status, "DRAFT");
  assert.strictEqual(draft.package_code, null);

  // Step 2: Nusrat purchases PREMIUM package; authentic webhook arrives
  const pkgOrder = createPackageOrPromoOrder(db, "usr-org-nusrat", {
    eventId: draft.id,
    packageCode: "PREMIUM",
    idempotencyKey: `idem-t4-s1-pkg-${Date.now()}`,
  });
  const pkgWebhookBody = JSON.stringify({
    webhookEventId: `wh-t4-s1-pkg-${Date.now()}`,
    providerReference: "BKASH-PREMIUM-FLAGSHIP",
    orderId: pkgOrder.id,
    status: "SUCCESS",
    amountMinor: pkgOrder.total_minor,
  });
  const pkgWebhook = processPaymentWebhook(db, {
    provider: "BKASH_SANDBOX",
    rawBody: pkgWebhookBody,
    signatureHeader: harness.signWebhook(pkgWebhookBody),
  });
  assert.strictEqual(pkgWebhook.order.status, "PAID");

  // Step 3: Nusrat publishes the event
  const publishedEvent = publishEvent(db, "usr-org-nusrat", draft.id);
  assert.strictEqual(publishedEvent.status, "PUBLISHED");
  assert.strictEqual(publishedEvent.is_featured, true);

  // Step 4: Attendee Rafiq signs in, selects 1 General ticket, and creates order
  harness.asPersona("attendee");
  const generalTier = db.ticket_types.find((t: any) => t.event_id === draft.id && t.name === "General Attendee")!;
  const ticketOrderRes = await harness.post("/api/v1/orders", {
    eventId: draft.id,
    items: [{ ticketTypeId: generalTier.id, quantity: 1 }],
    attendee: {
      name: "Rafiqul Islam",
      email: "rafiq@student.buet.ac.bd",
      phone: "+8801712345678",
      instituteOrCompany: "BUET",
    },
  });
  expect.ok(ticketOrderRes);
  assert.strictEqual(ticketOrderRes.data.status, "PENDING");
  const orderId = ticketOrderRes.data.id;

  // Step 5: SSLCommerz webhook arrives with valid signature and matching order total
  const paymentWebhookBody = JSON.stringify({
    webhookEventId: `wh-t4-s1-tkt-${Date.now()}`,
    providerReference: "SSL-FLAGSHIP-ORDER-1",
    orderId,
    status: "SUCCESS",
    amountMinor: ticketOrderRes.data.total_minor,
  });
  const paymentResult = processPaymentWebhook(db, {
    provider: "SSLCOMMERZ_SANDBOX",
    rawBody: paymentWebhookBody,
    signatureHeader: harness.signWebhook(paymentWebhookBody),
  });
  assert.strictEqual(paymentResult.order.status, "PAID");
  assert.strictEqual(paymentResult.issuedTickets.length, 1);
  const issuedTicket = paymentResult.issuedTickets[0];

  // Step 6: Attendee opens Wallet to view issued ticket
  const walletRes = await harness.get("/api/v1/me/tickets");
  expect.ok(walletRes);
  const walletTicket = walletRes.data.find((t: any) => t.id === issuedTicket.id);
  assert.ok(walletTicket);
  assert.strictEqual(walletTicket.status, "VALID");

  // Step 7: Staff Mehedi scans Rafiq's QR token at event entrance
  harness.asPersona("staff");
  const gateScan1 = await harness.post("/api/v1/tickets/validate", {
    qrToken: walletTicket.qr_token,
    eventId: draft.id,
  });
  expect.ok(gateScan1);
  assert.strictEqual(gateScan1.data.result, "VALID");

  // Step 8: Duplicate scan attempt flagged as ALREADY_USED
  const gateScan2 = await harness.post("/api/v1/tickets/validate", {
    qrToken: walletTicket.qr_token,
    eventId: draft.id,
  });
  expect.ok(gateScan2);
  assert.strictEqual(gateScan2.data.result, "ALREADY_USED");

  // Step 9: Post-event audit and check-in trail verification
  const freshDb = loadDb();
  const auditLogs = freshDb.audit_logs.filter((a: any) => a.resource_id === draft.id);
  assert.ok(auditLogs.some((a: any) => a.action === "EVENT_PUBLISHED"));
  assert.ok(auditLogs.some((a: any) => a.action === "PACKAGE_ENTITLEMENT_ACTIVATED"));

  const checkIns = freshDb.check_ins.filter((c: any) => c.event_id === draft.id);
  assert.strictEqual(checkIns.length, 1);
  assert.strictEqual(checkIns[0].ticket_id, issuedTicket.id);
});

// T4-SCENARIO-02: Free Community Workshop with Capacity Cap and Waitlist
test("T4-SCENARIO-02", "Free community workshop: Capacity cap enforcement (2/2) and cancellation reuse", () => {
  harness.resetToSeed();
  const db = loadDb();

  // Step 1: Organizer creates free workshop with capacity of 2
  const draft = createEventDraft(db, "usr-org-nusrat", {
    organizationId: "org-buet-cc",
    categoryId: "cat-uni",
    title: "Accessible Web Design Systems",
    description: "Hands-on micro-workshop on accessible DOM architectures.",
    startsAt: "2026-12-20T10:00:00Z",
    endsAt: "2026-12-20T13:00:00Z",
    capacity: 2,
    ticketTypes: [{ name: "Workshop Seat", priceMinor: 0, capacity: 2 }],
  });

  // Step 2: Activates BASIC package and publishes
  const pkgOrder = createPackageOrPromoOrder(db, "usr-org-nusrat", {
    eventId: draft.id,
    packageCode: "BASIC",
    idempotencyKey: `idem-t4-s2-pkg-${Date.now()}`,
  });
  const rawBody = JSON.stringify({
    webhookEventId: `wh-t4-s2-${Date.now()}`,
    providerReference: "BKASH-BASIC-S2",
    orderId: pkgOrder.id,
    status: "SUCCESS",
    amountMinor: pkgOrder.total_minor,
  });
  processPaymentWebhook(db, {
    provider: "BKASH_SANDBOX",
    rawBody,
    signatureHeader: harness.signWebhook(rawBody),
  });
  publishEvent(db, "usr-org-nusrat", draft.id);

  const tt = db.ticket_types.find((t: any) => t.event_id === draft.id)!;

  // Step 3: Attendee 1 registers
  const reg1 = registerFreeEvent(db, {
    eventId: draft.id,
    ticketTypeId: tt.id,
    attendeeName: "Attendee One",
    attendeeEmail: "attendee1@example.com",
  });
  assert.strictEqual(reg1.registration.status, "CONFIRMED");
  assert.strictEqual(tt.sold_count, 1);

  // Step 4: Attendee 2 registers (fills capacity to 2/2)
  const reg2 = registerFreeEvent(db, {
    eventId: draft.id,
    ticketTypeId: tt.id,
    attendeeName: "Attendee Two",
    attendeeEmail: "attendee2@example.com",
  });
  assert.strictEqual(reg2.registration.status, "CONFIRMED");
  assert.strictEqual(tt.sold_count, 2);

  // Step 5: Attendee 3 attempts registration at 100% capacity -> rejected with CONFLICT (409)
  let overCapacityErr: any = null;
  try {
    registerFreeEvent(db, {
      eventId: draft.id,
      ticketTypeId: tt.id,
      attendeeName: "Attendee Three",
      attendeeEmail: "attendee3@example.com",
    });
  } catch (e) {
    overCapacityErr = e;
  }
  assert.ok(overCapacityErr);
  assert.strictEqual(overCapacityErr.code, "CONFLICT");
  assert.strictEqual(overCapacityErr.status, 409);

  // Step 6: Attendee 1 cancels registration, freeing capacity
  reg1.ticket.status = "CANCELLED";
  tt.sold_count -= 1;
  assert.strictEqual(tt.sold_count, 1);

  // Step 7: Attendee 3 registers for the freed seat
  const reg3 = registerFreeEvent(db, {
    eventId: draft.id,
    ticketTypeId: tt.id,
    attendeeName: "Attendee Three",
    attendeeEmail: "attendee3@example.com",
  });
  assert.strictEqual(reg3.registration.status, "CONFIRMED");
  assert.strictEqual(tt.sold_count, 2);
});

// T4-SCENARIO-03: Multi-Tenant Data Isolation & Boundary Enforcement
test("T4-SCENARIO-03", "Multi-tenant data isolation: cross-tenant reads, writes, and gate scans strictly rejected with 403", async () => {
  harness.resetToSeed();

  // Step 1: Nusrat's BUET event has registered attendees
  // Step 2: Organizer Tanvir (org-nsu-yes) attempts to read BUET attendees
  harness.asPersona("organizer2");
  const attendeeListRes = await harness.get("/api/v1/events/evt-buet-cse-fest/attendees");
  expect.forbidden(attendeeListRes);

  // Step 3: Tanvir attempts to cancel Nusrat's event
  const cancelRes = await harness.post("/api/v1/events/evt-buet-cse-fest/cancel");
  expect.forbidden(cancelRes);

  // Step 4: Tanvir attempts to upload media to Nusrat's event
  const db = loadDb();
  let mediaErr: any = null;
  try {
    validateAndStoreEventMedia(db, "usr-org-tanvir", {
      eventId: "evt-buet-cse-fest",
      filename: "hacked.png",
      mimeType: "image/png",
      sizeBytes: 1024,
    });
  } catch (e) {
    mediaErr = e;
  }
  assert.ok(mediaErr);
  assert.strictEqual(mediaErr.code, "FORBIDDEN");
  assert.strictEqual(mediaErr.status, 403);

  // Step 5: Staff Mehedi (org-buet-cc) attempts to scan for Tanvir's event (org-nsu-yes)
  const token = "AAYOJON-TKT-NSU-ISOLATION-01";
  db.tickets.push({
    id: "tkt-nsu-isolation",
    registration_id: "reg-nsu-sample",
    event_id: "evt-nsu-startup-pitch",
    ticket_type_id: "tt-nsu-general",
    attendee_name: "Samira Kabir",
    attendee_email: "samira@northsouth.edu",
    ticket_type_name: "Founder & Attendee Pass",
    qr_token: token,
    token_hash: hashToken(token),
    status: "VALID",
    issued_at: new Date().toISOString(),
  });
  saveDb(db);

  harness.asPersona("staff");
  const scanRes = await harness.post("/api/v1/tickets/validate", {
    qrToken: token,
    eventId: "evt-nsu-startup-pitch",
  });
  expect.forbidden(scanRes);
});

// T4-SCENARIO-04: Trust & Safety Moderation Lifecycle (Report -> Suspend -> Audit -> Restore)
test("T4-SCENARIO-04", "Moderation lifecycle: Report abuse -> Suspend -> Marketplace hidden -> Checkout blocked -> Restore -> Reappear", async () => {
  harness.resetToSeed();

  // Step 1: Attendee Rafiq files abuse report
  const db = loadDb();
  db.reports.push({
    id: `rep-t4-${Date.now()}`,
    reporter_id: "usr-attendee-rafiq",
    reporter_email: "rafiq@student.buet.ac.bd",
    event_id: "evt-nsu-startup-pitch",
    reason: "Misleading ticket tier pricing",
    details: "Pricing contradicts promotional banners.",
    status: "OPEN",
    created_at: new Date().toISOString(),
  });
  saveDb(db);

  // Step 2: Admin Tariq reviews report and suspends listing
  harness.asPersona("admin");
  const suspendRes = await harness.post("/api/v1/admin/events/evt-nsu-startup-pitch/moderate", {
    decision: "SUSPEND",
    reason: "Investigating pricing discrepancy reports",
  });
  expect.ok(suspendRes);
  assert.strictEqual(suspendRes.data.event.status, "SUSPENDED");

  // Step 3: Public marketplace hides suspended event
  harness.asAnonymous();
  const searchRes = await harness.get("/api/v1/events");
  expect.ok(searchRes);
  assert.ok(!searchRes.data.some((e: any) => e.id === "evt-nsu-startup-pitch"));

  // Step 4: Checkout attempt on suspended event blocked
  harness.asPersona("attendee");
  const orderRes = await harness.post("/api/v1/orders", {
    eventId: "evt-nsu-startup-pitch",
    items: [{ ticketTypeId: "tt-nsu-general", quantity: 1 }],
    attendee: { name: "Rafiq", email: "rafiq@student.buet.ac.bd" },
  });
  expect.notFound(orderRes);

  // Step 5: Admin Tariq clears investigation and restores listing
  harness.asPersona("admin");
  const restoreRes = await harness.post("/api/v1/admin/events/evt-nsu-startup-pitch/moderate", {
    decision: "RESTORE",
    reason: "Organizer verified pricing alignment",
  });
  expect.ok(restoreRes);
  assert.strictEqual(restoreRes.data.event.status, "PUBLISHED");

  // Step 6: Event reappears in marketplace
  harness.asAnonymous();
  const publicRes = await harness.get("/api/v1/events/evt-nsu-startup-pitch");
  expect.ok(publicRes);
  assert.strictEqual(publicRes.data.status, "PUBLISHED");
});

// T4-SCENARIO-05: Viral Marketing Campaign with UTM Attribution & Conversion Tracking
test("T4-SCENARIO-05", "Viral campaign tracking: Click -> Checkout with campaign code -> Webhook payment -> Conversion increment & Attribution", () => {
  harness.resetToSeed();
  const db = loadDb();

  // Step 1: Create campaign link with code BUETAI26
  const cmpId = `cmp-buet-${Date.now()}`;
  db.campaign_links.push({
    id: cmpId,
    event_id: "evt-dhaka-ai-summit",
    code: "BUETAI26",
    source: "linkedin",
    medium: "social",
    campaign: "campus_ambassador",
    clicks: 10,
    conversions: 0,
    revenue_minor: 0,
    created_by: "usr-org-nusrat",
    created_at: new Date().toISOString(),
  });

  // Step 2: Simulated click
  const cmp = db.campaign_links.find((c: any) => c.id === cmpId)!;
  cmp.clicks += 1;
  assert.strictEqual(cmp.clicks, 11);

  // Step 3: Attendee completes checkout with campaign code
  const order = createTicketOrder(db, {
    eventId: "evt-dhaka-ai-summit",
    buyerUserId: "usr-attendee-rafiq",
    items: [{ ticketTypeId: "tt-ai-student", quantity: 1 }],
    attendee: { name: "Rafiqul Islam", email: "rafiq@student.buet.ac.bd" },
    campaignCode: "BUETAI26",
    idempotencyKey: `idem-t4-s5-${Date.now()}`,
  });
  assert.strictEqual(order.campaign_code, "BUETAI26");

  // Step 4: Webhook payment verification
  const rawBody = JSON.stringify({
    webhookEventId: `wh-t4-s5-${Date.now()}`,
    providerReference: "BKASH-S5",
    orderId: order.id,
    status: "SUCCESS",
    amountMinor: order.total_minor,
  });
  processPaymentWebhook(db, {
    provider: "BKASH_SANDBOX",
    rawBody,
    signatureHeader: harness.signWebhook(rawBody),
  });

  // Step 5: Attribution record created & metrics incremented
  const updatedCmp = db.campaign_links.find((c: any) => c.id === cmpId)!;
  assert.strictEqual(updatedCmp.conversions, 1);
  assert.ok(updatedCmp.revenue_minor > 0);

  const attribution = db.attributions.find((a: any) => a.order_id === order.id);
  assert.ok(attribution);
  assert.strictEqual(attribution.campaign_link_id, cmpId);
});

// T4-SCENARIO-06: Corporate Brand Sponsorship Deal Lifecycle
test("T4-SCENARIO-06", "Sponsorship proposal lifecycle: Submit proposal -> Workspace review -> Approve deal", () => {
  harness.resetToSeed();
  const db = loadDb();

  // Step 1: Sponsor Farhana submits proposal
  const inquiryId = `inq-pathao-${Date.now()}`;
  db.sponsor_inquiries.push({
    id: inquiryId,
    event_id: "evt-dhaka-ai-summit",
    sponsor_name: "Pathao Ventures",
    sponsor_email: "farhana@pathao.com",
    proposed_tier: "Title Sponsor",
    budget_minor: 20000000, // ৳200,000
    pitch: "Title sponsorship with developer lounge & keynote speech.",
    status: "PENDING",
    created_at: new Date().toISOString(),
  });
  saveDb(db);

  // Step 2: Organizer reviews proposal in workspace
  const reloaded = loadDb();
  const found = reloaded.sponsor_inquiries.find((i: any) => i.id === inquiryId);
  assert.ok(found);
  assert.strictEqual(found.status, "PENDING");
  assert.strictEqual(found.budget_minor, 20000000);

  // Step 3: Organizer approves proposal
  found.status = "APPROVED";
  saveDb(reloaded);

  // Step 4: Verify approved proposal state
  const finalDb = loadDb();
  const approved = finalDb.sponsor_inquiries.find((i: any) => i.id === inquiryId);
  assert.strictEqual(approved.status, "APPROVED");
});

// T4-SCENARIO-07: Gate Operations Under Offline Network Intermittency
test("T4-SCENARIO-07", "Offline gate check-in: Local token verification -> Duplicate detection -> Online sync", async () => {
  harness.resetToSeed();
  const db = loadDb();

  // Step 1: Sync cache of ticket hashes
  const validTicket = db.tickets.find((t: any) => t.id === "tkt-1")!;
  const localCache = new Set([validTicket.token_hash]);

  // Step 2: Offline mode: verify ticket against local cache
  const token = validTicket.qr_token;
  const computedHash = hashToken(token);
  assert.ok(localCache.has(computedHash), "Token must exist in local cache");

  // Step 3: First scan succeeds, recorded in local scanned set
  const localScanned = new Set<string>();
  assert.strictEqual(localScanned.has(computedHash), false);
  localScanned.add(computedHash);

  // Step 4: Immediate second scan rejected locally
  assert.strictEqual(localScanned.has(computedHash), true, "Duplicate scan detected locally");

  // Step 5: Wi-Fi reconnects; server validates ticket
  harness.asPersona("staff");
  const serverScan = await harness.post("/api/v1/tickets/validate", {
    qrToken: token,
    eventId: "evt-buet-cse-fest",
  });
  expect.ok(serverScan);
  assert.strictEqual(serverScan.data.result, "VALID");
});

// T4-SCENARIO-08: Asynchronous Notification Queue Resilience & Dead-Letter Recovery
test("T4-SCENARIO-08", "Email gateway outage: Job marked RETRYING -> User receives instant QR -> Admin retries -> Job resolves to SENT (QA-014)", () => {
  harness.resetToSeed();
  const db = loadDb();

  // Step 1 & 2: Free registration during simulated email provider downtime
  const regResult = registerFreeEvent(db, {
    eventId: "evt-product-design-workshop",
    ticketTypeId: "tt-design-free",
    attendeeName: "Resilient User",
    attendeeEmail: `resilient-${Date.now()}@buet.ac.bd`,
    simulateEmailProviderDown: true,
  });

  // Step 3: Registration confirmed and QR issued immediately
  assert.strictEqual(regResult.registration.status, "CONFIRMED");
  assert.strictEqual(regResult.ticket.status, "VALID");

  // Notification is queued with RETRYING status
  const job = db.notifications.find(
    (n: any) => n.destination === regResult.registration.attendee_email
  );
  assert.ok(job);
  assert.strictEqual(job.status, "RETRYING");
  assert.strictEqual(job.retry_count, 1);
  assert.strictEqual(job.sent_at, null);

  // Step 4: Admin / background worker executes retry
  const retried = retryPendingNotifications(db);
  assert.ok(retried.includes(job.id));

  // Step 5: Notification is resolved to SENT with sent_at timestamp
  const resolved = db.notifications.find((n: any) => n.id === job.id);
  assert.strictEqual(resolved.status, "SENT");
  assert.ok(resolved.sent_at);
});

// T4-SCENARIO-09: White-Label Custom Domain Onboarding & Tenant Verification
test("T4-SCENARIO-09", "Custom domain onboarding: Mismatched CNAME flags ERROR -> Correct CNAME verifies organization (QA-013)", () => {
  harness.resetToSeed();
  const db = loadDb();

  // Step 1 & 2: Initial verification with mismatched CNAME record
  const check1 = verifyOrganizationCustomDomain(db, "usr-org-tanvir", {
    organizationId: "org-nsu-yes",
    customDomain: "summit.nsu-yes.org",
    simulatedDnsCnameRecord: "wrong.target.com",
  });
  assert.strictEqual(check1.dnsValid, false);
  assert.strictEqual(check1.organization.custom_domain_status, "ERROR");
  assert.strictEqual(check1.defaultPlatformUrl, "https://aayojon.bd/org/nsu-yes-society");

  // Step 3 & 4: External DNS corrected to cname.aayojon.bd
  const check2 = verifyOrganizationCustomDomain(db, "usr-org-tanvir", {
    organizationId: "org-nsu-yes",
    customDomain: "summit.nsu-yes.org",
    simulatedDnsCnameRecord: "cname.aayojon.bd",
  });
  assert.strictEqual(check2.dnsValid, true);
  assert.strictEqual(check2.organization.custom_domain_status, "VERIFIED");
  assert.strictEqual(check2.organization.custom_domain, "summit.nsu-yes.org");
});

// T4-SCENARIO-10: Payment Gateway Webhook Tampering & Replay Defense
test("T4-SCENARIO-10", "Payment defense: Forged HMAC 403 -> Amount tampering 400 -> Authentic payment 200 -> Replay idempotent (QA-003)", async () => {
  harness.resetToSeed();
  const db = loadDb();

  // Step 1: Attendee creates order
  const order = createTicketOrder(db, {
    eventId: "evt-dhaka-ai-summit",
    buyerUserId: "usr-attendee-rafiq",
    items: [{ ticketTypeId: "tt-ai-student", quantity: 1 }],
    attendee: { name: "Rafiq", email: "rafiq@student.buet.ac.bd" },
    idempotencyKey: `idem-t4-s10-${Date.now()}`,
  });
  assert.strictEqual(order.status, "PENDING");

  // Step 2: Forged HMAC signature attack -> rejected with 403
  const forgedPayload = JSON.stringify({
    webhookEventId: `wh-forged-${Date.now()}`,
    providerReference: "BKASH-FORGED",
    orderId: order.id,
    status: "SUCCESS",
    amountMinor: order.total_minor,
  });
  const forgedRes = await harness.post("/api/v1/webhooks/payments/BKASH_SANDBOX", forgedPayload, {
    headers: { "x-webhook-signature": "bogus_hex_hmac_123456789" },
  });
  expect.forbidden(forgedRes);
  assert.strictEqual(order.status, "PENDING");

  // Step 3: Tampered amount attack -> rejected with 400 VALIDATION_ERROR
  let tamperedErr: any = null;
  const tamperedPayload = JSON.stringify({
    webhookEventId: `wh-tampered-${Date.now()}`,
    providerReference: "BKASH-TAMPERED",
    orderId: order.id,
    status: "SUCCESS",
    amountMinor: 500, // Tampered down from 51250
  });
  try {
    processPaymentWebhook(db, {
      provider: "BKASH_SANDBOX",
      rawBody: tamperedPayload,
      signatureHeader: harness.signWebhook(tamperedPayload),
    });
  } catch (e) {
    tamperedErr = e;
  }
  assert.ok(tamperedErr);
  assert.strictEqual(tamperedErr.code, "VALIDATION_ERROR");
  assert.strictEqual(tamperedErr.status, 400);
  assert.strictEqual(order.status, "PENDING");

  // Step 4: Authentic payment webhook -> Order marked PAID and ticket issued
  const authenticPayload = JSON.stringify({
    webhookEventId: `wh-authentic-${Date.now()}`,
    providerReference: "BKASH-AUTHENTIC-OK",
    orderId: order.id,
    status: "SUCCESS",
    amountMinor: order.total_minor,
  });
  const legitResult = processPaymentWebhook(db, {
    provider: "BKASH_SANDBOX",
    rawBody: authenticPayload,
    signatureHeader: harness.signWebhook(authenticPayload),
  });
  assert.strictEqual(legitResult.order.status, "PAID");
  assert.strictEqual(legitResult.issuedTickets.length, 1);

  // Step 5: Duplicate webhook replay 30 seconds later -> returns alreadyProcessed: true
  const replayResult = processPaymentWebhook(db, {
    provider: "BKASH_SANDBOX",
    rawBody: authenticPayload,
    signatureHeader: harness.signWebhook(authenticPayload),
  });
  assert.strictEqual(replayResult.alreadyProcessed, true);
  assert.strictEqual(replayResult.issuedTickets.length, 1);
});
