import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  DatabaseState,
  EventRecord,
  Order,
  PackageCode,
  PaymentProvider,
  CheckInScanResult,
  TicketRecord,
  Registration,
  AuditLog,
} from "./types";
import { createInitialSeed, hashToken } from "./seed";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "aayojon-db.json");

export const WEBHOOK_SECRET = "whsec_aayojon_bd_live_hmac_2026_secret";
const TICKET_SERVICE_FEE_BPS = 250; // 2.5% disclosed ticketing service fee

export class DomainError extends Error {
  code:
    | "VALIDATION_ERROR"
    | "UNAUTHENTICATED"
    | "FORBIDDEN"
    | "NOT_FOUND"
    | "CONFLICT"
    | "RATE_LIMITED"
    | "PAYMENT_FAILED";
  status: number;

  constructor(
    code:
      | "VALIDATION_ERROR"
      | "UNAUTHENTICATED"
      | "FORBIDDEN"
      | "NOT_FOUND"
      | "CONFLICT"
      | "RATE_LIMITED"
      | "PAYMENT_FAILED",
    message: string,
    status = 400
  ) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

let memoryOverride: DatabaseState | null = null;

export function setTestDatabaseOverride(state: DatabaseState | null) {
  memoryOverride = state;
}

export function loadDb(): DatabaseState {
  if (memoryOverride) return memoryOverride;
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(raw) as DatabaseState;
      if (!parsed.roles || parsed.roles.length === 0) {
        const seed = createInitialSeed();
        parsed.roles = seed.roles;
        if (!parsed.profiles.find((p) => p.id === "usr-superadmin")) {
          const sa = seed.profiles.find((p) => p.id === "usr-superadmin");
          if (sa) parsed.profiles.unshift(sa);
        }
        saveDb(parsed);
      }
      return parsed;
    }
  } catch {
    // Fallback to initial seed
  }
  const seeded = createInitialSeed();
  saveDb(seeded);
  return seeded;
}

export function saveDb(state: DatabaseState): void {
  if (memoryOverride) {
    memoryOverride = state;
    return;
  }
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch {
    // Ignore write failure in read-only edge environments
  }
}

export function resetDbToSeed(): DatabaseState {
  const seeded = createInitialSeed();
  saveDb(seeded);
  return seeded;
}

export function signWebhookPayload(rawPayload: string, secret = WEBHOOK_SECRET): string {
  return crypto.createHmac("sha256", secret).update(rawPayload).digest("hex");
}

