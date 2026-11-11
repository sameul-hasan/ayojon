import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldCheck,
  Ticket,
  User,
  Video,
} from "lucide-react";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Badge } from "@/components/ui/Badge";
import { QrMatrixSvg } from "@/components/QrMatrixSvg";
import { TicketPrintActions } from "@/components/attendee/TicketPrintActions";
import { loadDb } from "@/lib/db";
import { coverGradient } from "@/components/marketplace/categoryStyle";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const db = loadDb();
  const ticket = db.tickets.find((t) => t.id === id);
  const event = ticket ? db.events.find((e) => e.id === ticket.event_id) : null;
  return {
    title: event ? `Admission Pass: ${event.title} — Aayojon` : "Admission Pass — Aayojon",
  };
}

export default async function TicketDetailsPage({ params }: Props) {
  const { id } = await params;
  const db = loadDb();
  const ticket = db.tickets.find((t) => t.id === id);
  if (!ticket) notFound();

  const event = db.events.find((e) => e.id === ticket.event_id);
  const venue = db.venues.find((v) => v.id === event?.venue_id);
  const reg = db.registrations.find((r) => r.id === ticket.registration_id);
  const order = reg?.order_id ? db.orders.find((o) => o.id === reg.order_id) : null;
  const org = db.organizations.find((o) => o.id === event?.organization_id);
  const checkIn = db.check_ins.find((c) => c.ticket_id === ticket.id);
  const phone = reg?.attendee_phone || order?.attendee_phone || "";
  const orderRef = order?.id ? `#${order.id}` : `#${ticket.registration_id}`;

  const fullDate = event
    ? new Date(event.starts_at).toLocaleString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Dhaka",
      })
    : "";

  const timeRange = event
    ? `${new Date(event.starts_at).toLocaleString("en-GB", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "Asia/Dhaka",
      })} – ${new Date(event.ends_at).toLocaleString("en-GB", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "Asia/Dhaka",
      })}`
    : "";

  const locationText = event?.is_online
    ? "Online Event (Virtual Access)"
    : [venue?.name, venue?.address, venue?.city].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col justify-between">
      <div className="print:hidden">
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
      </div>

      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        {/* Top Back Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 print:hidden">
          <Link
            href="/portal?tab=wallet"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted transition hover:text-brand-600"
          >
            <ArrowLeft className="size-4" /> Back to My Tickets
          </Link>

          <TicketPrintActions
            ticketId={ticket.id}
            eventTitle={event?.title ?? "Aayojon Event"}
            startsAt={event?.starts_at ?? ""}
            endsAt={event?.ends_at ?? ""}
            location={locationText}
          />
        </div>

        {/* Official Ticket Pass Container */}
        <div className="relative overflow-hidden rounded-3xl border border-line bg-surface shadow-card print:border-none print:shadow-none">
          {/* Header Banner */}
          <div className={`h-3 bg-gradient-to-r ${coverGradient(event?.category_id ?? "")}`} />

          <div className="p-6 sm:p-8">
            {/* Top Pass Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line pb-6">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="Aayojon" className="h-8 w-auto object-contain" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-brand-700">Official Entry Pass</p>
                  <p className="text-[11px] text-ink-muted">আয়োজন ডিজিটাল টিকিট</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge tone={ticket.status === "VALID" ? "success" : ticket.status === "USED" ? "info" : "danger"}>
                  {ticket.status === "VALID" ? (
                    <CheckCircle2 className="mr-1 size-3.5" />
                  ) : (
                    <Clock className="mr-1 size-3.5" />
                  )}
                  {ticket.status === "VALID" ? "Active Entry Pass" : ticket.status}
                </Badge>
                <span className="font-mono text-xs font-semibold text-ink-muted">#{ticket.id}</span>
              </div>
            </div>

            {/* Event Overview */}
            <div className="mt-6 space-y-2">
              <span className="inline-block rounded-md bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">
                {ticket.ticket_type_name}
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                {event?.title ?? "Aayojon Event"}
              </h1>
              {org && (
                <p className="flex items-center gap-1.5 text-xs text-ink-muted">
                  <Building2 className="size-3.5 text-brand-600" />
                  Organized by <strong className="text-ink">{org.name}</strong>
                  {org.verified_badge && <BadgeCheck className="size-3.5 text-brand-600" />}
                </p>
              )}
            </div>

            {/* Event Time & Location Grid */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 rounded-2xl bg-canvas-alt/50 p-4 border border-line">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <CalendarDays className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Date & Time</p>
                  <p className="text-sm font-bold text-ink">{fullDate}</p>
                  <p className="text-xs text-ink-muted mt-0.5">{timeRange} (Dhaka)</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-pink/10 text-pink">
                  {event?.is_online ? <Video className="size-5" /> : <MapPin className="size-5" />}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Location</p>
                  <p className="text-sm font-bold text-ink">
                    {event?.is_online ? "Online Event" : venue?.name || "Dhaka"}
                  </p>
                  <p className="text-xs text-ink-muted mt-0.5">
                    {event?.is_online ? "Virtual streaming link in email" : locationText}
                  </p>
                </div>
              </div>
            </div>

            {/* Punch Notch Divider */}
            <div className="relative my-8 flex items-center justify-between -mx-6 sm:-mx-8">
              <div className="size-6 rounded-r-full bg-canvas border-r border-line -ml-0.5 shadow-inner" />
              <div className="flex-1 border-t-2 border-dashed border-line/80 mx-2" />
              <div className="size-6 rounded-l-full bg-canvas border-l border-line -mr-0.5 shadow-inner" />
            </div>

            {/* QR Code Presentation */}
            <div className="flex flex-col items-center justify-center text-center">
              <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
                <QrMatrixSvg tokenHash={ticket.token_hash} size={220} />
              </div>

              <p className="mt-3 text-sm font-bold text-ink">Gate Entrance QR Code</p>
              <p className="mt-1 text-xs text-ink-muted max-w-sm">
                Show this QR code at the entrance checkpoint. The gate scanner verifies the cryptographically secure SHA-256
                token in real-time.
              </p>

              {checkIn && (
                <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/80 px-4 py-2.5 text-xs text-blue-900 font-medium">
                  Checked in on {new Date(checkIn.checked_in_at).toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })} by{" "}
                  {checkIn.staff_name}
                </div>
              )}
            </div>

            {/* Attendee & Booking Details Table */}
            <div className="mt-8 border-t border-line pt-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-4">
                Registration & Attendee Information
              </h2>
              <dl className="grid gap-3 sm:grid-cols-2 text-xs">
                <div>
                  <dt className="text-ink-muted">Attendee Name</dt>
                  <dd className="font-bold text-sm text-ink">{ticket.attendee_name}</dd>
                </div>
                <div>
                  <dt className="text-ink-muted">Email Address</dt>
                  <dd className="font-bold text-sm text-ink break-all">{ticket.attendee_email}</dd>
                </div>
                {phone && (
                  <div>
                    <dt className="text-ink-muted">Phone Number</dt>
                    <dd className="font-medium text-ink">{phone}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-ink-muted">Booking Reference</dt>
                  <dd className="font-mono text-ink font-semibold">{orderRef}</dd>
                </div>
                <div>
                  <dt className="text-ink-muted">Issued At</dt>
                  <dd className="font-medium text-ink">
                    {new Date(ticket.issued_at).toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })}
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-muted">Pass Token ID</dt>
                  <dd className="font-mono text-ink-muted truncate">{ticket.token_hash.slice(0, 16)}...</dd>
                </div>
              </dl>
            </div>

            {/* Bottom Security Notice */}
            <div className="mt-8 flex items-center justify-between border-t border-line/80 pt-4 text-[11px] text-ink-muted">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-success" /> Tamper-evident SHA-256 Digital Verification
              </span>
              <span>Valid for single gate admission</span>
            </div>
          </div>
        </div>
      </main>

      <div className="print:hidden">
        <PublicFooter />
      </div>
    </div>
  );
}
