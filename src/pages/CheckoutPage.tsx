"use client";

import React from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Link } from "@/components/ui/Link";
import { Ticket, ArrowLeft, Loader2 } from "lucide-react";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { CheckoutFlow } from "@/components/event/CheckoutFlow";
import { useEventDetail } from "@/lib/client-api";

export function CheckoutPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const ticketId = searchParams.get("ticket") || undefined;
  const qtyParam = parseInt(searchParams.get("qty") || "1", 10);
  const qty = Number.isFinite(qtyParam) && qtyParam > 0 ? qtyParam : 1;

  const { eventDetail: event, loading, error } = useEventDetail(slug || "");

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-canvas text-ink">
        <PublicNavbar />
        <main className="flex-1 flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-8 text-brand-600 animate-spin" />
            <p className="text-sm font-medium text-ink-muted">Loading checkout session...</p>
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex flex-col bg-canvas text-ink">
        <PublicNavbar />
        <main className="flex-1 flex items-center justify-center py-20 px-4">
          <div className="max-w-md w-full text-center rounded-3xl border border-line bg-surface p-8 shadow-card">
            <div className="size-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Ticket className="size-8" />
            </div>
            <h1 className="text-2xl font-bold text-ink">Event Not Found</h1>
            <p className="mt-2 text-sm text-ink-muted">
              The event you are trying to book tickets for could not be found or has ended.
            </p>
            <div className="mt-6 flex justify-center">
              <Link
                href="/events"
                className="inline-flex items-center gap-2 rounded-btn bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition"
              >
                <ArrowLeft className="size-4" />
                <span>Browse All Events</span>
              </Link>
            </div>
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      <PublicNavbar />

      <main className="flex-1">
        <CheckoutFlow
          event={{
            id: event.id,
            slug: event.slug,
            title: event.title,
            startsAt: event.startsAt,
            venueName: event.venueName || (event.isOnline ? "Online Live Stream" : "Dhaka, Bangladesh"),
            city: event.city || "Dhaka",
            isOnline: event.isOnline,
          }}
          tickets={event.tickets}
          initialTicketId={ticketId}
          initialQty={qty}
          ended={event.hasEnded || false}
        />
      </main>

      <PublicFooter />
    </div>
  );
}

export default CheckoutPage;

