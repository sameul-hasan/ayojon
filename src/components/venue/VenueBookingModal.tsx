"use client";

import React, { useState } from "react";
import {
  CalendarDays,
  Clock,
  Users,
  CheckCircle2,
  Building2,
  Phone,
  Mail,
  ShieldCheck,
  Sparkles,
  MapPin,
  X,
} from "lucide-react";
import type { PartnerVenue } from "@/lib/venues-catalog";
import { formatBDT } from "@/lib/public-events-shared";
import { dispatchStateAction } from "@/lib/client-api";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";

interface VenueBookingModalProps {
  venue: PartnerVenue | null;
  open: boolean;
  onClose: () => void;
}

export function VenueBookingModal({ venue, open, onClose }: VenueBookingModalProps) {
  const { toast } = useToast();
  const [date, setDate] = useState("");
  const [shift, setShift] = useState<"morning" | "evening" | "full">("full");
  const [guests, setGuests] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [needsSoundTech, setNeedsSoundTech] = useState(true);
  const [needsLivestream, setNeedsLivestream] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!open || !venue) return null;

  // Calculate dynamic quote
  const baseRate = shift === "full" ? venue.dailyRateBDT : venue.hourlyRateBDT * 4;
  const soundTechCost = needsSoundTech ? 4000 : 0;
  const livestreamCost = needsLivestream ? 8000 : 0;
  const totalEstimatedCost = baseRate + soundTechCost + livestreamCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const refCode = `AYJ-VEN-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      await dispatchStateAction("BOOK_VENUE_ESCROW", {
        id: refCode.toLowerCase(),
        venue_id: venue.id,
        venue_name: venue.name,
        event_title: eventTitle,
        organizer_name: organizerName,
        organizer_phone: phone,
        organizer_email: email,
        booking_date: date,
        shift,
        expected_guests: Number(guests) || 100,
        total_cost_bdt: totalEstimatedCost,
        status: "CONFIRMED",
      });

      setSubmittedRef(refCode);
      toast({
        title: "Venue Reservation Request Submitted!",
        description: `Booking reference ${refCode} has been sent to venue coordinator.`,
        tone: "success",
      });
    } catch {
      setSubmittedRef(refCode);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmittedRef(null);
    setDate("");
    setGuests("");
    setEventTitle("");
    setOrganizerName("");
    setPhone("");
    setEmail("");
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm animate-in fade-in"
    >
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-card border border-line bg-surface p-6 shadow-pop text-ink">
        <button
          onClick={handleReset}
          className="absolute right-4 top-4 rounded-btn p-1.5 text-ink-muted hover:bg-canvas-alt hover:text-ink transition"
          aria-label="Close dialog"
        >
          <X className="size-5" />
        </button>

        {submittedRef ? (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50 text-success border border-emerald-200">
              <CheckCircle2 className="size-7" />
            </div>
            <div>
              <Badge tone="success">Reservation Request Sent</Badge>
              <h3 className="mt-2 text-2xl font-bold text-ink">Booking Reference: {submittedRef}</h3>
              <p className="mt-1 text-sm text-ink-muted">
                Your reservation inquiry for <strong className="text-ink">{venue.name}</strong> on{" "}
                <span className="font-semibold text-ink">{date || "selected date"}</span> has been transmitted.
              </p>
            </div>

            <div className="rounded-btn border border-line bg-canvas p-4 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-ink-muted">Venue:</span>
                <span className="font-semibold">{venue.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Slot / Shift:</span>
                <span className="font-semibold capitalize">{shift} Day</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Estimated Quote:</span>
                <span className="font-bold text-brand-700">{formatBDT(totalEstimatedCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Coordinator Contact:</span>
                <span className="font-semibold">{venue.contactPhone}</span>
              </div>
            </div>

            <p className="text-xs text-ink-muted">
              Aayojon Venue Team will connect via phone and email within 2 business hours to confirm availability and schedule a walkthrough.
            </p>

            <Button onClick={handleReset} className="w-full">
              Close & Return to Venues
            </Button>
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <Badge tone="brand">Partner Venue</Badge>
                <span className="text-xs text-ink-muted flex items-center gap-1">
                  <MapPin className="size-3 text-brand-600" /> {venue.city}
                </span>
              </div>
              <h2 className="mt-2 text-xl font-bold text-ink">{venue.name}</h2>
              <p className="text-xs text-ink-muted mt-0.5">{venue.address}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Event Date *</label>
                  <Input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Shift / Slot *</label>
                  <Select
                    value={shift}
                    onChange={(e) => setShift(e.target.value as any)}
                  >
                    <option value="full">Full Day (9:00 AM - 9:00 PM) · {formatBDT(venue.dailyRateBDT)}</option>
                    <option value="morning">Morning Shift (9:00 AM - 1:00 PM) · {formatBDT(venue.hourlyRateBDT * 4)}</option>
                    <option value="evening">Evening Gala (5:00 PM - 10:00 PM) · {formatBDT(venue.hourlyRateBDT * 5)}</option>
                  </Select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Expected Attendees *</label>
                  <Input
                    type="number"
                    placeholder={`Max capacity: ${venue.capacity}`}
                    max={venue.capacity}
                    required
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Event Title *</label>
                  <Input
                    placeholder="e.g. Bangladesh Tech Fest 2026"
                    required
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Organizer / Org Name *</label>
                  <Input
                    placeholder="e.g. BUET Cyber Club"
                    required
                    value={organizerName}
                    onChange={(e) => setOrganizerName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Mobile (+880) *</label>
                  <Input
                    placeholder="01700-000000"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Email *</label>
                  <Input
                    type="email"
                    placeholder="contact@org.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Add-ons */}
              <div className="rounded-btn border border-line bg-canvas p-3 space-y-2">
                <span className="text-xs font-semibold text-ink block">Technical & Operational Add-ons</span>
                <div className="grid gap-2 text-xs sm:grid-cols-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={needsSoundTech}
                      onChange={(e) => setNeedsSoundTech(e.target.checked)}
                      className="rounded text-brand-600 focus:ring-brand-500"
                    />
                    <span>Dedicated Sound Engineer (+৳4,000)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={needsLivestream}
                      onChange={(e) => setNeedsLivestream(e.target.checked)}
                      className="rounded text-brand-600 focus:ring-brand-500"
                    />
                    <span>4K Multi-camera Stream Rig (+৳8,000)</span>
                  </label>
                </div>
              </div>

              {/* Cost Summary */}
              <div className="rounded-btn bg-brand-50 border border-brand-200 p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-xs text-brand-700 block font-medium">Estimated Booking Total</span>
                  <span className="text-xs text-ink-muted">Subject to date confirmation & refundable security deposit</span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-brand-700">{formatBDT(totalEstimatedCost)}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={handleReset}>
                  Cancel
                </Button>
                <Button type="submit" loading={submitting}>
                  Request Booking Reservation
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

