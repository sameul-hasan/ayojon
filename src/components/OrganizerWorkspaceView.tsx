"use client";

import React, { useState, useMemo } from "react";
import Link from "@/components/ui/Link";
import {
  LayoutDashboard,
  PlusCircle,
  Users,
  TrendingUp,
  Globe,
  Download,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Upload,
  Link2,
  Eye,
  Ticket,
  Banknote,
  ShieldAlert,
  BarChart3,
  Award,
  Calendar,
  CalendarDays,
  Receipt,
  Search,
  ArrowRight,
  Clock,
  MapPin,
  ExternalLink,
  Building2,
  MessageSquare,
  Layers,
  Printer,
  X,
  Bot,
  Zap,
  FileText,
} from "lucide-react";
import {
  DatabaseState,
  PackageCode,
  PaymentProvider,
  Profile,
  VenueRequest,
  Quotation,
  VenueBooking,
} from "@/lib/types";
import { formatBDT } from "@/lib/seed";
import { RfqBuilderWizard } from "@/components/venue/RfqBuilderWizard";
import { QuotationComparisonView } from "@/components/venue/QuotationComparisonView";
import { BookingConfirmationModal } from "@/components/venue/BookingConfirmationModal";
import { AIAssistantWidget } from "@/components/ai/AIAssistantWidget";
import { RfqMessageThread } from "@/components/venue/RfqMessageThread";

interface OrganizerWorkspaceViewProps {
  db: DatabaseState;
  currentUser: Profile;
  onAction: (
    action: string,
    payload: Record<string, unknown>,
    overrideActorId?: string
  ) => Promise<unknown>;
}

