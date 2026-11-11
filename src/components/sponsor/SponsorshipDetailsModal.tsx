"use client";

import React from "react";
import {
  Award,
  BadgeCheck,
  Building2,
  CalendarDays,
  Check,
  DollarSign,
  MapPin,
  Sparkles,
  Users,
  Video,
} from "lucide-react";
import type { EventRecord, Organization } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatBDT } from "@/lib/seed";
import { demoEventImage } from "@/components/marketplace/categoryStyle";

export interface SponsorshipTierInfo {
  tier: "TITLE_SPONSOR" | "GOLD_BOOTH" | "COMMUNITY_PARTNER";
  name: string;
  indicativePriceMinor: number;
  benefits: string[];
}

export const SPONSOR_TIERS: SponsorshipTierInfo[] = [
  {
    tier: "TITLE_SPONSOR",
    name: "Title Sponsor & Keynote Stage Branding",
    indicativePriceMinor: 15000000, // ৳150,000
    benefits: [
      "Naming rights: '[Brand] Presents [Event Name]'",
      "15-minute keynote speaking slot on main stage",
      "Prime logo placement on stage backdrop & attendee passes",
      "Executive lounge recruitment access & VIP passes (10x)",
      "Dedicated social media spotlight across Aayojon channels",
    ],
  },
  {
    tier: "GOLD_BOOTH",
    name: "Gold Expo Booth & Recruitment Lounge",
    indicativePriceMinor: 8000000, // ৳80,000
    benefits: [
      "Dedicated 10×10 exhibition booth space at venue entrance",
      "Direct resume drop & tech recruitment desk",
      "Brand logo on all attendee physical badges & QR passes",
      "Promotional flyer or swag insertion into attendee kits",
      "VIP delegate passes (4x)",
    ],
  },
  {
    tier: "COMMUNITY_PARTNER",
    name: "Community, Swag & Merchandise Partner",
    indicativePriceMinor: 3000000, // ৳30,000
    benefits: [
      "Co-branding on official event t-shirts, lanyards & stickers",
      "Digital brand feature on event registration confirmation email",
      "Logo on event website & sponsor wall banner",
      "Complimentary standard entry passes (2x)",
    ],
  },
];

export function SponsorshipDetailsModal({
  event,
  org,
  open,
  onClose,
  onSelectTier,
}: {
  event: EventRecord | undefined;
  org: Organization | undefined;
  open: boolean;
  onClose: () => void;
  onSelectTier: (tier: "TITLE_SPONSOR" | "GOLD_BOOTH" | "COMMUNITY_PARTNER") => void;
}) {
  if (!event) return null;

  const imageUrl = demoEventImage(event.category_id);
  const fullDate = new Date(event.starts_at).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Dhaka",
  });

  return (
    <Modal open={open} onClose={onClose} title="Sponsorship Opportunity Details">
      <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
        {/* Event Header Banner */}
        <div className="relative h-44 w-full overflow-hidden rounded-2xl bg-canvas-alt shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={event.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 text-white">
            <Badge tone="brand" className="mb-1 border-none bg-brand-600 text-white font-bold">
              {org?.name || "Verified Host"}
            </Badge>
            <h2 className="text-xl font-bold leading-tight drop-shadow-sm text-white">{event.title}</h2>
          </div>
        </div>

        {/* Audience Reach & Quick Facts */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-line bg-canvas-alt p-3 text-center">
            <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">Expected Audience</span>
            <p className="text-lg font-extrabold text-brand-700 mt-0.5">{event.capacity.toLocaleString()}+</p>
            <p className="text-[10px] text-ink-muted">Target Attendees</p>
          </div>
          <div className="rounded-xl border border-line bg-canvas-alt p-3 text-center">
            <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">Event Engagement</span>
            <p className="text-lg font-extrabold text-teal-700 mt-0.5">{event.views_count.toLocaleString()}</p>
            <p className="text-[10px] text-ink-muted">Page Views</p>
          </div>
          <div className="rounded-xl border border-line bg-canvas-alt p-3 text-center col-span-2 sm:col-span-1">
            <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">Location</span>
            <p className="text-xs font-bold text-ink truncate mt-1">
              {event.is_online ? "Online Livestream" : "Dhaka, Bangladesh"}
            </p>
            <p className="text-[10px] text-ink-muted">{fullDate}</p>
          </div>
        </div>

        {/* About Event & Target Demographic */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-ink">About the Event & Audience</h3>
          <p className="text-xs text-ink/80 leading-relaxed">{event.description}</p>
          <div className="rounded-xl bg-brand-50/70 p-3 text-xs text-brand-900 border border-brand-200">
            <p className="font-bold">Verified Audience Demographic:</p>
            <p className="mt-0.5 text-brand-800">
              Primary audience includes university engineering students, software professionals, founders, and youth
              enthusiasts across Bangladesh.
            </p>
          </div>
        </div>

        {/* Sponsorship Packages & Inclusions */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-ink flex items-center gap-1.5">
            <Award className="size-4 text-brand-600" /> Available Sponsorship Packages
          </h3>

          <div className="space-y-3">
            {SPONSOR_TIERS.map((pkg) => (
              <div
                key={pkg.tier}
                className="rounded-2xl border border-line bg-surface p-4 shadow-sm hover:border-brand-300 transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-line pb-2.5">
                  <div>
                    <h4 className="font-bold text-sm text-ink">{pkg.name}</h4>
                    <span className="text-[11px] font-mono text-brand-700 font-semibold">
                      Indicative Budget: {formatBDT(pkg.indicativePriceMinor)}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      onSelectTier(pkg.tier);
                      onClose();
                    }}
                  >
                    Select & Propose
                  </Button>
                </div>

                <ul className="grid gap-1.5 text-xs text-ink/80 sm:grid-cols-2">
                  {pkg.benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <Check className="size-3.5 text-success shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

