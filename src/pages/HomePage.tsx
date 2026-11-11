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
    <section className="relative overflow-hidden bg-canvas-alt">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-10 size-56 rounded-full bg-violet/15" />
        <div className="absolute -right-10 bottom-0 size-72 rounded-full bg-pink/10" />
        <div className="absolute right-[12%] top-16 hidden size-14 rotate-12 items-center justify-center rounded-card bg-surface text-brand-600 shadow-card lg:flex">
          <Music className="size-6" />
        </div>
        <div className="absolute left-[8%] bottom-16 hidden size-14 -rotate-6 items-center justify-center rounded-card bg-surface text-pink shadow-card lg:flex">
          <PartyPopper className="size-6" />
        </div>
        <div className="absolute right-[6%] top-[55%] hidden size-12 rotate-6 items-center justify-center rounded-card bg-surface text-coral shadow-card lg:flex">
          <Ticket className="size-5" />
        </div>
      </div>
      <div className="relative mx-auto max-w-4xl px-4 pb-14 pt-14 text-center sm:px-6 sm:pb-20 sm:pt-20">
        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200/80 bg-surface/90 px-3.5 py-1.5 shadow-sm backdrop-blur-sm">
            <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-brand-700">All-in-One Event Discovery & Ticketing</span>
          </div>
        </div>
        <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-ink sm:text-5xl lg:text-6xl">
          Life is Better When We&apos;re Together.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-ink-muted sm:text-lg">
          Discover concerts, workshops, festivals, meetups, and experiences worth remembering across Bangladesh.
        </p>
        <p className="mt-2 text-sm font-medium text-brand-700">Find your people. Find your events.</p>
        <div className="mx-auto mt-8 max-w-4xl text-left">
          <EventSearch cities={cities} />
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
              <p className="mt-1 text-sm text-ink-muted">Find gatherings matching your passions</p>
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

        {/* VENUE & SERVICES BANNER */}
        <section className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/60 to-purple-50/60 p-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
                <Building2 className="size-3.5" />
                <span>Venue & Services Marketplace</span>
              </div>
              <h3 className="text-2xl font-bold text-ink">Hosting an Event? Find Venues & Production Crews</h3>
              <p className="text-sm text-ink-muted max-w-xl">
                Compare auditoriums, get itemized quotation bids, and hire certified sound, lighting, and catering vendors across Bangladesh.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/venues"
                className="inline-flex h-11 items-center justify-center rounded-btn bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
              >
                Explore Venues
              </Link>
              <Link
                to="/ai-event-assistant"
                className="inline-flex h-11 items-center justify-center rounded-btn border border-line bg-surface px-5 text-sm font-semibold text-ink hover:bg-canvas-alt transition"
              >
                AI Event Assistant
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
