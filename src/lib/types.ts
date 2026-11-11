export type PlatformRole = "ATTENDEE" | "ORGANIZER_OWNER" | "EVENT_MANAGER" | "CHECKIN_STAFF" | "SPONSOR" | "ADMIN";

export type OrgMemberRole = "OWNER" | "EVENT_MANAGER" | "CHECKIN_STAFF";

export type EventStatus = "DRAFT" | "PUBLISHED" | "CANCELLED" | "SUSPENDED";
export type EventVisibility = "PUBLIC" | "UNLISTED" | "PRIVATE";

export type PackageCode = "BASIC" | "PROMOTED" | "PLUS" | "PREMIUM" | "FEATURED_ADDON";

export type OrderType = "TICKET" | "PACKAGE" | "PROMOTION";
export type OrderStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "CANCELLED";

export type PaymentProvider = "SSLCOMMERZ_SANDBOX" | "BKASH_SANDBOX" | "NAGAD_SANDBOX";
export type PaymentStatus = "INITIATED" | "VERIFIED" | "FAILED" | "REFUNDED";

export type TicketStatus = "VALID" | "USED" | "CANCELLED";
export type CheckInScanResult = "VALID" | "ALREADY_USED" | "INVALID" | "CANCELLED";

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  phone: string;
  avatar_url?: string;
  platform_role: PlatformRole;
  organization_label?: string;
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
}

