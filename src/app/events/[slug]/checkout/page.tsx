import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { CheckoutFlow } from "@/components/event/CheckoutFlow";
import { getPublicEventDetail } from "@/lib/public-events";

export const dynamic = "force-dynamic";
export const metadata = { title: "Checkout — Aayojon" };

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function CheckoutPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const event = getPublicEventDetail(decodeURIComponent(slug));
  if (!event) notFound();
  const qty = Number.parseInt(one(sp.qty) ?? "1", 10);

  return (
    <>
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
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href={`/events/${event.slug}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-brand-600">
          <ArrowLeft className="size-4" aria-hidden /> {event.title}
        </Link>
        <h1 className="mb-6 mt-3 text-3xl font-bold tracking-tight">Checkout</h1>
        <CheckoutFlow
          event={{
            id: event.id,
            slug: event.slug,
            title: event.title,
            startsAt: event.startsAt,
            venueName: event.venueName,
            city: event.city,
            isOnline: event.isOnline,
          }}
          tickets={event.tickets}
          initialTicketId={one(sp.ticket)}
          initialQty={Number.isFinite(qty) ? qty : 1}
          ended={event.hasEnded}
        />
      </main>
      <PublicFooter />
    </>
  );
}

