/**
 * Aayojon Centralized Role-Based Access Control (RBAC) Architecture
 * Milestone: MODULE 1A — SECURITY & AUTHORIZATION
 * Location: src/lib/permissions/rbac.ts
 */

import type { DatabaseState, PlatformRole, Profile, RoleDefinition } from "../types";
import type { UserRole, AuthUser } from "../firebase/auth-context";

// ---------------------------------------------------------------------------
// Action-Based Permission Definitions
// ---------------------------------------------------------------------------

export type Permission =
  // Events
  | "event.create"
  | "event.read.public"
  | "event.read.own"
  | "event.update.own"
  | "event.delete.own"
  | "event.publish"
  | "event.moderate"
  // Attendees & Registrations
  | "attendee.read.own_event"
  | "attendee.export.own_event"
  // Tickets & Gate Validation
  | "ticket.purchase"
  | "ticket.read.own"
  | "ticket.validate.assigned_event"
  // Sponsorships
  | "sponsor.opportunity.read"
  | "sponsor.proposal.create"
  | "sponsor.proposal.read.own"
  | "sponsor.proposal.manage.own_event"
  // Venue & Vendor Marketplace
  | "venue.read.public"
  | "venue.manage.own"
  | "service.manage.own"
  | "rfq.create"
  | "rfq.read.own"
  | "rfq.read.assigned_provider"
  | "quotation.create.assigned"
  | "quotation.read.own"
  | "quotation.revise.own"
  | "booking.create"
  | "booking.read.own"
  | "booking.manage.own"
  // Superadmin & Platform Governance
  | "user.manage"
  | "user.suspend"
  | "role.assign"
  | "provider.verify"
  | "dispute.resolve"
  | "audit.read"
  | "platform.manage";

// ---------------------------------------------------------------------------
// Standard Role Matrix
// ---------------------------------------------------------------------------

export const ROLE_PERMISSIONS: Record<UserRole | "guest", readonly Permission[]> = {
  guest: [
    "event.read.public",
    "venue.read.public",
    "sponsor.opportunity.read",
  ],
  attendee: [
    "event.read.public",
    "venue.read.public",
    "sponsor.opportunity.read",
    "ticket.purchase",
    "ticket.read.own",
    "booking.read.own",
  ],
  organizer: [
    "event.read.public",
    "venue.read.public",
    "sponsor.opportunity.read",
    "ticket.purchase",
    "ticket.read.own",
    "event.create",
    "event.read.own",
    "event.update.own",
    "event.delete.own",
    "event.publish",
    "attendee.read.own_event",
    "attendee.export.own_event",
    "sponsor.proposal.manage.own_event",
    "rfq.create",
    "rfq.read.own",
    "quotation.read.own",
    "booking.create",
    "booking.read.own",
    "booking.manage.own",
  ],
  sponsor: [
    "event.read.public",
    "venue.read.public",
    "sponsor.opportunity.read",
    "sponsor.proposal.create",
    "sponsor.proposal.read.own",
  ],
  staff: [
    "event.read.public",
    "venue.read.public",
    "ticket.validate.assigned_event",
  ],
  venue_owner: [
    "event.read.public",
    "venue.read.public",
    "venue.manage.own",
    "rfq.read.assigned_provider",
    "quotation.create.assigned",
    "quotation.read.own",
    "quotation.revise.own",
    "booking.read.own",
    "booking.manage.own",
  ],
  vendor: [
    "event.read.public",
    "venue.read.public",
    "service.manage.own",
    "rfq.read.assigned_provider",
    "quotation.create.assigned",
    "quotation.read.own",
    "quotation.revise.own",
    "booking.read.own",
    "booking.manage.own",
  ],
  admin: [
    // Superadmin has all permissions
    "event.create",
    "event.read.public",
    "event.read.own",
    "event.update.own",
    "event.delete.own",
    "event.publish",
    "event.moderate",
    "attendee.read.own_event",
    "attendee.export.own_event",
    "ticket.purchase",
    "ticket.read.own",
    "ticket.validate.assigned_event",
    "sponsor.opportunity.read",
    "sponsor.proposal.create",
    "sponsor.proposal.read.own",
    "sponsor.proposal.manage.own_event",
    "venue.read.public",
    "venue.manage.own",
    "service.manage.own",
    "rfq.create",
    "rfq.read.own",
    "rfq.read.assigned_provider",
    "quotation.create.assigned",
    "quotation.read.own",
    "quotation.revise.own",
    "booking.create",
    "booking.read.own",
    "booking.manage.own",
    "user.manage",
    "user.suspend",
    "role.assign",
    "provider.verify",
    "dispute.resolve",
    "audit.read",
    "platform.manage",
  ],
  super_admin: [
    "event.create",
    "event.read.public",
    "event.read.own",
    "event.update.own",
    "event.delete.own",
    "event.publish",
    "event.moderate",
    "attendee.read.own_event",
    "attendee.export.own_event",
    "ticket.purchase",
    "ticket.read.own",
    "ticket.validate.assigned_event",
    "sponsor.opportunity.read",
    "sponsor.proposal.create",
    "sponsor.proposal.read.own",
    "sponsor.proposal.manage.own_event",
    "venue.read.public",
    "venue.manage.own",
    "service.manage.own",
    "rfq.create",
    "rfq.read.own",
    "rfq.read.assigned_provider",
    "quotation.create.assigned",
    "quotation.read.own",
    "quotation.revise.own",
    "booking.create",
    "booking.read.own",
    "booking.manage.own",
    "user.manage",
    "user.suspend",
    "role.assign",
    "provider.verify",
    "dispute.resolve",
    "audit.read",
    "platform.manage",
  ],
};

