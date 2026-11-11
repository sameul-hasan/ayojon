"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Compass,
  Ticket,
  LayoutDashboard,
  QrCode,
  Handshake,
  ShieldAlert,
  UserCheck,
  Sparkles,
} from "lucide-react";
import { DatabaseState } from "@/lib/types";
import { createInitialSeed } from "@/lib/seed";
import { MarketplaceView } from "@/components/MarketplaceView";
import { AttendeeWalletView } from "@/components/AttendeeWalletView";
import { OrganizerWorkspaceView } from "@/components/OrganizerWorkspaceView";
import { CheckInScannerView } from "@/components/CheckInScannerView";
import { SponsorMarketplaceView } from "@/components/SponsorMarketplaceView";
import { AdminConsoleView } from "@/components/AdminConsoleView";

type ActivePortal =
  | "MARKETPLACE"
  | "WALLET"
  | "ORGANIZER"
  | "SCANNER"
  | "SPONSOR"
  | "ADMIN";

export default function AayojonPlatformPage() {
  const [db, setDb] = useState<DatabaseState>(() => createInitialSeed());
  const [activePortal, setActivePortal] = useState<ActivePortal>("MARKETPLACE");
  const [activeUserId, setActiveUserId] = useState<string>("usr-attendee-rafiq");
  const [scannerPrefillToken, setScannerPrefillToken] = useState<string>("");
  const [scannerPrefillEventId, setScannerPrefillEventId] = useState<string>("");

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/state", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setDb(json.data);
        }
      }
    } catch {
      // Fallback to local seed state if offline
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const currentUser =
    db.profiles.find((p) => p.id === activeUserId) || db.profiles[0];

  const dispatchAction = async (
    action: string,
    payload: Record<string, unknown>,
    overrideActorId?: string
  ) => {
    const res = await fetch("/api/v1/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        actorUserId: overrideActorId || activeUserId,
        payload,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.error?.message || "Operation failed");
    }
    if (json.data) {
      setDb(json.data);
    }
    return json;
  };

  const handlePersonaSwitch = (userId: string) => {
    setActiveUserId(userId);
    const prof = db.profiles.find((p) => p.id === userId);
    if (!prof) return;
    if (prof.platform_role === "ATTENDEE") setActivePortal("MARKETPLACE");
    else if (prof.platform_role === "ORGANIZER_OWNER")
      setActivePortal("ORGANIZER");
    else if (prof.platform_role === "CHECKIN_STAFF") setActivePortal("SCANNER");
    else if (prof.platform_role === "SPONSOR") setActivePortal("SPONSOR");
    else if (prof.platform_role === "ADMIN") setActivePortal("ADMIN");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* TOP NAVIGATION HEADER */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3 py-3.5">
            {/* Brand Logo */}
            <div
              onClick={() => setActivePortal("MARKETPLACE")}
              className="flex items-center gap-3 cursor-pointer"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-black text-lg shadow-sm shadow-emerald-600/20">
                আ
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-900 font-black text-lg tracking-tight">
                    Aayojon
                  </span>
                  <span className="text-emerald-700 font-bold text-sm">
                    আয়োজন
                  </span>
                  <span className="hidden sm:inline-block rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-mono font-bold px-1.5 py-0.5">
                    v1.0 • BD
                  </span>
                </div>
                <p className="text-slate-500 text-[11px] hidden sm:block">
                  Event Discovery, Promotion, Registration & QR Ticketing
                </p>
              </div>
            </div>

            {/* Primary Portal Navigation */}
            <nav className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  {
                    id: "MARKETPLACE",
                    label: "Discover",
                    icon: Compass,
                  },
                  {
                    id: "WALLET",
                    label: "Ticket Wallet",
                    icon: Ticket,
                  },
                  {
                    id: "ORGANIZER",
                    label: "Organizer Hub",
                    icon: LayoutDashboard,
                  },
                  {
                    id: "SCANNER",
                    label: "QR Check-In",
                    icon: QrCode,
                  },
                  {
                    id: "SPONSOR",
                    label: "Sponsors",
                    icon: Handshake,
                  },
                  {
                    id: "ADMIN",
                    label: "Admin & QA",
                    icon: ShieldAlert,
                  },
                ] as const
              ).map((item) => {
                const Icon = item.icon;
                const active = activePortal === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActivePortal(item.id)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs transition cursor-pointer ${
                      active
                        ? "bg-emerald-600 text-white shadow-sm font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium"
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${active ? "text-white" : "text-slate-500"}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Persona / Role Switcher */}
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-emerald-600 hidden md:block" />
              <select
                value={activeUserId}
                onChange={(e) => handlePersonaSwitch(e.target.value)}
                aria-label="Active Persona"
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                {db.profiles.map((p) => (
                  <option key={p.id} value={p.id} className="bg-white text-slate-800">
                    {p.display_name} ({p.platform_role.replace("_", " ")})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN PORTAL VIEWPORT */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-6">
        {activePortal === "MARKETPLACE" && (
          <MarketplaceView
            db={db}
            currentUser={currentUser}
            onAction={dispatchAction}
            onNavigateWallet={() => setActivePortal("WALLET")}
            onNavigateOrganizer={() => setActivePortal("ORGANIZER")}
          />
        )}

        {activePortal === "WALLET" && (
          <AttendeeWalletView
            db={db}
            currentUser={currentUser}
            onSendToScanner={(token, eventId) => {
              setScannerPrefillToken(token);
              setScannerPrefillEventId(eventId);
              setActivePortal("SCANNER");
            }}
            onVerifyPendingOrder={async (orderId) => {
              await dispatchAction("VERIFY_PENDING_ORDER_WEBHOOK", { orderId });
            }}
          />
        )}

        {activePortal === "ORGANIZER" && (
          <OrganizerWorkspaceView
            db={db}
            currentUser={currentUser}
            onAction={dispatchAction}
          />
        )}

        {activePortal === "SCANNER" && (
          <CheckInScannerView
            db={db}
            initialToken={scannerPrefillToken}
            initialEventId={scannerPrefillEventId}
            onAction={dispatchAction}
          />
        )}

        {activePortal === "SPONSOR" && (
          <SponsorMarketplaceView
            db={db}
            currentUser={currentUser}
            onAction={dispatchAction}
          />
        )}

        {activePortal === "ADMIN" && (
          <AdminConsoleView db={db} onAction={dispatchAction} />
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-6 px-4 sm:px-6 lg:px-8 mt-12 text-slate-500">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <span>
              <strong className="text-slate-900 font-semibold">Aayojon (আয়োজন)</strong> • Built from Complete Documentation Pack v1.0 (01 PRD – 11 Roadmap)
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="inline-flex items-center rounded-md bg-slate-100 border border-slate-200/80 px-2 py-0.5 font-medium text-slate-600">
              Drafts: Free (৳0)
            </span>
            <span className="inline-flex items-center rounded-md bg-slate-100 border border-slate-200/80 px-2 py-0.5 font-medium text-slate-600">
              Basic: ৳799
            </span>
            <span className="inline-flex items-center rounded-md bg-slate-100 border border-slate-200/80 px-2 py-0.5 font-medium text-slate-600">
              Promoted: ৳1,499
            </span>
            <span className="inline-flex items-center rounded-md bg-slate-100 border border-slate-200/80 px-2 py-0.5 font-medium text-slate-600">
              Plus: ৳2,699
            </span>
            <span className="inline-flex items-center rounded-md bg-slate-100 border border-slate-200/80 px-2 py-0.5 font-medium text-slate-600">
              Premium: ৳4,999
            </span>
            <span className="inline-flex items-center rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 font-medium text-emerald-700">
              Featured Add-on: +৳500
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

