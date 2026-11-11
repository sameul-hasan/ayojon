/**
 * Aayojon E2E Test Suite - Tier 3: Pairwise Cross-Feature Combinations (20 Tests)
 * 
 * Validates interactions between system modules and full multi-feature logic.
 * Follows 4-tier testing specification from Explorer 3.
 */

import assert from "assert";
import path from "path";
import fs from "fs";
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

setRunnerContext(3, "Cross-Feature Combinations");

// T3-COMBO-01: FEAT-AUTH-002 + FEAT-UI-003
test("T3-COMBO-01", "Attendee signs in via Auth Context and completes ticket checkout", async () => {
  harness.resetToSeed();
  harness.asPersona("attendee");
  const res = await harness.post("/api/v1/orders", {
    eventId: "evt-dhaka-ai-summit",
    items: [{ ticketTypeId: "tt-ai-student", quantity: 1 }],
    attendee: {
      name: "Rafiqul Islam",
      email: "rafiq@student.buet.ac.bd",
      phone: "+8801712345678",
      instituteOrCompany: "BUET CSE",
    },
  });
  expect.ok(res);
  assert.strictEqual(res.data.status, "PENDING");
  assert.strictEqual(res.data.buyer_user_id, "usr-attendee-rafiq");
  assert.ok(res.data.id.startsWith("ord-"));
  assert.ok(res.data.total_minor > 0);
});

// T3-COMBO-02: FEAT-AUTH-003 + FEAT-UI-006
test("T3-COMBO-02", "Persona switcher activates Organizer Nusrat; workspace draft defaults to org-buet-cc", () => {
  harness.resetToSeed();
  harness.asPersona("organizer");
  assert.strictEqual(harness.getActiveUserId(), PERSONAS.organizer.id);

  const db = loadDb();
  const draft = createEventDraft(db, harness.getActiveUserId()!, {
    organizationId: "org-buet-cc",
    categoryId: "cat-uni",
    title: "BUET Inter-University ICPC Mock Contest 2026",
    description: "Annual warm-up programming contest for national ICPC contestants.",
    startsAt: "2026-12-15T09:00:00Z",
    endsAt: "2026-12-15T15:00:00Z",
    capacity: 120,
  });

  assert.strictEqual(draft.organization_id, "org-buet-cc");
  assert.strictEqual(draft.status, "DRAFT");
  assert.strictEqual(draft.package_code, null);
});

// T3-COMBO-03: FEAT-DB-003 + FEAT-UI-006
test("T3-COMBO-03", "Organizer buys Promoted package for draft event, webhook verified, event publishes (QA-002)", () => {
  harness.resetToSeed();
  const db = loadDb();
  const order = createPackageOrPromoOrder(db, "usr-org-nusrat", {
    eventId: "evt-draft-cyber-ctf",
    packageCode: "PROMOTED",
    idempotencyKey: `idem-combo-3-${Date.now()}`,
  });
  assert.strictEqual(order.status, "PENDING");

  const rawBody = JSON.stringify({
    webhookEventId: `wh-combo-3-${Date.now()}`,
    providerReference: "BKASH-PROMOTED-OK",
    orderId: order.id,
    status: "SUCCESS",
    amountMinor: order.total_minor,
  });
  const sig = harness.signWebhook(rawBody);
  const webhookResult = processPaymentWebhook(db, {
    provider: "BKASH_SANDBOX",
    rawBody,
    signatureHeader: sig,
  });
  assert.strictEqual(webhookResult.alreadyProcessed, false);
  assert.strictEqual(webhookResult.order.status, "PAID");

  const published = publishEvent(db, "usr-org-nusrat", "evt-draft-cyber-ctf");
  assert.strictEqual(published.status, "PUBLISHED");
  assert.strictEqual(published.package_code, "PROMOTED");
});