export function verifyWebhookSignature(
  rawPayload: string,
  signatureHeader: string | null | undefined,
  secret = WEBHOOK_SECRET
): boolean {
  if (!signatureHeader) return false;
  const expected = signWebhookPayload(rawPayload, secret);
  if (expected.length !== signatureHeader.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
}

export function isUserOrgAuthorized(
  db: DatabaseState,
  userId: string,
  organizationId: string,
  allowedRoles: Array<"OWNER" | "EVENT_MANAGER" | "CHECKIN_STAFF">
): boolean {
  const profile = db.profiles.find((p) => p.id === userId);
  if (profile?.platform_role === "ADMIN") return true;
  const member = db.organization_members.find(
    (m) =>
      m.organization_id === organizationId &&
      m.user_id === userId &&
      m.status === "ACTIVE" &&
      allowedRoles.includes(m.role)
  );
  return Boolean(member);
}

export function recordAudit(
  db: DatabaseState,
  actorId: string | null,
  action: string,
  resourceType: string,
  resourceId: string,
  metadata: Record<string, unknown> = {}
): AuditLog {
  const actor = db.profiles.find((p) => p.id === actorId);
  const entry: AuditLog = {
    id: `aud-${crypto.randomUUID().slice(0, 8)}`,
    actor_id: actorId,
    actor_name: actor?.display_name ?? "System Webhook",
    actor_role: actor?.platform_role ?? "SYSTEM",
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    metadata,
    created_at: new Date().toISOString(),
  };
  db.audit_logs.unshift(entry);
  return entry;
}

export function enqueueNotification(
  db: DatabaseState,
  params: {
    userId: string | null;
    destination: string;
    channel: "EMAIL" | "SMS";
    template: string;
    subject: string;
    idempotencyKey: string;
    simulateProviderDown?: boolean;
  }
) {
  const existing = db.notifications.find((n) => n.idempotency_key === params.idempotencyKey);
  if (existing) {
    return existing;
  }
  const now = new Date().toISOString();
  const job = {
    id: `notif-${crypto.randomUUID().slice(0, 8)}`,
    user_id: params.userId,
    destination: params.destination,
    channel: params.channel,
    template: params.template,
    subject: params.subject,
    status: params.simulateProviderDown ? ("RETRYING" as const) : ("SENT" as const),
    retry_count: params.simulateProviderDown ? 1 : 0,
    idempotency_key: params.idempotencyKey,
    sent_at: params.simulateProviderDown ? null : now,
    created_at: now,
  };
  db.notifications.unshift(job);
  return job;
}

export function retryPendingNotifications(db: DatabaseState) {
  const retried: string[] = [];
  for (const job of db.notifications) {
    if (job.status === "RETRYING" || job.status === "QUEUED") {
      job.status = "SENT";
      job.retry_count += 1;
      job.sent_at = new Date().toISOString();
      retried.push(job.id);
    }
  }
  saveDb(db);
  return retried;
}

// ============================================================================
// US-01 / QA-001: Create Event Draft (Free, Private until Published)
// ============================================================================
export function createEventDraft(
  db: DatabaseState,
  actorUserId: string,
  input: {
    organizationId: string;
    categoryId: string;
    title: string;
    tagline?: string;
    description: string;
    startsAt: string;
    endsAt: string;
    timezone?: string;
    capacity: number;
    isOnline?: boolean;
    onlineUrl?: string;
    venueName?: string;
    venueAddress?: string;
    venueCity?: "Dhaka" | "Chattogram" | "Sylhet" | "Rajshahi" | "Khulna" | "Online";
    visibility?: "PUBLIC" | "UNLISTED" | "PRIVATE";
    ticketTypes?: Array<{ name: string; priceMinor: number; capacity: number; description?: string }>;
    brandTheme?: string;
    refundPolicy?: string;
  }
): EventRecord {
  if (!actorUserId) {
    throw new DomainError("UNAUTHENTICATED", "Authentication required to create an event draft", 401);
  }
  if (!isUserOrgAuthorized(db, actorUserId, input.organizationId, ["OWNER", "EVENT_MANAGER"])) {
    throw new DomainError("FORBIDDEN", "Not authorized to create events for this organization", 403);
  }
  if (!input.title || input.title.trim().length < 3) {
    throw new DomainError("VALIDATION_ERROR", "Event title must be at least 3 characters", 400);
  }
  if (input.capacity <= 0) {
    throw new DomainError("VALIDATION_ERROR", "Event capacity must be greater than zero", 400);
  }
  if (new Date(input.endsAt) <= new Date(input.startsAt)) {
    throw new DomainError("VALIDATION_ERROR", "Event end time must be after start time", 400);
  }

  let venueId: string | null = null;
  if (!input.isOnline && input.venueName) {
    const newVenue = {
      id: `ven-${crypto.randomUUID().slice(0, 8)}`,
      organization_id: input.organizationId,
      name: input.venueName.trim(),
      address: input.venueAddress?.trim() || "Dhaka, Bangladesh",
      city: input.venueCity || "Dhaka",
    };
    db.venues.push(newVenue);
    venueId = newVenue.id;
  }

  const baseSlug = input.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const slug = db.events.some((e) => e.slug === baseSlug)
    ? `${baseSlug}-${crypto.randomUUID().slice(0, 4)}`
    : baseSlug;

  const actor = db.profiles.find((p) => p.id === actorUserId);
  const now = new Date().toISOString();

  const event: EventRecord = {
    id: `evt-${crypto.randomUUID().slice(0, 8)}`,
    organization_id: input.organizationId,
    category_id: input.categoryId || "cat-tech",
    venue_id: venueId,
    title: input.title.trim(),
    slug,
    tagline: input.tagline?.trim() || input.description.slice(0, 110),
    description: input.description.trim(),
    status: "DRAFT", // Strictly DRAFT until package payment & publish
    visibility: input.visibility || "PUBLIC",
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    timezone: input.timezone || "Asia/Dhaka",
    capacity: input.capacity,
    is_online: Boolean(input.isOnline),
    online_url: input.onlineUrl,
    cover_gradient: "from-teal-900 via-emerald-800 to-slate-900",
    brand_theme: input.brandTheme || "#0D9488",
    agenda: [
      { time: "10:00 AM", title: "Registration & QR Check-In", speaker: "Aayojon Welcome Desk" },
      { time: "10:30 AM", title: "Opening Session & Keynote", speaker: "Organizer Lead" },
    ],
    speakers: [],
    tags: ["Bangladesh", input.venueCity || "Dhaka"],
    package_code: null,
    is_featured: false,
    views_count: 0,
    saves_count: 0,
    refund_policy: input.refundPolicy || "Standard organizer refund policy applies.",
    contact_email: actor?.email || "organizer@aayojon.bd",
    created_at: now,
    updated_at: now,
  };

  db.events.unshift(event);

  const ticketSpecs =
    input.ticketTypes && input.ticketTypes.length > 0
      ? input.ticketTypes
      : [{ name: "General Admission", priceMinor: 0, capacity: input.capacity, description: "Standard entry pass" }];

  for (const tt of ticketSpecs) {
    if (tt.priceMinor < 0 || tt.capacity <= 0) {
      throw new DomainError("VALIDATION_ERROR", "Ticket price and capacity must be non-negative", 400);
    }
    db.ticket_types.push({
      id: `tt-${crypto.randomUUID().slice(0, 8)}`,
      event_id: event.id,
      name: tt.name,
      description: tt.description || "Event admission pass",
      price_minor: Math.round(tt.priceMinor),
      currency: "BDT",
      capacity: tt.capacity,
      sold_count: 0,
      sales_start: now,
      sales_end: input.startsAt,
    });
  }

  recordAudit(db, actorUserId, "EVENT_DRAFT_CREATED", "events", event.id, { title: event.title });
  saveDb(db);
  return event;
}

// ============================================================================
// US-02 / QA-002 / QA-004: Package Order Creation & Event Publication Gate
// ============================================================================
export function createPackageOrPromoOrder(
  db: DatabaseState,
  actorUserId: string,
  input: {
    eventId: string;
    packageCode: PackageCode;
    idempotencyKey: string;
  }
): Order {
  const existing = db.orders.find((o) => o.idempotency_key === input.idempotencyKey);
  if (existing) return existing;

  const event = db.events.find((e) => e.id === input.eventId);
  if (!event) throw new DomainError("NOT_FOUND", "Event not found", 404);

  if (!isUserOrgAuthorized(db, actorUserId, event.organization_id, ["OWNER", "EVENT_MANAGER"])) {
    throw new DomainError("FORBIDDEN", "Not authorized to purchase packages for this event", 403);
  }

  const pkg = db.packages.find((p) => p.code === input.packageCode && p.active);
  if (!pkg) throw new DomainError("VALIDATION_ERROR", `Invalid package code: ${input.packageCode}`, 400);

  const actor = db.profiles.find((p) => p.id === actorUserId);
  const order: Order = {
    id: `ord-${crypto.randomUUID().slice(0, 8)}`,
    buyer_user_id: actorUserId,
    event_id: event.id,
    order_type: pkg.is_addon ? "PROMOTION" : "PACKAGE",
    status: "PENDING",
    subtotal_minor: pkg.price_minor, // Server-calculated authoritative price
    fee_minor: 0,
    total_minor: pkg.price_minor,
    currency: "BDT",
    idempotency_key: input.idempotencyKey,
    attendee_name: actor?.display_name || "Organizer",
    attendee_email: actor?.email || event.contact_email,
    created_at: new Date().toISOString(),
  };

  db.orders.unshift(order);
  db.order_items.push({
    id: `oi-${crypto.randomUUID().slice(0, 8)}`,
    order_id: order.id,
    ticket_type_id: null,
    package_id: pkg.id,
    description: `${pkg.name} Package (${pkg.code})`,
    quantity: 1,
    unit_price_minor: pkg.price_minor,
    line_total_minor: pkg.price_minor,
  });

  saveDb(db);
  return order;
}

export function publishEvent(db: DatabaseState, actorUserId: string, eventId: string): EventRecord {
  const event = db.events.find((e) => e.id === eventId || e.slug === eventId);
  if (!event) throw new DomainError("NOT_FOUND", "Event not found", 404);

  if (!isUserOrgAuthorized(db, actorUserId, event.organization_id, ["OWNER", "EVENT_MANAGER"])) {
    throw new DomainError("FORBIDDEN", "Not authorized to publish this event", 403);
  }

  // Check active verified package entitlement (US-02 / QA-004)
  const activePurchase = db.package_purchases.find(
    (pp) =>
      pp.event_id === event.id &&
      pp.status === "ACTIVE" &&
      ["BASIC", "PROMOTED", "PLUS", "PREMIUM"].includes(pp.package_code)
  );

  if (!activePurchase) {
    throw new DomainError(
      "FORBIDDEN",
      "Publication blocked: A verified per-event package (Basic ৳799, Promoted ৳1,499, Plus ৳2,699, or Premium ৳4,999) is required before publishing.",
      403
    );
  }

  event.status = "PUBLISHED";
  event.package_code = activePurchase.package_code;
  if (activePurchase.package_code === "PREMIUM") {
    event.is_featured = true;
  }
  event.updated_at = new Date().toISOString();

  recordAudit(db, actorUserId, "EVENT_PUBLISHED", "events", event.id, {
    package_code: activePurchase.package_code,
    purchase_id: activePurchase.id,
  });

  saveDb(db);
  return event;
}

// ============================================================================
// US-03 / QA-006: Free Event Registration (Capacity & Duplicate Enforcement)
// ============================================================================
export function registerFreeEvent(
  db: DatabaseState,
  input: {
    eventId: string;
    ticketTypeId?: string;
    userId?: string | null;
    attendeeName: string;
    attendeeEmail: string;
    attendeePhone?: string;
    instituteOrCompany?: string;
    marketingConsent?: boolean;
    campaignCode?: string;
    simulateEmailProviderDown?: boolean;
  }
): { registration: Registration; ticket: TicketRecord } {
  const event = db.events.find((e) => e.id === input.eventId || e.slug === input.eventId);
  if (!event) throw new DomainError("NOT_FOUND", "Event not found", 404);
  if (event.status !== "PUBLISHED") {
    throw new DomainError("FORBIDDEN", "Registrations are only open for published events", 403);
  }

  const normalizedEmail = input.attendeeEmail.trim().toLowerCase();
  if (!normalizedEmail.includes("@") || !input.attendeeName.trim()) {
    throw new DomainError("VALIDATION_ERROR", "Valid attendee name and email are required", 400);
  }

  // Prevent duplicate registration for same event + normalized email
  const duplicate = db.registrations.find(
    (r) =>
      r.event_id === event.id &&
      r.attendee_email.toLowerCase() === normalizedEmail &&
      r.status === "CONFIRMED"
  );
  if (duplicate) {
    throw new DomainError("CONFLICT", "This email is already registered for this event", 409);
  }

  const ticketType = input.ticketTypeId
    ? db.ticket_types.find((t) => t.id === input.ticketTypeId && t.event_id === event.id)
    : db.ticket_types.find((t) => t.event_id === event.id);

  if (!ticketType) {
    throw new DomainError("NOT_FOUND", "Ticket tier not found for event", 404);
  }
  if (ticketType.price_minor > 0) {
    throw new DomainError("VALIDATION_ERROR", "Paid ticket types require order and payment checkout", 400);
  }

  // Enforce capacity (QA-006)
  if (ticketType.sold_count >= ticketType.capacity || ticketType.sold_count >= event.capacity) {
    throw new DomainError("CONFLICT", "Event is at full capacity. Registration rejected or waitlist required.", 409);
  }

  ticketType.sold_count += 1;
  const now = new Date().toISOString();

  const registration: Registration = {
    id: `reg-${crypto.randomUUID().slice(0, 8)}`,
    event_id: event.id,
    user_id: input.userId || null,
    order_id: null,
    ticket_type_id: ticketType.id,
    attendee_name: input.attendeeName.trim(),
    attendee_email: normalizedEmail,
    attendee_phone: input.attendeePhone?.trim() || "",
    institute_or_company: input.instituteOrCompany?.trim() || "",
    marketing_consent: Boolean(input.marketingConsent),
    status: "CONFIRMED",
    campaign_code: input.campaignCode,
    created_at: now,
  };
  db.registrations.unshift(registration);

  const rawQrToken = `AAYOJON-TKT-${event.id.toUpperCase()}-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
  const ticket: TicketRecord = {
    id: `tkt-${crypto.randomUUID().slice(0, 8)}`,
    registration_id: registration.id,
    event_id: event.id,
    ticket_type_id: ticketType.id,
    attendee_name: registration.attendee_name,
    attendee_email: registration.attendee_email,
    ticket_type_name: ticketType.name,
    qr_token: rawQrToken,
    token_hash: hashToken(rawQrToken),
    status: "VALID",
    issued_at: now,
  };
  db.tickets.unshift(ticket);

  if (input.campaignCode) {
    const cmp = db.campaign_links.find((c) => c.code === input.campaignCode && c.event_id === event.id);
    if (cmp) {
      cmp.conversions += 1;
      db.attributions.push({
        id: `attr-${crypto.randomUUID().slice(0, 8)}`,
        campaign_link_id: cmp.id,
        registration_id: registration.id,
        order_id: null,
        attributed_at: now,
        model: "LAST_TOUCH",
      });
    }
  }

  enqueueNotification(db, {
    userId: input.userId || null,
    destination: normalizedEmail,
    channel: "EMAIL",
    template: "FREE_REGISTRATION_CONFIRMATION",
    subject: `Registration Confirmed: ${event.title}`,
    idempotencyKey: `notif-reg-${registration.id}`,
    simulateProviderDown: input.simulateEmailProviderDown,
  });

  db.analytics_events.unshift({
    id: `ae-${crypto.randomUUID().slice(0, 8)}`,
    event_name: "registration_completed",
    event_id: event.id,
    registration_id: registration.id,
    session_id: "server-session",
    properties: { free_or_paid: "FREE" },
    timestamp: now,
  });

  saveDb(db);
  return { registration, ticket };
}

// ============================================================================
// US-04 / QA-005: Paid Ticket Order Creation (Atomic Inventory Check)
// ============================================================================
export function createTicketOrder(
  db: DatabaseState,
  input: {
    eventId: string;
    buyerUserId?: string | null;
    items: Array<{ ticketTypeId: string; quantity: number }>;
    attendee: {
      name: string;
      email: string;
      phone?: string;
      instituteOrCompany?: string;
    };
    campaignCode?: string;
    idempotencyKey: string;
  }
): Order {
  if (!input.idempotencyKey) {
    throw new DomainError("VALIDATION_ERROR", "Idempotency-Key header is required for order creation", 400);
  }
  const existingOrder = db.orders.find((o) => o.idempotency_key === input.idempotencyKey);
  if (existingOrder) {
    return existingOrder;
  }

  const event = db.events.find((e) => e.id === input.eventId || e.slug === input.eventId);
  if (!event || event.status !== "PUBLISHED") {
    throw new DomainError("NOT_FOUND", "Published event not found", 404);
  }

  if (!input.items || input.items.length === 0) {
    throw new DomainError("VALIDATION_ERROR", "At least one ticket item is required", 400);
  }

  // First pass: validate inventory atomically before mutating anything (QA-005)
  let subtotalMinor = 0;
  const resolvedItems: Array<{ ticketType: (typeof db.ticket_types)[0]; quantity: number }> = [];

  for (const item of input.items) {
    if (item.quantity <= 0 || item.quantity > 10) {
      throw new DomainError("VALIDATION_ERROR", "Ticket quantity must be between 1 and 10", 400);
    }
    const tt = db.ticket_types.find((t) => t.id === item.ticketTypeId && t.event_id === event.id);
    if (!tt) {
      throw new DomainError("NOT_FOUND", `Ticket type ${item.ticketTypeId} not found`, 404);
    }
    const remaining = tt.capacity - tt.sold_count;
    if (item.quantity > remaining) {
      throw new DomainError(
        "CONFLICT",
        `Insufficient ticket inventory for "${tt.name}". Requested ${item.quantity}, available ${remaining}.`,
        409
      );
    }
    subtotalMinor += tt.price_minor * item.quantity;
    resolvedItems.push({ ticketType: tt, quantity: item.quantity });
  }

  // Reserve inventory atomically inside transaction
  for (const r of resolvedItems) {
    r.ticketType.sold_count += r.quantity;
  }

  const feeMinor = Math.round((subtotalMinor * TICKET_SERVICE_FEE_BPS) / 10000);
  const totalMinor = subtotalMinor + feeMinor;
  const now = new Date().toISOString();

  const order: Order = {
    id: `ord-${crypto.randomUUID().slice(0, 8)}`,
    buyer_user_id: input.buyerUserId || null,
    event_id: event.id,
    order_type: "TICKET",
    status: "PENDING",
    subtotal_minor: subtotalMinor,
    fee_minor: feeMinor,
    total_minor: totalMinor,
    currency: "BDT",
    idempotency_key: input.idempotencyKey,
    attendee_name: input.attendee.name.trim(),
    attendee_email: input.attendee.email.trim().toLowerCase(),
    attendee_phone: input.attendee.phone?.trim() || "",
    institute_or_company: input.attendee.instituteOrCompany?.trim() || "",
    campaign_code: input.campaignCode,
    created_at: now,
  };

  db.orders.unshift(order);

  for (const r of resolvedItems) {
    db.order_items.push({
      id: `oi-${crypto.randomUUID().slice(0, 8)}`,
      order_id: order.id,
      ticket_type_id: r.ticketType.id,
      package_id: null,
      description: r.ticketType.name,
      quantity: r.quantity,
      unit_price_minor: r.ticketType.price_minor,
      line_total_minor: r.ticketType.price_minor * r.quantity,
    });
  }

  db.analytics_events.unshift({
    id: `ae-${crypto.randomUUID().slice(0, 8)}`,
    event_name: "checkout_started",
    event_id: event.id,
    order_id: order.id,
    session_id: "server-session",
    properties: { currency: "BDT", total_minor: totalMinor },
    timestamp: now,
  });

  saveDb(db);
  return order;
}

// ============================================================================
// Payment Webhook Processing (QA-002, QA-003, QA-007, QA-008, QA-014)
// ============================================================================
export function processPaymentWebhook(
  db: DatabaseState,
  params: {
    provider: PaymentProvider;
    rawBody: string;
    signatureHeader: string | null | undefined;
    simulateEmailProviderDown?: boolean;
  }
): {
  alreadyProcessed: boolean;
  order: Order;
  issuedTickets: TicketRecord[];
  activatedPackage?: PackageCode;
} {
  if (!verifyWebhookSignature(params.rawBody, params.signatureHeader)) {
    throw new DomainError("FORBIDDEN", "Invalid payment provider webhook HMAC signature", 403);
  }

  const payload = JSON.parse(params.rawBody) as {
    webhookEventId: string;
    providerReference: string;
    orderId: string;
    status: "SUCCESS" | "FAILED";
    amountMinor: number;
  };

  // QA-003: Idempotent duplicate webhook detection
  const existingPayment = db.payments.find(
    (p) =>
      p.webhook_event_id === payload.webhookEventId ||
      (p.provider_reference === payload.providerReference && p.status === "VERIFIED")
  );
  if (existingPayment) {
    const existingOrder = db.orders.find((o) => o.id === existingPayment.order_id)!;
    const existingTickets = db.tickets.filter((t) => {
      const reg = db.registrations.find((r) => r.id === t.registration_id);
      return reg?.order_id === existingOrder.id;
    });
    return {
      alreadyProcessed: true,
      order: existingOrder,
      issuedTickets: existingTickets,
    };
  }

  const order = db.orders.find((o) => o.id === payload.orderId);
  if (!order) {
    throw new DomainError("NOT_FOUND", `Order ${payload.orderId} not found`, 404);
  }

  const now = new Date().toISOString();

  if (payload.status === "FAILED") {
    order.status = "FAILED";
    // Release held ticket inventory if ticket order failed
    if (order.order_type === "TICKET") {
      const items = db.order_items.filter((oi) => oi.order_id === order.id);
      for (const item of items) {
        const tt = db.ticket_types.find((t) => t.id === item.ticket_type_id);
        if (tt && tt.sold_count >= item.quantity) {
          tt.sold_count -= item.quantity;
        }
      }
    }
    db.payments.unshift({
      id: `pay-${crypto.randomUUID().slice(0, 8)}`,
      order_id: order.id,
      provider: params.provider,
      provider_reference: payload.providerReference,
      webhook_event_id: payload.webhookEventId,
      amount_minor: payload.amountMinor,
      currency: "BDT",
      status: "FAILED",
      verified_at: null,
      created_at: now,
    });
    saveDb(db);
    return { alreadyProcessed: false, order, issuedTickets: [] };
  }

  // Verify amount matches server order total
  if (payload.amountMinor !== order.total_minor) {
    throw new DomainError("VALIDATION_ERROR", "Webhook payment amount mismatch against authoritative order total", 400);
  }

  order.status = "PAID";
  db.payments.unshift({
    id: `pay-${crypto.randomUUID().slice(0, 8)}`,
    order_id: order.id,
    provider: params.provider,
    provider_reference: payload.providerReference,
    webhook_event_id: payload.webhookEventId,
    amount_minor: payload.amountMinor,
    currency: "BDT",
    status: "VERIFIED",
    verified_at: now,
    created_at: now,
  });

  const event = db.events.find((e) => e.id === order.event_id)!;
  const issuedTickets: TicketRecord[] = [];
  let activatedPackage: PackageCode | undefined;

  if (order.order_type === "PACKAGE" || order.order_type === "PROMOTION") {
    const orderItem = db.order_items.find((oi) => oi.order_id === order.id);
    const pkg = db.packages.find((p) => p.id === orderItem?.package_id);
    if (pkg) {
      activatedPackage = pkg.code;
      const purchaseId = `pp-${crypto.randomUUID().slice(0, 8)}`;
      const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

      db.package_purchases.unshift({
        id: purchaseId,
        event_id: event.id,
        package_id: pkg.id,
        package_code: pkg.code,
        order_id: order.id,
        status: "ACTIVE",
        activated_at: now,
        expires_at: expiresAt,
      });

      if (pkg.is_addon || pkg.code === "FEATURED_ADDON") {
        event.is_featured = true;
        db.promotions.unshift({
          id: `promo-${crypto.randomUUID().slice(0, 8)}`,
          event_id: event.id,
          type: "FEATURED_ADDON",
          starts_at: now,
          ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          purchase_id: purchaseId,
          status: "ACTIVE",
        });
      } else {
        event.package_code = pkg.code;
        if (pkg.code === "PREMIUM") {
          event.is_featured = true;
        }
        db.subscriptions_or_entitlements.unshift({
          id: `ent-${crypto.randomUUID().slice(0, 8)}`,
          organization_id: event.organization_id,
          event_id: event.id,
          feature_code: `EVENT_PUBLISH_${pkg.code}`,
          package_code: pkg.code,
          valid_from: now,
          valid_until: expiresAt,
          source_purchase_id: purchaseId,
        });
      }

      recordAudit(db, order.buyer_user_id, "PACKAGE_ENTITLEMENT_ACTIVATED", "events", event.id, {
        package_code: pkg.code,
        order_id: order.id,
        provider_reference: payload.providerReference,
      });
    }
  } else if (order.order_type === "TICKET") {
    const items = db.order_items.filter((oi) => oi.order_id === order.id);
    for (const item of items) {
      const tt = db.ticket_types.find((t) => t.id === item.ticket_type_id);
      if (!tt) continue;

      const reg: Registration = {
        id: `reg-${crypto.randomUUID().slice(0, 8)}`,
        event_id: event.id,
        user_id: order.buyer_user_id,
        order_id: order.id,
        ticket_type_id: tt.id,
        attendee_name: order.attendee_name,
        attendee_email: order.attendee_email,
        attendee_phone: order.attendee_phone || "",
        institute_or_company: order.institute_or_company || "",
        marketing_consent: true,
        status: "CONFIRMED",
        campaign_code: order.campaign_code,
        created_at: now,
      };
      db.registrations.unshift(reg);

      for (let q = 0; q < item.quantity; q++) {
        const rawToken = `AAYOJON-TKT-${event.id.toUpperCase()}-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
        const tkt: TicketRecord = {
          id: `tkt-${crypto.randomUUID().slice(0, 8)}`,
          registration_id: reg.id,
          event_id: event.id,
          ticket_type_id: tt.id,
          attendee_name: order.attendee_name,
          attendee_email: order.attendee_email,
          ticket_type_name: tt.name,
          qr_token: rawToken,
          token_hash: hashToken(rawToken),
          status: "VALID",
          issued_at: now,
        };
        db.tickets.unshift(tkt);
        issuedTickets.push(tkt);
      }

      if (order.campaign_code) {
        const cmp = db.campaign_links.find((c) => c.code === order.campaign_code && c.event_id === event.id);
        if (cmp) {
          cmp.conversions += item.quantity;
          cmp.revenue_minor += item.line_total_minor;
          db.attributions.push({
            id: `attr-${crypto.randomUUID().slice(0, 8)}`,
            campaign_link_id: cmp.id,
            registration_id: reg.id,
            order_id: order.id,
            attributed_at: now,
            model: "LAST_TOUCH",
          });
        }
      }
    }
  }

  enqueueNotification(db, {
    userId: order.buyer_user_id,
    destination: order.attendee_email,
    channel: "EMAIL",
    template: order.order_type === "TICKET" ? "TICKET_ISSUED_CONFIRMATION" : "PACKAGE_RECEIPT_CONFIRMATION",
    subject:
      order.order_type === "TICKET"
        ? `Your QR Ticket for ${event.title}`
        : `Package Payment Verified for ${event.title}`,
    idempotencyKey: `notif-ord-${order.id}`,
    simulateProviderDown: params.simulateEmailProviderDown,
  });

  db.analytics_events.unshift({
    id: `ae-${crypto.randomUUID().slice(0, 8)}`,
    event_name: "payment_succeeded",
    event_id: event.id,
    order_id: order.id,
    session_id: "webhook-callback",
    properties: {
      provider: params.provider,
      amount_minor: order.total_minor,
      currency: "BDT",
    },
    timestamp: now,
  });

  saveDb(db);
  return {
    alreadyProcessed: false,
    order,
    issuedTickets,
    activatedPackage,
  };
}