// ---------------------------------------------------------------------------
// Route Protection Matrix
// ---------------------------------------------------------------------------

export interface RouteRule {
  pathPattern: RegExp;
  allowedRoles: (UserRole | "guest")[];
  requireAuth: boolean;
}

export const ROUTE_RULES: RouteRule[] = [
  // Public pages
  { pathPattern: /^\/$/, allowedRoles: ["guest", "attendee", "organizer", "sponsor", "staff", "venue_owner", "vendor", "admin"], requireAuth: false },
  { pathPattern: /^\/events(\/.*)?$/, allowedRoles: ["guest", "attendee", "organizer", "sponsor", "staff", "venue_owner", "vendor", "admin"], requireAuth: false },
  { pathPattern: /^\/venues(\/.*)?$/, allowedRoles: ["guest", "attendee", "organizer", "sponsor", "staff", "venue_owner", "vendor", "admin"], requireAuth: false },
  { pathPattern: /^\/ai-event-assistant(\/.*)?$/, allowedRoles: ["guest", "attendee", "organizer", "sponsor", "staff", "venue_owner", "vendor", "admin"], requireAuth: false },
  { pathPattern: /^\/login(\/.*)?$/, allowedRoles: ["guest", "attendee", "organizer", "sponsor", "staff", "venue_owner", "vendor", "admin"], requireAuth: false },
  { pathPattern: /^\/design(\/.*)?$/, allowedRoles: ["guest", "attendee", "organizer", "sponsor", "staff", "venue_owner", "vendor", "admin"], requireAuth: false },

  // Tickets Pass (Requires authentication - checked per ticket ownership)
  { pathPattern: /^\/tickets\/[^/]+$/, allowedRoles: ["attendee", "organizer", "staff", "admin", "super_admin"], requireAuth: true },

  // Dedicated Role-Based Access Pages
  { pathPattern: /^\/profile(\/.*)?$/, allowedRoles: ["attendee", "organizer", "staff", "sponsor", "venue_owner", "vendor", "admin", "super_admin"], requireAuth: true },
  { pathPattern: /^\/wallet(\/.*)?$/, allowedRoles: ["attendee", "organizer", "staff", "sponsor", "venue_owner", "vendor", "admin", "super_admin"], requireAuth: true },
  { pathPattern: /^\/organizer(\/.*)?$/, allowedRoles: ["organizer", "admin", "super_admin"], requireAuth: true },
  { pathPattern: /^\/scanner(\/.*)?$/, allowedRoles: ["staff", "organizer", "admin", "super_admin"], requireAuth: true },
  { pathPattern: /^\/sponsor(\/.*)?$/, allowedRoles: ["sponsor", "admin", "super_admin"], requireAuth: true },
  { pathPattern: /^\/provider(\/.*)?$/, allowedRoles: ["venue_owner", "vendor", "admin", "super_admin"], requireAuth: true },
  { pathPattern: /^\/admin(\/.*)?$/, allowedRoles: ["admin", "super_admin"], requireAuth: true },

  // Portal Redirects
  { pathPattern: /^\/portal\?.*tab=wallet.*$/, allowedRoles: ["attendee", "organizer", "admin", "super_admin"], requireAuth: true },
  { pathPattern: /^\/portal\?.*tab=organizer.*$/, allowedRoles: ["organizer", "admin", "super_admin"], requireAuth: true },
  { pathPattern: /^\/portal\?.*tab=scanner.*$/, allowedRoles: ["staff", "admin", "super_admin"], requireAuth: true },
  { pathPattern: /^\/portal\?.*tab=sponsor.*$/, allowedRoles: ["sponsor", "admin", "super_admin"], requireAuth: true },
  { pathPattern: /^\/portal\?.*tab=provider.*$/, allowedRoles: ["venue_owner", "vendor", "admin", "super_admin"], requireAuth: true },
  { pathPattern: /^\/portal\?.*tab=admin.*$/, allowedRoles: ["admin", "super_admin"], requireAuth: true },
  { pathPattern: /^\/portal(\/.*)?$/, allowedRoles: ["attendee", "organizer", "sponsor", "staff", "venue_owner", "vendor", "admin", "super_admin"], requireAuth: true },
];

