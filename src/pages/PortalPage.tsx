import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Link from "@/components/ui/Link";
import {
  Compass,
  Ticket,
  LayoutDashboard,
  QrCode,
  Handshake,
  ShieldAlert,
  UserCheck,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  LogOut,
  Building,
} from "lucide-react";
import type { DatabaseState } from "@/lib/types";
import { createInitialSeed } from "@/lib/seed";
import { MarketplaceView } from "@/components/MarketplaceView";
import { AttendeeWalletView } from "@/components/AttendeeWalletView";
import { OrganizerWorkspaceView } from "@/components/OrganizerWorkspaceView";
import { CheckInScannerView } from "@/components/CheckInScannerView";
import { SponsorMarketplaceView } from "@/components/SponsorMarketplaceView";
import { AdminConsoleView } from "@/components/AdminConsoleView";
import { ProviderWorkspaceView } from "@/components/provider/ProviderWorkspaceView";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { Logo } from "@/components/layout/Logo";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export type ActivePortal =
  | "MARKETPLACE"
  | "WALLET"
  | "ORGANIZER"
  | "SCANNER"
  | "SPONSOR"
  | "PROVIDER"
  | "ADMIN";

const PORTALS: Array<{
  id: ActivePortal;
  label: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}> = [
  {
    id: "MARKETPLACE",
    label: "Explore Portal",
    badge: "Public / Attendee",
    icon: Compass,
    description: "Browse events, view listings, and purchase tickets",
  },
  {
    id: "WALLET",
    label: "Attendee Wallet",
    badge: "Attendee Pass",
    icon: Ticket,
    description: "Access high-entropy QR tickets, passes, and order receipts",
  },
  {
    id: "ORGANIZER",
    label: "Organizer Studio",
    badge: "Event Creator",
    icon: LayoutDashboard,
    description: "Create events, manage monetization packages, and export attendee lists",
  },
  {
    id: "PROVIDER",
    label: "Provider Studio",
    badge: "Venues & Vendors",
    icon: Building,
    description: "Manage venue spaces, service listings, quotation requests, and bookings",
  },
  {
    id: "SCANNER",
    label: "Gate Check-In",
    badge: "Event Staff",
    icon: QrCode,
    description: "Cryptographic ticket verification terminal for venue check-ins",
  },
  {
    id: "SPONSOR",
    label: "Brand Marketplace",
    badge: "Corporate Sponsor",
    icon: Handshake,
    description: "Discover sponsorship opportunities and submit package proposals",
  },
  {
    id: "ADMIN",
    label: "Trust & Governance",
    badge: "Superadmin",
    icon: ShieldAlert,
    description: "Platform event moderation, audit trails, and notification diagnostics",
  },
];

