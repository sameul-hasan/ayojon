"use client";

import React from "react";
import Link from "@/components/ui/Link";
import {
  Check,
  Sparkles,
  Zap,
  Star,
  Crown,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  QrCode,
  Smartphone,
  Calendar,
  Ticket,
} from "lucide-react";
import { cn } from "@/lib/ui/cn";

export interface PackageTier {
  code: string;
  name: string;
  price: string;
  priceBDT: number;
  summary: string;
  badge?: string;
  popular?: boolean;
  features: string[];
}

export const ORGANIZER_PACKAGES: PackageTier[] = [
  {
    code: "BASIC",
    name: "Basic",
    price: "৳799",
    priceBDT: 799,
    summary: "Essential publishing and ticketing for single-track events and university club meetups.",
    features: [
      "1 Public Event Publication",
      "Unlimited Free & Paid Ticket Types",
      "Instant bKash, Nagad & Card Checkouts",
      "Real-time Attendee List & CSV Export",
      "Cryptographic QR Code Generation",
      "Mobile Check-in Gate Scanner",
    ],
  },
  {
    code: "PROMOTED",
    name: "Promoted",
    price: "৳1,499",
    priceBDT: 1499,
    summary: "Amplified reach for workshops, cultural fests, and high-engagement conferences.",
    popular: true,
    badge: "Most Popular",
    features: [
      "Everything in Basic Package",
      "Boosted Placement in Category Discovery",
      "Social Sharing & Campaign UTM Tracking",
      "Automated Email Ticket Receipts",
      "Custom Ticket Tier Capacities",
      "Priority Platform Support",
    ],
  },
  {
    code: "PLUS",
    name: "Plus",
    price: "৳2,699",
    priceBDT: 2699,
    summary: "Advanced tools and custom branding for growing organizations and annual summits.",
    features: [
      "Everything in Promoted Package",
      "Custom Subdomain (e.g. events.yourbrand.org)",
      "Branded Ticket PDF & QR Email Passes",
      "Multi-Staff Scanner Team Accounts",
      "Advanced Hourly Sales Analytics",
      "Marketplace Venue & Vendor RFQ Bidding",
    ],
  },
  {
    code: "PREMIUM",
    name: "Premium",
    price: "৳4,999",
    priceBDT: 4999,
    summary: "Full-scale enterprise management for major festivals, expos, and tech summits.",
    badge: "Full Power",
    features: [
      "Everything in Plus Package",
      "Homepage Hero Carousel Spotlight",
      "Dedicated Account Manager",
      "Corporate Sponsor Proposal Management",
      "Multi-Gate Attendance Analytics",
      "VIP & Media Roster Segregation",
    ],
  },
];