// T3-COMBO-04: FEAT-DB-002 + FEAT-UI-004
test("T3-COMBO-04", "Attendee purchases paid ticket, webhook verifies order, ticket renders in wallet (QA-007)", async () => {
  harness.resetToSeed();
  harness.asPersona("attendee");

  const orderRes = await harness.post("/api/v1/orders", {
    eventId: "evt-dhaka-ai-summit",
    items: [{ ticketTypeId: "tt-ai-student", quantity: 1 }],
    attendee: { name: "Rafiqul Islam", email: "rafiq@student.buet.ac.bd" },
  });
  expect.ok(orderRes);
  const orderId = orderRes.data.id;

  const db = loadDb();
  const rawBody = JSON.stringify({
    webhookEventId: `wh-combo-4-${Date.now()}`,
    providerReference: "SSL-COMBO-4",
    orderId,
    status: "SUCCESS",
    amountMinor: orderRes.data.total_minor,
  });
  const sig = harness.signWebhook(rawBody);
  processPaymentWebhook(db, {
    provider: "SSLCOMMERZ_SANDBOX",
    rawBody,
    signatureHeader: sig,
  });

  const walletRes = await harness.get("/api/v1/me/tickets");
  expect.ok(walletRes);
  assert.ok(Array.isArray(walletRes.data));
  const newTicket = walletRes.data.find((t: any) => t.event_id === "evt-dhaka-ai-summit");
  assert.ok(newTicket, "Purchased ticket must appear in attendee wallet");
  assert.strictEqual(newTicket.status, "VALID");
  assert.ok(newTicket.qr_token.startsWith("AAYOJON-TKT-"));
});

// T3-COMBO-05: FEAT-UI-004 + FEAT-UI-007
test("T3-COMBO-05", "Wallet ticket scanned at gate: first scan VALID, second scan ALREADY_USED (QA-009)", async () => {
  harness.resetToSeed();
  harness.asPersona("staff");

  const scan1 = await harness.post("/api/v1/tickets/validate", {
    qrToken: "AAYOJON-TKT-2026-BUET-9F4A2C8E1B",
    eventId: "evt-buet-cse-fest",
  });
  expect.ok(scan1);
  assert.strictEqual(scan1.data.result, "VALID");

  const scan2 = await harness.post("/api/v1/tickets/validate", {
    qrToken: "AAYOJON-TKT-2026-BUET-9F4A2C8E1B",
    eventId: "evt-buet-cse-fest",
  });
  expect.ok(scan2);
  assert.strictEqual(scan2.data.result, "ALREADY_USED");
});

// T3-COMBO-06: FEAT-UI-008 + FEAT-UI-003
test("T3-COMBO-06", "Admin suspends event; marketplace search hides suspended event from public (QA-012)", async () => {
  harness.resetToSeed();
  harness.asPersona("admin");

  const modRes = await harness.post("/api/v1/admin/events/evt-nsu-startup-pitch/moderate", {
    decision: "SUSPEND",
    reason: "License and partner compliance investigation",
  });
  expect.ok(modRes);
  assert.strictEqual(modRes.data.event.status, "SUSPENDED");

  harness.asAnonymous();
  const searchRes = await harness.get("/api/v1/events");
  expect.ok(searchRes);
  const found = searchRes.data.some((e: any) => e.id === "evt-nsu-startup-pitch");
  assert.strictEqual(found, false, "Suspended event must not be returned in public marketplace queries");
});

// T3-COMBO-07: FEAT-UI-008 + FEAT-UI-004
test("T3-COMBO-07", "Admin restores suspended event; event returns to published status", async () => {
  harness.resetToSeed();
  harness.asPersona("admin");

  // First suspend
  await harness.post("/api/v1/admin/events/evt-nsu-startup-pitch/moderate", {
    decision: "SUSPEND",
    reason: "Audit check",
  });

  // Then restore
  const restoreRes = await harness.post("/api/v1/admin/events/evt-nsu-startup-pitch/moderate", {
    decision: "RESTORE",
    reason: "Audit cleared",
  });
  expect.ok(restoreRes);
  assert.strictEqual(restoreRes.data.event.status, "PUBLISHED");

  harness.asAnonymous();
  const publicRes = await harness.get("/api/v1/events/evt-nsu-startup-pitch");
  expect.ok(publicRes);
  assert.strictEqual(publicRes.data.status, "PUBLISHED");
});

