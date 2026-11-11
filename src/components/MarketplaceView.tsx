"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  MapPin,
  Calendar,
  Users,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Globe,
  Clock,
  Tag,
  ArrowRight,
  Flag,
  X,
  CreditCard,
  AlertTriangle,
  Share2,
} from "lucide-react";
import {
  DatabaseState,
  EventRecord,
  PaymentProvider,
  Profile,
} from "@/lib/types";
import { formatBDT } from "@/lib/seed";

interface MarketplaceViewProps {
  db: DatabaseState;
  currentUser: Profile;
  onAction: (action: string, payload: Record<string, unknown>) => Promise<unknown>;
  onNavigateWallet: () => void;
  onNavigateOrganizer: () => void;
}

export function MarketplaceView({
  db,
  currentUser,
  onAction,
  onNavigateWallet,
  onNavigateOrganizer,
}: MarketplaceViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedCity, setSelectedCity] = useState<string>("ALL");
  const [quickFilter, setQuickFilter] = useState<
    "ALL" | "FEATURED" | "FREE" | "PAID" | "ONLINE" | "RECOMMENDED"
  >("ALL");

  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [attendeeName, setAttendeeName] = useState<string>(currentUser.display_name);
  const [attendeeEmail, setAttendeeEmail] = useState<string>(currentUser.email);
  const [attendeePhone, setAttendeePhone] = useState<string>(currentUser.phone);
  const [institute, setInstitute] = useState<string>(
    currentUser.organization_label || "BUET"
  );
  const [campaignCode, setCampaignCode] = useState<string>("FB-BUET-CAMPUS");
  const [marketingConsent, setMarketingConsent] = useState<boolean>(false);
  const [provider, setProvider] = useState<PaymentProvider>("BKASH_SANDBOX");
  const [browserRedirectOnly, setBrowserRedirectOnly] = useState<boolean>(false);
  const [checkoutBanner, setCheckoutBanner] = useState<{
    type: "success" | "warning" | "error";
    text: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");

  const publishedEvents = useMemo(() => {
    return db.events.filter(
      (e) => e.status === "PUBLISHED" && e.visibility === "PUBLIC"
    );
  }, [db.events]);

  // Content-based deterministic ranker (Section 5 of 10_Data_and_Model_Guidelines.docx)
  const scoreEventForUser = (evt: EventRecord) => {
    const cat = db.categories.find((c) => c.id === evt.category_id);
    const ven = db.venues.find((v) => v.id === evt.venue_id);
    let score = 0;
    if (evt.is_featured) score += 35;
    if (evt.package_code === "PREMIUM") score += 30;
    else if (evt.package_code === "PLUS") score += 20;
    else if (evt.package_code === "PROMOTED") score += 12;
    if (cat && currentUser.interests.includes(cat.slug)) score += 25;
    if (ven && ven.city === currentUser.preferred_city) score += 15;
    score += Math.min(20, Math.round(evt.views_count / 100));
    return score;
  };

  const filteredEvents = useMemo(() => {
    let list = [...publishedEvents];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.tagline.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== "ALL") {
      list = list.filter((e) => e.category_id === selectedCategory);
    }

    if (selectedCity !== "ALL") {
      if (selectedCity === "Online") {
        list = list.filter((e) => e.is_online);
      } else {
        list = list.filter((e) => {
          const ven = db.venues.find((v) => v.id === e.venue_id);
          return ven?.city === selectedCity;
        });
      }
    }

    if (quickFilter === "FEATURED") {
      list = list.filter((e) => e.is_featured);
    } else if (quickFilter === "ONLINE") {
      list = list.filter((e) => e.is_online);
    } else if (quickFilter === "FREE") {
      list = list.filter((e) =>
        db.ticket_types
          .filter((t) => t.event_id === e.id)
          .some((t) => t.price_minor === 0)
      );
    } else if (quickFilter === "PAID") {
      list = list.filter((e) =>
        db.ticket_types
          .filter((t) => t.event_id === e.id)
          .every((t) => t.price_minor > 0)
      );
    }

    list.sort((a, b) => scoreEventForUser(b) - scoreEventForUser(a));
    return list;
  }, [
    publishedEvents,
    searchQuery,
    selectedCategory,
    selectedCity,
    quickFilter,
    db.venues,
    db.ticket_types,
    currentUser,
  ]);

  const activeEvent = useMemo(
    () => db.events.find((e) => e.id === activeEventId) || null,
    [db.events, activeEventId]
  );

  const activeEventTickets = useMemo(() => {
    if (!activeEvent) return [];
    return db.ticket_types.filter((t) => t.event_id === activeEvent.id);
  }, [db.ticket_types, activeEvent]);

  const openEventModal = (evt: EventRecord) => {
    setActiveEventId(evt.id);
    const tts = db.ticket_types.filter((t) => t.event_id === evt.id);
    if (tts.length > 0) {
      setSelectedTicketTypeId(tts[0].id);
    }
    setAttendeeName(currentUser.display_name);
    setAttendeeEmail(currentUser.email);
    setAttendeePhone(currentUser.phone);
    setQuantity(1);
    setCheckoutBanner(null);
  };

  const selectedTicket = activeEventTickets.find(
    (t) => t.id === selectedTicketTypeId
  );

  const subtotalMinor = selectedTicket ? selectedTicket.price_minor * quantity : 0;
  const serviceFeeMinor =
    subtotalMinor > 0 ? Math.round((subtotalMinor * 250) / 10000) : 0;
  const totalMinor = subtotalMinor + serviceFeeMinor;

  const handleCheckoutOrRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEvent || !selectedTicket) return;
    setSubmitting(true);
    setCheckoutBanner(null);

    try {
      if (selectedTicket.price_minor === 0) {
        await onAction("REGISTER_FREE", {
          eventId: activeEvent.id,
          ticketTypeId: selectedTicket.id,
          attendeeName,
          attendeeEmail,
          attendeePhone,
          instituteOrCompany: institute,
          marketingConsent,
          campaignCode: campaignCode.trim() || undefined,
        });
        setCheckoutBanner({
          type: "success",
          text: "Free registration confirmed! Your high-entropy QR ticket has been issued to your Ticket Wallet and confirmation email queued.",
        });
      } else {
        const res = (await onAction("BUY_TICKET", {
          eventId: activeEvent.id,
          items: [{ ticketTypeId: selectedTicket.id, quantity }],
          attendee: {
            name: attendeeName,
            email: attendeeEmail,
            phone: attendeePhone,
            instituteOrCompany: institute,
          },
          campaignCode: campaignCode.trim() || undefined,
          provider,
          browserRedirectOnly,
          idempotencyKey: `ui-ord-${activeEvent.id}-${Date.now()}`,
        })) as {
          result?: {
            webhookVerified?: boolean;
            message?: string;
            issuedTickets?: Array<{ qr_token: string }>;
          };
        };

        if (browserRedirectOnly) {
          setCheckoutBanner({
            type: "warning",
            text:
              res?.result?.message ||
              "QA-008 Guard Active: Browser redirected after checkout, but payment webhook is NOT verified yet. No ticket issued until server webhook confirms payment.",
          });
        } else {
          setCheckoutBanner({
            type: "success",
            text: `Verified ${provider.replace("_SANDBOX", "")} payment (${formatBDT(
              totalMinor
            )})! Issued ${quantity} QR ticket(s) to your wallet.`,
          });
        }
      }
    } catch (err) {
      setCheckoutBanner({
        type: "error",
        text: err instanceof Error ? err.message : "Checkout failed",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEvent || !reportReason.trim()) return;
    await onAction("FILE_ABUSE_REPORT", {
      eventId: activeEvent.id,
      reporterEmail: currentUser.email,
      reason: reportReason.trim(),
      details: `Reported from public event page by ${currentUser.display_name}`,
    });
    setReportReason("");
    setReportModalOpen(false);
    setCheckoutBanner({
      type: "warning",
      text: "Listing report submitted to Platform Trust & Moderation queue.",
    });
  };

  return (
    <div className="space-y-8">
      {/* HERO SECTION (05_UI_UX_Wireframes.docx) */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-emerald-50/60 via-slate-50 to-teal-50/40 p-6 sm:p-10 shadow-sm">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-semibold text-emerald-800 shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span>
              আয়োজন • Bangladesh&apos;s All-in-One Event Discovery, Promotion & QR Ticketing Platform
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Find events worth attending across{" "}
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
              Bangladesh
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
            Discover university hackathons, AI & engineering workshops, startup pitch days, and cultural festivals in Dhaka, Chattogram, Sylhet, and Online — with verified bKash/SSLCommerz QR ticketing.
          </p>

          {/* Search & Location Filter Bar */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by event title, university club (BUET, NSU), tag, or topic..."
                className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none shadow-sm"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                aria-label="Filter by City"
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none shadow-sm"
              >
                <option value="ALL">All Cities (BD)</option>
                <option value="Dhaka">Dhaka (ঢাকা)</option>
                <option value="Chattogram">Chattogram (চট্টগ্রাম)</option>
                <option value="Sylhet">Sylhet (সিলেট)</option>
                <option value="Online">Online (অনলাইন)</option>
              </select>

              <button
                type="button"
                onClick={onNavigateOrganizer}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition cursor-pointer shrink-0 shadow-sm"
              >
                <span>Host Event</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs font-medium text-slate-600 mr-1">Quick Filters:</span>
            {(
              [
                { id: "ALL", label: "All Events" },
                { id: "FEATURED", label: "Featured Spotlight" },
                { id: "FREE", label: "Free Registration (৳0)" },
                { id: "PAID", label: "Paid Tickets" },
                { id: "ONLINE", label: "Online Livestream" },
                { id: "RECOMMENDED", label: `For ${currentUser.display_name.split(" ")[0]}` },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setQuickFilter(f.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition cursor-pointer ${
                  quickFilter === f.id
                    ? "bg-emerald-600 text-white font-semibold shadow-sm"
                    : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-xs"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* EXPLORE CATEGORIES */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
            Explore Categories
          </h2>
          {selectedCategory !== "ALL" && (
            <button
              type="button"
              onClick={() => setSelectedCategory("ALL")}
              className="text-xs text-emerald-700 hover:underline cursor-pointer font-medium"
            >
              Reset category filter
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {db.categories.map((cat) => {
            const active = selectedCategory === cat.id;
            const count = publishedEvents.filter(
              (e) => e.category_id === cat.id
            ).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() =>
                  setSelectedCategory(active ? "ALL" : cat.id)
                }
                className={`flex flex-col items-start justify-between rounded-2xl border p-3.5 text-left transition cursor-pointer ${
                  active
                    ? "border-emerald-600 bg-emerald-50/60 text-slate-900 ring-1 ring-emerald-600 shadow-sm"
                    : "bg-white border-slate-200 text-slate-800 hover:border-emerald-400 hover:bg-emerald-50/30 shadow-xs"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-700">
                    {cat.name_bn}
                  </span>
                  <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    {count}
                  </span>
                </div>
                <p className="mt-1.5 text-xs font-semibold text-slate-900 line-clamp-1">
                  {cat.name}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* EVENT CARDS GRID */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {quickFilter === "FEATURED"
                ? "Featured & Promoted Events"
                : "Upcoming Public Events"}
            </h2>
            <p className="text-xs text-slate-600">
              Showing {filteredEvents.length} verified public events • Ranked by relevance, city ({currentUser.preferred_city}), and package promotion tier
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-600" />
            <span>Draft & suspended events are strictly hidden from public feeds (QA-001 / QA-012)</span>
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-3 shadow-sm">
            <p className="text-base font-semibold text-slate-900">
              No public events match your current filters
            </p>
            <p className="text-xs text-slate-600">
              Try clearing your search query or switching back to All Cities.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("ALL");
                setSelectedCity("ALL");
                setQuickFilter("ALL");
              }}
              className="rounded-xl bg-emerald-50 border border-emerald-300 px-4 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 cursor-pointer shadow-xs"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredEvents.map((evt) => {
              const org = db.organizations.find(
                (o) => o.id === evt.organization_id
              );
              const venue = db.venues.find((v) => v.id === evt.venue_id);
              const cat = db.categories.find((c) => c.id === evt.category_id);
              const tts = db.ticket_types.filter((t) => t.event_id === evt.id);
              const minPrice =
                tts.length > 0
                  ? Math.min(...tts.map((t) => t.price_minor))
                  : 0;
              const totalSold = tts.reduce((acc, t) => acc + t.sold_count, 0);
              const totalCap =
                tts.reduce((acc, t) => acc + t.capacity, 0) || evt.capacity;
              const pctFull = Math.min(
                100,
                Math.round((totalSold / Math.max(1, totalCap)) * 100)
              );

              return (
                <div
                  key={evt.id}
                  onClick={() => openEventModal(evt)}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white overflow-hidden transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md cursor-pointer shadow-sm"
                >
                  <div>
                    {/* Cover Gradient Header */}
                    <div
                      className={`relative h-36 bg-gradient-to-br ${evt.cover_gradient} p-4 flex flex-col justify-between`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-full bg-black/60 backdrop-blur px-2.5 py-1 text-[11px] font-medium text-white border border-white/20">
                          {cat?.name || "Event"}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {evt.is_featured && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-0.5 text-[11px] font-bold text-slate-950 shadow">
                              <Sparkles className="h-3 w-3" />
                              Featured
                            </span>
                          )}
                          {evt.package_code && (
                            <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-semibold text-white">
                              {evt.package_code}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-white">
                        <span className="inline-flex items-center gap-1 font-medium">
                          <Calendar className="h-3.5 w-3.5 text-emerald-200" />
                          {new Date(evt.starts_at).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span className="rounded-lg bg-white/95 px-2.5 py-1 font-bold text-emerald-700 border border-emerald-200 shadow-sm">
                          {minPrice === 0 ? "Free (৳0)" : `From ${formatBDT(minPrice)}`}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 space-y-2.5">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate font-medium text-slate-700">
                          {org?.name}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition line-clamp-2">
                        {evt.title}
                      </h3>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {evt.tagline}
                      </p>

                      <div className="flex items-center gap-2 pt-1 text-xs text-slate-600">
                        {evt.is_online ? (
                          <span className="inline-flex items-center gap-1 text-teal-700 font-medium">
                            <Globe className="h-3.5 w-3.5" />
                            Online Livestream
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 truncate">
                            <MapPin className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                            <span className="truncate text-slate-600">
                              {venue?.name}, {venue?.city}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Capacity */}
                  <div className="px-4 pb-4 pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-slate-500" />
                        {totalSold} / {totalCap} registered
                      </span>
                      <span
                        className={
                          pctFull >= 90
                            ? "text-amber-700 font-semibold"
                            : "text-emerald-700 font-medium"
                        }
                      >
                        {totalCap - totalSold} spots left
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          pctFull >= 90 ? "bg-amber-500" : "bg-emerald-600"
                        }`}
                        style={{ width: `${pctFull}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* EVENT DETAIL & CHECKOUT MODAL (05_UI_UX_Wireframes.docx) */}
      {activeEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
          <div className="relative my-auto w-full max-w-5xl rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            {/* Modal Top Header */}
            <div
              className={`bg-gradient-to-r ${activeEvent.cover_gradient} p-6 sm:p-8 border-b border-white/10`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-black/60 backdrop-blur px-3 py-1 font-medium text-white border border-white/20">
                      {
                        db.categories.find(
                          (c) => c.id === activeEvent.category_id
                        )?.name
                      }
                    </span>
                    {activeEvent.is_featured && (
                      <span className="rounded-full bg-amber-400 px-2.5 py-1 font-bold text-slate-950">
                        Featured Event
                      </span>
                    )}
                    <span className="text-white/90">
                      Timezone: {activeEvent.timezone}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                    {activeEvent.title}
                  </h2>
                  <p className="text-sm text-white/90 max-w-2xl">
                    {activeEvent.tagline}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveEventId(null)}
                  className="rounded-full bg-black/40 p-2 text-white hover:bg-black/60 cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Content Grid: Main Column + Sticky Checkout Side Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-y-auto">
              {/* Left 7 Cols: About, Agenda, Speakers, Venue, Organizer */}
              <div className="lg:col-span-7 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs">
                  <div className="flex items-start gap-2.5">
                    <Calendar className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900">Date & Time</p>
                      <p className="text-slate-600">
                        {new Date(activeEvent.starts_at).toLocaleString("en-GB", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900">
                        {activeEvent.is_online ? "Online Platform" : "Venue & City"}
                      </p>
                      <p className="text-slate-600">
                        {activeEvent.is_online
                          ? activeEvent.online_url
                          : (() => {
                              const v = db.venues.find(
                                (ven) => ven.id === activeEvent.venue_id
                              );
                              return v ? `${v.name}, ${v.address}` : "Dhaka";
                            })()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">
                    About This Event
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {activeEvent.description}
                  </p>
                </div>

                {/* Agenda */}
                {activeEvent.agenda.length > 0 && (
                  <div className="space-y-2.5">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">
                      Event Schedule & Agenda
                    </h3>
                    <div className="space-y-2">
                      {activeEvent.agenda.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs"
                        >
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-1 font-mono font-semibold text-emerald-700 shrink-0">
                            <Clock className="h-3 w-3" />
                            {item.time}
                          </span>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {item.title}
                            </p>
                            {item.speaker && (
                              <p className="text-slate-600">{item.speaker}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Speakers */}
                {activeEvent.speakers.length > 0 && (
                  <div className="space-y-2.5">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">
                      Featured Speakers & Jury
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {activeEvent.speakers.map((sp, i) => (
                        <div
                          key={i}
                          className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs"
                        >
                          <p className="font-bold text-slate-900">{sp.name}</p>
                          <p className="text-emerald-700 font-medium">{sp.role}</p>
                          <p className="text-slate-600">{sp.org}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Organizer & Refund Policy */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      Organized by{" "}
                      {
                        db.organizations.find(
                          (o) => o.id === activeEvent.organization_id
                        )?.name
                      }
                    </span>
                    <button
                      type="button"
                      onClick={() => setReportModalOpen(!reportModalOpen)}
                      className="inline-flex items-center gap-1 text-rose-600 hover:underline cursor-pointer font-medium"
                    >
                      <Flag className="h-3.5 w-3.5" />
                      Report Listing
                    </button>
                  </div>
                  <p className="text-slate-600">
                    <strong className="text-slate-800">Refund & Cancellation Policy:</strong>{" "}
                    {activeEvent.refund_policy}
                  </p>
                  <p className="text-slate-600">
                    <strong className="text-slate-800">Organizer Contact:</strong>{" "}
                    {activeEvent.contact_email}
                  </p>
                </div>

                {reportModalOpen && (
                  <form
                    onSubmit={handleReportSubmit}
                    className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4 space-y-3 text-xs"
                  >
                    <p className="font-bold text-rose-800">
                      Report Event Listing to Platform Admin
                    </p>
                    <input
                      type="text"
                      required
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      placeholder="Describe the issue (e.g., misleading ticket price, venue change)..."
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setReportModalOpen(false)}
                        className="rounded-lg px-3 py-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-lg bg-rose-600 px-3 py-1.5 font-semibold text-white hover:bg-rose-700 cursor-pointer shadow-xs"
                      >
                        Submit Report
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Right 5 Cols: Sticky Registration / Ticket Checkout Side Panel */}
              <div className="lg:col-span-5">
                <form
                  onSubmit={handleCheckoutOrRegister}
                  className="sticky top-0 rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4 shadow-sm"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Registration & Tickets
                      </h3>
                      <p className="text-xs text-slate-600">
                        Instant QR Ticket issued after verification
                      </p>
                    </div>
                    <CreditCard className="h-5 w-5 text-emerald-600" />
                  </div>

                  {/* Ticket Type Selector */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      Select Ticket Tier
                    </label>
                    {activeEventTickets.map((tt) => {
                      const rem = tt.capacity - tt.sold_count;
                      const isSelected = selectedTicketTypeId === tt.id;
                      return (
                        <div
                          key={tt.id}
                          onClick={() => setSelectedTicketTypeId(tt.id)}
                          className={`rounded-xl border p-3 transition cursor-pointer ${
                            isSelected
                              ? "border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600 shadow-xs"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">
                              {tt.name}
                            </span>
                            <span className="text-xs font-extrabold text-emerald-700">
                              {formatBDT(tt.price_minor)}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-slate-600">
                            {tt.description}
                          </p>
                          <div className="mt-1.5 flex items-center justify-between text-[11px]">
                            <span className="text-slate-500">
                              Capacity: {tt.sold_count}/{tt.capacity}
                            </span>
                            <span
                              className={
                                rem === 0
                                  ? "text-rose-600 font-bold"
                                  : "text-emerald-700 font-medium"
                              }
                            >
                              {rem === 0 ? "SOLD OUT" : `${rem} available`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {selectedTicket && selectedTicket.price_minor > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-semibold text-slate-700">
                        Quantity
                      </label>
                      <select
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>
                            {n} {n === 1 ? "Ticket" : "Tickets"}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Attendee Details */}
                  <div className="space-y-2.5 pt-1">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Attendee Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={attendeeName}
                        onChange={(e) => setAttendeeName(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none shadow-xs"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-700 mb-1">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          value={attendeeEmail}
                          onChange={(e) => setAttendeeEmail(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none shadow-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-700 mb-1">
                          Mobile Number (BD)
                        </label>
                        <input
                          type="text"
                          value={attendeePhone}
                          onChange={(e) => setAttendeePhone(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none shadow-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-700 mb-1">
                          University / Organization
                        </label>
                        <input
                          type="text"
                          value={institute}
                          onChange={(e) => setInstitute(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none shadow-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-700 mb-1">
                          Campaign / Referral Code
                        </label>
                        <input
                          type="text"
                          value={campaignCode}
                          onChange={(e) => setCampaignCode(e.target.value)}
                          placeholder="e.g. FB-BUET-CAMPUS"
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-emerald-700 font-mono placeholder-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none shadow-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Gateway & Price Breakdown for Paid Tickets */}
                  {selectedTicket && selectedTicket.price_minor > 0 && (
                    <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2 text-xs shadow-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>
                          Ticket Subtotal ({quantity} ×{" "}
                          {formatBDT(selectedTicket.price_minor)})
                        </span>
                        <span className="text-slate-800 font-medium">
                          {formatBDT(subtotalMinor)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Disclosed Ticketing Service Fee (2.5%)</span>
                        <span className="text-slate-800 font-medium">
                          {formatBDT(serviceFeeMinor)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-sm">
                        <span className="text-slate-900">Total Payable (BDT)</span>
                        <span className="text-emerald-700 font-bold">
                          {formatBDT(totalMinor)}
                        </span>
                      </div>

                      <div className="pt-2 space-y-1.5">
                        <label className="block text-[11px] font-semibold text-slate-700">
                          Bangladesh Sandbox Payment Gateway
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(
                            [
                              { id: "BKASH_SANDBOX", label: "bKash" },
                              { id: "SSLCOMMERZ_SANDBOX", label: "SSLCommerz" },
                              { id: "NAGAD_SANDBOX", label: "Nagad" },
                            ] as const
                          ).map((gw) => (
                            <button
                              key={gw.id}
                              type="button"
                              onClick={() => setProvider(gw.id)}
                              className={`rounded-lg border py-1.5 text-[11px] font-semibold transition cursor-pointer ${
                                provider === gw.id
                                  ? "border-emerald-600 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600 shadow-xs"
                                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              {gw.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* QA-008 Test Toggle */}
                      <label className="flex items-center gap-2 pt-1 text-[11px] text-amber-800 font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={browserRedirectOnly}
                          onChange={(e) =>
                            setBrowserRedirectOnly(e.target.checked)
                          }
                          className="rounded border-slate-300"
                        />
                        <span>
                          QA-008 Test Mode: Simulate browser redirect WITHOUT server webhook verification
                        </span>
                      </label>
                    </div>
                  )}

                  {/* Privacy Notice & Marketing Opt-in (09_Security_Privacy_Compliance.docx) */}
                  <label className="flex items-start gap-2 text-[11px] text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={marketingConsent}
                      onChange={(e) => setMarketingConsent(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300"
                    />
                    <span>
                      Optional: Send me future event updates from this organizer (separated from operational ticket confirmations per Privacy Policy).
                    </span>
                  </label>

                  {checkoutBanner && (
                    <div
                      className={`rounded-xl border p-3 text-xs ${
                        checkoutBanner.type === "success"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : checkoutBanner.type === "warning"
                          ? "border-amber-200 bg-amber-50 text-amber-800"
                          : "border-rose-200 bg-rose-50 text-rose-800"
                      }`}
                    >
                      <p className="font-medium">{checkoutBanner.text}</p>
                      {checkoutBanner.type === "success" && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveEventId(null);
                            onNavigateWallet();
                          }}
                          className="mt-2 inline-flex items-center gap-1 font-bold text-emerald-700 underline cursor-pointer"
                        >
                          Open My Ticket Wallet & QR Pass →
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 text-sm disabled:opacity-50 transition cursor-pointer shadow-sm"
                  >
                    {submitting
                      ? "Processing Transaction..."
                      : selectedTicket?.price_minor === 0
                      ? "Confirm Free Registration (৳0)"
                      : `Pay ${formatBDT(totalMinor)} & Issue QR Ticket`}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
