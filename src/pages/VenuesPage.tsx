import React, { useState, useMemo } from "react";
import { Link } from "@/components/ui/Link";
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

export function VenuesPage() {
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
      <PublicNavbar activeHref="/venues" />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-canvas-alt border-b border-line py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/80 px-3 py-1 text-xs font-bold text-indigo-700">
              <Building2 className="size-3.5" />
              <span>Verified Partner Venues Catalog</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-ink">
              Discover Premier Auditoriums & Event Spaces in Bangladesh
            </h1>
            <p className="text-base text-ink-muted leading-relaxed">
              Browse certified convention halls, university auditoriums, open-air amphitheatres, and tech hubs. Request itemized quotations directly with generator backup, AV specs, and verified acoustical ratings.
            </p>
          </div>
        </div>
      </section>

      {/* CATALOG & SEARCH CONTROLS */}
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8 flex-1">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-6">
          {/* SEARCH BAR */}
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-3 size-4 text-ink-muted" />
            <input
              type="text"
              placeholder="Search by venue name, location, or area..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-btn border border-line bg-surface pl-9 pr-4 text-xs text-ink placeholder:text-ink-muted focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600 shadow-xs"
            />
          </div>

          {/* FILTER CONTROLS */}
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              aria-label="Filter by City"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="h-10 rounded-btn border border-line bg-surface px-3 text-xs font-semibold text-ink focus:border-brand-600 focus:outline-none"
            >
              <option value="All">All Cities</option>
              <option value="Dhaka">Dhaka</option>
              <option value="Chattogram">Chattogram</option>
              <option value="Sylhet">Sylhet</option>
            </select>

            <select
              aria-label="Filter by Venue Type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-10 rounded-btn border border-line bg-surface px-3 text-xs font-semibold text-ink focus:border-brand-600 focus:outline-none"
            >
              <option value="All">All Types</option>
              <option value="Auditorium">Auditoriums</option>
              <option value="Convention Hall">Convention Halls</option>
              <option value="Innovation Hub">Innovation Hubs</option>
              <option value="University Hall">University Halls</option>
              <option value="Ballroom">Ballrooms</option>
            </select>
          </div>
        </div>

        {/* VENUES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVenues.map((v) => (
            <div
              key={v.id}
              className="group flex flex-col justify-between rounded-2xl border border-line bg-surface overflow-hidden shadow-xs hover:shadow-card transition duration-200"
            >
              <div>
                <div className="relative aspect-[16/10] overflow-hidden bg-canvas-alt">
                  <img
                    src={v.imageUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800"}
                    alt={v.name}
                    className="size-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-3 right-3 rounded-full bg-surface/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-ink shadow-xs">
                    {v.type}
                  </div>
                  {v.verified && (
                    <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-emerald-600/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-white shadow-xs">
                      <ShieldCheck className="size-3" />
                      <span>Verified Partner</span>
                    </div>
                  )}
                </div>

                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                    <MapPin className="size-3.5 text-brand-600 shrink-0" />
                    <span className="truncate">{v.address}, {v.city}</span>
                  </div>

                  <h3 className="text-lg font-bold text-ink group-hover:text-brand-600 transition">
                    <Link to={`/venues/${v.slug}`}>{v.name}</Link>
                  </h3>

                  <div className="flex items-center gap-4 text-xs text-ink-muted pt-1">
                    <div className="flex items-center gap-1">
                      <Users className="size-3.5 text-ink-muted" />
                      <span>Cap: {v.capacity}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="size-3.5 text-amber-500" />
                      <span>{v.amenities?.[0] || "Generator Backup"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0 flex items-center justify-between border-t border-line/60 mt-4">
                <div>
                  <div className="text-[10px] uppercase font-bold text-ink-muted">Daily Rate Starting</div>
                  <div className="text-base font-bold text-ink">{formatBDT(v.dailyRateBDT)}</div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/venues/${v.slug}`}
                    className="rounded-btn border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-canvas-alt transition"
                  >
                    View Specs
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleOpenBooking(v)}
                    className="rounded-btn bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 shadow-xs transition"
                  >
                    Book / RFQ
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <PublicFooter />

      {selectedVenue && (
        <VenueBookingModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          venue={selectedVenue}
        />
      )}
    </div>
  );
}