// T3-COMBO-08: FEAT-UI-006 + FEAT-DB-002
test("T3-COMBO-08", "Organizer UTM referral code tracks conversion attribution on verified payment", () => {
  harness.resetToSeed();
  const db = loadDb();
  const campaign = db.campaign_links.find((c: any) => c.code === "LN-AI-COMMUNITY")!;
  assert.ok(campaign, "LN-AI-COMMUNITY campaign must exist in seed");
  const initialConversions = campaign.conversions;

  const order = createTicketOrder(db, {
    eventId: "evt-dhaka-ai-summit",
    buyerUserId: "usr-attendee-rafiq",
    items: [{ ticketTypeId: "tt-ai-student", quantity: 2 }],
    attendee: { name: "Rafiq", email: "rafiq@student.buet.ac.bd" },
    campaignCode: "LN-AI-COMMUNITY",
    idempotencyKey: `idem-utm-${Date.now()}`,
  });
  assert.strictEqual(order.campaign_code, "LN-AI-COMMUNITY");

  const rawBody = JSON.stringify({
    webhookEventId: `wh-utm-${Date.now()}`,
    providerReference: "BKASH-UTM",
    orderId: order.id,
    status: "SUCCESS",
    amountMinor: order.total_minor,
  });
  processPaymentWebhook(db, {
    provider: "BKASH_SANDBOX",
    rawBody,
    signatureHeader: harness.signWebhook(rawBody),
  });

  const updatedCampaign = db.campaign_links.find((c: any) => c.code === "LN-AI-COMMUNITY")!;
  assert.strictEqual(updatedCampaign.conversions, initialConversions + 2);

  const attribution = db.attributions.find((a: any) => a.order_id === order.id);
  assert.ok(attribution, "Attribution record linking order to campaign must be generated");
  assert.strictEqual(attribution.campaign_link_id, campaign.id);
});

// T3-COMBO-09: FEAT-UI-005 + FEAT-UI-006
test("T3-COMBO-09", "Sponsor submits inquiry; proposals appear in database for organizer review", () => {
  harness.resetToSeed();
  const db = loadDb();
  const newInquiryId = `inq-${Date.now()}`;
  db.sponsor_inquiries.push({
    id: newInquiryId,
    event_id: "evt-dhaka-ai-summit",
    sponsor_name: "TechVentures Bangladesh",
    sponsor_email: "partnerships@techventures.com.bd",
    proposed_tier: "Gold Partner",
    budget_minor: 15000000,
    pitch: "AI compute sponsorship and mentorship booths.",
    status: "PENDING",
    created_at: new Date().toISOString(),
  });
  saveDb(db);

  const reloaded = loadDb();
  const stored = reloaded.sponsor_inquiries.find((i: any) => i.id === newInquiryId);
  assert.ok(stored);
  assert.strictEqual(stored.proposed_tier, "Gold Partner");
  assert.strictEqual(stored.status, "PENDING");
});

// T3-COMBO-10: FEAT-DB-003 + FEAT-UI-003
test("T3-COMBO-10", "Free event registration blocked with 409 CONFLICT when capacity is exhausted (QA-006)", () => {
  const db = loadDb();
  const tt = db.ticket_types.find((t: any) => t.id === "tt-design-free")!;
  tt.sold_count = tt.capacity;

  let err: any = null;
  try {
    registerFreeEvent(db, {
      eventId: "evt-product-design-workshop",
      ticketTypeId: tt.id,
      attendeeName: "Waitlist User",
      attendeeEmail: "waitlist@buet.ac.bd",
    });
  } catch (e) {
    err = e;
  }
  assert.ok(err);
  assert.strictEqual(err.code, "CONFLICT");
  assert.strictEqual(err.status, 409);
});

// T3-COMBO-11: FEAT-DB-003 + FEAT-AUTH-004
test("T3-COMBO-11", "Concurrent checkout race for single remaining ticket allows one, rejects second (QA-005)", () => {
  const db = loadDb();
  const tt = db.ticket_types.find((t: any) => t.id === "tt-ai-student")!;
  tt.sold_count = tt.capacity - 1; // 1 left

  const order1 = createTicketOrder(db, {
    eventId: "evt-dhaka-ai-summit",
    buyerUserId: "usr-attendee-rafiq",
    items: [{ ticketTypeId: tt.id, quantity: 1 }],
    attendee: { name: "Rafiq", email: "rafiq@student.buet.ac.bd" },
    idempotencyKey: `idem-race-1-${Date.now()}`,
  });
  assert.strictEqual(order1.status, "PENDING");

  let order2Err: any = null;
  try {
    createTicketOrder(db, {
      eventId: "evt-dhaka-ai-summit",
      buyerUserId: "usr-attendee-tanvir",
      items: [{ ticketTypeId: tt.id, quantity: 1 }],
      attendee: { name: "Tanvir", email: "tanvir@nsu-yes.org" },
      idempotencyKey: `idem-race-2-${Date.now()}`,
    });
  } catch (e) {
    order2Err = e;
  }
  assert.ok(order2Err);
  assert.strictEqual(order2Err.code, "CONFLICT");
  assert.strictEqual(order2Err.status, 409);
});

