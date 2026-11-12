import React from "react";
import { Link } from "@/components/ui/Link";
import {
  ArrowRight,
  Heart,
  Megaphone,
  Music,
  PartyPopper,
  QrCode,
  Sparkles,
  Ticket,
  Calendar,
  Users,
  CheckCircle2,
  Building2,
  TrendingUp,
  ShieldCheck,
  CreditCard,
  Smartphone,
  MapPin,
  Activity,
  Layers,
} from "lucide-react";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { EventSearch } from "@/components/marketplace/EventSearch";
import { CategoryCard } from "@/components/marketplace/CategoryCard";
import { EventGrid } from "@/components/marketplace/EventCard";
import { NearYou } from "@/components/marketplace/NearYou";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { usePublicCatalog } from "@/lib/client-api";

function Section({
  id,
  title,
  subtitle,
  href,
  children,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 py-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
        </div>
        {href && (
          <Link to={href} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
            View all <ArrowRight className="size-4" aria-hidden />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function Hero({ cities }: { cities: string[] }) {
  return (
    <section className="relative overflow-hidden bg-canvas-alt border-b border-line/60">
      {/* Dynamic Animated Ambient Shapes & Floating Cards */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-10 size-64 rounded-full bg-violet/15 blur-3xl" />
        <div className="absolute -right-10 bottom-0 size-80 rounded-full bg-pink/15 blur-3xl" />

        {/* Floating Glass Badges */}
        <div className="absolute left-[3%] top-16 hidden xl:flex items-center gap-3 rounded-2xl glass-card px-4 py-3 shadow-pop animate-float border border-brand-200/80">
          <div className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 border border-brand-200 shadow-2xs">
            <Ticket className="size-5" />
          </div>
          <div className="text-left">
            <span className="block text-xs font-bold text-ink">Instant MFS Passes</span>
            <span className="text-[10px] font-medium text-ink-muted">bKash & Nagad Verified</span>
          </div>
        </div>

        <div className="absolute right-[3%] top-16 hidden xl:flex items-center gap-3 rounded-2xl glass-card px-4 py-3 shadow-pop animate-float-delayed border border-indigo-200/80">
          <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 shadow-2xs">
            <Building2 className="size-5" />
          </div>
          <div className="text-left">
            <span className="block text-xs font-bold text-ink">250+ Certified Venues</span>
            <span className="text-[10px] font-medium text-ink-muted">Auditoriums & Halls</span>
          </div>
        </div>

        <div className="absolute right-[5%] bottom-12 hidden lg:flex items-center gap-2.5 rounded-2xl glass-card px-3.5 py-2.5 shadow-pop animate-float-slow border border-emerald-200/80">
          <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
            <ShieldCheck className="size-4" />
          </div>
          <div className="text-left">
            <span className="block text-[11px] font-bold text-ink">Encrypted Gate QR</span>
            <span className="text-[10px] font-medium text-ink-muted">Zero Fraud Entry</span>
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-4xl px-4 pt-10 pb-14 sm:pt-20 sm:pb-24 text-center sm:px-6">
        {/* Dynamic Mobile Live Status Pill */}
        <div className="flex justify-center mb-4 sm:mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200/80 bg-surface/90 px-3.5 py-1 text-xs font-semibold text-brand-900 shadow-xs backdrop-blur-sm animate-pulse-subtle">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            <span>Live Events Across Bangladesh</span>
          </div>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black leading-[1.12] tracking-tight text-ink">
          Life is Better When We&apos;re Together.
        </h1>

        <p className="mx-auto mt-3 sm:mt-4 max-w-2xl text-sm sm:text-lg text-ink-muted leading-relaxed">
          Find concerts, workshops, festivals, tech meetups, and venue spaces with instant MFS ticketing and verified booking.
        </p>

        {/* Mobile & Tablet Interactive Feature Pills */}
        <div className="mt-4 flex xl:hidden items-center justify-center flex-wrap gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-surface/90 px-3 py-1 text-[11px] font-semibold text-brand-900 shadow-2xs backdrop-blur-sm animate-float">
            <Ticket className="size-3 text-brand-600" />
            <span>Instant MFS Passes</span>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-surface/90 px-3 py-1 text-[11px] font-semibold text-indigo-900 shadow-2xs backdrop-blur-sm animate-float-delayed">
            <Building2 className="size-3 text-indigo-600" />
            <span>250+ Certified Venues</span>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-surface/90 px-3 py-1 text-[11px] font-semibold text-emerald-900 shadow-2xs backdrop-blur-sm animate-float-slow">
            <ShieldCheck className="size-3 text-emerald-600" />
            <span>Encrypted Gate QR</span>
          </div>
        </div>

        {/* Search Container */}
        <div className="mx-auto mt-6 sm:mt-8 max-w-4xl text-left">
          <EventSearch cities={cities} />

          {/* Quick-Tap Category Discovery Chips for Mobile */}
          <div className="mt-3.5 flex flex-wrap items-center justify-center sm:justify-start gap-1.5 text-xs">
            <span className="text-ink-muted text-[11px] font-semibold flex items-center gap-1">
              <Sparkles className="size-3 text-amber-500" /> Popular:
            </span>
            {[
              { label: "Tech & AI", href: "/events?q=AI" },
              { label: "Concerts", href: "/events?q=Music" },
              { label: "Hackathons", href: "/events?q=Hackathon" },
              { label: "Free Events", href: "/events?price=free" },
              { label: "Venues", href: "/venues" },
            ].map((chip) => (
              <Link
                key={chip.label}
                to={chip.href}
                className="rounded-full border border-line bg-surface/90 px-2.5 py-1 text-[11px] font-medium text-ink hover:border-brand-300 hover:text-brand-700 hover:bg-brand-50/50 transition shadow-2xs active:scale-95"
              >
                {chip.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomePage() {
  const { catalog, loading, error } = usePublicCatalog();

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas">
        <PublicNavbar activeHref="/" />
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="size-8 rounded-full border-3 border-brand-600 border-t-transparent animate-spin" />
            <p className="text-sm font-medium text-ink-muted">Loading Aayojon experiences...</p>
          </div>
        </div>
        <PublicFooter />
      </div>
    );
  }

  const events = catalog?.events || [];
  const categories = catalog?.categories || [];
  const cities = catalog?.cities || [];

  const featured = events.filter((e) => e.isFeatured);
  const popular = [...events].sort((a, b) => b.popularity - a.popularity).slice(0, 6);
  const soonest = [...events].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()).slice(0, 6);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <PublicNavbar activeHref="/" />

      <Hero cities={cities} />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 py-10">
        {/* CATEGORIES SECTION */}
        <section id="categories" className="scroll-mt-20">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-ink">Browse by Category</h2>
              <p className="mt-1 text-sm text-ink-muted">Explore verified events across all categories</p>
            </div>
            <Link to="/events" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
              All events <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
            {categories.map((c) => (
              <CategoryCard key={c.id} category={c} />
            ))}
          </div>
        </section>

        {/* POPULAR EXPERIENCES */}
        <Section title="Popular Experiences" subtitle="Most-viewed and highly anticipated events" href="/events?sort=popularity">
          <EventGrid events={popular} categories={categories} />
        </Section>

        {/* HAPPENING SOON */}
        <Section title="Happening Soon" subtitle="Gatherings taking place in the next few days" href="/events?sort=soonest">
          <EventGrid events={soonest} categories={categories} />
        </Section>

        {/* NEAR YOU */}
        {events.length > 0 && <NearYou events={events} categories={categories} />}

        {/* HIGHLIGHTED DUAL CTA: EVENT CREATOR & VENUE MARKETPLACE */}
        <section className="space-y-6 pt-4">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1 text-xs font-bold text-brand-700">
              <Sparkles className="size-3.5 text-brand-600" />
              <span>Organizer & Venue Solutions</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Power Your Next Gathering with Aayojon
            </h2>
            <p className="text-base text-ink-muted leading-relaxed">
              Whether you are organizing a university festival or booking a premier auditorium in Dhaka, we streamline ticketing, venues, and gate verification.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2 pt-2">
            {/* CTA 1: EVENT ORGANIZER STUDIO */}
            <div className="relative group overflow-hidden rounded-3xl border-2 border-brand-300/80 bg-gradient-to-br from-brand-50/90 via-surface to-purple-50/60 p-8 sm:p-10 shadow-card hover:shadow-pop transition-all duration-300 hover:-translate-y-1">
              <div aria-hidden className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-brand-400/10 blur-2xl group-hover:scale-125 transition-transform" />

              <div className="relative space-y-6 flex flex-col justify-between h-full">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-md">
                      <Calendar className="size-7" />
                    </div>
                    <span className="rounded-full border border-brand-300 bg-brand-100/90 px-3.5 py-1 text-xs font-bold text-brand-800 shadow-2xs">
                      ৳0 Initial Setup Fee
                    </span>
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-ink">Host & Publish Your Event</h3>
                    <p className="mt-2 text-sm text-ink-muted leading-relaxed">
                      Publish single or multi-track events, configure tier pricing in BDT, and reach thousands of enthusiastic attendees across Bangladesh.
                    </p>
                  </div>

                  <ul className="space-y-2.5 pt-2 text-xs font-medium text-ink">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                      <span>Instant checkout via bKash, Nagad & Cards with webhook verification</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                      <span>Encrypted offline QR passes sent straight to attendee digital wallets</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                      <span>Real-time attendee rosters, CSV export, and high-speed gate check-in scanner</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-brand-200/60">
                  <Link
                    to="/organizer"
                    className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-brand-600 py-3.5 text-sm font-bold text-white shadow-md hover:bg-brand-700 hover:shadow-lg transition-all group"
                  >
                    <span>Launch Organizer Studio</span>
                    <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>

            {/* CTA 2: VENUE & PRODUCTION MARKETPLACE */}
            <div className="relative group overflow-hidden rounded-3xl border-2 border-indigo-300/80 bg-gradient-to-br from-indigo-50/90 via-surface to-blue-50/60 p-8 sm:p-10 shadow-card hover:shadow-pop transition-all duration-300 hover:-translate-y-1">
              <div aria-hidden className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-indigo-400/10 blur-2xl group-hover:scale-125 transition-transform" />

              <div className="relative space-y-6 flex flex-col justify-between h-full">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md">
                      <Building2 className="size-7" />
                    </div>
                    <span className="rounded-full border border-indigo-300 bg-indigo-100/90 px-3.5 py-1 text-xs font-bold text-indigo-800 shadow-2xs">
                      250+ Verified Spaces
                    </span>
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-ink">Discover Premier Event Venues</h3>
                    <p className="mt-2 text-sm text-ink-muted leading-relaxed">
                      Find auditoriums, convention centers, and university halls. Or submit an RFQ to receive competitive itemized quotes from certified production crews.
                    </p>
                  </div>

                  <ul className="space-y-2.5 pt-2 text-xs font-medium text-ink">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                      <span>Certified acoustical isolation, central AC, and 200kVA generator backup</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                      <span>Direct quotation bidding with stage lighting, sound, and catering vendors</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                      <span>Secure escrow date lock with guaranteed venue availability</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-indigo-200/60 flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/venues"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all group"
                  >
                    <span>Browse Venues</span>
                    <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/ai-event-assistant"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-surface px-5 py-3.5 text-sm font-semibold text-ink hover:bg-canvas-alt shadow-xs transition"
                  >
                    <Sparkles className="size-4 text-brand-600" />
                    <span>AI Assistant</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