// ============================================================================
// US-05 / QA-009: QR Ticket Validation & Check-In Scanner
// ============================================================================
export function validateTicketQr(
  db: DatabaseState,
  staffUserId: string,
  input: {
    qrToken: string;
    eventId?: string;
  }
): {
  result: CheckInScanResult;
  message: string;
  ticket?: TicketRecord;
  checkedInAt?: string;
  previousCheckIn?: { checkedInAt: string; staffName: string };
} {
  if (!staffUserId) {
    throw new DomainError("UNAUTHENTICATED", "Staff authentication required for ticket validation", 401);
  }

  const trimmed = input.qrToken.trim();
  const hashed = hashToken(trimmed);
  const ticket = db.tickets.find(
    (t) => t.token_hash === hashed || t.qr_token.toLowerCase() === trimmed.toLowerCase() || t.id === trimmed
  );

  if (!ticket) {
    return {
      result: "INVALID",
      message: "Unrecognized or forged QR token. No matching ticket hash found.",
    };
  }

  if (input.eventId && ticket.event_id !== input.eventId) {
    return {
      result: "INVALID",
      message: "Ticket belongs to a different event.",
      ticket,
    };
  }

  const event = db.events.find((e) => e.id === ticket.event_id);
  if (!event) {
    return { result: "INVALID", message: "Associated event does not exist." };
  }

  if (
    !isUserOrgAuthorized(db, staffUserId, event.organization_id, [
      "OWNER",
      "EVENT_MANAGER",
      "CHECKIN_STAFF",
    ])
  ) {
    throw new DomainError("FORBIDDEN", "Staff member is not assigned to this event's organization", 403);
  }

  if (ticket.status === "CANCELLED") {
    return {
      result: "CANCELLED",
      message: "Ticket has been cancelled or refunded.",
      ticket,
    };
  }

  const existingCheckIn = db.check_ins.find((c) => c.ticket_id === ticket.id);
  if (ticket.status === "USED" || existingCheckIn) {
    return {
      result: "ALREADY_USED",
      message: `Duplicate scan blocked! Ticket was already checked in at ${existingCheckIn?.checked_in_at || "earlier"}.`,
      ticket,
      previousCheckIn: {
        checkedInAt: existingCheckIn?.checked_in_at || ticket.issued_at,
        staffName: existingCheckIn?.staff_name || "Gate Staff",
      },
    };
  }

  const now = new Date().toISOString();
  const staff = db.profiles.find((p) => p.id === staffUserId);
  ticket.status = "USED";

  db.check_ins.unshift({
    id: `chk-${crypto.randomUUID().slice(0, 8)}`,
    ticket_id: ticket.id,
    event_id: event.id,
    staff_user_id: staffUserId,
    staff_name: staff?.display_name || "Check-In Staff",
    checked_in_at: now,
  });

  db.analytics_events.unshift({
    id: `ae-${crypto.randomUUID().slice(0, 8)}`,
    event_name: "ticket_checked_in",
    event_id: event.id,
    ticket_id: ticket.id,
    session_id: "scanner-session",
    properties: { staff_role: staff?.platform_role || "CHECKIN_STAFF" },
    timestamp: now,
  });

  saveDb(db);
  return {
    result: "VALID",
    message: "Ticket verified! Attendee checked in successfully.",
    ticket,
    checkedInAt: now,
  };
}

