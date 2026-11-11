import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Link } from "@/components/ui/Link";
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
  AlertCircle,
} from "lucide-react";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Badge } from "@/components/ui/Badge";
import { QrMatrixSvg } from "@/components/QrMatrixSvg";
import { TicketPrintActions } from "@/components/attendee/TicketPrintActions";
import { fetchDatabaseState } from "@/lib/client-api";
import { coverGradient } from "@/components/marketplace/categoryStyle";

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [ticketData, setTicketData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDatabaseState()
      .then((db) => {
        const ticket = db.tickets.find((t) => t.id === id);
        if (!ticket) {
          setError("Ticket not found");
          setLoading(false);
          return;
        }

        const event = db.events.find((e) => e.id === ticket.event_id);
        const venue = db.venues.find((v) => v.id === event?.venue_id);
        const reg = db.registrations.find((r) => r.id === ticket.registration_id);
        const order = reg?.order_id ? db.orders.find((o) => o.id === reg.order_id) : null;
        const org = db.organizations.find((o) => o.id === event?.organization_id);
        const checkIn = db.check_ins.find((c) => c.ticket_id === ticket.id);
        const phone = reg?.attendee_phone || order?.attendee_phone || "";
        const orderRef = order?.id ? `#${order.id}` : `#${ticket.registration_id}`;

        setTicketData({
          ticket,
          event,
          venue,
          reg,
          order,
          org,
          checkIn,
          phone,
          orderRef,
        });
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas">
        <PublicNavbar />
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="size-8 rounded-full border-3 border-brand-600 border-t-transparent animate-spin" />
            <p className="text-sm font-medium text-ink-muted">Loading admission ticket...</p>
          </div>
        </div>
        <PublicFooter />
      </div>
    );
  }

  if (error || !ticketData) {
    return (
      <div className="min-h-screen bg-canvas">
        <PublicNavbar />
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <AlertCircle className="mx-auto size-12 text-red-500 mb-3" />
          <h1 className="text-xl font-bold text-ink">Ticket Not Found</h1>
          <p className="mt-2 text-sm text-ink-muted">This ticket does not exist or you do not have permission to view it.</p>
          <div className="mt-6">
            <Link to="/wallet" className="rounded-btn bg-brand-600 px-4 py-2 text-xs font-semibold text-white">
              Back to My Wallet
            </Link>
          </div>
        </div>
        <PublicFooter />
      </div>
    );
  }

  const { ticket, event, venue, reg, org, checkIn, phone, orderRef } = ticketData;

  const fullDate = event
    ? new Date(event.start_date || event.starts_at).toLocaleString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Dhaka",
      })
    : "TBA";

  const timeRange = event
    ? `${new Date(event.start_date || event.starts_at).toLocaleTimeString("en-GB", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "Asia/Dhaka",
      })} – ${new Date(event.end_date || event.ends_at).toLocaleTimeString("en-GB", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "Asia/Dhaka",
      })}`
    : "TBA";

  const isUsed = !!checkIn || ticket.status === "USED";
  const isValid = ticket.status === "VALID" && !isUsed;

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      <PublicNavbar />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 flex-1 w-full space-y-6">
        <div className="flex items-center justify-between">
          <Link
            to="/wallet"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink transition"
          >
            <ArrowLeft className="size-3.5" /> Back to My Ticket Wallet
          </Link>
          <TicketPrintActions
            ticketId={ticket.id}
            eventTitle={event?.title || "Aayojon Event"}
            startsAt={event?.starts_at || ""}
            endsAt={event?.ends_at || ""}
            location={venue?.name || "Dhaka, Bangladesh"}
          />
        </div>

        {/* TICKET CARD PASS */}
        <div className="rounded-3xl border border-line bg-surface overflow-hidden shadow-card">
          <div className="bg-gradient-to-r from-purple-800 to-indigo-900 p-6 sm:p-8 text-white relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-md px-3 py-0.5 text-xs font-semibold text-white mb-2">
                  <Ticket className="size-3.5" />
                  <span>Aayojon Official Admission Pass</span>
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{event?.title}</h1>
                <p className="mt-1 text-xs text-purple-200">{org?.name}</p>
              </div>

              <div className="shrink-0 text-right">
                {isValid ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 px-3 py-1 text-xs font-bold text-emerald-300">
                    <CheckCircle2 className="size-3.5" /> VALID PASS
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-400/40 px-3 py-1 text-xs font-bold text-amber-300">
                    ALREADY USED
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* QR CODE CONTAINER */}
            <div className="md:col-span-5 flex flex-col items-center justify-center p-6 bg-canvas-alt rounded-2xl border border-line/80 text-center">
              <div className="p-3 bg-white rounded-xl shadow-xs border border-line">
                <QrMatrixSvg tokenHash={ticket.token_hash || ticket.id} size={180} />
              </div>
              <p className="mt-3 text-xs font-mono text-ink font-bold tracking-wider">{ticket.id}</p>
              <p className="text-[11px] text-ink-muted mt-0.5">Present this QR at the entrance gate</p>
            </div>

            {/* DETAILS */}
            <div className="md:col-span-7 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 border-b border-line pb-4">
                <div>
                  <div className="text-ink-muted font-medium">Attendee</div>
                  <div className="text-sm font-bold text-ink mt-0.5">{reg?.attendee_name || "Rafiqul Islam"}</div>
                  <div className="text-ink-muted font-mono">{reg?.attendee_email || "attendee@aayojon.bd"}</div>
                </div>
                <div>
                  <div className="text-ink-muted font-medium">Ticket Type</div>
                  <div className="text-sm font-bold text-ink mt-0.5">{ticket.ticket_type_name || "General Admission"}</div>
                  <div className="text-ink-muted font-mono">{orderRef}</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <CalendarDays className="size-4 text-brand-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-ink">{fullDate}</div>
                    <div className="text-ink-muted">{timeRange} (Bangladesh Standard Time)</div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <MapPin className="size-4 text-brand-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-ink">{venue?.name || "Online / TBA"}</div>
                    <div className="text-ink-muted">{venue?.address || "Dhaka, Bangladesh"}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
