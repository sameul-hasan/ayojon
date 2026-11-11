"use client";

import React, { useState } from "react";
import { Check, ArrowRight, ArrowLeft, Sparkles, Calendar, MapPin, Ticket, ShieldCheck } from "lucide-react";
import type { Category, Venue } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Stepper } from "@/components/ui/Stepper";
import { Badge } from "@/components/ui/Badge";
import { formatBDT } from "@/lib/seed";

const WIZARD_STEPS = [
  "Basic Info",
  "Date & Venue",
  "Capacity & Tickets",
  "Theme & Style",
  "Review & Publish",
];

export interface CreateEventWizardProps {
  categories: Category[];
  venues: Venue[];
  onSubmit: (data: {
    title: string;
    categoryId: string;
    description: string;
    startsAt: string;
    endsAt: string;
    isOnline: boolean;
    venueName: string;
    venueCity: string;
    capacity: number;
    ticketName: string;
    ticketPriceBDT: number;
    themeColor: string;
  }) => Promise<void>;
  onCancel: () => void;
}

export function CreateEventWizard({
  categories,
  venues,
  onSubmit,
  onCancel,
}: CreateEventWizardProps) {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("Dhaka FinTech & Open Banking Forum 2027");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "cat-conf");
  const [description, setDescription] = useState(
    "National summit bringing together engineering leaders, startup founders, payment processors, and banking regulators."
  );
  const [startsAt, setStartsAt] = useState("2027-02-15T10:00");
  const [endsAt, setEndsAt] = useState("2027-02-15T17:00");
  const [isOnline, setIsOnline] = useState(false);
  const [venueName, setVenueName] = useState("BICC Carnival Hall, Agargaon");
  const [venueCity, setVenueCity] = useState("Dhaka");
  const [capacity, setCapacity] = useState(200);
  const [ticketName, setTicketName] = useState("Delegate Pass");
  const [ticketPriceBDT, setTicketPriceBDT] = useState(500);
  const [themeColor, setThemeColor] = useState("#6D28D9");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = () => setStep((s) => Math.min(WIZARD_STEPS.length, s + 1));
  const handleBack = () => setStep((s) => Math.max(1, s - 1));

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        title,
        categoryId,
        description,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        isOnline,
        venueName,
        venueCity,
        capacity,
        ticketName,
        ticketPriceBDT,
        themeColor,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6 shadow-card space-y-6 max-w-3xl mx-auto">
      <div className="border-b border-line pb-4">
        <h2 className="text-xl font-bold text-ink">Multi-Step Event Creation Wizard</h2>
        <p className="text-xs text-ink-muted">Configure and publish your event with instant draft persistence</p>
      </div>

      <Stepper steps={WIZARD_STEPS} current={step} />

      {/* STEP 1: BASIC INFO */}
      {step === 1 && (
        <div className="space-y-4">
          <Input
            label="Event Title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Bangladesh AI & Engineering Summit 2027"
          />
          <Select
            label="Event Category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.name_bn})
              </option>
            ))}
          </Select>
          <Textarea
            label="Full Description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your event, who should attend, and what will happen..."
          />
        </div>
      )}

      {/* STEP 2: DATE & VENUE */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Starts At"
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />
            <Input
              label="Ends At"
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-ink">
              <input
                type="checkbox"
                checked={isOnline}
                onChange={(e) => setIsOnline(e.target.checked)}
                className="size-4 accent-brand-600 rounded"
              />
              <span>This is an Online Event (Zoom / Google Meet link provided after registration)</span>
            </label>
          </div>

          {!isOnline && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="sm:col-span-2">
                <Input
                  label="Venue / Auditorium Name"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                />
              </div>
              <div>
                <Select
                  label="City"
                  value={venueCity}
                  onChange={(e) => setVenueCity(e.target.value)}
                >
                  <option value="Dhaka">Dhaka</option>
                  <option value="Chattogram">Chattogram</option>
                  <option value="Sylhet">Sylhet</option>
                  <option value="Rajshahi">Rajshahi</option>
                  <option value="Khulna">Khulna</option>
                </Select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 3: CAPACITY & TICKETS */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Input
                label="Maximum Total Capacity"
                type="number"
                min={10}
                max={50000}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
              />
            </div>
            <div>
              <Input
                label="Primary Pass Name"
                value={ticketName}
                onChange={(e) => setTicketName(e.target.value)}
              />
            </div>
            <div>
              <Input
                label="Ticket Price (BDT ৳)"
                type="number"
                min={0}
                step={50}
                value={ticketPriceBDT}
                onChange={(e) => setTicketPriceBDT(Number(e.target.value))}
              />
            </div>
          </div>
          <p className="text-xs text-ink-muted">
            Enter 0 for Free Registration tickets. Paid tickets calculate the standard 2.5% ticketing platform fee automatically.
          </p>
        </div>
      )}

      {/* STEP 4: THEME & STYLE */}
      {step === 4 && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">Brand Accent Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                className="size-10 rounded cursor-pointer border border-line"
              />
              <span className="font-mono text-xs font-bold text-ink">{themeColor}</span>
            </div>
          </div>
          <p className="text-xs text-ink-muted">
            This theme accent will be used for badges, gradient covers, and event highlights on the public portal.
          </p>
        </div>
      )}

      {/* STEP 5: REVIEW & PUBLISH */}
      {step === 5 && (
        <div className="space-y-4">
          <div className="rounded-btn bg-canvas-alt border border-line p-4 space-y-2 text-xs">
            <h4 className="font-bold text-ink text-sm">{title}</h4>
            <p className="text-ink-muted line-clamp-2">{description}</p>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line/60">
              <div>
                <span className="text-ink-muted">Date:</span>{" "}
                <strong>{new Date(startsAt).toLocaleDateString("en-GB")}</strong>
              </div>
              <div>
                <span className="text-ink-muted">Location:</span>{" "}
                <strong>{isOnline ? "Online" : `${venueName}, ${venueCity}`}</strong>
              </div>
              <div>
                <span className="text-ink-muted">Capacity:</span> <strong>{capacity} attendees</strong>
              </div>
              <div>
                <span className="text-ink-muted">Ticket:</span>{" "}
                <strong>{ticketName} — {ticketPriceBDT === 0 ? "Free" : `৳${ticketPriceBDT}`}</strong>
              </div>
            </div>
          </div>

          <div className="rounded-btn bg-brand-50 border border-brand-200 p-3 text-brand-700 text-xs flex items-center gap-2">
            <ShieldCheck className="size-4 shrink-0" />
            <span>Ready to publish! Your draft will be created and saved directly to the database.</span>
          </div>
        </div>
      )}

      {/* FOOTER ACTIONS */}
      <div className="flex items-center justify-between border-t border-line pt-4">
        {step > 1 ? (
          <Button variant="outline" size="sm" onClick={handleBack} leftIcon={<ArrowLeft className="size-3.5" />}>
            Back
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}

        {step < WIZARD_STEPS.length ? (
          <Button size="sm" onClick={handleNext}>
            <span>Continue</span>
            <ArrowRight className="size-3.5 ml-1" />
          </Button>
        ) : (
          <Button size="sm" loading={isSubmitting} onClick={handleFinish} leftIcon={<Sparkles className="size-3.5" />}>
            Publish Event Draft
          </Button>
        )}
      </div>
    </Card>
  );
}

