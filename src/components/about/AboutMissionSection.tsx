import React from "react";
import { Compass, Sparkles, Building, Handshake, Users } from "lucide-react";

export function AboutMissionSection() {
  return (
    <section id="mission" className="scroll-mt-20 py-16 sm:py-24 border-b border-line bg-canvas-alt">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* SECTION 2: WHO WE ARE */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 block mb-2">
            Who We Are
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            What is Aayojon?
          </h2>
          <p className="mt-4 text-base text-ink-muted leading-relaxed">
            Aayojon is a unified platform connecting event discovery, ticketing, event management, and event service procurement in Bangladesh. We believe that offline human gatherings are essential to vibrant culture, education, and commerce.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {[
              "Event Discovery",
              "Local BDT Payments",
              "High-Entropy QR Passes",
              "Venue & Vendor Marketplace",
              "Real-time Check-ins",
            ].map((pill) => (
              <span
                key={pill}
                className="rounded-full border border-brand-200 bg-surface px-3 py-1 text-xs font-medium text-brand-700 shadow-xs"
              >
                {pill}
              </span>
            ))}
          </div>
        </div>

        {/* SECTION 3 & 4: MISSION & VISION TWO-COLUMN CARDS */}
        <div className="grid gap-8 md:grid-cols-2 max-w-5xl mx-auto">
          {/* Mission Card */}
          <div className="rounded-card border border-brand-200 bg-surface p-8 shadow-card flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 size-32 bg-brand-50 rounded-full blur-2xl -mr-8 -mt-8" />
            <div className="relative">
              <div className="inline-flex size-12 items-center justify-center rounded-btn bg-brand-100 text-brand-700 mb-6 border border-brand-200">
                <Compass className="size-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 block mb-1">
                Guiding Purpose
              </span>
              <h3 className="text-2xl font-bold text-ink">Our Mission</h3>
              <blockquote className="mt-4 text-ink-muted leading-relaxed font-normal text-base border-l-2 border-brand-500 pl-4">
                &ldquo;To make meaningful experiences easier to discover, organize, and enjoy by connecting people, events, and event services through one accessible platform.&rdquo;
              </blockquote>
            </div>
            <p className="mt-6 text-xs text-ink-muted">
              Built with localized pricing, bKash/Nagad checkout, and transparent ticketing terms.
            </p>
          </div>

          {/* Vision Card */}
          <div className="rounded-card border border-purple-200 bg-surface p-8 shadow-card flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 size-32 bg-pink/10 rounded-full blur-2xl -mr-8 -mt-8" />
            <div className="relative">
              <div className="inline-flex size-12 items-center justify-center rounded-btn bg-purple-100 text-purple-700 mb-6 border border-purple-200">
                <Sparkles className="size-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 block mb-1">
                The Long View
              </span>
              <h3 className="text-2xl font-bold text-ink">Our Vision</h3>
              <blockquote className="mt-4 text-ink-muted leading-relaxed font-normal text-base border-l-2 border-purple-500 pl-4">
                &ldquo;To build a connected event ecosystem where anyone can discover experiences, organizers can bring ideas to life, and event service providers can grow their businesses.&rdquo;
              </blockquote>
            </div>
            <p className="mt-6 text-xs text-ink-muted">
              Bridging independent organizers with Bangladesh&apos;s leading spaces and vendors.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