// T3-COMBO-12: FEAT-DB-005 + FEAT-AUTH-004
test("T3-COMBO-12", "Organizer Tanvir blocked from Nusrat's BUET attendee list with 403 (QA-010)", async () => {
  harness.resetToSeed();
  harness.asPersona("organizer2"); // Tanvir (org-nsu-yes)
  const res = await harness.get("/api/v1/events/evt-buet-cse-fest/attendees");
  expect.forbidden(res);
});

// T3-COMBO-13: FEAT-UI-001 + FEAT-UI-002
test("T3-COMBO-13", "Visual cohesion: Light theme tokens verified and zero dark artifacts present", () => {
  const css = fs.readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf-8");
  expect.lightThemeTokens(css);
  expect.noDarkArtifacts(css);
});

// T3-COMBO-14: FEAT-UI-006 + FEAT-DB-002
test("T3-COMBO-14", "Organizer media upload rejects executable .exe, then accepts valid .png (QA-011)", () => {
  const db = loadDb();
  let uploadErr: any = null;
  try {
    validateAndStoreEventMedia(db, "usr-org-nusrat", {
      eventId: "evt-dhaka-ai-summit",
      filename: "trojan.exe",
      mimeType: "application/x-msdownload",
      sizeBytes: 1024,
      dataBase64: "dGVzdA==",
    });
  } catch (e) {
    uploadErr = e;
  }
  assert.ok(uploadErr);
  assert.strictEqual(uploadErr.code, "VALIDATION_ERROR");

  const validMedia = validateAndStoreEventMedia(db, "usr-org-nusrat", {
    eventId: "evt-dhaka-ai-summit",
    filename: "banner.png",
    mimeType: "image/png",
    sizeBytes: 2048,
    dataBase64: "dGVzdA==",
  });
  assert.strictEqual(validMedia.media_type, "COVER");
  assert.ok(validMedia.storage_key.includes("banner.png"));
});

// T3-COMBO-15: FEAT-DB-002 + FEAT-UI-008
test("T3-COMBO-15", "Outage during notification marks RETRYING; retry worker resolves job to SENT (QA-014)", () => {
  const db = loadDb();
  const reg = registerFreeEvent(db, {
    eventId: "evt-product-design-workshop",
    ticketTypeId: "tt-design-free",
    attendeeName: "Resilience Attendee",
    attendeeEmail: `resilience-${Date.now()}@buet.ac.bd`,
    simulateEmailProviderDown: true,
  });

  const failedJob = db.notifications.find(
    (j: any) => j.destination === reg.registration.attendee_email
  );
  assert.ok(failedJob);
  assert.strictEqual(failedJob.status, "RETRYING");

  const retried = retryPendingNotifications(db);
  assert.ok(retried.length >= 1);

  const resolvedJob = db.notifications.find(
    (j: any) => j.id === failedJob.id
  );
  assert.strictEqual(resolvedJob.status, "SENT");
  assert.ok(resolvedJob.sent_at);
});

// T3-COMBO-16: FEAT-UI-006 + FEAT-DB-002
test("T3-COMBO-16", "Custom domain DNS mismatch flags ERROR; fallback URL remains active (QA-013)", () => {
  const db = loadDb();
  const res = verifyOrganizationCustomDomain(db, "usr-org-tanvir", {
    organizationId: "org-nsu-yes",
    customDomain: "summit.nsu-yes.org",
    simulatedDnsCnameRecord: "mismatched.external-dns.com",
  });
  assert.strictEqual(res.dnsValid, false);
  assert.strictEqual(res.organization.custom_domain_status, "ERROR");
  assert.strictEqual(res.defaultPlatformUrl, "https://aayojon.bd/org/nsu-yes-society");
});

