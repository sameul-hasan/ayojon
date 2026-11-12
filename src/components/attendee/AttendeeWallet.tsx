"use client";

import React, { useEffect, useState } from "react";
import Link from "@/components/ui/Link";
import {
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Heart,
  History,
  Lock,
  MapPin,
  QrCode,
  Receipt,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Ticket,
  Trash2,
  User,
} from "lucide-react";
import type { DatabaseState, Profile, TicketRecord, EventRecord } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, StatCard } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { TicketCard, TicketQrModal } from "./TicketCard";
import { BookingHistory } from "./BookingHistory";
import { formatBDT } from "@/lib/ui/cn";
import { coverGradient, demoEventImage } from "@/components/marketplace/categoryStyle";

export type WalletSection =
  | "overview"
  | "tickets"
  | "upcoming"
  | "past"
  | "saved"
  | "orders"
  | "profile"
  | "settings";

interface AttendeeWalletProps {
  db: DatabaseState;
  currentUser: Profile;
  onSendToScanner?: (qrToken: string, eventId: string) => void;
  onVerifyPendingOrder?: (orderId: string) => Promise<void>;
  initialSection?: WalletSection;
}

const CITIES = ["Dhaka", "Chattogram", "Sylhet", "Rajshahi", "Khulna"] as const;
const INTEREST_OPTIONS = ["Music", "Technology", "Business", "Art & Culture", "Education", "Sports", "Startups"];