export function PortalPage() {
  const [searchParams] = useSearchParams();
  const [db, setDb] = useState<DatabaseState>(() => createInitialSeed());
  const [activePortal, setActivePortal] = useState<ActivePortal>(() => {
    const t = searchParams.get("tab")?.toUpperCase();
    if (t === "ORGANIZER") return "ORGANIZER";
    if (t === "SCANNER") return "SCANNER";
    if (t === "SPONSOR") return "SPONSOR";
    if (t === "PROVIDER") return "PROVIDER";
    if (t === "ADMIN") return "ADMIN";
    return "WALLET";
  });
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

  useEffect(() => {
    const t = searchParams.get("tab")?.toUpperCase();
    if (t && ["WALLET", "ORGANIZER", "SCANNER", "SPONSOR", "PROVIDER", "ADMIN"].includes(t)) {
      setActivePortal(t as ActivePortal);
    }
  }, [searchParams]);

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
    if (prof.platform_role === "ATTENDEE") setActivePortal("WALLET");
    else if (prof.platform_role === "ORGANIZER_OWNER") setActivePortal("ORGANIZER");
    else if (prof.platform_role === "CHECKIN_STAFF") setActivePortal("SCANNER");
    else if (prof.platform_role === "SPONSOR") setActivePortal("SPONSOR");
    else if (prof.platform_role === "VENUE_OWNER" || prof.platform_role === "VENDOR") setActivePortal("PROVIDER");
    else if (prof.platform_role === "ADMIN") setActivePortal("ADMIN");
  };

  const activePortalMeta = PORTALS.find((p) => p.id === activePortal) || PORTALS[0];
  const ActiveIcon = activePortalMeta.icon;

  return (
    <div className="min-h-screen flex flex-col bg-canvas-alt text-ink">
      {/* TOP HEADER */}
      <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3 py-3">
            {/* Left: Brand + Hub Title */}
            <div className="flex items-center gap-3">
              <Logo />
              <div className="h-5 w-px bg-line hidden sm:block" />
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs font-bold text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-full">
                  Unified Workspaces
                </span>
              </div>
            </div>

            {/* Middle / Right: Active Persona Switcher + Public Site Backlink */}
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-brand-600 transition"
              >
                <ArrowLeft className="size-3.5" />
                <span>Public Marketplace</span>
              </Link>

              <div className="h-4 w-px bg-line hidden md:block" />

              {/* Persona Switcher */}
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-ink leading-tight">
                    {currentUser.display_name}
                  </span>
                  <span className="text-[10px] text-ink-muted">
                    {currentUser.platform_role.replace("_", " ")}
                  </span>
                </div>
                <select
                  value={activeUserId}
                  onChange={(e) => handlePersonaSwitch(e.target.value)}
                  aria-label="Active Persona Role"
                  className="rounded-btn border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink shadow-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600 cursor-pointer"
                >
                  {db.profiles.map((p) => (
                    <option key={p.id} value={p.id} className="bg-surface text-ink">
                      {p.display_name} ({p.platform_role.replace("_", " ")})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* HORIZONTAL PORTAL TABS */}
        <div className="border-t border-line/60 bg-surface/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <nav aria-label="Portal Navigation" className="flex overflow-x-auto gap-1 py-2 scrollbar-none">
              {PORTALS.map((portal) => {
                const Icon = portal.icon;
                const isActive = activePortal === portal.id;
                return (
                  <button
                    key={portal.id}
                    type="button"
                    onClick={() => setActivePortal(portal.id)}
                    aria-current={isActive ? "page" : undefined}
                    className={`inline-flex shrink-0 items-center gap-2 px-3.5 py-2 rounded-btn text-xs font-semibold transition cursor-pointer ${
                      isActive
                        ? "bg-brand-600 text-white shadow-sm"
                        : "text-ink-muted hover:text-ink hover:bg-canvas-alt"
                    }`}
                  >
                    <Icon className={`size-3.5 ${isActive ? "text-white" : "text-ink-muted"}`} />
                    <span>{portal.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* SUB-HEADER CONTEXT BAR */}
      <div className="border-b border-line bg-surface/60 py-3 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-brand-50 text-brand-600">
              <ActiveIcon className="size-3.5" />
            </span>
            <span className="font-bold text-ink">{activePortalMeta.label}</span>
            <span className="text-ink-muted hidden sm:inline">•</span>
            <span className="text-ink-muted hidden sm:inline">{activePortalMeta.description}</span>
          </div>

          <div className="flex items-center gap-2">
            <Badge tone="brand" className="text-[10px]">
              {activePortalMeta.badge}
            </Badge>
            <span className="font-mono text-[10px] text-ink-muted">
              Actor ID: {currentUser.id}
            </span>
          </div>
        </div>
      </div>

      {/* MAIN VIEWPORT */}
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
          <PermissionGuard roles={["organizer", "admin"]} showAccessDenied>
            <OrganizerWorkspaceView
              db={db}
              currentUser={currentUser}
              onAction={dispatchAction}
            />
          </PermissionGuard>
        )}

        {activePortal === "SCANNER" && (
          <PermissionGuard roles={["staff", "organizer", "admin"]} showAccessDenied>
            <CheckInScannerView
              db={db}
              initialToken={scannerPrefillToken}
              initialEventId={scannerPrefillEventId}
              onAction={dispatchAction}
            />
          </PermissionGuard>
        )}

        {activePortal === "SPONSOR" && (
          <PermissionGuard roles={["sponsor", "admin"]} showAccessDenied>
            <SponsorMarketplaceView
              db={db}
              currentUser={currentUser}
              onAction={dispatchAction}
            />
          </PermissionGuard>
        )}

        {activePortal === "PROVIDER" && (
          <PermissionGuard roles={["venue_owner", "vendor", "admin"]} showAccessDenied>
            <ProviderWorkspaceView />
          </PermissionGuard>
        )}

        {activePortal === "ADMIN" && (
          <PermissionGuard roles={["admin"]} showAccessDenied>
            <AdminConsoleView db={db} onAction={dispatchAction} />
          </PermissionGuard>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-line bg-surface py-6 px-4 sm:px-6 lg:px-8 mt-12 text-ink-muted">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-brand-600" />
            <span>
              <strong className="text-ink font-semibold">Aayojon (আয়োজন)</strong> — Unified Platform Portal
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <Link href="/" className="hover:text-brand-600 transition">
              Public Homepage
            </Link>
            <span>•</span>
            <Link href="/events" className="hover:text-brand-600 transition">
              Explore Events
            </Link>
            <span>•</span>
            <Link href="/design" className="hover:text-brand-600 transition">
              Design System
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
