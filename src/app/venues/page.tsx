"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  MapPin,
  Search,
  Sparkles,
  Users,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PARTNER_VENUES, type PartnerVenue } from "@/lib/venues-catalog";
import { formatBDT } from "@/lib/public-events-shared";
import { VenueBookingModal } from "@/components/venue/VenueBookingModal";

export default function VenuesPage() {
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [selectedVenue, setSelectedVenue] = useState<PartnerVenue | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const filteredVenues = useMemo(() => {
    return PARTNER_VENUES.filter((v) => {
      const matchSearch =
        search.trim() === "" ||
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.address.toLowerCase().includes(search.toLowerCase()) ||
        v.city.toLowerCase().includes(search.toLowerCase());

      const matchCity = cityFilter === "All" || v.city === cityFilter;
      const matchType = typeFilter === "All" || v.type === typeFilter;

      return matchSearch && matchCity && matchType;
    });
  }, [search, cityFilter, typeFilter]);

  const handleOpenBooking = (venue: PartnerVenue) => {
    setSelectedVenue(venue);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      <PublicNavbar
        items={[
          { label: "Explore", href: "/events" },
          { label: "Venues", href: "/venues" },
          { label: "Categories", href: "/#categories" },
          { label: "About", href: "/#about" },
        ]}
        activeHref="/venues"
        signInHref="/login"
        hostHref="/portal"
      />

      <main className="flex-1">
        {/* HERO BANNER */}
        <section className="relative overflow-hidden bg-canvas-alt border-b border-line py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1 text-xs font-semibold text-brand-700 mb-4">
              <Building2 className="size-3.5" />
              <span>Aayojon Partner Spaces & Venues</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl">
              Find & Reserve the Ideal Venue for Your Event
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base text-ink-muted">
              Discover verified auditoriums, university halls, innovation hubs, and convention spaces across Bangladesh. Transparent pricing, instant availability inquiries, and full technical amenities.
            </p>

            {/* SEARCH AND QUICK FILTERS */}
            <div className="mx-auto mt-8 max-w-3xl space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-ink-muted" />
                <Input
                  type="text"
                  placeholder="Search by venue name, area (e.g. Farmgate, Gulshan, Kuril), or city..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-12 shadow-sm text-sm"
                />
              </div>

              {/* FILTER PILLS */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-semibold text-ink-muted mr-1">City:</span>
                  {["All", "Dhaka", "Chattogram"].map((city) => (
                    <button
                      key={city}
                      onClick={() => setCityFilter(city)}
                      className={`rounded-full px-3 py-1 font-medium transition ${
                        cityFilter === city
                          ? "bg-brand-600 text-white"
                          : "bg-surface border border-line text-ink-muted hover:text-ink hover:bg-canvas"
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-semibold text-ink-muted mr-1">Type:</span>
                  {["All", "Auditorium", "Convention Hall", "Innovation Hub", "University Hall"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setTypeFilter(type)}
                      className={`rounded-full px-3 py-1 font-medium transition ${
                        typeFilter === type
                          ? "bg-brand-600 text-white"
                          : "bg-surface border border-line text-ink-muted hover:text-ink hover:bg-canvas"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* VENUES GRID */}
        <section className="py-12 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-ink">
                Verified Spaces ({filteredVenues.length})
              </h2>
              <p className="text-xs text-ink-muted">All venues feature verified capacity, acoustic compliance, and standby generators.</p>
            </div>
          </div>

          {filteredVenues.length === 0 ? (
            <div className="rounded-card border border-line bg-surface p-12 text-center">
              <Building2 className="mx-auto size-12 text-ink-muted/50 mb-3" />
              <h3 className="text-base font-semibold text-ink">No venues match your criteria</h3>
              <p className="text-xs text-ink-muted mt-1">Try clearing your filters or changing search keywords.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setSearch("");
                  setCityFilter("All");
                  setTypeFilter("All");
                }}
              >
                Clear all filters
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredVenues.map((venue) => (
                <Card
                  key={venue.id}
                  className="flex flex-col overflow-hidden border border-line bg-surface shadow-card hover:shadow-pop transition-all group"
                >
                  {/* Photo Header */}
                  <div className="relative aspect-video w-full overflow-hidden bg-canvas-alt">
                    <img
                      src={venue.imageUrl}
                      alt={venue.name}
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      <span className="rounded-full bg-surface/90 px-2.5 py-0.5 text-[11px] font-bold text-ink backdrop-blur-sm shadow-sm">
                        {venue.type}
                      </span>
                      {venue.verified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/90 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
                          <CheckCircle2 className="size-3" /> Verified
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-pink">
                        <Users className="size-3.5" /> Up to {venue.capacity.toLocaleString()} Seats
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="flex flex-1 flex-col p-5 justify-between">
                    <div>
                      <Link href={`/venues/${venue.slug}`}>
                        <h3 className="text-lg font-bold text-ink group-hover:text-brand-600 transition-colors line-clamp-1">
                          {venue.name}
                        </h3>
                      </Link>
                      <p className="mt-1 flex items-start gap-1.5 text-xs text-ink-muted line-clamp-1">
                        <MapPin className="size-3.5 text-brand-600 shrink-0 mt-0.5" />
                        <span>{venue.address}</span>
                      </p>

                      <p className="mt-3 text-xs text-ink-muted line-clamp-2">
                        {venue.description}
                      </p>

                      {/* Amenities chips */}
                      <div className="mt-4 flex flex-wrap gap-1">
                        {venue.amenities.slice(0, 3).map((amenity) => (
                          <span
                            key={amenity}
                            className="rounded-full border border-line bg-canvas-alt px-2 py-0.5 text-[10px] text-ink-muted"
                          >
                            {amenity}
                          </span>
                        ))}
                        {venue.amenities.length > 3 && (
                          <span className="rounded-full border border-line bg-canvas-alt px-2 py-0.5 text-[10px] text-ink-muted font-semibold">
                            +{venue.amenities.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Pricing & CTA */}
                    <div className="mt-5 border-t border-line pt-4 flex items-center justify-between gap-2">
                      <div>
                        <span className="block text-[11px] text-ink-muted">Daily Rate</span>
                        <span className="text-base font-bold text-brand-700">
                          {formatBDT(venue.dailyRateBDT)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/venues/${venue.slug}`}>
                          <Button variant="outline" size="sm">
                            Details
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          onClick={() => handleOpenBooking(venue)}
                        >
                          Inquire
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* LIST YOUR VENUE CTA */}
        <section className="border-t border-line bg-canvas-alt py-12">
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
            <h2 className="text-2xl font-bold text-ink">Own or Manage an Event Space in Bangladesh?</h2>
            <p className="mt-2 text-sm text-ink-muted max-w-xl mx-auto">
              Partner with Aayojon to receive verified event booking requests from universities, corporate brands, tech hackathons, and cultural organizers.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/login"
                className="inline-flex h-11 items-center gap-2 rounded-btn bg-brand-600 px-6 text-sm font-semibold text-white hover:bg-brand-700 shadow-sm"
              >
                List Your Venue on Aayojon
              </Link>
              <Link
                href="/events"
                className="inline-flex h-11 items-center gap-2 rounded-btn border border-line bg-surface px-6 text-sm font-semibold text-ink hover:bg-canvas"
              >
                Browse Live Events
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />

      {/* Interactive Booking Modal */}
      <VenueBookingModal
        venue={selectedVenue}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}