export function AttendeeWallet({
  db,
  currentUser,
  onSendToScanner,
  onVerifyPendingOrder,
  initialSection = "overview",
}: AttendeeWalletProps) {
  const [section, setSection] = useState<WalletSection>(initialSection);
  const [selectedTicket, setSelectedTicket] = useState<TicketRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [ticketSearch, setTicketSearch] = useState("");
  const [ticketStatusFilter, setTicketStatusFilter] = useState<"ALL" | "VALID" | "USED" | "CANCELLED">("ALL");

  // Profile edit state
  const [preferredCity, setPreferredCity] = useState(currentUser.preferred_city || "Dhaka");
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    currentUser.interests.length ? currentUser.interests : ["Technology", "Startups"]
  );
  const [profileSaved, setProfileSaved] = useState(false);

  // Saved events state from localStorage
  const [savedEventIds, setSavedEventIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("aayojon:favorites");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setSavedEventIds(parsed);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const handleRemoveFavorite = (eventId: string) => {
    const updated = savedEventIds.filter((id) => id !== eventId);
    setSavedEventIds(updated);
    try {
      window.localStorage.setItem("aayojon:favorites", JSON.stringify(updated));
    } catch {
      /* ignore */
    }
  };

  const handleSavePreferences = () => {
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  // Tickets belonging to current user
  const myTickets = db.tickets.filter(
    (t) =>
      t.attendee_email.toLowerCase() === currentUser.email.toLowerCase() ||
      db.registrations.some((r) => r.id === t.registration_id && r.user_id === currentUser.id)
  );

  // Orders placed by current user
  const myOrders = db.orders.filter(
    (o) =>
      o.buyer_user_id === currentUser.id ||
      o.attendee_email.toLowerCase() === currentUser.email.toLowerCase()
  );

  const now = new Date().getTime();
  const upcomingTickets = myTickets.filter((t) => {
    const e = db.events.find((x) => x.id === t.event_id);
    return !e || new Date(e.ends_at).getTime() >= now;
  });
  const pastTickets = myTickets.filter((t) => {
    const e = db.events.find((x) => x.id === t.event_id);
    return e && new Date(e.ends_at).getTime() < now;
  });

  const validCount = myTickets.filter((t) => t.status === "VALID").length;
  const usedCount = myTickets.filter((t) => t.status === "USED").length;

  // Filtered tickets in "My Tickets"
  const filteredTickets = myTickets.filter((t) => {
    const event = db.events.find((e) => e.id === t.event_id);
    const matchesSearch =
      !ticketSearch.trim() ||
      (event && event.title.toLowerCase().includes(ticketSearch.toLowerCase())) ||
      t.ticket_type_name.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      t.id.toLowerCase().includes(ticketSearch.toLowerCase());

    const matchesStatus = ticketStatusFilter === "ALL" || t.status === ticketStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Saved events list
  const savedEvents = db.events.filter((e) => savedEventIds.includes(e.id));

  const handleOpenQr = (t: TicketRecord) => {
    setSelectedTicket(t);
    setModalOpen(true);
  };

  const navItems: Array<{ id: WalletSection; label: string; icon: React.ReactNode; count?: number }> = [
    { id: "overview", label: "Overview", icon: <Sparkles className="size-4" /> },
    { id: "tickets", label: "My Tickets", icon: <Ticket className="size-4" />, count: myTickets.length },
    { id: "upcoming", label: "Upcoming", icon: <CalendarDays className="size-4" />, count: upcomingTickets.length },
    { id: "past", label: "Past Events", icon: <History className="size-4" />, count: pastTickets.length },
    { id: "saved", label: "Saved Events", icon: <Heart className="size-4" />, count: savedEvents.length },
    { id: "orders", label: "Booking History", icon: <Receipt className="size-4" />, count: myOrders.length },
    { id: "profile", label: "Profile", icon: <User className="size-4" /> },
    { id: "settings", label: "Settings", icon: <Settings className="size-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Wallet Header */}
      <div className="rounded-3xl border border-line bg-surface p-6 sm:p-8 shadow-card">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-700">
              <Ticket className="size-3.5" />
              <span>Attendee Dashboard & Digital Wallet</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              Welcome back, {currentUser.display_name}!
            </h1>
            <p className="text-xs text-ink-muted">
              {currentUser.email} · {currentUser.organization_label || "Independent Attendee"} · Preferred City:{" "}
              <strong className="text-ink">{preferredCity}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-line bg-canvas-alt px-5 py-3 text-center shadow-xs">
              <p className="text-2xl font-extrabold text-success">{validCount}</p>
              <p className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">Active Passes</p>
            </div>
            <div className="rounded-2xl border border-line bg-canvas-alt px-5 py-3 text-center shadow-xs">
              <p className="text-2xl font-extrabold text-brand-700">{usedCount}</p>
              <p className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">Checked In</p>
            </div>
          </div>
        </div>
      </div>

      {/* Portal Inner Navigation */}
      <nav
        aria-label="Wallet sections"
        className="flex flex-wrap gap-1.5 border-b border-line pb-2.5 overflow-x-auto"
      >
        {navItems.map((it) => {
          const active = section === it.id;
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => setSection(it.id)}
              aria-current={active ? "page" : undefined}
              className={`inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                active
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-ink-muted hover:bg-canvas-alt hover:text-ink"
              }`}
            >
              {it.icon}
              <span>{it.label}</span>
              {typeof it.count === "number" && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    active ? "bg-white/20 text-white" : "bg-canvas-alt text-ink"
                  }`}
                >
                  {it.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ========================================================
          1. OVERVIEW
         ======================================================== */}
      {section === "overview" && (
        <div className="space-y-8">
          {/* Quick Metrics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Tickets" value={myTickets.length} icon={<Ticket className="size-5" />} />
            <StatCard
              label="Active Passes"
              value={validCount}
              icon={<CheckCircle2 className="size-5 text-success" />}
            />
            <StatCard label="Checked In" value={usedCount} icon={<Clock className="size-5 text-brand-600" />} />
            <StatCard label="Saved Events" value={savedEvents.length} icon={<Heart className="size-5 text-pink" />} />
          </div>

          {/* Upcoming Entry Passes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h2 className="text-lg font-bold text-ink">Upcoming Entry Passes</h2>
                <p className="text-xs text-ink-muted">Present your QR code at the event gate</p>
              </div>
              {upcomingTickets.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSection("upcoming")}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  View all ({upcomingTickets.length})
                </button>
              )}
            </div>

            {upcomingTickets.length === 0 ? (
              <EmptyState
                title="No upcoming passes"
                description="You don't have any active event tickets right now. Explore concerts, tech fests, and workshops across Bangladesh!"
                action={
                  <Link
                    href="/events"
                    className="inline-flex h-11 items-center rounded-btn bg-brand-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
                  >
                    Browse events
                  </Link>
                }
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {upcomingTickets.slice(0, 4).map((t) => (
                  <TicketCard
                    key={t.id}
                    ticket={t}
                    db={db}
                    onOpenQr={handleOpenQr}
                    onSendToScanner={onSendToScanner}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Saved Events Preview (if any exist) */}
          {savedEvents.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div>
                  <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                    <Heart className="size-4 text-pink" /> Saved Events ({savedEvents.length})
                  </h2>
                  <p className="text-xs text-ink-muted">Events you bookmarked on this device</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSection("saved")}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  Manage all
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {savedEvents.slice(0, 3).map((e) => (
                  <Card key={e.id} className="overflow-hidden p-4 space-y-3">
                    <div className="relative h-28 w-full overflow-hidden rounded-xl bg-canvas-alt">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={demoEventImage(e.category_id)}
                        alt={e.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-ink line-clamp-1">{e.title}</h3>
                      <p className="text-xs text-ink-muted mt-1">
                        {new Date(e.starts_at).toLocaleString("en-GB", {
                          dateStyle: "medium",
                          timeZone: "Asia/Dhaka",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center justify-between border-t border-line pt-2">
                      <Link
                        href={`/events/${e.slug}`}
                        className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                      >
                        View Event
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleRemoveFavorite(e.id)}
                        className="text-xs text-ink-muted hover:text-danger"
                      >
                        Remove
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Recent Orders */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h2 className="text-lg font-bold text-ink">Recent Booking Orders</h2>
                <p className="text-xs text-ink-muted">Transaction history and official payment receipts</p>
              </div>
              {myOrders.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSection("orders")}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  View all ({myOrders.length})
                </button>
              )}
            </div>

            {myOrders.length === 0 ? (
              <EmptyState title="No orders placed yet" />
            ) : (
              <BookingHistory
                orders={myOrders.slice(0, 3)}
                db={db}
                onVerifyPendingOrder={onVerifyPendingOrder}
              />
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          2. MY TICKETS
         ======================================================== */}
      {section === "tickets" && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line pb-4">
            <div>
              <h2 className="text-xl font-bold text-ink">All Issued Tickets ({myTickets.length})</h2>
              <p className="text-xs text-ink-muted">Manage your passes and expand QR codes for gate check-in</p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {(["ALL", "VALID", "USED", "CANCELLED"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setTicketStatusFilter(st)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    ticketStatusFilter === st
                      ? "bg-brand-600 text-white"
                      : "bg-canvas-alt text-ink-muted hover:text-ink"
                  }`}
                >
                  {st === "ALL" ? "All" : st}
                </button>
              ))}
            </div>
          </div>

          {/* Search box */}
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-3 size-4 text-ink-muted" />
            <input
              type="text"
              placeholder="Search by event title, tier, or ticket #..."
              value={ticketSearch}
              onChange={(e) => setTicketSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-line bg-surface pl-10 pr-4 text-xs font-medium text-ink placeholder:text-ink-muted focus:border-brand-600 focus:outline-none"
            />
          </div>

          {filteredTickets.length === 0 ? (
            <EmptyState
              title="No matching tickets found"
              description="Register or purchase tickets to have them appear in your digital wallet."
              action={
                <Link
                  href="/events"
                  className="inline-flex h-11 items-center rounded-btn bg-brand-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
                >
                  Discover events
                </Link>
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredTickets.map((t) => (
                <TicketCard
                  key={t.id}
                  ticket={t}
                  db={db}
                  onOpenQr={handleOpenQr}
                  onSendToScanner={onSendToScanner}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          3. UPCOMING EVENTS
         ======================================================== */}
      {section === "upcoming" && (
        <div className="space-y-4">
          <div className="border-b border-line pb-3">
            <h2 className="text-xl font-bold text-ink">Upcoming Event Passes ({upcomingTickets.length})</h2>
            <p className="text-xs text-ink-muted">Active and upcoming admission passes</p>
          </div>
          {upcomingTickets.length === 0 ? (
            <EmptyState
              title="No upcoming event passes"
              description="Explore trending events in your city and book tickets with bKash, Nagad or cards."
              action={
                <Link
                  href="/events"
                  className="inline-flex h-11 items-center rounded-btn bg-brand-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
                >
                  Browse Events
                </Link>
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {upcomingTickets.map((t) => (
                <TicketCard
                  key={t.id}
                  ticket={t}
                  db={db}
                  onOpenQr={handleOpenQr}
                  onSendToScanner={onSendToScanner}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          4. PAST EVENTS
         ======================================================== */}
      {section === "past" && (
        <div className="space-y-4">
          <div className="border-b border-line pb-3">
            <h2 className="text-xl font-bold text-ink">Past Event Passes ({pastTickets.length})</h2>
            <p className="text-xs text-ink-muted">Events you have attended or booked in the past</p>
          </div>
          {pastTickets.length === 0 ? (
            <EmptyState title="No past event history" />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pastTickets.map((t) => (
                <TicketCard
                  key={t.id}
                  ticket={t}
                  db={db}
                  onOpenQr={handleOpenQr}
                  onSendToScanner={onSendToScanner}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          5. SAVED EVENTS
         ======================================================== */}
      {section === "saved" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h2 className="text-xl font-bold text-ink flex items-center gap-2">
                <Heart className="size-5 text-pink" /> Saved Events ({savedEvents.length})
              </h2>
              <p className="text-xs text-ink-muted">Events you marked with a heart on this browser</p>
            </div>
          </div>

          {savedEvents.length === 0 ? (
            <Card className="p-8 text-center space-y-3">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-pink/10 text-pink">
                <Heart className="size-7" />
              </div>
              <h3 className="text-base font-bold text-ink">No Saved Events Yet</h3>
              <p className="mx-auto max-w-md text-xs text-ink-muted leading-relaxed">
                When browsing events on Aayojon, tap the heart icon on any card to save it here for quick access later.
              </p>
              <div className="pt-2">
                <Link
                  href="/events"
                  className="inline-flex h-11 items-center rounded-btn bg-brand-600 px-5 text-xs font-semibold text-white shadow-sm hover:bg-brand-700"
                >
                  Explore Events to Save
                </Link>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {savedEvents.map((e) => {
                const venue = e.venue_id ? db.venues.find((v) => v.id === e.venue_id) : undefined;
                return (
                  <Card key={e.id} className="overflow-hidden p-4 space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="relative h-36 w-full overflow-hidden rounded-xl bg-canvas-alt">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={demoEventImage(e.category_id)}
                          alt={e.title}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveFavorite(e.id)}
                          aria-label={`Remove ${e.title} from favorites`}
                          className="absolute right-2.5 top-2.5 flex size-8 items-center justify-center rounded-full bg-white/90 text-danger shadow-sm hover:bg-white"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>

                      <h3 className="mt-3 font-bold text-base text-ink line-clamp-1">{e.title}</h3>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted">
                        <CalendarDays className="size-3.5 text-brand-600" />
                        {new Date(e.starts_at).toLocaleString("en-GB", {
                          dateStyle: "medium",
                          timeZone: "Asia/Dhaka",
                        })}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-muted">
                        <MapPin className="size-3.5 text-pink" />
                        {e.is_online ? "Online Event" : `${venue?.name ?? "Dhaka"}, ${venue?.city ?? ""}`}
                      </p>
                    </div>

                    <div className="border-t border-line pt-3 flex items-center justify-between">
                      <Link
                        href={`/events/${e.slug}`}
                        className="inline-flex h-9 items-center justify-center rounded-btn bg-brand-600 px-4 text-xs font-semibold text-white hover:bg-brand-700"
                      >
                        Book Tickets
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleRemoveFavorite(e.id)}
                        className="text-xs text-ink-muted hover:text-danger"
                      >
                        Remove
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          6. BOOKING HISTORY
         ======================================================== */}
      {section === "orders" && (
        <div className="space-y-4">
          <div className="border-b border-line pb-3">
            <h2 className="text-xl font-bold text-ink">Booking History & Receipts ({myOrders.length})</h2>
            <p className="text-xs text-ink-muted">
              Complete log of all ticket orders, package purchases, and payment statuses
            </p>
          </div>
          {myOrders.length === 0 ? (
            <EmptyState
              title="No order history"
              description="Your order invoices and receipts will appear here once you place an order."
              action={
                <Link
                  href="/events"
                  className="inline-flex h-11 items-center rounded-btn bg-brand-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
                >
                  Browse Events
                </Link>
              }
            />
          ) : (
            <BookingHistory
              orders={myOrders}
              db={db}
              onVerifyPendingOrder={onVerifyPendingOrder}
            />
          )}
        </div>
      )}

      {/* ========================================================
          7. PROFILE
         ======================================================== */}
      {section === "profile" && (
        <div className="space-y-5">
          <div className="border-b border-line pb-3">
            <h2 className="text-xl font-bold text-ink">Attendee Profile & Preferences</h2>
            <p className="text-xs text-ink-muted">Manage your personal details and discovery preferences</p>
          </div>

          <div className="grid gap-6 md:grid-cols-[1fr_360px]">
            <Card className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <span className="flex size-16 items-center justify-center rounded-2xl bg-brand-100 text-2xl font-bold text-brand-700 shadow-sm">
                  {currentUser.display_name.charAt(0)}
                </span>
                <div>
                  <h3 className="text-xl font-bold text-ink">{currentUser.display_name}</h3>
                  <p className="text-xs text-ink-muted">{currentUser.email}</p>
                  <Badge tone="brand" className="mt-1.5">
                    {currentUser.platform_role}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4 border-t border-line pt-4">
                <div>
                  <label htmlFor="pref-city" className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                    Preferred Event City
                  </label>
                  <select
                    id="pref-city"
                    value={preferredCity}
                    onChange={(e) => setPreferredCity(e.target.value)}
                    className="h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-sm font-semibold text-ink focus:border-brand-600 focus:outline-none"
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
                    Event Interests & Categories
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {INTEREST_OPTIONS.map((cat) => {
                      const selected = selectedInterests.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            if (selected) {
                              setSelectedInterests(selectedInterests.filter((x) => x !== cat));
                            } else {
                              setSelectedInterests([...selectedInterests, cat]);
                            }
                          }}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                            selected
                              ? "bg-brand-600 text-white shadow-xs"
                              : "bg-canvas-alt text-ink-muted hover:text-ink"
                          }`}
                        >
                          <span>{cat}</span>
                          {selected && <Check className="size-3" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2">
                  <Button variant="primary" onClick={handleSavePreferences} leftIcon={<Check className="size-4" />}>
                    Save Preferences
                  </Button>
                  {profileSaved && (
                    <span className="ml-3 text-xs font-semibold text-success animate-in fade-in">
                      Preferences saved successfully!
                    </span>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-6 space-y-4 h-fit">
              <h3 className="text-sm font-bold text-ink uppercase tracking-wider text-ink-muted">Account Information</h3>
              <dl className="space-y-3 text-xs">
                <div>
                  <dt className="text-ink-muted">Phone Number</dt>
                  <dd className="font-semibold text-ink text-sm">{currentUser.phone || "Not set"}</dd>
                </div>
                <div>
                  <dt className="text-ink-muted">Affiliation</dt>
                  <dd className="font-semibold text-ink text-sm">{currentUser.organization_label || "Independent"}</dd>
                </div>
                <div>
                  <dt className="text-ink-muted">User ID</dt>
                  <dd className="font-mono text-ink-muted">{currentUser.id}</dd>
                </div>
                <div>
                  <dt className="text-ink-muted">Member Since</dt>
                  <dd className="font-medium text-ink">
                    {new Date(currentUser.created_at).toLocaleDateString("en-GB", {
                      month: "long",
                      year: "numeric",
                    })}
                  </dd>
                </div>
              </dl>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================
          8. SETTINGS
         ======================================================== */}
      {section === "settings" && (
        <div className="space-y-5">
          <div className="border-b border-line pb-3">
            <h2 className="text-xl font-bold text-ink">Settings & Security</h2>
            <p className="text-xs text-ink-muted">Configure access, privacy, and notifications</p>
          </div>

          <div className="max-w-xl space-y-4">
            <Card className="p-6 space-y-4">
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <Lock className="size-4 text-brand-600" /> Security & Protection
              </h3>
              <div className="flex items-center justify-between text-xs border-b border-line pb-3">
                <div>
                  <p className="font-semibold text-ink">Multi-Factor Authentication (MFA)</p>
                  <p className="text-ink-muted">Protect your account and ticket access</p>
                </div>
                <Badge tone={currentUser.mfa_enabled ? "success" : "neutral"}>
                  {currentUser.mfa_enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-ink">Ticket Hash Standard</p>
                  <p className="text-ink-muted">Tamper-evident verification</p>
                </div>
                <span className="font-mono text-[11px] font-bold text-brand-700">SHA-256 standard</span>
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <Bell className="size-4 text-brand-600" /> Notifications & Communications
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Tickets, gate entry passes, and organizer schedule alerts are automatically dispatched to{" "}
                <strong className="text-ink">{currentUser.email}</strong>.
              </p>
              <div className="rounded-xl bg-canvas-alt/70 p-3.5 text-xs text-ink-muted border border-line">
                SMS gate notifications are sent for events with live time changes.
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* QR Modal */}
      <TicketQrModal
        ticket={selectedTicket}
        db={db}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedTicket(null);
        }}
      />
    </div>
  );
}
