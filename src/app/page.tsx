import React from "react";
import Link from "next/link";
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
import { getPublicCatalog, type PublicCatalog } from "@/lib/public-events";

export const dynamic = "force-dynamic";

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
          <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
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
            <img src="/logo.png" alt="Aayojon" className="h-5 w-auto object-contain" />
            <span className="text-xs font-semibold text-brand-700">All-in-One Event Discovery & Ticketing</span>
          </div>
        </div>
        <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-ink sm:text-5xl lg:text-6xl">
          Life is Better When We&apos;re Together.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-ink-muted sm:text-lg">
          Discover concerts, workshops, festivals, meetups, and experiences worth remembering.
        </p>
        <p className="mt-2 text-sm font-medium text-brand-700">Find your people. Find your events.</p>
        <div className="mx-auto mt-8 max-w-4xl text-left">
          <EventSearch cities={cities} />
        </div>
      </div>
    </section>
  );
}

function HostPromo() {
  return (
    <section id="host" className="scroll-mt-20 py-12">
      <div className="relative overflow-hidden rounded-modal bg-gradient-to-br from-brand-700 via-brand-600 to-violet p-6 text-white shadow-pop sm:p-10 lg:p-12">
        {/* Background ambient lighting */}
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-pink/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-20 left-1/3 size-72 rounded-full bg-brand-500/30 blur-2xl" />

        <div className="relative grid gap-10 lg:grid-cols-12 lg:items-center">
          {/* Left Column: Copy & Actions */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="size-3.5 text-pink" />
              <span>Organizer Studio & Gate Operations</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-white">
                Host your event on Aayojon
              </h2>
              <p className="text-base text-brand-100 max-w-xl">
                Create your event, sell tickets with bKash, Nagad or SSLCommerz, and check guests in with high-speed QR passes.
              </p>
            </div>

            {/* 4 Feature Points */}
            <div className="grid gap-3 sm:grid-cols-2 pt-2">
              <div className="rounded-card border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Ticket className="size-4 text-pink" />
                  <span>Easy ticketing</span>
                </div>
                <p className="mt-1 text-xs text-brand-100/90 leading-relaxed">
                  Tiered tickets (Free, Early-bird, VIP), promo discount codes, and automated BDT checkout.
                </p>
              </div>

              <div className="rounded-card border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <QrCode className="size-4 text-pink" />
                  <span>QR check-in</span>
                </div>
                <p className="mt-1 text-xs text-brand-100/90 leading-relaxed">
                  Turn any smartphone into a gate scanner terminal with offline verification and duplicate-scan protection.
                </p>
              </div>

              <div className="rounded-card border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Megaphone className="size-4 text-pink" />
                  <span>Promotion tools</span>
                </div>
                <p className="mt-1 text-xs text-brand-100/90 leading-relaxed">
                  Featured marketplace ranking, automated email job queues, and social campaign tracking.
                </p>
              </div>

              <div className="rounded-card border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Users className="size-4 text-pink" />
                  <span>Attendee insights</span>
                </div>
                <p className="mt-1 text-xs text-brand-100/90 leading-relaxed">
                  Live revenue analytics, demographic breakdowns, and next-day automated MFS payout settlements.
                </p>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/portal"
                className="inline-flex h-12 items-center gap-2 rounded-btn bg-white px-6 text-sm font-semibold text-brand-700 hover:bg-brand-50 shadow-sm transition"
              >
                Host an Event <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/venues"
                className="inline-flex h-12 items-center gap-2 rounded-btn border border-white/25 bg-white/10 px-5 text-sm font-semibold text-white hover:bg-white/20 backdrop-blur-sm transition"
              >
                <Building2 className="size-4" /> Browse Partner Venues
              </Link>
            </div>
          </div>

          {/* Right Column: Live Mockup Card */}
          <div className="lg:col-span-5">
            <div className="rounded-card border border-white/20 bg-white/10 p-5 backdrop-blur-md shadow-2xl text-white space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-pink font-semibold">
                    <span className="size-2 rounded-full bg-pink animate-pulse" />
                    <span>Live Studio Dashboard</span>
                  </div>
                  <h4 className="font-bold text-base mt-0.5">Tech Summit Bangladesh</h4>
                </div>
                <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold">
                  Active
                </span>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-btn bg-black/20 p-2.5">
                  <span className="text-white/70 block text-[10px]">Gross Sales</span>
                  <span className="text-base font-extrabold text-white">৳ 148,500</span>
                  <span className="text-[10px] text-emerald-300 block mt-0.5">bKash 70% · Nagad 30%</span>
                </div>
                <div className="rounded-btn bg-black/20 p-2.5">
                  <span className="text-white/70 block text-[10px]">Tickets Sold</span>
                  <span className="text-base font-extrabold text-white">412 / 500</span>
                  <span className="text-[10px] text-brand-200 block mt-0.5">82.4% Sold Out</span>
                </div>
              </div>

              {/* Live Gate Feed */}
              <div className="space-y-1.5 text-[11px]">
                <span className="text-[10px] font-semibold text-white/70 block uppercase tracking-wider">
                  Live Gate Scanner Activity
                </span>
                <div className="rounded-btn bg-black/20 p-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-400" />
                    <span>Rafiqul Islam (VIP Pass)</span>
                  </div>
                  <span className="text-[10px] text-white/60">Gate 1 · 14:22</span>
                </div>
                <div className="rounded-btn bg-black/20 p-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-400" />
                    <span>Nusrat Jahan (Standard)</span>
                  </div>
                  <span className="text-[10px] text-white/60">Main Gate · 14:25</span>
                </div>
              </div>

              <div className="border-t border-white/10 pt-2 flex items-center justify-between text-[11px] text-brand-200">
                <span>Instant Settlement to MFS</span>
                <span className="font-semibold text-emerald-300">Verified & Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  let catalog: PublicCatalog | null = null;
  try {
    catalog = getPublicCatalog();
  } catch {
    catalog = null;
  }

  const events = catalog?.events ?? [];
  const categories = catalog?.categories ?? [];
  const featured = events.filter((e) => e.isFeatured).slice(0, 4);
  const trending = [...events].sort((a, b) => b.popularity - a.popularity).slice(0, 4);
  const upcoming = events.slice(0, 8);

  return (
    <>
      <PublicNavbar
        activeHref="/"
        signInHref="/login"
        hostHref="/portal?tab=organizer"
      />
      <main>
        <Hero cities={catalog?.cities ?? []} />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {!catalog ? (
            <div className="py-10">
              <ErrorState title="We couldn't load events" description="Please refresh the page in a moment." />
            </div>
          ) : (
            <>
              <Section id="categories" title="Popular categories" subtitle="Pick a vibe and start exploring.">
                {categories.length ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {categories.map((c) => (
                      <CategoryCard key={c.id} category={c} />
                    ))}
                  </div>
                ) : (
                  <EmptyState title="No categories yet" />
                )}
              </Section>

              {featured.length > 0 && (
                <Section id="featured" title="Featured events" subtitle="Hand-picked experiences." href="/events">
                  <EventGrid events={featured} categories={categories} />
                </Section>
              )}

              <Section id="trending" title="Trending now" subtitle="Most viewed and saved right now." href="/events">
                {trending.length ? (
                  <EventGrid events={trending} categories={categories} />
                ) : (
                  <EmptyState
                    title="No events right now"
                    description="New events are added regularly. Check back soon."
                    icon={<Heart className="size-6" />}
                  />
                )}
              </Section>

              <Section id="upcoming" title="Upcoming events" subtitle="Soonest first." href="/events">
                {upcoming.length ? (
                  <EventGrid events={upcoming} categories={categories} />
                ) : (
                  <EmptyState title="No upcoming events" description="Be the first to host one." />
                )}
              </Section>

              <Section id="near-you" title="Events near you" subtitle="Optional. Uses your location only in your browser.">
                <NearYou events={events} categories={categories} />
              </Section>
            </>
          )}

          <HostPromo />

          <section id="about" className="scroll-mt-20 py-12 border-t border-line">
            <div className="space-y-8">
              <div className="max-w-3xl space-y-2">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                  <ShieldCheck className="size-3.5 text-brand-600" />
                  <span>Platform Mission & Ecosystem</span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-ink">About Aayojon (আয়োজন)</h2>
                <p className="text-base text-ink-muted leading-relaxed">
                  Aayojon is Bangladesh&apos;s all-in-one event discovery, ticketing, partner venues, and promotion platform.
                  Built ground-up to empower creative communities, campus clubs, technology summits, and cultural festivals across all 8 divisions.
                </p>
                <p className="text-sm font-semibold text-brand-700">Find your people. Find your events.</p>
              </div>

              {/* 4 Value Pillars */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-card border border-line bg-surface p-4 shadow-card space-y-2">
                  <div className="flex size-9 items-center justify-center rounded-btn bg-brand-50 text-brand-700 border border-brand-200">
                    <Smartphone className="size-4.5" />
                  </div>
                  <h3 className="text-sm font-bold text-ink">Native MFS Checkout</h3>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    Instant, frictionless ticket purchases via bKash, Nagad, Rocket, Upay, Visa, and Mastercard with 99.8% gateway uptime.
                  </p>
                </div>

                <div className="rounded-card border border-line bg-surface p-4 shadow-card space-y-2">
                  <div className="flex size-9 items-center justify-center rounded-btn bg-pink/10 text-pink border border-pink/20">
                    <QrCode className="size-4.5" />
                  </div>
                  <h3 className="text-sm font-bold text-ink">Fraud-Proof QR Passes</h3>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    High-entropy SHA-256 encrypted digital entry passes with real-time gate scanner verification and duplicate-scan protection.
                  </p>
                </div>

                <div className="rounded-card border border-line bg-surface p-4 shadow-card space-y-2">
                  <div className="flex size-9 items-center justify-center rounded-btn bg-violet/10 text-violet border border-violet/20">
                    <Building2 className="size-4.5" />
                  </div>
                  <h3 className="text-sm font-bold text-ink">Partner Venues</h3>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    Direct access to certified auditoriums, convention centers, and university halls with transparent rental quotes and specs.
                  </p>
                </div>

                <div className="rounded-card border border-line bg-surface p-4 shadow-card space-y-2">
                  <div className="flex size-9 items-center justify-center rounded-btn bg-emerald-50 text-success border border-emerald-200">
                    <TrendingUp className="size-4.5" />
                  </div>
                  <h3 className="text-sm font-bold text-ink">Sponsor Marketplace</h3>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    Structured sponsorship proposals bridging corporate brands with high-impact student fests and industry conferences.
                  </p>
                </div>
              </div>

              {/* Numbers Bar */}
              <div className="rounded-modal border border-line bg-canvas-alt p-6 grid grid-cols-2 gap-4 md:grid-cols-4 text-center">
                <div>
                  <span className="block text-2xl font-extrabold text-brand-700">50,000+</span>
                  <span className="text-xs text-ink-muted font-medium">Tickets Issued</span>
                </div>
                <div>
                  <span className="block text-2xl font-extrabold text-brand-700">120+</span>
                  <span className="text-xs text-ink-muted font-medium">Verified Organizers</span>
                </div>
                <div>
                  <span className="block text-2xl font-extrabold text-brand-700">8</span>
                  <span className="text-xs text-ink-muted font-medium">Divisions Covered</span>
                </div>
                <div>
                  <span className="block text-2xl font-extrabold text-brand-700">99.9%</span>
                  <span className="text-xs text-ink-muted font-medium">Gate Check-in Uptime</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}