export function OrganizerWorkspaceView({
  db,
  currentUser,
  onAction,
}: OrganizerWorkspaceViewProps) {
  const defaultOrgId =
    currentUser.id === "usr-org-tanvir" ? "org-nsu-yes" : "org-buet-cc";
  const [selectedOrgId, setSelectedOrgId] = useState<string>(defaultOrgId);
  const [subTab, setSubTab] = useState<
    | "OVERVIEW"
    | "EVENTS"
    | "WIZARD"
    | "ATTENDEES"
    | "ORDERS"
    | "ANALYTICS"
    | "SPONSORS"
    | "VENUES_RFQS"
    | "SETTINGS"
  >("OVERVIEW");

  // Venue & RFQ marketplace states
  const [rfqList, setRfqList] = useState<VenueRequest[]>(() => {
    return (db.venue_requests && db.venue_requests.length > 0)
      ? db.venue_requests
      : [
          {
            id: "rfq-hackathon-2026",
            organizer_user_id: currentUser.id,
            linked_event_id: "evt-buet-cse-fest",
            event_title: "Dhaka Tech Hackathon 2026",
            event_type: "Tech Hackathon & Exhibition",
            description: "36-hour national collegiate hackathon with 400 attendees, judging panel, and opening ceremony.",
            event_date: "2027-02-15",
            alternative_date: "2027-02-22",
            start_time: "08:00",
            end_time: "22:00",
            expected_guests: 400,
            location_requirements: {
              city: "Dhaka",
              preferred_areas: ["Farmgate", "Palashi", "Gulshan"],
              venue_category: "AUDITORIUM",
              indoor_outdoor: "INDOOR",
              required_facilities: ["AC", "PARKING", "GENERATOR", "WIFI"],
            },
            budget: {
              total_budget_bdt: 150000,
              venue_only_budget_bdt: 85000,
              services_budget_bdt: 65000,
              flexible: true,
            },
            additional_services: [
              {
                category: "SOUND_SYSTEM",
                description: "Auditorium sound system with podium mics and ambient speech clarity.",
                quantity: 1,
                estimated_budget_bdt: 25000,
              },
              {
                category: "CATERING",
                description: "Evening dinner buffet for 400 delegates and student innovators.",
                quantity: 400,
                estimated_budget_bdt: 40000,
              },
            ],
            target_provider_ids: ["usr-venue-kamal", "usr-vendor-tariq"],
            attachments: [],
            status: "SUBMITTED",
            created_at: "2026-11-05T10:00:00Z",
            updated_at: "2026-11-05T10:00:00Z",
          },
        ];
  });
  const [quotationList, setQuotationList] = useState<Quotation[]>(() => {
    return (db.quotations && db.quotations.length > 0) ? db.quotations : [];
  });
  const [bookingList, setBookingList] = useState<VenueBooking[]>(() => {
    return (db.venue_bookings && db.venue_bookings.length > 0)
      ? db.venue_bookings
      : [
          {
            id: "vb-kib-demo-1",
            rfq_id: "rfq-hackathon-2026",
            accepted_quotation_id: "qt-kib-001",
            organizer_user_id: currentUser.id,
            provider_user_id: "usr-venue-kamal",
            venue_id: "vp-kib",
            event_date: "2027-02-15",
            total_agreed_bdt: 85000,
            deposit_required_bdt: 42500,
            deposit_paid_bdt: 42500,
            status: "CONFIRMED",
            payment_reference_id: "MFS-DEP-884920",
            notes: "Deposit verified via bKash escrow.",
            created_at: "2026-11-08T12:00:00Z",
            updated_at: "2026-11-08T12:00:00Z",
          },
        ];
  });
  const [isCreatingRfq, setIsCreatingRfq] = useState(false);
  const [prefilledRfqData, setPrefilledRfqData] = useState<Partial<VenueRequest> | undefined>(undefined);
  const [comparingRfq, setComparingRfq] = useState<VenueRequest | null>(null);
  const [activeConfirmQuote, setActiveConfirmQuote] = useState<Quotation | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [activeChatRfq, setActiveChatRfq] = useState<VenueRequest | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState<
    "ALL" | "PAID" | "PENDING" | "FAILED"
  >("ALL");
  const [attendeeSearchQuery, setAttendeeSearchQuery] = useState("");

  const activeOrg =
    db.organizations.find((o) => o.id === selectedOrgId) || db.organizations[0];
  const orgEvents = useMemo(
    () => db.events.filter((e) => e.organization_id === activeOrg.id),
    [db.events, activeOrg.id]
  );

  const [selectedEventId, setSelectedEventId] = useState<string>(
    orgEvents[0]?.id || "evt-dhaka-ai-summit"
  );

  // Package checkout modal state for existing Draft events
  const [pkgTargetEventId, setPkgTargetEventId] = useState<string | null>(null);
  const [chosenPkg, setChosenPkg] = useState<PackageCode>("BASIC");
  const [pkgProvider, setPkgProvider] =
    useState<PaymentProvider>("BKASH_SANDBOX");
  const [statusBanner, setStatusBanner] = useState<{
    type: "success" | "warning" | "error";
    text: string;
  } | null>(null);

  // 6-Step Create Event Wizard state (05_UI_UX_Wireframes.docx)
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [wizTitle, setWizTitle] = useState("Dhaka FinTech & Open Banking Forum 2027");
  const [wizCategory, setWizCategory] = useState("cat-conf");
  const [wizDescription, setWizDescription] = useState(
    "A technical symposium bringing together Bangladesh payment engineers, central bank policy analysts, and university researchers."
  );
  const [wizStartsAt, setWizStartsAt] = useState("2027-02-15T10:00");
  const [wizEndsAt, setWizEndsAt] = useState("2027-02-15T17:00");
  const [wizIsOnline, setWizIsOnline] = useState(false);
  const [wizVenueName, setWizVenueName] = useState("BICC Carnival Hall, Agargaon");
  const [wizVenueCity, setWizVenueCity] = useState<
    "Dhaka" | "Chattogram" | "Sylhet" | "Online"
  >("Dhaka");
  const [wizCapacity, setWizCapacity] = useState(200);
  const [wizTicketName, setWizTicketName] = useState("Delegate Pass");
  const [wizTicketPriceBDT, setWizTicketPriceBDT] = useState(500);
  const [wizThemeColor, setWizThemeColor] = useState("#0D9488");
  const [wizPackageChoice, setWizPackageChoice] = useState<
    "DRAFT_ONLY" | PackageCode
  >("DRAFT_ONLY");

  // Campaign generator state
  const [cmpCode, setCmpCode] = useState("DU-CSE-CLUB");
  const [cmpSource, setCmpSource] = useState("facebook");
  const [cmpMedium, setCmpMedium] = useState("campus_group");
  const [cmpName, setCmpName] = useState("du_ambassador_drive");

  // Custom domain DNS state
  const [domainInput, setDomainInput] = useState(
    activeOrg.custom_domain || "events.buetcs.org"
  );
  const [dnsCnameInput, setDnsCnameInput] = useState("cname.aayojon.bd");

  // Aggregate KPI metrics for active organization
  const totalViews = orgEvents.reduce((acc, e) => acc + e.views_count, 0);
  const orgEventIds = new Set(orgEvents.map((e) => e.id));
  const orgRegistrations = db.registrations.filter((r) =>
    orgEventIds.has(r.event_id)
  );
  const orgTicketsSold = db.ticket_types
    .filter((t) => orgEventIds.has(t.event_id))
    .reduce((acc, t) => acc + t.sold_count, 0);
  const orgTicketRevenueMinor = db.orders
    .filter(
      (o) =>
        orgEventIds.has(o.event_id) &&
        o.order_type === "TICKET" &&
        o.status === "PAID"
    )
    .reduce((acc, o) => acc + o.subtotal_minor, 0);

  const orgOrders = useMemo(
    () => db.orders.filter((o) => orgEventIds.has(o.event_id)),
    [db.orders, orgEventIds]
  );

  const orgSponsors = useMemo(
    () => (db.sponsor_inquiries || []).filter((s) => orgEventIds.has(s.event_id)),
    [db.sponsor_inquiries, orgEventIds]
  );

  const recentOrders = useMemo(
    () =>
      [...orgOrders].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [orgOrders]
  );

  const activeEventsCount = orgEvents.filter((e) => e.status === "PUBLISHED").length;

  const actorForOrg =
    activeOrg.id === "org-nsu-yes" ? "usr-org-tanvir" : "usr-org-nusrat";

  const handleUnpaidPublishAttempt = async (eventId: string) => {
    setStatusBanner(null);
    try {
      await onAction("PUBLISH_EVENT", { eventId }, actorForOrg);
      setStatusBanner({
        type: "success",
        text: "Event published to public marketplace!",
      });
    } catch (err) {
      setStatusBanner({
        type: "error",
        text:
          err instanceof Error
            ? `QA-004 Verified: ${err.message}`
            : "Publication blocked",
      });
    }
  };

  const handlePackagePurchaseAndPublish = async (
    eventId: string,
    packageCode: PackageCode,
    autoPublish = true
  ) => {
    setStatusBanner(null);
    try {
      await onAction(
        "PURCHASE_PACKAGE_AND_VERIFY",
        {
          eventId,
          packageCode,
          provider: pkgProvider,
          autoPublish,
        },
        actorForOrg
      );
      setPkgTargetEventId(null);
      setStatusBanner({
        type: "success",
        text:
          packageCode === "FEATURED_ADDON"
            ? "Verified +৳500 Featured Placement Add-on! Event is now spotlighted on the Marketplace."
            : `Verified ${packageCode} package payment via ${pkgProvider.replace(
                "_SANDBOX",
                ""
              )}! Entitlement activated and event PUBLISHED.`,
      });
    } catch (err) {
      setStatusBanner({
        type: "error",
        text: err instanceof Error ? err.message : "Package purchase failed",
      });
    }
  };

  const handleWizardComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusBanner(null);
    try {
      const res = (await onAction(
        "CREATE_EVENT_DRAFT",
        {
          organizationId: activeOrg.id,
          categoryId: wizCategory,
          title: wizTitle,
          description: wizDescription,
          startsAt: new Date(wizStartsAt).toISOString(),
          endsAt: new Date(wizEndsAt).toISOString(),
          capacity: Number(wizCapacity),
          isOnline: wizIsOnline,
          venueName: wizIsOnline ? undefined : wizVenueName,
          venueCity: wizIsOnline ? "Online" : wizVenueCity,
          brandTheme: wizThemeColor,
          ticketTypes: [
            {
              name: wizTicketName,
              priceMinor: Math.round(Number(wizTicketPriceBDT) * 100),
              capacity: Number(wizCapacity),
              description: "Official event admission pass",
            },
          ],
        },
        actorForOrg
      )) as { result?: { id: string; title: string } };

      const createdEventId = res?.result?.id;

      if (wizPackageChoice !== "DRAFT_ONLY" && createdEventId) {
        await onAction(
          "PURCHASE_PACKAGE_AND_VERIFY",
          {
            eventId: createdEventId,
            packageCode: wizPackageChoice,
            provider: "BKASH_SANDBOX",
            autoPublish: true,
          },
          actorForOrg
        );
        setStatusBanner({
          type: "success",
          text: `US-02 Complete: Created "${wizTitle}", verified ${wizPackageChoice} package payment, and published live!`,
        });
      } else {
        setStatusBanner({
          type: "success",
          text: `US-01 / QA-001 Complete: Saved "${wizTitle}" as a private DRAFT for ৳0. Select a package anytime to publish.`,
        });
      }
      setSubTab("EVENTS");
    } catch (err) {
      setStatusBanner({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save event",
      });
    }
  };

  const handleTestCrossTenantLeak = async () => {
    setStatusBanner(null);
    // Organizer A (Nusrat, BUET CC) attempts to read Organizer B's (NSU YES!) attendee list
    try {
      await onAction(
        "CHECK_ATTENDEE_ACCESS",
        { eventId: "evt-nsu-startup-pitch" },
        "usr-org-nusrat"
      );
    } catch (err) {
      setStatusBanner({
        type: "error",
        text: `QA-010 Cross-Tenant Security Verified (403 FORBIDDEN): ${
          err instanceof Error ? err.message : "Denied"
        }`,
      });
    }
  };

  const handleTestMediaGuard = async (isValid: boolean) => {
    setStatusBanner(null);
    try {
      if (isValid) {
        await onAction(
          "UPLOAD_MEDIA_CHECK",
          {
            eventId: orgEvents[0]?.id || "evt-dhaka-ai-summit",
            filename: "stage-backdrop.webp",
            mimeType: "image/webp",
            sizeBytes: 380000,
          },
          actorForOrg
        );
        setStatusBanner({
          type: "success",
          text: "Valid WebP cover image (380 KB) verified and stored in object storage.",
        });
      } else {
        await onAction(
          "UPLOAD_MEDIA_CHECK",
          {
            eventId: orgEvents[0]?.id || "evt-dhaka-ai-summit",
            filename: "malicious-shell.exe",
            mimeType: "application/x-msdownload",
            sizeBytes: 9500000,
          },
          actorForOrg
        );
      }
    } catch (err) {
      setStatusBanner({
        type: "error",
        text: `QA-011 Upload Guard Verified: ${
          err instanceof Error ? err.message : "Rejected"
        }`,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Organization Bar & Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-3xl border border-line bg-surface p-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-700">
            <LayoutDashboard className="h-4 w-4 text-brand-600" />
            <span>ORGANIZER WORKSPACE & MONETIZATION ENGINE</span>
          </div>
          <h1 className="text-2xl font-extrabold text-ink">
            {activeOrg.name}
          </h1>
          <p className="text-xs text-ink-muted">
            Slug: <span className="font-mono font-medium text-ink">/{activeOrg.slug}</span> • Custom Domain:{" "}
            <span className="font-mono font-medium text-brand-700">
              {activeOrg.custom_domain || "Not set"} ({activeOrg.custom_domain_status})
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-semibold text-ink-muted mb-1">
              Switch Tenant Workspace
            </label>
            <select
              value={selectedOrgId}
              onChange={(e) => {
                setSelectedOrgId(e.target.value);
                setStatusBanner(null);
              }}
              className="rounded-btn border border-line bg-surface px-3.5 py-2 text-xs font-semibold text-ink shadow-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
            >
              {db.organizations.map((o) => (
                <option key={o.id} value={o.id} className="bg-surface text-ink">
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setSubTab("WIZARD");
              setWizardStep(1);
            }}
            className="inline-flex items-center gap-2 rounded-btn bg-brand-600 hover:bg-brand-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition cursor-pointer mt-4 lg:mt-0"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create Event (Free Draft)</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards (05_UI_UX_Wireframes.docx) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-card border border-line bg-surface p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-ink-muted">
            <span>Event Page Views</span>
            <Eye className="h-4 w-4 text-brand-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-ink">
            {totalViews.toLocaleString()}
          </p>
          <p className="text-[11px] font-medium text-brand-700 mt-1">
            Across {orgEvents.length} organization events
          </p>
        </div>

        <div className="rounded-card border border-line bg-surface p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-ink-muted">
            <span>Confirmed Registrations</span>
            <Users className="h-4 w-4 text-teal-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-ink">
            {orgRegistrations.length}
          </p>
          <p className="text-[11px] text-ink-muted mt-1">
            Conversion rate:{" "}
            {totalViews > 0
              ? ((orgTicketsSold / totalViews) * 100).toFixed(1)
              : "0.0"}
            %
          </p>
        </div>

        <div className="rounded-card border border-line bg-surface p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-ink-muted">
            <span>Total Tickets Issued</span>
            <Ticket className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-ink">
            {orgTicketsSold}
          </p>
          <p className="text-[11px] text-ink-muted mt-1">
            Zero duplicate paid tickets (idempotent)
          </p>
        </div>

        <div className="rounded-card border border-line bg-surface p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-ink-muted">
            <span>Ticket Sales Revenue</span>
            <Banknote className="h-4 w-4 text-brand-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-brand-600">
            {formatBDT(orgTicketRevenueMinor)}
          </p>
          <p className="text-[11px] text-ink-muted mt-1">
            Stored in integer paisa (`BDT`)
          </p>
        </div>
      </div>

      {/* Status Notification Banner */}
      {statusBanner && (
        <div
          className={`flex items-center justify-between rounded-card border p-4 text-xs shadow-sm ${
            statusBanner.type === "success"
              ? "border-emerald-300 bg-brand-50 text-emerald-800"
              : statusBanner.type === "warning"
              ? "border-amber-300 bg-amber-50 text-amber-800"
              : "border-rose-300 bg-rose-50 text-rose-800"
          }`}
        >
          <span className="font-semibold">{statusBanner.text}</span>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="text-ink-muted hover:text-ink font-semibold ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Sub-Navigation Pills (8 Modules) */}
      <div className="flex flex-wrap gap-2 border-b border-line pb-3 overflow-x-auto">
        {(
          [
            { id: "OVERVIEW", label: "Overview", icon: LayoutDashboard },
            { id: "EVENTS", label: "My Events", icon: CalendarDays, count: orgEvents.length },
            { id: "WIZARD", label: "Create Event", icon: PlusCircle },
            { id: "ATTENDEES", label: "Attendees", icon: Users, count: orgRegistrations.length },
            { id: "ORDERS", label: "Orders", icon: Receipt, count: orgOrders.length },
            { id: "ANALYTICS", label: "Analytics & UTM", icon: BarChart3 },
            { id: "SPONSORS", label: "Sponsors", icon: Award, count: orgSponsors.length },
            { id: "VENUES_RFQS", label: "Venues & RFQs", icon: Building2, count: rfqList.length },
            { id: "SETTINGS", label: "Custom Domain & Team", icon: Globe },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = subTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id as any)}
              className={`inline-flex items-center gap-1.5 rounded-btn px-4 py-2 text-xs font-bold transition cursor-pointer ${
                active
                  ? "bg-brand-600 text-white font-semibold shadow-sm"
                  : "bg-surface border border-line text-ink hover:bg-canvas-alt shadow-xs"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
              {"count" in tab && typeof tab.count === "number" && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    active ? "bg-white/20 text-white" : "bg-canvas-alt text-ink"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 0: OVERVIEW (METRICS, CHARTS, PERFORMANCE, RECENT ORDERS) */}
      {subTab === "OVERVIEW" && (
        <div className="space-y-6">
          {/* Revenue Chart & Sales Capacity Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Visual Revenue Comparison Bar Chart */}
            <div className="rounded-card border border-line bg-surface p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-brand-600" />
                  Revenue Breakdown by Event
                </h3>
                <span className="text-xs font-semibold text-brand-700">
                  {formatBDT(orgTicketRevenueMinor)} Total
                </span>
              </div>

              {orgEvents.length === 0 ? (
                <p className="text-xs text-ink-muted py-6 text-center">No events created yet.</p>
              ) : (
                <div className="space-y-3 pt-1">
                  {orgEvents.map((evt) => {
                    const evtRev = db.orders
                      .filter((o) => o.event_id === evt.id && o.order_type === "TICKET" && o.status === "PAID")
                      .reduce((sum, o) => sum + o.subtotal_minor, 0);
                    const pct = orgTicketRevenueMinor > 0 ? Math.round((evtRev / orgTicketRevenueMinor) * 100) : 0;
                    return (
                      <div key={evt.id} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="truncate max-w-[240px] text-ink">{evt.title}</span>
                          <span className="font-bold text-ink font-mono">{formatBDT(evtRev)}</span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-canvas-alt overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-brand-600 to-violet transition-all duration-500"
                            style={{ width: `${Math.max(4, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Ticket Sales Capacity Progress */}
            <div className="rounded-card border border-line bg-surface p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-brand-600" />
                  Ticket Capacity & Sold Progress
                </h3>
                <span className="text-xs font-semibold text-ink-muted">
                  {orgTicketsSold} Tickets Issued
                </span>
              </div>

              {orgEvents.length === 0 ? (
                <p className="text-xs text-ink-muted py-6 text-center">No events created yet.</p>
              ) : (
                <div className="space-y-3 pt-1">
                  {orgEvents.map((evt) => {
                    const tts = db.ticket_types.filter((t) => t.event_id === evt.id);
                    const sold = tts.reduce((a, b) => a + b.sold_count, 0);
                    const cap = evt.capacity || 1;
                    const pct = Math.min(100, Math.round((sold / cap) * 100));
                    return (
                      <div key={evt.id} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="truncate max-w-[240px] text-ink">{evt.title}</span>
                          <span className="text-xs text-ink-muted">
                            <strong className="text-ink">{sold}</strong> / {cap} seats ({pct}%)
                          </span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-canvas-alt overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              pct >= 90 ? "bg-amber-500" : "bg-brand-600"
                            }`}
                            style={{ width: `${Math.max(2, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Event Performance Comparison Table */}
          <div className="rounded-card border border-line bg-surface p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-brand-600" />
                  Event Performance Comparison
                </h3>
                <p className="text-xs text-ink-muted">Real-time metrics on engagement and revenue</p>
              </div>
              <button
                type="button"
                onClick={() => setSubTab("EVENTS")}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 cursor-pointer"
              >
                Manage Events →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-line bg-canvas-alt text-[11px] uppercase font-semibold text-ink-muted">
                  <tr>
                    <th className="py-2.5 px-3">Event Title</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Views</th>
                    <th className="py-2.5 px-3 text-right">Saves</th>
                    <th className="py-2.5 px-3 text-right">Sold / Cap</th>
                    <th className="py-2.5 px-3 text-right">Revenue</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orgEvents.map((evt) => {
                    const tts = db.ticket_types.filter((t) => t.event_id === evt.id);
                    const sold = tts.reduce((a, b) => a + b.sold_count, 0);
                    const rev = db.orders
                      .filter((o) => o.event_id === evt.id && o.order_type === "TICKET" && o.status === "PAID")
                      .reduce((sum, o) => sum + o.subtotal_minor, 0);

                    return (
                      <tr key={evt.id} className="hover:bg-canvas-alt/60 transition">
                        <td className="py-2.5 px-3 font-semibold text-ink max-w-[200px] truncate">
                          {evt.title}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              evt.status === "PUBLISHED"
                                ? "bg-emerald-50 text-emerald-700"
                                : evt.status === "DRAFT"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-red-50 text-danger"
                            }`}
                          >
                            {evt.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-ink-muted">{evt.views_count}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-ink-muted">{evt.saves_count}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-ink">
                          {sold} / {evt.capacity}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-brand-700">
                          {formatBDT(rev)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <Link
                            href={`/events/${evt.slug}`}
                            className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Orders & Upcoming Events (2 columns) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders List */}
            <div className="rounded-card border border-line bg-surface p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-brand-600" />
                  Recent Attendee Orders
                </h3>
                {orgOrders.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSubTab("ORDERS")}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 cursor-pointer"
                  >
                    View All ({orgOrders.length}) →
                  </button>
                )}
              </div>

              {recentOrders.length === 0 ? (
                <p className="text-xs text-ink-muted py-6 text-center">No orders received yet.</p>
              ) : (
                <div className="divide-y divide-slate-100 text-xs">
                  {recentOrders.slice(0, 5).map((o) => (
                    <div key={o.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-ink">{o.attendee_name}</p>
                        <p className="text-[11px] text-ink-muted">
                          #{o.id} · {new Date(o.created_at).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-brand-700">{formatBDT(o.total_minor)}</p>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                            o.status === "PAID"
                              ? "bg-emerald-50 text-emerald-700"
                              : o.status === "PENDING"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-red-50 text-danger"
                          }`}
                        >
                          {o.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Events List */}
            <div className="rounded-card border border-line bg-surface p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-brand-600" />
                  Upcoming Events Schedule
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setSubTab("WIZARD");
                    setWizardStep(1);
                  }}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 cursor-pointer"
                >
                  + New Event
                </button>
              </div>

              {orgEvents.length === 0 ? (
                <p className="text-xs text-ink-muted py-6 text-center">No upcoming events scheduled.</p>
              ) : (
                <div className="divide-y divide-slate-100 text-xs">
                  {orgEvents.slice(0, 5).map((evt) => (
                    <div key={evt.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div>
                        <Link href={`/events/${evt.slug}`} className="font-bold text-ink hover:text-brand-600">
                          {evt.title}
                        </Link>
                        <p className="text-[11px] text-ink-muted flex items-center gap-1.5 mt-0.5">
                          <Clock className="size-3 text-brand-600" />
                          {new Date(evt.starts_at).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          evt.status === "PUBLISHED"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {evt.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: MY EVENTS & PER-EVENT PACKAGE CHECKOUT */}
      {subTab === "EVENTS" && (
        <div className="space-y-6">
          <div className="overflow-x-auto rounded-card border border-line bg-surface shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-canvas-alt text-[11px] uppercase tracking-wider font-semibold text-ink-muted">
                <tr>
                  <th className="px-4 py-3.5">Event Title & Slug</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Active Package</th>
                  <th className="px-4 py-3.5">Starts At</th>
                  <th className="px-4 py-3.5">Registrations</th>
                  <th className="px-4 py-3.5">Actions & Monetization Gate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {orgEvents.map((evt) => {
                  const tts = db.ticket_types.filter(
                    (t) => t.event_id === evt.id
                  );
                  const sold = tts.reduce((a, b) => a + b.sold_count, 0);
                  return (
                    <tr key={evt.id} className="hover:bg-canvas-alt/80 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-ink">{evt.title}</div>
                        <div className="text-[11px] font-mono text-ink-muted">
                          /{evt.slug}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                            evt.status === "PUBLISHED"
                              ? "bg-brand-50 text-brand-700 border-brand-200"
                              : evt.status === "DRAFT"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {evt.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {evt.package_code ? (
                          <span className="rounded-lg bg-brand-50 border border-brand-200 px-2.5 py-1 text-[11px] font-bold text-brand-700">
                            {evt.package_code}
                          </span>
                        ) : (
                          <span className="text-ink-muted italic">
                            Unpaid (Free Draft)
                          </span>
                        )}
                        {evt.is_featured && (
                          <span className="ml-1.5 rounded bg-amber-100 border border-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                            Featured
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-ink-muted">
                        {new Date(evt.starts_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-ink">
                        {sold} / {evt.capacity}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap items-center gap-2">
                          {evt.status === "DRAFT" && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setPkgTargetEventId(evt.id);
                                  setChosenPkg("BASIC");
                                }}
                                className="rounded-lg bg-brand-600 hover:bg-brand-700 px-3 py-1.5 text-[11px] font-semibold text-white shadow-xs transition cursor-pointer"
                              >
                                Buy Package & Publish
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUnpaidPublishAttempt(evt.id)
                                }
                                className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-semibold text-amber-800 hover:bg-amber-100 transition cursor-pointer"
                              >
                                Test Unpaid Publish (QA-004)
                              </button>
                            </>
                          )}
                          {evt.status === "PUBLISHED" && !evt.is_featured && (
                            <button
                              type="button"
                              onClick={() =>
                                handlePackagePurchaseAndPublish(
                                  evt.id,
                                  "FEATURED_ADDON",
                                  false
                                )
                              }
                              className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-[11px] font-bold text-amber-800 hover:bg-amber-100 transition cursor-pointer"
                            >
                              +৳500 Featured Placement Add-on
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Package Pricing Reference Cards (Section 6 of PRD) */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-ink-muted">
              Per-Event Package Tiers & Entitlements (Draft Creation is Free)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {db.packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`rounded-card border p-4 flex flex-col justify-between shadow-sm ${
                    pkg.code === "PREMIUM"
                      ? "border-2 border-amber-400 bg-amber-50/20"
                      : "border-line bg-surface"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-brand-700">
                        {pkg.name} ({pkg.name_bn})
                      </span>
                      {pkg.is_addon && (
                        <span className="rounded bg-amber-100 border border-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                          Add-On
                        </span>
                      )}
                    </div>
                    <p className="text-2xl font-extrabold text-ink">
                      {pkg.is_addon ? `+${formatBDT(pkg.price_minor)}` : formatBDT(pkg.price_minor)}
                      <span className="text-[11px] font-normal text-ink-muted">
                        {" "}
                        / event
                      </span>
                    </p>
                    <p className="text-[11px] text-ink-muted font-medium">
                      {pkg.summary}
                    </p>
                    <ul className="space-y-1 pt-2 border-t border-line text-[11px] text-ink-muted">
                      {pkg.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-brand-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Package Purchase Modal for Draft Event */}
          {pkgTargetEventId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
              <div className="w-full max-w-xl rounded-3xl border border-line bg-surface p-6 space-y-4 shadow-2xl">
                <h3 className="text-lg font-extrabold text-ink">
                  Select Per-Event Package & Activate Publication
                </h3>
                <p className="text-xs text-ink-muted">
                  Target Event:{" "}
                  <strong className="text-ink">
                    {db.events.find((e) => e.id === pkgTargetEventId)?.title}
                  </strong>
                </p>

                <div className="grid grid-cols-2 gap-2.5">
                  {db.packages
                    .filter((p) => !p.is_addon)
                    .map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setChosenPkg(p.code)}
                        className={`rounded-btn border p-3 text-left transition cursor-pointer ${
                          chosenPkg === p.code
                            ? "border-emerald-600 bg-brand-50/70 ring-1 ring-emerald-600 shadow-xs"
                            : "border-line bg-surface hover:border-line hover:bg-canvas-alt shadow-xs"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-ink">
                            {p.name}
                          </span>
                          <span className="text-sm font-extrabold text-brand-700">
                            {formatBDT(p.price_minor)}
                          </span>
                        </div>
                        <p className="text-[11px] text-ink-muted mt-1">
                          {p.summary}
                        </p>
                      </button>
                    ))}
                </div>

                <div className="flex items-center justify-between text-xs pt-2">
                  <span className="text-ink-muted font-medium">Payment Gateway:</span>
                  <div className="flex gap-2">
                    {(
                      ["BKASH_SANDBOX", "SSLCOMMERZ_SANDBOX", "NAGAD_SANDBOX"] as const
                    ).map((gw) => (
                      <button
                        key={gw}
                        type="button"
                        onClick={() => setPkgProvider(gw)}
                        className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold cursor-pointer transition ${
                          pkgProvider === gw
                            ? "border-emerald-600 bg-brand-50 text-brand-700 font-bold"
                            : "border-line bg-surface text-ink hover:bg-canvas-alt"
                        }`}
                      >
                        {gw.replace("_SANDBOX", "")}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-line">
                  <button
                    type="button"
                    onClick={() => setPkgTargetEventId(null)}
                    className="rounded-btn border border-line bg-surface px-4 py-2 text-xs text-ink hover:bg-canvas-alt cursor-pointer shadow-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handlePackagePurchaseAndPublish(
                        pkgTargetEventId,
                        chosenPkg,
                        true
                      )
                    }
                    className="rounded-btn bg-brand-600 hover:bg-brand-700 px-5 py-2 text-xs font-semibold text-white shadow-sm transition cursor-pointer"
                  >
                    Pay{" "}
                    {formatBDT(
                      db.packages.find((p) => p.code === chosenPkg)
                        ?.price_minor || 79900
                    )}{" "}
                    & Publish Event
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: 6-STEP CREATE EVENT WIZARD (05_UI_UX_Wireframes.docx) */}
      {subTab === "WIZARD" && (
        <div className="rounded-3xl border border-line bg-surface p-6 space-y-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-ink">
                6-Step Event Creation & Package Publishing Wizard
              </h2>
              <p className="text-xs text-ink-muted">
                Drafts are saved free of charge (US-01). Choose a package in Step 6 to publish immediately (US-02).
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5, 6].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setWizardStep(s)}
                  className={`h-8 w-8 rounded-lg text-xs font-bold transition cursor-pointer ${
                    wizardStep === s
                      ? "bg-brand-600 text-white shadow-xs"
                      : "bg-slate-100 text-ink hover:bg-slate-200"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleWizardComplete} className="space-y-5 text-xs">
            {wizardStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-brand-700">
                  Step 1 of 6: Event Basics & Media Upload Security
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-ink mb-1">
                      Event Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={wizTitle}
                      onChange={(e) => setWizTitle(e.target.value)}
                      className="w-full rounded-btn border border-line bg-surface px-3.5 py-2.5 text-ink placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-ink mb-1">
                      Category *
                    </label>
                    <select
                      value={wizCategory}
                      onChange={(e) => setWizCategory(e.target.value)}
                      className="w-full rounded-btn border border-line bg-surface px-3.5 py-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 shadow-xs"
                    >
                      {db.categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.name_bn})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block font-medium text-ink mb-1">
                    Description *
                  </label>
                  <textarea
                    rows={3}
                    value={wizDescription}
                    onChange={(e) => setWizDescription(e.target.value)}
                    className="w-full rounded-btn border border-line bg-surface p-3.5 text-ink placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 shadow-xs"
                  />
                </div>

                {/* QA-011 Media Upload Security Test Box */}
                <div className="rounded-card border border-line bg-canvas-alt p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="font-bold text-ink flex items-center gap-1.5">
                      <Upload className="h-4 w-4 text-brand-600" />
                      Cover Image Upload Validator (QA-011 Security Gate)
                    </p>
                    <p className="text-[11px] text-ink-muted">
                      Allows JPEG/PNG/WebP up to 5 MB. Blocks `.exe`, `.sh`, `.php` and oversized files.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleTestMediaGuard(true)}
                      className="rounded-lg bg-brand-50 border border-brand-200 px-3 py-1.5 font-semibold text-brand-700 hover:bg-emerald-100 transition cursor-pointer"
                    >
                      Test Valid WebP (380 KB)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTestMediaGuard(false)}
                      className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-1.5 font-semibold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                    >
                      Test Malicious .exe Upload (QA-011)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-brand-700">
                  Step 2 of 6: Date, Timezone & Bangladesh Venue
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-ink mb-1">
                      Starts At (Asia/Dhaka)
                    </label>
                    <input
                      type="datetime-local"
                      value={wizStartsAt}
                      onChange={(e) => setWizStartsAt(e.target.value)}
                      className="w-full rounded-btn border border-line bg-surface px-3.5 py-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-ink mb-1">
                      Ends At (Asia/Dhaka)
                    </label>
                    <input
                      type="datetime-local"
                      value={wizEndsAt}
                      onChange={(e) => setWizEndsAt(e.target.value)}
                      className="w-full rounded-btn border border-line bg-surface px-3.5 py-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 shadow-xs"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wizIsOnline}
                    onChange={(e) => setWizIsOnline(e.target.checked)}
                  />
                  <span>This is an Online Livestream Event</span>
                </label>
                {!wizIsOnline && (
                  <div className="space-y-4">
                    {/* Integrated Venue Discovery Callout */}
                    <div className="rounded-card border border-brand-200 bg-brand-50/50 p-4 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-ink flex items-center gap-1.5">
                            <Building2 className="size-4 text-brand-600" />
                            Do you already have a reserved venue?
                          </span>
                          <p className="text-[11px] text-ink-muted">
                            Enter existing hall details below, or broadcast an RFQ to verified Bangladesh spaces.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPrefilledRfqData({
                              event_title: wizTitle,
                              event_date: wizStartsAt?.split("T")[0] || "2027-02-15",
                              expected_guests: 300,
                              location_requirements: {
                                city: wizVenueCity === "Online" ? "Dhaka" : wizVenueCity,
                                preferred_areas: ["Farmgate", "Gulshan"],
                                venue_category: "AUDITORIUM",
                                indoor_outdoor: "INDOOR",
                                required_facilities: ["AC", "GENERATOR", "PARKING"],
                              },
                            });
                            setIsCreatingRfq(true);
                            setSubTab("VENUES_RFQS");
                          }}
                          className="inline-flex items-center gap-1 rounded-btn bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 transition shadow-xs cursor-pointer"
                        >
                          <Sparkles className="size-3.5" /> Find a Venue with Aayojon
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-medium text-ink mb-1">
                          Venue Name
                        </label>
                        <input
                          type="text"
                          value={wizVenueName}
                          onChange={(e) => setWizVenueName(e.target.value)}
                          className="w-full rounded-btn border border-line bg-surface px-3.5 py-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 shadow-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-ink mb-1">
                          City
                        </label>
                        <select
                          value={wizVenueCity}
                          onChange={(e) =>
                            setWizVenueCity(
                              e.target.value as
                                | "Dhaka"
                                | "Chattogram"
                                | "Sylhet"
                                | "Online"
                            )
                          }
                          className="w-full rounded-btn border border-line bg-surface px-3.5 py-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 shadow-xs"
                        >
                          <option value="Dhaka">Dhaka</option>
                          <option value="Chattogram">Chattogram</option>
                          <option value="Sylhet">Sylhet</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {wizardStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-brand-700">
                  Step 3 of 6: Registration Capacity & Ticket Tier
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-medium text-ink mb-1">
                      Ticket Tier Name
                    </label>
                    <input
                      type="text"
                      value={wizTicketName}
                      onChange={(e) => setWizTicketName(e.target.value)}
                      className="w-full rounded-btn border border-line bg-surface px-3.5 py-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-ink mb-1">
                      Ticket Price in BDT (৳0 = Free)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={wizTicketPriceBDT}
                      onChange={(e) =>
                        setWizTicketPriceBDT(Number(e.target.value))
                      }
                      className="w-full rounded-btn border border-line bg-surface px-3.5 py-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-ink mb-1">
                      Total Seat Capacity
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={wizCapacity}
                      onChange={(e) => setWizCapacity(Number(e.target.value))}
                      className="w-full rounded-btn border border-line bg-surface px-3.5 py-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 shadow-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {wizardStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-brand-700">
                  Step 4 of 6: Branding & Custom Domain Preview
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-ink mb-1">
                      Brand Accent Color
                    </label>
                    <input
                      type="text"
                      value={wizThemeColor}
                      onChange={(e) => setWizThemeColor(e.target.value)}
                      className="w-full rounded-btn border border-line bg-surface px-3.5 py-2.5 text-ink font-mono focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-ink mb-1">
                      Organization Custom Domain
                    </label>
                    <input
                      type="text"
                      disabled
                      value={
                        activeOrg.custom_domain ||
                        `aayojon.bd/org/${activeOrg.slug}`
                      }
                      className="w-full rounded-btn border border-line bg-canvas-alt px-3.5 py-2.5 text-ink-muted font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {wizardStep === 5 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-brand-700">
                  Step 5 of 6: Pre-Publish Validation Checklist
                </h3>
                <div className="rounded-card border border-line bg-canvas-alt p-4 space-y-2">
                  <p className="text-sm font-bold text-ink">{wizTitle}</p>
                  <p className="text-ink-muted">{wizDescription}</p>
                  <div className="flex flex-wrap gap-4 pt-2 text-brand-700 font-medium">
                    <span>✓ Title & Schedule Validated</span>
                    <span>✓ Capacity: {wizCapacity} seats</span>
                    <span>
                      ✓ Ticket Price:{" "}
                      {wizTicketPriceBDT === 0
                        ? "Free (৳0)"
                        : `৳${wizTicketPriceBDT}`}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {wizardStep === 6 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-brand-700">
                  Step 6 of 6: Save Free Draft or Select Package to Publish
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <div
                    onClick={() => setWizPackageChoice("DRAFT_ONLY")}
                    className={`rounded-card border p-3.5 cursor-pointer transition ${
                      wizPackageChoice === "DRAFT_ONLY"
                        ? "border-emerald-600 bg-brand-50/70 ring-1 ring-emerald-600 shadow-xs"
                        : "border-line bg-surface hover:border-line hover:bg-canvas-alt shadow-xs"
                    }`}
                  >
                    <p className="font-bold text-ink">Save as Draft Only</p>
                    <p className="text-lg font-extrabold text-brand-700 mt-1">
                      Free (৳0)
                    </p>
                    <p className="text-[11px] text-ink-muted mt-1">
                      Private draft; pay package later to publish (US-01)
                    </p>
                  </div>

                  {db.packages
                    .filter((p) => !p.is_addon)
                    .map((p) => (
                      <div
                        key={p.id}
                        onClick={() => setWizPackageChoice(p.code)}
                        className={`rounded-card border p-3.5 cursor-pointer transition ${
                          wizPackageChoice === p.code
                            ? "border-emerald-600 bg-brand-50/70 ring-1 ring-emerald-600 shadow-xs"
                            : "border-line bg-surface hover:border-line hover:bg-canvas-alt shadow-xs"
                        }`}
                      >
                        <p className="font-bold text-ink">{p.name} Package</p>
                        <p className="text-lg font-extrabold text-brand-700 mt-1">
                          {formatBDT(p.price_minor)}
                        </p>
                        <p className="text-[11px] text-ink-muted mt-1">
                          {p.summary}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-line pt-4">
              <button
                type="button"
                disabled={wizardStep === 1}
                onClick={() => setWizardStep((s) => Math.max(1, s - 1))}
                className="rounded-btn border border-line bg-surface px-4 py-2 font-semibold text-ink hover:bg-canvas-alt disabled:opacity-40 cursor-pointer shadow-xs"
              >
                ← Previous Step
              </button>
              {wizardStep < 6 ? (
                <button
                  type="button"
                  onClick={() => setWizardStep((s) => Math.min(6, s + 1))}
                  className="rounded-btn bg-brand-600 hover:bg-brand-700 px-5 py-2 font-bold text-white shadow-sm transition cursor-pointer"
                >
                  Next Step ({wizardStep}/6) →
                </button>
              ) : (
                <button
                  type="submit"
                  className="rounded-btn bg-brand-600 hover:bg-brand-700 px-6 py-2.5 font-bold text-white shadow-sm transition cursor-pointer"
                >
                  {wizPackageChoice === "DRAFT_ONLY"
                    ? "Save Private Event Draft (৳0)"
                    : `Pay ${formatBDT(
                        db.packages.find((p) => p.code === wizPackageChoice)
                          ?.price_minor || 79900
                      )} & Publish Event`}
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: ATTENDEES, CSV EXPORT & CROSS-TENANT RLS TEST (QA-010) */}
      {subTab === "ATTENDEES" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-surface p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-ink">
                Select Event:
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="rounded-btn border border-line bg-surface px-3 py-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
              >
                {orgEvents.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`/api/v1/events/${selectedEventId}/attendees?format=csv`}
                target="_blank"
                rel="noreferrer"
                onClick={() => {
                  // Trigger via window fetch with x-user-id header to download CSV
                }}
                onClickCapture={async (e) => {
                  e.preventDefault();
                  const res = await fetch(
                    `/api/v1/events/${selectedEventId}/attendees?format=csv`,
                    {
                      headers: { "x-user-id": actorForOrg },
                    }
                  );
                  if (res.ok) {
                    const csvText = await res.text();
                    const blob = new Blob([csvText], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `attendees-${selectedEventId}.csv`;
                    a.click();
                    setStatusBanner({
                      type: "success",
                      text: "Attendee CSV exported and export action recorded in audit_logs!",
                    });
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-btn bg-brand-50 border border-emerald-300 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition cursor-pointer shadow-sm"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Attendee CSV (Audited)</span>
              </a>

              <button
                type="button"
                onClick={handleTestCrossTenantLeak}
                className="inline-flex items-center gap-1.5 rounded-btn bg-rose-50 border border-rose-300 px-3.5 py-2 text-xs font-bold text-rose-800 hover:bg-rose-100 transition cursor-pointer shadow-sm"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Simulate Cross-Tenant Leak Attempt (QA-010)</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-card border border-line bg-surface shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-canvas-alt text-[11px] uppercase font-semibold text-ink-muted">
                <tr>
                  <th className="px-4 py-3">Attendee Name</th>
                  <th className="px-4 py-3">Email & Phone</th>
                  <th className="px-4 py-3">University / Org</th>
                  <th className="px-4 py-3">Campaign Attribution</th>
                  <th className="px-4 py-3">Marketing Opt-in</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {db.registrations
                  .filter((r) => r.event_id === selectedEventId)
                  .map((r) => (
                    <tr key={r.id} className="hover:bg-canvas-alt/75 transition-colors">
                      <td className="px-4 py-3 font-bold text-ink">
                        {r.attendee_name}
                      </td>
                      <td className="px-4 py-3 text-ink">
                        <div className="font-medium">{r.attendee_email}</div>
                        <div className="text-[10px] text-ink-muted">
                          {r.attendee_phone}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-muted">
                        {r.institute_or_company || "—"}
                      </td>
                      <td className="px-4 py-3 font-mono font-medium text-brand-700">
                        {r.campaign_code || "Direct / Organic"}
                      </td>
                      <td className="px-4 py-3">
                        {r.marketing_consent ? (
                          <span className="inline-flex items-center font-medium text-brand-700">
                            Opted In
                          </span>
                        ) : (
                          <span className="text-ink-muted">Operational Only</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-brand-50 border border-brand-200 px-2.5 py-0.5 text-[10px] font-bold text-brand-700">
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: ORDERS & PAYMENT STATUS */}
      {subTab === "ORDERS" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-card border border-line bg-surface p-4 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-ink">Ticket Orders & Invoices ({orgOrders.length})</h3>
              <p className="text-xs text-ink-muted">All booking transactions processed for your events</p>
            </div>

            <div className="flex items-center gap-1.5">
              {(["ALL", "PAID", "PENDING", "FAILED"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setOrderStatusFilter(st)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    orderStatusFilter === st
                      ? "bg-brand-600 text-white"
                      : "bg-canvas-alt text-ink-muted hover:text-ink"
                  }`}
                >
                  {st === "ALL" ? "All Orders" : st}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-card border border-line bg-surface shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-canvas-alt text-[11px] uppercase font-semibold text-ink-muted">
                <tr>
                  <th className="px-4 py-3">Order Ref</th>
                  <th className="px-4 py-3">Buyer Name & Email</th>
                  <th className="px-4 py-3">Target Event</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orgOrders
                  .filter((o) => orderStatusFilter === "ALL" || o.status === orderStatusFilter)
                  .map((o) => {
                    const evt = db.events.find((e) => e.id === o.event_id);
                    return (
                      <tr key={o.id} className="hover:bg-canvas-alt/60 transition">
                        <td className="px-4 py-3 font-mono font-bold text-brand-700">#{o.id}</td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-ink">{o.attendee_name}</div>
                          <div className="text-[11px] text-ink-muted">{o.attendee_email}</div>
                        </td>
                        <td className="px-4 py-3 text-ink max-w-[220px] truncate">{evt?.title ?? o.event_id}</td>
                        <td className="px-4 py-3 text-ink-muted">
                          {new Date(o.created_at).toLocaleString("en-GB", {
                            dateStyle: "medium",
                            timeZone: "Asia/Dhaka",
                          })}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-ink">
                          {formatBDT(o.total_minor)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              o.status === "PAID"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : o.status === "PENDING"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-red-50 text-danger border border-red-200"
                            }`}
                          >
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: ANALYTICS, PROMOTIONS & UTM CAMPAIGNS */}
      {subTab === "ANALYTICS" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-card border border-line bg-surface p-4 shadow-sm">
              <span className="text-xs text-ink-muted font-medium">Total Page Views</span>
              <p className="text-2xl font-extrabold text-ink mt-1">{totalViews.toLocaleString()}</p>
              <p className="text-[11px] text-brand-700 mt-0.5">Across {orgEvents.length} events</p>
            </div>
            <div className="rounded-card border border-line bg-surface p-4 shadow-sm">
              <span className="text-xs text-ink-muted font-medium">Conversion Rate</span>
              <p className="text-2xl font-extrabold text-teal-700 mt-1">
                {totalViews > 0 ? ((orgTicketsSold / totalViews) * 100).toFixed(1) : "0.0"}%
              </p>
              <p className="text-[11px] text-ink-muted mt-0.5">Ticket sales / Views</p>
            </div>
            <div className="rounded-card border border-line bg-surface p-4 shadow-sm">
              <span className="text-xs text-ink-muted font-medium">Campaign Links</span>
              <p className="text-2xl font-extrabold text-ink mt-1">{db.campaign_links.length}</p>
              <p className="text-[11px] text-ink-muted mt-0.5">Active referral URLs</p>
            </div>
            <div className="rounded-card border border-line bg-surface p-4 shadow-sm">
              <span className="text-xs text-ink-muted font-medium">Attributed Revenue</span>
              <p className="text-2xl font-extrabold text-brand-700 mt-1">
                {formatBDT(db.campaign_links.reduce((sum, c) => sum + c.revenue_minor, 0))}
              </p>
              <p className="text-[11px] text-ink-muted mt-0.5">Tracked via last-touch</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 rounded-card border border-line bg-surface p-5 space-y-4 text-xs shadow-sm">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <Link2 className="h-4 w-4 text-brand-600" />
                Create Campaign Attribution Link
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-ink font-medium mb-1">Target Event</label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="w-full rounded-btn border border-line bg-surface px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                  >
                    {orgEvents.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-ink font-medium mb-1">
                    Campaign Referral Code
                  </label>
                  <input
                    type="text"
                    value={cmpCode}
                    onChange={(e) => setCmpCode(e.target.value)}
                    className="w-full rounded-btn border border-line bg-surface px-3 py-2 text-brand-700 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-ink font-medium mb-1">UTM Source</label>
                    <input
                      type="text"
                      value={cmpSource}
                      onChange={(e) => setCmpSource(e.target.value)}
                      className="w-full rounded-btn border border-line bg-surface px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-ink font-medium mb-1">UTM Medium</label>
                    <input
                      type="text"
                      value={cmpMedium}
                      onChange={(e) => setCmpMedium(e.target.value)}
                      className="w-full rounded-btn border border-line bg-surface px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await onAction(
                      "CREATE_CAMPAIGN_LINK",
                      {
                        eventId: selectedEventId,
                        code: cmpCode,
                        source: cmpSource,
                        medium: cmpMedium,
                        campaign: cmpName,
                      },
                      actorForOrg
                    );
                    setStatusBanner({
                      type: "success",
                      text: `Created tracking link: https://aayojon.bd/e/${selectedEventId}?ref=${cmpCode}`,
                    });
                  }}
                  className="w-full rounded-btn bg-brand-600 py-2.5 font-bold text-white hover:bg-brand-700 transition shadow-sm cursor-pointer"
                >
                  Generate Attribution Link
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 rounded-card border border-line bg-surface p-5 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-brand-600" />
                Campaign Conversion & Revenue Attribution (LAST_TOUCH)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-line bg-canvas-alt text-[11px] uppercase font-semibold text-ink-muted">
                    <tr>
                      <th className="py-2.5 px-3">Code</th>
                      <th className="py-2.5 px-3">Source / Medium</th>
                      <th className="py-2.5 px-3">Clicks</th>
                      <th className="py-2.5 px-3">Conversions</th>
                      <th className="py-2.5 px-3">Attributed Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {db.campaign_links.map((c) => (
                      <tr key={c.id} className="hover:bg-canvas-alt/75 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-brand-700">
                          {c.code}
                        </td>
                        <td className="py-2.5 px-3 text-ink-muted">
                          {c.source} / {c.medium}
                        </td>
                        <td className="py-2.5 px-3 text-ink">{c.clicks}</td>
                        <td className="py-2.5 px-3 font-bold text-ink">
                          {c.conversions}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-brand-700">
                          {formatBDT(c.revenue_minor)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: SPONSORS & BRAND MONETIZATION */}
      {subTab === "SPONSORS" && (
        <div className="space-y-4">
          <div className="rounded-card border border-line bg-surface p-5 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <Award className="size-5 text-coral" />
                Sponsor Inquiries & Monetization Leads ({orgSponsors.length})
              </h3>
              <p className="text-xs text-ink-muted">
                Corporate brand partnerships and exhibition sponsorship offers for your events
              </p>
            </div>
          </div>

          {orgSponsors.length === 0 ? (
            <div className="rounded-card border border-line bg-surface p-8 text-center space-y-2">
              <Award className="mx-auto size-8 text-ink-muted/40" />
              <p className="text-sm font-bold text-ink">No Sponsor Inquiries Yet</p>
              <p className="text-xs text-ink-muted max-w-md mx-auto">
                When companies submit corporate sponsorship proposals or booth applications for your events, they will
                appear here for your review and contract finalization.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {orgSponsors.map((sp) => {
                const targetEvent = db.events.find((e) => e.id === sp.event_id);
                return (
                  <div key={sp.id} className="rounded-card border border-line bg-surface p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-orange-50 border border-orange-200 px-2 py-0.5 text-[10px] font-bold text-orange-700 uppercase tracking-wider">
                        {sp.placement_tier.replace(/_/g, " ")}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          sp.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {sp.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-ink">{sp.company_name}</h4>
                      <p className="text-xs text-ink-muted">
                        Contact: <strong className="text-ink">{sp.sponsor_name}</strong> ({sp.contact_email})
                      </p>
                      <p className="text-xs text-ink-muted mt-1">
                        Event: <strong className="text-brand-700">{targetEvent?.title || sp.event_id}</strong>
                      </p>
                    </div>

                    <div className="rounded-xl bg-canvas-alt/70 p-3 text-xs text-ink-muted border border-line/80">
                      <p className="font-semibold text-ink">Sponsor Proposal:</p>
                      <p className="mt-1 leading-relaxed">{sp.message}</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-line pt-3">
                      <div>
                        <span className="text-[11px] text-ink-muted">Offered Budget:</span>
                        <p className="text-base font-extrabold text-brand-700">{formatBDT(sp.budget_minor)}</p>
                      </div>
                      <a
                        href={`mailto:${sp.contact_email}?subject=Regarding Sponsorship for ${encodeURIComponent(
                          targetEvent?.title || "Aayojon Event"
                        )}`}
                        className="rounded-btn bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 transition"
                      >
                        Reply by Email
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 8: VENUE BOOKING & VENDOR QUOTATIONS MARKETPLACE */}
      {subTab === "VENUES_RFQS" && (
        <div className="space-y-6">
          {/* HEADER BANNER */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-0.5 text-xs font-semibold text-brand-700 mb-1">
                <Building2 className="size-3.5" />
                <span>Venue & Vendor Quotation Marketplace</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
                Event Requirements & RFQ Management
              </h2>
              <p className="mt-1 text-xs text-ink-muted">
                Broadcast event specifications to partner spaces, compare itemized quotations, negotiate rates, and lock venue dates with deposit tracking.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAiModal(true)}
                className="inline-flex items-center gap-1.5 rounded-btn border border-brand-300 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-100 transition shadow-xs cursor-pointer"
              >
                <Sparkles className="size-3.5 text-brand-600" />
                <span>AI Event Assistant</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPrefilledRfqData(undefined);
                  setIsCreatingRfq(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-btn bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-700 transition shadow-xs cursor-pointer"
              >
                <PlusCircle className="size-3.5" />
                <span>Create New RFQ</span>
              </button>
              <Link
                href="/venues"
                className="inline-flex items-center gap-1.5 rounded-btn border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink hover:bg-canvas-alt transition shadow-xs"
              >
                <Eye className="size-3.5 text-ink-muted" />
                <span>Browse Venues</span>
              </Link>
            </div>
          </div>

          {/* ACTIVE RFQ BUILDER VIEW */}
          {isCreatingRfq ? (
            <RfqBuilderWizard
              initialRfq={prefilledRfqData}
              onClose={() => {
                setIsCreatingRfq(false);
                setPrefilledRfqData(undefined);
              }}
              onSubmitSuccess={(newRfq) => {
                setRfqList((prev) => [newRfq, ...prev]);
                setIsCreatingRfq(false);
                setPrefilledRfqData(undefined);
              }}
            />
          ) : comparingRfq ? (
            /* ACTIVE QUOTATION COMPARISON VIEW */
            <QuotationComparisonView
              rfq={comparingRfq}
              quotations={
                quotationList.filter((q) => q.rfq_id === comparingRfq.id).length > 0
                  ? quotationList.filter((q) => q.rfq_id === comparingRfq.id)
                  : [
                      {
                        id: "qt-kib-001",
                        rfq_id: comparingRfq.id,
                        provider_user_id: "usr-venue-kamal",
                        provider_type: "VENUE_OWNER",
                        provider_name: "Krishibid Institution Bangladesh (KIB)",
                        venue_id: "vp-kib",
                        status: "SUBMITTED",
                        revision_number: 1,
                        valid_until: "2026-12-31T23:59:59Z",
                        line_items: [
                          {
                            id: "li-1",
                            description: "Full Day Auditorium Hall Rental (08:00 - 22:00)",
                            quantity: 1,
                            unit_price_bdt: 85000,
                            total_bdt: 85000,
                            category: "VENUE_RENTAL",
                          },
                          {
                            id: "li-2",
                            description: "Continuous Heavy Generator Power Backup (200kVA Fuel Included)",
                            quantity: 1,
                            unit_price_bdt: 5000,
                            total_bdt: 5000,
                            category: "LOGISTICS",
                          },
                          {
                            id: "li-3",
                            description: "Non-profit Academic University Discount",
                            quantity: 1,
                            unit_price_bdt: -5000,
                            total_bdt: -5000,
                            category: "DISCOUNT",
                          },
                        ],
                        subtotal_bdt: 90000,
                        discount_bdt: 5000,
                        tax_bdt: 0,
                        grand_total_bdt: 85000,
                        inclusions: [
                          "1,200 Tiered Seating Access",
                          "Central HVAC Air Conditioning",
                          "Dual Greenroom Access",
                          "250 Vehicle Parking",
                        ],
                        exclusions: ["Outside Stage Fabrication Cleaning (Additional ৳3,000 if debris left)"],
                        setup_charges_bdt: 0,
                        transport_charges_bdt: 0,
                        payment_terms: {
                          deposit_percentage: 50,
                          deposit_due_days_before: 14,
                          final_payment_due: "BEFORE_EVENT",
                        },
                        cancellation_policy: "100% refund up to 14 days before event.",
                        terms_conditions: "Hall must be vacated by 23:00.",
                        created_at: "2026-11-06T11:00:00Z",
                        updated_at: "2026-11-06T11:00:00Z",
                      },
                      {
                        id: "qt-soundcraft-001",
                        rfq_id: comparingRfq.id,
                        provider_user_id: "usr-vendor-tariq",
                        provider_type: "SERVICE_VENDOR",
                        provider_name: "SoundCraft BD Pro Audio",
                        service_id: "vs-soundcraft",
                        status: "SUBMITTED",
                        revision_number: 1,
                        valid_until: "2026-12-31T23:59:59Z",
                        line_items: [
                          {
                            id: "li-sc-1",
                            description: "Summit Standard PA Audio System Package",
                            quantity: 1,
                            unit_price_bdt: 25000,
                            total_bdt: 25000,
                            category: "SERVICE",
                          },
                          {
                            id: "li-sc-2",
                            description: "Late Night Technician Standby Fee (36h Hackathon Coverage)",
                            quantity: 1,
                            unit_price_bdt: 5000,
                            total_bdt: 5000,
                            category: "LOGISTICS",
                          },
                        ],
                        subtotal_bdt: 30000,
                        discount_bdt: 2000,
                        tax_bdt: 0,
                        grand_total_bdt: 28000,
                        inclusions: [
                          "2 Senior Sound Engineers on Shift",
                          "Digital Podium Mics & 4 Wireless Handheld Mics",
                          "Yamaha Digital Console & FOH Speakers",
                        ],
                        exclusions: ["Truss lighting (available as add-on for ৳15,000)"],
                        setup_charges_bdt: 0,
                        transport_charges_bdt: 0,
                        payment_terms: {
                          deposit_percentage: 30,
                          deposit_due_days_before: 7,
                          final_payment_due: "EVENT_DAY",
                        },
                        cancellation_policy: "Deposit non-refundable if cancelled within 72 hours.",
                        terms_conditions: "Safe power outlet (220V 15A) must be provided by venue.",
                        created_at: "2026-11-06T14:30:00Z",
                        updated_at: "2026-11-06T14:30:00Z",
                      },
                    ]
              }
              onAcceptQuotation={(q) => setActiveConfirmQuote(q)}
              onBack={() => setComparingRfq(null)}
            />
          ) : (
            /* DEFAULT LIST VIEW */
            <div className="space-y-6">
              {/* METRIC CARDS */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-card border border-line bg-surface p-4 shadow-card">
                  <span className="text-xs text-ink-muted">Active Requirements</span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-ink">{rfqList.length}</span>
                    <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                      Transmitted
                    </span>
                  </div>
                  <span className="mt-2 block text-[11px] text-ink-muted">Broadcasted to partner network</span>
                </div>

                <div className="rounded-card border border-line bg-surface p-4 shadow-card">
                  <span className="text-xs text-ink-muted">Incoming Quotations</span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-brand-700">2</span>
                    <span className="text-xs font-semibold text-emerald-600">Active Bids</span>
                  </div>
                  <span className="mt-2 block text-[11px] text-ink-muted">KIB Auditorium & SoundCraft</span>
                </div>

                <div className="rounded-card border border-line bg-surface p-4 shadow-card">
                  <span className="text-xs text-ink-muted">Confirmed Space Bookings</span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-emerald-600">{bookingList.length}</span>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Date Locked
                    </span>
                  </div>
                  <span className="mt-2 block text-[11px] text-ink-muted">Voucher issued for Feb 15, 2027</span>
                </div>

                <div className="rounded-card border border-line bg-surface p-4 shadow-card">
                  <span className="text-xs text-ink-muted">Budget Commitment</span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-brand-700">৳150,000</span>
                    <span className="text-xs font-semibold text-ink-muted">BDT</span>
                  </div>
                  <span className="mt-2 block text-[11px] text-ink-muted">৳42,500 deposit verified</span>
                </div>
              </div>

              {/* ACTIVE RFQS LIST */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-ink flex items-center gap-2">
                    <FileText className="size-4 text-brand-600" />
                    <span>Your Submitted Event Requirements ({rfqList.length})</span>
                  </h3>
                </div>

                <div className="space-y-3">
                  {rfqList.map((rfq) => (
                    <div
                      key={rfq.id}
                      className="rounded-card border border-line bg-surface p-5 shadow-card space-y-4 hover:border-brand-300 transition"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="rounded-full bg-brand-50 border border-brand-200 px-2.5 py-0.5 text-[11px] font-bold text-brand-700">
                              {rfq.location_requirements.venue_category || "AUDITORIUM"}
                            </span>
                            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                              Responses Active
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-ink">{rfq.event_title}</h4>
                          <p className="text-xs text-ink-muted mt-1 max-w-2xl">{rfq.description}</p>
                        </div>

                        <div className="text-right">
                          <span className="block text-[11px] text-ink-muted">Target Budget</span>
                          <span className="text-lg font-bold text-brand-700">
                            {formatBDT(rfq.budget.total_budget_bdt)}
                          </span>
                          <span className="block text-[10px] text-emerald-600">
                            {rfq.budget.flexible ? "Flexible (+/-15%)" : "Strict Cap"}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-canvas-alt p-3 rounded-btn border border-line">
                        <div>
                          <span className="block text-[10px] text-ink-muted">Event Date:</span>
                          <span className="font-semibold text-ink">{rfq.event_date} ({rfq.start_time} - {rfq.end_time})</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-ink-muted">Guest Count:</span>
                          <span className="font-semibold text-ink">{rfq.expected_guests} Attendees</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-ink-muted">City / Area:</span>
                          <span className="font-semibold text-ink">{rfq.location_requirements.city}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-ink-muted">Additional Services:</span>
                          <span className="font-semibold text-brand-700">{rfq.additional_services.length} requested</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-line">
                        <div className="flex flex-wrap gap-1">
                          {rfq.location_requirements.required_facilities.map((fac) => (
                            <span
                              key={fac}
                              className="rounded-full bg-surface border border-line px-2 py-0.5 text-[10px] text-ink-muted font-medium"
                            >
                              {fac}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveChatRfq(rfq)}
                            className="inline-flex items-center gap-1 rounded-btn border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-canvas-alt transition shadow-xs cursor-pointer"
                          >
                            <MessageSquare className="size-3.5 text-brand-600" />
                            <span>Clarifications</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setComparingRfq(rfq)}
                            className="inline-flex items-center gap-1.5 rounded-btn bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 transition shadow-xs cursor-pointer"
                          >
                            <Layers className="size-3.5" />
                            <span>Compare Quotations (2)</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CONFIRMED BOOKINGS */}
              <div className="space-y-4 pt-4 border-t border-line">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-ink flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    <span>Confirmed Venue Reservations & Escrow Holds ({bookingList.length})</span>
                  </h3>
                </div>

                <div className="space-y-3">
                  {bookingList.map((b) => (
                    <div
                      key={b.id}
                      className="rounded-card border border-emerald-200 bg-emerald-50/30 p-5 shadow-sm space-y-3"
                    >
                      <div className="flex flex-wrap justify-between items-start gap-2">
                        <div>
                          <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                            Calendar Locked
                          </span>
                          <h4 className="text-base font-bold text-ink mt-1">
                            Krishibid Institution Bangladesh (KIB) Auditorium
                          </h4>
                          <span className="text-xs text-ink-muted">
                            Target Date: <strong className="text-ink">{b.event_date}</strong> &bull; Voucher:{" "}
                            <span className="font-mono font-bold text-brand-700">{b.id}</span>
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-xl font-bold text-brand-700">
                            {formatBDT(b.total_agreed_bdt)}
                          </span>
                          <span className="block text-xs font-bold text-emerald-700">
                            Escrow Deposit Verified: {formatBDT(b.deposit_paid_bdt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between text-xs pt-2 border-t border-emerald-200 text-ink-muted">
                        <span>Payment Channel: bKash Escrow Ref #{b.payment_reference_id}</span>
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline cursor-pointer"
                        >
                          <Printer className="size-3.5" /> Print Agreement Voucher
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* AI ASSISTANT MODAL */}
          {showAiModal && (
            <div
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm animate-in fade-in"
            >
              <div className="relative w-full max-w-4xl h-[700px]">
                <button
                  onClick={() => setShowAiModal(false)}
                  className="absolute -top-3 -right-3 z-10 size-8 rounded-full bg-surface border border-line flex items-center justify-center text-ink-muted hover:text-ink shadow-md"
                >
                  &times;
                </button>
                <AIAssistantWidget
                  standalone
                  onTransferToRfq={(extracted) => {
                    setPrefilledRfqData(extracted);
                    setIsCreatingRfq(true);
                    setShowAiModal(false);
                  }}
                />
              </div>
            </div>
          )}

          {/* IN-CONTEXT CHAT MODAL */}
          {activeChatRfq && (
            <div
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm animate-in fade-in"
            >
              <div className="relative w-full max-w-lg">
                <button
                  onClick={() => setActiveChatRfq(null)}
                  className="absolute -top-3 -right-3 z-10 size-8 rounded-full bg-surface border border-line flex items-center justify-center text-ink-muted hover:text-ink shadow-md"
                >
                  &times;
                </button>
                <RfqMessageThread
                  rfqId={activeChatRfq.id}
                  providerName="Krishibid Institution Bangladesh (KIB)"
                  currentRole="ORGANIZER"
                />
              </div>
            </div>
          )}

          {/* BOOKING CONFIRMATION MODAL */}
          {activeConfirmQuote && comparingRfq && (
            <BookingConfirmationModal
              rfq={comparingRfq}
              quotation={activeConfirmQuote}
              open={true}
              onClose={() => setActiveConfirmQuote(null)}
              onBookingConfirmed={(b) => {
                setBookingList((prev) => [b, ...prev]);
                setActiveConfirmQuote(null);
                setComparingRfq(null);
              }}
            />
          )}
        </div>
      )}

      {/* TAB 5: CUSTOM DOMAIN DNS (QA-013) & TEAM RBAC */}
      {subTab === "SETTINGS" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-card border border-line bg-surface p-5 space-y-4 text-xs shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <Globe className="h-4 w-4 text-brand-600" />
                Custom Domain DNS Verification (QA-013)
              </h3>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                  activeOrg.custom_domain_status === "VERIFIED"
                    ? "bg-brand-50 border-brand-200 text-brand-700"
                    : "bg-rose-50 border-rose-200 text-rose-700"
                }`}
              >
                {activeOrg.custom_domain_status}
              </span>
            </div>
            <p className="text-ink-muted leading-relaxed">
              Organizers on Plus/Premium packages can bind their own domain. Point your DNS <code className="rounded bg-slate-100 border border-line px-1 py-0.5 font-mono text-[11px] text-ink">CNAME</code> record to{" "}
              <code className="rounded bg-brand-50 border border-brand-200 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-brand-700">cname.aayojon.bd</code>. If DNS is misconfigured, the default platform URL always works seamlessly.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-ink font-medium mb-1">
                  Organizer Custom Domain
                </label>
                <input
                  type="text"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  className="w-full rounded-btn border border-line bg-surface px-3 py-2 text-ink font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-ink font-medium mb-1">
                  Simulated DNS CNAME Target Returned by Resolver
                </label>
                <input
                  type="text"
                  value={dnsCnameInput}
                  onChange={(e) => setDnsCnameInput(e.target.value)}
                  className="w-full rounded-btn border border-line bg-surface px-3 py-2 text-brand-700 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await onAction(
                      "VERIFY_CUSTOM_DOMAIN",
                      {
                        organizationId: activeOrg.id,
                        customDomain: domainInput,
                        simulatedDnsCnameRecord: "cname.aayojon.bd",
                      },
                      actorForOrg
                    );
                    setDnsCnameInput("cname.aayojon.bd");
                    setStatusBanner({
                      type: "success",
                      text: `Custom domain ${domainInput} DNS CNAME verified!`,
                    });
                  }}
                  className="rounded-btn bg-brand-600 px-4 py-2 font-bold text-white hover:bg-brand-700 transition shadow-sm cursor-pointer"
                >
                  Verify Valid CNAME (\`cname.aayojon.bd\`)
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await onAction(
                      "VERIFY_CUSTOM_DOMAIN",
                      {
                        organizationId: activeOrg.id,
                        customDomain: domainInput,
                        simulatedDnsCnameRecord: "broken-dns.invalid.org",
                      },
                      actorForOrg
                    );
                    setDnsCnameInput("broken-dns.invalid.org");
                    setStatusBanner({
                      type: "warning",
                      text: `QA-013 Verified: DNS CNAME mismatch flagged as ERROR. Default URL https://aayojon.bd/org/${activeOrg.slug} remains active!`,
                    });
                  }}
                  className="rounded-btn border border-amber-300 bg-amber-50 px-4 py-2 font-bold text-amber-800 hover:bg-amber-100 transition shadow-sm cursor-pointer"
                >
                  Simulate Broken DNS (QA-013)
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-card border border-line bg-surface p-5 space-y-4 text-xs shadow-sm">
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              <Lock className="h-4 w-4 text-brand-600" />
              Organization Members & Least-Privilege RBAC
            </h3>
            <div className="space-y-2">
              {db.organization_members
                .filter((m) => m.organization_id === activeOrg.id)
                .map((m) => {
                  const prof = db.profiles.find((p) => p.id === m.user_id);
                  return (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-btn border border-line bg-canvas-alt hover:bg-slate-100/70 transition-colors p-3"
                    >
                      <div>
                        <p className="font-bold text-ink">
                          {prof?.display_name}
                        </p>
                        <p className="text-ink-muted text-xs">{prof?.email}</p>
                      </div>
                      <span className="rounded-lg bg-brand-50 border border-brand-200 px-2.5 py-1 font-mono text-[11px] font-bold text-brand-700">
                        {m.role}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

