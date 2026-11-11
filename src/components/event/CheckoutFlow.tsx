"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "@/components/ui/Link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Edit2,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Minus,
  Phone,
  Plus,
  RefreshCw,
  ShieldCheck,
  Ticket,
  User,
  XCircle,
} from "lucide-react";
import { Stepper } from "@/components/ui/Stepper";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { computeTotals, MAX_TICKETS_PER_ORDER, type PublicTicketType } from "@/lib/public-events-shared";
import { cn, formatBDT } from "@/lib/ui/cn";
import { useAuth } from "@/lib/firebase/auth-context";

const DEMO_BUYER_ID = "usr-attendee-rafiq";

const STEPS = ["Tickets", "Your Details", "Review", "Payment", "Confirmation"];

interface CheckoutEvent {
  id: string;
  slug: string;
  title: string;
  startsAt: string;
  venueName: string;
  city: string;
  isOnline: boolean;
}

type OrderStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "CANCELLED";

interface OrderLite {
  id: string;
  status: OrderStatus;
  total_minor: number;
}

type ProviderChoice = "BKASH_SANDBOX" | "NAGAD_SANDBOX" | "SSLCOMMERZ_SANDBOX";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^(\+?88)?01[3-9]\d{8}$/;

async function readError(res: Response): Promise<string> {
  try {
    const json = await res.json();
    return json?.error?.message || "Something went wrong. Please try again.";
  } catch {
    return "Something went wrong. Please try again.";
  }
}

function sessionNonce(): string {
  try {
    let n = window.sessionStorage.getItem("aayojon:checkout-nonce");
    if (!n) {
      n = crypto.randomUUID();
      window.sessionStorage.setItem("aayojon:checkout-nonce", n);
    }
    return n;
  } catch {
    return "no-storage";
  }
}

