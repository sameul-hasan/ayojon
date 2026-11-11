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
  Camera,
  ScanLine,
} from "lucide-react";
import type { CheckInScanResult, DatabaseState, TicketRecord } from "@/lib/types";
import { QrMatrixSvg } from "@/components/QrMatrixSvg";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Card, StatCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export interface CheckInScannerProps {
  db: DatabaseState;
  initialToken?: string;
  initialEventId?: string;
  onAction: (
    action: string,
    payload: Record<string, unknown>,
    overrideActorId?: string
  ) => Promise<unknown>;
}

export function CheckInScanner({
  db,
  initialToken,
  initialEventId,
  onAction,
}: CheckInScannerProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>(
    initialEventId || "ALL"
  );
  const [qrInput, setQrInput] = useState<string>(
    initialToken || "AAYOJON-TKT-2026-BUET-9F4A2C8E1B"
  );
  const [isScanning, setIsScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<{
    result: CheckInScanResult;
    message: string;
    ticket?: TicketRecord;
    checkedInAt?: string;
    previousCheckIn?: { checkedInAt: string; staffName: string };
  } | null>(null);

  useEffect(() => {
    if (initialToken) setQrInput(initialToken);
    if (initialEventId) setSelectedEventId(initialEventId);
  }, [initialToken, initialEventId]);

  const handleScan = async (tokenToScan?: string) => {
    const token = (tokenToScan ?? qrInput).trim();
    if (!token) return;
    setQrInput(token);
    setIsScanning(true);

    try {
      const res = (await onAction(
        "SCAN_TICKET_QR",
        {
          qrToken: token,
          eventId: selectedEventId === "ALL" ? undefined : selectedEventId,
        },
        "usr-staff-tanvir"
      )) as {
        result: {
          result: CheckInScanResult;
          message: string;
          ticket?: TicketRecord;
          checkedInAt?: string;
          previousCheckIn?: { checkedInAt: string; staffName: string };
        };
      };
      setLastScanResult(res.result);
    } finally {
      setIsScanning(false);
    }
  };

  const totalCheckIns = db.check_ins.length;
  const targetEvent = db.events.find((e) => e.id === selectedEventId);
  const eventCheckIns = targetEvent
    ? db.check_ins.filter((c) => c.event_id === targetEvent.id).length
    : totalCheckIns;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="rounded-card border border-line bg-surface p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
              <QrCode className="size-3.5" />
              <span>STAFF CHECK-IN & GATE SCANNER TERMINAL</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-ink mt-1">
              Cryptographic QR Gate Validator
            </h1>
            <p className="text-xs text-ink-muted">
              Authenticates offline/online attendee QR tokens using HMAC SHA-256 verification and prevents double check-ins.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge tone="brand" className="px-3 py-1 text-xs">
              Staff: Tanvir (Gate 1)
            </Badge>
          </div>
        </div>
      </div>

      {/* METRIC OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Gate Check-Ins"
          value={eventCheckIns}
          icon={<UserCheck className="size-5 text-brand-600" />}
          hint={targetEvent ? `For ${targetEvent.title}` : "Across all active events"}
        />
        <StatCard
          label="Total Issued Database Passes"
          value={db.tickets.length}
          icon={<QrCode className="size-5 text-brand-600" />}
          hint={`${db.tickets.filter((t) => t.status === "VALID").length} valid / ${db.tickets.filter((t) => t.status === "USED").length} used`}
        />
        <StatCard
          label="Security Protocol"
          value="SHA-256"
          icon={<ShieldCheck className="size-5 text-success" />}
          hint="Anti-counterfeiting token hash active"
        />
      </div>

      {/* MAIN SCANNER INTERFACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Scanner Terminal */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="text-base font-bold text-ink flex items-center gap-2">
                <ScanLine className="size-4 text-brand-600" />
                <span>Gate Scan Input</span>
              </h2>
              <Button
                variant={cameraActive ? "primary" : "outline"}
                size="sm"
                leftIcon={<Camera className="size-3.5" />}
                onClick={() => setCameraActive(!cameraActive)}
              >
                {cameraActive ? "Close Camera" : "Open Camera Scanner"}
              </Button>
            </div>

            {cameraActive && (
              <div className="rounded-card border border-brand-200 bg-brand-50/50 p-6 text-center space-y-3">
                <div className="mx-auto size-48 rounded-btn border-2 border-dashed border-brand-600 flex items-center justify-center bg-surface shadow-inner">
                  <Camera className="size-10 text-brand-600 animate-pulse" />
                </div>
                <p className="text-xs text-ink-muted">
                  Point camera at the attendee&apos;s physical pass or phone screen. Automatic QR reader simulation active.
                </p>
              </div>
            )}

            <div>
              <Select
                label="Target Event Filter"
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
              >
                <option value="ALL">Any Event (Universal Gate Scanner)</option>
                {db.events.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.title} ({evt.status})
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Input
                label="Scan Token or Raw Hash"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                placeholder="Enter raw AAYOJON-TKT token or paste camera stream..."
              />
            </div>

            <Button
              loading={isScanning}
              onClick={() => handleScan()}
              className="w-full text-xs font-bold"
              leftIcon={<Search className="size-3.5" />}
            >
              Verify Ticket & Check In
            </Button>
          </Card>

          {/* SCAN RESULT BANNER */}
          {lastScanResult && (
            <Card
              className={`p-6 shadow-card border-2 transition-all ${
                lastScanResult.result === "VALID"
                  ? "border-green-400 bg-green-50/60"
                  : lastScanResult.result === "ALREADY_USED"
                  ? "border-amber-400 bg-amber-50/60"
                  : "border-red-400 bg-red-50/60"
              }`}
            >
              <div className="flex items-start gap-3">
                {lastScanResult.result === "VALID" && (
                  <CheckCircle2 className="size-8 text-success shrink-0" />
                )}
                {lastScanResult.result === "ALREADY_USED" && (
                  <AlertTriangle className="size-8 text-warning shrink-0" />
                )}
                {lastScanResult.result === "INVALID" && (
                  <XCircle className="size-8 text-danger shrink-0" />
                )}
                <div className="space-y-1">
                  <Badge
                    tone={
                      lastScanResult.result === "VALID"
                        ? "success"
                        : lastScanResult.result === "ALREADY_USED"
                        ? "warning"
                        : "danger"
                    }
                    className="text-xs uppercase font-extrabold"
                  >
                    STATUS: {lastScanResult.result}
                  </Badge>
                  <h3 className="text-base font-bold text-ink">
                    {lastScanResult.message}
                  </h3>
                  {lastScanResult.ticket && (
                    <div className="pt-2 text-xs text-ink space-y-1">
                      <p>
                        Attendee: <strong>{lastScanResult.ticket.attendee_name}</strong> (
                        {lastScanResult.ticket.attendee_email})
                      </p>
                      <p>
                        Pass Type: <span className="font-semibold text-brand-700">{lastScanResult.ticket.ticket_type_name}</span>
                      </p>
                      <p className="font-mono text-[11px] text-ink-muted">
                        Token Hash: {lastScanResult.ticket.token_hash.slice(0, 24)}...
                      </p>
                    </div>
                  )}
                  {lastScanResult.previousCheckIn && (
                    <p className="text-xs text-amber-800 font-semibold pt-1">
                      Originally Checked In:{" "}
                      {new Date(lastScanResult.previousCheckIn.checkedInAt).toLocaleTimeString("en-GB")} by{" "}
                      {lastScanResult.previousCheckIn.staffName}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Quick Test Tokens & Check-In History */}
        <div className="lg:col-span-5 space-y-6">
          {/* Preset Test Passes */}
          <Card className="p-4 shadow-card space-y-3">
            <h3 className="text-sm font-bold text-ink border-b border-line pb-2">
              Preset Ticket Passes for Rapid Field Testing
            </h3>
            <div className="space-y-2">
              {db.tickets.slice(0, 4).map((tkt) => {
                const evt = db.events.find((e) => e.id === tkt.event_id);
                return (
                  <div
                    key={tkt.id}
                    onClick={() => handleScan(tkt.qr_token)}
                    className="rounded-btn border border-line bg-canvas-alt p-2.5 text-xs hover:border-brand-600 transition cursor-pointer flex items-center justify-between"
                  >
                    <div className="truncate pr-2">
                      <span className="font-bold text-ink">{tkt.attendee_name}</span>
                      <p className="text-[11px] text-ink-muted truncate">{evt?.title}</p>
                    </div>
                    <Badge
                      tone={
                        tkt.status === "VALID"
                          ? "success"
                          : tkt.status === "USED"
                          ? "warning"
                          : "danger"
                      }
                      className="text-[10px]"
                    >
                      {tkt.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Live Check-In Audit Log */}
          <Card className="p-4 shadow-card space-y-3">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <h3 className="text-sm font-bold text-ink flex items-center gap-1.5">
                <History className="size-4 text-brand-600" />
                <span>Recent Gate Check-Ins ({db.check_ins.length})</span>
              </h3>
            </div>

            {db.check_ins.length === 0 ? (
              <p className="text-xs text-ink-muted text-center py-4">No check-ins logged yet today.</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {db.check_ins.map((chk) => {
                  const tkt = db.tickets.find((t) => t.id === chk.ticket_id);
                  const evt = db.events.find((e) => e.id === chk.event_id);
                  return (
                    <div
                      key={chk.id}
                      className="rounded-btn border border-line bg-canvas-alt p-2.5 text-xs space-y-0.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-ink">
                          {tkt?.attendee_name || "Verified Attendee"}
                        </span>
                        <span className="text-[10px] text-ink-muted font-mono">
                          {new Date(chk.checked_in_at).toLocaleTimeString("en-GB")}
                        </span>
                      </div>
                      <p className="text-[11px] text-ink-muted truncate">{evt?.title}</p>
                      <p className="text-[10px] text-brand-700 font-semibold">
                        Staff: {chk.staff_name}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

