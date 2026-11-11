import React from "react";
import {
  Compass,
  Ticket,
  Calendar,
  Users,
  Building,
  Wrench,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/ui/cn";

export interface FeatureItem {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
}

const FEATURES: FeatureItem[] = [
  {
    title: "Discover Events",
    description: "Find concerts, workshops, festivals, conferences, meetups, and creative experiences across Dhaka, Chittagong, and all divisions.",
    icon: Compass,
    tag: "Attendees",
  },
  {
    title: "Book Tickets",
    description: "Explore ticket tiers, reserve seats, and purchase securely using local payment options (bKash, Nagad, cards) with instant QR issuance.",
    icon: Ticket,
    tag: "Ticketing",
  },
  {
    title: "Organize Events",
    description: "Create, configure ticket batches, publish, and monitor event lifecycle with clear monetization and real-time revenue analytics.",
    icon: Calendar,
    tag: "Organizers",
  },
  {
    title: "Manage Attendees",
    description: "Track registrant lists, issue cryptographic passes, and operate fast gate check-in scanners to eliminate counterfeit entries.",
    icon: Users,
    tag: "Gate Staff",
  },
  {
    title: "Find Venues",
    description: "Explore verified convention halls, auditoriums, and open-air lawns with capacity filters, technical specs, and date availability.",
    icon: Building,
    tag: "Marketplace",
  },
  {
    title: "Find Event Services",
    description: "Connect directly with verified sound engineers, caterers, stage decorators, and photographers with itemized RFQ bids.",
    icon: Wrench,
    tag: "Vendors",
  },
];

export function AboutFeatureCard({ feature }: { feature: FeatureItem }) {
  const Icon = feature.icon;
  return (
    <div className="group rounded-card border border-line bg-surface p-6 shadow-xs hover:border-brand-300 hover:shadow-card transition duration-200 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex size-11 items-center justify-center rounded-btn bg-brand-50 text-brand-600 border border-brand-100 group-hover:scale-105 transition-transform">
            <Icon className="size-5" />
          </div>
          <span className="rounded-full bg-canvas-alt border border-line px-2.5 py-0.5 text-[11px] font-semibold text-ink-muted">
            {feature.tag}
          </span>
        </div>
        <h3 className="text-base font-bold text-ink group-hover:text-brand-700 transition-colors">
          {feature.title}
        </h3>
        <p className="mt-2 text-sm text-ink-muted leading-relaxed">
          {feature.description}
        </p>
      </div>
    </div>
  );
}

export function AboutFeaturesSection() {
  return (
    <section className="py-16 sm:py-20 border-b border-line bg-canvas">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 block mb-2">
            Capabilities & Tools
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            What You Can Do With Aayojon
          </h2>
          <p className="mt-3 text-sm sm:text-base text-ink-muted">
            A comprehensive set of tools built specifically for every participant in the event lifecycle.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <AboutFeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

