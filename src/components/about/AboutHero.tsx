import React from "react";
import Link from "next/link";
import { ArrowRight, Compass, Sparkles, Calendar, Ticket, Heart } from "lucide-react";

export function AboutHero() {
  return (
    <section className="relative overflow-hidden bg-canvas-alt border-b border-line">
      {/* Playful background decorative shapes */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-10 size-64 rounded-full bg-violet/10 blur-2xl" />
        <div className="absolute -right-10 bottom-0 size-80 rounded-full bg-pink/10 blur-2xl" />
        <div className="absolute left-[8%] top-16 hidden size-14 rotate-12 items-center justify-center rounded-card bg-surface text-brand-600 shadow-card lg:flex border border-line">
          <Ticket className="size-6" />
        </div>
        <div className="absolute right-[10%] bottom-16 hidden size-14 -rotate-6 items-center justify-center rounded-card bg-surface text-pink shadow-card lg:flex border border-line">
          <Heart className="size-6" />
        </div>
        <div className="absolute right-[18%] top-12 hidden size-12 rotate-6 items-center justify-center rounded-card bg-surface text-coral shadow-card lg:flex border border-line">
          <Sparkles className="size-5" />
        </div>
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24 text-center">
        {/* Subtitle badge */}
        <div className="flex justify-center mb-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-surface/90 px-4 py-1.5 shadow-xs backdrop-blur-sm">
            <Sparkles className="size-4 text-brand-600" />
            <span className="text-xs font-semibold text-brand-700">
              Aayojon (আয়োজন) · Make Moments Happen
            </span>
          </div>
        </div>

        {/* Main headline */}
        <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl lg:text-6xl max-w-3xl mx-auto leading-[1.15]">
          Bringing People Together Through Experiences.
        </h1>

        {/* Supporting text */}
        <p className="mx-auto mt-6 max-w-2xl text-base text-ink-muted sm:text-lg leading-relaxed">
          Aayojon makes discovering events, organizing experiences, and connecting with the right people easier than ever. Built for Bangladesh&apos;s vibrant communities.
        </p>

        {/* Hero CTAs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/events"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-btn bg-brand-600 px-6 text-sm font-semibold text-white hover:bg-brand-700 shadow-sm transition"
          >
            <Compass className="size-4" />
            <span>Explore Events</span>
          </Link>
          <Link
            href="/portal?tab=organizer"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-btn border border-line bg-surface px-6 text-sm font-semibold text-ink hover:bg-canvas-alt shadow-xs transition"
          >
            <Sparkles className="size-4 text-brand-600" />
            <span>Host an Event</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