export function AboutPackagesSection() {
  return (
    <section id="packages" className="scroll-mt-20 py-16 sm:py-24 border-b border-line bg-canvas">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1 text-xs font-bold text-brand-700 mb-3 shadow-xs">
            <Sparkles className="size-3.5 text-amber-600" />
            <span>Transparent Organizer Pricing</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Event Hosting Packages
          </h2>
          <p className="mt-3 text-base text-ink-muted">
            Simple, fair pricing designed for Bangladesh's university clubs, tech communities, and professional event organizers. No hidden fees or surprise deductions.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {ORGANIZER_PACKAGES.map((pkg) => (
            <div
              key={pkg.code}
              className={cn(
                "relative rounded-3xl border p-6 shadow-sm flex flex-col justify-between transition-all duration-200 hover:shadow-md",
                pkg.popular
                  ? "border-brand-500 bg-surface shadow-brand-100 ring-2 ring-brand-500/20"
                  : "border-line bg-surface"
              )}
            >
              {pkg.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className={cn(
                    "rounded-full px-3 py-1 text-[11px] font-bold shadow-xs border",
                    pkg.popular
                      ? "bg-brand-600 text-white border-brand-600"
                      : "bg-purple-100 text-purple-800 border-purple-300"
                  )}>
                    {pkg.badge}
                  </span>
                </div>
              )}

              <div>
                {/* Header */}
                <div className="border-b border-line pb-4 mb-4">
                  <h3 className="text-lg font-bold text-ink">{pkg.name}</h3>
                  <p className="text-xs text-ink-muted mt-1 min-h-[36px]">{pkg.summary}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-ink tracking-tight">{pkg.price}</span>
                    <span className="text-xs text-ink-muted">/ event</span>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-3 mb-6">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted block">
                    What&apos;s Included:
                  </span>
                  {pkg.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-ink">
                      <Check className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="leading-tight">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <Link
                href="/organizer"
                className={cn(
                  "w-full inline-flex items-center justify-center gap-2 rounded-btn py-2.5 text-xs font-bold transition-all duration-150 active:scale-95 shadow-xs",
                  pkg.popular
                    ? "bg-brand-600 text-white hover:bg-brand-700"
                    : "border border-line bg-canvas-alt text-ink hover:bg-surface"
                )}
              >
                <span>Select {pkg.name}</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          ))}
        </div>

        {/* Featured Placement Add-on Note */}
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50/70 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
              <Zap className="size-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-950">Featured Placement Add-on (+৳500)</h4>
              <p className="text-xs text-amber-800">
                Can be added to any package anytime. Puts your event on the top homepage carousel for 14 days.
              </p>
            </div>
          </div>
          <Link
            href="/organizer"
            className="inline-flex items-center gap-1.5 rounded-btn bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 text-xs font-bold shrink-0 transition"
          >
            <span>Host an Event</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function AboutBookingDetailsSection() {
  const bookingSteps = [
    {
      num: "1",
      icon: Calendar,
      title: "Discover & Choose Event",
      desc: "Browse verified events across Dhaka, Chattogram, Sylhet, and Online. Filter by categories such as Tech, AI, Concerts, Business, and University Clubs.",
    },
    {
      num: "2",
      icon: Ticket,
      title: "Select Ticket Tier",
      desc: "Pick your preferred admission level (General, VIP, Early Bird, or Student Pass). Real-time inventory guarantees no overbooking.",
    },
    {
      num: "3",
      icon: CreditCard,
      title: "Fast Local Checkout",
      desc: "Pay securely in Bangladeshi Taka (BDT) via bKash, Nagad, Visa, Mastercard, or American Express with immediate webhook verification.",
    },
    {
      num: "4",
      icon: QrCode,
      title: "Encrypted QR Pass",
      desc: "Instantly receive a cryptographic QR pass in your Digital Wallet. Passes work offline and are scanned in seconds at the gate.",
    },
  ];

  return (
    <section id="booking-details" className="scroll-mt-20 py-16 sm:py-24 border-b border-line bg-canvas-alt">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3.5 py-1 text-xs font-bold text-teal-700 mb-3 shadow-xs">
            <QrCode className="size-3.5 text-teal-600" />
            <span>Digital Ticketing Guide</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Event Booking & QR Pass Flow
          </h2>
          <p className="mt-3 text-base text-ink-muted">
            From seamless checkout with Bangladesh Mobile Financial Services (MFS) to gate check-in, here is how ticket booking works on Aayojon.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {bookingSteps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="rounded-3xl border border-line bg-surface p-6 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 border border-brand-200">
                      <Icon className="size-6" />
                    </div>
                    <span className="font-mono text-2xl font-black text-brand-300">
                      0{step.num}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-ink mb-2">{step.title}</h3>
                  <p className="text-xs text-ink-muted leading-relaxed">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Security & Anti-Fraud Guarantee */}
        <div className="mt-12 rounded-3xl border border-line bg-surface p-6 sm:p-8 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-ink">Zero Duplicate Entry</h4>
                <p className="text-xs text-ink-muted mt-1">
                  Once a QR code is scanned at the venue gate, it is instantly marked as USED to prevent screenshot sharing or duplicate fraud.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                <Smartphone className="size-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-ink">Offline Wallet Access</h4>
                <p className="text-xs text-ink-muted mt-1">
                  All issued passes are cryptographically cached in your device wallet, so you can present your ticket even without an active internet connection.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                <CreditCard className="size-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-ink">Verified MFS Payment</h4>
                <p className="text-xs text-ink-muted mt-1">
                  Orders are confirmed through official bKash and Nagad payment webhooks, ensuring legitimate tickets are only issued for verified payments.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

