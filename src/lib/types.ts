export type PlatformRole = "ATTENDEE" | "ORGANIZER_OWNER" | "EVENT_MANAGER" | "CHECKIN_STAFF" | "SPONSOR" | "ADMIN" | "SUPER_ADMIN" | "VENUE_OWNER" | "VENDOR";

export interface RoleDefinition {
  id: string;
  code: string;
  name: string;
  name_bn?: string;
  description: string;
  permissions: string[];
  is_system_role: boolean;
  color_badge: string;
  icon_name: string;
  created_at: string;
  updated_at: string;
}

export type OrgMemberRole = "OWNER" | "EVENT_MANAGER" | "CHECKIN_STAFF";

export type EventStatus = "DRAFT" | "PUBLISHED" | "CANCELLED" | "SUSPENDED";
export type EventVisibility = "PUBLIC" | "UNLISTED" | "PRIVATE";

export type PackageCode = "BASIC" | "PROMOTED" | "PLUS" | "PREMIUM" | "FEATURED_ADDON";

export type OrderType = "TICKET" | "PACKAGE" | "PROMOTION" | "VENUE_BOOKING_DEPOSIT";
export type OrderStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "CANCELLED";

export type PaymentProvider = "SSLCOMMERZ_SANDBOX" | "BKASH_SANDBOX" | "NAGAD_SANDBOX";
export type PaymentStatus = "INITIATED" | "VERIFIED" | "FAILED" | "REFUNDED";

export type TicketStatus = "VALID" | "USED" | "CANCELLED" | "TRANSFERRED";
export type CheckInScanResult =
  | "VALID"
  | "ALREADY_USED"
  | "INVALID"
  | "CANCELLED"
  | "GATE_CLOSED_EXPIRED"
  | "GATE_NOT_OPEN"
  | "INVALID_EVENT";

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  phone: string;
  avatar_url?: string;
  platform_role: PlatformRole;
  organization_label?: string;
  status?: "ACTIVE" | "SUSPENDED";
  mfa_enabled: boolean;
  interests: string[];
  preferred_city: string;
  created_at: string;
}

export interface Organization {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string;
  verified_badge: boolean;
  brand_color: string;
  custom_domain?: string;
  custom_domain_status: "NONE" | "PENDING_DNS" | "VERIFIED" | "ERROR";
  custom_domain_dns_target: string;
  status: "ACTIVE" | "SUSPENDED";
  created_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrgMemberRole;
  status: "ACTIVE" | "INVITED" | "REVOKED";
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  name_bn: string;
  slug: string;
  icon: string;
  active: boolean;
}

export interface Venue {
  id: string;
  organization_id: string;
  name: string;
  address: string;
  city: "Dhaka" | "Chattogram" | "Sylhet" | "Rajshahi" | "Khulna" | "Online";
  geo_lat?: number;
  geo_lng?: number;
}

export interface AgendaItem {
  time: string;
  title: string;
  speaker?: string;
}

export interface SpeakerItem {
  name: string;
  role: string;
  org: string;
}

export interface EventRecord {
  id: string;
  organization_id: string;
  organizer_user_id?: string;
  category_id: string;
  venue_id: string | null;
  title: string;
  slug: string;
  tagline: string;
  description: string;
  status: EventStatus;
  visibility: EventVisibility;
  starts_at: string;
  ends_at: string;
  timezone: string;
  capacity: number;
  is_online: boolean;
  online_url?: string;
  cover_gradient: string;
  brand_theme: string;
  agenda: AgendaItem[];
  speakers: SpeakerItem[];
  tags: string[];
  package_code: PackageCode | null;
  is_featured: boolean;
  views_count: number;
  saves_count: number;
  refund_policy: string;
  contact_email: string;
  created_at: string;
  updated_at: string;
}

export interface EventMedia {
  id: string;
  event_id: string;
  storage_key: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  media_type: "COVER" | "GALLERY" | "DOCUMENT";
  sort_order: number;
}

export interface PackageTier {
  id: string;
  code: PackageCode;
  name: string;
  name_bn: string;
  price_minor: number; // in paisa (100 paisa = 1 BDT)
  currency: "BDT";
  summary: string;
  features: string[];
  is_addon?: boolean;
  active: boolean;
}

