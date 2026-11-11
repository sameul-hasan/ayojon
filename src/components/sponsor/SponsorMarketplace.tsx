"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Building2,
  CalendarDays,
  CheckCircle,
  CheckCircle2,
  Clock,
  Compass,
  DollarSign,
  ExternalLink,
  FileText,
  Filter,
  Handshake,
  History,
  LayoutDashboard,
  Mail,
  MapPin,
  MessageSquare,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import type { DatabaseState, Profile, EventRecord, SponsorInquiry } from "@/lib/types";
import { formatBDT } from "@/lib/seed";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, StatCard } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { OpportunityCard } from "./OpportunityCard";
import { ProposalForm, type PlacementTier } from "./ProposalForm";
import {
  SponsorshipDetailsModal,
  SPONSOR_TIERS,
} from "./SponsorshipDetailsModal";
import { demoEventImage } from "@/components/marketplace/categoryStyle";

export type SponsorTab =
  | "OVERVIEW"
  | "DISCOVER"
  | "OPPORTUNITIES"
  | "PROPOSALS"
  | "HISTORY"
  | "MESSAGES"
  | "PROFILE"
  | "SETTINGS";

export interface SponsorMarketplaceProps {
  db: DatabaseState;
  currentUser: Profile;
  onAction: (
    action: string,
    payload: Record<string, unknown>,
    overrideActorId?: string
  ) => Promise<unknown>;
}

