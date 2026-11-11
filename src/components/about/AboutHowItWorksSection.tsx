import React from "react";
import {
  Compass,
  Calendar,
  Building,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  QrCode,
  Sparkles,
} from "lucide-react";

export function AboutHowItWorksSection() {
  const workflows = [
    {
      role: "For Attendees",
      icon: Compass,
      steps: [
        { num: "01", title: "Discover an Event", desc: "Filter through verified concerts, workshops & meetups across Bangladesh." },
        { num: "02", title: "Explore Details", desc: "Check venue specifications, parking, agenda schedules & ticket tiers." },
        { num: "03", title: "Book a Ticket", desc: "Pay instantly with bKash, Nagad, or cards; receive encrypted QR pass." },
        { num: "04", title: "Attend & Enjoy", desc: "Scan pass at gate check-in terminal for fast offline entry." },
      ],
    },
    {
      role: "For Organizers",
      icon: Calendar,
      steps: [
        { num: "01", title: "Create an Event", desc: "Define description, date range, venue, and ticketing tiers." },
        { num: "02", title: "Configure Tickets", desc: "Set free or paid quotas with automated capacity protections." },
        { num: "03", title: "Promote & Coordinate", desc: "Share public event links, request venue RFQs & confirm sponsors." },
        { num: "04", title: "Manage Attendees", desc: "Monitor real-time sales analytics, export rosters & scan at doors." },
      ],
    },
    {
      role: "For Venues & Vendors",
      icon: Building,
      steps: [
        { num: "01", title: "Create Business Profile", desc: "Showcase venue floor plans, acoustics, catering, or sound gear." },
        { num: "02", title: "Publish Listings", desc: "Set standard day-rates, technical amenities & service capacities." },
        { num: "03", title: "Receive Event RFQs", desc: "Review organizer requirement briefs tailored to event type." },
        { num: "04", title: "Submit Quotations", desc: "Send itemized transparent bids and secure dates with escrow." },
      ],
    },
  ];

  return (
    <section id="how-it-works" className="scroll-mt-20 py-16 sm:py-24 border-b border-line bg-canvas">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 block mb-2">
            The Process
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            How Aayojon Works
          </h2>
          <p className="mt-3 text-sm sm:text-base text-ink-muted">
            A clear, dependable flow for everyone in the ecosystem.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-3">
          {workflows.map((flow) => {
            const RoleIcon = flow.icon;
            return (
              <div
                key={flow.role}
                className="rounded-card border border-line bg-surface p-6 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-line">
                    <div className="flex size-10 items-center justify-center rounded-btn bg-brand-50 text-brand-600 border border-brand-200">
                      <RoleIcon className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-ink">{flow.role}</h3>
                      <span className="text-[11px] text-ink-muted">4 simple steps</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {flow.steps.map((s) => (
                      <div key={s.num} className="flex items-start gap-3">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-canvas-alt font-mono text-xs font-bold text-brand-700 border border-line">
                          {s.num}
                        </span>
                        <div>
                          <h4 className="text-sm font-semibold text-ink leading-tight">
                            {s.title}
                          </h4>
                          <p className="mt-0.5 text-xs text-ink-muted leading-relaxed">
                            {s.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function AboutWhySection() {
  const benefits = [
    {
      title: "Convenient Event Discovery",
      desc: "Explore cultural festivals, tech workshops, music shows, and startup demos with live filters and division-based venues.",
      icon: Compass,
    },
    {
      title: "Simplified Ticket Booking",
      desc: "Purchase in Bangladeshi Taka using bKash, Nagad, Rocket, or cards with guaranteed instant QR pass generation.",
      icon: CreditCard,
    },
    {
      title: "Organizer Management Tools",
      desc: "End-to-end tooling from ticket tiered pricing, attendee check-in terminals, to exportable registrations.",
      icon: Calendar,
    },
    {
      title: "Connected Event Marketplace",
      desc: "Connect directly with verified convention halls, photographers, decorators, and stage sound providers.",
      icon: Building,
    },
    {
      title: "Better Communication",
      desc: "Clarify technical RFQ requirements, negotiate itemized quotations, and secure dates in one place.",
      icon: Sparkles,
    },
    {
      title: "One Consistent Experience",
      desc: "A single, dependable platform for attendees, organizers, sponsors, and service partners across Bangladesh.",
      icon: ShieldCheck,
    },
  ];

  return (
    <section className="py-16 sm:py-24 border-b border-line bg-canvas-alt">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 block mb-2">
            Platform Benefits
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Everything for Your Events, All in One Place.
          </h2>
          <p className="mt-3 text-base text-ink-muted">
            Eliminating fragmented spreadsheets, manual social media DMs, and untracked cash collections.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.title}
                className="rounded-card border border-line bg-surface p-6 shadow-xs"
              >
                <div className="flex size-10 items-center justify-center rounded-btn bg-brand-50 text-brand-600 mb-4 border border-brand-100">
                  <Icon className="size-5" />
                </div>
                <h3 className="text-base font-bold text-ink">{b.title}</h3>
                <p className="mt-2 text-sm text-ink-muted leading-relaxed">
                  {b.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

