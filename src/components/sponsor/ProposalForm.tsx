"use client";

import React, { useEffect, useState } from "react";
import { Send, ShieldCheck, CheckCircle2, Paperclip, Sparkles } from "lucide-react";
import type { EventRecord } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { formatBDT } from "@/lib/seed";

export type PlacementTier =
  | "TITLE_SPONSOR"
  | "GOLD_BOOTH"
  | "COMMUNITY_PARTNER";

export interface ProposalFormProps {
  selectedEvent: EventRecord | undefined;
  sponsorName: string;
  contactEmail: string;
  initialTier?: PlacementTier;
  onSubmit: (data: {
    companyName: string;
    budgetBDT: number;
    placementTier: PlacementTier;
    message: string;
  }) => Promise<void>;
}

const TIER_DEFAULT_BUDGET: Record<PlacementTier, number> = {
  TITLE_SPONSOR: 150000,
  GOLD_BOOTH: 80000,
  COMMUNITY_PARTNER: 30000,
};

export function ProposalForm({
  selectedEvent,
  sponsorName,
  contactEmail,
  initialTier = "GOLD_BOOTH",
  onSubmit,
}: ProposalFormProps) {
  const [companyName, setCompanyName] = useState("Pathao Ventures");
  const [placementTier, setPlacementTier] = useState<PlacementTier>(initialTier);
  const [budgetBDT, setBudgetBDT] = useState<number>(TIER_DEFAULT_BUDGET[initialTier] || 80000);
  const [message, setMessage] = useState(
    "We would like to sponsor an engineering booth, keynote recruitment address, and campus hiring lounge."
  );
  const [deckUrl, setDeckUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialTier) {
      setPlacementTier(initialTier);
      setBudgetBDT(TIER_DEFAULT_BUDGET[initialTier] || 80000);
    }
  }, [initialTier]);

  const handleTierChange = (tier: PlacementTier) => {
    setPlacementTier(tier);
    setBudgetBDT(TIER_DEFAULT_BUDGET[tier] || 50000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    setIsSubmitting(true);
    try {
      const fullMessage = deckUrl.trim()
        ? `${message.trim()}\n\nSupporting Deck / Portfolio Link: ${deckUrl.trim()}`
        : message.trim();

      await onSubmit({
        companyName,
        budgetBDT,
        placementTier,
        message: fullMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-5 shadow-card rounded-2xl border border-line bg-surface">
      <div className="border-b border-line pb-3 mb-4">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-700">
          <Sparkles className="size-3.5" />
          <span>Submit Partnership Proposal</span>
        </div>
        <h3 className="text-base font-bold text-ink mt-1">Connect with Organizer</h3>
        <p className="text-xs text-ink-muted mt-0.5">
          Target Event: <strong className="text-brand-700">{selectedEvent?.title || "Please select an event"}</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Brand / Company Name"
            placeholder="e.g. Pathao / bKash / Grameenphone"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
          <Input
            label="Proposed Budget (BDT ৳)"
            type="number"
            min={5000}
            step={5000}
            required
            value={budgetBDT}
            onChange={(e) => setBudgetBDT(Number(e.target.value))}
            hint={`Indicative: ${formatBDT(budgetBDT * 100)}`}
          />
        </div>

        <div>
          <Select
            label="Sponsorship Package Tier"
            value={placementTier}
            onChange={(e) => handleTierChange(e.target.value as PlacementTier)}
          >
            <option value="TITLE_SPONSOR">Title Sponsor & Keynote Stage Branding (~৳150,000)</option>
            <option value="GOLD_BOOTH">Gold Expo Booth & Recruitment Lounge (~৳80,000)</option>
            <option value="COMMUNITY_PARTNER">Community, Swag & Merchandise Partner (~৳30,000)</option>
          </Select>
        </div>

        <div>
          <Textarea
            label="Message & Deliverables to Organizer"
            rows={3}
            required
            placeholder="Describe your brand activation goals, requested booth size, or keynote expectations..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <div>
          <Input
            label="Supporting Deck or Portfolio Link (Optional)"
            type="url"
            placeholder="https://drive.google.com/... or https://company.com/pitch.pdf"
            value={deckUrl}
            onChange={(e) => setDeckUrl(e.target.value)}
            hint="Share your brand guidelines or sponsorship deck link."
          />
        </div>

        <div className="rounded-xl border border-line bg-canvas-alt/70 p-3 text-[11px] text-ink-muted space-y-1">
          <div className="flex items-center gap-1.5 font-medium text-ink">
            <ShieldCheck className="size-3.5 text-success" />
            <span>Verified Organizer Direct Transmission</span>
          </div>
          <p>
            Your proposal and contact email (<strong className="text-ink">{contactEmail}</strong>) will be transmitted directly
            to the verified host. No intermediary broker fees.
          </p>
        </div>

        <Button
          type="submit"
          loading={isSubmitting}
          disabled={!selectedEvent}
          className="w-full justify-center shadow-sm"
          leftIcon={<Send className="size-4" />}
        >
          Submit Proposal to {selectedEvent ? "Organizer" : "Event"}
        </Button>
      </form>
    </Card>
  );
}
