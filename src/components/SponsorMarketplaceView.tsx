"use client";

import React, { useState } from "react";
import {
  Handshake,
  Sparkles,
  CheckCircle2,
  Building2,
  Send,
  Users,
  Calendar,
} from "lucide-react";
import { DatabaseState, Profile } from "@/lib/types";
import { formatBDT } from "@/lib/seed";

interface SponsorMarketplaceViewProps {
  db: DatabaseState;
  currentUser: Profile;
  onAction: (
    action: string,
    payload: Record<string, unknown>,
    overrideActorId?: string
  ) => Promise<unknown>;
}

export function SponsorMarketplaceView({
  db,
  currentUser,
  onAction,
}: SponsorMarketplaceViewProps) {
  const [selectedEventId, setSelectedEventId] = useState(
    "evt-dhaka-ai-summit"
  );
  const [companyName, setCompanyName] = useState("Pathao Ventures");
  const [budgetBDT, setBudgetBDT] = useState(100000);
  const [placementTier, setPlacementTier] = useState<
    "TITLE_SPONSOR" | "GOLD_BOOTH" | "COMMUNITY_PARTNER"
  >("GOLD_BOOTH");
  const [message, setMessage] = useState(
    "We would like to sponsor an engineering booth and campus hiring lounge."
  );
  const [submittedNotice, setSubmittedNotice] = useState<string | null>(null);

  const publishedEvents = db.events.filter((e) => e.status === "PUBLISHED");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAction(
      "SUBMIT_SPONSOR_INQUIRY",
      {
        sponsorName: currentUser.display_name,
        companyName,
        contactEmail: currentUser.email,
        eventId: selectedEventId,
        budgetBDT,
        placementTier,
        message,
      },
      "usr-sponsor-farhana"
    );
    setSubmittedNotice(
      `Sponsorship proposal (${placementTier.replace(
        "_",
        " "
      )} • ৳${budgetBDT.toLocaleString()}) sent to event organizer!`
    );
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Handshake className="h-4 w-4 text-amber-700" />
          <span>SPONSOR & VENDOR PLACEMENT MARKETPLACE (PRD SECTION 4)</span>
        </div>
        <h1 className="mt-2 text-2xl font-extrabold text-slate-900 tracking-tight">
          Partner with University Clubs, Tech Summits & Cultural Festivals
        </h1>
        <p className="mt-1 text-xs text-slate-600">
          Discover high-engagement Bangladesh events, inspect verified audience capacity, and submit sponsorship placement proposals.
        </p>
      </div>

      {/* SUBMISSION NOTICE */}
      {submittedNotice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{submittedNotice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Sponsor-Ready Events */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-base font-bold text-slate-900">
            Sponsor-Ready Public Events ({publishedEvents.length})
          </h2>
          <div className="space-y-3">
            {publishedEvents.map((evt) => {
              const org = db.organizations.find(
                (o) => o.id === evt.organization_id
              );
              return (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEventId(evt.id)}
                  className={`rounded-2xl border p-4 transition cursor-pointer ${
                    selectedEventId === evt.id
                      ? "border-emerald-600 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-600"
                      : "bg-white border-slate-200 shadow-sm hover:border-slate-300 hover:shadow"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-semibold text-emerald-700">
                        {org?.name}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">
                        {evt.title}
                      </h3>
                    </div>
                    <span className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
                      Capacity: {evt.capacity}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{evt.tagline}</p>
                  <div className="mt-2.5 flex items-center gap-4 text-[11px] text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                      {new Date(evt.starts_at).toLocaleDateString("en-GB")}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-amber-600" />
                      {evt.views_count} page views
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 5 Cols: Submit Sponsorship Proposal Form & Existing Inquiries */}
        <div className="lg:col-span-5 space-y-5">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3.5 text-xs shadow-sm"
          >
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-emerald-600" />
              Express Sponsorship / Booth Interest
            </h3>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Selected Event</label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition"
              >
                {publishedEvents.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Brand / Company Name
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Proposed Budget (BDT ৳)
                </label>
                <input
                  type="number"
                  min={5000}
                  step={5000}
                  value={budgetBDT}
                  onChange={(e) => setBudgetBDT(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-emerald-700 font-bold focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Placement Tier</label>
              <select
                value={placementTier}
                onChange={(e) =>
                  setPlacementTier(
                    e.target.value as
                      | "TITLE_SPONSOR"
                      | "GOLD_BOOTH"
                      | "COMMUNITY_PARTNER"
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition"
              >
                <option value="TITLE_SPONSOR">Title Sponsor & Keynote Branding</option>
                <option value="GOLD_BOOTH">Gold Expo Booth & Recruitment Stall</option>
                <option value="COMMUNITY_PARTNER">Community & Merchandise Partner</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Message to Organizer</label>
              <textarea
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition"
              />
            </div>
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 cursor-pointer shadow-sm transition"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Submit Sponsorship Placement Request</span>
            </button>
          </form>

          {/* ACTIVE PROPOSALS LIST */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2.5 text-xs shadow-sm">
            <h4 className="font-bold text-slate-900">
              Active Sponsorship Placements ({db.sponsor_inquiries.length})
            </h4>
            {db.sponsor_inquiries.map((sp) => {
              const evt = db.events.find((e) => e.id === sp.event_id);
              return (
                <div
                  key={sp.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1 text-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      {sp.company_name} ({sp.placement_tier.replace("_", " ")})
                    </span>
                    <span className="font-bold text-emerald-700">
                      {formatBDT(sp.budget_minor)}
                    </span>
                  </div>
                  <p className="text-slate-600">{evt?.title}</p>
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold border ${
                      sp.status === "APPROVED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {sp.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