export function SponsorMarketplace({
  db,
  currentUser,
  onAction,
}: SponsorMarketplaceProps) {
  const publishedEvents = useMemo(
    () => db.events.filter((e) => e.status === "PUBLISHED"),
    [db.events]
  );

  const [activeTab, setActiveTab] = useState<SponsorTab>("OVERVIEW");
  const [selectedEventId, setSelectedEventId] = useState<string>(
    publishedEvents[0]?.id || "evt-dhaka-ai-summit"
  );
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [modalEvent, setModalEvent] = useState<EventRecord | undefined>(undefined);
  const [preselectedTier, setPreselectedTier] = useState<PlacementTier>("GOLD_BOOTH");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [submittedNotice, setSubmittedNotice] = useState<string | null>(null);

  // Profile preferences
  const [companyName, setCompanyName] = useState(
    currentUser.organization_label || "Pathao Ventures"
  );
  const [industry, setIndustry] = useState("Venture Capital & Tech Ecosystem");
  const [website, setWebsite] = useState("https://pathao.com");
  const [profileSaved, setProfileSaved] = useState(false);

  // Filter proposals belonging to current sponsor
  const myProposals = useMemo(
    () =>
      db.sponsor_inquiries.filter(
        (s) =>
          s.sponsor_user_id === currentUser.id ||
          s.contact_email.toLowerCase() === currentUser.email.toLowerCase()
      ),
    [db.sponsor_inquiries, currentUser.id, currentUser.email]
  );

  const activeProposals = myProposals.filter((p) => p.status === "PENDING");
  const acceptedProposals = myProposals.filter((p) => p.status === "APPROVED");
  const totalAudienceReach = publishedEvents.reduce((acc, e) => acc + (e.capacity || 0), 0);

  const selectedEvent =
    publishedEvents.find((e) => e.id === selectedEventId) || publishedEvents[0];

  const handleOpenDetails = (event: EventRecord) => {
    setModalEvent(event);
    setDetailsModalOpen(true);
  };

  const handleTierSelectedFromModal = (tier: "TITLE_SPONSOR" | "GOLD_BOOTH" | "COMMUNITY_PARTNER") => {
    setPreselectedTier(tier);
    setSelectedEventId(modalEvent?.id || selectedEventId);
    setActiveTab("DISCOVER");
  };

  const handleProposalSubmit = async (data: {
    companyName: string;
    budgetBDT: number;
    placementTier: PlacementTier;
    message: string;
  }) => {
    await onAction(
      "SUBMIT_SPONSOR_INQUIRY",
      {
        sponsorName: currentUser.display_name,
        companyName: data.companyName,
        contactEmail: currentUser.email,
        eventId: selectedEventId,
        budgetBDT: data.budgetBDT,
        placementTier: data.placementTier,
        message: data.message,
      },
      "usr-sponsor-farhana"
    );

    setSubmittedNotice(
      `Sponsorship proposal (${data.placementTier.replace(/_/g, " ")} • ৳${data.budgetBDT.toLocaleString()}) submitted to ${selectedEvent?.title}!`
    );
    setActiveTab("PROPOSALS");
  };

  // Filtered events for Discover
  const filteredEvents = publishedEvents.filter((e) => {
    const matchesSearch =
      !searchQuery.trim() ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === "ALL" || e.category_id === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const navItems: Array<{ id: SponsorTab; label: string; icon: React.ReactNode; count?: number }> = [
    { id: "OVERVIEW", label: "Overview", icon: <LayoutDashboard className="size-4" /> },
    { id: "DISCOVER", label: "Discover Events", icon: <Compass className="size-4" />, count: publishedEvents.length },
    { id: "OPPORTUNITIES", label: "Opportunities", icon: <Award className="size-4" /> },
    { id: "PROPOSALS", label: "My Proposals", icon: <FileText className="size-4" />, count: myProposals.length },
    { id: "HISTORY", label: "Proposal History", icon: <History className="size-4" /> },
    { id: "MESSAGES", label: "Messages", icon: <MessageSquare className="size-4" /> },
    { id: "PROFILE", label: "Sponsor Profile", icon: <Building2 className="size-4" /> },
    { id: "SETTINGS", label: "Settings", icon: <Settings className="size-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="rounded-3xl border border-line bg-surface p-6 sm:p-8 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-brand-700">
              <Handshake className="size-3.5" />
              <span>Aayojon Sponsor Marketplace</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              Brand Partnerships & Sponsorship Hub
            </h1>
            <p className="text-xs text-ink-muted">
              Discover verified high-impact events across Bangladesh. Submit structured corporate proposals directly to organizers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-line bg-canvas-alt px-5 py-3 text-center shadow-xs">
              <p className="text-2xl font-extrabold text-brand-700">{acceptedProposals.length}</p>
              <p className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">Accepted</p>
            </div>
            <div className="rounded-2xl border border-line bg-canvas-alt px-5 py-3 text-center shadow-xs">
              <p className="text-2xl font-extrabold text-amber-600">{activeProposals.length}</p>
              <p className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">In Review</p>
            </div>
          </div>
        </div>
      </div>

      {/* SUBMISSION NOTICE BANNER */}
      {submittedNotice && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-xs font-semibold text-brand-800 flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="size-5 text-brand-600 shrink-0" />
            <span>{submittedNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setSubmittedNotice(null)}
            className="text-xs text-brand-700 underline cursor-pointer hover:text-brand-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 8-TAB NAVIGATION BAR */}
      <nav
        aria-label="Sponsor sections"
        className="flex flex-wrap gap-1.5 border-b border-line pb-2.5 overflow-x-auto"
      >
        {navItems.map((it) => {
          const active = activeTab === it.id;
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => setActiveTab(it.id)}
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
      {activeTab === "OVERVIEW" && (
        <div className="space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Sponsorship Opportunities"
              value={publishedEvents.length}
              icon={<Compass className="size-5 text-brand-600" />}
              hint="Verified live events"
            />
            <StatCard
              label="Submitted Proposals"
              value={myProposals.length}
              icon={<FileText className="size-5 text-brand-600" />}
              hint={`${activeProposals.length} active in review`}
            />
            <StatCard
              label="Accepted Partnerships"
              value={acceptedProposals.length}
              icon={<CheckCircle2 className="size-5 text-success" />}
              hint="Approved by event hosts"
            />
            <StatCard
              label="Audience Potential Reach"
              value={`${totalAudienceReach.toLocaleString()}+`}
              icon={<Users className="size-5 text-teal-600" />}
              hint="Combined attendee capacity"
            />
          </div>

          {/* Opportunities Spotlight & Active Proposals Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Featured Event Opportunities */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div>
                  <h2 className="text-base font-bold text-ink">Trending Sponsorship Opportunities</h2>
                  <p className="text-xs text-ink-muted">High engagement summits, fests & conferences</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("DISCOVER")}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                >
                  Explore all ({publishedEvents.length}) <ArrowRight className="size-3" />
                </button>
              </div>

              <div className="space-y-3">
                {publishedEvents.slice(0, 3).map((evt) => {
                  const org = db.organizations.find((o) => o.id === evt.organization_id);
                  return (
                    <OpportunityCard
                      key={evt.id}
                      event={evt}
                      org={org}
                      isSelected={selectedEventId === evt.id}
                      onSelect={() => setSelectedEventId(evt.id)}
                      onOpenDetails={() => handleOpenDetails(evt)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Right: Quick Proposal Submission */}
            <div className="lg:col-span-5 space-y-4">
              <ProposalForm
                selectedEvent={selectedEvent}
                sponsorName={currentUser.display_name}
                contactEmail={currentUser.email}
                initialTier={preselectedTier}
                onSubmit={handleProposalSubmit}
              />
            </div>
          </div>

          {/* Recent Activity */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h2 className="text-base font-bold text-ink">Recent Proposal Activity</h2>
                <p className="text-xs text-ink-muted">Real-time status updates on submitted brand inquiries</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("PROPOSALS")}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                View all proposals →
              </button>
            </div>

            {myProposals.length === 0 ? (
              <EmptyState
                title="No proposals submitted yet"
                description="Explore published events and submit your sponsorship proposal to connect with audiences."
                action={
                  <Button variant="primary" onClick={() => setActiveTab("DISCOVER")}>
                    Discover Opportunities
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {myProposals.slice(0, 4).map((p) => {
                  const evt = db.events.find((e) => e.id === p.event_id);
                  return (
                    <div key={p.id} className="rounded-xl border border-line bg-surface p-4 shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="rounded-md bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-700 uppercase tracking-wider">
                          {p.placement_tier.replace(/_/g, " ")}
                        </span>
                        <Badge tone={p.status === "APPROVED" ? "success" : "warning"}>
                          {p.status}
                        </Badge>
                      </div>
                      <h3 className="font-bold text-sm text-ink truncate">{evt?.title || "Target Event"}</h3>
                      <p className="text-xs text-ink-muted">
                        Offered Budget: <strong className="text-brand-700">{formatBDT(p.budget_minor)}</strong>
                      </p>
                      <p className="text-[11px] text-ink-muted">
                        Submitted: {new Date(p.created_at).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          2. DISCOVER EVENTS
         ======================================================== */}
      {activeTab === "DISCOVER" && (
        <div className="space-y-6">
          {/* Search & Filters */}
          <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5 shadow-card space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 size-4 text-ink-muted" />
                <input
                  type="text"
                  placeholder="Search events by title, keyword, or topic..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-xl border border-line bg-surface pl-10 pr-4 text-xs font-medium text-ink placeholder:text-ink-muted focus:border-brand-600 focus:outline-none"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-10 rounded-xl border border-line bg-surface px-3 text-xs font-semibold text-ink focus:border-brand-600 focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                {db.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid Layout: Opportunities + Selected Form */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-4">
              <h2 className="text-base font-bold text-ink">
                Available Events for Sponsorship ({filteredEvents.length})
              </h2>

              {filteredEvents.length === 0 ? (
                <EmptyState
                  title="No matching events found"
                  description="Try adjusting your keyword or category filters."
                />
              ) : (
                <div className="space-y-3">
                  {filteredEvents.map((evt) => {
                    const org = db.organizations.find((o) => o.id === evt.organization_id);
                    return (
                      <OpportunityCard
                        key={evt.id}
                        event={evt}
                        org={org}
                        isSelected={selectedEventId === evt.id}
                        onSelect={() => setSelectedEventId(evt.id)}
                        onOpenDetails={() => handleOpenDetails(evt)}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            <div className="lg:col-span-5 space-y-4">
              <ProposalForm
                selectedEvent={selectedEvent}
                sponsorName={currentUser.display_name}
                contactEmail={currentUser.email}
                initialTier={preselectedTier}
                onSubmit={handleProposalSubmit}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          3. OPPORTUNITIES (TIERS & PACKAGES SHOWCASE)
         ======================================================== */}
      {activeTab === "OPPORTUNITIES" && (
        <div className="space-y-6">
          <div className="border-b border-line pb-3">
            <h2 className="text-xl font-bold text-ink">Standard Sponsorship Placement Packages</h2>
            <p className="text-xs text-ink-muted">
              Choose from standardized, transparent package tiers designed for maximum brand return on investment
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {SPONSOR_TIERS.map((pkg) => (
              <Card key={pkg.tier} className="p-6 space-y-5 flex flex-col justify-between shadow-card">
                <div className="space-y-3">
                  <span className="rounded-md bg-brand-50 border border-brand-200 px-2.5 py-1 text-[11px] font-bold text-brand-700 uppercase tracking-wider">
                    {pkg.tier.replace(/_/g, " ")}
                  </span>
                  <h3 className="text-lg font-bold text-ink">{pkg.name}</h3>
                  <p className="text-2xl font-extrabold text-brand-700">{formatBDT(pkg.indicativePriceMinor)}</p>
                  <p className="text-xs text-ink-muted">Indicative suggested sponsorship budget</p>

                  <ul className="space-y-2 border-t border-line pt-4 text-xs text-ink/85">
                    {pkg.benefits.map((b, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="size-4 text-success shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  variant="primary"
                  className="w-full justify-center"
                  onClick={() => {
                    setPreselectedTier(pkg.tier);
                    setActiveTab("DISCOVER");
                  }}
                >
                  Select & Apply to Event
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          4. MY PROPOSALS
         ======================================================== */}
      {activeTab === "PROPOSALS" && (
        <div className="space-y-4">
          <div className="border-b border-line pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-ink">My Submitted Proposals ({myProposals.length})</h2>
              <p className="text-xs text-ink-muted">Track the status of your active proposals and organizer responses</p>
            </div>
            <Button size="sm" onClick={() => setActiveTab("DISCOVER")} leftIcon={<Compass className="size-3.5" />}>
              Explore More Events
            </Button>
          </div>

          {myProposals.length === 0 ? (
            <EmptyState
              title="No proposals submitted yet"
              description="Explore events and propose a brand partnership to connect with attendees."
              action={
                <Button variant="primary" onClick={() => setActiveTab("DISCOVER")}>
                  Browse Opportunities
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {myProposals.map((sp) => {
                const evt = db.events.find((e) => e.id === sp.event_id);
                const org = db.organizations.find((o) => o.id === evt?.organization_id);

                return (
                  <Card key={sp.id} className="p-5 shadow-card space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-line pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge tone={sp.status === "APPROVED" ? "success" : "warning"}>
                            {sp.status === "APPROVED" ? <CheckCircle className="size-3 mr-1" /> : <Clock className="size-3 mr-1" />}
                            {sp.status}
                          </Badge>
                          <span className="text-xs font-bold text-ink">{sp.company_name}</span>
                          <span className="font-mono text-xs text-ink-muted">#{sp.id}</span>
                        </div>
                        <h3 className="mt-1 text-base font-bold text-ink">{evt?.title || sp.event_id}</h3>
                        <p className="text-xs text-ink-muted">Host: {org?.name || "Organizer"}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-ink-muted">Offered Budget</span>
                        <p className="text-lg font-extrabold text-brand-700">{formatBDT(sp.budget_minor)}</p>
                      </div>
                    </div>

                    <div className="rounded-xl bg-canvas-alt/70 p-3.5 text-xs text-ink-muted border border-line space-y-1">
                      <p className="font-semibold text-ink">Proposed Deliverables / Note:</p>
                      <p className="leading-relaxed whitespace-pre-wrap">{sp.message}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-ink-muted pt-1">
                      <span>Submitted on {new Date(sp.created_at).toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })}</span>
                      <a
                        href={`mailto:${org?.owner_id || "support@aayojon.com.bd"}?subject=Regarding Sponsorship for ${encodeURIComponent(evt?.title || "")}`}
                        className="font-semibold text-brand-600 hover:text-brand-700"
                      >
                        Contact Organizer
                      </a>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          5. PROPOSAL HISTORY
         ======================================================== */}
      {activeTab === "HISTORY" && (
        <div className="space-y-4">
          <div className="border-b border-line pb-3">
            <h2 className="text-xl font-bold text-ink">Proposal History & Concluded Partnerships</h2>
            <p className="text-xs text-ink-muted">Archived record of all previous event sponsorships and settled contracts</p>
          </div>

          <div className="overflow-x-auto rounded-card border border-line bg-surface shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-canvas-alt text-[11px] uppercase font-semibold text-ink-muted">
                <tr>
                  <th className="px-4 py-3">Proposal ID</th>
                  <th className="px-4 py-3">Target Event</th>
                  <th className="px-4 py-3">Tier</th>
                  <th className="px-4 py-3">Submission Date</th>
                  <th className="px-4 py-3 text-right">Offered Budget</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myProposals.map((sp) => {
                  const evt = db.events.find((e) => e.id === sp.event_id);
                  return (
                    <tr key={sp.id} className="hover:bg-canvas-alt/60 transition">
                      <td className="px-4 py-3 font-mono font-bold text-brand-700">#{sp.id}</td>
                      <td className="px-4 py-3 font-semibold text-ink max-w-[200px] truncate">
                        {evt?.title || sp.event_id}
                      </td>
                      <td className="px-4 py-3 text-ink-muted uppercase">{sp.placement_tier.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3 text-ink-muted">
                        {new Date(sp.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-brand-700">
                        {formatBDT(sp.budget_minor)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge tone={sp.status === "APPROVED" ? "success" : "warning"}>
                          {sp.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          6. MESSAGES & INQUIRIES
         ======================================================== */}
      {activeTab === "MESSAGES" && (
        <div className="space-y-4">
          <div className="border-b border-line pb-3">
            <h2 className="text-xl font-bold text-ink">Inquiry Threads & Organizer Conversations</h2>
            <p className="text-xs text-ink-muted">Direct communication regarding proposal deliverables and contract execution</p>
          </div>

          <div className="space-y-3">
            {myProposals.map((sp) => {
              const evt = db.events.find((e) => e.id === sp.event_id);
              return (
                <Card key={sp.id} className="p-5 shadow-card space-y-3">
                  <div className="flex items-center justify-between border-b border-line pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-ink">{evt?.title || "Event Inquiry"}</span>
                      <span className="rounded bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                        {sp.placement_tier.replace(/_/g, " ")}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-ink-muted">
                      {new Date(sp.created_at).toLocaleDateString("en-GB")}
                    </span>
                  </div>

                  <div className="rounded-xl bg-canvas-alt/80 p-3 text-xs text-ink space-y-1">
                    <p className="font-semibold text-brand-700">Your Initial Proposal:</p>
                    <p className="text-ink-muted whitespace-pre-wrap">{sp.message}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-ink-muted pt-1">
                    <span>Direct status: <strong className="text-ink">{sp.status}</strong></span>
                    <a
                      href={`mailto:${sp.contact_email}?subject=Inquiry Thread #${sp.id}`}
                      className="font-semibold text-brand-600 hover:text-brand-700"
                    >
                      Reply to Thread
                    </a>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================
          7. SPONSOR PROFILE
         ======================================================== */}
      {activeTab === "PROFILE" && (
        <div className="space-y-5 max-w-2xl">
          <div className="border-b border-line pb-3">
            <h2 className="text-xl font-bold text-ink">Corporate Sponsor Profile</h2>
            <p className="text-xs text-ink-muted">Manage your organization's sponsorship brand and contact identity</p>
          </div>

          <Card className="p-6 space-y-5 shadow-card">
            <div className="flex items-center gap-4">
              <span className="flex size-16 items-center justify-center rounded-2xl bg-brand-100 text-2xl font-bold text-brand-700 shadow-sm">
                {companyName.charAt(0)}
              </span>
              <div>
                <h3 className="text-xl font-bold text-ink">{companyName}</h3>
                <p className="text-xs text-ink-muted">{industry}</p>
                <Badge tone="brand" className="mt-1.5">
                  Verified Brand Partner
                </Badge>
              </div>
            </div>

            <div className="space-y-4 border-t border-line pt-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-ink-muted mb-1">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="h-10 w-full rounded-xl border border-line bg-surface px-3 font-semibold text-ink focus:border-brand-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-ink-muted mb-1">Industry / Sector</label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="h-10 w-full rounded-xl border border-line bg-surface px-3 font-semibold text-ink focus:border-brand-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-ink-muted mb-1">Corporate Website</label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="h-10 w-full rounded-xl border border-line bg-surface px-3 font-semibold text-ink focus:border-brand-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-ink-muted mb-1">Primary Representative</label>
                <input
                  type="text"
                  disabled
                  value={`${currentUser.display_name} (${currentUser.email})`}
                  className="h-10 w-full rounded-xl border border-line bg-canvas-alt px-3 font-medium text-ink-muted cursor-not-allowed"
                />
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  onClick={() => {
                    setProfileSaved(true);
                    setTimeout(() => setProfileSaved(false), 2500);
                  }}
                >
                  Save Profile Details
                </Button>
                {profileSaved && (
                  <span className="ml-3 font-semibold text-success animate-in fade-in">
                    Profile saved successfully!
                  </span>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================
          8. SETTINGS
         ======================================================== */}
      {activeTab === "SETTINGS" && (
        <div className="space-y-5 max-w-xl">
          <div className="border-b border-line pb-3">
            <h2 className="text-xl font-bold text-ink">Settings & Notifications</h2>
            <p className="text-xs text-ink-muted">Configure notification alerts and sponsorship communication channels</p>
          </div>

          <Card className="p-6 space-y-4 shadow-card">
            <h3 className="text-base font-bold text-ink">Email Notifications</h3>
            <div className="space-y-3 text-xs text-ink-muted border-t border-line pt-3">
              <label className="flex items-center gap-2 cursor-pointer text-ink font-medium">
                <input type="checkbox" defaultChecked className="size-4 accent-brand-600" />
                <span>Notify me immediately when an event host responds to my proposal</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-ink font-medium">
                <input type="checkbox" defaultChecked className="size-4 accent-brand-600" />
                <span>Weekly digest of new high-impact tech & university sponsorship opportunities</span>
              </label>
            </div>
          </Card>
        </div>
      )}

      {/* SPONSORSHIP DETAILS MODAL */}
      <SponsorshipDetailsModal
        event={modalEvent}
        org={db.organizations.find((o) => o.id === modalEvent?.organization_id)}
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        onSelectTier={handleTierSelectedFromModal}
      />
    </div>
  );
}
