import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Link } from "@/components/ui/Link";
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
import { categoryIcon, demoEventImage } from "@/components/marketplace/categoryStyle";
import { useEventDetail } from "@/lib/client-api";
import { formatBDT } from "@/lib/ui/cn";

const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Dhaka", ...opts });

export function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { eventDetail: event, loading, error } = useEventDetail(slug || "");

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas">
        <PublicNavbar />
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="size-8 rounded-full border-3 border-brand-600 border-t-transparent animate-spin" />
            <p className="text-sm font-medium text-ink-muted">Loading event details...</p>
          </div>
        </div>
        <PublicFooter />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-canvas">
        <PublicNavbar />
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <div className="size-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
            <Ticket className="size-8" />
          </div>
          <h1 className="text-2xl font-bold text-ink">Event Not Found</h1>
          <p className="mt-2 text-sm text-ink-muted">The requested event could not be found or has been unlisted.</p>
          <div className="mt-6">
            <Link
              to="/events"
              className="rounded-btn bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Browse All Events
            </Link>
          </div>
        </div>
        <PublicFooter />
      </div>
    );
  }

  const CategoryIcon = categoryIcon(event.categoryId || "");
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

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <PublicNavbar activeHref="/events" />

      {/* BACK NAVIGATION */}
      <div className="border-b border-line bg-surface/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link
            to="/events"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink transition"
          >
            <ArrowLeft className="size-3.5" /> Back to explore
          </Link>
          <div className="flex items-center gap-2">
            <ShareButton title={event.title} />
            <FavoriteButton eventId={event.id} title={event.title} />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* MAIN CONTENT (LEFT) */}
          <div className="space-y-8 lg:col-span-8">
            {/* HERO BANNER */}
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-canvas-alt shadow-card border border-line">
              <img
                src={demoEventImage(event.slug)}
                alt={event.title}
                className="size-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-semibold text-white mb-2">
                  <CategoryIcon className="size-3.5" />
                  <span>{event.categoryName}</span>
                </span>
                <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">{event.title}</h1>
                <p className="mt-2 text-sm sm:text-base text-white/90 line-clamp-2">{event.tagline}</p>
              </div>
            </div>

            {/* KEY METRICS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 rounded-xl border border-line bg-surface p-4 shadow-xs">
                <div className="flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <CalendarDays className="size-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-ink-muted">Date & Time</div>
                  <div className="text-sm font-bold text-ink mt-0.5">{fullDate}</div>
                  <div className="text-xs text-ink-muted mt-0.5">{timeRange} (BST)</div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-line bg-surface p-4 shadow-xs">
                <div className="flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <MapPin className="size-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-ink-muted">Location</div>
                  <div className="text-sm font-bold text-ink mt-0.5">{event.venueName}</div>
                  <div className="text-xs text-ink-muted mt-0.5">{event.address}</div>
                </div>
              </div>
            </div>

            {/* DESCRIPTION */}
            <div className="rounded-2xl border border-line bg-surface p-6 shadow-xs space-y-4">
              <h2 className="text-lg font-bold text-ink">About This Event</h2>
              <div className="prose prose-sm max-w-none text-ink-muted leading-relaxed whitespace-pre-line">
                {event.description}
              </div>
            </div>

            {/* AGENDA */}
            {event.agenda && event.agenda.length > 0 && (
              <div className="rounded-2xl border border-line bg-surface p-6 shadow-xs space-y-4">
                <h2 className="text-lg font-bold text-ink">Event Schedule & Agenda</h2>
                <div className="divide-y divide-line/60">
                  {event.agenda.map((item, idx) => (
                    <div key={idx} className="py-3 flex items-start gap-4">
                      <span className="font-mono text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                        {item.time}
                      </span>
                      <div>
                        <div className="text-sm font-bold text-ink">{item.title}</div>
                        {item.speaker && <div className="text-xs text-ink-muted mt-0.5">Speaker: {item.speaker}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SIDEBAR BOOKING PANEL (RIGHT) */}
          <div className="lg:col-span-4">
            <div className="sticky top-20 space-y-6">
              <BookingPanel
                tickets={event.tickets}
                checkoutHref={`/events/${event.slug}/checkout`}
                ended={event.hasEnded}
              />
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