// ============================================================================
// QA-010: Cross-Tenant Attendee Isolation & Export Audit
// ============================================================================
export function getAuthorizedEventAttendees(
  db: DatabaseState,
  actorUserId: string,
  eventId: string,
  isExport = false
): Registration[] {
  const event = db.events.find((e) => e.id === eventId || e.slug === eventId);
  if (!event) throw new DomainError("NOT_FOUND", "Event not found", 404);

  if (!isUserOrgAuthorized(db, actorUserId, event.organization_id, ["OWNER", "EVENT_MANAGER"])) {
    throw new DomainError(
      "FORBIDDEN",
      "Cross-tenant access denied (RLS policy): You do not belong to the organization that owns this event.",
      403
    );
  }

  if (isExport) {
    recordAudit(db, actorUserId, "ATTENDEE_CSV_EXPORTED", "events", event.id, {
      timestamp: new Date().toISOString(),
    });
    saveDb(db);
  }

  return db.registrations.filter((r) => r.event_id === event.id);
}

// ============================================================================
// QA-011: Media Upload Security Validation
// ============================================================================
const ALLOWED_IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);
const BLOCKED_EXTENSIONS = [".exe", ".sh", ".bat", ".php", ".js", ".py", ".dll", ".msi", ".svg"];
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

export function validateAndStoreEventMedia(
  db: DatabaseState,
  actorUserId: string,
  input: {
    eventId: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
  }
) {
  const event = db.events.find((e) => e.id === input.eventId);
  if (!event) throw new DomainError("NOT_FOUND", "Event not found", 404);

  if (!isUserOrgAuthorized(db, actorUserId, event.organization_id, ["OWNER", "EVENT_MANAGER"])) {
    throw new DomainError("FORBIDDEN", "Not authorized to upload media for this event", 403);
  }

  const lowerName = input.filename.toLowerCase();
  if (BLOCKED_EXTENSIONS.some((ext) => lowerName.endsWith(ext)) || !ALLOWED_IMAGE_MIMES.has(input.mimeType)) {
    throw new DomainError(
      "VALIDATION_ERROR",
      "Upload rejected: Executable files and unsupported MIME types are prohibited. Allowed: JPEG, PNG, WebP.",
      400
    );
  }

  if (input.sizeBytes <= 0 || input.sizeBytes > MAX_UPLOAD_BYTES) {
    throw new DomainError(
      "VALIDATION_ERROR",
      `Upload rejected: File size (${(input.sizeBytes / (1024 * 1024)).toFixed(2)} MB) exceeds the 5 MB limit.`,
      400
    );
  }

  const media = {
    id: `med-${crypto.randomUUID().slice(0, 8)}`,
    event_id: event.id,
    storage_key: `events/${event.id}/${crypto.randomUUID().slice(0, 6)}-${lowerName.replace(/[^a-z0-9._-]/g, "")}`,
    filename: input.filename,
    mime_type: input.mimeType,
    size_bytes: input.sizeBytes,
    media_type: "COVER" as const,
    sort_order: db.event_media.filter((m) => m.event_id === event.id).length + 1,
  };
  db.event_media.push(media);
  saveDb(db);
  return media;
}