// ---------------------------------------------------------------------------
// Role & Permission Inspection Functions
// ---------------------------------------------------------------------------

export type NormalizedRole = UserRole | "guest";

/**
 * Normalizes user role or platform role to UserRole string
 */
export function normalizeUserRole(role: string | null | undefined): NormalizedRole {
  if (!role) return "guest";
  const r = role.toLowerCase().trim();
  if (r === "guest") return "guest";
  if (r === "super_admin" || r === "superadmin" || r === "admin") return "admin";
  if (r === "organizer" || r === "organizer_owner" || r === "event_manager") return "organizer";
  if (r === "staff" || r === "checkin_staff") return "staff";
  if (r === "sponsor") return "sponsor";
  if (r === "venue_owner") return "venue_owner";
  if (r === "vendor") return "vendor";
  return "attendee";
}

/**
 * Checks if user is Super Administrator
 */
export function isSuperAdmin(
  user: { role?: string; platform_role?: string; email?: string } | null | undefined
): boolean {
  if (!user) return false;
  const role = (user.role || "").toLowerCase();
  const pRole = (user.platform_role || "").toLowerCase();
  const email = (user.email || "").toLowerCase();
  return (
    role === "super_admin" ||
    role === "superadmin" ||
    pRole === "super_admin" ||
    pRole === "superadmin" ||
    email === "superadmin@aayojon.bd" ||
    email === "bfos.info@gmail.com"
  );
}

/**
 * Checks if user possesses one of the allowed roles
 */
export function hasRole(
  user: { role?: string; platform_role?: string } | null | undefined,
  allowedRoles: (UserRole | "guest")[]
): boolean {
  const currentRole = normalizeUserRole(user?.role || user?.platform_role);
  return allowedRoles.includes(currentRole);
}

/**
 * Checks if a specific role possesses a granular action permission
 */
export function hasPermission(
  role: UserRole | "guest",
  permission: Permission
): boolean {
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes(permission);
}

/**
 * Resolves permissions dynamically from the database roles collection
 */