// T3-COMBO-17: FEAT-DB-004 + FEAT-TEST-001
test("T3-COMBO-17", "In-memory database isolation resets cleanly between tests", () => {
  const db = loadDb();
  db.events.pop();
  assert.strictEqual(db.events.length, 6);

  const restored = resetDbToSeed();
  assert.strictEqual(restored.events.length, 7);
  assert.strictEqual(restored.profiles.length, 6);
});

// T3-COMBO-18: FEAT-DB-002 + FEAT-UI-007
test("T3-COMBO-18", "Cancelled event tickets are rejected at gate with CANCELLED status", async () => {
  harness.resetToSeed();
  harness.asPersona("organizer");

  // Nusrat cancels BUET CSE Fest
  const cancelRes = await harness.post("/api/v1/events/evt-buet-cse-fest/cancel");
  expect.ok(cancelRes);
  assert.strictEqual(cancelRes.data.status, "CANCELLED");

  // Gate staff scans ticket
  harness.asPersona("staff");
  const scanRes = await harness.post("/api/v1/tickets/validate", {
    qrToken: "AAYOJON-TKT-2026-BUET-9F4A2C8E1B",
    eventId: "evt-buet-cse-fest",
  });
  expect.ok(scanRes);
  assert.strictEqual(scanRes.data.result, "CANCELLED");
});

// T3-COMBO-19: FEAT-DB-002 + FEAT-DB-003
test("T3-COMBO-19", "Pending order has zero tickets; verified webhook generates valid ticket (QA-008)", () => {
  const db = loadDb();
  const order = createTicketOrder(db, {
    eventId: "evt-dhaka-ai-summit",
    buyerUserId: "usr-attendee-rafiq",
    items: [{ ticketTypeId: "tt-ai-student", quantity: 1 }],
    attendee: { name: "Rafiq", email: "rafiq@student.buet.ac.bd" },
    idempotencyKey: `idem-t3-combo19-${Date.now()}`,
  });
  assert.strictEqual(order.status, "PENDING");

  const ticketsBefore = db.tickets.filter((t: any) => {
    const reg = db.registrations.find((r: any) => r.id === t.registration_id);
    return reg?.order_id === order.id;
  });
  assert.strictEqual(ticketsBefore.length, 0);

  const rawBody = JSON.stringify({
    webhookEventId: `wh-t3-combo19-${Date.now()}`,
    providerReference: "BKASH-T3-19",
    orderId: order.id,
    status: "SUCCESS",
    amountMinor: order.total_minor,
  });
  const webhookRes = processPaymentWebhook(db, {
    provider: "BKASH_SANDBOX",
    rawBody,
    signatureHeader: harness.signWebhook(rawBody),
  });
  assert.strictEqual(webhookRes.order.status, "PAID");
  assert.strictEqual(webhookRes.issuedTickets.length, 1);
  assert.strictEqual(webhookRes.issuedTickets[0].status, "VALID");
});

// T3-COMBO-20: FEAT-DB-003 + FEAT-AUTH-004
test("T3-COMBO-20", "Duplicate payment webhook delivers idempotently: second returns alreadyProcessed (QA-003)", () => {
  const db = loadDb();
  const order = createPackageOrPromoOrder(db, "usr-org-nusrat", {
    eventId: "evt-draft-cyber-ctf",
    packageCode: "PLUS",
    idempotencyKey: `idem-t3-combo20-${Date.now()}`,
  });

  const rawBody = JSON.stringify({
    webhookEventId: `wh-t3-combo20-${Date.now()}`,
    providerReference: `BKASH-T3-20-${Date.now()}`,
    orderId: order.id,
    status: "SUCCESS",
    amountMinor: order.total_minor,
  });
  const sig = harness.signWebhook(rawBody);

  const call1 = processPaymentWebhook(db, {
    provider: "BKASH_SANDBOX",
    rawBody,
    signatureHeader: sig,
  });
  assert.strictEqual(call1.alreadyProcessed, false);
  assert.strictEqual(call1.order.status, "PAID");

  const call2 = processPaymentWebhook(db, {
    provider: "BKASH_SANDBOX",
    rawBody,
    signatureHeader: sig,
  });
  assert.strictEqual(call2.alreadyProcessed, true);
  assert.strictEqual(call2.order.id, order.id);
});
