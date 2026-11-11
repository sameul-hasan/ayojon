import React, { useState, useMemo } from "react";
import Link from "@/components/ui/Link";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Info,
  Layers,
  MapPin,
  Maximize2,
  Music,
  Phone,
  Power,
  Share2,
  ShieldCheck,
  Sparkles,
  Tv,
  Users,
  Wifi,
  Wind,
  X,
  FileText,
  DollarSign,
} from "lucide-react";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PARTNER_VENUES, type PartnerVenue } from "@/lib/venues-catalog";
import { formatBDT } from "@/lib/public-events-shared";
import { VenueBookingModal } from "@/components/venue/VenueBookingModal";

export function VenueDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const slug = params?.slug as string;

  const venue = useMemo(() => {
    return PARTNER_VENUES.find((v) => v.slug === slug || v.id === slug) || null;
  }, [slug]);

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  if (!venue) {
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
          hostHref="/organizer"
        />
        <main className="flex-1 flex items-center justify-center p-6 text-center">
          <div className="max-w-md rounded-card border border-line bg-surface p-8 shadow-card">
            <Building2 className="mx-auto size-12 text-ink-muted/50 mb-3" />
            <h1 className="text-xl font-bold text-ink">Venue Not Found</h1>
            <p className="mt-2 text-sm text-ink-muted">
              The venue space you are looking for does not exist or may have been retired from the active directory.
            </p>
            <div className="mt-6">
              <Link href="/venues">
                <Button variant="primary">Browse All Venues</Button>
              </Link>
            </div>
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  // Related venues in same city or type
  const relatedVenues = PARTNER_VENUES.filter(
    (v) => v.id !== venue.id && (v.city === venue.city || v.type === venue.type)
  ).slice(0, 3);

  // Gallery items
  const galleryImages = [
    venue.imageUrl,
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80",
  ];

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
        hostHref="/organizer"
      />

      <main className="flex-1 pb-16">
        {/* BREADCRUMB & TOP BAR */}
        <div className="border-b border-line bg-surface">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between text-xs text-ink-muted">
            <div className="flex items-center gap-2">
              <Link href="/venues" className="hover:text-brand-600 flex items-center gap-1">
                <ArrowLeft className="size-3.5" /> Back to Venues
              </Link>
              <span>/</span>
              <span>{venue.city}</span>
              <span>/</span>
              <span className="font-semibold text-ink truncate max-w-xs">{venue.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="brand">{venue.type}</Badge>
              {venue.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="size-3" /> Aayojon Verified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* HERO PHOTO GALLERY */}
        <section className="bg-canvas-alt border-b border-line py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-4 lg:grid-cols-3">
              {/* Main Photo */}
              <div className="lg:col-span-2 relative aspect-[16/10] overflow-hidden rounded-modal border border-line bg-surface shadow-sm">
                <img
                  src={galleryImages[selectedPhotoIndex]}
                  alt={venue.name}
                  className="size-full object-cover transition duration-300"
                />
                <div className="absolute bottom-4 left-4 rounded-full bg-ink/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                  Photo {selectedPhotoIndex + 1} of {galleryImages.length}
                </div>
              </div>

              {/* Thumbnails & Quick Info */}
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-3 gap-2">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedPhotoIndex(idx)}
                      className={`relative aspect-video overflow-hidden rounded-card border-2 transition ${
                        selectedPhotoIndex === idx
                          ? "border-brand-600 ring-2 ring-brand-300"
                          : "border-line opacity-75 hover:opacity-100"
                      }`}
                    >
                      <img src={img} alt={`Thumbnail ${idx + 1}`} className="size-full object-cover" />
                    </button>
                  ))}
                </div>

                {/* Quick Info Box */}
                <div className="flex-1 rounded-card border border-line bg-surface p-4 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">Quick Specifications</span>
                    <ul className="mt-3 space-y-2.5 text-xs">
                      <li className="flex items-center justify-between border-b border-line pb-2">
                        <span className="flex items-center gap-1.5 text-ink-muted">
                          <Users className="size-3.5 text-brand-600" /> Maximum Capacity
                        </span>
                        <span className="font-bold text-ink">{venue.capacity.toLocaleString()} Seats</span>
                      </li>
                      <li className="flex items-center justify-between border-b border-line pb-2">
                        <span className="flex items-center gap-1.5 text-ink-muted">
                          <Building2 className="size-3.5 text-brand-600" /> Venue Category
                        </span>
                        <span className="font-semibold text-ink">{venue.type}</span>
                      </li>
                      <li className="flex items-center justify-between border-b border-line pb-2">
                        <span className="flex items-center gap-1.5 text-ink-muted">
                          <MapPin className="size-3.5 text-brand-600" /> Division / City
                        </span>
                        <span className="font-semibold text-ink">{venue.city}, Bangladesh</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-ink-muted">
                          <Power className="size-3.5 text-brand-600" /> Standby Power
                        </span>
                        <span className="font-semibold text-emerald-700">Generator Backup</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-4 pt-3 border-t border-line">
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => setBookingModalOpen(true)}
                    >
                      Request Quotation / RFQ
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MAIN CONTENT + STICKY SIDEBAR */}
        <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left 2 Cols: Details & Amenities */}
            <div className="lg:col-span-2 space-y-8">
              {/* Header Title */}
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                  {venue.name}
                </h1>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-muted">
                  <MapPin className="size-4 text-brand-600 shrink-0" />
                  <span>{venue.address}</span>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(venue.name + " " + venue.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"
                  >
                    View on Map <ExternalLink className="size-3" />
                  </a>
                </p>
              </div>

              {/* Description */}
              <div className="rounded-card border border-line bg-surface p-6 shadow-sm">
                <h2 className="text-base font-bold text-ink mb-3 flex items-center gap-2">
                  <Info className="size-4 text-brand-600" /> About This Venue
                </h2>
                <p className="text-sm leading-relaxed text-ink-muted">
                  {venue.description}
                </p>
              </div>

              {/* Amenities & Technical Features */}
              <div className="rounded-card border border-line bg-surface p-6 shadow-sm">
                <h2 className="text-base font-bold text-ink mb-4 flex items-center gap-2">
                  <Layers className="size-4 text-brand-600" /> Amenities & Facilities Included
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {venue.amenities.map((amenity, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-btn border border-line bg-canvas-alt px-3.5 py-2.5 text-xs font-medium text-ink"
                    >
                      <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Policies & Venue Rules */}
              <div className="rounded-card border border-line bg-surface p-6 shadow-sm">
                <h2 className="text-base font-bold text-ink mb-3 flex items-center gap-2">
                  <FileText className="size-4 text-brand-600" /> Booking Policies & Regulations
                </h2>
                <ul className="space-y-2.5 text-xs text-ink-muted">
                  <li className="flex items-start gap-2">
                    <span className="size-1.5 rounded-full bg-brand-600 mt-1.5 shrink-0" />
                    <span><strong>Cancellation Rule:</strong> 100% refund up to 14 days before event date; 50% refund up to 7 days before event.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="size-1.5 rounded-full bg-brand-600 mt-1.5 shrink-0" />
                    <span><strong>Operating Curfew:</strong> Evening slots conclude strictly at 23:00 to adhere to residential and campus regulations.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="size-1.5 rounded-full bg-brand-600 mt-1.5 shrink-0" />
                    <span><strong>Outside Catering & Sound:</strong> Outside licensed caterers permitted with pre-approval. Venue electrical team oversees heavy line-array sound hookups.</span>
                  </li>
                </ul>
              </div>

              {/* Verified Venue Host Profile */}
              <div className="rounded-card border border-line bg-surface p-6 shadow-sm flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex size-12 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-bold text-lg">
                    {venue.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ink">{venue.name} Management Office</h3>
                    <p className="text-xs text-ink-muted">Official Verified Partner Venue Host</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-ink-muted">
                      <span>{venue.contactPhone}</span>
                      <span>&bull;</span>
                      <span>{venue.contactEmail}</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBookingModalOpen(true)}
                >
                  Direct Inquiry
                </Button>
              </div>
            </div>

            {/* Right Column: Pricing & Booking Card */}
            <div>
              <div className="sticky top-20 rounded-card border border-line bg-surface p-6 shadow-card space-y-6">
                <div>
                  <span className="text-xs text-ink-muted">Indicative Pricing</span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-brand-700">
                      {formatBDT(venue.dailyRateBDT)}
                    </span>
                    <span className="text-xs text-ink-muted">/ full day (8 hours)</span>
                  </div>
                  <div className="mt-1 text-xs text-ink-muted">
                    Hourly rate: <span className="font-semibold text-ink">{formatBDT(venue.hourlyRateBDT)}/hr</span> (minimum 4 hours)
                  </div>
                </div>

                <div className="border-t border-line pt-4 space-y-2 text-xs">
                  <div className="flex justify-between py-1">
                    <span className="text-ink-muted">Standard Hall Rental</span>
                    <span className="font-medium text-ink">{formatBDT(venue.dailyRateBDT)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-ink-muted">AC & Generator Standby</span>
                    <span className="font-medium text-emerald-600">Included</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-ink-muted">Security & Janitorial</span>
                    <span className="font-medium text-emerald-600">Included</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-ink-muted">Sound Tech & Stage Rig</span>
                    <span className="font-medium text-ink">Quotation on RFQ</span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={() => setBookingModalOpen(true)}
                  >
                    Request Quotation & Date Hold
                  </Button>
                  <Link href="/organizer" className="block w-full">
                    <Button variant="outline" size="sm" className="w-full">
                      Open in Organizer Studio
                    </Button>
                  </Link>
                  <p className="text-center text-[11px] text-ink-muted">
                    Instant quote generation with zero upfront commission.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RELATED VENUES */}
        {relatedVenues.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold tracking-tight text-ink mb-6">
              Alternative Event Spaces You Might Consider
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedVenues.map((rel) => (
                <Card
                  key={rel.id}
                  className="flex flex-col overflow-hidden border border-line bg-surface shadow-card hover:shadow-pop transition-all group"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-canvas-alt">
                    <img
                      src={rel.imageUrl}
                      alt={rel.name}
                      className="size-full object-cover transition group-hover:scale-105"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="rounded-full bg-surface/90 px-2 py-0.5 text-[10px] font-bold text-ink">
                        {rel.type}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-ink text-sm group-hover:text-brand-600 line-clamp-1">
                        {rel.name}
                      </h3>
                      <p className="mt-1 text-xs text-ink-muted line-clamp-1">{rel.address}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-line flex items-center justify-between">
                      <span className="text-xs font-bold text-brand-700">{formatBDT(rel.dailyRateBDT)}</span>
                      <Link href={`/venues/${rel.slug}`} className="text-xs font-semibold text-brand-600 hover:underline">
                        View Space &rarr;
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>

      <PublicFooter />

      {/* Booking / Quotation Request Modal */}
      <VenueBookingModal
        venue={venue}
        open={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
      />
    </div>
  );
}