export function CheckoutFlow({
  event,
  tickets,
  initialTicketId,
  initialQty,
  ended,
}: {
  event: CheckoutEvent;
  tickets: PublicTicketType[];
  initialTicketId?: string;
  initialQty?: number;
  ended: boolean;
}) {
  const { currentUser: authUser } = useAuth();
  const buyerId = authUser?.uid || DEMO_BUYER_ID;

  const firstAvailable = tickets.find((t) => t.remaining > 0);
  const preferred = tickets.find((t) => t.id === initialTicketId && t.remaining > 0);
  const [step, setStep] = useState(1);
  const [ticketId, setTicketId] = useState((preferred ?? firstAvailable)?.id ?? "");
  const [qty, setQty] = useState(Math.max(1, Math.min(initialQty ?? 1, MAX_TICKETS_PER_ORDER)));
  const [selectedProvider, setSelectedProvider] = useState<ProviderChoice>("BKASH_SANDBOX");

  const [form, setForm] = useState({
    name: authUser?.displayName || "",
    email: authUser?.email || "",
    phone: (authUser as any)?.phone || "",
    institute: (authUser as any)?.organization_label || "",
  });

  useEffect(() => {
    if (authUser) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || authUser.displayName || "",
        email: prev.email || authUser.email || "",
        phone: prev.phone || (authUser as any)?.phone || "",
        institute: prev.institute || (authUser as any)?.organization_label || "",
      }));
    }
  }, [authUser]);

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [verifyingSandbox, setVerifyingSandbox] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderLite | null>(null);
  const [freeDone, setFreeDone] = useState(false);
  const inFlight = useRef(false);

  const selected = tickets.find((t) => t.id === ticketId);
  const maxQty = selected ? Math.max(1, Math.min(MAX_TICKETS_PER_ORDER, selected.remaining)) : 1;
  const isFree = selected?.priceMinor === 0;
  // Free registration issues exactly one ticket per registration
  const safeQty = isFree ? 1 : Math.min(qty, maxQty);
  const totals = selected ? computeTotals(selected.priceMinor, safeQty) : null;

  const errors = {
    name: form.name.trim().length < 2 ? "Please enter your full name" : "",
    email: EMAIL_RE.test(form.email.trim()) ? "" : "Please enter a valid email address",
    phone:
      !form.phone.trim() || PHONE_RE.test(form.phone.trim().replace(/[\s-]/g, ""))
        ? ""
        : "Please enter a valid Bangladesh mobile number (e.g. 01712345678)",
  };
  const detailsValid = !errors.name && !errors.email && !errors.phone;
  const show = (k: keyof typeof errors) => (touched[k] ? errors[k] : "");

  const buildHeaders = useCallback(
    (extra?: Record<string, string>) => ({
      "Content-Type": "application/json",
      "x-user-id": buyerId,
      ...extra,
    }),
    [buyerId]
  );

  // Poll the real order status after a paid order is created.
  const orderId = order?.id;
  const orderStatus = order?.status;
  useEffect(() => {
    if (!orderId || orderStatus !== "PENDING") return;
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch("/api/v1/me/orders", { headers: buildHeaders(), cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as { data: OrderLite[] };
        const fresh = json.data.find((o) => o.id === orderId);
        if (fresh && !cancelled) {
          setOrder({ id: fresh.id, status: fresh.status, total_minor: fresh.total_minor });
        }
      } catch {
        /* keep waiting */
      }
    };
    const id = window.setInterval(tick, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [orderId, orderStatus, buildHeaders]);

  const refreshNow = async () => {
    if (!orderId) return;
    try {
      const res = await fetch("/api/v1/me/orders", { headers: buildHeaders(), cache: "no-store" });
      const json = (await res.json()) as { data: OrderLite[] };
      const fresh = json.data.find((o) => o.id === orderId);
      if (fresh) {
        setOrder({ id: fresh.id, status: fresh.status, total_minor: fresh.total_minor });
      }
    } catch {
      setError("Couldn't check payment status right now. Please try again.");
    }
  };

  const simulateSandboxPayment = async () => {
    if (!orderId || verifyingSandbox) return;
    setVerifyingSandbox(true);
    try {
      const res = await fetch("/api/v1/payments/sandbox-confirm", {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({ orderId, provider: selectedProvider }),
      });
      if (!res.ok) throw new Error(await readError(res));
      await refreshNow();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sandbox payment simulation failed.");
    } finally {
      setVerifyingSandbox(false);
    }
  };

  const submit = async () => {
    if (!selected || inFlight.current || submitting) return;
    inFlight.current = true;
    setSubmitting(true);
    setError(null);
    const attendee = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim().replace(/[\s-]/g, ""),
      instituteOrCompany: form.institute.trim(),
    };
    try {
      if (isFree) {
        const res = await fetch(`/api/v1/events/${encodeURIComponent(event.slug)}/registrations`, {
          method: "POST",
          headers: buildHeaders(),
          body: JSON.stringify({
            ticketTypeId: selected.id,
            attendeeName: attendee.name,
            attendeeEmail: attendee.email,
            attendeePhone: attendee.phone,
            instituteOrCompany: attendee.instituteOrCompany,
          }),
        });
        if (!res.ok) throw new Error(await readError(res));
        setFreeDone(true);
        setStep(5);
      } else {
        const key = `ui-ord-${event.id}-${selected.id}-${safeQty}-${attendee.email}-${sessionNonce()}`;
        const res = await fetch("/api/v1/orders", {
          method: "POST",
          headers: buildHeaders({ "Idempotency-Key": key }),
          body: JSON.stringify({
            eventId: event.id,
            items: [{ ticketTypeId: selected.id, quantity: safeQty }],
            attendee,
          }),
        });
        if (!res.ok) throw new Error(await readError(res));
        const json = (await res.json()) as { data: OrderLite };
        setOrder({ id: json.data.id, status: json.data.status, total_minor: json.data.total_minor });
        setStep(5);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  const next = () => {
    setError(null);
    if (step === 2) {
      setTouched({ name: true, email: true, phone: true });
      if (!detailsValid) return;
    }
    setStep((s) => Math.min(4, s + 1));
  };

  if (ended) {
    return (
      <Card className="p-8 text-center">
        <p className="font-semibold text-lg text-ink">This event has already ended.</p>
        <p className="mt-1 text-sm text-ink-muted">Ticket booking is closed for this event.</p>
        <Link
          href={`/events/${event.slug}`}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
        >
          <ArrowLeft className="size-4" /> Back to event page
        </Link>
      </Card>
    );
  }

  if (!selected) {
    return (
      <Card className="p-8 text-center">
        <p className="font-semibold text-lg text-ink">No tickets are currently available for this event.</p>
        <p className="mt-1 text-sm text-ink-muted">All available inventory has been allocated or sold out.</p>
        <Link
          href={`/events/${event.slug}`}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
        >
          <ArrowLeft className="size-4" /> Back to event page
        </Link>
      </Card>
    );
  }

  // Sidebar Order Summary Component
  const summary = (
    <Card className="rounded-2xl border border-line bg-surface p-5 shadow-card">
      <h2 className="text-base font-bold text-ink border-b border-line pb-3">Order Summary</h2>

      <div className="mt-3">
        <h3 className="text-sm font-bold text-ink line-clamp-1">{event.title}</h3>
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-muted">
          <CalendarDays className="size-3.5 text-brand-600" aria-hidden />
          {new Date(event.startsAt).toLocaleString("en-GB", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "Asia/Dhaka",
          })}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted">
          <MapPin className="size-3.5 text-pink" aria-hidden />
          {event.isOnline ? "Online Event" : [event.venueName, event.city].filter(Boolean).join(", ")}
        </p>
      </div>

      {totals && (
        <div className="mt-4 border-t border-line pt-3">
          <dl className="space-y-2 text-xs">
            <div className="flex justify-between text-ink-muted">
              <dt>
                {selected.name} {safeQty > 1 && `(× ${safeQty})`}
              </dt>
              <dd className="font-semibold text-ink">{isFree ? "৳ 0" : formatBDT(totals.subtotalMinor)}</dd>
            </div>
            {totals.feeMinor > 0 && (
              <div className="flex justify-between text-ink-muted">
                <dt>Platform Service Fee (2.5%)</dt>
                <dd className="font-semibold text-ink">{formatBDT(totals.feeMinor)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-line pt-2 text-sm font-bold text-ink">
              <dt>Total Amount</dt>
              <dd className="text-brand-700">{totals.totalMinor === 0 ? "Free" : formatBDT(totals.totalMinor)}</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="mt-4 rounded-xl bg-canvas-alt/60 p-3 text-[11px] text-ink-muted space-y-1.5 border border-line/70">
        <div className="flex items-center gap-1.5 font-medium text-ink">
          <ShieldCheck className="size-3.5 text-success" /> Verified Ticket Guarantee
        </div>
        <p>Issued directly with official Aayojon digital QR verification token.</p>
      </div>
    </Card>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="min-w-0 space-y-6">
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5">
          <Stepper steps={STEPS} current={step} />
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-danger animate-in fade-in"
          >
            <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
            <div>
              <p className="font-semibold">Notice</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* STEP 1: TICKET SELECTION */}
        {step === 1 && (
          <Card className="rounded-2xl border border-line bg-surface p-6 shadow-card space-y-5">
            <div>
              <h2 className="text-xl font-bold text-ink">Step 1: Select Your Ticket</h2>
              <p className="mt-1 text-sm text-ink-muted">Choose your ticket tier and attendance quantity.</p>
            </div>

            <fieldset className="space-y-3">
              <legend className="sr-only">Ticket Type</legend>
              {tickets.map((t) => {
                const out = t.remaining <= 0;
                const isUrgent = !out && t.remaining > 0 && t.remaining <= 10;
                const active = t.id === ticketId;

                return (
                  <label
                    key={t.id}
                    className={cn(
                      "relative flex cursor-pointer items-start gap-3.5 rounded-xl border p-4 transition-all duration-150",
                      active
                        ? "border-brand-600 bg-brand-50/70 shadow-sm ring-1 ring-brand-500/20"
                        : "border-line bg-surface hover:border-brand-300 hover:bg-canvas-alt",
                      out && "cursor-not-allowed opacity-55 hover:border-line hover:bg-surface"
                    )}
                  >
                    <input
                      type="radio"
                      name="ticket"
                      className="mt-1 size-4 accent-brand-600"
                      checked={active}
                      disabled={out}
                      onChange={() => setTicketId(t.id)}
                    />
                    <span className="flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="text-base font-bold text-ink">{t.name}</span>
                        <span className="text-base font-extrabold text-brand-700">
                          {t.priceMinor === 0 ? "Free" : formatBDT(t.priceMinor)}
                        </span>
                      </span>
                      {t.description && (
                        <span className="mt-1 block text-xs leading-relaxed text-ink-muted">{t.description}</span>
                      )}
                      <span className="mt-2.5 flex items-center gap-2">
                        {out ? (
                          <Badge tone="danger">Sold Out</Badge>
                        ) : isUrgent ? (
                          <Badge tone="warning">Only {t.remaining} tickets left</Badge>
                        ) : (
                          <span className="text-xs text-ink-muted font-medium">{t.remaining} available</span>
                        )}
                      </span>
                    </span>
                  </label>
                );
              })}
            </fieldset>

            {isFree ? (
              <div className="rounded-xl bg-brand-50/80 p-3.5 text-xs text-brand-900 border border-brand-200">
                <span className="font-bold">Free Event Policy:</span> Free registration issues exactly 1 ticket per
                attendee. For multiple attendees, each attendee registers individually.
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-xl bg-canvas-alt/70 p-4 border border-line">
                <div>
                  <span id="qty-label" className="text-sm font-bold text-ink">
                    Ticket Quantity
                  </span>
                  <p className="text-xs text-ink-muted">Maximum {maxQty} tickets per booking</p>
                </div>
                <div className="flex items-center gap-2" role="group" aria-labelledby="qty-label">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    disabled={safeQty <= 1}
                    onClick={() => setQty(safeQty - 1)}
                    className="flex size-10 cursor-pointer items-center justify-center rounded-lg border border-line bg-surface text-ink transition hover:bg-canvas-alt disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Minus className="size-4" />
                  </button>
                  <output className="w-10 text-center text-base font-bold text-ink" aria-live="polite">
                    {safeQty}
                  </output>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={safeQty >= maxQty}
                    onClick={() => setQty(safeQty + 1)}
                    className="flex size-10 cursor-pointer items-center justify-center rounded-lg border border-line bg-surface text-ink transition hover:bg-canvas-alt disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* STEP 2: ATTENDEE INFORMATION */}
        {step === 2 && (
          <Card className="rounded-2xl border border-line bg-surface p-6 shadow-card space-y-5">
            <div>
              <h2 className="text-xl font-bold text-ink">Step 2: Attendee Details</h2>
              <p className="mt-1 text-sm text-ink-muted">
                Enter the details of the primary attendee. The QR ticket pass will be registered under this name.
              </p>
            </div>

            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                next();
              }}
              className="space-y-4"
              id="details-form"
            >
              <div>
                <Input
                  label="Full Name"
                  autoComplete="name"
                  placeholder="e.g. Tanvir Ahmed"
                  required
                  value={form.name}
                  error={show("name")}
                  onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <Input
                  label="Email Address"
                  type="email"
                  autoComplete="email"
                  placeholder="e.g. tanvir@gmail.com"
                  required
                  value={form.email}
                  error={show("email")}
                  hint="Your official QR code pass and confirmation receipt will be delivered here."
                  onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div>
                <Input
                  label="Mobile Phone Number (Optional)"
                  type="tel"
                  autoComplete="tel"
                  placeholder="01XXXXXXXXX"
                  value={form.phone}
                  error={show("phone")}
                  hint="Used for event SMS alerts and bKash/Nagad verification."
                  onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div>
                <Input
                  label="Institution or Company (Optional)"
                  autoComplete="organization"
                  placeholder="e.g. BUET / Pathao"
                  value={form.institute}
                  onChange={(e) => setForm({ ...form, institute: e.target.value })}
                />
              </div>
            </form>
          </Card>
        )}

        {/* STEP 3: ORDER REVIEW */}
        {step === 3 && (
          <Card className="rounded-2xl border border-line bg-surface p-6 shadow-card space-y-6">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <h2 className="text-xl font-bold text-ink">Step 3: Review Your Order</h2>
                <p className="mt-1 text-sm text-ink-muted">Please double check your details before proceeding to payment.</p>
              </div>
              <Badge tone="brand">Review</Badge>
            </div>

            {/* Attendee Details Card */}
            <div className="rounded-xl border border-line bg-canvas-alt/50 p-4">
              <div className="flex items-center justify-between border-b border-line pb-2 mb-3">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-muted">
                  <User className="size-3.5 text-brand-600" /> Primary Attendee
                </span>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  <Edit2 className="size-3" /> Edit
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 text-sm">
                <div>
                  <span className="text-xs text-ink-muted">Name:</span>
                  <p className="font-bold text-ink">{form.name}</p>
                </div>
                <div>
                  <span className="text-xs text-ink-muted">Email:</span>
                  <p className="font-bold text-ink break-all">{form.email}</p>
                </div>
                {form.phone && (
                  <div>
                    <span className="text-xs text-ink-muted">Phone:</span>
                    <p className="font-medium text-ink">{form.phone}</p>
                  </div>
                )}
                {form.institute && (
                  <div>
                    <span className="text-xs text-ink-muted">Organization:</span>
                    <p className="font-medium text-ink">{form.institute}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Ticket Details Card */}
            <div className="rounded-xl border border-line bg-canvas-alt/50 p-4">
              <div className="flex items-center justify-between border-b border-line pb-2 mb-3">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-muted">
                  <Ticket className="size-3.5 text-brand-600" /> Ticket Information
                </span>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  <Edit2 className="size-3" /> Edit
                </button>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div>
                  <p className="font-bold text-ink">{selected.name}</p>
                  <p className="text-xs text-ink-muted">Quantity: {safeQty}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-ink">{isFree ? "Free" : formatBDT(totals?.subtotalMinor ?? 0)}</p>
                  {totals && totals.feeMinor > 0 && (
                    <p className="text-[11px] text-ink-muted">+ ৳ {Math.round(totals.feeMinor / 100)} fee</p>
                  )}
                </div>
              </div>
            </div>

            {/* Total Highlight */}
            <div className="flex items-center justify-between rounded-xl bg-brand-50/60 p-4 border border-brand-200">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-800">Total Payable Amount</span>
                <p className="text-xs text-brand-700">Includes all applicable platform fees</p>
              </div>
              <p className="text-2xl font-extrabold text-brand-700">
                {totals?.totalMinor === 0 ? "Free" : formatBDT(totals?.totalMinor ?? 0)}
              </p>
            </div>
          </Card>
        )}

        {/* STEP 4: PAYMENT */}
        {step === 4 && (
          <Card className="rounded-2xl border border-line bg-surface p-6 shadow-card space-y-6">
            <div className="border-b border-line pb-4">
              <h2 className="text-xl font-bold text-ink">
                {isFree ? "Step 4: Confirm Registration" : "Step 4: Choose Payment Method"}
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                {isFree
                  ? "This ticket is completely free. Confirm to issue your admission pass."
                  : "Select your preferred Bangladesh payment channel to complete your order."}
              </p>
            </div>

            {isFree ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5 text-sm text-emerald-950 space-y-2">
                <p className="font-bold text-base flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-emerald-600" /> No Payment Required
                </p>
                <p className="text-emerald-800">
                  Your registration will be recorded and a personalized QR entry ticket will be generated instantly.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <fieldset className="space-y-3">
                  <legend className="sr-only">Payment Provider</legend>

                  {/* bKash */}
                  <label
                    className={cn(
                      "flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all duration-150",
                      selectedProvider === "BKASH_SANDBOX"
                        ? "border-pink-500 bg-pink-50/50 shadow-sm ring-1 ring-pink-500"
                        : "border-line bg-surface hover:border-pink-300 hover:bg-canvas-alt"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment-provider"
                        value="BKASH_SANDBOX"
                        checked={selectedProvider === "BKASH_SANDBOX"}
                        onChange={() => setSelectedProvider("BKASH_SANDBOX")}
                        className="size-4 accent-pink-600"
                      />
                      <div>
                        <p className="text-sm font-bold text-ink">bKash (বিকাশ)</p>
                        <p className="text-xs text-ink-muted">Direct Mobile Financial Service (Sandbox)</p>
                      </div>
                    </div>
                    <span className="rounded-md bg-pink-100 px-2.5 py-1 text-xs font-bold text-pink-700">bKash</span>
                  </label>

                  {/* Nagad */}
                  <label
                    className={cn(
                      "flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all duration-150",
                      selectedProvider === "NAGAD_SANDBOX"
                        ? "border-orange-500 bg-orange-50/50 shadow-sm ring-1 ring-orange-500"
                        : "border-line bg-surface hover:border-orange-300 hover:bg-canvas-alt"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment-provider"
                        value="NAGAD_SANDBOX"
                        checked={selectedProvider === "NAGAD_SANDBOX"}
                        onChange={() => setSelectedProvider("NAGAD_SANDBOX")}
                        className="size-4 accent-orange-600"
                      />
                      <div>
                        <p className="text-sm font-bold text-ink">Nagad (নগদ)</p>
                        <p className="text-xs text-ink-muted">Post Office Digital Financial Service (Sandbox)</p>
                      </div>
                    </div>
                    <span className="rounded-md bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-700">Nagad</span>
                  </label>

                  {/* SSLCommerz Cards */}
                  <label
                    className={cn(
                      "flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all duration-150",
                      selectedProvider === "SSLCOMMERZ_SANDBOX"
                        ? "border-brand-600 bg-brand-50/50 shadow-sm ring-1 ring-brand-600"
                        : "border-line bg-surface hover:border-brand-300 hover:bg-canvas-alt"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment-provider"
                        value="SSLCOMMERZ_SANDBOX"
                        checked={selectedProvider === "SSLCOMMERZ_SANDBOX"}
                        onChange={() => setSelectedProvider("SSLCOMMERZ_SANDBOX")}
                        className="size-4 accent-brand-600"
                      />
                      <div>
                        <p className="text-sm font-bold text-ink">SSLCommerz Gateway</p>
                        <p className="text-xs text-ink-muted">Visa, Mastercard, DBBL Nexus & Internet Banking</p>
                      </div>
                    </div>
                    <span className="rounded-md bg-brand-100 px-2.5 py-1 text-xs font-bold text-brand-700">Cards/NetBanking</span>
                  </label>
                </fieldset>

                <div className="rounded-xl border border-line bg-canvas-alt/50 p-4 space-y-2 text-xs text-ink-muted">
                  <div className="flex items-center gap-2 font-semibold text-ink">
                    <Lock className="size-4 text-brand-600" />
                    <span>Bank-grade 256-bit Encrypted Transaction</span>
                  </div>
                  <p>
                    Your order is reserved for 15 minutes. Official ticket pass and QR verification code are issued only
                    after verified webhook confirmation from our payment gateway.
                  </p>
                  <p className="flex items-center gap-1.5 text-ink">
                    <ShieldCheck className="size-4 text-success" />
                    <span>Protected by idempotency keys against duplicate charges.</span>
                  </p>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* STEP 5: CONFIRMATION & VERIFICATION */}
        {step === 5 && (
          <Card className="rounded-2xl border border-line bg-surface p-8 text-center shadow-card space-y-5" aria-live="polite">
            {freeDone ? (
              <>
                <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-sm">
                  <CheckCircle2 className="size-10" aria-hidden />
                </div>
                <div>
                  <Badge tone="success">Registration Confirmed</Badge>
                  <h2 className="mt-3 text-2xl font-extrabold text-ink sm:text-3xl">You&apos;re All Set!</h2>
                  <p className="mt-2 text-sm text-ink-muted max-w-md mx-auto">
                    Your free admission pass for <strong className="text-ink">{event.title}</strong> has been issued to{" "}
                    <strong className="text-ink">{form.email}</strong>.
                  </p>
                </div>
              </>
            ) : order?.status === "PAID" ? (
              <>
                <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-sm">
                  <CheckCircle2 className="size-10" aria-hidden />
                </div>
                <div>
                  <Badge tone="success">Payment Verified</Badge>
                  <h2 className="mt-3 text-2xl font-extrabold text-ink sm:text-3xl">Payment Confirmed!</h2>
                  <p className="mt-2 text-sm text-ink-muted max-w-md mx-auto">
                    Order <strong className="text-ink">{order.id}</strong> has been successfully processed. Your official QR
                    admission ticket has been generated and added to your wallet.
                  </p>
                </div>
              </>
            ) : order && order.status !== "PENDING" ? (
              <>
                <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-red-100 text-danger shadow-sm">
                  <XCircle className="size-10" aria-hidden />
                </div>
                <div>
                  <Badge tone="danger">Order {order.status}</Badge>
                  <h2 className="mt-3 text-2xl font-extrabold text-ink sm:text-3xl">Payment Not Completed</h2>
                  <p className="mt-2 text-sm text-ink-muted max-w-md mx-auto">
                    Order <strong className="text-ink">{order.id}</strong> was {order.status.toLowerCase()}. No ticket was
                    issued and no funds were settled.
                  </p>
                </div>
                <div className="pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setError(null);
                      setStep(4);
                    }}
                  >
                    Try Again
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 shadow-sm">
                  <Loader2 className="size-10 animate-spin" aria-hidden />
                </div>
                <div>
                  <Badge tone="warning">
                    <Clock className="mr-1 size-3.5" aria-hidden /> Awaiting Payment Confirmation
                  </Badge>
                  <h2 className="mt-3 text-2xl font-extrabold text-ink sm:text-3xl">Order Reserved</h2>
                  <p className="mt-2 text-sm text-ink-muted max-w-md mx-auto leading-relaxed">
                    Order <strong className="text-ink">{order?.id}</strong> is placed. Aayojon is awaiting payment webhook
                    verification from {selectedProvider.replace(/_/g, " ")}. Your ticket pass unlocks immediately upon server
                    confirmation.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <Button variant="outline" size="sm" onClick={refreshNow} className="gap-1.5">
                    <RefreshCw className="size-3.5" /> Check Status Now
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    loading={verifyingSandbox}
                    onClick={simulateSandboxPayment}
                    className="gap-1.5"
                  >
                    <Check className="size-3.5" /> Confirm Sandbox Payment
                  </Button>
                </div>
              </>
            )}

            {/* CTAs */}
            <div className="flex flex-wrap justify-center gap-3 border-t border-line/80 pt-6">
              <Link
                href="/portal?tab=wallet"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-btn bg-brand-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 active:scale-95"
              >
                <Ticket className="size-4" /> Go to My Tickets
              </Link>
              <Link
                href="/events"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-btn border border-line bg-surface px-6 text-sm font-semibold text-ink shadow-sm transition hover:bg-canvas-alt active:scale-95"
              >
                Browse More Events
              </Link>
            </div>
          </Card>
        )}

        {/* BOTTOM NAVIGATION ACTIONS */}
        {step < 5 && (
          <div className="flex items-center justify-between gap-3 pt-2">
            {step > 1 ? (
              <Button
                variant="outline"
                disabled={submitting}
                onClick={() => {
                  setError(null);
                  setStep(step - 1);
                }}
                className="gap-1.5"
              >
                <ArrowLeft className="size-4" /> Back
              </Button>
            ) : (
              <Link
                href={`/events/${event.slug}`}
                className="inline-flex h-11 items-center gap-1.5 rounded-btn border border-line bg-surface px-4 text-sm font-semibold text-ink transition hover:bg-canvas-alt"
              >
                <ArrowLeft className="size-4" /> Back to Event
              </Link>
            )}

            {step < 4 ? (
              <Button onClick={next} className="gap-1.5">
                Continue <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button loading={submitting} onClick={submit} className="gap-2">
                {isFree ? (
                  <>
                    <CheckCircle2 className="size-4" /> Confirm Free Registration
                  </>
                ) : (
                  <>
                    <Lock className="size-4" /> Pay {formatBDT(totals?.totalMinor ?? 0)}
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* RIGHT RAIL ORDER SUMMARY */}
      <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Order Summary Sidebar">
        {summary}
      </aside>
    </div>
  );
}
