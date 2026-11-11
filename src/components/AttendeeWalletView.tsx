"use client";

import React from "react";
import {
  Ticket,
  CheckCircle2,
  Clock,
  QrCode,
  ShieldCheck,
  Calendar,
  MapPin,
  ExternalLink,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { DatabaseState, Profile } from "@/lib/types";
import { formatBDT } from "@/lib/seed";
import { QrMatrixSvg } from "./QrMatrixSvg";

interface AttendeeWalletViewProps {
  db: DatabaseState;
  currentUser: Profile;
  onSendToScanner: (qrToken: string, eventId: string) => void;
  onVerifyPendingOrder: (orderId: string) => Promise<void>;
}

export function AttendeeWalletView({
  db,
  currentUser,
  onSendToScanner,
  onVerifyPendingOrder,
}: AttendeeWalletViewProps) {
  const myTickets = db.tickets.filter(
    (t) =>
      t.attendee_email.toLowerCase() === currentUser.email.toLowerCase() ||
      db.registrations.some(
        (r) => r.id === t.registration_id && r.user_id === currentUser.id
      )
  );

  const myOrders = db.orders.filter(
    (o) =>
      o.buyer_user_id === currentUser.id ||
      o.attendee_email.toLowerCase() === currentUser.email.toLowerCase()
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-600">
            <Ticket className="h-4 w-4" />
            <span>ATTENDEE DIGITAL WALLET & ORDERS</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {currentUser.display_name}&apos;s QR Passes & Receipts
          </h1>
          <p className="text-xs text-slate-500">
            {currentUser.email} • {currentUser.organization_label} • Tickets are cryptographically hashed (SHA-256) in PostgreSQL (`tickets.token_hash`).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-center shadow-xs">
            <p className="text-xl font-extrabold text-emerald-600">
              {myTickets.filter((t) => t.status === "VALID").length}
            </p>
            <p className="text-[11px] font-medium text-slate-500">Active Passes</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-center shadow-xs">
            <p className="text-xl font-extrabold text-amber-600">
              {myTickets.filter((t) => t.status === "USED").length}
            </p>
            <p className="text-[11px] font-medium text-slate-500">Checked In</p>
          </div>
        </div>
      </div>

      {/* QR Tickets Grid */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <QrCode className="h-5 w-5 text-emerald-600" />
          Issued Event QR Tickets ({myTickets.length})
        </h2>

        {myTickets.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-600 shadow-sm">
            No tickets found for {currentUser.display_name}. Register for an event in the Marketplace!
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {myTickets.map((tkt) => {
              const evt = db.events.find((e) => e.id === tkt.event_id);
              const venue = db.venues.find((v) => v.id === evt?.venue_id);
              const checkIn = db.check_ins.find((c) => c.ticket_id === tkt.id);

              return (
                <div
                  key={tkt.id}
                  className="flex flex-col sm:flex-row justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition"
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                          tkt.status === "VALID"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : tkt.status === "USED"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {tkt.status === "VALID" ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : tkt.status === "USED" ? (
                          <Clock className="h-3 w-3" />
                        ) : (
                          <AlertCircle className="h-3 w-3" />
                        )}
                        {tkt.status === "VALID"
                          ? "VALID FOR ENTRY"
                          : tkt.status === "USED"
                          ? "CHECKED IN (USED)"
                          : "CANCELLED"}
                      </span>
                      <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                        {tkt.ticket_type_name}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        {evt?.title || "Event"}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        {evt && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                            {new Date(evt.starts_at).toLocaleDateString(
                              "en-GB",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-amber-600" />
                          {evt?.is_online
                            ? "Online Livestream"
                            : `${venue?.name || "Dhaka"}`}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1.5 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Attendee:</span>
                        <span className="font-semibold text-slate-800">
                          {tkt.attendee_name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">QR Credential:</span>
                        <span className="font-mono font-bold text-emerald-700">
                          {tkt.qr_token}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">SHA-256 DB Hash:</span>
                        <span className="font-mono text-slate-600">
                          {tkt.token_hash.slice(0, 16)}...
                        </span>
                      </div>
                      {checkIn && (
                        <div className="flex justify-between font-medium text-amber-800 pt-1.5 border-t border-slate-200">
                          <span>Scanned by {checkIn.staff_name}:</span>
                          <span>
                            {new Date(checkIn.checked_in_at).toLocaleTimeString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onSendToScanner(tkt.qr_token, tkt.event_id)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-300 px-3.5 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 hover:border-emerald-400 transition cursor-pointer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Test Scan at Gate Check-In Scanner (QA-009)</span>
                    </button>
                  </div>

                  {/* Visual QR Code Column */}
                  <div className="flex flex-col items-center justify-center shrink-0 border-t sm:border-t-0 sm:border-l border-dashed border-slate-200 pt-4 sm:pt-0 sm:pl-5">
                    <QrMatrixSvg tokenHash={tkt.token_hash} size={132} />
                    <span className="mt-2 text-[10px] font-mono text-slate-500">
                      ID: {tkt.id}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Orders & Payment Verification Table */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          Order & Payment Verification History ({myOrders.length})
        </h2>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-4 py-3">Order ID & Key</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Subtotal / Fee / Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Webhook Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-500">
                    No order history found for {currentUser.display_name}.
                  </td>
                </tr>
              ) : (
                myOrders.map((ord) => {
                  const evt = db.events.find((e) => e.id === ord.event_id);
                  const pay = db.payments.find((p) => p.order_id === ord.id);
                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono">
                        <div className="font-semibold text-slate-900">{ord.id}</div>
                        <div className="text-[10px] text-slate-500">
                          Idem: {ord.idempotency_key}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {evt?.title || ord.event_id}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                          {ord.order_type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-slate-700 font-medium">
                          {formatBDT(ord.subtotal_minor)}
                        </span>
                        {ord.fee_minor > 0 && (
                          <span className="text-slate-500">
                            {" "}
                            + {formatBDT(ord.fee_minor)} fee
                          </span>
                        )}
                        <div className="font-bold text-emerald-700">
                          = {formatBDT(ord.total_minor)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                            ord.status === "PAID"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : ord.status === "PENDING"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {ord.status}
                        </span>
                        {pay && (
                          <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                            Ref: {pay.provider_reference}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {ord.status === "PENDING" ? (
                          <button
                            type="button"
                            onClick={() => onVerifyPendingOrder(ord.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium px-2.5 py-1.5 text-[11px] transition shadow-xs cursor-pointer"
                          >
                            <RefreshCw className="h-3 w-3" />
                            Verify Server Webhook (Issue Ticket)
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                            ✓ Verified via Signed Webhook
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