export function hasDbPermission(
  role: string | null | undefined,
  permission: string,
  dbRoles?: RoleDefinition[]
): boolean {
  const normRole = normalizeUserRole(role);
  if (normRole === "admin") return true;

  if (dbRoles && Array.isArray(dbRoles)) {
    const dbRole = dbRoles.find(
      (r) =>
        r.code.toLowerCase() === (role || "").toLowerCase() ||
        r.code.toLowerCase() === normRole
    );
    if (dbRole) {
      if (dbRole.permissions.includes("*") || dbRole.permissions.includes(permission)) {
        return true;
      }
    }
  }

  const perms = ROLE_PERMISSIONS[normRole] || [];
  return perms.includes(permission as Permission);
}

/**
 * Checks whether user can access a specific route pathname
 */
export function canAccessRoute(
  pathname: string,
  user: { role?: string; platform_role?: string } | null | undefined
): { allowed: boolean; reason?: "UNAUTHENTICATED" | "FORBIDDEN" } {
  const currentRole = normalizeUserRole(user?.role || user?.platform_role);

  for (const rule of ROUTE_RULES) {
    if (rule.pathPattern.test(pathname)) {
      if (rule.requireAuth && currentRole === "guest") {
        return { allowed: false, reason: "UNAUTHENTICATED" };
      }
      if (!rule.allowedRoles.includes(currentRole)) {
        return { allowed: false, reason: "FORBIDDEN" };
      }
      return { allowed: true };
    }
  }

  // By default, allow if no specific restriction pattern matched
  return { allowed: true };
}

// ---------------------------------------------------------------------------
// Granular Resource Ownership & Data Isolation Checkers
// ---------------------------------------------------------------------------

export type ResourceType =
  | "EVENT"
  | "TICKET"
  | "ORDER"
  | "PROPOSAL"
  | "RFQ"
  | "QUOTATION"
  | "MESSAGE"
  | "BOOKING";

export interface ResourceAccessResult {
  allowed: boolean;
  code: "OK" | "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND";
  message?: string;
}

/**
 * Evaluates whether an actor has authority to access or mutate a specific resource.
 * Enforces QA-010 (Anti-Collusion Isolation) and prevents horizontal privilege escalation.
 */
