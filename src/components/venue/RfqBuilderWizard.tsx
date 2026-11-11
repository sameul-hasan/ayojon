"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  HelpCircle,
  Layers,
  MapPin,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { PARTNER_VENUES } from "@/lib/venues-catalog";
import { formatBDT } from "@/lib/public-events-shared";
import type { VenueRequest, VenueCategory, VendorCategory } from "@/lib/types";

interface RfqBuilderWizardProps {
  initialRfq?: Partial<VenueRequest>;
  onClose?: () => void;
  onSubmitSuccess?: (newRfq: VenueRequest) => void;
}

const VENUE_CATEGORIES: Array<{ id: VenueCategory; label: string }> = [
  { id: "AUDITORIUM", label: "Auditorium" },
  { id: "CONVENTION_CENTER", label: "Convention Center" },
  { id: "UNIVERSITY_VENUE", label: "University Hall" },
  { id: "INNOVATION_HUB", label: "Innovation Hub / Studio" },
  { id: "BANQUET_HALL", label: "Banquet Hall" },
  { id: "HOTEL", label: "Hotel Ballroom" },
  { id: "ROOFTOP", label: "Rooftop Venue" },
  { id: "OUTDOOR_GARDEN", label: "Outdoor Garden" },
  { id: "CONFERENCE_ROOM", label: "Conference Room" },
];

const VENDOR_SERVICE_CATEGORIES: Array<{ id: VendorCategory; label: string }> = [
  { id: "SOUND_SYSTEM", label: "Sound System & PA" },
  { id: "CATERING", label: "Catering & Buffets" },
  { id: "STAGE_SETUP", label: "Stage Setup & Truss" },
  { id: "LIGHTING", label: "Lighting & Ambient Effects" },
  { id: "PHOTOGRAPHY", label: "Photography & Coverage" },
  { id: "VIDEOGRAPHY", label: "Videography & Livestreaming" },
  { id: "SECURITY", label: "Security & Crowd Control" },
  { id: "EQUIPMENT_RENTAL", label: "Equipment & Projectors" },
];

