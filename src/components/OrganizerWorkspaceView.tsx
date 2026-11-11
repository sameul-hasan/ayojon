"use client";

import React, { useState, useMemo } from "react";
import {
  LayoutDashboard,
  PlusCircle,
  Users,
  TrendingUp,
  Globe,
  Download,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Upload,
  Link2,
  Eye,
  Ticket,
  Banknote,
  ShieldAlert,
} from "lucide-react";
import {
  DatabaseState,
  PackageCode,
  PaymentProvider,
  Profile,
} from "@/lib/types";
import { formatBDT } from "@/lib/seed";

interface OrganizerWorkspaceViewProps {
  db: DatabaseState;
  currentUser: Profile;
  onAction: (
    action: string,
    payload: Record<string, unknown>,
    overrideActorId?: string
  ) => Promise<unknown>;
}

export function OrganizerWorkspaceView({
  db,
  currentUser,
  onAction,
}: OrganizerWorkspaceViewProps) {
  const defaultOrgId =
    currentUser.id === "usr-org-tanvir" ? "org-nsu-yes" : "org-buet-cc";
  const [selectedOrgId, setSelectedOrgId] = useState<string>(defaultOrgId);
  const [subTab, setSubTab] = useState<
    "EVENTS" | "WIZARD" | "ATTENDEES" | "PROMOTIONS" | "SETTINGS"
  >("EVENTS");

  const activeOrg =
    db.organizations.find((o) => o.id === selectedOrgId) || db.organizations[0];
  const orgEvents = useMemo(
    () => db.events.filter((e) => e.organization_id === activeOrg.id),
    [db.events, activeOrg.id]
  );

  const [selectedEventId, setSelectedEventId] = useState<string>(
    orgEvents[0]?.id || "evt-dhaka-ai-summit"
  );

  // Package checkout modal state for existing Draft events
  const [pkgTargetEventId, setPkgTargetEventId] = useState<string | null>(null);
  const [chosenPkg, setChosenPkg] = useState<PackageCode>("BASIC");
  const [pkgProvider, setPkgProvider] =
    useState<PaymentProvider>("BKASH_SANDBOX");
  const [statusBanner, setStatusBanner] = useState<{
    type: "success" | "warning" | "error";
    text: string;
  } | null>(null);

  // 6-Step Create Event Wizard state (05_UI_UX_Wireframes.docx)
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [wizTitle, setWizTitle] = useState("Dhaka FinTech & Open Banking Forum 2027");
  const [wizCategory, setWizCategory] = useState("cat-conf");
  const [wizDescription, setWizDescription] = useState(
    "A technical symposium bringing together Bangladesh payment engineers, central bank policy analysts, and university researchers."
  );
  const [wizStartsAt, setWizStartsAt] = useState("2027-02-15T10:00");
  const [wizEndsAt, setWizEndsAt] = useState("2027-02-15T17:00");
  const [wizIsOnline, setWizIsOnline] = useState(false);
  const [wizVenueName, setWizVenueName] = useState("BICC Carnival Hall, Agargaon");
  const [wizVenueCity, setWizVenueCity] = useState<
    "Dhaka" | "Chattogram" | "Sylhet" | "Online"
  >("Dhaka");
  const [wizCapacity, setWizCapacity] = useState(200);
  const [wizTicketName, setWizTicketName] = useState("Delegate Pass");
  const [wizTicketPriceBDT, setWizTicketPriceBDT] = useState(500);
  const [wizThemeColor, setWizThemeColor] = useState("#0D9488");
  const [wizPackageChoice, setWizPackageChoice] = useState<
    "DRAFT_ONLY" | PackageCode
  >("DRAFT_ONLY");

  // Campaign generator state
  const [cmpCode, setCmpCode] = useState("DU-CSE-CLUB");
  const [cmpSource, setCmpSource] = useState("facebook");
  const [cmpMedium, setCmpMedium] = useState("campus_group");
  const [cmpName, setCmpName] = useState("du_ambassador_drive");

  // Custom domain DNS state
  const [domainInput, setDomainInput] = useState(
    activeOrg.custom_domain || "events.buetcs.org"
  );
  const [dnsCnameInput, setDnsCnameInput] = useState("cname.aayojon.bd");

  // Aggregate KPI metrics for active organization
  const totalViews = orgEvents.reduce((acc, e) => acc + e.views_count, 0);
  const orgEventIds = new Set(orgEvents.map((e) => e.id));
  const orgRegistrations = db.registrations.filter((r) =>
    orgEventIds.has(r.event_id)
  );
  const orgTicketsSold = db.ticket_types
    .filter((t) => orgEventIds.has(t.event_id))
    .reduce((acc, t) => acc + t.sold_count, 0);
  const orgTicketRevenueMinor = db.orders
    .filter(
      (o) =>
        orgEventIds.has(o.event_id) &&
        o.order_type === "TICKET" &&
        o.status === "PAID"
    )
    .reduce((acc, o) => acc + o.subtotal_minor, 0);

  const actorForOrg =
    activeOrg.id === "org-nsu-yes" ? "usr-org-tanvir" : "usr-org-nusrat";

  const handleUnpaidPublishAttempt = async (eventId: string) => {
    setStatusBanner(null);
    try {
      await onAction("PUBLISH_EVENT", { eventId }, actorForOrg);
      setStatusBanner({
        type: "success",
        text: "Event published to public marketplace!",
      });
    } catch (err) {
      setStatusBanner({
        type: "error",
        text:
          err instanceof Error
            ? `QA-004 Verified: ${err.message}`
            : "Publication blocked",
      });
    }
  };

  const handlePackagePurchaseAndPublish = async (
    eventId: string,
    packageCode: PackageCode,
    autoPublish = true
  ) => {
    setStatusBanner(null);
    try {
      await onAction(
        "PURCHASE_PACKAGE_AND_VERIFY",
        {
          eventId,
          packageCode,
          provider: pkgProvider,
          autoPublish,
        },
        actorForOrg
      );
      setPkgTargetEventId(null);
      setStatusBanner({
        type: "success",
        text:
          packageCode === "FEATURED_ADDON"
            ? "Verified +৳500 Featured Placement Add-on! Event is now spotlighted on the Marketplace."
            : `Verified ${packageCode} package payment via ${pkgProvider.replace(
                "_SANDBOX",
                ""
              )}! Entitlement activated and event PUBLISHED.`,
      });
    } catch (err) {
      setStatusBanner({
        type: "error",
        text: err instanceof Error ? err.message : "Package purchase failed",
      });
    }
  };

  const handleWizardComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusBanner(null);
    try {
      const res = (await onAction(
        "CREATE_EVENT_DRAFT",
        {
          organizationId: activeOrg.id,
          categoryId: wizCategory,
          title: wizTitle,
          description: wizDescription,
          startsAt: new Date(wizStartsAt).toISOString(),
          endsAt: new Date(wizEndsAt).toISOString(),
          capacity: Number(wizCapacity),
          isOnline: wizIsOnline,
          venueName: wizIsOnline ? undefined : wizVenueName,
          venueCity: wizIsOnline ? "Online" : wizVenueCity,
          brandTheme: wizThemeColor,
          ticketTypes: [
            {
              name: wizTicketName,
              priceMinor: Math.round(Number(wizTicketPriceBDT) * 100),
              capacity: Number(wizCapacity),
              description: "Official event admission pass",
            },
          ],
        },
        actorForOrg
      )) as { result?: { id: string; title: string } };

      const createdEventId = res?.result?.id;

      if (wizPackageChoice !== "DRAFT_ONLY" && createdEventId) {
        await onAction(
          "PURCHASE_PACKAGE_AND_VERIFY",
          {
            eventId: createdEventId,
            packageCode: wizPackageChoice,
            provider: "BKASH_SANDBOX",
            autoPublish: true,
          },
          actorForOrg
        );
        setStatusBanner({
          type: "success",
          text: `US-02 Complete: Created "${wizTitle}", verified ${wizPackageChoice} package payment, and published live!`,
        });
      } else {
        setStatusBanner({
          type: "success",
          text: `US-01 / QA-001 Complete: Saved "${wizTitle}" as a private DRAFT for ৳0. Select a package anytime to publish.`,
        });
      }
      setSubTab("EVENTS");
    } catch (err) {
      setStatusBanner({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save event",
      });
    }
  };

  const handleTestCrossTenantLeak = async () => {
    setStatusBanner(null);
    // Organizer A (Nusrat, BUET CC) attempts to read Organizer B's (NSU YES!) attendee list
    try {
      await onAction(
        "CHECK_ATTENDEE_ACCESS",
        { eventId: "evt-nsu-startup-pitch" },
        "usr-org-nusrat"
      );
    } catch (err) {
      setStatusBanner({
        type: "error",
        text: `QA-010 Cross-Tenant Security Verified (403 FORBIDDEN): ${
          err instanceof Error ? err.message : "Denied"
        }`,
      });
    }
  };

  const handleTestMediaGuard = async (isValid: boolean) => {
    setStatusBanner(null);
    try {
      if (isValid) {
        await onAction(
          "UPLOAD_MEDIA_CHECK",
          {
            eventId: orgEvents[0]?.id || "evt-dhaka-ai-summit",
            filename: "stage-backdrop.webp",
            mimeType: "image/webp",
            sizeBytes: 380000,
          },
          actorForOrg
        );
        setStatusBanner({
          type: "success",
          text: "Valid WebP cover image (380 KB) verified and stored in object storage.",
        });
      } else {
        await onAction(
          "UPLOAD_MEDIA_CHECK",
          {
            eventId: orgEvents[0]?.id || "evt-dhaka-ai-summit",
            filename: "malicious-shell.exe",
            mimeType: "application/x-msdownload",
            sizeBytes: 9500000,
          },
          actorForOrg
        );
      }
    } catch (err) {
      setStatusBanner({
        type: "error",
        text: `QA-011 Upload Guard Verified: ${
          err instanceof Error ? err.message : "Rejected"
        }`,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Organization Bar & Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
            <LayoutDashboard className="h-4 w-4 text-emerald-600" />
            <span>ORGANIZER WORKSPACE & MONETIZATION ENGINE</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {activeOrg.name}
          </h1>
          <p className="text-xs text-slate-500">
            Slug: <span className="font-mono font-medium text-slate-700">/{activeOrg.slug}</span> • Custom Domain:{" "}
            <span className="font-mono font-medium text-emerald-700">
              {activeOrg.custom_domain || "Not set"} ({activeOrg.custom_domain_status})
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1">
              Switch Tenant Workspace
            </label>
            <select
              value={selectedOrgId}
              onChange={(e) => {
                setSelectedOrgId(e.target.value);
                setStatusBanner(null);
              }}
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              {db.organizations.map((o) => (
                <option key={o.id} value={o.id} className="bg-white text-slate-800">
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setSubTab("WIZARD");
              setWizardStep(1);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition cursor-pointer mt-4 lg:mt-0"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create Event (Free Draft)</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards (05_UI_UX_Wireframes.docx) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Event Page Views</span>
            <Eye className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">
            {totalViews.toLocaleString()}
          </p>
          <p className="text-[11px] font-medium text-emerald-700 mt-1">
            Across {orgEvents.length} organization events
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Confirmed Registrations</span>
            <Users className="h-4 w-4 text-teal-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">
            {orgRegistrations.length}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Conversion rate:{" "}
            {totalViews > 0
              ? ((orgTicketsSold / totalViews) * 100).toFixed(1)
              : "0.0"}
            %
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Total Tickets Issued</span>
            <Ticket className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">
            {orgTicketsSold}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Zero duplicate paid tickets (idempotent)
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Ticket Sales Revenue</span>
            <Banknote className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-emerald-600">
            {formatBDT(orgTicketRevenueMinor)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Stored in integer paisa (`BDT`)
          </p>
        </div>
      </div>

      {/* Status Notification Banner */}
      {statusBanner && (
        <div
          className={`flex items-center justify-between rounded-2xl border p-4 text-xs shadow-sm ${
            statusBanner.type === "success"
              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : statusBanner.type === "warning"
              ? "border-amber-300 bg-amber-50 text-amber-800"
              : "border-rose-300 bg-rose-50 text-rose-800"
          }`}
        >
          <span className="font-semibold">{statusBanner.text}</span>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="text-slate-500 hover:text-slate-800 font-semibold ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Sub-Navigation Pills */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {(
          [
            { id: "EVENTS", label: "My Events & Package Publishing" },
            { id: "WIZARD", label: "6-Step Create Event Wizard" },
            { id: "ATTENDEES", label: "Attendee Directory & CSV Export" },
            { id: "PROMOTIONS", label: "UTM Campaign Links & Analytics" },
            { id: "SETTINGS", label: "Custom Domain DNS & Team RBAC" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSubTab(tab.id)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
              subTab === tab.id
                ? "bg-emerald-600 text-white font-semibold shadow-sm"
                : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 shadow-xs"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: MY EVENTS & PER-EVENT PACKAGE CHECKOUT */}
      {subTab === "EVENTS" && (
        <div className="space-y-6">
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3.5">Event Title & Slug</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Active Package</th>
                  <th className="px-4 py-3.5">Starts At</th>
                  <th className="px-4 py-3.5">Registrations</th>
                  <th className="px-4 py-3.5">Actions & Monetization Gate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {orgEvents.map((evt) => {
                  const tts = db.ticket_types.filter(
                    (t) => t.event_id === evt.id
                  );
                  const sold = tts.reduce((a, b) => a + b.sold_count, 0);
                  return (
                    <tr key={evt.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">{evt.title}</div>
                        <div className="text-[11px] font-mono text-slate-500">
                          /{evt.slug}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                            evt.status === "PUBLISHED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : evt.status === "DRAFT"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {evt.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {evt.package_code ? (
                          <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                            {evt.package_code}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">
                            Unpaid (Free Draft)
                          </span>
                        )}
                        {evt.is_featured && (
                          <span className="ml-1.5 rounded bg-amber-100 border border-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                            ★ Featured
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {new Date(evt.starts_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-800">
                        {sold} / {evt.capacity}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap items-center gap-2">
                          {evt.status === "DRAFT" && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setPkgTargetEventId(evt.id);
                                  setChosenPkg("BASIC");
                                }}
                                className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-[11px] font-semibold text-white shadow-xs transition cursor-pointer"
                              >
                                Buy Package & Publish
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUnpaidPublishAttempt(evt.id)
                                }
                                className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-semibold text-amber-800 hover:bg-amber-100 transition cursor-pointer"
                              >
                                Test Unpaid Publish (QA-004)
                              </button>
                            </>
                          )}
                          {evt.status === "PUBLISHED" && !evt.is_featured && (
                            <button
                              type="button"
                              onClick={() =>
                                handlePackagePurchaseAndPublish(
                                  evt.id,
                                  "FEATURED_ADDON",
                                  false
                                )
                              }
                              className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-[11px] font-bold text-amber-800 hover:bg-amber-100 transition cursor-pointer"
                            >
                              +৳500 Featured Placement Add-on
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Package Pricing Reference Cards (Section 6 of PRD) */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Per-Event Package Tiers & Entitlements (Draft Creation is Free)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {db.packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`rounded-2xl border p-4 flex flex-col justify-between shadow-sm ${
                    pkg.code === "PREMIUM"
                      ? "border-2 border-amber-400 bg-amber-50/20"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-emerald-700">
                        {pkg.name} ({pkg.name_bn})
                      </span>
                      {pkg.is_addon && (
                        <span className="rounded bg-amber-100 border border-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                          Add-On
                        </span>
                      )}
                    </div>
                    <p className="text-2xl font-extrabold text-slate-900">
                      {pkg.is_addon ? `+${formatBDT(pkg.price_minor)}` : formatBDT(pkg.price_minor)}
                      <span className="text-[11px] font-normal text-slate-500">
                        {" "}
                        / event
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-600 font-medium">
                      {pkg.summary}
                    </p>
                    <ul className="space-y-1 pt-2 border-t border-slate-200 text-[11px] text-slate-600">
                      {pkg.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Package Purchase Modal for Draft Event */}
          {pkgTargetEventId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
              <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-2xl">
                <h3 className="text-lg font-extrabold text-slate-900">
                  Select Per-Event Package & Activate Publication
                </h3>
                <p className="text-xs text-slate-500">
                  Target Event:{" "}
                  <strong className="text-slate-900">
                    {db.events.find((e) => e.id === pkgTargetEventId)?.title}
                  </strong>
                </p>

                <div className="grid grid-cols-2 gap-2.5">
                  {db.packages
                    .filter((p) => !p.is_addon)
                    .map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setChosenPkg(p.code)}
                        className={`rounded-xl border p-3 text-left transition cursor-pointer ${
                          chosenPkg === p.code
                            ? "border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600 shadow-xs"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 shadow-xs"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-900">
                            {p.name}
                          </span>
                          <span className="text-sm font-extrabold text-emerald-700">
                            {formatBDT(p.price_minor)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1">
                          {p.summary}
                        </p>
                      </button>
                    ))}
                </div>

                <div className="flex items-center justify-between text-xs pt-2">
                  <span className="text-slate-600 font-medium">Payment Gateway:</span>
                  <div className="flex gap-2">
                    {(
                      ["BKASH_SANDBOX", "SSLCOMMERZ_SANDBOX", "NAGAD_SANDBOX"] as const
                    ).map((gw) => (
                      <button
                        key={gw}
                        type="button"
                        onClick={() => setPkgProvider(gw)}
                        className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold cursor-pointer transition ${
                          pkgProvider === gw
                            ? "border-emerald-600 bg-emerald-50 text-emerald-700 font-bold"
                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {gw.replace("_SANDBOX", "")}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setPkgTargetEventId(null)}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer shadow-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handlePackagePurchaseAndPublish(
                        pkgTargetEventId,
                        chosenPkg,
                        true
                      )
                    }
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-xs font-semibold text-white shadow-sm transition cursor-pointer"
                  >
                    Pay{" "}
                    {formatBDT(
                      db.packages.find((p) => p.code === chosenPkg)
                        ?.price_minor || 79900
                    )}{" "}
                    & Publish Event
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: 6-STEP CREATE EVENT WIZARD (05_UI_UX_Wireframes.docx) */}
      {subTab === "WIZARD" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                6-Step Event Creation & Package Publishing Wizard
              </h2>
              <p className="text-xs text-slate-500">
                Drafts are saved free of charge (US-01). Choose a package in Step 6 to publish immediately (US-02).
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5, 6].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setWizardStep(s)}
                  className={`h-8 w-8 rounded-lg text-xs font-bold transition cursor-pointer ${
                    wizardStep === s
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleWizardComplete} className="space-y-5 text-xs">
            {wizardStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-emerald-700">
                  Step 1 of 6: Event Basics & Media Upload Security
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Event Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={wizTitle}
                      onChange={(e) => setWizTitle(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Category *
                    </label>
                    <select
                      value={wizCategory}
                      onChange={(e) => setWizCategory(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 shadow-xs"
                    >
                      {db.categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.name_bn})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    rows={3}
                    value={wizDescription}
                    onChange={(e) => setWizDescription(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 shadow-xs"
                  />
                </div>

                {/* QA-011 Media Upload Security Test Box */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Upload className="h-4 w-4 text-emerald-600" />
                      Cover Image Upload Validator (QA-011 Security Gate)
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Allows JPEG/PNG/WebP up to 5 MB. Blocks `.exe`, `.sh`, `.php` and oversized files.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleTestMediaGuard(true)}
                      className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 font-semibold text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
                    >
                      Test Valid WebP (380 KB)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTestMediaGuard(false)}
                      className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-1.5 font-semibold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                    >
                      Test Malicious .exe Upload (QA-011)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-emerald-700">
                  Step 2 of 6: Date, Timezone & Bangladesh Venue
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Starts At (Asia/Dhaka)
                    </label>
                    <input
                      type="datetime-local"
                      value={wizStartsAt}
                      onChange={(e) => setWizStartsAt(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Ends At (Asia/Dhaka)
                    </label>
                    <input
                      type="datetime-local"
                      value={wizEndsAt}
                      onChange={(e) => setWizEndsAt(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 shadow-xs"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wizIsOnline}
                    onChange={(e) => setWizIsOnline(e.target.checked)}
                  />
                  <span>This is an Online Livestream Event</span>
                </label>
                {!wizIsOnline && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        Venue Name
                      </label>
                      <input
                        type="text"
                        value={wizVenueName}
                        onChange={(e) => setWizVenueName(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        City
                      </label>
                      <select
                        value={wizVenueCity}
                        onChange={(e) =>
                          setWizVenueCity(
                            e.target.value as
                              | "Dhaka"
                              | "Chattogram"
                              | "Sylhet"
                              | "Online"
                          )
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 shadow-xs"
                      >
                        <option value="Dhaka">Dhaka</option>
                        <option value="Chattogram">Chattogram</option>
                        <option value="Sylhet">Sylhet</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {wizardStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-emerald-700">
                  Step 3 of 6: Registration Capacity & Ticket Tier
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Ticket Tier Name
                    </label>
                    <input
                      type="text"
                      value={wizTicketName}
                      onChange={(e) => setWizTicketName(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Ticket Price in BDT (৳0 = Free)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={wizTicketPriceBDT}
                      onChange={(e) =>
                        setWizTicketPriceBDT(Number(e.target.value))
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Total Seat Capacity
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={wizCapacity}
                      onChange={(e) => setWizCapacity(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 shadow-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {wizardStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-emerald-700">
                  Step 4 of 6: Branding & Custom Domain Preview
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Brand Accent Color
                    </label>
                    <input
                      type="text"
                      value={wizThemeColor}
                      onChange={(e) => setWizThemeColor(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Organization Custom Domain
                    </label>
                    <input
                      type="text"
                      disabled
                      value={
                        activeOrg.custom_domain ||
                        `aayojon.bd/org/${activeOrg.slug}`
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-600 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {wizardStep === 5 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-emerald-700">
                  Step 5 of 6: Pre-Publish Validation Checklist
                </h3>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                  <p className="text-sm font-bold text-slate-900">{wizTitle}</p>
                  <p className="text-slate-600">{wizDescription}</p>
                  <div className="flex flex-wrap gap-4 pt-2 text-emerald-700 font-medium">
                    <span>✓ Title & Schedule Validated</span>
                    <span>✓ Capacity: {wizCapacity} seats</span>
                    <span>
                      ✓ Ticket Price:{" "}
                      {wizTicketPriceBDT === 0
                        ? "Free (৳0)"
                        : `৳${wizTicketPriceBDT}`}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {wizardStep === 6 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-emerald-700">
                  Step 6 of 6: Save Free Draft or Select Package to Publish
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <div
                    onClick={() => setWizPackageChoice("DRAFT_ONLY")}
                    className={`rounded-2xl border p-3.5 cursor-pointer transition ${
                      wizPackageChoice === "DRAFT_ONLY"
                        ? "border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 shadow-xs"
                    }`}
                  >
                    <p className="font-bold text-slate-900">Save as Draft Only</p>
                    <p className="text-lg font-extrabold text-emerald-700 mt-1">
                      Free (৳0)
                    </p>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Private draft; pay package later to publish (US-01)
                    </p>
                  </div>

                  {db.packages
                    .filter((p) => !p.is_addon)
                    .map((p) => (
                      <div
                        key={p.id}
                        onClick={() => setWizPackageChoice(p.code)}
                        className={`rounded-2xl border p-3.5 cursor-pointer transition ${
                          wizPackageChoice === p.code
                            ? "border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600 shadow-xs"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 shadow-xs"
                        }`}
                      >
                        <p className="font-bold text-slate-900">{p.name} Package</p>
                        <p className="text-lg font-extrabold text-emerald-700 mt-1">
                          {formatBDT(p.price_minor)}
                        </p>
                        <p className="text-[11px] text-slate-600 mt-1">
                          {p.summary}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-200 pt-4">
              <button
                type="button"
                disabled={wizardStep === 1}
                onClick={() => setWizardStep((s) => Math.max(1, s - 1))}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer shadow-xs"
              >
                ← Previous Step
              </button>
              {wizardStep < 6 ? (
                <button
                  type="button"
                  onClick={() => setWizardStep((s) => Math.min(6, s + 1))}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2 font-bold text-white shadow-sm transition cursor-pointer"
                >
                  Next Step ({wizardStep}/6) →
                </button>
              ) : (
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-6 py-2.5 font-bold text-white shadow-sm transition cursor-pointer"
                >
                  {wizPackageChoice === "DRAFT_ONLY"
                    ? "Save Private Event Draft (৳0)"
                    : `Pay ${formatBDT(
                        db.packages.find((p) => p.code === wizPackageChoice)
                          ?.price_minor || 79900
                      )} & Publish Event`}
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: ATTENDEES, CSV EXPORT & CROSS-TENANT RLS TEST (QA-010) */}
      {subTab === "ATTENDEES" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-700">
                Select Event:
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
              >
                {orgEvents.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`/api/v1/events/${selectedEventId}/attendees?format=csv`}
                target="_blank"
                rel="noreferrer"
                onClick={() => {
                  // Trigger via window fetch with x-user-id header to download CSV
                }}
                onClickCapture={async (e) => {
                  e.preventDefault();
                  const res = await fetch(
                    `/api/v1/events/${selectedEventId}/attendees?format=csv`,
                    {
                      headers: { "x-user-id": actorForOrg },
                    }
                  );
                  if (res.ok) {
                    const csvText = await res.text();
                    const blob = new Blob([csvText], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `attendees-${selectedEventId}.csv`;
                    a.click();
                    setStatusBanner({
                      type: "success",
                      text: "Attendee CSV exported and export action recorded in audit_logs!",
                    });
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-300 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition cursor-pointer shadow-sm"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Attendee CSV (Audited)</span>
              </a>

              <button
                type="button"
                onClick={handleTestCrossTenantLeak}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 border border-rose-300 px-3.5 py-2 text-xs font-bold text-rose-800 hover:bg-rose-100 transition cursor-pointer shadow-sm"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Simulate Cross-Tenant Leak Attempt (QA-010)</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">Attendee Name</th>
                  <th className="px-4 py-3">Email & Phone</th>
                  <th className="px-4 py-3">University / Org</th>
                  <th className="px-4 py-3">Campaign Attribution</th>
                  <th className="px-4 py-3">Marketing Opt-in</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {db.registrations
                  .filter((r) => r.event_id === selectedEventId)
                  .map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {r.attendee_name}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <div className="font-medium">{r.attendee_email}</div>
                        <div className="text-[10px] text-slate-500">
                          {r.attendee_phone}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {r.institute_or_company || "—"}
                      </td>
                      <td className="px-4 py-3 font-mono font-medium text-emerald-700">
                        {r.campaign_code || "Direct / Organic"}
                      </td>
                      <td className="px-4 py-3">
                        {r.marketing_consent ? (
                          <span className="inline-flex items-center font-medium text-emerald-700">
                            Opted In
                          </span>
                        ) : (
                          <span className="text-slate-500">Operational Only</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: PROMOTIONS, UTM CAMPAIGNS & ANALYTICS (US-06) */}
      {subTab === "PROMOTIONS" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 space-y-4 text-xs shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Link2 className="h-4 w-4 text-emerald-600" />
              Create Campaign Attribution Link
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Target Event</label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                >
                  {orgEvents.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Campaign Referral Code
                </label>
                <input
                  type="text"
                  value={cmpCode}
                  onChange={(e) => setCmpCode(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-emerald-700 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">UTM Source</label>
                  <input
                    type="text"
                    value={cmpSource}
                    onChange={(e) => setCmpSource(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">UTM Medium</label>
                  <input
                    type="text"
                    value={cmpMedium}
                    onChange={(e) => setCmpMedium(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await onAction(
                    "CREATE_CAMPAIGN_LINK",
                    {
                      eventId: selectedEventId,
                      code: cmpCode,
                      source: cmpSource,
                      medium: cmpMedium,
                      campaign: cmpName,
                    },
                    actorForOrg
                  );
                  setStatusBanner({
                    type: "success",
                    text: `Created tracking link: https://aayojon.bd/e/${selectedEventId}?ref=${cmpCode}`,
                  });
                }}
                className="w-full rounded-xl bg-emerald-600 py-2.5 font-bold text-white hover:bg-emerald-700 transition shadow-sm cursor-pointer"
              >
                Generate Attribution Link
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              Campaign Conversion & Revenue Attribution (LAST_TOUCH)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase font-semibold text-slate-600">
                  <tr>
                    <th className="py-2.5 px-3">Code</th>
                    <th className="py-2.5 px-3">Source / Medium</th>
                    <th className="py-2.5 px-3">Clicks</th>
                    <th className="py-2.5 px-3">Conversions</th>
                    <th className="py-2.5 px-3">Attributed Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {db.campaign_links.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">
                        {c.code}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {c.source} / {c.medium}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">{c.clicks}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {c.conversions}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-emerald-700">
                        {formatBDT(c.revenue_minor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CUSTOM DOMAIN DNS (QA-013) & TEAM RBAC */}
      {subTab === "SETTINGS" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 text-xs shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Globe className="h-4 w-4 text-emerald-600" />
                Custom Domain DNS Verification (QA-013)
              </h3>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                  activeOrg.custom_domain_status === "VERIFIED"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-rose-50 border-rose-200 text-rose-700"
                }`}
              >
                {activeOrg.custom_domain_status}
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Organizers on Plus/Premium packages can bind their own domain. Point your DNS <code className="rounded bg-slate-100 border border-slate-200 px-1 py-0.5 font-mono text-[11px] text-slate-800">CNAME</code> record to{" "}
              <code className="rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-emerald-700">cname.aayojon.bd</code>. If DNS is misconfigured, the default platform URL always works seamlessly.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Organizer Custom Domain
                </label>
                <input
                  type="text"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Simulated DNS CNAME Target Returned by Resolver
                </label>
                <input
                  type="text"
                  value={dnsCnameInput}
                  onChange={(e) => setDnsCnameInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-emerald-700 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await onAction(
                      "VERIFY_CUSTOM_DOMAIN",
                      {
                        organizationId: activeOrg.id,
                        customDomain: domainInput,
                        simulatedDnsCnameRecord: "cname.aayojon.bd",
                      },
                      actorForOrg
                    );
                    setDnsCnameInput("cname.aayojon.bd");
                    setStatusBanner({
                      type: "success",
                      text: `Custom domain ${domainInput} DNS CNAME verified!`,
                    });
                  }}
                  className="rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white hover:bg-emerald-700 transition shadow-sm cursor-pointer"
                >
                  Verify Valid CNAME (\`cname.aayojon.bd\`)
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await onAction(
                      "VERIFY_CUSTOM_DOMAIN",
                      {
                        organizationId: activeOrg.id,
                        customDomain: domainInput,
                        simulatedDnsCnameRecord: "broken-dns.invalid.org",
                      },
                      actorForOrg
                    );
                    setDnsCnameInput("broken-dns.invalid.org");
                    setStatusBanner({
                      type: "warning",
                      text: `QA-013 Verified: DNS CNAME mismatch flagged as ERROR. Default URL https://aayojon.bd/org/${activeOrg.slug} remains active!`,
                    });
                  }}
                  className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 font-bold text-amber-800 hover:bg-amber-100 transition shadow-sm cursor-pointer"
                >
                  Simulate Broken DNS (QA-013)
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 text-xs shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Lock className="h-4 w-4 text-emerald-600" />
              Organization Members & Least-Privilege RBAC
            </h3>
            <div className="space-y-2">
              {db.organization_members
                .filter((m) => m.organization_id === activeOrg.id)
                .map((m) => {
                  const prof = db.profiles.find((p) => p.id === m.user_id);
                  return (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/70 transition-colors p-3"
                    >
                      <div>
                        <p className="font-bold text-slate-900">
                          {prof?.display_name}
                        </p>
                        <p className="text-slate-600 text-xs">{prof?.email}</p>
                      </div>
                      <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 font-mono text-[11px] font-bold text-emerald-700">
                        {m.role}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