// ============================================================================
// US-07 / QA-012: Admin Moderation & Audit Logging
// ============================================================================
export function moderateEventListing(
  db: DatabaseState,
  adminUserId: string,
  input: {
    eventId: string;
    decision: "SUSPEND" | "RESTORE" | "CANCEL";
    reason: string;
  }
): { event: EventRecord; auditLog: AuditLog } {
  const admin = db.profiles.find((p) => p.id === adminUserId);
  if (!admin || admin.platform_role !== "ADMIN") {
    throw new DomainError("FORBIDDEN", "Administrator role required for listing moderation", 403);
  }
  if (!input.reason || input.reason.trim().length < 4) {
    throw new DomainError("VALIDATION_ERROR", "Moderation reason is required for the audit log", 400);
  }

  const event = db.events.find((e) => e.id === input.eventId);
  if (!event) throw new DomainError("NOT_FOUND", "Event not found", 404);

  const previousStatus = event.status;
  if (input.decision === "SUSPEND") {
    event.status = "SUSPENDED";
  } else if (input.decision === "RESTORE") {
    event.status = event.package_code ? "PUBLISHED" : "DRAFT";
  } else if (input.decision === "CANCEL") {
    event.status = "CANCELLED";
  }
  event.updated_at = new Date().toISOString();

  // Resolve any open abuse reports on this event
  for (const rep of db.reports) {
    if (rep.event_id === event.id && rep.status === "OPEN") {
      rep.status = "RESOLVED";
      rep.resolution_note = `${input.decision}: ${input.reason}`;
    }
  }

  const auditLog = recordAudit(db, adminUserId, `ADMIN_MODERATE_${input.decision}`, "events", event.id, {
    previous_status: previousStatus,
    new_status: event.status,
    reason: input.reason.trim(),
  });

  saveDb(db);
  return { event, auditLog };
}

