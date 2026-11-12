import React from "react";
import Link from "@/components/ui/Link";
import {
  ArrowRight,
  Compass,
  Sparkles,
  Calendar,
  Ticket,
  Heart,
  ShieldCheck,
  Building2,
  Users,
  CheckCircle2,
} from "lucide-react";

export function AboutHero() {
  const stats = [
    { value: "50,000+", label: "Verified Tickets Issued", icon: Ticket },
    { value: "250+", label: "Partner Venues & Halls", icon: Building2 },
    { value: "99.9%", label: "Check-in Reliability", icon: ShieldCheck },
    { value: "৳0", label: "Setup Cost to Start", icon: Sparkles },
  ];

  return (
    <section className="relative overflow-hidden bg-canvas-alt border-b border-line">
      {/* Playful background decorative shapes & floating glass cards */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-10 size-72 rounded-full bg-violet/15 blur-3xl" />
        <div className="absolute -right-10 bottom-0 size-80 rounded-full bg-pink/15 blur-3xl" />

        {/* Floating Glass Cards */}
        <div className="absolute left-[5%] top-20 hidden xl:flex items-center gap-3 rounded-2xl glass-card px-4 py-3 shadow-pop animate-float border border-brand-200/80">
          <div className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 border border-brand-200">
            <Ticket className="size-5" />
          </div>
          <div className="text-left">
            <span className="block text-xs font-bold text-ink">Decentralized Ticketing</span>
            <span className="text-[10px] text-ink-muted">MFS & Card Settlements</span>
          </div>
        </div>

        <div className="absolute right-[5%] top-20 hidden xl:flex items-center gap-3 rounded-2xl glass-card px-4 py-3 shadow-pop animate-float-delayed border border-indigo-200/80">
          <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
            <Building2 className="size-5" />
          </div>
          <div className="text-left">
            <span className="block text-xs font-bold text-ink">250+ Certified Venues</span>
            <span className="text-[10px] text-ink-muted">Acoustics & Generator Specs</span>
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24 text-center">
        {/* Subtitle badge */}
        <div className="flex justify-center mb-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-surface/90 px-4 py-1.5 shadow-xs backdrop-blur-sm animate-pulse-subtle">
            <Sparkles className="size-4 text-brand-600" />
            <span className="text-xs font-bold text-brand-700">
              Unified Event & Venue Platform
            </span>
          </div>
        </div>

        {/* Main headline */}
        <h1 className="text-4xl font-extrabold tracking-tight text-ink sm:text-5xl lg:text-6xl max-w-3xl mx-auto leading-[1.15]">
          Event Discovery, Verified Ticketing & Venue Marketplace.
        </h1>

        {/* Supporting text */}
        <p className="mx-auto mt-6 max-w-2xl text-base text-ink-muted sm:text-lg leading-relaxed">
          Aayojon is Bangladesh&apos;s unified event discovery, ticketing, and venue procurement ecosystem. Built with care for university campus organizers, creative communities, and cultural festivals.
        </p>

        {/* Hero CTAs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/events"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 text-sm font-bold text-white hover:bg-brand-700 shadow-md hover:shadow-lg transition-all group"
          >
            <Compass className="size-4" />
            <span>Explore Events</span>
            <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/organizer"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-6 text-sm font-semibold text-ink hover:bg-canvas-alt shadow-xs transition"
          >
            <Sparkles className="size-4 text-brand-600" />
            <span>Host an Event</span>
          </Link>
        </div>

        {/* TRUST & IMPACT STATS COUNTER */}
        <div className="mt-14 pt-10 border-t border-line/80 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="rounded-2xl border border-line bg-surface p-4 shadow-xs text-center hover:-translate-y-0.5 hover:shadow-sm transition-all"
              >
                <div className="mx-auto mb-2 flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Icon className="size-4" />
                </div>
                <div className="text-2xl font-black text-ink tracking-tight">{s.value}</div>
                <div className="text-[11px] font-medium text-ink-muted mt-0.5">{s.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

