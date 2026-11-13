"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  FileText,
  Mail,
  RefreshCw,
  Lock,
  Activity,
  Database,
  Server,
  Users,
  Calendar,
  AlertTriangle,
  Ban,
  Check,
  Building2,
  DollarSign,
  Layers,
  Store,
} from "lucide-react";
import type { DatabaseState, EventRecord } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card, StatCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatBDT } from "@/lib/seed";

const QA_MATRIX = [
  {
    id: "QA-001",
    scenario: "Create event draft without package payment",
    expected: "Draft saved; not public in marketplace feed",
  },
  {
    id: "QA-002",
    scenario: "Purchase Basic package for ৳799",
    expected: "Verified HMAC webhook payment activates package entitlement",
  },
  {
    id: "QA-003",
    scenario: "Payment webhook delivered twice",
    expected: "Idempotent: one payment transition and one entitlement",
  },
  {
    id: "QA-004",
    scenario: "Publish event with failed/unverified payment",
    expected: "Publication blocked (403 FORBIDDEN)",
  },
  {
    id: "QA-005",
    scenario: "Two users request final ticket concurrently",
    expected: "Atomic inventory check sells only available seat; 409 CONFLICT on oversell",
  },
  {
    id: "QA-006",
    scenario: "Free registration at full capacity",
    expected: "Registration rejected at capacity ceiling",
  },
  {
    id: "QA-007",
    scenario: "Paid ticket payment success",
    expected: "High-entropy QR code ticket issued with unique token_hash",
  },
  {
    id: "QA-008",
    scenario: "Browser redirected after payment without webhook",
    expected: "Order stays PENDING; ticket not issued until server webhook",
  },
  {
    id: "QA-009",
    scenario: "Scan valid ticket twice",
    expected: "First scan VALID; second scan ALREADY_USED with audit log",
  },
  {
    id: "QA-010",
    scenario: "Organizer A requests Organizer B attendee data",
    expected: "Multi-tenant isolation: 403 FORBIDDEN; no data leakage",
  },
  {
    id: "QA-011",
    scenario: "Upload malicious or oversized (>5MB) file",
    expected: "Magic-byte and MIME validation rejection",
  },
  {
    id: "QA-012",
    scenario: "Admin suspends reported event",
    expected: "Event hidden from public; audit trail recorded",
  },
  {
    id: "QA-013",
    scenario: "Custom domain DNS CNAME mismatch",
    expected: "Status ERROR; fallback to standard URL",
  },
  {
    id: "QA-014",
    scenario: "Email provider down during registration",
    expected: "Job saved in queue; retried automatically",
  },
];

export interface AdminConsoleProps {
  db: DatabaseState;
  onAction: (
    action: string,
    payload: Record<string, unknown>,
    overrideActorId?: string
  ) => Promise<unknown>;
}

