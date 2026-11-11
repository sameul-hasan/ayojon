"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "@/components/ui/Link";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Filter,
  Layers,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  Users,
  X,
  AlertCircle,
  Briefcase,
  Store,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { formatBDT } from "@/lib/public-events-shared";
import { fetchDatabaseState, dispatchStateAction } from "@/lib/client-api";
import type {
  Quotation,
  QuotationLineItem,
  VenueRequest,
  VenueBooking,
  VenueProfile,
} from "@/lib/types";
import { PARTNER_VENUES } from "@/lib/venues-catalog";
import { RfqMessageThread } from "@/components/venue/RfqMessageThread";

type ProviderSubTab =
  | "OVERVIEW"
  | "INCOMING_RFQS"
  | "QUOTATION_BUILDER"
  | "MY_QUOTATIONS"
  | "BOOKINGS"
  | "LISTINGS"
  | "MESSAGES";

const SEED_RFQS: VenueRequest[] = [
  {
    id: "rfq-hackathon-2026",
    organizer_user_id: "usr-org-nusrat",
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

const SEED_QUOTATIONS: Quotation[] = [
  {
    id: "qt-kib-001",
    rfq_id: "rfq-hackathon-2026",
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
    terms_conditions: "Hall must be vacated by 23:00. No smoking or open flames inside auditorium.",
    created_at: "2026-11-06T11:00:00Z",
    updated_at: "2026-11-06T11:00:00Z",
  },
];

export function ProviderWorkspaceView() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<ProviderSubTab>("OVERVIEW");

  // RFQs state
  const [rfqs, setRfqs] = useState<VenueRequest[]>(SEED_RFQS);
  const [quotations, setQuotations] = useState<Quotation[]>(SEED_QUOTATIONS);
  const [selectedRfqForQuote, setSelectedRfqForQuote] = useState<VenueRequest | null>(SEED_RFQS[0]);

  useEffect(() => {
    let active = true;
    fetchDatabaseState().then((db) => {
      if (!active) return;
      if (db.venue_requests && db.venue_requests.length > 0) {
        setRfqs(db.venue_requests);
        setSelectedRfqForQuote(db.venue_requests[0]);
      }
      if (db.quotations && db.quotations.length > 0) {
        setQuotations(db.quotations);
      }
      if (db.venue_bookings && db.venue_bookings.length > 0) {
        setBookings(db.venue_bookings);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Quotation Builder Form State
  const [quoteItems, setQuoteItems] = useState<QuotationLineItem[]>([
    {
      id: "li-1",
      description: "Full Day Auditorium Rental",
      quantity: 1,
      unit_price_bdt: 85000,
      total_bdt: 85000,
      category: "VENUE_RENTAL",
    },
    {
      id: "li-2",
      description: "Standby 200kVA Generator Fuel Coverage",
      quantity: 1,
      unit_price_bdt: 5000,
      total_bdt: 5000,
      category: "LOGISTICS",
    },
  ]);
  const [discountBDT, setDiscountBDT] = useState("5000");
  const [taxBDT, setTaxBDT] = useState("0");
  const [depositPct, setDepositPct] = useState("50");
  const [inclusionsText, setInclusionsText] = useState(
    "1,200 Tiered Seating Access\nCentral HVAC Air Conditioning\nDual Greenroom Access\n250 Vehicle Parking"
  );
  const [exclusionsText, setExclusionsText] = useState(
    "Outside stage fabrication cleaning\nOvertime past 23:00 (৳4,000/hr)"
  );
  const [cancellationPolicy, setCancellationPolicy] = useState(
    "100% refund up to 14 days prior; 50% refund up to 7 days."
  );
  const [termsText, setTermsText] = useState(
    "Hall must be vacated by 23:00 sharp in accordance with civic zoning."
  );

  // Compute live quote math
  const subtotalBDT = quoteItems.reduce((acc, curr) => acc + curr.total_bdt, 0);
  const parsedDiscount = parseInt(discountBDT) || 0;
  const parsedTax = parseInt(taxBDT) || 0;
  const grandTotalBDT = Math.max(0, subtotalBDT - parsedDiscount + parsedTax);

  // Confirmed bookings list
  const [bookings, setBookings] = useState<VenueBooking[]>([
    {
      id: "vb-kib-demo-1",
      rfq_id: "rfq-hackathon-2026",
      accepted_quotation_id: "qt-kib-001",
      organizer_user_id: "usr-org-nusrat",
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
  ]);

  // Handle line item change
  const handleItemChange = (index: number, field: keyof QuotationLineItem, val: any) => {
    setQuoteItems((prev) => {
      const copy = [...prev];
      const target = { ...copy[index], [field]: val };
      if (field === "quantity" || field === "unit_price_bdt") {
        target.total_bdt = (target.quantity || 1) * (target.unit_price_bdt || 0);
      }
      copy[index] = target;
      return copy;
    });
  };

  const handleAddItem = () => {
    setQuoteItems((prev) => [
      ...prev,
      {
        id: `li-${Date.now()}`,
        description: "Additional Audio / Tech Support",
        quantity: 1,
        unit_price_bdt: 10000,
        total_bdt: 10000,
        category: "SERVICE",
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setQuoteItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit quote
  const handleSubmitQuotation = () => {
    if (!selectedRfqForQuote) return;

    const newQuote: Quotation = {
      id: `qt-${Date.now().toString(36)}`,
      rfq_id: selectedRfqForQuote.id,
      provider_user_id: "usr-venue-kamal",
      provider_type: "VENUE_OWNER",
      provider_name: "Krishibid Institution Bangladesh (KIB)",
      venue_id: "vp-kib",
      status: "SUBMITTED",
      revision_number: 1,
      valid_until: new Date(Date.now() + 14 * 86400000).toISOString(),
      line_items: quoteItems,
      subtotal_bdt: subtotalBDT,
      discount_bdt: parsedDiscount,
      tax_bdt: parsedTax,
      grand_total_bdt: grandTotalBDT,
      inclusions: inclusionsText.split("\n").filter((l) => l.trim().length > 0),
      exclusions: exclusionsText.split("\n").filter((l) => l.trim().length > 0),
      setup_charges_bdt: 0,
      transport_charges_bdt: 0,
      payment_terms: {
        deposit_percentage: parseInt(depositPct) || 50,
        deposit_due_days_before: 14,
        final_payment_due: "BEFORE_EVENT",
      },
      cancellation_policy: cancellationPolicy,
      terms_conditions: termsText,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setQuotations((prev) => [newQuote, ...prev]);
    dispatchStateAction("SUBMIT_PROVIDER_QUOTATION", newQuote as unknown as Record<string, unknown>);
    toast({
      title: "Itemized Quotation Transmitted!",
      description: `Quotation ${newQuote.id} sent to organizer for ${formatBDT(grandTotalBDT)}.`,
      tone: "success",
    });
    setActiveTab("MY_QUOTATIONS");
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 mb-1.5">
            <Building2 className="size-3.5" />
            <span>Venue Host & Vendor Commercial Studio</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Provider Workbench
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-ink-muted">
            Manage your venue profile, respond to RFQs, build itemized quotations, negotiate terms, and lock booking dates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab("QUOTATION_BUILDER")}
            className="gap-1.5 text-xs"
          >
            <Plus className="size-3.5" /> Prepare Quotation
          </Button>
          <Link href="/venues">
            <Button variant="primary" size="sm" className="gap-1.5 text-xs">
              <Store className="size-3.5" /> Public Directory
            </Button>
          </Link>
        </div>
      </div>

      {/* SUBTABS BAR */}
      <div className="flex border-b border-line overflow-x-auto no-scrollbar gap-1 text-xs font-semibold">
        {[
          { id: "OVERVIEW", label: "Overview", icon: TrendingUp },
          { id: "INCOMING_RFQS", label: `Incoming RFQs (${rfqs.length})`, icon: FileText },
          { id: "QUOTATION_BUILDER", label: "Quotation Builder", icon: Layers },
          { id: "MY_QUOTATIONS", label: `Sent Quotes (${quotations.length})`, icon: DollarSign },
          { id: "BOOKINGS", label: `Bookings (${bookings.length})`, icon: Calendar },
          { id: "LISTINGS", label: "Space & Services Catalog", icon: Building2 },
          { id: "MESSAGES", label: "Inquiries & Chat", icon: MessageSquare },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as ProviderSubTab)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 transition whitespace-nowrap ${
                isActive
                  ? "border-brand-600 text-brand-700 bg-brand-50/50"
                  : "border-transparent text-ink-muted hover:text-ink hover:bg-canvas-alt"
              }`}
            >
              <Icon className="size-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. OVERVIEW */}
      {activeTab === "OVERVIEW" && (
        <div className="space-y-6">
          {/* METRIC CARDS */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4 border-line bg-surface shadow-card">
              <span className="text-xs text-ink-muted">Incoming RFQ Leads</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-ink">{rfqs.length}</span>
                <Badge tone="brand">Active Leads</Badge>
              </div>
              <span className="mt-2 block text-[11px] text-ink-muted">Awaiting your formal quotation</span>
            </Card>

            <Card className="p-4 border-line bg-surface shadow-card">
              <span className="text-xs text-ink-muted">Sent Proposals</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-brand-700">{quotations.length}</span>
                <span className="text-xs font-semibold text-emerald-600">100% On-time</span>
              </div>
              <span className="mt-2 block text-[11px] text-ink-muted">Average turnaround: 3.5 hours</span>
            </Card>

            <Card className="p-4 border-line bg-surface shadow-card">
              <span className="text-xs text-ink-muted">Confirmed Space Bookings</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-emerald-600">{bookings.length}</span>
                <Badge tone="success">Deposit Verified</Badge>
              </div>
              <span className="mt-2 block text-[11px] text-ink-muted">Feb 15, 2027 confirmed</span>
            </Card>

            <Card className="p-4 border-line bg-surface shadow-card">
              <span className="text-xs text-ink-muted">Gross Booked Pipeline</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-brand-700">৳85,000</span>
                <span className="text-xs font-semibold text-ink-muted">BDT</span>
              </div>
              <span className="mt-2 block text-[11px] text-ink-muted">৳42,500 held in escrow</span>
            </Card>
          </div>

          {/* RECENT INCOMING RFQ CALLOUT */}
          <div className="rounded-card border border-brand-200 bg-brand-50/40 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">
                  High Priority Organizer Request
                </span>
                <h3 className="text-lg font-bold text-ink mt-0.5">
                  Dhaka Tech Hackathon 2026 (400 Attendees)
                </h3>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setSelectedRfqForQuote(rfqs[0]);
                  setActiveTab("QUOTATION_BUILDER");
                }}
                className="gap-1.5"
              >
                <span>Draft Quotation</span>
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
            <p className="text-xs text-ink-muted">
              Organized by BUET Computer Club. Requires full-day auditorium hall, 200kVA generator backup, and high-speed network. Target budget: ৳150,000.
            </p>
          </div>
        </div>
      )}

      {/* 2. INCOMING RFQS */}
      {activeTab === "INCOMING_RFQS" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-ink">Organizer Event Requirements (RFQs)</h2>
              <p className="text-xs text-ink-muted">
                Review client parameters and issue itemized quotations to secure bookings.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {rfqs.map((rfq) => (
              <Card key={rfq.id} className="p-5 border-line bg-surface shadow-card space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge tone="brand">{rfq.location_requirements.venue_category || "VENUE"}</Badge>
                      <Badge tone="neutral">{rfq.event_type}</Badge>
                    </div>
                    <h3 className="text-base font-bold text-ink">{rfq.event_title}</h3>
                    <p className="text-xs text-ink-muted mt-1">{rfq.description}</p>
                  </div>

                  <div className="text-right">
                    <span className="block text-[11px] text-ink-muted">Target Budget</span>
                    <span className="text-lg font-bold text-brand-700">
                      {formatBDT(rfq.budget.total_budget_bdt)}
                    </span>
                    <span className="block text-[10px] text-emerald-600">
                      {rfq.budget.flexible ? "Flexible Budget" : "Fixed Cap"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-canvas-alt p-3 rounded-btn border border-line">
                  <div>
                    <span className="block text-[10px] text-ink-muted">Event Date:</span>
                    <span className="font-semibold text-ink">{rfq.event_date}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-ink-muted">Operating Hours:</span>
                    <span className="font-semibold text-ink">{rfq.start_time} - {rfq.end_time}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-ink-muted">Guest Count:</span>
                    <span className="font-semibold text-ink">{rfq.expected_guests} Seats</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-ink-muted">City / Area:</span>
                    <span className="font-semibold text-ink">{rfq.location_requirements.city}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-line">
                  <div className="flex flex-wrap gap-1">
                    {rfq.location_requirements.required_facilities.map((fac) => (
                      <span
                        key={fac}
                        className="rounded-full bg-canvas px-2.5 py-0.5 text-[10px] text-ink-muted border border-line"
                      >
                        {fac}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab("MESSAGES")}
                      className="text-xs"
                    >
                      <MessageSquare className="size-3.5 mr-1" /> Clarify
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setSelectedRfqForQuote(rfq);
                        setActiveTab("QUOTATION_BUILDER");
                      }}
                      className="text-xs"
                    >
                      Build Quotation &rarr;
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 3. QUOTATION WORKBENCH */}
      {activeTab === "QUOTATION_BUILDER" && (
        <div className="space-y-6">
          <div className="rounded-card border border-line bg-surface p-6 shadow-card space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
              <div>
                <span className="text-xs font-semibold text-brand-700 uppercase tracking-wider">
                  Itemized Quotation Workbench
                </span>
                <h2 className="text-xl font-bold text-ink">
                  Quotation for: {selectedRfqForQuote?.event_title || "Direct Proposal"}
                </h2>
              </div>
              <Badge tone="brand">Target Budget: {formatBDT(selectedRfqForQuote?.budget.total_budget_bdt || 150000)}</Badge>
            </div>

            {/* DYNAMIC LINE ITEMS TABLE */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                  <Layers className="size-3.5 text-brand-600" /> Line Items Breakdown
                </span>
                <Button variant="outline" size="sm" onClick={handleAddItem} className="gap-1 text-xs">
                  <Plus className="size-3" /> Add Line Item
                </Button>
              </div>

              <div className="rounded-card border border-line overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-canvas-alt border-b border-line text-[10px] font-bold text-ink-muted uppercase">
                    <tr>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2">Item Description</th>
                      <th className="px-3 py-2 w-20 text-center">Qty</th>
                      <th className="px-3 py-2 w-32 text-right">Unit Rate (BDT)</th>
                      <th className="px-3 py-2 w-32 text-right">Total (BDT)</th>
                      <th className="px-2 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {quoteItems.map((item, idx) => (
                      <tr key={item.id} className="bg-surface hover:bg-canvas/50">
                        <td className="px-3 py-2">
                          <select
                            value={item.category}
                            onChange={(e) => handleItemChange(idx, "category", e.target.value)}
                            className="w-full rounded border border-line bg-canvas-alt p-1 text-[11px]"
                          >
                            <option value="VENUE_RENTAL">Venue Rental</option>
                            <option value="SERVICE">Service</option>
                            <option value="EQUIPMENT">Equipment</option>
                            <option value="LOGISTICS">Logistics / Power</option>
                            <option value="DISCOUNT">Discount</option>
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                            className="w-full rounded border border-line bg-canvas-alt px-2 py-1 text-xs text-ink"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, "quantity", parseInt(e.target.value) || 1)}
                            className="w-16 rounded border border-line bg-canvas-alt px-1 py-1 text-xs text-center"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            value={item.unit_price_bdt}
                            onChange={(e) =>
                              handleItemChange(idx, "unit_price_bdt", parseInt(e.target.value) || 0)
                            }
                            className="w-28 rounded border border-line bg-canvas-alt px-2 py-1 text-xs text-right"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-ink">
                          {formatBDT(item.total_bdt)}
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* CALCULATION TOTALS */}
              <div className="flex justify-end pt-2">
                <div className="w-72 space-y-2 rounded-card border border-line bg-canvas-alt p-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-ink-muted">Gross Subtotal:</span>
                    <span className="font-semibold text-ink">{formatBDT(subtotalBDT)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-ink-muted">Academic / Partner Discount:</span>
                    <input
                      type="number"
                      value={discountBDT}
                      onChange={(e) => setDiscountBDT(e.target.value)}
                      className="w-24 rounded border border-line bg-surface px-1.5 py-0.5 text-right font-semibold text-emerald-600"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-ink-muted">VAT / Taxes (BDT):</span>
                    <input
                      type="number"
                      value={taxBDT}
                      onChange={(e) => setTaxBDT(e.target.value)}
                      className="w-24 rounded border border-line bg-surface px-1.5 py-0.5 text-right"
                    />
                  </div>
                  <div className="border-t border-line pt-2 flex justify-between items-center text-sm font-bold text-brand-700">
                    <span>Grand Total:</span>
                    <span>{formatBDT(grandTotalBDT)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* INCLUSIONS, POLICIES & TERMS */}
            <div className="grid gap-4 sm:grid-cols-2 border-t border-line pt-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Inclusions (One per line)
                </label>
                <textarea
                  rows={4}
                  value={inclusionsText}
                  onChange={(e) => setInclusionsText(e.target.value)}
                  className="w-full rounded-btn border border-line bg-canvas-alt p-2.5 text-xs text-ink"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Exclusions & Additional Charges (One per line)
                </label>
                <textarea
                  rows={4}
                  value={exclusionsText}
                  onChange={(e) => setExclusionsText(e.target.value)}
                  className="w-full rounded-btn border border-line bg-canvas-alt p-2.5 text-xs text-ink"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Required Deposit Percentage (%)
                </label>
                <Select value={depositPct} onChange={(e) => setDepositPct(e.target.value)}>
                  <option value="30">30% Advance Deposit</option>
                  <option value="50">50% Standard Advance Deposit</option>
                  <option value="100">100% Full Payment Upfront</option>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Cancellation & Refund Policy
                </label>
                <input
                  type="text"
                  value={cancellationPolicy}
                  onChange={(e) => setCancellationPolicy(e.target.value)}
                  className="w-full rounded-btn border border-line bg-canvas-alt px-3 py-2 text-xs text-ink"
                />
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="flex justify-end gap-3 pt-4 border-t border-line">
              <Button variant="outline" size="sm" onClick={() => setActiveTab("INCOMING_RFQS")}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSubmitQuotation} className="gap-1.5">
                <CheckCircle2 className="size-4" />
                <span>Submit Quotation ({formatBDT(grandTotalBDT)})</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 4. SENT QUOTATIONS */}
      {activeTab === "MY_QUOTATIONS" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-ink">Submitted Quotations ({quotations.length})</h2>
          </div>

          <div className="space-y-3">
            {quotations.map((q) => (
              <Card key={q.id} className="p-5 border-line bg-surface shadow-card space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge tone="success">Rev #{q.revision_number}</Badge>
                      <Badge tone="brand">{q.status}</Badge>
                    </div>
                    <h3 className="text-base font-bold text-ink">{q.provider_name}</h3>
                    <span className="text-xs text-ink-muted">RFQ Ref: {q.rfq_id}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-xl font-bold text-brand-700">
                      {formatBDT(q.grand_total_bdt)}
                    </span>
                    <span className="block text-[11px] text-ink-muted">
                      Deposit: {q.payment_terms.deposit_percentage}%
                    </span>
                  </div>
                </div>

                <div className="rounded-btn border border-line bg-canvas-alt p-3 text-xs">
                  <span className="font-semibold text-ink">Included: </span>
                  <span className="text-ink-muted">{q.inclusions.join(" • ")}</span>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-line">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedRfqForQuote(rfqs[0]);
                      setActiveTab("QUOTATION_BUILDER");
                    }}
                    className="text-xs"
                  >
                    Revise Quotation (Rev #{q.revision_number + 1})
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 5. CONFIRMED BOOKINGS */}
      {activeTab === "BOOKINGS" && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-ink">Confirmed Bookings & Calendar Locks</h2>

          <div className="space-y-3">
            {bookings.map((b) => (
              <Card key={b.id} className="p-5 border-line bg-surface shadow-card space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge tone="success">Date Locked</Badge>
                    <h3 className="text-base font-bold text-ink mt-1">
                      Reserved for: {b.event_date}
                    </h3>
                    <span className="text-xs text-ink-muted font-mono">Voucher: {b.id}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-xl font-bold text-brand-700">
                      {formatBDT(b.total_agreed_bdt)}
                    </span>
                    <span className="block text-xs font-semibold text-emerald-600">
                      Deposit Received: {formatBDT(b.deposit_paid_bdt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-line text-ink-muted">
                  <span>Escrow Ref: {b.payment_reference_id}</span>
                  <span>Balance Due: Event Morning</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 6. LISTINGS */}
      {activeTab === "LISTINGS" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-ink">Your Registered Space & Service Catalog</h2>
              <p className="text-xs text-ink-muted">
                Keep your technical specifications and indicative pricing up-to-date for direct inquiries.
              </p>
            </div>
            <Link href="/venues">
              <Button variant="outline" size="sm" className="text-xs">
                View Public Listing
              </Button>
            </Link>
          </div>

          <Card className="p-5 border-line bg-surface shadow-card space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-lg bg-brand-100 text-brand-700 font-bold">
                KIB
              </div>
              <div>
                <h3 className="text-base font-bold text-ink">
                  Krishibid Institution Bangladesh (KIB) Auditorium
                </h3>
                <span className="text-xs text-ink-muted">Khamarbari Road, Farmgate, Dhaka 1215</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs bg-canvas-alt p-3 rounded-btn border border-line text-center">
              <div>
                <span className="block text-[10px] text-ink-muted">Capacity</span>
                <span className="font-bold text-ink">1,200 Seats</span>
              </div>
              <div>
                <span className="block text-[10px] text-ink-muted">Daily Rate</span>
                <span className="font-bold text-brand-700">৳85,000</span>
              </div>
              <div>
                <span className="block text-[10px] text-ink-muted">Status</span>
                <span className="font-bold text-emerald-600">Aayojon Verified</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 7. MESSAGES */}
      {activeTab === "MESSAGES" && (
        <div className="max-w-2xl">
          <RfqMessageThread
            rfqId="rfq-hackathon-2026"
            providerName="Krishibid Institution Bangladesh (KIB)"
            currentRole="PROVIDER"
          />
        </div>
      )}
    </div>
  );
}

