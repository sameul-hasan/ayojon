"use client";

import React, { useState } from "react";
import Link from "@/components/ui/Link";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  MapPin,
  QrCode,
  ScanLine,
  ShieldCheck,
  Ticket as TicketIcon,
} from "lucide-react";
import type { DatabaseState, TicketRecord } from "@/lib/types";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { QrMatrixSvg } from "@/components/QrMatrixSvg";
import { coverGradient } from "@/components/marketplace/categoryStyle";

function ticketTone(status: TicketRecord["status"]): BadgeTone {
  switch (status) {
    case "VALID":
      return "success";
    case "USED":
      return "info";
    case "CANCELLED":
      return "danger";
    case "TRANSFERRED":
      return "neutral";
    default:
      return "neutral";
  }
}

export function TicketCard({
  ticket,
  db,
  onOpenQr,
  onSendToScanner,
}: {
  ticket: TicketRecord;
  db: DatabaseState;
  onOpenQr: (t: TicketRecord) => void;
  onSendToScanner?: (qrToken: string, eventId: string) => void;
}) {
  const event = db.events.find((e) => e.id === ticket.event_id);
  const venue = db.venues.find((v) => v.id === event?.venue_id);
  const checkIn = db.check_ins.find((c) => c.ticket_id === ticket.id);
  const isOnline = event?.is_online;
  const location = isOnline ? "Online event" : [venue?.name, venue?.city].filter(Boolean).join(", ");
  const dateStr = event
    ? new Date(event.starts_at).toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Dhaka",
      })
    : "";

  return (
    <Card className="overflow-hidden">
      <div className={`h-2.5 bg-gradient-to-r ${coverGradient(event?.category_id ?? "")}`} />
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={ticketTone(ticket.status)}>
              {ticket.status === "VALID" ? <CheckCircle2 className="size-3" /> : <Clock className="size-3" />}
              {ticket.status}
            </Badge>
            <span className="text-xs font-semibold text-brand-700">{ticket.ticket_type_name}</span>
            <span className="font-mono text-xs text-ink-muted">#{ticket.id.slice(0, 12)}</span>
          </div>

          <h3 className="text-lg font-bold leading-snug">
            {event ? (
              <Link href={`/events/${event.slug}`} className="hover:text-brand-600">
                {event.title}
              </Link>
            ) : (
              ticket.ticket_type_name
            )}
          </h3>

          <div className="space-y-1 text-xs text-ink-muted">
            {dateStr && (
              <p className="flex items-center gap-1.5">
                <CalendarDays className="size-3.5 shrink-0" aria-hidden />
                {dateStr}
              </p>
            )}
            {location && (
              <p className="flex items-center gap-1.5">
                <MapPin className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">{location}</span>
              </p>
            )}
            <p className="pt-1 text-ink">
              Attendee: <strong className="font-medium">{ticket.attendee_name}</strong> ({ticket.attendee_email})
            </p>
          </div>

          {checkIn && (
            <div className="rounded-btn border border-line bg-canvas-alt p-2.5 text-xs text-ink-muted">
              Checked in: {new Date(checkIn.checked_in_at).toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })} · Staff: {checkIn.staff_name}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-center gap-2 border-t border-line pt-3 sm:border-t-0 sm:pt-0">
          <button
            type="button"
            onClick={() => onOpenQr(ticket)}
            className="group cursor-pointer rounded-card border border-line bg-surface p-2 shadow-xs transition hover:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600"
            aria-label={`Open QR code for ${ticket.ticket_type_name}`}
          >
            <QrMatrixSvg tokenHash={ticket.token_hash} size={110} />
            <span className="mt-1 block text-center text-[11px] font-semibold text-brand-700 group-hover:underline">
              Tap to expand
            </span>
          </button>
          <div className="flex flex-col items-center gap-1.5 w-full">
            <Link
              href={`/tickets/${ticket.id}`}
              className="inline-flex w-full items-center justify-center gap-1 rounded-btn border border-line bg-surface py-1.5 px-3 text-xs font-semibold text-ink shadow-2xs transition hover:border-brand-300 hover:text-brand-700"
            >
              <TicketIcon className="size-3.5 text-brand-600" />
              <span>Full Pass</span>
            </Link>

            {onSendToScanner && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-ink-muted hover:text-ink"
                leftIcon={<ScanLine className="size-3.5" />}
                onClick={() => onSendToScanner(ticket.qr_token, ticket.event_id)}
              >
                Test scan
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function TicketQrModal({
  ticket,
  db,
  open,
  onClose,
}: {
  ticket: TicketRecord | null;
  db: DatabaseState;
  open: boolean;
  onClose: () => void;
}) {
  const [showToken, setShowToken] = useState(false);
  if (!ticket) return null;
  const event = db.events.find((e) => e.id === ticket.event_id);

  return (
    <Modal open={open} onClose={onClose} title="Entry pass">
      <div className="space-y-4 text-center">
        <div className="flex justify-center pb-1">
          <img src="/logo.png" alt="Aayojon" className="h-7 w-auto object-contain" />
        </div>
        <div>
          <Badge tone={ticketTone(ticket.status)}>{ticket.status}</Badge>
          <h3 className="mt-2 text-lg font-bold">{event?.title ?? "Event Ticket"}</h3>
          <p className="text-xs text-ink-muted">
            {ticket.ticket_type_name} · {ticket.attendee_name}
          </p>
        </div>

        <div className="flex justify-center py-2">
          <div className="rounded-modal border border-line bg-surface p-3 shadow-pop">
            <QrMatrixSvg tokenHash={ticket.token_hash} size={220} />
          </div>
        </div>

        <p className="text-xs text-ink-muted">
          Present this at the venue gate for check-in. The staff scanner verifies the SHA-256 hash.
        </p>

        <div className="flex items-center justify-center gap-2 pt-1">
          <Link
            href={`/tickets/${ticket.id}`}
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-btn bg-brand-600 px-5 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            <TicketIcon className="size-4" />
            <span>Open Dedicated Pass / Print</span>
          </Link>
        </div>

        <div className="rounded-btn border border-line bg-canvas-alt p-3 text-left">
          <button
            type="button"
            onClick={() => setShowToken((v) => !v)}
            className="flex w-full items-center justify-between text-xs font-semibold text-ink-muted hover:text-ink"
          >
            <span>Developer details</span>
            <ChevronDown className={`size-3.5 transition-transform ${showToken ? "rotate-180" : ""}`} />
          </button>
          {showToken && (
            <div className="mt-2 space-y-1 font-mono text-[11px] text-ink-muted">
              <p className="break-all">Hash: {ticket.token_hash}</p>
              <p className="break-all">Token: {ticket.qr_token}</p>
              <p className="pt-1 text-[10px] text-warning">
                Keep the token private. Anyone with it can claim this entry pass.
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