export interface PackagePurchase {
  id: string;
  event_id: string;
  package_id: string;
  package_code: PackageCode;
  order_id: string;
  status: "PENDING" | "ACTIVE" | "EXPIRED" | "REVOKED";
  activated_at: string | null;
  expires_at: string | null;
}

export interface TicketType {
  id: string;
  event_id: string;
  name: string;
  description: string;
  price_minor: number;
  currency: "BDT";
  capacity: number;
  sold_count: number;
  sales_start: string;
  sales_end: string;
}

export interface Registration {
  id: string;
  event_id: string;
  user_id: string | null;
  order_id: string | null;
  ticket_type_id: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string;
  institute_or_company: string;
  marketing_consent: boolean;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "WAITLISTED";
  campaign_code?: string;
  created_at: string;
}

export interface Order {
  id: string;
  buyer_user_id: string | null;
  event_id: string;
  order_type: OrderType;
  status: OrderStatus;
  subtotal_minor: number;
  fee_minor: number;
  total_minor: number;
  currency: "BDT";
  idempotency_key: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone?: string;
  institute_or_company?: string;
  campaign_code?: string;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  ticket_type_id: string | null;
  package_id: string | null;
  description: string;
  quantity: number;
  unit_price_minor: number;
  line_total_minor: number;
}

export interface PaymentRecord {
  id: string;
  order_id: string;
  provider: PaymentProvider;
  provider_reference: string;
  webhook_event_id: string;
  amount_minor: number;
  currency: "BDT";
  status: PaymentStatus;
  verified_at: string | null;
  created_at: string;
}

export interface TicketRecord {
  id: string;
  registration_id: string;
  event_id: string;
  ticket_type_id: string;
  attendee_name: string;
  attendee_email: string;
  ticket_type_name: string;
  qr_token: string; // High-entropy raw credential presented only to ticket owner
  token_hash: string; // SHA-256 stored hash for verification
  status: TicketStatus;
  issued_at: string;
}

export interface CheckInRecord {
  id: string;
  ticket_id: string;
  event_id: string;
  staff_user_id: string;
  staff_name: string;
  checked_in_at: string;
}

export interface PromotionRecord {
  id: string;
  event_id: string;
  type: "FEATURED_ADDON" | "BOOSTED_LISTING" | "HERO_SPOTLIGHT";
  starts_at: string;
  ends_at: string;
  purchase_id: string;
  status: "PENDING" | "ACTIVE" | "EXPIRED";
}

export interface CampaignLink {
  id: string;
  event_id: string;
  code: string;
  source: string;
  medium: string;
  campaign: string;
  clicks: number;
  conversions: number;
  revenue_minor: number;
  created_by: string;
  created_at: string;
}

export interface AttributionRecord {
  id: string;
  campaign_link_id: string;
  registration_id: string | null;
  order_id: string | null;
  attributed_at: string;
  model: "LAST_TOUCH";
}

export interface EntitlementRecord {
  id: string;
  organization_id: string;
  event_id: string;
  feature_code: string;
  package_code: PackageCode;
  valid_from: string;
  valid_until: string;
  source_purchase_id: string;
}