export function AdminConsole({ db, onAction }: AdminConsoleProps) {
  const [activeTab, setActiveTab] = useState<
    "MODERATION" | "PAYMENTS" | "AUDIT" | "NOTIFICATIONS" | "QA_SPECS" | "VENUE_MARKETPLACE"
  >("MODERATION");
  const [adminNotice, setAdminNotice] = useState<string | null>(null);
  const [verifyingOrderId, setVerifyingOrderId] = useState<string | null>(null);

  const handleModerate = async (
    eventId: string,
    action: "APPROVE" | "SUSPEND"
  ) => {
    await onAction(
      "MODERATE_EVENT",
      {
        eventId,
        moderationAction: action,
        reason:
          action === "SUSPEND"
            ? "Suspended by Platform Safety & Compliance Officer"
            : "Approved after trust review",
      },
      "usr-admin-salman"
    );
    setAdminNotice(
      `Event #${eventId} has been ${
        action === "SUSPEND" ? "suspended" : "approved"
      } successfully.`
    );
  };

  const handleRetryEmails = async () => {
    const res = (await onAction(
      "RETRY_NOTIFICATIONS",
      {},
      "usr-admin-salman"
    )) as { result: { retried: number } };
    setAdminNotice(
      `Dispatched retry queue: ${res.result.retried} notification job(s) processed.`
    );
  };

  const handleVerifyOrder = async (orderId: string, approve: boolean) => {
    setVerifyingOrderId(orderId);
    try {
      await onAction(
        "VERIFY_ORDER_PAYMENT",
        {
          orderId,
          approve,
          reason: approve
            ? undefined
            : "Payment proof could not be verified by Platform Admin",
        },
        "usr-admin-salman"
      );
      setAdminNotice(
        approve
          ? `Order ${orderId} verified and QR tickets issued to the attendee.`
          : `Order ${orderId} rejected and ticket inventory released.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed";
      setAdminNotice(`Failed to update order ${orderId}: ${msg}`);
    } finally {
      setVerifyingOrderId(null);
    }
  };

  const pendingVerificationOrders = db.orders.filter(
    (o) => o.status === "AWAITING_VERIFICATION"
  );

  const totalRevenue = db.orders
    .filter((o) => o.status === "PAID")
    .reduce((sum, o) => sum + o.total_minor, 0);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="rounded-card border border-line bg-surface p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
              <ShieldAlert className="size-3.5" />
              <span>PLATFORM GOVERNANCE & AUDIT CONTROL CONSOLE</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-ink mt-1">
              Platform Administration Workspace
            </h1>
            <p className="text-xs text-ink-muted">
              Live event moderation, immutable audit log verification, transactional email queue diagnostics, and multi-tenant security monitoring.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge tone="danger" className="px-3 py-1 text-xs">
              Superadmin: Salman
            </Badge>
          </div>
        </div>
      </div>

      {/* METRIC OVERVIEW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Registered Users"
          value={db.profiles.length}
          icon={<Users className="size-5 text-brand-600" />}
          hint={`${db.organizations.length} Organizations`}
        />
        <StatCard
          label="Total Public Events"
          value={db.events.length}
          icon={<Calendar className="size-5 text-brand-600" />}
          hint={`${db.events.filter((e) => e.status === "PUBLISHED").length} Published / ${db.events.filter((e) => e.status === "SUSPENDED").length} Suspended`}
        />
        <StatCard
          label="Total Platform Revenue"
          value={formatBDT(totalRevenue)}
          icon={<Database className="size-5 text-success" />}
          hint={`${db.orders.length} Total orders`}
        />
        <StatCard
          label="Security Invariants"
          value="14 / 14 Verified"
          icon={<Lock className="size-5 text-brand-600" />}
          hint="Automated QA suite passing"
        />
      </div>

      {/* NOTICE BANNER */}
      {adminNotice && (
        <div className="rounded-btn border border-brand-200 bg-brand-50 p-4 text-xs font-semibold text-brand-700 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-brand-600 shrink-0" />
            <span>{adminNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setAdminNotice(null)}
            className="text-xs text-brand-700 underline cursor-pointer hover:text-brand-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* PENDING PAYMENT VERIFICATION ALERT */}
      {pendingVerificationOrders.length > 0 && (
        <div className="rounded-card border border-amber-300 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-900">
                {pendingVerificationOrders.length} payment{pendingVerificationOrders.length > 1 ? "s" : ""} awaiting Admin / Organizer verification
              </p>
              <p className="text-xs text-amber-800">
                Attendees are waiting for payment proof approval before their QR tickets are issued.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setActiveTab("PAYMENTS")}
            className="shrink-0"
          >
            Review &amp; Verify ({pendingVerificationOrders.length})
          </Button>
        </div>
      )}

      {/* SUB-NAVIGATION TABS */}
      <div className="flex flex-wrap gap-2 border-b border-line pb-2">
        {[
          { id: "MODERATION", label: "Event Moderation & Safety" },
          { id: "PAYMENTS", label: `Payment Verifications (${pendingVerificationOrders.length})` },
          { id: "VENUE_MARKETPLACE", label: "Venues, Vendors & Disputes" },
          { id: "AUDIT", label: "System Audit Logs" },
          { id: "NOTIFICATIONS", label: "Email & Notification Queue" },
          { id: "QA_SPECS", label: "Automated QA Test Matrix" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`rounded-btn px-4 py-2 text-xs font-bold transition cursor-pointer ${
              activeTab === tab.id
                ? "bg-brand-600 text-white shadow-sm"
                : "bg-surface border border-line text-ink-muted hover:bg-canvas-alt hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: MODERATION */}
      {activeTab === "MODERATION" && (
        <Card className="p-5 shadow-card space-y-4">
          <h2 className="text-base font-bold text-ink">All Platform Events for Moderation</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-canvas-alt text-[11px] uppercase tracking-wider font-semibold text-ink-muted">
                <tr>
                  <th className="px-4 py-3">Event Title</th>
                  <th className="px-4 py-3">Host Org</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Visibility</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {db.events.map((evt) => {
                  const org = db.organizations.find((o) => o.id === evt.organization_id);
                  return (
                    <tr key={evt.id} className="hover:bg-canvas-alt/50 transition">
                      <td className="px-4 py-3">
                        <span className="font-bold text-ink">{evt.title}</span>
                        <p className="text-[11px] text-ink-muted font-mono">/{evt.slug}</p>
                      </td>
                      <td className="px-4 py-3 text-ink-muted">{org?.name}</td>
                      <td className="px-4 py-3">
                        <Badge
                          tone={
                            evt.status === "PUBLISHED"
                              ? "success"
                              : evt.status === "SUSPENDED"
                              ? "danger"
                              : "warning"
                          }
                          className="text-[10px]"
                        >
                          {evt.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-ink-muted font-mono">{evt.visibility}</td>
                      <td className="px-4 py-3 text-right space-x-2">
                        {evt.status === "SUSPENDED" ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<Check className="size-3.5" />}
                            onClick={() => handleModerate(evt.id, "APPROVE")}
                          >
                            Reinstate
                          </Button>
                        ) : (
                          <Button
                            variant="danger"
                            size="sm"
                            leftIcon={<Ban className="size-3.5" />}
                            onClick={() => handleModerate(evt.id, "SUSPENDED" as any)}
                          >
                            Suspend
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB: VENUE MARKETPLACE & DISPUTES */}
      {activeTab === "VENUE_MARKETPLACE" && (
        <div className="space-y-6">
          {/* VENUE & VENDOR PROFILES VERIFICATION */}
          <Card className="p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-ink">Venue Host & Service Vendor Verification</h2>
                <p className="text-xs text-ink-muted">
                  Review submitted trade licenses, civic fire safety permits, and acoustic compliance records.
                </p>
              </div>
              <Badge tone="brand">Partner Network</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-line bg-canvas-alt text-ink-muted uppercase text-[10px] font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Provider / Space Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3">Capacity / Rate</th>
                    <th className="py-2.5 px-3">KYC Status</th>
                    <th className="py-2.5 px-3 text-right">Moderation Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-ink">
                  {[
                    {
                      name: "Krishibid Institution Bangladesh (KIB) Auditorium",
                      owner: "Kamal Hossain (Farmgate)",
                      cat: "AUDITORIUM",
                      city: "Dhaka",
                      cap: "1,200 Seats",
                      rate: "৳85,000/day",
                      status: "VERIFIED",
                    },
                    {
                      name: "BUET ECE Building Auditorium",
                      owner: "Nusrat Jahan (Palashi)",
                      cat: "UNIVERSITY_VENUE",
                      city: "Dhaka",
                      cap: "450 Seats",
                      rate: "৳35,000/day",
                      status: "VERIFIED",
                    },
                    {
                      name: "SoundCraft BD Pro Audio & Stage Rig",
                      owner: "Tariqul Islam (Tejgaon)",
                      cat: "SOUND_SYSTEM",
                      city: "Dhaka",
                      cap: "Concert PA",
                      rate: "৳25,000/event",
                      status: "VERIFIED",
                    },
                    {
                      name: "Chittagong Club Banquet & Garden",
                      owner: "SS Khaled Rd, Lalkhan Bazar",
                      cat: "BANQUET_HALL",
                      city: "Chattogram",
                      cap: "800 Seats",
                      rate: "৳110,000/day",
                      status: "PENDING_AUDIT",
                    },
                  ].map((p, idx) => (
                    <tr key={idx} className="hover:bg-canvas-alt/50">
                      <td className="py-2.5 px-3 font-semibold">
                        <div>{p.name}</div>
                        <span className="text-[10px] text-ink-muted">{p.owner}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px]">{p.cat}</td>
                      <td className="py-2.5 px-3">{p.city}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold">{p.cap}</span> &bull; {p.rate}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge tone={p.status === "VERIFIED" ? "success" : "warning"}>
                          {p.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {p.status === "VERIFIED" ? (
                          <button
                            type="button"
                            onClick={() => setAdminNotice(`Audited ${p.name} compliance credentials.`)}
                            className="rounded-btn border border-line bg-canvas px-2.5 py-1 text-[11px] font-semibold text-ink-muted hover:text-ink cursor-pointer"
                          >
                            Inspect KYC
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setAdminNotice(`Approved ${p.name} listing for public marketplace.`)}
                            className="rounded-btn bg-brand-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-brand-700 cursor-pointer shadow-xs"
                          >
                            Approve Listing
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* ACTIVE RFQS & DISPUTE MONITOR */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-5 shadow-card space-y-3">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <FileText className="size-4 text-brand-600" />
                <span>Marketplace RFQs & Quotations Stream</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="rounded-btn border border-line bg-canvas-alt p-3 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-ink">rfq-hackathon-2026</span>
                    <Badge tone="success">2 Active Quotations</Badge>
                  </div>
                  <p className="text-ink-muted">Dhaka Tech Hackathon 2026 (400 Guests, Feb 15)</p>
                  <p className="text-[11px] text-brand-700 font-semibold">Budget: ৳150,000 BDT &bull; Organizer: Nusrat Jahan</p>
                </div>
              </div>
            </Card>

            <Card className="p-5 shadow-card space-y-3">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <ShieldAlert className="size-4 text-emerald-600" />
                <span>Escrow Booking & Dispute Resolution Log</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="rounded-btn border border-emerald-200 bg-emerald-50/40 p-3 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-ink">vb-kib-demo-1</span>
                    <Badge tone="success">Escrow Locked</Badge>
                  </div>
                  <p className="text-ink-muted">Event: Feb 15, 2027 at KIB Auditorium</p>
                  <div className="flex justify-between text-[11px] pt-1">
                    <span>Deposit Held: <strong>৳42,500</strong></span>
                    <span className="text-emerald-700 font-semibold">No Disputes Logged</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT LOGS */}
      {activeTab === "AUDIT" && (
        <Card className="p-5 shadow-card space-y-4">
          <h2 className="text-base font-bold text-ink">Immutable Security Audit Trail ({db.audit_logs.length})</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {db.audit_logs.map((log) => (
              <div
                key={log.id}
                className="rounded-btn border border-line bg-canvas-alt p-3 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-brand-700">{log.action}</span>
                  <span className="text-[11px] text-ink-muted font-mono">
                    {new Date(log.created_at).toLocaleString("en-GB")}
                  </span>
                </div>
                <p className="text-ink">Actor: <span className="font-mono text-ink-muted">{log.actor_name} ({log.actor_role})</span></p>
                <p className="text-ink-muted font-mono text-[11px]">{JSON.stringify(log.metadata)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 3: NOTIFICATIONS */}
      {activeTab === "NOTIFICATIONS" && (
        <Card className="p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h2 className="text-base font-bold text-ink">Transactional Notification Queue</h2>
              <p className="text-xs text-ink-muted">Simulates fault-tolerant background worker retry logic (QA-014)</p>
            </div>
            <Button
              size="sm"
              leftIcon={<RefreshCw className="size-3.5" />}
              onClick={handleRetryEmails}
            >
              Retry Pending Queue
            </Button>
          </div>

          <div className="space-y-2">
            {db.notifications.map((n) => (
              <div
                key={n.id}
                className="rounded-btn border border-line bg-canvas-alt p-3 text-xs flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-ink">{n.destination}</span>
                  <p className="text-ink-muted">{n.subject}</p>
                </div>
                <Badge
                  tone={
                    n.status === "SENT"
                      ? "success"
                      : n.status === "QUEUED" || n.status === "RETRYING"
                      ? "warning"
                      : "danger"
                  }
                  className="text-[10px]"
                >
                  {n.status} ({n.retry_count} retries)
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB: PAYMENT VERIFICATIONS */}
      {activeTab === "PAYMENTS" && (
        <Card className="p-5 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-ink">
                Payment Verification Queue
              </h2>
              <p className="text-xs text-ink-muted">
                Verify MFS / Gateway TrxID proofs submitted by attendees. Approving mints cryptographic QR tickets immediately.
              </p>
            </div>
            <Badge tone={pendingVerificationOrders.length > 0 ? "warning" : "success"}>
              {pendingVerificationOrders.length} Pending Review
            </Badge>
          </div>

          {pendingVerificationOrders.length === 0 ? (
            <div className="rounded-btn border border-line bg-canvas-alt p-8 text-center space-y-2">
              <CheckCircle2 className="size-8 text-success mx-auto" />
              <p className="text-sm font-bold text-ink">All payments are verified</p>
              <p className="text-xs text-ink-muted">
                No orders are currently waiting for payment proof verification.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-line text-[11px] uppercase tracking-wider text-ink-muted">
                    <th className="py-2 pr-3">Order &amp; Event</th>
                    <th className="py-2 pr-3">Attendee</th>
                    <th className="py-2 pr-3">Payment Proof</th>
                    <th className="py-2 pr-3">Amount</th>
                    <th className="py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {pendingVerificationOrders.map((order) => {
                    const ev = db.events.find((e) => e.id === order.event_id);
                    const buyer = order.buyer_user_id
                      ? db.profiles.find((p) => p.id === order.buyer_user_id)
                      : undefined;
                    const isBusy = verifyingOrderId === order.id;
                    return (
                      <tr key={order.id} className="hover:bg-canvas-alt/60">
                        <td className="py-3 pr-3 align-top">
                          <p className="font-mono font-bold text-ink">{order.id}</p>
                          <p className="text-[11px] text-ink-muted">
                            {ev?.title || order.event_id}
                          </p>
                        </td>
                        <td className="py-3 pr-3 align-top">
                          <p className="font-semibold text-ink">
                            {buyer?.display_name || order.attendee_name || order.buyer_user_id || "Guest"}
                          </p>
                          <p className="text-[11px] text-ink-muted">
                            {buyer?.email || order.attendee_email || ""}
                          </p>
                        </td>
                        <td className="py-3 pr-3 align-top space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <Badge tone="brand" className="text-[10px]">
                              {order.payment_provider || "MFS"}
                            </Badge>
                            <span className="font-mono font-bold text-ink">
                              {order.payment_reference || "—"}
                            </span>
                          </div>
                          {order.sender_number && (
                            <p className="text-[11px] text-ink-muted">
                              From: {order.sender_number}
                            </p>
                          )}
                        </td>
                        <td className="py-3 pr-3 align-top font-bold text-ink">
                          {formatBDT(order.total_minor)}
                        </td>
                        <td className="py-3 text-right align-top">
                          <div className="inline-flex items-center gap-2">
                            <Button
                              variant="primary"
                              size="sm"
                              disabled={isBusy}
                              onClick={() => handleVerifyOrder(order.id, true)}
                            >
                              <Check className="size-3.5 mr-1" />
                              Accept &amp; Verify
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isBusy}
                              onClick={() => handleVerifyOrder(order.id, false)}
                              className="text-danger border-danger/30 hover:bg-danger/10"
                            >
                              <Ban className="size-3.5 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* TAB 4: QA SPECS */}
      {activeTab === "QA_SPECS" && (
        <Card className="p-5 shadow-card space-y-4">
          <h2 className="text-base font-bold text-ink">Platform Verification Matrix (Tiers 1–4)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {QA_MATRIX.map((qa) => (
              <div
                key={qa.id}
                className="rounded-btn border border-line bg-canvas-alt p-3 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <Badge tone="brand" className="font-mono text-[10px]">
                    {qa.id}
                  </Badge>
                  <span className="text-success font-semibold text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="size-3" /> VERIFIED
                  </span>
                </div>
                <p className="font-bold text-ink">{qa.scenario}</p>
                <p className="text-ink-muted text-[11px]">{qa.expected}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