export function canAccessResource(
  actorUserId: string,
  actorRole: UserRole | string,
  resourceType: ResourceType,
  resourceId: string,
  db: DatabaseState
): ResourceAccessResult {
  const role = normalizeUserRole(actorRole);

  // Superadmin can access and moderate all platform resources with audit
  if (role === "admin") {
    return { allowed: true, code: "OK" };
  }

  switch (resourceType) {
    case "EVENT": {
      const event = db.events.find((e) => e.id === resourceId);
      if (!event) return { allowed: false, code: "NOT_FOUND", message: "Event not found" };

      // Public events can be read by anyone
      // But mutations require event organizer ownership
      const isOwner = db.organization_members.some(
        (m) =>
          m.organization_id === event.organization_id &&
          m.user_id === actorUserId &&
          (m.role === "OWNER" || m.role === "EVENT_MANAGER")
      );

      if (isOwner) return { allowed: true, code: "OK" };
      return {
        allowed: false,
        code: "FORBIDDEN",
        message: "You are not authorized to manage events belonging to another organization.",
      };
    }

    case "TICKET": {
      const ticket = db.tickets.find((t) => t.id === resourceId);
      if (!ticket) return { allowed: false, code: "NOT_FOUND", message: "Ticket not found" };

      const reg = db.registrations.find((r) => r.id === ticket.registration_id);
      const isOwner = reg?.user_id === actorUserId;

      // Staff assigned to event can also inspect tickets
      const isEventStaff = db.organization_members.some((m) => {
        const event = db.events.find((e) => e.id === ticket.event_id);
        return (
          event &&
          m.organization_id === event.organization_id &&
          m.user_id === actorUserId
        );
      });

      if (isOwner || isEventStaff) return { allowed: true, code: "OK" };
      return {
        allowed: false,
        code: "FORBIDDEN",
        message: "You are not permitted to view tickets belonging to another attendee.",
      };
    }

    case "ORDER": {
      const order = db.orders.find((o) => o.id === resourceId);
      if (!order) return { allowed: false, code: "NOT_FOUND", message: "Order not found" };

      if (order.buyer_user_id === actorUserId) return { allowed: true, code: "OK" };
      return {
        allowed: false,
        code: "FORBIDDEN",
        message: "You are not permitted to access orders placed by another customer.",
      };
    }

    case "PROPOSAL": {
      const proposal = db.sponsor_inquiries.find((p) => p.id === resourceId);
      if (!proposal) return { allowed: false, code: "NOT_FOUND", message: "Proposal not found" };

      // Sponsor who submitted can read
      const isSponsor = proposal.sponsor_user_id === actorUserId;

      // Organizer whose event is targeted can read
      const targetEvent = db.events.find((e) => e.id === proposal.event_id);
      const isTargetOrganizer =
        targetEvent &&
        db.organization_members.some(
          (m) => m.organization_id === targetEvent.organization_id && m.user_id === actorUserId
        );

      if (isSponsor || isTargetOrganizer) return { allowed: true, code: "OK" };
      return {
        allowed: false,
        code: "FORBIDDEN",
        message: "You do not have permission to view this sponsorship proposal.",
      };
    }

    case "RFQ": {
      const rfq = db.venue_requests?.find((r) => r.id === resourceId);
      if (!rfq) return { allowed: false, code: "NOT_FOUND", message: "RFQ not found" };

      // Organizer owner
      const isOwner = rfq.organizer_user_id === actorUserId;

      // Targeted provider
      const isTargetProvider = rfq.target_provider_ids?.includes(actorUserId);

      if (isOwner || isTargetProvider) return { allowed: true, code: "OK" };
      return {
        allowed: false,
        code: "FORBIDDEN",
        message: "This RFQ is private to the organizer and invited providers.",
      };
    }

    case "QUOTATION": {
      const quotation = db.quotations?.find((q) => q.id === resourceId);
      if (!quotation) return { allowed: false, code: "NOT_FOUND", message: "Quotation not found" };

      // Author provider can read/edit
      const isAuthorProvider = quotation.provider_user_id === actorUserId;

      // Recipient organizer can read
      const rfq = db.venue_requests?.find((r) => r.id === quotation.rfq_id);
      const isRecipientOrganizer = rfq?.organizer_user_id === actorUserId;

      if (isAuthorProvider || isRecipientOrganizer) return { allowed: true, code: "OK" };

      // Competitors cannot view quotes!
      return {
        allowed: false,
        code: "FORBIDDEN",
        message: "Quotation prices and terms are strictly private between the provider and recipient organizer.",
      };
    }

    case "MESSAGE": {
      const msg = db.rfq_messages?.find((m) => m.id === resourceId);
      if (!msg) return { allowed: false, code: "NOT_FOUND", message: "Message not found" };

      const rfq = db.venue_requests?.find((r) => r.id === msg.rfq_id);
      const isParticipant =
        msg.sender_user_id === actorUserId ||
        rfq?.organizer_user_id === actorUserId ||
        rfq?.target_provider_ids?.includes(actorUserId);

      if (isParticipant) return { allowed: true, code: "OK" };
      return {
        allowed: false,
        code: "FORBIDDEN",
        message: "You are not a participant in this clarification thread.",
      };
    }

    case "BOOKING": {
      const booking = db.venue_bookings?.find((b) => b.id === resourceId);
      if (!booking) return { allowed: false, code: "NOT_FOUND", message: "Booking not found" };

      const isParty =
        booking.organizer_user_id === actorUserId ||
        booking.provider_user_id === actorUserId;

      if (isParty) return { allowed: true, code: "OK" };
      return {
        allowed: false,
        code: "FORBIDDEN",
        message: "You are not authorized to view this booking voucher.",
      };
    }

    default:
      return { allowed: false, code: "FORBIDDEN", message: "Access restricted." };
  }
}