// ============================================================================
// QA-013: Custom Domain DNS Verification
// ============================================================================
export function verifyOrganizationCustomDomain(
  db: DatabaseState,
  actorUserId: string,
  input: {
    organizationId: string;
    customDomain: string;
    simulatedDnsCnameRecord: string;
  }
) {
  const org = db.organizations.find((o) => o.id === input.organizationId);
  if (!org) throw new DomainError("NOT_FOUND", "Organization not found", 404);

  if (!isUserOrgAuthorized(db, actorUserId, org.id, ["OWNER"])) {
    throw new DomainError("FORBIDDEN", "Only organization owner can configure custom domain", 403);
  }

  org.custom_domain = input.customDomain.trim().toLowerCase();
  const expectedTarget = org.custom_domain_dns_target.toLowerCase();

  if (input.simulatedDnsCnameRecord.trim().toLowerCase() === expectedTarget) {
    org.custom_domain_status = "VERIFIED";
  } else {
    org.custom_domain_status = "ERROR";
  }

  recordAudit(db, actorUserId, "CUSTOM_DOMAIN_DNS_CHECK", "organizations", org.id, {
    custom_domain: org.custom_domain,
    observed_cname: input.simulatedDnsCnameRecord,
    status: org.custom_domain_status,
    default_fallback_url: `https://aayojon.bd/org/${org.slug}`,
  });

  saveDb(db);
  return {
    organization: org,
    defaultPlatformUrl: `https://aayojon.bd/org/${org.slug}`,
    dnsValid: org.custom_domain_status === "VERIFIED",
  };
}