export function RfqBuilderWizard({
  initialRfq,
  onClose,
  onSubmitSuccess,
}: RfqBuilderWizardProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1: Event Details
  const [eventTitle, setEventTitle] = useState(initialRfq?.event_title || "");
  const [eventType, setEventType] = useState(initialRfq?.event_type || "Tech Conference / Summit");
  const [description, setDescription] = useState(initialRfq?.description || "");
  const [eventDate, setEventDate] = useState(initialRfq?.event_date || "2027-03-15");
  const [alternativeDate, setAlternativeDate] = useState(initialRfq?.alternative_date || "");
  const [startTime, setStartTime] = useState(initialRfq?.start_time || "09:00");
  const [endTime, setEndTime] = useState(initialRfq?.end_time || "18:00");
  const [expectedGuests, setExpectedGuests] = useState(initialRfq?.expected_guests?.toString() || "300");

  // Step 2: Location & Venue
  const [city, setCity] = useState(initialRfq?.location_requirements?.city || "Dhaka");
  const [preferredAreas, setPreferredAreas] = useState<string[]>(
    initialRfq?.location_requirements?.preferred_areas || ["Farmgate", "Gulshan"]
  );
  const [venueCategory, setVenueCategory] = useState<VenueCategory>(
    initialRfq?.location_requirements?.venue_category || "AUDITORIUM"
  );
  const [indoorOutdoor, setIndoorOutdoor] = useState<"INDOOR" | "OUTDOOR" | "ANY">(
    initialRfq?.location_requirements?.indoor_outdoor || "INDOOR"
  );
  const [requiredFacilities, setRequiredFacilities] = useState<string[]>(
    initialRfq?.location_requirements?.required_facilities || ["AC", "GENERATOR", "PARKING", "WIFI"]
  );

  // Step 3: Additional Services
  const [additionalServices, setAdditionalServices] = useState<
    Array<{ category: VendorCategory; description: string; quantity: number; estimated_budget_bdt: number }>
  >(
    initialRfq?.additional_services?.map((s) => ({
      category: s.category,
      description: s.description,
      quantity: s.quantity || 1,
      estimated_budget_bdt: s.estimated_budget_bdt || 20000,
    })) || [
      {
        category: "SOUND_SYSTEM",
        description: "PA system with 4 UHF handheld mics and digital podium sound",
        quantity: 1,
        estimated_budget_bdt: 25000,
      },
    ]
  );

  // Step 4: Budget & Target Providers
  const [totalBudget, setTotalBudget] = useState(
    initialRfq?.budget?.total_budget_bdt?.toString() || "150000"
  );
  const [flexible, setFlexible] = useState(initialRfq?.budget?.flexible ?? true);
  const [targetProviders, setTargetProviders] = useState<string[]>(
    initialRfq?.target_provider_ids || ["usr-venue-kamal", "usr-vendor-tariq"]
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRfq, setSubmittedRfq] = useState<VenueRequest | null>(null);

  // Facility toggle helper
  const toggleFacility = (facility: string) => {
    setRequiredFacilities((prev) =>
      prev.includes(facility) ? prev.filter((f) => f !== facility) : [...prev, facility]
    );
  };

  // Add Service Item
  const handleAddService = () => {
    setAdditionalServices((prev) => [
      ...prev,
      {
        category: "CATERING",
        description: "Standard buffet meal or high tea for attendees",
        quantity: parseInt(expectedGuests) || 100,
        estimated_budget_bdt: 35000,
      },
    ]);
  };

  const handleRemoveService = (index: number) => {
    setAdditionalServices((prev) => prev.filter((_, i) => i !== index));
  };

  const handleServiceChange = (index: number, field: string, value: any) => {
    setAdditionalServices((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const handleFinalSubmit = () => {
    setIsSubmitting(true);

    setTimeout(() => {
      const newRfq: VenueRequest = {
        id: `rfq-${Date.now().toString(36)}`,
        organizer_user_id: "usr-org-nusrat",
        event_title: eventTitle || "Annual Aayojon Gathering",
        event_type: eventType,
        description: description || "Event organized through Aayojon Venue & Quotation Marketplace.",
        event_date: eventDate,
        alternative_date: alternativeDate || undefined,
        start_time: startTime,
        end_time: endTime,
        expected_guests: parseInt(expectedGuests) || 200,
        location_requirements: {
          city,
          preferred_areas: preferredAreas,
          venue_category: venueCategory,
          indoor_outdoor: indoorOutdoor,
          required_facilities: requiredFacilities,
        },
        budget: {
          total_budget_bdt: parseInt(totalBudget) || 120000,
          venue_only_budget_bdt: Math.round((parseInt(totalBudget) || 120000) * 0.6),
          services_budget_bdt: Math.round((parseInt(totalBudget) || 120000) * 0.4),
          flexible,
        },
        additional_services: additionalServices,
        target_provider_ids: targetProviders,
        attachments: [],
        status: "SUBMITTED",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Persist to localStorage for demo persistence
      try {
        const stored = localStorage.getItem("aayojon_custom_rfqs");
        const list: VenueRequest[] = stored ? JSON.parse(stored) : [];
        list.unshift(newRfq);
        localStorage.setItem("aayojon_custom_rfqs", JSON.stringify(list));
      } catch (e) {
        // ignore
      }

      setSubmittedRfq(newRfq);
      setIsSubmitting(false);
      toast({
        title: "RFQ Broadcasted to Providers!",
        description: `Your event requirement ${newRfq.id} has been transmitted to verified partners.`,
        tone: "success",
      });

      if (onSubmitSuccess) {
        onSubmitSuccess(newRfq);
      }
    }, 800);
  };

  return (
    <div className="rounded-card border border-line bg-surface p-6 shadow-pop text-ink max-w-4xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-line pb-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200 mb-1">
            <Building2 className="size-3" />
            <span>Venue & Vendor RFQ Wizard</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-ink">
            {submittedRfq ? "RFQ Submission Confirmation" : "Create Event Requirement (RFQ)"}
          </h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-btn p-1.5 text-ink-muted hover:bg-canvas-alt hover:text-ink transition"
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      {submittedRfq ? (
        <div className="py-8 text-center space-y-5">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-50 text-success border-2 border-emerald-200">
            <CheckCircle2 className="size-9" />
          </div>
          <div>
            <Badge tone="success">Transmitted to Verified Providers</Badge>
            <h3 className="mt-2 text-xl font-bold text-ink">
              {submittedRfq.event_title}
            </h3>
            <p className="text-xs text-ink-muted mt-1">
              Reference ID: <span className="font-mono font-bold text-brand-700">{submittedRfq.id}</span>
            </p>
          </div>

          <div className="max-w-md mx-auto rounded-card border border-line bg-canvas-alt p-4 text-xs space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-ink-muted">Target Event Date:</span>
              <span className="font-semibold">{submittedRfq.event_date} ({submittedRfq.start_time} - {submittedRfq.end_time})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Expected Audience:</span>
              <span className="font-semibold">{submittedRfq.expected_guests} Attendees</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Total Budget:</span>
              <span className="font-bold text-brand-700">{formatBDT(submittedRfq.budget.total_budget_bdt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Venue Category:</span>
              <span className="font-semibold">{submittedRfq.location_requirements.venue_category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Additional Services:</span>
              <span className="font-semibold">{submittedRfq.additional_services.length} services requested</span>
            </div>
          </div>

          <div className="pt-4 flex justify-center gap-3">
            <Button
              variant="primary"
              onClick={() => {
                if (onClose) onClose();
              }}
            >
              Done & Return to Studio
            </Button>
          </div>
        </div>
      ) : (
        <div>
          {/* STEP PROGRESS BAR */}
          <div className="mb-6 grid grid-cols-5 gap-2 text-center text-xs font-semibold">
            {[
              "1. Basic Details",
              "2. Venue Specs",
              "3. Services",
              "4. Budget & Targets",
              "5. Review",
            ].map((title, i) => {
              const stepIdx = i + 1;
              const isActive = step === stepIdx;
              const isPast = step > stepIdx;
              return (
                <div
                  key={i}
                  className={`rounded-btn py-2 border transition ${
                    isActive
                      ? "border-brand-600 bg-brand-50 text-brand-700 ring-1 ring-brand-300"
                      : isPast
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-line bg-canvas-alt text-ink-muted"
                  }`}
                >
                  <span className="block truncate">{title}</span>
                </div>
              );
            })}
          </div>

          {/* STEP 1: EVENT DETAILS */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Input
                    label="Event Title"
                    placeholder="e.g. Bangladesh Tech Innovation Summit 2027"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                  />
                </div>

                <div>
                  <Select
                    label="Event Type / Category"
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                  >
                    <option value="Tech Conference / Summit">Tech Conference / Summit</option>
                    <option value="Hackathon / Coding Sprint">Hackathon / Coding Sprint</option>
                    <option value="Corporate Annual Gala">Corporate Annual Gala</option>
                    <option value="Cultural Concert / Performance">Cultural Concert / Performance</option>
                    <option value="Startup Investor Demo Day">Startup Investor Demo Day</option>
                    <option value="Academic Symposium">Academic Symposium</option>
                  </Select>
                </div>

                <div>
                  <Input
                    label="Expected Guest / Attendee Count"
                    type="number"
                    value={expectedGuests}
                    onChange={(e) => setExpectedGuests(e.target.value)}
                  />
                </div>

                <div>
                  <Input
                    label="Primary Event Date"
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                  />
                </div>

                <div>
                  <Input
                    label="Alternative / Backup Date (Optional)"
                    type="date"
                    value={alternativeDate}
                    onChange={(e) => setAlternativeDate(e.target.value)}
                  />
                </div>

                <div>
                  <Input
                    label="Event Start Time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>

                <div>
                  <Input
                    label="Event End Time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Event Brief & Schedule Summary
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide context regarding stage access, VIP delegates, sponsor booths, and setup requirements..."
                  className="w-full rounded-btn border border-line bg-canvas-alt p-3 text-xs text-ink placeholder:text-ink-muted focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>
          )}

          {/* STEP 2: LOCATION & VENUE SPECS */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Select
                    label="Target City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  >
                    <option value="Dhaka">Dhaka</option>
                    <option value="Chattogram">Chattogram</option>
                    <option value="Sylhet">Sylhet</option>
                    <option value="Rajshahi">Rajshahi</option>
                    <option value="Khulna">Khulna</option>
                  </Select>
                </div>

                <div>
                  <Select
                    label="Venue Category Preference"
                    value={venueCategory}
                    onChange={(e) => setVenueCategory(e.target.value as VenueCategory)}
                  >
                    {VENUE_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Select
                    label="Environment Layout"
                    value={indoorOutdoor}
                    onChange={(e) => setIndoorOutdoor(e.target.value as any)}
                  >
                    <option value="INDOOR">Indoor Only (A/C Hall)</option>
                    <option value="OUTDOOR">Outdoor Open Lawn</option>
                    <option value="ANY">Hybrid / Any</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Preferred Dhaka / City Areas
                  </label>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {["Farmgate", "Gulshan", "Banani", "Palashi", "Kuril", "Dhanmondi"].map((area) => {
                      const isSel = preferredAreas.includes(area);
                      return (
                        <button
                          key={area}
                          type="button"
                          onClick={() => {
                            setPreferredAreas((prev) =>
                              isSel ? prev.filter((a) => a !== area) : [...prev, area]
                            );
                          }}
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium border transition ${
                            isSel
                              ? "border-brand-600 bg-brand-600 text-white"
                              : "border-line bg-canvas-alt text-ink-muted hover:bg-canvas"
                          }`}
                        >
                          {area}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* FACILITIES CHECKLIST */}
              <div className="border-t border-line pt-4">
                <label className="block text-xs font-semibold text-ink mb-2">
                  Mandatory Technical Facilities
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    ["AC", "Central AC"],
                    ["GENERATOR", "Generator (200kVA)"],
                    ["PARKING", "Parking Space"],
                    ["WIFI", "High-Speed WiFi"],
                    ["SOUND_SYSTEM", "Acoustic PA"],
                    ["PROJECTOR", "Stage Projector"],
                    ["GREENROOM", "Greenrooms"],
                    ["RAMP_ACCESS", "Accessible Ramps"],
                  ].map(([id, label]) => {
                    const checked = requiredFacilities.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleFacility(id)}
                        className={`flex items-center gap-2 rounded-btn border p-2.5 text-xs text-left transition ${
                          checked
                            ? "border-brand-600 bg-brand-50 text-brand-800 font-semibold"
                            : "border-line bg-canvas-alt text-ink-muted hover:bg-canvas"
                        }`}
                      >
                        <div
                          className={`flex size-4 shrink-0 items-center justify-center rounded border ${
                            checked ? "border-brand-600 bg-brand-600 text-white" : "border-line bg-surface"
                          }`}
                        >
                          {checked && <CheckCircle2 className="size-3" />}
                        </div>
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ADDITIONAL SERVICES */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-ink">Requested Vendor Services</h3>
                  <p className="text-xs text-ink-muted">
                    Request integrated vendor proposals alongside your venue reservation.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddService}
                  className="gap-1 text-xs"
                >
                  <Plus className="size-3.5" /> Add Service
                </Button>
              </div>

              {additionalServices.length === 0 ? (
                <div className="rounded-card border border-dashed border-line p-6 text-center text-xs text-ink-muted">
                  No additional services added. Click "Add Service" to request sound, catering, or stage fabrication.
                </div>
              ) : (
                <div className="space-y-3">
                  {additionalServices.map((svc, idx) => (
                    <div
                      key={idx}
                      className="rounded-card border border-line bg-canvas-alt p-3.5 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                          <Layers className="size-3.5 text-brand-600" />
                          <span>Service #{idx + 1}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveService(idx)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <div>
                          <Select
                            label="Service Category"
                            value={svc.category}
                            onChange={(e) =>
                              handleServiceChange(idx, "category", e.target.value as VendorCategory)
                            }
                          >
                            {VENDOR_SERVICE_CATEGORIES.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.label}
                              </option>
                            ))}
                          </Select>
                        </div>

                        <div>
                          <Input
                            label="Quantity / Units"
                            type="number"
                            value={svc.quantity}
                            onChange={(e) =>
                              handleServiceChange(idx, "quantity", parseInt(e.target.value) || 1)
                            }
                          />
                        </div>

                        <div>
                          <Input
                            label="Estimated Budget (BDT)"
                            type="number"
                            value={svc.estimated_budget_bdt}
                            onChange={(e) =>
                              handleServiceChange(
                                idx,
                                "estimated_budget_bdt",
                                parseInt(e.target.value) || 0
                              )
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <Input
                          label="Technical Requirements / Deliverables"
                          value={svc.description}
                          onChange={(e) => handleServiceChange(idx, "description", e.target.value)}
                          placeholder="e.g. Line-array sound with digital console and dual technicians on site"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: BUDGET & TARGET PROVIDERS */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Input
                    label="Total Maximum Budget (BDT)"
                    type="number"
                    value={totalBudget}
                    onChange={(e) => setTotalBudget(e.target.value)}
                  />
                  <span className="mt-1 block text-[11px] text-ink-muted">
                    Formatted: <strong className="text-brand-700">{formatBDT(parseInt(totalBudget) || 0)}</strong>
                  </span>
                </div>

                <div>
                  <Select
                    label="Budget Flexibility"
                    value={flexible ? "true" : "false"}
                    onChange={(e) => setFlexible(e.target.value === "true")}
                  >
                    <option value="true">Flexible (+/- 15% for premium venues)</option>
                    <option value="false">Strict / Non-negotiable Institutional Cap</option>
                  </Select>
                </div>
              </div>

              {/* TARGET PROVIDER SELECTION */}
              <div className="border-t border-line pt-4">
                <label className="block text-xs font-semibold text-ink mb-2">
                  Select Target Partner Venues & Providers
                </label>
                <p className="text-xs text-ink-muted mb-3">
                  Transmitting to verified partners ensures compliant bids within 24-48 hours.
                </p>

                <div className="space-y-2">
                  {PARTNER_VENUES.slice(0, 4).map((pv) => {
                    const isSelected = targetProviders.includes(pv.id);
                    return (
                      <div
                        key={pv.id}
                        onClick={() => {
                          setTargetProviders((prev) =>
                            isSelected ? prev.filter((id) => id !== pv.id) : [...prev, pv.id]
                          );
                        }}
                        className={`flex items-center justify-between p-3 rounded-btn border cursor-pointer transition ${
                          isSelected
                            ? "border-brand-600 bg-brand-50"
                            : "border-line bg-surface hover:bg-canvas-alt"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex size-5 items-center justify-center rounded border ${
                              isSelected
                                ? "border-brand-600 bg-brand-600 text-white"
                                : "border-line bg-surface"
                            }`}
                          >
                            {isSelected && <CheckCircle2 className="size-3.5" />}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-ink">{pv.name}</span>
                            <span className="block text-[11px] text-ink-muted">
                              {pv.city} &bull; Capacity: {pv.capacity} seats &bull; Rate: {formatBDT(pv.dailyRateBDT)}
                            </span>
                          </div>
                        </div>
                        <Badge tone="brand">{pv.type}</Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW & SUMMARY */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="rounded-card border border-brand-200 bg-brand-50/40 p-4 text-xs space-y-3">
                <div className="flex items-center justify-between border-b border-brand-200 pb-2">
                  <span className="font-bold text-sm text-brand-900">{eventTitle || "Untitled Event Requirement"}</span>
                  <Badge tone="brand">{eventType}</Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-ink">
                  <div>
                    <span className="block text-[11px] text-ink-muted">Date & Time</span>
                    <span className="font-semibold">{eventDate} ({startTime} - {endTime})</span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-ink-muted">Guest Size</span>
                    <span className="font-semibold">{expectedGuests} Attendees</span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-ink-muted">Total Budget</span>
                    <span className="font-bold text-brand-700">{formatBDT(parseInt(totalBudget) || 0)}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-ink-muted">Location Preference</span>
                    <span className="font-semibold">{city} ({preferredAreas.join(", ")})</span>
                  </div>
                </div>

                <div className="border-t border-brand-200 pt-2">
                  <span className="block text-[11px] text-ink-muted mb-1 font-semibold">Mandatory Facilities:</span>
                  <div className="flex flex-wrap gap-1">
                    {requiredFacilities.map((f) => (
                      <span key={f} className="rounded-full bg-surface border border-line px-2 py-0.5 text-[10px] text-ink">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                {additionalServices.length > 0 && (
                  <div className="border-t border-brand-200 pt-2">
                    <span className="block text-[11px] text-ink-muted mb-1 font-semibold">Requested Vendor Services:</span>
                    <ul className="space-y-1">
                      {additionalServices.map((s, idx) => (
                        <li key={idx} className="flex justify-between text-[11px]">
                          <span>&bull; {s.category} ({s.description})</span>
                          <span className="font-semibold">{formatBDT(s.estimated_budget_bdt)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="rounded-btn border border-line bg-canvas-alt p-3 text-xs text-ink-muted flex items-start gap-2">
                <ShieldCheck className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Once submitted, verified venue coordinators and service providers will review your specifications and issue itemized quotations with price breakdowns.
                </span>
              </div>
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={step === 1 || isSubmitting}
              onClick={() => setStep((s) => (s > 1 ? ((s - 1) as any) : s))}
              className="gap-1.5"
            >
              <ArrowLeft className="size-3.5" /> Previous
            </Button>

            {step < 5 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setStep((s) => (s < 5 ? ((s + 1) as any) : s))}
                className="gap-1.5"
              >
                Next <ArrowRight className="size-3.5" />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
                className="gap-1.5"
              >
                {isSubmitting ? "Transmitting RFQ..." : "Broadcast RFQ"}
                <CheckCircle2 className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

