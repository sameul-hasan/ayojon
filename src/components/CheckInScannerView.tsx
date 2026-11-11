"use client";

import React, { useState, useEffect } from "react";
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  History,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { CheckInScanResult, DatabaseState, TicketRecord } from "@/lib/types";
import { QrMatrixSvg } from "./QrMatrixSvg";

interface CheckInScannerViewProps {
  db: DatabaseState;
  initialToken?: string;
  initialEventId?: string;
  onAction: (
    action: string,
    payload: Record<string, unknown>,
    overrideActorId?: string
  ) => Promise<unknown>;
}

export function CheckInScannerView({
  db,
  initialToken,
  initialEventId,
  onAction,
}: CheckInScannerViewProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>(
    initialEventId || "ALL"
  );
  const [qrInput, setQrInput] = useState<string>(
    initialToken || "AAYOJON-TKT-2026-BUET-9F4A2C8E1B"
  );
  const [lastScanResult, setLastScanResult] = useState<{
    result: CheckInScanResult;
    message: string;
    ticket?: TicketRecord;
    checkedInAt?: string;
    previousCheckIn?: { checkedInAt: string; staffName: string };
  } | null>(null);

  useEffect(() => {
    if (initialToken) {
      setQrInput(initialToken);
    }
    if (initialEventId) {
      setSelectedEventId(initialEventId);
    }
  }, [initialToken, initialEventId]);

  const handleScan = async (tokenToScan?: string) => {
    const token = (tokenToScan ?? qrInput).trim();
    if (!token) return;
    setQrInput(token);

    try {
      const res = (await onAction(
        "SCAN_TICKET_QR",
        {
          qrToken: token,
          eventId: selectedEventId === "ALL" ? undefined : selectedEventId,
        },
        "usr-staff-mehedi"
      )) as {
        result: {
          result: CheckInScanResult;
          message: string;
          ticket?: TicketRecord;
          checkedInAt?: string;
          previousCheckIn?: { checkedInAt: string; staffName: string };
        };
      };
      if (res?.result) {
        setLastScanResult(res.result);
      }
    } catch (err) {
      setLastScanResult({
        result: "INVALID",
        message: err instanceof Error ? err.message : "Scan failed",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700">
            <QrCode className="h-4 w-4 text-emerald-600" />
            <span>EVENT-DAY GATE CHECK-IN SCANNER (US-05 / QA-009)</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Staff QR Validation & One-Time Entry Terminal
          </h1>
          <p className="text-xs text-slate-600">
            Active Staff Operator: <strong className="text-slate-900 font-semibold">Mehedi Hasan</strong> (`CHECKIN_STAFF`) • Unique constraint on `check_ins(ticket_id)` guarantees one-time admission.
          </p>
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1">
            Filter Gate by Event
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          >
            <option value="ALL" className="bg-white text-slate-800">All Assigned Organization Events</option>
            {db.events
              .filter((e) => e.organization_id === "org-buet-cc")
              .map((e) => (
                <option key={e.id} value={e.id} className="bg-white text-slate-800">
                  {e.title}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Scanner Input & Live Result State Banner */}
        <div className="lg:col-span-7 space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Search className="h-4 w-4 text-emerald-600" />
              Scan QR Credential or Manual Lookup Fallback
            </h2>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                placeholder="Paste QR token (e.g., AAYOJON-TKT-2026-BUET-9F4A2C8E1B)..."
                className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs font-mono text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
              <button
                type="button"
                onClick={() => handleScan()}
                className="rounded-xl bg-emerald-600 px-6 py-3 text-xs font-bold text-white hover:bg-emerald-700 transition cursor-pointer shrink-0 shadow-sm"
              >
                Validate & Check In
              </button>
            </div>

            {/* Quick Preset Scan Buttons to demonstrate VALID, ALREADY_USED, INVALID */}
            <div className="space-y-2 pt-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                One-Click Gate Test Presets (Click twice to test QA-009 Repeat Scan Detection):
              </p>
              <div className="flex flex-wrap gap-2">
                {db.tickets.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleScan(t.qr_token)}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-mono transition cursor-pointer ${
                      t.status === "VALID"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                        : "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                    }`}
                  >
                    {t.qr_token.slice(0, 24)}... ({t.status})
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleScan("FORGED-FAKE-QR-99999")}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-mono text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                >
                  Test Forged Token (INVALID)
                </button>
              </div>
            </div>
          </div>

          {/* RESULT STATE BANNER (VALID / ALREADY USED / INVALID / CANCELLED) */}
          {lastScanResult && (
            <div
              className={`rounded-3xl border-2 p-6 shadow-md transition ${
                lastScanResult.result === "VALID"
                  ? "border-emerald-300 bg-emerald-50"
                  : lastScanResult.result === "ALREADY_USED"
                  ? "border-amber-300 bg-amber-50"
                  : "border-rose-300 bg-rose-50"
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2">
                    {lastScanResult.result === "VALID" && (
                      <CheckCircle2 className="h-7 w-7 text-emerald-700" />
                    )}
                    {lastScanResult.result === "ALREADY_USED" && (
                      <AlertTriangle className="h-7 w-7 text-amber-700" />
                    )}
                    {(lastScanResult.result === "INVALID" ||
                      lastScanResult.result === "CANCELLED") && (
                      <XCircle className="h-7 w-7 text-rose-700" />
                    )}
                    <span
                      className={`text-2xl font-black tracking-tight ${
                        lastScanResult.result === "VALID"
                          ? "text-emerald-950"
                          : lastScanResult.result === "ALREADY_USED"
                          ? "text-amber-950"
                          : "text-rose-950"
                      }`}
                    >
                      {lastScanResult.result === "VALID"
                        ? "VALID — ENTRY GRANTED"
                        : lastScanResult.result === "ALREADY_USED"
                        ? "ALREADY USED — DUPLICATE SCAN FLAGGED"
                        : lastScanResult.result}
                    </span>
                  </div>

                  <p className="text-sm text-slate-700 font-medium">
                    {lastScanResult.message}
                  </p>

                  {lastScanResult.ticket && (
                    <div className="grid grid-cols-2 gap-3 pt-3 text-xs">
                      <div className="rounded-xl bg-white p-3 border border-slate-200 shadow-sm">
                        <p className="text-slate-500 font-medium text-[11px]">Attendee Name</p>
                        <p className="font-bold text-slate-900 text-sm">
                          {lastScanResult.ticket.attendee_name}
                        </p>
                        <p className="text-slate-600 text-[11px]">
                          {lastScanResult.ticket.attendee_email}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white p-3 border border-slate-200 shadow-sm">
                        <p className="text-slate-500 font-medium text-[11px]">Ticket Tier</p>
                        <p className="font-bold text-emerald-700 text-sm">
                          {lastScanResult.ticket.ticket_type_name}
                        </p>
                        <p className="text-slate-600 text-[11px] font-mono">
                          ID: {lastScanResult.ticket.id}
                        </p>
                      </div>
                    </div>
                  )}

                  {lastScanResult.previousCheckIn && (
                    <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700 shadow-sm">
                      <strong className="text-slate-900 font-semibold">Previous Check-In Record:</strong> Scanned by{" "}
                      {lastScanResult.previousCheckIn.staffName} at{" "}
                      {new Date(
                        lastScanResult.previousCheckIn.checkedInAt
                      ).toLocaleString()}
                    </div>
                  )}
                </div>

                {lastScanResult.ticket && (
                  <div className="shrink-0 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
                    <QrMatrixSvg
                      tokenHash={lastScanResult.ticket.token_hash}
                      size={110}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right 5 Cols: Recent Gate Scans Log */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <History className="h-4 w-4 text-emerald-600" />
              Recent Gate Check-In Log ({db.check_ins.length})
            </h2>
            <UserCheck className="h-4 w-4 text-slate-500" />
          </div>

          <div className="space-y-3">
            {db.check_ins.map((chk) => {
              const tkt = db.tickets.find((t) => t.id === chk.ticket_id);
              const evt = db.events.find((e) => e.id === chk.event_id);
              return (
                <div
                  key={chk.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs space-y-1 hover:border-slate-300 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      {tkt?.attendee_name || "Attendee"}
                    </span>
                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      CHECKED IN
                    </span>
                  </div>
                  <p className="text-slate-700 font-medium">{evt?.title}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>Staff: {chk.staff_name}</span>
                    <span>
                      {new Date(chk.checked_in_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