export interface NotificationJob {
  id: string;
  user_id: string | null;
  destination: string;
  channel: "EMAIL" | "SMS";
  template: string;
  subject: string;
  status: "QUEUED" | "SENT" | "RETRYING" | "FAILED";
  retry_count: number;
  idempotency_key: string;
  sent_at: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_name: string;
  actor_role: string;
  action: string;
  resource_type: string;
  resource_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AbuseReport {
  id: string;
  reporter_id: string;
  reporter_email: string;
  event_id: string;
  reason: string;
  details: string;
  status: "OPEN" | "RESOLVED" | "DISMISSED";
  resolution_note?: string;
  created_at: string;
}

export interface SponsorInquiry {
  id: string;
  sponsor_user_id: string;
  sponsor_name: string;
  company_name: string;
  contact_email: string;
  event_id: string;
  budget_minor: number;
  placement_tier: "TITLE_SPONSOR" | "GOLD_BOOTH" | "COMMUNITY_PARTNER";
  message: string;
  status: "PENDING" | "APPROVED" | "DECLINED";
  created_at: string;
}

export interface AnalyticsEvent {
  id: string;
  event_name:
    | "event_viewed"
    | "event_search"
    | "registration_started"
    | "registration_completed"
    | "checkout_started"
    | "payment_succeeded"
    | "ticket_checked_in";
  event_id?: string;
  order_id?: string;
  registration_id?: string;
  ticket_id?: string;
  session_id: string;
  properties: Record<string, unknown>;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// VENUE & SERVICES MARKETPLACE MODELS
// ---------------------------------------------------------------------------

export type VenueCategory =
  | "BANQUET_HALL"
  | "CONVENTION_CENTER"
  | "HOTEL"
  | "ROOFTOP"
  | "RESTAURANT"
  | "OUTDOOR_GARDEN"
  | "RESORT"
  | "CONFERENCE_ROOM"
  | "AUDITORIUM"
  | "EXHIBITION_SPACE"
  | "UNIVERSITY_VENUE"
  | "INNOVATION_HUB";

export interface VenueProfile {
  id: string;
  owner_user_id: string;
  organization_id?: string;
  name: string;
  slug: string;
  description?: string;
  category: VenueCategory;
  address: string;
  city: "Dhaka" | "Chattogram" | "Sylhet" | "Rajshahi" | "Khulna";
  area: string;
  capacity: { min: number; max: number };
  indoor_outdoor: "INDOOR" | "OUTDOOR" | "HYBRID";
  indicative_pricing: {
    hourly_rate_bdt: number;
    daily_rate_bdt: number;
    currency: "BDT";
  };
  amenities: {
    has_ac: boolean;
    has_parking: boolean;
    parking_capacity?: number;
    has_generator: boolean;
    has_wifi: boolean;
    in_house_catering: boolean;
    in_house_decoration: boolean;
    sound_system: boolean;
    projector_screen: boolean;
    greenroom_count: number;
  };
  media: Array<{ url: string; caption: string; is_cover: boolean }>;
  policies: {
    cancellation_rules: string;
    outside_catering_allowed: boolean;
    outside_sound_allowed: boolean;
    curfew_time?: string;
  };
  verification_status: "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED";
  rating?: number;
  review_count?: number;
  created_at: string;
  updated_at: string;
}

export type VendorCategory =
  | "CATERING"
  | "DECORATION"
  | "STAGE_SETUP"
  | "SOUND_SYSTEM"
  | "LIGHTING"
  | "PHOTOGRAPHY"
  | "VIDEOGRAPHY"
  | "EQUIPMENT_RENTAL"
  | "FURNITURE_RENTAL"
  | "SECURITY"
  | "TRANSPORTATION"
  | "CLEANING"
  | "EVENT_MANAGEMENT"
  | "OTHER";

export interface VendorServiceListing {
  id: string;
  vendor_user_id: string;
  title: string;
  category: VendorCategory;
  cities_served: string[];
  base_price_bdt: number;
  unit: "PER_EVENT" | "PER_PERSON" | "PER_HOUR" | "PER_DAY";
  portfolio_images: string[];
  packages: Array<{
    name: string;
    description: string;
    price_bdt: number;
    deliverables: string[];
  }>;
  verification_status: "PENDING" | "VERIFIED" | "REJECTED";
  rating?: number;
  review_count?: number;
  created_at: string;
}

export type RFQStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "RESPONSES_PENDING"
  | "ACCEPTED"
  | "EXPIRED"
  | "CANCELLED";

export interface VenueRequest {
  id: string;
  organizer_user_id: string;
  linked_event_id?: string;
  event_title: string;
  event_type: string;
  description: string;
  event_date: string;
  alternative_date?: string;
  start_time: string;
  end_time: string;
  expected_guests: number;
  location_requirements: {
    city: string;
    preferred_areas: string[];
    venue_category?: VenueCategory;
    indoor_outdoor: "INDOOR" | "OUTDOOR" | "ANY";
    required_facilities: string[];
  };
  budget: {
    total_budget_bdt: number;
    venue_only_budget_bdt?: number;
    services_budget_bdt?: number;
    flexible: boolean;
  };
  additional_services: Array<{
    category: VendorCategory;
    description: string;
    quantity?: number;
    estimated_budget_bdt?: number;
  }>;
  target_provider_ids: string[];
  attachments: Array<{ url: string; name: string; file_type: string }>;
  status: RFQStatus;
  created_at: string;
  updated_at: string;
}

export type QuotationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "VIEWED"
  | "CLARIFICATION_REQUESTED"
  | "REVISION_REQUESTED"
  | "REVISED"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED"
  | "WITHDRAWN";

export interface QuotationLineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price_bdt: number;
  total_bdt: number;
  category: "VENUE_RENTAL" | "SERVICE" | "EQUIPMENT" | "LOGISTICS" | "TAX" | "DISCOUNT";
}

export interface Quotation {
  id: string;
  rfq_id: string;
  provider_user_id: string;
  provider_type: "VENUE_OWNER" | "SERVICE_VENDOR";
  provider_name: string;
  venue_id?: string;
  service_id?: string;
  status: QuotationStatus;
  revision_number: number;
  valid_until: string;
  line_items: QuotationLineItem[];
  subtotal_bdt: number;
  discount_bdt: number;
  tax_bdt: number;
  grand_total_bdt: number;
  inclusions: string[];
  exclusions: string[];
  setup_charges_bdt: number;
  transport_charges_bdt: number;
  payment_terms: {
    deposit_percentage: number;
    deposit_due_days_before: number;
    final_payment_due: "EVENT_DAY" | "BEFORE_EVENT" | "POST_EVENT";
  };
  cancellation_policy: string;
  terms_conditions: string;
  created_at: string;
  updated_at: string;
}

export interface QuotationRevision {
  id: string;
  quotation_id: string;
  revision_number: number;
  snapshot: Quotation;
  change_notes: string;
  created_at: string;
}

export interface RFQMessage {
  id: string;
  rfq_id: string;
  quotation_id?: string;
  sender_user_id: string;
  sender_role: "ORGANIZER" | "PROVIDER";
  message_text: string;
  attachments?: Array<{ url: string; name: string }>;
  is_clarification_prompt?: boolean;
  read: boolean;
  created_at: string;
}

export type BookingStatus =
  | "PENDING_CONFIRMATION"
  | "CONFIRMED"
  | "DEPOSIT_PENDING"
  | "PARTIALLY_PAID"
  | "PAID"
  | "COMPLETED"
  | "CANCELLED"
  | "DISPUTED";

export interface VenueBooking {
  id: string;
  rfq_id: string;
  accepted_quotation_id: string;
  organizer_user_id: string;
  provider_user_id: string;
  venue_id?: string;
  service_id?: string;
  event_date: string;
  total_agreed_bdt: number;
  deposit_required_bdt: number;
  deposit_paid_bdt: number;
  status: BookingStatus;
  payment_reference_id?: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface AIAssistantMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  extracted_rfq?: Partial<VenueRequest>;
  quote_comparison?: {
    cheapest_quote_id?: string;
    best_value_quote_id?: string;
    tradeoffs: string[];
  };
  created_at: string;
}

export interface AIAssistantSession {
  id: string;
  user_id: string;
  session_type: "REQUIREMENT_BUILDER" | "QUOTE_EXPLANATION" | "NEGOTIATION_DRAFT" | "BUDGET_ADVICE";
  rfq_id?: string;
  quotation_ids?: string[];
  messages: AIAssistantMessage[];
  created_at: string;
  updated_at: string;
}

export interface DatabaseState {
  profiles: Profile[];
  organizations: Organization[];
  organization_members: OrganizationMember[];
  categories: Category[];
  venues: Venue[];
  events: EventRecord[];
  event_media: EventMedia[];
  packages: PackageTier[];
  package_purchases: PackagePurchase[];
  ticket_types: TicketType[];
  registrations: Registration[];
  orders: Order[];
  order_items: OrderItem[];
  payments: PaymentRecord[];
  tickets: TicketRecord[];
  check_ins: CheckInRecord[];
  promotions: PromotionRecord[];
  campaign_links: CampaignLink[];
  attributions: AttributionRecord[];
  subscriptions_or_entitlements: EntitlementRecord[];
  notifications: NotificationJob[];
  audit_logs: AuditLog[];
  reports: AbuseReport[];
  sponsor_inquiries: SponsorInquiry[];
  analytics_events: AnalyticsEvent[];
  venue_profiles: VenueProfile[];
  vendor_services: VendorServiceListing[];
  venue_requests: VenueRequest[];
  quotations: Quotation[];
  quotation_revisions: QuotationRevision[];
  rfq_messages: RFQMessage[];
  venue_bookings: VenueBooking[];
  ai_sessions: AIAssistantSession[];
  roles: RoleDefinition[];
}

