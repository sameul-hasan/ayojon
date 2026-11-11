import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  Award,
  BadgeCheck,
  Building2,
  CalendarDays,
  Clock,
  ExternalLink,
  Mail,
  MapPin,
  Mic2,
  RotateCcw,
  Sparkles,
  Ticket,
  Users,
  Video,
} from "lucide-react";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { BookingPanel } from "@/components/event/BookingPanel";
import { ShareButton } from "@/components/event/ShareButton";
import { FavoriteButton } from "@/components/marketplace/FavoriteButton";
import { EventGrid } from "@/components/marketplace/EventCard";
import { categoryIcon, demoEventImage } from "@/components/marketplace/categoryStyle";
import { getPublicCatalog, getPublicEventDetail } from "@/lib/public-events";
import { formatBDT } from "@/lib/ui/cn";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const e = getPublicEventDetail(decodeURIComponent(slug));
  return {
    title: e ? `${e.title} — Aayojon` : "Event not found — Aayojon",
    description: e?.tagline || e?.description.slice(0, 160),
  };
}

const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Dhaka", ...opts });

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;
  const event = getPublicEventDetail(decodeURIComponent(slug));
  if (!event) notFound();

  const categories = getPublicCatalog().categories;
  const category = categories.find((c) => c.id === event.categoryId);
  const CategoryIcon = categoryIcon(category?.icon ?? "");

  const fullDate = fmt(event.startsAt, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeRange = `${fmt(event.startsAt, {
    hour: "numeric",
    minute: "2-digit",
  })} – ${fmt(event.endsAt, { hour: "numeric", minute: "2-digit" })}`;

  const startingPrice = event.minPriceMinor;
  const paragraphs = event.description.split(/\n{2,}/).filter(Boolean);
  const imageUrl = demoEventImage(event.categoryId);

  const mapsQuery = event.isOnline
    ? ""
    : encodeURIComponent([event.venueName, event.address, event.city].filter(Boolean).join(", "));

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <PublicNavbar
        items={[
          { label: "Explore", href: "/events" },
          { label: "Categories", href: "/#categories" },
          { label: "About", href: "/#about" },
        ]}
        activeHref="/events"
        signInHref="/login"
        hostHref="/portal"
      />

      <main className="pb-24 lg:pb-16">
        {/* Top Breadcrumb Bar */}
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link
              href="/events"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted transition hover:text-brand-600"
            >
              <ArrowLeft className="size-4" aria-hidden /> All Events
            </Link>

            <div className="flex items-center gap-2">
              <ShareButton title={event.title} variant="button" />
              <FavoriteButton eventId={event.id} title={event.title} />
            </div>
          </div>

          {/* Hero Cover Banner */}
          <div className="relative mt-4 h-64 w-full overflow-hidden rounded-2xl bg-canvas-alt shadow-card sm:h-80 md:h-[400px] lg:h-[440px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={event.title}
              className="h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

            {/* Badges in Hero */}
            <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2 sm:left-6 sm:top-6">
              <Badge tone="brand" className="border-none bg-brand-600/90 text-white backdrop-blur-md">
                <CategoryIcon className="mr-1 size-3.5" aria-hidden />
                {event.categoryName}
              </Badge>
              {event.isFeatured && (
                <Badge tone="coral" className="border-none bg-coral text-white font-bold backdrop-blur-md">
                  <Sparkles className="mr-1 size-3.5" aria-hidden />
                  Featured
                </Badge>
              )}
            </div>

            {/* Title & Quick Info Overlay at bottom of hero */}
            <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-8">
              <div className="max-w-4xl">
                <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl lg:text-5xl text-white drop-shadow-sm">
                  {event.title}
                </h1>
                {event.tagline && (
                  <p className="mt-2 text-sm text-white/90 sm:text-base md:text-lg">
                    {event.tagline}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-white/80">
                  <span className="flex items-center gap-1.5 font-medium">
                    <CalendarDays className="size-4 text-coral" aria-hidden />
                    {fullDate}
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    {event.isOnline ? (
                      <Video className="size-4 text-pink" aria-hidden />
                    ) : (
                      <MapPin className="size-4 text-pink" aria-hidden />
                    )}
                    {event.isOnline ? "Online (Live stream)" : `${event.venueName}, ${event.city}`}
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    Hosted by <span className="font-semibold text-white">{event.organizerName}</span>
                    {event.organizerVerified && (
                      <BadgeCheck className="size-4 text-violet-300" aria-label="Verified organizer" />
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Desktop Grid Layout */}
        <div className="mx-auto mt-8 grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_380px] lg:px-8">
          {/* Main Column: Event Information Sections */}
          <div className="min-w-0 space-y-10">
            {/* Quick Meta Cards */}
            <section aria-label="Date and Location Quick Facts" className="grid gap-3 sm:grid-cols-2">
              <Card className="flex items-start gap-3.5 p-4 sm:p-5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <CalendarDays className="size-5" aria-hidden />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Date & Time</p>
                  <p className="mt-0.5 text-sm font-bold text-ink">{fullDate}</p>
                  <p className="flex items-center gap-1 text-xs text-ink-muted mt-1">
                    <Clock className="size-3.5" aria-hidden /> {timeRange} (Bangladesh Time)
                  </p>
                </div>
              </Card>

              <Card className="flex items-start gap-3.5 p-4 sm:p-5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-pink/10 text-pink">
                  {event.isOnline ? (
                    <Video className="size-5" aria-hidden />
                  ) : (
                    <MapPin className="size-5" aria-hidden />
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Location</p>
                  <p className="mt-0.5 text-sm font-bold text-ink">
                    {event.venueName || "Venue to be announced"}
                  </p>
                  <p className="text-xs text-ink-muted mt-1">
                    {event.isOnline
                      ? "Online event · Link shared after registration"
                      : [event.address, event.city].filter(Boolean).join(", ")}
                  </p>
                </div>
              </Card>
            </section>

            {/* About this Event */}
            <section aria-labelledby="about-heading" className="rounded-2xl border border-line bg-surface p-6 sm:p-8 shadow-card">
              <h2 id="about-heading" className="text-xl font-bold text-ink sm:text-2xl">
                About this event
              </h2>
              <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-ink/85">
                {paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>

              {event.tags.length > 0 && (
                <div className="mt-6 border-t border-line/80 pt-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2.5">Related Topics</p>
                  <ul className="flex flex-wrap gap-2" aria-label="Tags">
                    {event.tags.map((t) => (
                      <li key={t}>
                        <span className="inline-flex items-center rounded-lg bg-canvas-alt px-3 py-1 text-xs font-medium text-ink-muted transition hover:bg-brand-50 hover:text-brand-700">
                          #{t}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            {/* Agenda / Schedule (Rendered only when data exists) */}
            {event.agenda.length > 0 && (
              <section
                aria-labelledby="agenda-heading"
                className="rounded-2xl border border-line bg-surface p-6 sm:p-8 shadow-card"
              >
                <div className="flex items-center justify-between border-b border-line pb-4">
                  <h2 id="agenda-heading" className="flex items-center gap-2 text-xl font-bold text-ink sm:text-2xl">
                    <Clock className="size-6 text-brand-600" aria-hidden />
                    Event Schedule
                  </h2>
                  <Badge tone="brand">{event.agenda.length} Sessions</Badge>
                </div>

                <ol className="relative mt-6 space-y-6 border-l-2 border-brand-200 pl-6 sm:pl-8">
                  {event.agenda.map((a, i) => (
                    <li key={i} className="relative group">
                      {/* Timeline dot */}
                      <span
                        aria-hidden
                        className="absolute -left-[31px] sm:-left-[39px] top-1 size-3.5 rounded-full border-2 border-brand-600 bg-surface shadow-sm group-hover:scale-125 group-hover:bg-brand-600 transition"
                      />
                      <div className="rounded-xl border border-line/80 bg-canvas-alt/50 p-4 transition group-hover:border-brand-300 group-hover:bg-surface">
                        <span className="inline-block rounded-md bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">
                          {a.time}
                        </span>
                        <h3 className="mt-1.5 text-base font-semibold text-ink">{a.title}</h3>
                        {a.speaker && (
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted">
                            <Mic2 className="size-3.5 text-brand-600" aria-hidden />
                            <span>Speaker: <strong className="text-ink">{a.speaker}</strong></span>
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* Speakers / Performers (Rendered only when data exists) */}
            {event.speakers.length > 0 && (
              <section
                aria-labelledby="speakers-heading"
                className="rounded-2xl border border-line bg-surface p-6 sm:p-8 shadow-card"
              >
                <div className="flex items-center justify-between border-b border-line pb-4">
                  <h2 id="speakers-heading" className="flex items-center gap-2 text-xl font-bold text-ink sm:text-2xl">
                    <Users className="size-6 text-brand-600" aria-hidden />
                    Featured Speakers
                  </h2>
                  <Badge tone="neutral">{event.speakers.length} Speakers</Badge>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {event.speakers.map((s) => (
                    <div
                      key={s.name}
                      className="flex items-start gap-4 rounded-xl border border-line bg-canvas-alt/40 p-4 transition hover:border-brand-300 hover:bg-surface"
                    >
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 shadow-sm">
                        <Mic2 className="size-6" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-base font-bold text-ink">{s.name}</h3>
                        <p className="mt-0.5 text-xs font-semibold text-brand-700">{s.role}</p>
                        {s.org && <p className="truncate text-xs text-ink-muted mt-0.5">{s.org}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Sponsors & Partners (Rendered only when data exists) */}
            {event.sponsors.length > 0 && (
              <section
                aria-labelledby="sponsors-heading"
                className="rounded-2xl border border-line bg-surface p-6 sm:p-8 shadow-card"
              >
                <div className="flex items-center justify-between border-b border-line pb-4">
                  <h2 id="sponsors-heading" className="flex items-center gap-2 text-xl font-bold text-ink sm:text-2xl">
                    <Award className="size-6 text-coral" aria-hidden />
                    Event Partners & Sponsors
                  </h2>
                  <Badge tone="coral">Official Sponsors</Badge>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {event.sponsors.map((sp) => (
                    <div
                      key={sp.id}
                      className="flex flex-col items-center justify-center rounded-xl border border-line bg-canvas-alt/50 p-5 text-center transition hover:border-coral/50 hover:bg-surface"
                    >
                      <span className="inline-block rounded-full bg-orange-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-orange-700">
                        {sp.tier}
                      </span>
                      <p className="mt-2 text-sm font-bold text-ink">{sp.companyName}</p>
                      <p className="mt-0.5 text-xs text-ink-muted">Partner</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Venue & Location Information */}
            <section
              aria-labelledby="venue-heading"
              className="rounded-2xl border border-line bg-surface p-6 sm:p-8 shadow-card"
            >
              <h2 id="venue-heading" className="flex items-center gap-2 text-xl font-bold text-ink sm:text-2xl">
                {event.isOnline ? (
                  <Video className="size-6 text-brand-600" aria-hidden />
                ) : (
                  <MapPin className="size-6 text-brand-600" aria-hidden />
                )}
                Venue & Location
              </h2>

              <div className="mt-5 rounded-xl border border-line bg-canvas-alt/40 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-ink">
                      {event.isOnline ? "Online Live Event" : event.venueName || "Venue to be announced"}
                    </h3>
                    <p className="mt-1 text-sm text-ink-muted">
                      {event.isOnline
                        ? "This is a virtual event hosted online. High-speed internet is recommended."
                        : [event.address, event.city].filter(Boolean).join(", ")}
                    </p>
                  </div>

                  {!event.isOnline && mapsQuery && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-btn border border-line bg-surface px-4 text-xs font-semibold text-ink shadow-sm transition hover:border-brand-300 hover:text-brand-700"
                    >
                      <MapPin className="size-4 text-brand-600" aria-hidden />
                      View on Google Maps
                      <ExternalLink className="size-3 text-ink-muted" aria-hidden />
                    </a>
                  )}
                </div>

                {event.isOnline ? (
                  <div className="mt-4 rounded-lg bg-brand-50 p-3.5 text-xs text-brand-900">
                    <p className="font-semibold">Virtual Attendance Details:</p>
                    <p className="mt-1 text-brand-800">
                      The streaming access link and instructions will be sent to your registered email immediately after booking.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 grid gap-2 sm:grid-cols-3 border-t border-line/70 pt-4 text-xs text-ink-muted">
                    <div>
                      <span className="font-semibold text-ink">City:</span> {event.city || "Dhaka"}
                    </div>
                    <div>
                      <span className="font-semibold text-ink">Entry Gate:</span> Registered guests only
                    </div>
                    <div>
                      <span className="font-semibold text-ink">Check-in:</span> QR Pass required at door
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Organizer Details */}
            <section
              aria-labelledby="organizer-heading"
              className="rounded-2xl border border-line bg-surface p-6 sm:p-8 shadow-card"
            >
              <h2 id="organizer-heading" className="flex items-center gap-2 text-xl font-bold text-ink sm:text-2xl">
                <Building2 className="size-6 text-brand-600" aria-hidden />
                About the Organizer
              </h2>

              <div className="mt-5 rounded-xl border border-line bg-canvas-alt/40 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700 font-bold text-lg">
                      {event.organizerName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-base font-bold text-ink">{event.organizerName}</h3>
                        {event.organizerVerified && (
                          <span title="Verified Organizer">
                            <BadgeCheck className="size-5 text-brand-600" aria-label="Verified organizer" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink-muted">Aayojon Verified Organizer Partner</p>
                    </div>
                  </div>

                  {event.contactEmail && (
                    <a
                      href={`mailto:${event.contactEmail}?subject=Inquiry regarding ${encodeURIComponent(event.title)}`}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-btn border border-line bg-surface px-3.5 text-xs font-semibold text-ink shadow-sm transition hover:border-brand-300 hover:text-brand-700"
                    >
                      <Mail className="size-4 text-brand-600" aria-hidden />
                      Contact Organizer
                    </a>
                  )}
                </div>

                {event.organizerDescription && (
                  <p className="mt-4 border-t border-line/70 pt-4 text-sm leading-relaxed text-ink/80">
                    {event.organizerDescription}
                  </p>
                )}
              </div>
            </section>

            {/* Refund Policy */}
            {event.refundPolicy && (
              <section
                aria-labelledby="refund-heading"
                className="rounded-2xl border border-line bg-surface p-6 sm:p-8 shadow-card"
              >
                <h2 id="refund-heading" className="flex items-center gap-2 text-xl font-bold text-ink sm:text-2xl">
                  <RotateCcw className="size-6 text-brand-600" aria-hidden />
                  Refund & Cancellation Policy
                </h2>
                <div className="mt-4 rounded-xl bg-canvas-alt/50 p-4 text-sm leading-relaxed text-ink/80 border border-line/80">
                  <p>{event.refundPolicy}</p>
                  <p className="mt-3 text-xs text-ink-muted">
                    For questions regarding refunds, contact the organizer or reach Aayojon Support with your order ID.
                  </p>
                </div>
              </section>
            )}
          </div>

          {/* Side Column: Sticky Ticket Booking Panel */}
          <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Ticket Booking Panel">
            <BookingPanel
              tickets={event.tickets}
              checkoutHref={`/events/${encodeURIComponent(event.slug)}/checkout`}
              ended={event.hasEnded}
            />
          </aside>
        </div>

        {/* Related Events Section (Rendered only when data exists) */}
        {event.related.length > 0 && (
          <section aria-labelledby="related-heading" className="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between border-b border-line pb-4 mb-6">
              <div>
                <h2 id="related-heading" className="text-2xl font-bold text-ink sm:text-3xl">
                  More Events Like This
                </h2>
                <p className="mt-1 text-sm text-ink-muted">Discover other events in {event.categoryName}</p>
              </div>
              <Link
                href={`/events?category=${encodeURIComponent(category?.slug || "")}`}
                className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                View all <ArrowLeft className="size-4 rotate-180" aria-hidden />
              </Link>
            </div>
            <EventGrid events={event.related} categories={categories} />
          </section>
        )}
      </main>

      {/* Mobile Sticky Booking Bar */}
      {!event.hasEnded && event.tickets.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t border-line bg-surface/95 px-4 py-3 shadow-modal backdrop-blur-md lg:hidden">
          <div className="min-w-0">
            <p className="text-xs text-ink-muted">
              {startingPrice === 0 ? "Admission" : "Tickets starting from"}
            </p>
            <p className="text-lg font-extrabold text-brand-700">
              {startingPrice === 0 ? "Free Entry" : startingPrice !== null ? formatBDT(startingPrice) : "Free"}
            </p>
          </div>
          <a
            href="#booking"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-btn bg-brand-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 active:scale-95"
          >
            <Ticket className="size-4" aria-hidden />
            Get Tickets
          </a>
        </div>
      )}

      <PublicFooter />
    </div>
  );
}
